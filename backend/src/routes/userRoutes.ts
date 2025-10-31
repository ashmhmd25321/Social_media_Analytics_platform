import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/preferences', UserController.getPreferences);
router.put('/preferences', UserController.updatePreferences);
router.put('/profile', UserController.updateProfile);

export default router;

