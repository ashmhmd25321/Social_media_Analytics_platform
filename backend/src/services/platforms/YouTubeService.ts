import axios, { AxiosInstance } from 'axios';
import { UserSocialAccount } from '../../models/SocialPlatform';
import { SocialPost, PostEngagementMetrics, FollowerMetrics } from '../../models/Post';
import { PlatformData } from '../DataCollectionService';

export interface YouTubeVideo {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
    channelId: string;
    channelTitle: string;
    tags?: string[];
  };
  statistics?: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
    favoriteCount: string;
  };
  contentDetails?: {
    duration: string;
  };
}

export interface YouTubeChannel {
  id: string;
  snippet: {
    title: string;
    description: string;
    customUrl?: string;
    thumbnails: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
  };
  statistics?: {
    subscriberCount: string;
    videoCount: string;
    viewCount: string;
  };
}

class YouTubeService {
  private api: AxiosInstance;
  private accessTokenOrKey: string;
  private baseUrl = 'https://www.googleapis.com/youtube/v3';
  private isApiKey: boolean;

  constructor(accessTokenOrKey: string) {
    this.accessTokenOrKey = accessTokenOrKey;
    // API keys start with "AIza", OAuth tokens are longer and different format
    this.isApiKey = accessTokenOrKey.startsWith('AIza');
    
    this.api = axios.create({
      baseURL: this.baseUrl,
    });
  }

  /**
   * Get authentication params for requests
   */
  private getAuthParams(): { key?: string; access_token?: string } {
    if (this.isApiKey) {
      return { key: this.accessTokenOrKey };
    } else {
      return { access_token: this.accessTokenOrKey };
    }
  }

