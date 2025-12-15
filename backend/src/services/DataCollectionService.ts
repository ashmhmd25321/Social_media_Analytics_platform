import { UserSocialAccount } from '../models/SocialPlatform';
import { SocialPost, PostEngagementMetrics, FollowerMetrics } from '../models/Post';
import { postModel, engagementMetricsModel, followerMetricsModel } from '../models/Post';
import { dataCollectionJobModel, apiRateLimitModel } from '../models/DataCollection';
import { nlpService } from './NLPService';
import { pool } from '../config/database';

export interface PlatformData {
  posts: SocialPost[];
  engagementMetrics: Map<number, PostEngagementMetrics>;
  followerMetrics?: FollowerMetrics;
}

export interface CollectionOptions {
  maxRetries?: number;
  retryDelay?: number;
  limit?: number;
  since?: Date;
}

class DataCollectionService {
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  /**
   * Main method to collect data from a social media account
   */
  async collectAccountData(
    account: UserSocialAccount,
    options: CollectionOptions = {}
  ): Promise<PlatformData> {
    const accountWithPlatform = account as UserSocialAccount & { platform_name?: string; platform_type?: string };
    const platformType = accountWithPlatform.platform_type || accountWithPlatform.platform_name || 'unknown';
    
    const jobId = await dataCollectionJobModel.create({
      user_id: account.user_id,
      account_id: account.id!,
      job_type: 'manual_sync',
      status: 'running',
      platform_type: platformType,
    });

    const startTime = Date.now();
    let itemsCollected = 0;
    let itemsUpdated = 0;
    let itemsFailed = 0;

    try {
      // Update account's last_synced_at
      await this.updateLastSynced(account.id!);

      // Collect data based on platform type
      // platform_name is added by the query join in findById
      const accountWithPlatform = account as UserSocialAccount & { platform_name?: string; platform_type?: string };
      const platformType = accountWithPlatform.platform_type || accountWithPlatform.platform_name || 'unknown';
      const data = await this.collectFromPlatform(account, options);

      itemsCollected = data.posts.length;
      
      // Store posts and map engagement metrics
      const postIdMap = new Map<number, PostEngagementMetrics>(); // Map from original index to metrics
      
      for (let i = 0; i < data.posts.length; i++) {
        const post = data.posts[i];
        try {
          const postId = await postModel.upsert(post);
          itemsUpdated++;

          // Analyze sentiment and extract NLP data if content exists
          if (post.content) {
            try {
              const sentiment = nlpService.analyzeSentiment(post.content);
              const keywords = nlpService.extractKeywords(post.content, 10);
              const hashtags = nlpService.extractHashtags(post.content);
              const mentions = nlpService.extractMentions(post.content);
              const contentType = nlpService.analyzeContentType(post.content);
              const language = nlpService.detectLanguage(post.content);

              // Update post with NLP data
              await pool.execute(
                `UPDATE social_posts
                 SET sentiment_score = ?,
                     sentiment_comparative = ?,
                     sentiment_classification = ?,
                     extracted_keywords = ?,
                     extracted_hashtags = ?,
                     extracted_mentions = ?,
                     content_type_detected = ?,
                     language_detected = ?
                 WHERE id = ?`,
                [
                  sentiment.score,
                  sentiment.comparative,
                  sentiment.classification,
                  JSON.stringify(keywords.map(k => k.word)), // Store just the words
                  JSON.stringify(hashtags),
                  JSON.stringify(mentions),
                  contentType.type,
                  language,
                  postId,
                ]
              );
            } catch (nlpError) {
              console.error(`Error analyzing NLP for post ${post.platform_post_id}:`, nlpError);
              // Continue even if NLP analysis fails
            }
          }

          // Store engagement metrics if available (using index from original array)
          const metrics = data.engagementMetrics.get(i);
          if (metrics) {
            postIdMap.set(postId, metrics);
            await engagementMetricsModel.upsert({
              ...metrics,
              post_id: postId,
            });
          }
        } catch (error) {
          itemsFailed++;
          console.error(`Error storing post ${post.platform_post_id}:`, error);
        }
      }

      // Store follower metrics if available
      if (data.followerMetrics) {
        await followerMetricsModel.upsert(data.followerMetrics);
      }

      const duration = Math.floor((Date.now() - startTime) / 1000);
      await dataCollectionJobModel.updateStatus(jobId, 'completed', {
        items_collected: itemsCollected,
        items_updated: itemsUpdated,
        items_failed: itemsFailed,
        duration_seconds: duration,
      });

      return data;
    } catch (error) {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await dataCollectionJobModel.updateStatus(jobId, 'failed', {
        items_collected: itemsCollected,
        items_updated: itemsUpdated,
        items_failed: itemsFailed,
        error_message: errorMessage,
        duration_seconds: duration,
      });

      throw error;
    }
  }

