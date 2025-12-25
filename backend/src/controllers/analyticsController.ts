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
   * Get posts published over time (by actual post dates)
   * GET /api/analytics/posts/over-time?days=30
   */
  async getPostsOverTime(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const days = parseInt(req.query.days as string) || 30;
      const postsOverTime = await analyticsService.getPostsOverTime(userId, days);
      res.json({ success: true, data: postsOverTime });
    } catch (error) {
      console.error('Error fetching posts over time:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch posts over time',
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
    let filePath: string | null = null;
    
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      console.log(`[PDF Generation] Starting PDF generation for user ${userId}`);
      const { analyticsPDFService } = await import('../services/AnalyticsPDFService');
      const { filePath: generatedFilePath, fileSize } = await analyticsPDFService.generateAnalyticsPDF(userId);

      // Send the PDF file
      const fullPath = path.join(process.cwd(), generatedFilePath.replace(/^\//, ''));
      filePath = fullPath;
      
      // Verify file exists before sending
      if (!fs.existsSync(fullPath)) {
        throw new Error('PDF file was not created');
      }

      console.log(`[PDF Generation] PDF created successfully: ${fullPath} (${fileSize} bytes)`);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="analytics_report_${Date.now()}.pdf"`);
      res.setHeader('Content-Length', fileSize.toString());
      
      const fileStream = fs.createReadStream(fullPath);
      
      fileStream.on('error', (streamError) => {
        console.error('[PDF Generation] Stream error:', streamError);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error streaming PDF file',
            error: streamError.message,
          });
        }
      });
      
      fileStream.pipe(res);
      
      fileStream.on('end', () => {
        console.log(`[PDF Generation] PDF sent successfully, scheduling cleanup for ${fullPath}`);
        // Clean up file after sending
        setTimeout(() => {
          try {
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
              console.log(`[PDF Generation] Cleaned up PDF file: ${fullPath}`);
            }
          } catch (error) {
            console.error('[PDF Generation] Error deleting PDF file:', error);
          }
        }, 5000); // Delete after 5 seconds
      });
    } catch (error) {
      console.error('[PDF Generation] Error generating PDF:', error);
      
      // Clean up file if it exists but there was an error
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (unlinkError) {
          console.error('[PDF Generation] Error cleaning up failed PDF file:', unlinkError);
        }
      }
      
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Failed to generate PDF report',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }
}

export const analyticsController = new AnalyticsController();

