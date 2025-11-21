import { UserSocialAccount } from '../../models/SocialPlatform';
import { SocialPost, PostEngagementMetrics, FollowerMetrics } from '../../models/Post';
import { PlatformData } from '../DataCollectionService';

/**
 * Mock Service for Testing Phase 4
 * Generates realistic test data without requiring actual API access
 */
class MockService {
  /**
   * Collect mock data for testing
   */
  async collectData(
    account: UserSocialAccount,
    options: { limit?: number; since?: Date } = {}
  ): Promise<PlatformData> {
    const posts: SocialPost[] = [];
    const engagementMetrics = new Map<number, PostEngagementMetrics>();
    const limit = options.limit || 25;

    // Generate mock posts
    const mockPosts = this.generateMockPosts(account, limit);
    
    for (let i = 0; i < mockPosts.length; i++) {
      const mockPost = mockPosts[i];
      
      // Normalize to SocialPost format
      // Get platform type from account (may be in joined data)
      const accountWithPlatform = account as UserSocialAccount & { platform_name?: string; platform_type?: string };
      const platformType = accountWithPlatform.platform_type || accountWithPlatform.platform_name || 'mock';
      
      const post: SocialPost = {
        user_id: account.user_id,
        account_id: account.id!,
        platform_post_id: `mock_post_${Date.now()}_${i}`,
        platform_type: platformType,
        content: mockPost.content,
        content_type: mockPost.content_type,
        media_urls: mockPost.media_urls,
        permalink: `https://example.com/post/${i}`,
        published_at: mockPost.published_at,
        created_at: mockPost.published_at,
        updated_at: new Date(),
        metadata: mockPost.metadata,
      };

      posts.push(post);

      // Generate engagement metrics
      const metrics: PostEngagementMetrics = {
        post_id: 0, // Will be set after post is saved
        likes_count: mockPost.engagement.likes,
        comments_count: mockPost.engagement.comments,
        shares_count: mockPost.engagement.shares,
        saves_count: mockPost.engagement.saves,
        views_count: mockPost.engagement.views,
        impressions_count: mockPost.engagement.impressions,
        reach_count: mockPost.engagement.reach,
        engagement_rate: mockPost.engagement.engagement_rate,
      };

      engagementMetrics.set(i, metrics);
    }

    // Generate follower metrics
    const followerMetrics: FollowerMetrics = {
      account_id: account.id!,
      follower_count: Math.floor(Math.random() * 10000) + 1000,
      following_count: Math.floor(Math.random() * 500) + 100,
      posts_count: posts.length,
    };

    return {
      posts,
      engagementMetrics,
      followerMetrics,
    };
  }

  /**
   * Generate mock posts with realistic data
   */
  private generateMockPosts(account: UserSocialAccount, limit: number): Array<{
    content: string;
    content_type: SocialPost['content_type'];
    media_urls: string[];
    published_at: Date;
    engagement: {
      likes: number;
      comments: number;
      shares: number;
      saves: number;
      views: number;
      impressions: number;
      reach: number;
      engagement_rate: number;
    };
    metadata: Record<string, any>;
  }> {
    const posts = [];
    const sampleContents = [
      "Excited to share our latest product launch! 🚀",
      "Thank you to everyone who joined us at the event!",
      "Check out this amazing tutorial we just published!",
      "Behind the scenes: How we build amazing products",
      "Customer success story: How we helped transform their business",
      "New feature announcement: Now available for all users!",
      "Weekly roundup: Top insights from this week",
      "Team spotlight: Meet our amazing developers",
      "Tips and tricks: How to get the most out of our platform",
      "Community highlights: Best posts from our users",
    ];

    const contentTypes: SocialPost['content_type'][] = ['text', 'image', 'video', 'carousel'];
    const mediaUrls = [
      'https://picsum.photos/800/600?random=1',
      'https://picsum.photos/800/600?random=2',
      'https://picsum.photos/800/600?random=3',
    ];

    for (let i = 0; i < limit; i++) {
      const daysAgo = Math.floor(Math.random() * 30); // Posts from last 30 days
      const publishedAt = new Date();
      publishedAt.setDate(publishedAt.getDate() - daysAgo);
      publishedAt.setHours(Math.floor(Math.random() * 24));
      publishedAt.setMinutes(Math.floor(Math.random() * 60));

      const contentType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
      const content = sampleContents[Math.floor(Math.random() * sampleContents.length)];
      
      // Generate realistic engagement metrics
      const baseEngagement = Math.floor(Math.random() * 500) + 50;
      const likes = baseEngagement + Math.floor(Math.random() * 200);
      const comments = Math.floor(likes * 0.1) + Math.floor(Math.random() * 20);
      const shares = Math.floor(likes * 0.05) + Math.floor(Math.random() * 10);
      const saves = Math.floor(likes * 0.03) + Math.floor(Math.random() * 5);
      const impressions = likes * 10 + Math.floor(Math.random() * 1000);
      const reach = Math.floor(impressions * 0.8);
      const views = contentType === 'video' ? impressions : 0;
      const totalEngagement = likes + comments + shares + saves;
      const engagementRate = impressions > 0 ? (totalEngagement / impressions) * 100 : 0;

      posts.push({
        content,
        content_type: contentType,
        media_urls: contentType !== 'text' ? [mediaUrls[Math.floor(Math.random() * mediaUrls.length)]] : [],
        published_at: publishedAt,
        engagement: {
          likes,
          comments,
          shares,
          saves,
          views,
          impressions,
          reach,
          engagement_rate: parseFloat(engagementRate.toFixed(2)),
        },
        metadata: {
          mock: true,
          generated_at: new Date().toISOString(),
        },
      });
    }

    // Sort by published date (newest first)
    return posts.sort((a, b) => b.published_at.getTime() - a.published_at.getTime());
  }
}

export default MockService;