  /**
   * Collect data from platform-specific API
   */
  private async collectFromPlatform(
    account: UserSocialAccount,
    options: CollectionOptions
  ): Promise<PlatformData> {
    const accountWithPlatform = account as UserSocialAccount & { platform_name?: string; platform_type?: string };
    const platformType = accountWithPlatform.platform_type || accountWithPlatform.platform_name || 'unknown';

    // If no access token, try to use default credentials (YouTube only)
    // Facebook/Instagram require user-specific tokens via OAuth
    if (!account.access_token || account.access_token === 'mock_token') {
      // Try to get default credentials
      const { getDefaultPlatformCredentials } = await import('../config/oauth-config');
      const defaultCreds = getDefaultPlatformCredentials();
      
      // Only use default credentials for YouTube (API key is general)
      // Facebook/Instagram must have user-specific tokens
      if (platformType.toLowerCase() === 'youtube' && defaultCreds.youtube.apiKey && defaultCreds.youtube.channelId) {
        account.access_token = defaultCreds.youtube.apiKey;
        if (defaultCreds.youtube.channelId && !account.platform_account_id) {
          account.platform_account_id = defaultCreds.youtube.channelId;
        }
      } else if (platformType.toLowerCase() === 'facebook' || platformType.toLowerCase() === 'instagram') {
        // Facebook/Instagram require user to connect their own account
        throw new Error(`Please connect your ${platformType} account in Settings to view your data.`);
      } else if (process.env.USE_MOCK_DATA === 'true') {
        return await this.collectMockData(account, options);
      } else {
        throw new Error(`No account connected for platform: ${platformType}. Please connect your account in Settings.`);
      }
    }

    switch (platformType.toLowerCase()) {
      case 'facebook':
      case 'instagram':
        // Check if we should use mock data (for testing without API)
        if (process.env.USE_MOCK_DATA === 'true') {
          return await this.collectMockData(account, options);
        }
        return await this.collectFacebookData(account, options);
      case 'youtube':
        return await this.collectYouTubeData(account, options);
      case 'mock':
        return await this.collectMockData(account, options);
      default:
        throw new Error(`Unsupported platform: ${platformType}`);
    }
  }

  /**
   * Facebook/Instagram data collection
   */
  private async collectFacebookData(
    account: UserSocialAccount,
    options: CollectionOptions
  ): Promise<PlatformData> {
    const FacebookService = (await import('./platforms/FacebookService')).default;
    const facebookService = new FacebookService(account.access_token);
    return await facebookService.collectData(account, options);
  }

  /**
   * YouTube data collection
   */
  private async collectYouTubeData(
    account: UserSocialAccount,
    options: CollectionOptions
  ): Promise<PlatformData> {
    // Check if we should use mock data (for testing without API)
    if (process.env.USE_MOCK_DATA === 'true' || account.access_token === 'mock_token') {
      return await this.collectMockData(account, options);
    }
    
    const YouTubeService = (await import('./platforms/YouTubeService')).default;
    const youtubeService = new YouTubeService(account.access_token);
    return await youtubeService.collectData(account, options);
  }

  /**
   * Mock data collection (for testing without API access)
   */
  private async collectMockData(
    account: UserSocialAccount,
    options: CollectionOptions
  ): Promise<PlatformData> {
    const MockService = (await import('./platforms/MockService')).default;
    const mockService = new MockService();
    return await mockService.collectData(account, options);
  }