  /**
   * Collect data from YouTube
   */
  async collectData(
    account: UserSocialAccount,
    options: { limit?: number; since?: Date } = {}
  ): Promise<PlatformData> {
    try {
      const limit = options.limit || 25;
      const posts: SocialPost[] = [];
      const engagementMetrics = new Map<number, PostEngagementMetrics>();
      
      // Get channel info
      const channelInfo = await this.getChannelInfo(account.platform_account_id);
      const followerMetrics: FollowerMetrics | undefined = channelInfo 
        ? {
            account_id: account.id!,
            followers_count: parseInt(channelInfo.statistics?.subscriberCount || '0'),
            following_count: 0, // YouTube doesn't provide this
            posts_count: parseInt(channelInfo.statistics?.videoCount || '0'),
            recorded_at: new Date(),
          }
        : undefined;

      // Get videos from channel
      const videos = await this.getChannelVideos(account.platform_account_id, limit, options.since);
      
      for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        
        // Normalize to SocialPost format
        const post: SocialPost = {
          user_id: account.user_id,
          account_id: account.id!,
          platform_post_id: video.id,
          platform_type: 'youtube',
          content: video.snippet.description || video.snippet.title,
          content_type: 'video',
          media_urls: video.snippet.thumbnails.high?.url 
            ? [video.snippet.thumbnails.high.url] 
            : [],
          permalink: `https://www.youtube.com/watch?v=${video.id}`,
          published_at: new Date(video.snippet.publishedAt),
          created_at: new Date(video.snippet.publishedAt),
          updated_at: new Date(),
          metadata: {
            videoId: video.id,
            channelId: video.snippet.channelId,
            channelTitle: video.snippet.channelTitle,
            duration: video.contentDetails?.duration,
            tags: video.snippet.tags || [],
          },
        };

        posts.push(post);

        // Create engagement metrics
        const metrics: PostEngagementMetrics = {
          post_id: 0, // Will be set after post is saved
          likes_count: parseInt(video.statistics?.likeCount || '0'),
          comments_count: parseInt(video.statistics?.commentCount || '0'),
          shares_count: 0, // YouTube API doesn't provide shares separately
          saves_count: parseInt(video.statistics?.favoriteCount || '0'),
          views_count: parseInt(video.statistics?.viewCount || '0'),
          clicks_count: 0,
          impressions_count: parseInt(video.statistics?.viewCount || '0'),
          reach_count: parseInt(video.statistics?.viewCount || '0'),
          engagement_rate: 0, // Will be calculated
        };

        // Calculate engagement rate
        const totalEngagement = metrics.likes_count + metrics.comments_count + metrics.saves_count;
        if (metrics.views_count > 0) {
          metrics.engagement_rate = (totalEngagement / metrics.views_count) * 100;
        }

        engagementMetrics.set(i, metrics);
      }

      return {
        posts,
        engagementMetrics,
        followerMetrics,
      };
    } catch (error: any) {
      console.error('Error collecting YouTube data:', error);
      throw new Error(`YouTube data collection failed: ${error.message}`);
    }
  }

  /**
   * Get channel information
   */
  private async getChannelInfo(channelId: string): Promise<YouTubeChannel | null> {
    try {
      const response = await this.api.get('/channels', {
        params: {
          ...this.getAuthParams(),
          part: 'snippet,statistics',
          id: channelId,
        },
      });

      if (response.data.items && response.data.items.length > 0) {
        return response.data.items[0];
      }
      return null;
    } catch (error: any) {
      console.error('Error fetching YouTube channel info:', error);
      return null;
    }
  }

  /**
   * Get videos from a channel
   */
  private async getChannelVideos(
    channelId: string,
    limit: number = 25,
    since?: Date
  ): Promise<YouTubeVideo[]> {
    try {
      const allVideos: YouTubeVideo[] = [];
      let nextPageToken: string | undefined;

      // First, get the uploads playlist ID from channel
      const channelResponse = await this.api.get('/channels', {
        params: {
          ...this.getAuthParams(),
          part: 'contentDetails',
          id: channelId,
        },
      });

      const uploadsPlaylistId = channelResponse.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
      
      if (!uploadsPlaylistId) {
        console.warn('Could not find uploads playlist for channel');
        return [];
      }

      // Get videos from uploads playlist
      do {
        const response = await this.api.get('/playlistItems', {
          params: {
            ...this.getAuthParams(),
            part: 'snippet,contentDetails',
            playlistId: uploadsPlaylistId,
            maxResults: Math.min(limit - allVideos.length, 50),
            pageToken: nextPageToken,
          },
        });

        const items = response.data.items || [];
        const videoIds = items.map((item: any) => item.contentDetails.videoId).filter(Boolean);

        if (videoIds.length > 0) {
          // Get detailed video information including statistics
          const videosResponse = await this.api.get('/videos', {
            params: {
              ...this.getAuthParams(),
              part: 'snippet,statistics,contentDetails',
              id: videoIds.join(','),
            },
          });

          const videos = videosResponse.data.items || [];
          
          // Filter by date if specified
          if (since) {
            const filtered = videos.filter((video: YouTubeVideo) => {
              const publishedAt = new Date(video.snippet.publishedAt);
              return publishedAt >= since;
            });
            allVideos.push(...filtered);
          } else {
            allVideos.push(...videos);
          }
        }

        nextPageToken = response.data.nextPageToken;
      } while (nextPageToken && allVideos.length < limit);

      return allVideos.slice(0, limit);
    } catch (error: any) {
      console.error('Error fetching YouTube videos:', error);
      if (error.response?.status === 403) {
        throw new Error('YouTube API quota exceeded or access denied. Check your API key/token permissions.');
      }
      throw error;
    }
  }

  /**
   * Verify account connection
   */
  async verifyConnection(): Promise<boolean> {
    try {
      // For API keys, we can't verify a specific account, but we can test the key
      if (this.isApiKey) {
        // Test with a simple API call
        await this.api.get('/videos', {
          params: {
            ...this.getAuthParams(),
            part: 'snippet',
            id: 'dQw4w9WgXcQ', // A well-known video ID for testing
          },
        });
        return true;
      } else {
        // For OAuth tokens, get user's channel
        const response = await this.api.get('/channels', {
          params: {
            ...this.getAuthParams(),
            part: 'snippet',
            mine: true,
          },
        });
        return response.data.items && response.data.items.length > 0;
      }
    } catch (error) {
      console.error('YouTube connection verification failed:', error);
      return false;
    }
  }
}

export default YouTubeService;

