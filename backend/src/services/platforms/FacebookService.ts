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
  private instagramApi: AxiosInstance;
  private accessToken: string;
  private baseUrl = 'https://graph.facebook.com/v18.0';
  private instagramBaseUrl = 'https://graph.instagram.com';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.api = axios.create({
      baseURL: this.baseUrl,
      params: {
        access_token: accessToken,
      },
    });
    this.instagramApi = axios.create({
      baseURL: this.instagramBaseUrl,
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

    // Determine if this is Instagram or Facebook
    const accountWithPlatform = account as UserSocialAccount & { platform_name?: string; platform_type?: string };
    const platformType = (accountWithPlatform.platform_type || accountWithPlatform.platform_name || 'facebook').toLowerCase();
    const isInstagram = platformType === 'instagram';

    try {
      if (isInstagram) {
        // For Instagram, we need to use a Page Access Token
        // First, get the Page Access Token from the Facebook Page linked to Instagram
        const instagramAccountId = account.platform_account_id;
        let pageAccessToken = this.accessToken;
        
        // Try to get Page Access Token if we have a user token
        // Instagram Business accounts require a Page Access Token
        try {
          const pagesResponse = await this.api.get('/me/accounts', {
            params: {
              fields: 'id,name,access_token,instagram_business_account{id}',
            },
          });
          
          const pages = pagesResponse.data.data || [];
          // Find the page that has this Instagram account
          const pageWithInstagram = pages.find((page: any) => 
            page.instagram_business_account?.id === instagramAccountId
          );
          
          if (pageWithInstagram?.access_token) {
            pageAccessToken = pageWithInstagram.access_token;
            // Update the access token for Instagram API calls
            this.accessToken = pageAccessToken;
            // Recreate the API instance with the page token
            this.api = axios.create({
              baseURL: this.baseUrl,
              params: {
                access_token: pageAccessToken,
              },
            });
            console.log(`[FacebookService] Using Page Access Token for Instagram account ${instagramAccountId}`);
          } else {
            console.warn(`[FacebookService] Could not find Page with Instagram account ${instagramAccountId}, using provided token`);
          }
        } catch (pagesError: any) {
          console.warn('[FacebookService] Could not fetch Page Access Token, using provided token:', pagesError.message);
          // Continue with the provided token
        }
        
        const instagramData = await this.getInstagramData(instagramAccountId, options);
        
        followerMetrics = {
          account_id: account.id!,
          follower_count: instagramData.followerCount || 0,
          posts_count: 0,
        };

        const postsData = instagramData.posts;
        
        // Get engagement metrics for all posts in parallel
        const engagementPromises = postsData.map((post: any) => 
          this.getInstagramPostEngagement(post.id).catch((err: any) => {
            console.error(`Error fetching engagement for Instagram post ${post.id}:`, err);
            return null;
          })
        );
        const engagements = await Promise.all(engagementPromises);
        
        for (let i = 0; i < postsData.length; i++) {
          const igPost = postsData[i];
          const engagement = engagements[i];
          
          // Normalize Instagram post data
          const post: SocialPost = {
            user_id: account.user_id,
            account_id: account.id!,
            platform_post_id: igPost.id,
            platform_type: 'instagram', // Correct platform type - MUST be 'instagram'
            content: igPost.caption || '',
            content_type: igPost.media_type === 'VIDEO' ? 'video' : 'image',
            media_urls: igPost.media_url ? [igPost.media_url] : [],
            permalink: igPost.permalink || `https://www.instagram.com/p/${igPost.id}/`,
            published_at: new Date(igPost.timestamp),
            created_at: new Date(igPost.timestamp),
            updated_at: undefined,
            metadata: igPost,
          };

          console.log(`[FacebookService] Creating Instagram post: ${post.platform_post_id}, platform_type: ${post.platform_type}, account_id: ${post.account_id}`);
          posts.push(post);

          // Store engagement metrics if available
          if (engagement) {
            const metrics: PostEngagementMetrics = {
              post_id: 0, // Will be updated after post is saved
              likes_count: engagement.like_count || 0,
              comments_count: engagement.comments_count || 0,
              shares_count: 0, // Instagram doesn't have shares
              views_count: engagement.media_type === 'VIDEO' ? (engagement.video_views || 0) : 0,
              impressions_count: 0,
              reach_count: 0,
              engagement_rate: 0,
            };
            
            // Calculate engagement rate if we have follower count
            if (followerMetrics && followerMetrics.follower_count && followerMetrics.follower_count > 0) {
              const totalEngagement = (metrics.likes_count || 0) + (metrics.comments_count || 0);
              metrics.engagement_rate = (totalEngagement / followerMetrics.follower_count) * 100;
            }
            
            engagementMetrics.set(i, metrics);
          }
        }

        followerMetrics.posts_count = posts.length;

        return {
          posts,
          engagementMetrics,
          followerMetrics,
        };
      }

      // For Facebook, use Facebook Graph API
      // Get page/account info
      let pageId = account.platform_account_id;
      let pageInfo: any;

      // Try to get page info - if it fails, it might be a user ID, so get their pages
      try {
        pageInfo = await this.getPageInfo(pageId);
      } catch (error: any) {
        // If we get a 400 error, it might be a user ID instead of a page ID
        // Try to get the user's pages
        if (error.response?.status === 400 || error.message?.includes('400')) {
          console.log(`[FacebookService] Account ID ${pageId} appears to be a user ID, fetching pages...`);
          try {
            const pagesResponse = await this.api.get('/me/accounts', {
              params: {
                fields: 'id,name,fan_count,followers_count,access_token',
              },
            });

            const pages = pagesResponse.data.data || [];
            if (pages.length === 0) {
              throw new Error('No Facebook Pages found for this account. Please connect a Facebook Page, not a personal profile.');
            }

            // Use the first page
            const firstPage = pages[0];
            pageId = firstPage.id;
            pageInfo = firstPage;
            
            // Update the access token if we got a page token (more permissions)
            if (firstPage.access_token) {
              this.accessToken = firstPage.access_token;
              this.api = axios.create({
                baseURL: this.baseUrl,
                params: {
                  access_token: firstPage.access_token,
                },
              });
            }

            console.log(`[FacebookService] Using Facebook Page: ${pageInfo.name} (ID: ${pageId})`);
          } catch (pagesError: any) {
            console.error('[FacebookService] Error fetching user pages:', pagesError);
            
            // Check for specific permission errors
            const errorMessage = pagesError.response?.data?.error?.message || pagesError.message || 'Unknown error';
            const errorCode = pagesError.response?.data?.error?.code;
            
            if (errorCode === 200 || errorMessage.includes('permission') || errorMessage.includes('scope')) {
              throw new Error(
                `Access token is missing required permissions. ` +
                `Please generate a new token with 'pages_show_list' and 'pages_read_engagement' permissions. ` +
                `See: https://developers.facebook.com/tools/explorer/ ` +
                `Error: ${errorMessage}`
              );
            }
            
            if (pagesError.response?.data?.data?.length === 0 || errorMessage.includes('No Facebook Pages')) {
              throw new Error(
                `No Facebook Pages found for this account. ` +
                `Make sure: 1) You have created a Facebook Page, 2) You are an admin of that Page, ` +
                `3) Your access token has 'pages_show_list' permission. ` +
                `Error: ${errorMessage}`
              );
            }
            
            throw new Error(`Failed to access Facebook Pages. Make sure your access token has 'pages_show_list' and 'pages_read_engagement' permissions. Error: ${errorMessage}`);
          }
        } else {
          // Re-throw if it's a different error
          throw error;
        }
      }

      followerMetrics = {
        account_id: account.id!,
        follower_count: pageInfo.fan_count || pageInfo.followers_count || 0,
        posts_count: 0,
      };

      // Get posts
      const postsData = await this.getPosts(pageId, options);
      
      // Get engagement metrics for all posts in parallel
      const engagementPromises = postsData.map((post: FacebookPost) => 
        this.getPostEngagement(post.id).catch((err: any) => {
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
          platform_type: 'facebook', // Correct platform type
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
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

  /**
   * Get Instagram account data (follower count and posts)
   * Note: Instagram Business accounts are accessed via Facebook Graph API, not Instagram Graph API
   */
  private async getInstagramData(
    instagramAccountId: string,
    options: { limit?: number; since?: Date } = {}
  ): Promise<{ followerCount: number; posts: any[] }> {
    try {
      // Get Instagram account info using Facebook Graph API
      // Instagram Business accounts are accessed through Facebook Graph API
      // Note: account_type is not available for IGUser, only id, username, media_count, followers_count
      const accountResponse = await this.api.get(`/${instagramAccountId}`, {
        params: {
          fields: 'id,username,media_count,followers_count',
        },
      });
      
      const followerCount = accountResponse.data.followers_count || 0;

      // Get Instagram media (posts)
      const posts: any[] = [];
      const limit = options.limit || 25;
      let url = `/${instagramAccountId}/media`;
      let collected = 0;

      const params: any = {
        fields: 'id,caption,media_type,media_url,permalink,timestamp,thumbnail_url',
        limit: Math.min(limit, 100),
      };

      while (collected < limit) {
        // Use Facebook Graph API for Instagram media endpoints
        const response = await this.api.get(url, { 
          params: params
        });
        const data = response.data.data || [];
        
        posts.push(...data);
        collected += data.length;

        if (!response.data.paging?.next || collected >= limit) {
          break;
        }

        // Extract URL from paging.next
        const nextUrl = new URL(response.data.paging.next);
        url = nextUrl.pathname + nextUrl.search;
      }

      return {
        followerCount,
        posts: posts.slice(0, limit),
      };
    } catch (error: any) {
      console.error('Error fetching Instagram data:', error);
      throw new Error(`Failed to fetch Instagram data: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Get engagement metrics for an Instagram post
   */
  private async getInstagramPostEngagement(postId: string): Promise<any> {
    try {
      // Use Facebook Graph API for Instagram post endpoints
      const response = await this.api.get(`/${postId}`, {
        params: {
          fields: 'id,like_count,comments_count,media_type',
        },
      });
      
      const data = response.data;
      
      // For videos, try to get video views
      let videoViews = 0;
      if (data.media_type === 'VIDEO') {
        try {
          const insightsResponse = await this.api.get(`/${postId}/insights`, {
            params: {
              metric: 'video_views',
            },
          });
          videoViews = insightsResponse.data.data?.[0]?.values?.[0]?.value || 0;
        } catch (insightsError) {
          console.warn(`Could not fetch video views for post ${postId}:`, insightsError);
        }
      }
      
      return {
        like_count: data.like_count || 0,
        comments_count: data.comments_count || 0,
        media_type: data.media_type,
        video_views: videoViews,
      };
    } catch (error: any) {
      console.error(`Error fetching engagement for Instagram post ${postId}:`, error);
      return null;
    }
  }
}

export default FacebookService;

