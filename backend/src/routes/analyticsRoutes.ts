import { Router } from 'express';
import { analyticsController } from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All analytics routes require authentication
router.use(authenticate);

// Overview metrics
router.get('/overview', (req, res) => analyticsController.getOverview(req, res));

// Follower trends
router.get('/followers/trends', (req, res) => analyticsController.getFollowerTrends(req, res));

// Engagement trends
router.get('/engagement/trends', (req, res) => analyticsController.getEngagementTrends(req, res));

// Top posts
router.get('/posts/top', (req, res) => analyticsController.getTopPosts(req, res));

// Platform comparison
router.get('/platforms/comparison', (req, res) => analyticsController.getPlatformComparison(req, res));

export default router;

