import { Request, Response } from 'express';
import { dataCollectionService } from '../services/DataCollectionService';
import { UserSocialAccountModelInstance, UserSocialAccount } from '../models/SocialPlatform';
import { postModel, engagementMetricsModel, followerMetricsModel } from '../models/Post';
import { dataCollectionJobModel } from '../models/DataCollection';
import { authenticate } from '../middleware/auth';

export class DataCollectionController {
  /**
   * Sync data for a specific account
   * POST /api/data/collect/:accountId
   */
  async collectAccountData(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const accountId = parseInt(req.params.accountId);
      if (isNaN(accountId)) {
        res.status(400).json({ error: 'Invalid account ID' });
        return;
      }

      // Get account details
      const account = await UserSocialAccountModelInstance.findById(accountId);

      if (!account) {
        res.status(404).json({ error: 'Account not found' });
        return;
      }

      // Verify account belongs to user
      if (account.user_id !== userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      // Check if account is active
      if (account.account_status !== 'connected' || !account.is_active) {
        res.status(400).json({ error: 'Account is not connected or active' });
        return;
      }

      // Collect data
      const options = {
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        since: req.query.since ? new Date(req.query.since as string) : undefined,
      };

      // The findById query includes platform_name and platform_type from the JOIN
      const accountWithPlatform = account as UserSocialAccount & { platform_name?: string; platform_type?: string };
      const platformType = accountWithPlatform.platform_type || accountWithPlatform.platform_name || 'unknown';
      
      console.log(`[Data Collection] Starting sync for account ${accountId} (${platformType} platform)`);
      console.log(`[Data Collection] Account details:`, {
        platform_account_id: account.platform_account_id,
        platform_username: account.platform_username,
        has_access_token: !!account.access_token,
      });

      const data = await dataCollectionService.collectAccountData(account, options);

      console.log(`[Data Collection] Sync completed for account ${accountId}:`, {
        posts_collected: data.posts.length,
        engagement_metrics: data.engagementMetrics.size,
        follower_metrics: data.followerMetrics ? 1 : 0,
      });

      res.json({
        success: true,
        message: 'Data collection completed',
        data: {
          posts_collected: data.posts.length,
          engagement_metrics_collected: data.engagementMetrics.size,
          follower_metrics_collected: data.followerMetrics ? 1 : 0,
        },
      });
    } catch (error) {
      console.error('[Data Collection] Error collecting account data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Data Collection] Error details:', {
        accountId: req.params.accountId,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        success: false,
        error: 'Failed to collect data',
        message: errorMessage,
      });
    }
  }

  /**
   * Get collection jobs for an account
   * GET /api/data/jobs/:accountId
   */
  async getCollectionJobs(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const accountId = parseInt(req.params.accountId);
      if (isNaN(accountId)) {
        res.status(400).json({ error: 'Invalid account ID' });
        return;
      }

      // Verify account belongs to user
      const account = await UserSocialAccountModelInstance.findById(accountId);

      if (!account || account.user_id !== userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const jobs = await dataCollectionJobModel.findByAccount(accountId, limit);

      res.json({
        success: true,
        jobs,
      });
    } catch (error) {
      console.error('Error fetching collection jobs:', error);
      res.status(500).json({
        error: 'Failed to fetch collection jobs',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get posts for an account
   * GET /api/data/posts/:accountId
   */
  async getAccountPosts(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const accountId = parseInt(req.params.accountId);
      if (isNaN(accountId)) {
        res.status(400).json({ error: 'Invalid account ID' });
        return;
      }

      // Verify account belongs to user
      const account = await UserSocialAccountModelInstance.findById(accountId);

      if (!account || account.user_id !== userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      const posts = await postModel.findByAccount(accountId, limit, offset);

      // Get engagement metrics for each post
      const postsWithMetrics = await Promise.all(
        posts.map(async (post) => {
          const metrics = await engagementMetricsModel.findByPostId(post.id!);
          return {
            ...post,
            engagement_metrics: metrics,
          };
        })
      );

      res.json({
        success: true,
        posts: postsWithMetrics,
        total: posts.length,
      });
    } catch (error) {
      console.error('Error fetching posts:', error);
      res.status(500).json({
        error: 'Failed to fetch posts',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get follower metrics for an account
   * GET /api/data/followers/:accountId
   */
  async getFollowerMetrics(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const accountId = parseInt(req.params.accountId);
      if (isNaN(accountId)) {
        res.status(400).json({ error: 'Invalid account ID' });
        return;
      }

      // Verify account belongs to user
      const account = await UserSocialAccountModelInstance.findById(accountId);

      if (!account || account.user_id !== userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const metrics = await followerMetricsModel.findByAccountId(accountId);

      res.json({
        success: true,
        metrics: metrics || {
          account_id: accountId,
          follower_count: 0,
          following_count: 0,
          posts_count: 0,
        },
      });
    } catch (error) {
      console.error('Error fetching follower metrics:', error);
      res.status(500).json({
        error: 'Failed to fetch follower metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get all user's posts across all accounts
   * GET /api/data/posts
   */
  async getUserPosts(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      const posts = await postModel.findByUser(userId, limit, offset);

      // Get engagement metrics for each post
      const postsWithMetrics = await Promise.all(
        posts.map(async (post) => {
          const metrics = await engagementMetricsModel.findByPostId(post.id!);
          return {
            ...post,
            engagement_metrics: metrics,
          };
        })
      );

      res.json({
        success: true,
        posts: postsWithMetrics,
        total: posts.length,
      });
    } catch (error) {
      console.error('Error fetching user posts:', error);
      res.status(500).json({
        error: 'Failed to fetch posts',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const dataCollectionController = new DataCollectionController();

