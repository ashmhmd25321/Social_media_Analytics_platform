import { Request, Response } from 'express';
import { analyticsService } from '../services/AnalyticsService';

export class AnalyticsController {
  /**
   * Get overview metrics
   * GET /api/analytics/overview
   */
  async getOverview(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const metrics = await analyticsService.getOverviewMetrics(userId);
      res.json({ success: true, data: metrics });
    } catch (error) {
      console.error('Error fetching overview metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch overview metrics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get follower trends
   * GET /api/analytics/followers/trends?days=30
   */
  async getFollowerTrends(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const days = parseInt(req.query.days as string) || 30;
      const trends = await analyticsService.getFollowerTrends(userId, days);
      res.json({ success: true, data: trends });
    } catch (error) {
      console.error('Error fetching follower trends:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch follower trends',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get engagement trends
   * GET /api/analytics/engagement/trends?days=30
   */
  async getEngagementTrends(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const days = parseInt(req.query.days as string) || 30;
      const trends = await analyticsService.getEngagementTrends(userId, days);
      res.json({ success: true, data: trends });
    } catch (error) {
      console.error('Error fetching engagement trends:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch engagement trends',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get top performing posts
   * GET /api/analytics/posts/top?limit=10
   */
  async getTopPosts(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const posts = await analyticsService.getTopPosts(userId, limit);
      res.json({ success: true, data: posts });
    } catch (error) {
      console.error('Error fetching top posts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch top posts',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get platform comparison
   * GET /api/analytics/platforms/comparison
   */
  async getPlatformComparison(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const comparison = await analyticsService.getPlatformComparison(userId);
      res.json({ success: true, data: comparison });
    } catch (error) {
      console.error('Error fetching platform comparison:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch platform comparison',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const analyticsController = new AnalyticsController();

