import { Request, Response } from 'express';
import { alertService } from '../services/AlertService';
import { notificationModel } from '../models/Report';

export class AlertController {
  /**
   * Create an alert
   * POST /api/alerts
   */
  async createAlert(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const alertId = await alertService.createAlert({
        user_id: userId,
        ...req.body,
      });

      res.status(201).json({
        success: true,
        message: 'Alert created successfully',
        data: { id: alertId },
      });
    } catch (error) {
      console.error('Error creating alert:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create alert',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get all alerts for a user
   * GET /api/alerts?isActive=true
   */
  async getAlerts(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
      const alerts = await alertService.getUserAlerts(userId, isActive);

      res.json({ success: true, data: alerts });
    } catch (error) {
      console.error('Error fetching alerts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch alerts',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Update an alert
   * PUT /api/alerts/:id
   */
  async updateAlert(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const id = parseInt(req.params.id);
      const updated = await alertService.updateAlert(id, userId, req.body);

      if (!updated) {
        res.status(404).json({ success: false, message: 'Alert not found' });
        return;
      }

      res.json({ success: true, message: 'Alert updated successfully' });
    } catch (error) {
      console.error('Error updating alert:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update alert',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Delete an alert
   * DELETE /api/alerts/:id
   */
  async deleteAlert(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const id = parseInt(req.params.id);
      const deleted = await alertService.deleteAlert(id, userId);

      if (!deleted) {
        res.status(404).json({ success: false, message: 'Alert not found' });
        return;
      }

      res.json({ success: true, message: 'Alert deleted successfully' });
    } catch (error) {
      console.error('Error deleting alert:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete alert',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get notifications for a user
   * GET /api/notifications?isRead=false&limit=50
   */
  async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const isRead = req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined;
      const limit = parseInt(req.query.limit as string) || 50;
      const notifications = await notificationModel.findByUser(userId, isRead, limit);

      res.json({ success: true, data: notifications });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notifications',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Mark notification as read
   * POST /api/notifications/:id/read
   */
  async markNotificationAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const id = parseInt(req.params.id);
      const marked = await notificationModel.markAsRead(id, userId);

      if (!marked) {
        res.status(404).json({ success: false, message: 'Notification not found' });
        return;
      }

      res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Mark all notifications as read
   * POST /api/notifications/read-all
   */
  async markAllNotificationsAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      await notificationModel.markAllAsRead(userId);

      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark all notifications as read',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get unread notification count
   * GET /api/notifications/unread-count
   */
  async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const count = await notificationModel.getUnreadCount(userId);

      res.json({ success: true, data: { count } });
    } catch (error) {
      console.error('Error getting unread count:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get unread count',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const alertController = new AlertController();

