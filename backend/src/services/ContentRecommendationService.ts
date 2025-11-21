import { nlpService } from './NLPService';
import { analyticsService } from './AnalyticsService';
import { pool } from '../config/database';
import { RowDataPacket } from 'mysql2/promise';

interface ContentRecommendation {
  type: 'topic' | 'hashtag' | 'posting_time' | 'content_type' | 'tone';
  value: string;
  confidence: number;
  reason: string;
}

class ContentRecommendationService {
  /**
   * Generate content recommendations for a user
   */
  async generateRecommendations(userId: number, accountId?: number): Promise<ContentRecommendation[]> {
    const recommendations: ContentRecommendation[] = [];

    // Get top performing posts
    const topPosts = await analyticsService.getTopPosts(userId, 20);
    
    if (topPosts.length === 0) {
      return this.getDefaultRecommendations();
    }

    // Analyze successful posts
    const successfulPosts = topPosts
      .filter((post) => post.engagement_rate > 3)
      .map((post) => ({
        content: post.content,
        engagement_rate: post.engagement_rate,
      }));

    if (successfulPosts.length === 0) {
      return this.getDefaultRecommendations();
    }

    // Generate NLP-based recommendations
    const nlpSuggestions = nlpService.generateContentSuggestions(successfulPosts);

    // Topic recommendations
    if (nlpSuggestions.suggestedTopics.length > 0) {
      recommendations.push({
        type: 'topic',
        value: nlpSuggestions.suggestedTopics.slice(0, 5).join(', '),
        confidence: 0.8,
        reason: `Based on analysis of ${successfulPosts.length} high-performing posts`,
      });
    }

    // Hashtag recommendations
    if (nlpSuggestions.suggestedHashtags.length > 0) {
      recommendations.push({
        type: 'hashtag',
        value: nlpSuggestions.suggestedHashtags.slice(0, 10).join(', '),
        confidence: 0.75,
        reason: `Most used hashtags in your top ${successfulPosts.length} posts`,
      });
    }

    // Tone recommendations
    recommendations.push({
      type: 'tone',
      value: nlpSuggestions.suggestedTone,
      confidence: 0.7,
      reason: `Based on sentiment analysis of successful content (avg sentiment: ${nlpSuggestions.avgSentiment.toFixed(2)})`,
    });

    // Content type recommendations
    const contentTypes = await this.analyzeContentTypes(userId, accountId);
    if (contentTypes.length > 0) {
      recommendations.push({
        type: 'content_type',
        value: contentTypes[0].type,
        confidence: contentTypes[0].confidence,
        reason: contentTypes[0].reason,
      });
    }

    // Posting time recommendations
    const postingTime = await this.analyzePostingTimes(userId, accountId);
    if (postingTime) {
      recommendations.push({
        type: 'posting_time',
        value: postingTime,
        confidence: 0.65,
        reason: 'Based on historical engagement patterns',
      });
    }

    // Save recommendations to database
    await this.saveRecommendations(userId, accountId, recommendations);

    return recommendations;
  }

  /**
   * Analyze best content types
   */
  private async analyzeContentTypes(
    userId: number,
    accountId?: number
  ): Promise<Array<{ type: string; confidence: number; reason: string }>> {
    const query = accountId
      ? `SELECT content_type, AVG(pem.engagement_rate) as avg_engagement, COUNT(*) as count
         FROM social_posts sp
         INNER JOIN post_engagement_metrics pem ON sp.id = pem.post_id
         WHERE sp.user_id = ? AND sp.account_id = ? AND sp.is_deleted = FALSE
         GROUP BY content_type
         ORDER BY avg_engagement DESC
         LIMIT 3`
      : `SELECT content_type, AVG(pem.engagement_rate) as avg_engagement, COUNT(*) as count
         FROM social_posts sp
         INNER JOIN post_engagement_metrics pem ON sp.id = pem.post_id
         WHERE sp.user_id = ? AND sp.is_deleted = FALSE
         GROUP BY content_type
         ORDER BY avg_engagement DESC
         LIMIT 3`;

    const params = accountId ? [userId, accountId] : [userId];
    const [rows] = await pool.execute<RowDataPacket[]>(query, params);

    return rows.map((row) => ({
      type: row.content_type,
      confidence: Math.min(0.9, row.avg_engagement / 10),
      reason: `Average engagement rate: ${parseFloat(row.avg_engagement).toFixed(2)}% (${row.count} posts)`,
    }));
  }

