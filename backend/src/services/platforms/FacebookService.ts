import axios, { AxiosInstance } from 'axios';
import { UserSocialAccount } from '../../models/SocialPlatform';
import { SocialPost, PostEngagementMetrics, FollowerMetrics } from '../../models/Post';
import { PlatformData } from '../DataCollectionService';

export interface FacebookPost {
  id: string;
  message?: string;
  story?: string;
  created_time: string;
  updated_time?: string;
  permalink_url?: string;
  media?: {
    image?: { src: string };
    video?: { src: string };
  };
  attachments?: {
    data: Array<{
      type: string;
      media?: { image?: { src: string } };
      subattachments?: {
        data: Array<{
          media?: { image?: { src: string } };
        }>;
      };
    }>;
  };
  insights?: {
    data: Array<{
      name: string;
      values: Array<{ value: number }>;
    }>;
  };
}

export interface FacebookEngagement {
  reactions: {
    summary: { total_count: number };
  };
  comments: {
    summary: { total_count: number };
  };
  shares: {
    count: number;
  };
}

export interface FacebookPage {
  id: string;
  name: string;
  followers_count?: number;
  fan_count?: number;
  posts?: {
    data: FacebookPost[];
    paging?: {
      next?: string;
    };
  };
}

class FacebookService {
  private api: AxiosInstance;
  private accessToken: string;
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.api = axios.create({
      baseURL: this.baseUrl,
      params: {
        access_token: accessToken,
      },
    });
  }

  /**
   * Collect data from Facebook/Instagram
   */
  async collectData(
    account: UserSocialAccount,
    options: { limit?: number; since?: Date } = {}
  ): Promise<PlatformData> {
    const posts: SocialPost[] = [];
    const engagementMetrics = new Map<number, PostEngagementMetrics>();
    let followerMetrics: FollowerMetrics | undefined;

    try {
      // Get page/account info
      const pageId = account.platform_account_id;
      const pageInfo = await this.getPageInfo(pageId);
      
      // Get follower metrics
      followerMetrics = {
        account_id: account.id!,
        follower_count: pageInfo.fan_count || pageInfo.followers_count || 0,
        posts_count: 0,
      };

      // Get posts
      const postsData = await this.getPosts(pageId, options);
      
      // Get engagement metrics for all posts in parallel
      const engagementPromises = postsData.map(post => 
        this.getPostEngagement(post.id).catch(err => {
          console.error(`Error fetching engagement for post ${post.id}:`, err);
          return null;
        })
      );
      const engagements = await Promise.all(engagementPromises);
      
      for (let i = 0; i < postsData.length; i++) {
        const fbPost = postsData[i];
        const engagement = engagements[i];
        // Normalize post data
        const post: SocialPost = {
          user_id: account.user_id,
          account_id: account.id!,
          platform_post_id: fbPost.id,
          platform_type: 'facebook',
          content: fbPost.message || fbPost.story || '',
          content_type: this.determineContentType(fbPost),
          media_urls: this.extractMediaUrls(fbPost),
          permalink: fbPost.permalink_url || `https://www.facebook.com/${pageId}/posts/${fbPost.id}`,
          published_at: new Date(fbPost.created_time),
          created_at: new Date(fbPost.created_time),
          updated_at: fbPost.updated_time ? new Date(fbPost.updated_time) : undefined,
          metadata: fbPost,
        };

        posts.push(post);

        // Store engagement metrics if available (already fetched in parallel above)
        if (engagement) {
          const metrics: PostEngagementMetrics = {
            post_id: 0, // Will be updated after post is saved
            likes_count: engagement.reactions?.summary?.total_count || 0,
            comments_count: engagement.comments?.summary?.total_count || 0,
            shares_count: engagement.shares?.count || 0,
            views_count: 0, // Facebook doesn't provide views in standard API
            impressions_count: 0,
            reach_count: 0,
            engagement_rate: 0,
          };
          // Calculate engagement rate if we have impressions
          if (fbPost.insights) {
            const impressions = fbPost.insights.data.find((i: any) => i.name === 'post_impressions');
            const reach = fbPost.insights.data.find((i: any) => i.name === 'post_reach');
            if (impressions) {
              metrics.impressions_count = impressions.values[0]?.value || 0;
            }
            if (reach) {
              metrics.reach_count = reach.values[0]?.value || 0;
            }
            if (metrics.impressions_count && metrics.impressions_count > 0) {
              const totalEngagement = (metrics.likes_count || 0) + (metrics.comments_count || 0) + (metrics.shares_count || 0);
              metrics.engagement_rate = (totalEngagement / metrics.impressions_count) * 100;
            }
          }
          engagementMetrics.set(i, metrics); // Use index to map to post
        }
      }

      followerMetrics.posts_count = posts.length;

      return {
        posts,
        engagementMetrics,
        followerMetrics,
      };
    } catch (error) {
      console.error('Error collecting Facebook data:', error);
      throw error;
    }
  }

  /**
   * Get page information
   */
  private async getPageInfo(pageId: string): Promise<any> {
    try {
      const response = await this.api.get(`/${pageId}`, {
        params: {
          fields: 'id,name,fan_count,followers_count',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching page info:', error);
      throw error;
    }
  }

  /**
   * Get posts from Facebook page
   */
  private async getPosts(
    pageId: string,
    options: { limit?: number; since?: Date } = {}
  ): Promise<FacebookPost[]> {
    const posts: FacebookPost[] = [];
    const limit = options.limit || 25;
    let url = `/${pageId}/posts`;
    let collected = 0;

    try {
      const params: any = {
        fields: 'id,message,story,created_time,updated_time,permalink_url,attachments',
        limit: Math.min(limit, 100),
      };

      if (options.since) {
        params.since = Math.floor(options.since.getTime() / 1000);
      }

      while (collected < limit) {
        const response = await this.api.get(url, { params });
        const data = response.data.data || [];
        
        posts.push(...data);
        collected += data.length;

        if (!response.data.paging?.next || collected >= limit) {
          break;
        }

        url = response.data.paging.next.replace(this.baseUrl, '');
        params.access_token = this.accessToken; // Ensure token is in next request
      }

      return posts.slice(0, limit);
    } catch (error) {
      console.error('Error fetching posts:', error);
      // Return partial results if we have any
      return posts;
    }
  }

  /**
   * Get engagement metrics for a specific post
   */
  private async getPostEngagement(postId: string): Promise<FacebookEngagement | null> {
    try {
      const response = await this.api.get(`/${postId}`, {
        params: {
          fields: 'reactions.summary(total_count),comments.summary(total_count),shares',
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching engagement for post ${postId}:`, error);
      return null;
    }
  }

  /**
   * Determine content type from post
   */
  private determineContentType(post: FacebookPost): SocialPost['content_type'] {
    if (post.attachments?.data) {
      const hasVideo = post.attachments.data.some(att => att.type === 'video');
      const hasMultiple = post.attachments.data.length > 1;
      
      if (hasMultiple) return 'carousel';
      if (hasVideo) return 'video';
      return 'image';
    }
    if (post.media?.video) return 'video';
    if (post.media?.image) return 'image';
    return 'text';
  }

  /**
   * Extract media URLs from post
   */
  private extractMediaUrls(post: FacebookPost): string[] {
    const urls: string[] = [];

    if (post.media?.image?.src) {
      urls.push(post.media.image.src);
    }
    if (post.media?.video?.src) {
      urls.push(post.media.video.src);
    }
    if (post.attachments?.data) {
      post.attachments.data.forEach(att => {
        if (att.media?.image?.src) {
          urls.push(att.media.image.src);
        }
        if (att.subattachments?.data) {
          att.subattachments.data.forEach(sub => {
            if (sub.media?.image?.src) {
              urls.push(sub.media.image.src);
            }
          });
        }
      });
    }

    return urls;
  }
}

export default FacebookService;

