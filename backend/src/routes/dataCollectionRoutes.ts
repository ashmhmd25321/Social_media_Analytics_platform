import express from 'express';
import { dataCollectionController } from '../controllers/dataCollectionController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Collect data for a specific account
router.post('/collect/:accountId', dataCollectionController.collectAccountData.bind(dataCollectionController));

// Get collection jobs for an account
router.get('/jobs/:accountId', dataCollectionController.getCollectionJobs.bind(dataCollectionController));

// Get posts for a specific account
router.get('/posts/:accountId', dataCollectionController.getAccountPosts.bind(dataCollectionController));

// Get follower metrics for an account
router.get('/followers/:accountId', dataCollectionController.getFollowerMetrics.bind(dataCollectionController));

// Get all user's posts
router.get('/posts', dataCollectionController.getUserPosts.bind(dataCollectionController));

export default router;

