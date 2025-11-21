import { Request, Response } from 'express';
import { insightsService } from '../services/InsightsService';

export class InsightsController {
  /**
   * Get insights for a user
   * GET /api/insights?limit=20
   */
  async getInsights(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const insights = await insightsService.getUserInsights(userId, limit);

      res.json({ success: true, data: insights });
    } catch (error) {
      console.error('Error fetching insights:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch insights',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Generate insights for a user
   * POST /api/insights/generate
   */
  async generateInsights(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const insights = await insightsService.generateInsights(userId);

      res.json({
        success: true,
        message: 'Insights generated successfully',
        data: insights,
      });
    } catch (error) {
      console.error('Error generating insights:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate insights',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Dismiss an insight
   * POST /api/insights/:id/dismiss
   */
  async dismissInsight(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const id = parseInt(req.params.id);
      const dismissed = await insightsService.dismissInsight(id, userId);

      if (!dismissed) {
        res.status(404).json({ success: false, message: 'Insight not found' });
        return;
      }

      res.json({ success: true, message: 'Insight dismissed successfully' });
    } catch (error) {
      console.error('Error dismissing insight:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to dismiss insight',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const insightsController = new InsightsController();

