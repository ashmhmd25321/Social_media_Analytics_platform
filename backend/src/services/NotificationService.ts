import { notificationModel } from '../models/Notification';
import { contentDraftModel } from '../models/Content';
import { campaignModel } from '../models/Campaign';
import { pool } from '../config/database';

export class NotificationService {
  /**
   * Create a reminder notification for content
   */
  async createContentReminder(
    userId: number,
    contentId: number,
    title: string,
    scheduledAt: Date,
    reminderDaysBefore: number = 1
  ): Promise<number> {
    const reminderDate = new Date(scheduledAt);
    reminderDate.setDate(reminderDate.getDate() - reminderDaysBefore);

    // Delete any existing reminders for this content
    await notificationModel.deleteByEntity('content', contentId);

    return await notificationModel.create({
      user_id: userId,
      type: 'content_reminder',
      title: `Content Reminder: ${title}`,
      message: `Your content "${title}" is scheduled for ${scheduledAt.toLocaleDateString()}. Don't forget to review it!`,
      entity_type: 'content',
      entity_id: contentId,
      is_read: false,
      reminder_date: reminderDate,
    });
  }

  /**
   * Create a reminder notification for campaign
   */
  async createCampaignReminder(
    userId: number,
    campaignId: number,
    campaignName: string,
    startDate: Date,
    reminderDaysBefore: number = 1
  ): Promise<number> {
    const reminderDate = new Date(startDate);
    reminderDate.setDate(reminderDate.getDate() - reminderDaysBefore);

    // Delete any existing reminders for this campaign
    await notificationModel.deleteByEntity('campaign', campaignId);

    return await notificationModel.create({
      user_id: userId,
      type: 'campaign_reminder',
      title: `Campaign Reminder: ${campaignName}`,
      message: `Your campaign "${campaignName}" starts on ${startDate.toLocaleDateString()}. Make sure everything is ready!`,
      entity_type: 'campaign',
      entity_id: campaignId,
      is_read: false,
      reminder_date: reminderDate,
    });
  }

  /**
   * Check and create reminders for upcoming content
   */
  async checkUpcomingContent(): Promise<void> {
    try {
      // Get all scheduled content that needs reminders
      const [rows] = await pool.execute<any[]>(
        `SELECT id, user_id, title, scheduled_at, reminder_days_before 
         FROM content_drafts 
         WHERE status = 'scheduled' 
         AND scheduled_at IS NOT NULL 
         AND reminder_days_before IS NOT NULL
         AND scheduled_at > NOW()`
      );

      for (const content of rows) {
        const scheduledAt = new Date(content.scheduled_at);
        const reminderDate = new Date(scheduledAt);
        reminderDate.setDate(reminderDate.getDate() - (content.reminder_days_before || 1));

        // Check if reminder date is today or in the past (but scheduled date is in the future)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        reminderDate.setHours(0, 0, 0, 0);

        if (reminderDate <= today && scheduledAt > new Date()) {
          // Check if notification already exists
          const existing = await notificationModel.findByUser(content.user_id, {
            type: 'content_reminder',
          });

          const hasExisting = existing.some(
            n => n.entity_type === 'content' && n.entity_id === content.id
          );

          if (!hasExisting) {
            await this.createContentReminder(
              content.user_id,
              content.id,
              content.title || 'Untitled Content',
              scheduledAt,
              content.reminder_days_before || 1
            );
          }
        }
      }
    } catch (error) {
      console.error('Error checking upcoming content:', error);
    }
  }

  /**
   * Check and create reminders for upcoming campaigns
   */
  async checkUpcomingCampaigns(): Promise<void> {
    try {
      // Get all active/draft campaigns that need reminders
      const [rows] = await pool.execute<any[]>(
        `SELECT id, user_id, name, start_date, reminder_days_before 
         FROM campaigns 
         WHERE status IN ('draft', 'active') 
         AND start_date IS NOT NULL 
         AND reminder_days_before IS NOT NULL
         AND start_date > CURDATE()`
      );

      for (const campaign of rows) {
        const startDate = new Date(campaign.start_date);
        const reminderDate = new Date(startDate);
        reminderDate.setDate(reminderDate.getDate() - (campaign.reminder_days_before || 1));

        // Check if reminder date is today or in the past (but start date is in the future)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        reminderDate.setHours(0, 0, 0, 0);

        if (reminderDate <= today && startDate > new Date()) {
          // Check if notification already exists
          const existing = await notificationModel.findByUser(campaign.user_id, {
            type: 'campaign_reminder',
          });

          const hasExisting = existing.some(
            n => n.entity_type === 'campaign' && n.entity_id === campaign.id
          );

          if (!hasExisting) {
            await this.createCampaignReminder(
              campaign.user_id,
              campaign.id,
              campaign.name,
              startDate,
              campaign.reminder_days_before || 1
            );
          }
        }
      }
    } catch (error) {
      console.error('Error checking upcoming campaigns:', error);
    }
  }

  /**
   * Run all reminder checks
   */
  async checkAllReminders(): Promise<void> {
    await Promise.all([
      this.checkUpcomingContent(),
      this.checkUpcomingCampaigns(),
    ]);
  }
}

export const notificationService = new NotificationService();