  /**
   * Analyze best posting times
   */
  private async analyzePostingTimes(userId: number, accountId?: number): Promise<string | null> {
    const query = accountId
      ? `SELECT HOUR(published_at) as hour, AVG(pem.engagement_rate) as avg_engagement
         FROM social_posts sp
         INNER JOIN post_engagement_metrics pem ON sp.id = pem.post_id
         WHERE sp.user_id = ? AND sp.account_id = ? AND sp.is_deleted = FALSE
           AND published_at IS NOT NULL
         GROUP BY HOUR(published_at)
         ORDER BY avg_engagement DESC
         LIMIT 1`
      : `SELECT HOUR(published_at) as hour, AVG(pem.engagement_rate) as avg_engagement
         FROM social_posts sp
         INNER JOIN post_engagement_metrics pem ON sp.id = pem.post_id
         WHERE sp.user_id = ? AND sp.is_deleted = FALSE
           AND published_at IS NOT NULL
         GROUP BY HOUR(published_at)
         ORDER BY avg_engagement DESC
         LIMIT 1`;

    const params = accountId ? [userId, accountId] : [userId];
    const [rows] = await pool.execute<RowDataPacket[]>(query, params);

    if (rows.length === 0) {
      return null;
    }

    const bestHour = rows[0].hour;
    const timeString = bestHour < 12
      ? `${bestHour}:00 AM`
      : bestHour === 12
        ? '12:00 PM'
        : `${bestHour - 12}:00 PM`;

    return timeString;
  }

  /**
   * Get default recommendations when no data is available
   */
  private getDefaultRecommendations(): ContentRecommendation[] {
    return [
      {
        type: 'topic',
        value: 'Share engaging content, ask questions, use storytelling',
        confidence: 0.5,
        reason: 'General best practices for social media',
      },
      {
        type: 'hashtag',
        value: 'Use 5-10 relevant hashtags per post',
        confidence: 0.5,
        reason: 'Industry standard recommendation',
      },
      {
        type: 'tone',
        value: 'positive',
        confidence: 0.5,
        reason: 'Positive content typically performs better',
      },
    ];
  }

  /**
   * Save recommendations to database
   */
  private async saveRecommendations(
    userId: number,
    accountId: number | undefined,
    recommendations: ContentRecommendation[]
  ): Promise<void> {
    const insertQuery = `
      INSERT INTO content_recommendations 
      (user_id, account_id, recommendation_type, recommendation_value, confidence_score, based_on_posts_count, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))
    `;

    for (const rec of recommendations) {
      await pool.execute(insertQuery, [
        userId,
        accountId || null,
        rec.type,
        rec.value,
        rec.confidence,
        recommendations.length,
      ]);
    }
  }

  /**
   * Get saved recommendations for a user
   */
  async getSavedRecommendations(
    userId: number,
    accountId?: number,
    limit: number = 10
  ): Promise<Array<{
    id: number;
    type: string;
    value: string;
    confidence: number;
    generated_at: Date;
    is_applied: boolean;
  }>> {
    const query = accountId
      ? `SELECT id, recommendation_type as type, recommendation_value as value, 
                confidence_score as confidence, generated_at, is_applied
         FROM content_recommendations
         WHERE user_id = ? AND (account_id = ? OR account_id IS NULL)
           AND (expires_at IS NULL OR expires_at > NOW())
         ORDER BY generated_at DESC, confidence_score DESC
         LIMIT ?`
      : `SELECT id, recommendation_type as type, recommendation_value as value,
                confidence_score as confidence, generated_at, is_applied
         FROM content_recommendations
         WHERE user_id = ? AND account_id IS NULL
           AND (expires_at IS NULL OR expires_at > NOW())
         ORDER BY generated_at DESC, confidence_score DESC
         LIMIT ?`;

    const params = accountId ? [userId, accountId, limit] : [userId, limit];
    const [rows] = await pool.execute<RowDataPacket[]>(query, params);

    return rows.map((row) => ({
      id: row.id,
      type: row.type,
      value: row.value,
      confidence: parseFloat(row.confidence),
      generated_at: row.generated_at,
      is_applied: row.is_applied === 1,
    }));
  }
}

export const contentRecommendationService = new ContentRecommendationService();