  /**
   * Normalize post data from platform API response
   */
  normalizePostData(
    rawPost: any,
    account: UserSocialAccount,
    platformType: string
  ): SocialPost {
    // Base normalization - platform-specific implementations will override
    return {
      user_id: account.user_id,
      account_id: account.id!,
      platform_post_id: rawPost.id || rawPost.post_id || '',
      platform_type: platformType,
      content: rawPost.text || rawPost.caption || rawPost.message || '',
      content_type: this.determineContentType(rawPost),
      media_urls: this.extractMediaUrls(rawPost),
      permalink: rawPost.permalink || rawPost.url || '',
      published_at: rawPost.created_time || rawPost.timestamp || rawPost.published_at,
      created_at: rawPost.created_time || rawPost.timestamp,
      updated_at: rawPost.updated_time || rawPost.modified_at,
      metadata: rawPost,
    };
  }

  /**
   * Normalize engagement metrics from platform API response
   */
  normalizeEngagementMetrics(rawMetrics: any): PostEngagementMetrics {
    return {
      post_id: 0, // Will be set after post is created
      likes_count: rawMetrics.likes || rawMetrics.favorite_count || rawMetrics.reactions || 0,
      comments_count: rawMetrics.comments || rawMetrics.comment_count || 0,
      shares_count: rawMetrics.shares || rawMetrics.retweet_count || rawMetrics.reposts || 0,
      saves_count: rawMetrics.saves || rawMetrics.save_count || 0,
      views_count: rawMetrics.views || rawMetrics.view_count || rawMetrics.impressions || 0,
      clicks_count: rawMetrics.clicks || rawMetrics.click_count || 0,
      impressions_count: rawMetrics.impressions || rawMetrics.reach || 0,
      reach_count: rawMetrics.reach || rawMetrics.unique_impressions || 0,
      engagement_rate: this.calculateEngagementRate(rawMetrics),
    };
  }

  /**
   * Calculate engagement rate
   */
  private calculateEngagementRate(metrics: any): number {
    const likes = metrics.likes || metrics.favorite_count || metrics.reactions || 0;
    const comments = metrics.comments || metrics.comment_count || 0;
    const shares = metrics.shares || metrics.retweet_count || metrics.reposts || 0;
    const saves = metrics.saves || metrics.save_count || 0;
    
    const totalEngagement = likes + comments + shares + saves;
    const impressions = metrics.impressions || metrics.reach || 0;

    if (impressions === 0) return 0;
    return (totalEngagement / impressions) * 100;
  }

  /**
   * Determine content type from post data
   */
  private determineContentType(post: any): SocialPost['content_type'] {
    if (post.media_type) {
      if (post.media_type === 'IMAGE') return 'image';
      if (post.media_type === 'VIDEO') return 'video';
      if (post.media_type === 'CAROUSEL') return 'carousel';
    }
    if (post.type) {
      if (post.type === 'photo') return 'image';
      if (post.type === 'video') return 'video';
    }
    if (post.media_urls && post.media_urls.length > 1) return 'carousel';
    if (post.media_urls && post.media_urls.length > 0) {
      const url = post.media_urls[0];
      if (url.includes('.mp4') || url.includes('.mov')) return 'video';
      return 'image';
    }
    return 'text';
  }

  /**
   * Extract media URLs from post data
   */
  private extractMediaUrls(post: any): string[] {
    const urls: string[] = [];
    
    if (post.media_url) urls.push(post.media_url);
    if (post.media_urls && Array.isArray(post.media_urls)) {
      urls.push(...post.media_urls);
    }
    if (post.images && Array.isArray(post.images)) {
      urls.push(...post.images.map((img: any) => img.url || img));
    }
    if (post.videos && Array.isArray(post.videos)) {
      urls.push(...post.videos.map((vid: any) => vid.url || vid));
    }

    return urls.filter(Boolean);
  }

  /**
   * Update last synced timestamp for account
   */
  private async updateLastSynced(accountId: number): Promise<void> {
    const { pool } = await import('../config/database');
    await pool.execute(
      'UPDATE user_social_accounts SET last_synced_at = CURRENT_TIMESTAMP WHERE id = ?',
      [accountId]
    );
  }

  /**
   * Check rate limit before making API request
   */
  async checkRateLimit(
    accountId: number,
    platformType: string,
    endpoint: string
  ): Promise<boolean> {
    return await apiRateLimitModel.canMakeRequest(accountId, platformType, endpoint);
  }

  /**
   * Retry mechanism for API calls
   */
  async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.maxRetries,
    delay: number = this.retryDelay
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
        }
      }
    }

    throw lastError || new Error('Operation failed after retries');
  }
}

export const dataCollectionService = new DataCollectionService();

