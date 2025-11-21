import { insightModel, Insight } from '../models/Report';
import { analyticsService } from './AnalyticsService';
import { UserSocialAccountModelInstance } from '../models/SocialPlatform';
import { pool } from '../config/database';
import { RowDataPacket } from 'mysql2/promise';
import { nlpService } from './NLPService';
import { contentRecommendationService } from './ContentRecommendationService';

class InsightsService {
  /**
   * Generate insights for a user (enhanced with NLP)
   */
  async generateInsights(userId: number): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Get user's analytics data
    const overview = await analyticsService.getOverviewMetrics(userId);
    const platformComparison = await analyticsService.getPlatformComparison(userId);
    const engagementTrends = await analyticsService.getEngagementTrends(userId, 30);
    const topPosts = await analyticsService.getTopPosts(userId, 5);

    // Generate insights based on data
    insights.push(...this.generatePerformanceInsights(userId, overview, platformComparison));
    insights.push(...this.generateRecommendationInsights(userId, overview, engagementTrends, topPosts));
    insights.push(...this.generateTrendInsights(userId, engagementTrends));
    
    // Generate NLP-powered insights
    insights.push(...await this.generateNLPInsights(userId, topPosts));
    insights.push(...await this.generateSentimentInsights(userId));

    // Save insights to database
    for (const insight of insights) {
      await insightModel.create(insight);
    }

