import { Request, Response } from 'express';
import { campaignModel, campaignPostModel, abTestGroupModel } from '../models/Campaign';
import { campaignService } from '../services/CampaignService';

export class CampaignController {
  /**
   * Create a new campaign
   * POST /api/campaigns
   */
  async createCampaign(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const campaignId = await campaignService.createCampaign({
        ...req.body,
        user_id: userId,
      });

      res.status(201).json({
        success: true,
        message: 'Campaign created successfully',
        data: { id: campaignId },
      });
    } catch (error) {
      console.error('Error creating campaign:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create campaign',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get user's campaigns
   * GET /api/campaigns
   */
  async getCampaigns(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const status = req.query.status as string | undefined;
      const campaigns = await campaignModel.findByUser(userId, status);

      res.json({
        success: true,
        data: campaigns,
      });
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch campaigns',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get campaign details with metrics
   * GET /api/campaigns/:id
   */
  async getCampaign(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const id = parseInt(req.params.id);
      const metrics = await campaignService.getCampaignMetrics(id);

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      console.error('Error fetching campaign:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch campaign',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Update campaign
   * PUT /api/campaigns/:id
   */
  async updateCampaign(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const id = parseInt(req.params.id);
      const updated = await campaignModel.update(id, req.body);

      if (!updated) {
        res.status(404).json({ success: false, message: 'Campaign not found' });
        return;
      }

      res.json({
        success: true,
        message: 'Campaign updated successfully',
      });
    } catch (error) {
      console.error('Error updating campaign:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update campaign',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Create A/B test
   * POST /api/campaigns/:id/ab-test
   */
  async createABTest(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const campaignId = parseInt(req.params.id);
      const { groups } = req.body;

      const groupIds = await campaignService.createABTest(campaignId, groups);

      res.json({
        success: true,
        message: 'A/B test created successfully',
        data: { groupIds },
      });
    } catch (error) {
      console.error('Error creating A/B test:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create A/B test',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get A/B test results
   * GET /api/campaigns/:id/ab-test
   */
  async getABTestResults(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const campaignId = parseInt(req.params.id);
      const results = await campaignService.getABTestResults(campaignId);

      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      console.error('Error fetching A/B test results:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch A/B test results',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Add post to campaign
   * POST /api/campaigns/:id/posts
   */
  async addPost(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const campaignId = parseInt(req.params.id);
      const { post_id, variant_type } = req.body;

      const id = await campaignService.addPostToCampaign(campaignId, post_id, variant_type);

      res.json({
        success: true,
        message: 'Post added to campaign successfully',
        data: { id },
      });
    } catch (error) {
      console.error('Error adding post to campaign:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add post to campaign',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const campaignController = new CampaignController();

