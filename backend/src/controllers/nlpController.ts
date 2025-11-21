import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { nlpService } from '../services/NLPService';
import { contentRecommendationService } from '../services/ContentRecommendationService';
import { pool } from '../config/database';
import { RowDataPacket } from 'mysql2/promise';

export class NLPController {
  /**
   * Analyze sentiment of text
   */
  async analyzeSentiment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { text } = req.body;

      if (!text || typeof text !== 'string') {
        res.status(400).json({ success: false, message: 'Text is required' });
        return;
      }

      const sentiment = nlpService.analyzeSentiment(text);

      res.status(200).json({
        success: true,
        data: sentiment,
      });
    } catch (error: any) {
      console.error('Error analyzing sentiment:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to analyze sentiment',
      });
    }
  }

  /**
   * Analyze sentiment of a post
   */
  async analyzePostSentiment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { postId } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      // Get post content
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT content, sentiment_score, sentiment_classification
         FROM social_posts
         WHERE id = ? AND user_id = ? AND is_deleted = FALSE`,
        [postId, userId]
      );

      if (rows.length === 0) {
        res.status(404).json({ success: false, message: 'Post not found' });
        return;
      }

      const post = rows[0];
      let sentiment;

      // If sentiment already analyzed, return it; otherwise analyze
      if (post.sentiment_score !== null) {
        sentiment = {
          score: parseFloat(post.sentiment_score),
          classification: post.sentiment_classification,
          cached: true,
        };
      } else {
        sentiment = nlpService.analyzeSentiment(post.content || '');
        
        // Update post with sentiment
        await pool.execute(
          `UPDATE social_posts
           SET sentiment_score = ?,
               sentiment_comparative = ?,
               sentiment_classification = ?
           WHERE id = ?`,
          [
            sentiment.score,
            sentiment.comparative,
            sentiment.classification,
            postId,
          ]
        );
      }

      res.status(200).json({
        success: true,
        data: sentiment,
      });
    } catch (error: any) {
      console.error('Error analyzing post sentiment:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to analyze post sentiment',
      });
    }
  }

  /**
   * Extract keywords from text
   */
  async extractKeywords(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { text, limit } = req.body;

      if (!text || typeof text !== 'string') {
        res.status(400).json({ success: false, message: 'Text is required' });
        return;
      }

      const keywords = nlpService.extractKeywords(text, limit || 10);
      const hashtags = nlpService.extractHashtags(text);
      const mentions = nlpService.extractMentions(text);

      res.status(200).json({
        success: true,
        data: {
          keywords,
          hashtags,
          mentions,
        },
      });
    } catch (error: any) {
      console.error('Error extracting keywords:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to extract keywords',
      });
    }
  }

  /**
   * Get content recommendations
   */
  async getRecommendations(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const accountId = req.query.accountId ? parseInt(req.query.accountId as string) : undefined;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const generate = req.query.generate === 'true';
      let recommendations;

      if (generate) {
        recommendations = await contentRecommendationService.generateRecommendations(userId, accountId);
      } else {
        recommendations = await contentRecommendationService.getSavedRecommendations(userId, accountId);
      }

      res.status(200).json({
        success: true,
        data: recommendations,
      });
    } catch (error: any) {
      console.error('Error getting recommendations:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get recommendations',
      });
    }
  }

  /**
   * Get sentiment trends
   */
  async getSentimentTrends(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const days = parseInt(req.query.days as string) || 30;
      const accountId = req.query.accountId ? parseInt(req.query.accountId as string) : undefined;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const query = accountId
        ? `SELECT 
             DATE(created_at_local) as date,
             AVG(sentiment_comparative) as avg_sentiment,
             COUNT(CASE WHEN sentiment_classification = 'positive' THEN 1 END) as positive_count,
             COUNT(CASE WHEN sentiment_classification = 'neutral' THEN 1 END) as neutral_count,
             COUNT(CASE WHEN sentiment_classification = 'negative' THEN 1 END) as negative_count,
             COUNT(*) as total_posts
           FROM social_posts
           WHERE user_id = ? AND account_id = ? 
             AND sentiment_classification IS NOT NULL
             AND created_at_local >= DATE_SUB(NOW(), INTERVAL ? DAY)
           GROUP BY DATE(created_at_local)
           ORDER BY date ASC`
        : `SELECT 
             DATE(created_at_local) as date,
             AVG(sentiment_comparative) as avg_sentiment,
             COUNT(CASE WHEN sentiment_classification = 'positive' THEN 1 END) as positive_count,
             COUNT(CASE WHEN sentiment_classification = 'neutral' THEN 1 END) as neutral_count,
             COUNT(CASE WHEN sentiment_classification = 'negative' THEN 1 END) as negative_count,
             COUNT(*) as total_posts
           FROM social_posts
           WHERE user_id = ? 
             AND sentiment_classification IS NOT NULL
             AND created_at_local >= DATE_SUB(NOW(), INTERVAL ? DAY)
           GROUP BY DATE(created_at_local)
           ORDER BY date ASC`;

      const params = accountId ? [userId, accountId, days] : [userId, days];
      const [rows] = await pool.execute<RowDataPacket[]>(query, params);

      res.status(200).json({
        success: true,
        data: rows.map((row) => ({
          date: row.date,
          avgSentiment: parseFloat(row.avg_sentiment || '0'),
          positiveCount: row.positive_count || 0,
          neutralCount: row.neutral_count || 0,
          negativeCount: row.negative_count || 0,
          totalPosts: row.total_posts || 0,
        })),
      });
    } catch (error: any) {
      console.error('Error getting sentiment trends:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get sentiment trends',
      });
    }
  }
}

export const nlpController = new NLPController();