    return insights;
  }

  /**
   * Generate performance insights
   */
  private generatePerformanceInsights(
    userId: number,
    overview: any,
    platformComparison: any[]
  ): Insight[] {
    const insights: Insight[] = [];

    // Growth rate insight
    if (overview.growthRate > 10) {
      insights.push({
        user_id: userId,
        insight_type: 'performance',
        category: 'growth',
        title: 'Strong Follower Growth',
        description: `Your account has grown by ${overview.growthRate.toFixed(1)}% in the last 30 days. This is excellent growth!`,
        priority: 'high',
        actionable: true,
        action_url: '/analytics',
        related_metrics: { growthRate: overview.growthRate },
        confidence_score: 0.9,
      });
    } else if (overview.growthRate < 0) {
      insights.push({
        user_id: userId,
        insight_type: 'performance',
        category: 'growth',
        title: 'Follower Decline Detected',
        description: `Your follower count has decreased by ${Math.abs(overview.growthRate).toFixed(1)}% in the last 30 days. Consider reviewing your content strategy.`,
        priority: 'high',
        actionable: true,
        action_url: '/content/library',
        related_metrics: { growthRate: overview.growthRate },
        confidence_score: 0.85,
      });
    }

    // Engagement rate insight
    if (overview.averageEngagementRate > 5) {
      insights.push({
        user_id: userId,
        insight_type: 'performance',
        category: 'engagement',
        title: 'High Engagement Rate',
        description: `Your average engagement rate is ${overview.averageEngagementRate.toFixed(1)}%, which is above average. Keep up the great work!`,
        priority: 'medium',
        actionable: false,
        related_metrics: { engagementRate: overview.averageEngagementRate },
        confidence_score: 0.8,
      });
    } else if (overview.averageEngagementRate < 2) {
      insights.push({
        user_id: userId,
        insight_type: 'recommendation',
        category: 'engagement',
        title: 'Low Engagement Rate',
        description: `Your engagement rate is ${overview.averageEngagementRate.toFixed(1)}%. Consider posting more engaging content or adjusting your posting schedule.`,
        priority: 'high',
        actionable: true,
        action_url: '/content/create',
        related_metrics: { engagementRate: overview.averageEngagementRate },
        confidence_score: 0.75,
      });
    }

    // Platform comparison insight
    if (platformComparison.length > 1) {
      const bestPlatform = platformComparison.reduce((best, current) =>
        current.engagementRate > best.engagementRate ? current : best
      );
      insights.push({
        user_id: userId,
        insight_type: 'recommendation',
        category: 'platform',
        title: 'Best Performing Platform',
        description: `${bestPlatform.platform} is your best performing platform with ${bestPlatform.engagementRate.toFixed(1)}% engagement rate. Consider focusing more content there.`,
        priority: 'medium',
        actionable: true,
        action_url: '/content/create',
        related_metrics: { platform: bestPlatform.platform, engagementRate: bestPlatform.engagementRate },
        confidence_score: 0.85,
      });
    }

    return insights;
  }

  /**
   * Generate recommendation insights
   */
  private generateRecommendationInsights(
    userId: number,
    overview: any,
    engagementTrends: any[],
    topPosts: any[]
  ): Insight[] {
    const insights: Insight[] = [];

    // Posting frequency insight
    if (overview.totalPosts < 10) {
      insights.push({
        user_id: userId,
        insight_type: 'recommendation',
        category: 'posting_frequency',
        title: 'Increase Posting Frequency',
        description: `You've posted ${overview.totalPosts} times in the last 30 days. Consider posting more frequently to maintain audience engagement.`,
        priority: 'medium',
        actionable: true,
        action_url: '/content/create',
        related_metrics: { totalPosts: overview.totalPosts },
        confidence_score: 0.7,
      });
    }

    // Content type insight (if we have top posts data)
    if (topPosts.length > 0) {
      const avgEngagement = topPosts.reduce((sum, post) => sum + post.engagement_rate, 0) / topPosts.length;
      if (avgEngagement > 8) {
        insights.push({
          user_id: userId,
          insight_type: 'recommendation',
          category: 'content_type',
          title: 'High-Performing Content',
          description: `Your top posts have an average engagement rate of ${avgEngagement.toFixed(1)}%. Analyze what makes these posts successful and create similar content.`,
          priority: 'medium',
          actionable: true,
          action_url: '/analytics',
          related_metrics: { avgEngagement },
          confidence_score: 0.8,
        });
      }
    }

    return insights;
  }

  /**
   * Generate trend insights
   */
  private generateTrendInsights(userId: number, engagementTrends: any[]): Insight[] {
    const insights: Insight[] = [];

    if (engagementTrends.length < 2) {
      return insights;
    }

    // Calculate trend
    const recent = engagementTrends.slice(-7);
    const older = engagementTrends.slice(0, 7);

    const recentAvg = recent.reduce((sum, day) => sum + day.engagementRate, 0) / recent.length;
    const olderAvg = older.reduce((sum, day) => sum + day.engagementRate, 0) / older.length;

    const trend = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (trend > 20) {
      insights.push({
        user_id: userId,
        insight_type: 'trend',
        category: 'engagement',
        title: 'Rising Engagement Trend',
        description: `Your engagement rate has increased by ${trend.toFixed(1)}% in the last week. Your content strategy is working well!`,
        priority: 'medium',
        actionable: false,
        related_metrics: { trend },
        confidence_score: 0.75,
      });
    } else if (trend < -20) {
      insights.push({
        user_id: userId,
        insight_type: 'trend',
        category: 'engagement',
        title: 'Declining Engagement Trend',
        description: `Your engagement rate has decreased by ${Math.abs(trend).toFixed(1)}% in the last week. Consider reviewing your recent content.`,
        priority: 'high',
        actionable: true,
        action_url: '/analytics',
        related_metrics: { trend },
        confidence_score: 0.75,
      });
    }

    return insights;
  }

  /**
   * Get insights for a user
   */
  async getUserInsights(userId: number, limit: number = 20): Promise<Insight[]> {
    return await insightModel.findByUser(userId, false, limit);
  }

  /**
   * Dismiss an insight
   */
  async dismissInsight(insightId: number, userId: number): Promise<boolean> {
    return await insightModel.dismiss(insightId, userId);
  }

  /**
   * Generate NLP-powered insights
   */
  private async generateNLPInsights(userId: number, topPosts: any[]): Promise<Insight[]> {
    const insights: Insight[] = [];

    if (topPosts.length === 0) {
      return insights;
    }

    // Analyze content patterns
    const contentTypes: { [key: string]: number } = {};
    const allKeywords: string[] = [];

    for (const post of topPosts) {
      if (post.content) {
        const contentType = nlpService.analyzeContentType(post.content);
        contentTypes[contentType.type] = (contentTypes[contentType.type] || 0) + 1;
        
        const keywords = nlpService.extractKeywords(post.content, 5);
        allKeywords.push(...keywords.map(k => k.word));
      }
    }

    // Most successful content type insight
    const bestContentType = Object.entries(contentTypes)
      .sort((a, b) => b[1] - a[1])[0];
    
    if (bestContentType && bestContentType[1] >= 2) {
      insights.push({
        user_id: userId,
        insight_type: 'recommendation',
        category: 'content_type',
        title: 'Most Successful Content Type',
        description: `Your ${bestContentType[0]} posts are performing best. Consider creating more content in this format.`,
        priority: 'medium',
        actionable: true,
        action_url: '/content/create',
        related_metrics: { contentType: bestContentType[0], count: bestContentType[1] },
        confidence_score: 0.8,
      });
    }

    // Keyword analysis insight
    const keywordFrequency: { [key: string]: number } = {};
    allKeywords.forEach((keyword) => {
      keywordFrequency[keyword] = (keywordFrequency[keyword] || 0) + 1;
    });

    const topKeywords = Object.entries(keywordFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([keyword]) => keyword);

    if (topKeywords.length > 0) {
      insights.push({
        user_id: userId,
        insight_type: 'recommendation',
        category: 'keywords',
        title: 'Top Performing Keywords',
        description: `Keywords that appear in your best posts: ${topKeywords.join(', ')}. Consider using these in future content.`,
        priority: 'medium',
        actionable: true,
        action_url: '/content/create',
        related_metrics: { keywords: topKeywords },
        confidence_score: 0.75,
      });
    }

    return insights;
  }

  /**
   * Generate sentiment-based insights
   */
  private async generateSentimentInsights(userId: number): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Get sentiment trends from database
    const [sentimentRows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        AVG(CASE WHEN sentiment_classification = 'positive' THEN 1 ELSE 0 END) as positive_ratio,
        AVG(CASE WHEN sentiment_classification = 'negative' THEN 1 ELSE 0 END) as negative_ratio,
        AVG(sentiment_comparative) as avg_sentiment,
        COUNT(*) as total_posts
       FROM social_posts
       WHERE user_id = ? AND sentiment_classification IS NOT NULL
         AND created_at_local >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      [userId]
    );

    if (sentimentRows.length === 0 || !sentimentRows[0].total_posts) {
      return insights;
    }

    const data = sentimentRows[0];
    const positiveRatio = parseFloat(data.positive_ratio || '0');
    const negativeRatio = parseFloat(data.negative_ratio || '0');
    const avgSentiment = parseFloat(data.avg_sentiment || '0');

    // Positive sentiment insight
    if (positiveRatio > 0.6 && avgSentiment > 0.2) {
      insights.push({
        user_id: userId,
        insight_type: 'performance',
        category: 'sentiment',
        title: 'Positive Content Sentiment',
        description: `${(positiveRatio * 100).toFixed(0)}% of your posts have positive sentiment. Your audience responds well to positive content!`,
        priority: 'medium',
        actionable: false,
        related_metrics: { positiveRatio, avgSentiment },
        confidence_score: 0.85,
      });
    }

    // Negative sentiment warning
    if (negativeRatio > 0.3) {
      insights.push({
        user_id: userId,
        insight_type: 'recommendation',
        category: 'sentiment',
        title: 'High Negative Sentiment Detected',
        description: `${(negativeRatio * 100).toFixed(0)}% of your posts have negative sentiment. Consider adjusting your content tone to be more positive.`,
        priority: 'high',
        actionable: true,
        action_url: '/content/create',
        related_metrics: { negativeRatio },
        confidence_score: 0.8,
      });
    }

    // Sentiment trend insight
    const [trendRows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        AVG(CASE WHEN created_at_local >= DATE_SUB(NOW(), INTERVAL 7 DAY) 
          THEN sentiment_comparative ELSE NULL END) as recent_sentiment,
        AVG(CASE WHEN created_at_local < DATE_SUB(NOW(), INTERVAL 7 DAY) 
          AND created_at_local >= DATE_SUB(NOW(), INTERVAL 14 DAY)
          THEN sentiment_comparative ELSE NULL END) as previous_sentiment
       FROM social_posts
       WHERE user_id = ? AND sentiment_comparative IS NOT NULL
         AND created_at_local >= DATE_SUB(NOW(), INTERVAL 14 DAY)`,
      [userId]
    );

    if (trendRows.length > 0 && trendRows[0].recent_sentiment && trendRows[0].previous_sentiment) {
      const recent = parseFloat(trendRows[0].recent_sentiment);
      const previous = parseFloat(trendRows[0].previous_sentiment);
      const change = ((recent - previous) / Math.abs(previous)) * 100;

      if (change > 20) {
        insights.push({
          user_id: userId,
          insight_type: 'trend',
          category: 'sentiment',
          title: 'Improving Content Sentiment',
          description: `Your content sentiment has improved by ${change.toFixed(0)}% in the last week. Keep up the positive tone!`,
          priority: 'medium',
          actionable: false,
          related_metrics: { change, recent, previous },
          confidence_score: 0.75,
        });
      } else if (change < -20) {
        insights.push({
          user_id: userId,
          insight_type: 'trend',
          category: 'sentiment',
          title: 'Declining Content Sentiment',
          description: `Your content sentiment has decreased by ${Math.abs(change).toFixed(0)}% in the last week. Consider reviewing your recent posts.`,
          priority: 'high',
          actionable: true,
          action_url: '/content/library',
          related_metrics: { change, recent, previous },
          confidence_score: 0.75,
        });
      }
    }

    return insights;
  }
}

export const insightsService = new InsightsService();

