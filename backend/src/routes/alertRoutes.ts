import { Router } from 'express';
import { alertController } from '../controllers/alertController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Alerts
router.post('/', (req, res) => alertController.createAlert(req, res));
router.get('/', (req, res) => alertController.getAlerts(req, res));
router.put('/:id', (req, res) => alertController.updateAlert(req, res));
router.delete('/:id', (req, res) => alertController.deleteAlert(req, res));

// Notifications
router.get('/notifications', (req, res) => alertController.getNotifications(req, res));
router.post('/notifications/:id/read', (req, res) => alertController.markNotificationAsRead(req, res));
router.post('/notifications/read-all', (req, res) => alertController.markAllNotificationsAsRead(req, res));
router.get('/notifications/unread-count', (req, res) => alertController.getUnreadCount(req, res));

export default router;

