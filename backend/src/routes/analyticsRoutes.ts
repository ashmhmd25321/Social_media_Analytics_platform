import { Router } from 'express';
import { analyticsController } from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';
import { cacheMiddleware } from '../middleware/cache';

const router = Router();

// All analytics routes require authentication
router.use(authenticate);

// Generate PDF report (no cache for file downloads - must be before cache middleware)
router.get('/generate-pdf', (req, res) => analyticsController.generatePDF(req, res));

// Apply caching to GET routes (5 minutes TTL)
router.use(cacheMiddleware(5 * 60 * 1000));

// Overview metrics
router.get('/overview', (req, res) => analyticsController.getOverview(req, res));

// Follower trends
router.get('/followers/trends', (req, res) => analyticsController.getFollowerTrends(req, res));

// Engagement trends
router.get('/engagement/trends', (req, res) => analyticsController.getEngagementTrends(req, res));

// Engagement metrics
router.get('/engagement/metrics', (req, res) => analyticsController.getEngagementMetrics(req, res));

// Top posts
router.get('/posts/top', (req, res) => analyticsController.getTopPosts(req, res));

// Content performance
router.get('/content/performance', (req, res) => analyticsController.getContentPerformance(req, res));

// Content type breakdown
router.get('/content/types', (req, res) => analyticsController.getContentTypeBreakdown(req, res));

// Platform comparison
router.get('/platforms/comparison', (req, res) => analyticsController.getPlatformComparison(req, res));

// Audience analytics
router.get('/audience', (req, res) => analyticsController.getAudienceMetrics(req, res));

// Content analytics
router.get('/content/types', (req, res) => analyticsController.getContentTypeBreakdown(req, res));

export default router;

