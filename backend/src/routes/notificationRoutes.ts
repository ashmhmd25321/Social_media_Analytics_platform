import { Router } from 'express';
import { notificationController } from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get notifications
router.get('/', (req, res) => notificationController.getNotifications(req as any, res));

// Get unread count
router.get('/unread-count', (req, res) => notificationController.getUnreadCount(req as any, res));

// Mark as read
router.put('/:id/read', (req, res) => notificationController.markAsRead(req as any, res));

// Mark all as read
router.put('/read-all', (req, res) => notificationController.markAllAsRead(req as any, res));

// Delete notification
router.delete('/:id', (req, res) => notificationController.deleteNotification(req as any, res));

// Check reminders (can be called by scheduler)
router.post('/check-reminders', (req, res) => notificationController.checkReminders(req, res));

export default router;

