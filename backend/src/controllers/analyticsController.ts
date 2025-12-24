import { Request, Response } from 'express';
import { analyticsService } from '../services/AnalyticsService';
import * as fs from 'fs';
import * as path from 'path';

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
   * GET /api/analytics/followers/trends?view=day|month|year
   * Returns daily follower additions (new followers per period), not cumulative counts
   */
  async getFollowerTrends(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const view = (req.query.view as string) || 'day';
      const validViews = ['day', 'month', 'year'];
      const selectedView = validViews.includes(view) ? (view as 'day' | 'month' | 'year') : 'day';
      
      const trends = await analyticsService.getFollowerTrends(userId, selectedView);
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
   * Get engagement metrics
   * GET /api/analytics/engagement/metrics?days=30
   */
  async getEngagementMetrics(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const days = parseInt(req.query.days as string) || 30;
      const metrics = await analyticsService.getEngagementMetrics(userId, days);
      res.json({ success: true, data: metrics });
    } catch (error) {
      console.error('Error fetching engagement metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch engagement metrics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get top performing posts
   * GET /api/analytics/posts/top?limit=10&days=30
   */
  async getTopPosts(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const days = req.query.days ? parseInt(req.query.days as string) : undefined;
      const posts = await analyticsService.getTopPosts(userId, limit, days);
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

  /**
   * Get audience analytics
   * GET /api/analytics/audience?days=30
   */
  async getAudienceMetrics(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const days = parseInt(req.query.days as string) || 30;
      const metrics = await analyticsService.getAudienceMetrics(userId, days);
      res.json({ success: true, data: metrics });
    } catch (error) {
      console.error('Error fetching audience metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audience metrics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get content type breakdown
   * GET /api/analytics/content/types
   */
  async getContentTypeBreakdown(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const breakdown = await analyticsService.getContentTypeBreakdown(userId);
      res.json({ success: true, data: breakdown });
    } catch (error) {
      console.error('Error fetching content type breakdown:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch content type breakdown',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get content performance metrics
   * GET /api/analytics/content/performance?days=30
   */
  async getContentPerformance(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const days = parseInt(req.query.days as string) || 30;
      const performance = await analyticsService.getContentPerformance(userId, days);
      res.json({ success: true, data: performance });
    } catch (error) {
      console.error('Error fetching content performance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch content performance',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Generate comprehensive analytics PDF
   * GET /api/analytics/generate-pdf
   */
  async generatePDF(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { analyticsPDFService } = await import('../services/AnalyticsPDFService');
      const { filePath, fileSize } = await analyticsPDFService.generateAnalyticsPDF(userId);

      // Send the PDF file
      const fullPath = path.join(process.cwd(), filePath.replace(/^\//, ''));
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="analytics_report_${Date.now()}.pdf"`);
      res.setHeader('Content-Length', fileSize.toString());
      
      const fileStream = fs.createReadStream(fullPath);
      fileStream.pipe(res);
      
      fileStream.on('end', () => {
        // Clean up file after sending
        setTimeout(() => {
          try {
            fs.unlinkSync(fullPath);
          } catch (error) {
            console.error('Error deleting PDF file:', error);
          }
        }, 5000); // Delete after 5 seconds
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate PDF report',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Generate comprehensive analytics PDF
   * GET /api/analytics/generate-pdf
   */
  async generatePDF(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { analyticsPDFService } = await import('../services/AnalyticsPDFService');
      const { filePath, fileSize } = await analyticsPDFService.generateAnalyticsPDF(userId);

      // Send the PDF file
      const fullPath = path.join(process.cwd(), filePath.replace(/^\//, ''));
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="analytics_report_${Date.now()}.pdf"`);
      res.setHeader('Content-Length', fileSize.toString());
      
      const fileStream = fs.createReadStream(fullPath);
      fileStream.pipe(res);
      
      fileStream.on('end', () => {
        // Clean up file after sending
        setTimeout(() => {
          try {
            fs.unlinkSync(fullPath);
          } catch (error) {
            console.error('Error deleting PDF file:', error);
          }
        }, 5000); // Delete after 5 seconds
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate PDF report',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const analyticsController = new AnalyticsController();

