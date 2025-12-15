import { Request, Response } from 'express';
import { RowDataPacket } from 'mysql2/promise';
import { contentDraftModel, scheduledPostModel, contentTemplateModel } from '../models/Content';
import { UserSocialAccountModelInstance, UserSocialAccount } from '../models/SocialPlatform';

export class ContentController {
  /**
   * Create a new content draft
   * POST /api/content/drafts
   */
  async createDraft(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const draft = await contentDraftModel.create({
        user_id: userId,
        ...req.body,
      });

      res.status(201).json({
        success: true,
        message: 'Draft created successfully',
        data: { id: draft },
      });
    } catch (error) {
      console.error('Error creating draft:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create draft',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get all drafts for a user
   * GET /api/content/drafts?status=draft&limit=50&offset=0
   */
  async getDrafts(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const status = req.query.status as string | undefined;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const drafts = await contentDraftModel.findByUser(userId, status, limit, offset);
      res.json({ success: true, data: drafts });
    } catch (error: any) {
      console.error('Error fetching drafts:', error);
      // Log the full error for debugging
      if (error.code) {
        console.error('Database error code:', error.code);
      }
      if (error.sqlMessage) {
        console.error('SQL error:', error.sqlMessage);
      }
      res.status(500).json({
        success: false,
        message: 'Failed to fetch drafts',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? {
          code: error.code,
          sqlMessage: error.sqlMessage,
          stack: error.stack,
        } : undefined,
      });
    }
  }

  /**
   * Get a single draft
   * GET /api/content/drafts/:id
   */
  async getDraft(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const id = parseInt(req.params.id);
      const draft = await contentDraftModel.findById(id, userId);

      if (!draft) {
        res.status(404).json({ success: false, message: 'Draft not found' });
        return;
      }

      res.json({ success: true, data: draft });
    } catch (error) {
      console.error('Error fetching draft:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch draft',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Update a draft
   * PUT /api/content/drafts/:id
   */
  async updateDraft(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const id = parseInt(req.params.id);
      const updated = await contentDraftModel.update(id, userId, req.body);

      if (!updated) {
        res.status(404).json({ success: false, message: 'Draft not found' });
        return;
      }

      res.json({ success: true, message: 'Draft updated successfully' });
    } catch (error) {
      console.error('Error updating draft:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update draft',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Delete a draft
   * DELETE /api/content/drafts/:id
   */
  async deleteDraft(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const id = parseInt(req.params.id);
      const deleted = await contentDraftModel.delete(id, userId);

      if (!deleted) {
        res.status(404).json({ success: false, message: 'Draft not found' });
        return;
      }

      res.json({ success: true, message: 'Draft deleted successfully' });
    } catch (error) {
      console.error('Error deleting draft:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete draft',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Schedule a post from a draft or new content
   * POST /api/content/schedule
   */
  async schedulePost(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { draft_id, account_id, scheduled_at, timezone, ...postData } = req.body;

      // Verify account belongs to user
      const account = await UserSocialAccountModelInstance.findById(account_id!);
      if (!account || account.user_id !== userId) {
        res.status(403).json({ success: false, message: 'Invalid account' });
        return;
      }

      // Get platform name from account (added by SQL join)
      const accountWithPlatform = account as UserSocialAccount & { platform_name?: string };
      const platformType = accountWithPlatform.platform_name || 'unknown';

      const scheduledPost = await scheduledPostModel.create({
        user_id: userId,
        draft_id,
        account_id: account_id!,
        platform_type: platformType,
        scheduled_at: new Date(scheduled_at),
        timezone: timezone || 'UTC',
        ...postData,
      });

      // If created from draft, update draft status
      if (draft_id) {
        await contentDraftModel.update(draft_id, userId, { status: 'scheduled' });
      }

      res.status(201).json({
        success: true,
        message: 'Post scheduled successfully',
        data: { id: scheduledPost },
      });
    } catch (error) {
      console.error('Error scheduling post:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to schedule post',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get scheduled posts
   * GET /api/content/scheduled?status=pending&limit=50&offset=0
   */
  async getScheduledPosts(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const status = req.query.status as string | undefined;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const posts = await scheduledPostModel.findByUser(userId, status, limit, offset);
      res.json({ success: true, data: posts });
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch scheduled posts',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Cancel a scheduled post
   * DELETE /api/content/scheduled/:id
   */
  async cancelScheduledPost(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const id = parseInt(req.params.id);
      const cancelled = await scheduledPostModel.delete(id, userId);

      if (!cancelled) {
        res.status(404).json({ success: false, message: 'Scheduled post not found' });
        return;
      }

      res.json({ success: true, message: 'Scheduled post cancelled successfully' });
    } catch (error) {
      console.error('Error cancelling scheduled post:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel scheduled post',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get content templates
   * GET /api/content/templates
   */
  async getTemplates(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const templates = await contentTemplateModel.findByUser(userId, true);
      res.json({ success: true, data: templates });
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch templates',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get hashtag suggestions based on content
   * GET /api/content/hashtags/suggest?text=...
   */
  async getHashtagSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { text, accountId } = req.query;
      if (!text || typeof text !== 'string') {
        res.status(400).json({ success: false, message: 'Text parameter is required' });
        return;
      }

      // Import services
      const { nlpService } = await import('../services/NLPService');
      const { contentRecommendationService } = await import('../services/ContentRecommendationService');

      // Get hashtags from content
      const extractedHashtags = nlpService.extractHashtags(text);
      
      // Get recommended hashtags from successful posts
      const recommendations = accountId 
        ? await contentRecommendationService.generateRecommendations(userId, parseInt(accountId as string))
        : await contentRecommendationService.generateRecommendations(userId);
      
      const recommendedHashtags = recommendations
        .filter(r => r.type === 'hashtag')
        .map(r => r.value.split(',').map(v => v.trim()))
        .flat();

      // Combine and deduplicate
      const allHashtags = [...new Set([...extractedHashtags, ...recommendedHashtags])];

      res.json({ 
        success: true, 
        data: {
          hashtags: allHashtags.slice(0, 20), // Limit to 20 suggestions
          extracted: extractedHashtags,
          recommended: recommendedHashtags,
        }
      });
    } catch (error) {
      console.error('Error getting hashtag suggestions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get hashtag suggestions',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get optimal posting time suggestions
   * GET /api/content/posting-time/suggest?accountId=...
   */
  async getOptimalPostingTime(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { accountId } = req.query;
      const { analyticsService } = await import('../services/AnalyticsService');
      const { pool } = await import('../config/database');

      // Get engagement data by hour from engagement snapshots
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT 
           HOUR(es.snapshot_time) as hour,
           AVG(es.engagement_rate) as avg_engagement,
           COUNT(*) as post_count
         FROM engagement_snapshots es
         INNER JOIN social_posts sp ON es.post_id = sp.id
         WHERE sp.user_id = ?
         ${accountId ? 'AND sp.account_id = ?' : ''}
         GROUP BY HOUR(es.snapshot_time)
         ORDER BY avg_engagement DESC
         LIMIT 5`,
        accountId ? [userId, accountId] : [userId]
      );

      const bestHours = rows.map(row => ({
        hour: row.hour,
        avgEngagement: parseFloat(row.avg_engagement || '0'),
        postCount: row.post_count || 0,
      }));

      // If no data, return default suggestions
      if (bestHours.length === 0) {
        res.json({
          success: true,
          data: {
            bestHours: [
              { hour: 9, avgEngagement: 0, postCount: 0, label: '9:00 AM' },
              { hour: 12, avgEngagement: 0, postCount: 0, label: '12:00 PM' },
              { hour: 18, avgEngagement: 0, postCount: 0, label: '6:00 PM' },
            ],
            message: 'No historical data available. Using default suggestions.',
          }
        });
        return;
      }

      res.json({
        success: true,
        data: {
          bestHours: bestHours.map(h => ({
            ...h,
            label: `${h.hour % 12 || 12}:00 ${h.hour >= 12 ? 'PM' : 'AM'}`,
          })),
        }
      });
    } catch (error) {
      console.error('Error getting optimal posting time:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get optimal posting time',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Create a content template
   * POST /api/content/templates
   */
  async createTemplate(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const templateId = await contentTemplateModel.create({
        user_id: userId,
        ...req.body,
      });

      res.status(201).json({
        success: true,
        message: 'Template created successfully',
        data: { id: templateId },
      });
    } catch (error) {
      console.error('Error creating template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create template',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Delete a content template
   * DELETE /api/content/templates/:id
   */
  async deleteTemplate(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const id = parseInt(req.params.id);
      const { pool } = await import('../config/database');
      
      // Verify template belongs to user
      const [rows] = await pool.execute<any[]>(
        'SELECT user_id FROM content_templates WHERE id = ?',
        [id]
      );

      if (rows.length === 0) {
        res.status(404).json({ success: false, message: 'Template not found' });
        return;
      }

      if (rows[0].user_id !== userId) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
      }

      await pool.execute('DELETE FROM content_templates WHERE id = ?', [id]);

      res.json({
        success: true,
        message: 'Template deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete template',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const contentController = new ContentController();

