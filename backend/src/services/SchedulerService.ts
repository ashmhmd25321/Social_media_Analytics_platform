import * as cron from 'node-cron';
import { RowDataPacket } from 'mysql2/promise';
import { UserSocialAccountModelInstance } from '../models/SocialPlatform';
import { dataCollectionService } from './DataCollectionService';
import { dataCollectionJobModel } from '../models/DataCollection';
import { postPublishingService } from './PostPublishingService';
import { alertService } from './AlertService';
import { scheduledReportService } from './ScheduledReportService';
import { pool } from '../config/database';

interface ScheduledJob {
  task: cron.ScheduledTask;
  accountId: number;
  schedule: string;
}

class SchedulerService {
  private jobs: Map<number, ScheduledJob> = new Map();
  private isRunning = false;

  /**
   * Start the scheduler service
   */
  start(): void {
    if (this.isRunning) {
      console.log('Scheduler is already running');
      return;
    }

    this.isRunning = true;
    console.log('🕐 Scheduler service started');

    // Schedule daily sync for all active accounts at 2 AM
    this.scheduleDailySync();

    // Schedule hourly incremental sync for active accounts
    this.scheduleHourlySync();

    // Schedule post publishing (every minute)
    this.schedulePostPublishing();

    // Schedule alert checking (every 5 minutes)
    this.scheduleAlertChecking();

    // Schedule report generation (every hour)
    this.scheduleReportGeneration();
  }

  /**
   * Stop the scheduler service
   */
  stop(): void {
    this.jobs.forEach((job) => {
      job.task.stop();
    });
    this.jobs.clear();
    this.isRunning = false;
    console.log('Scheduler service stopped');
  }

  /**
   * Schedule a data collection job for a specific account
   */
  scheduleAccountSync(
    accountId: number,
    schedule: string = '0 2 * * *' // Default: daily at 2 AM
  ): void {
    // Remove existing job if any
    this.unscheduleAccountSync(accountId);

    const task = cron.schedule(schedule, async () => {
      try {
        console.log(`🔄 Running scheduled sync for account ${accountId}`);
        await this.syncAccount(accountId, 'scheduled_sync');
      } catch (error) {
        console.error(`Error in scheduled sync for account ${accountId}:`, error);
      }
    });

    this.jobs.set(accountId, { task, accountId, schedule });
    console.log(`✅ Scheduled sync for account ${accountId} with schedule: ${schedule}`);
  }

  /**
   * Unschedule a specific account
   */
  unscheduleAccountSync(accountId: number): void {
    const job = this.jobs.get(accountId);
    if (job) {
      job.task.stop();
      this.jobs.delete(accountId);
      console.log(`❌ Unscheduled sync for account ${accountId}`);
    }
  }

  /**
   * Schedule daily full sync (2 AM daily)
   */
  private scheduleDailySync(): void {
    cron.schedule('0 2 * * *', async () => {
      try {
        console.log('🔄 Running daily full sync for all accounts');
        await this.syncAllAccounts('full_sync');
      } catch (error) {
        console.error('Error in daily sync:', error);
      }
    });
    console.log('✅ Daily full sync scheduled (2 AM daily)');
  }

  /**
   * Schedule hourly incremental sync
   */
  private scheduleHourlySync(): void {
    cron.schedule('0 * * * *', async () => {
      try {
        console.log('🔄 Running hourly incremental sync');
        await this.syncAllAccounts('incremental_sync');
      } catch (error) {
        console.error('Error in hourly sync:', error);
      }
    });
    console.log('✅ Hourly incremental sync scheduled');
  }

  /**
   * Schedule post publishing (runs every minute)
   */
  private schedulePostPublishing(): void {
    cron.schedule('* * * * *', async () => {
      try {
        await postPublishingService.processPendingPosts();
      } catch (error) {
        console.error('Error in post publishing:', error);
      }
    });
    console.log('✅ Post publishing scheduled (every minute)');
  }

  /**
   * Schedule alert checking (runs every 5 minutes)
   */
  private scheduleAlertChecking(): void {
    cron.schedule('*/5 * * * *', async () => {
      try {
        // Get all users with active alerts and check them
        const [users] = await pool.execute<RowDataPacket[]>(
          'SELECT DISTINCT user_id FROM alerts WHERE is_active = TRUE'
        );
        
        for (const user of users) {
          await alertService.checkAlerts(user.user_id).catch(err => {
            console.error(`Error checking alerts for user ${user.user_id}:`, err);
          });
        }
      } catch (error) {
        console.error('Error in alert checking:', error);
      }
    });
    console.log('✅ Alert checking scheduled (every 5 minutes)');
  }

  /**
   * Schedule scheduled report generation (runs every hour)
   */
  private scheduleReportGeneration(): void {
    cron.schedule('0 * * * *', async () => {
      try {
        await scheduledReportService.processDueReports();
      } catch (error) {
        console.error('Error in scheduled report generation:', error);
      }
    });
    console.log('✅ Scheduled report generation scheduled (every hour)');
  }

  /**
   * Sync a specific account
   */
  private async syncAccount(
    accountId: number,
    jobType: 'full_sync' | 'incremental_sync' | 'manual_sync' | 'scheduled_sync'
  ): Promise<void> {
    try {
      const account = await UserSocialAccountModelInstance.findById(accountId);
      
      if (!account) {
        console.error(`Account ${accountId} not found`);
        return;
      }

      if (account.account_status !== 'connected' || !account.is_active) {
        console.log(`Account ${accountId} is not active, skipping sync`);
        return;
      }

      const options = {
        limit: jobType === 'incremental_sync' ? 50 : undefined,
        since: jobType === 'incremental_sync' && account.last_synced_at 
          ? new Date(account.last_synced_at) 
          : undefined,
      };

      await dataCollectionService.collectAccountData(account, options);
      console.log(`✅ Successfully synced account ${accountId}`);
    } catch (error) {
      console.error(`❌ Error syncing account ${accountId}:`, error);
      throw error;
    }
  }

  /**
   * Sync all active accounts
   */
  private async syncAllAccounts(
    jobType: 'full_sync' | 'incremental_sync'
  ): Promise<void> {
    try {
      // Get all active accounts (this would ideally be paginated)
      // For now, we'll need to get them by user, but we need a way to get all accounts
      // Let's create a method to get all active accounts
      const accounts = await this.getAllActiveAccounts();
      
      console.log(`📊 Found ${accounts.length} active accounts to sync`);

      // Sync accounts in parallel (with concurrency limit)
      const concurrency = 3; // Process 3 accounts at a time
      for (let i = 0; i < accounts.length; i += concurrency) {
        const batch = accounts.slice(i, i + concurrency);
        await Promise.all(
          batch.map(account => 
            this.syncAccount(account.id!, jobType).catch(err => {
              console.error(`Failed to sync account ${account.id}:`, err);
            })
          )
        );
      }

      console.log(`✅ Completed ${jobType} for all accounts`);
    } catch (error) {
      console.error(`Error in ${jobType}:`, error);
      throw error;
    }
  }

  /**
   * Get all active accounts (helper method)
   * Note: This is a simplified version. In production, you'd want pagination
   */
  private async getAllActiveAccounts(): Promise<any[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT usa.*, sp.name as platform_name
       FROM user_social_accounts usa
       JOIN social_platforms sp ON usa.platform_id = sp.id
       WHERE usa.is_active = TRUE AND usa.account_status = 'connected'
       ORDER BY usa.last_synced_at ASC`
    );
    
    return rows as any[];
  }
}

export const schedulerService = new SchedulerService();

