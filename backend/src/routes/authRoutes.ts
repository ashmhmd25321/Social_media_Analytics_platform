import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import {
  validateRegister,
  validateLogin,
  validatePasswordResetRequest,
  validatePasswordReset,
} from '../middleware/validation';
import { authRateLimiter } from '../middleware/rateLimiter';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.post(
  '/register',
  authRateLimiter,
  validateRegister,
  AuthController.register
);

router.post(
  '/login',
  authRateLimiter,
  validateLogin,
  AuthController.login
);

router.post(
  '/verify-email',
  AuthController.verifyEmail
);

router.post(
  '/forgot-password',
  authRateLimiter,
  validatePasswordResetRequest,
  AuthController.requestPasswordReset
);

router.post(
  '/reset-password',
  validatePasswordReset,
  AuthController.resetPassword
);

router.post(
  '/refresh-token',
  AuthController.refreshToken
);

// Protected routes
router.get(
  '/me',
  authenticate,
  AuthController.getProfile
);

export default router;

