import { Router } from 'express';
import {
  getPlatforms,
  initiateOAuth,
  handleOAuthCallback,
  getConnectedAccounts,
  disconnectAccount,
  connectFacebookWithToken,
  connectInstagramWithToken,
} from '../controllers/socialController';
import { authenticate as authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/platforms', getPlatforms);

// Protected routes
router.get('/accounts', authenticateToken, getConnectedAccounts);
router.post('/connect/:platformName', authenticateToken, initiateOAuth);
router.post('/connect/facebook/token', authenticateToken, connectFacebookWithToken);
router.post('/connect/instagram/token', authenticateToken, connectInstagramWithToken);
router.get('/callback/:platformName', handleOAuthCallback);
router.delete('/disconnect/:accountId', authenticateToken, disconnectAccount);

export default router;

