import { Request, Response } from 'express';
import { notificationModel } from '../models/Notification';
import { notificationService } from '../services/NotificationService';
import { AuthRequest } from '../middleware/auth';

type AuthenticatedRequest = AuthRequest;

export class NotificationController {
  /**
   * Get all notifications for the authenticated user
   * GET /api/notifications
   */
  async getNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const unreadOnly = req.query.unreadOnly === 'true';
      const type = req.query.type as any;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      const notifications = await notificationModel.findByUser(userId, {
        unreadOnly,
        type,
        limit,
        offset,
      });

      res.json({
        success: true,
        data: notifications,
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({
        error: 'Failed to fetch notifications',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get unread notification count
   * GET /api/notifications/unread-count
   */
  async getUnreadCount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const count = await notificationModel.getUnreadCount(userId);

      res.json({
        success: true,
        count,
      });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({
        error: 'Failed to fetch unread count',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Mark a notification as read
   * PUT /api/notifications/:id/read
   */
  async markAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        res.status(400).json({ error: 'Invalid notification ID' });
        return;
      }

      const success = await notificationModel.markAsRead(notificationId, userId);

      if (!success) {
        res.status(404).json({ error: 'Notification not found' });
        return;
      }

      res.json({
        success: true,
        message: 'Notification marked as read',
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({
        error: 'Failed to mark notification as read',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Mark all notifications as read
   * PUT /api/notifications/read-all
   */
  async markAllAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const count = await notificationModel.markAllAsRead(userId);

      res.json({
        success: true,
        message: 'All notifications marked as read',
        count,
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({
        error: 'Failed to mark all notifications as read',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Delete a notification
   * DELETE /api/notifications/:id
   */
  async deleteNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        res.status(400).json({ error: 'Invalid notification ID' });
        return;
      }

      const success = await notificationModel.delete(notificationId, userId);

      if (!success) {
        res.status(404).json({ error: 'Notification not found' });
        return;
      }

      res.json({
        success: true,
        message: 'Notification deleted',
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({
        error: 'Failed to delete notification',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Check and create reminders (admin/internal endpoint)
   * POST /api/notifications/check-reminders
   */
  async checkReminders(req: Request, res: Response): Promise<void> {
    try {
      await notificationService.checkAllReminders();

      res.json({
        success: true,
        message: 'Reminder check completed',
      });
    } catch (error) {
      console.error('Error checking reminders:', error);
      res.status(500).json({
        error: 'Failed to check reminders',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const notificationController = new NotificationController();

