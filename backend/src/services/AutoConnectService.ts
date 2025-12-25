/**
 * Auto-Connect Service
 * Automatically connects default platform accounts for new users
 * using system-level API keys/tokens from environment variables
 */
import { getDefaultPlatformCredentials } from '../config/oauth-config';
import SocialAccountModel from '../models/SocialPlatform';

export class AutoConnectService {
  /**
   * Automatically connect default platform accounts for a user
   * NOTE: Only connects YouTube with API key (general access)
   * Facebook/Instagram require users to connect their own accounts via OAuth
   * to ensure each user sees their own data.
   */
  static async autoConnectPlatformsForUser(userId: number): Promise<void> {
    try {
      const defaultCreds = getDefaultPlatformCredentials();
      
      // Get all available platforms
      const platforms = await SocialAccountModel.platform.findAll();
      
      for (const platform of platforms) {
        const platformName = platform.name.toLowerCase();
        
        // Check if user already has this platform connected
        const existingAccount = await SocialAccountModel.account.findByUserIdAndPlatform(
          userId,
          platform.id!
        );
        
        if (existingAccount) {
          // User already has this platform connected, skip
          continue;
        }
        
        // Only auto-connect YouTube (API key is general, not user-specific)
        // Facebook/Instagram require OAuth so each user connects their own account
        if (platformName === 'youtube' && defaultCreds.youtube.apiKey && defaultCreds.youtube.channelId) {
          await this.connectYouTubeAccount(userId, platform.id!, defaultCreds.youtube);
        }
        // Note: Facebook and Instagram are skipped - users must connect their own accounts
      }
    } catch (error) {
      console.error('Error auto-connecting platforms for user:', error);
      // Don't throw - auto-connect is optional
    }
  }

  /**
   * Connect Facebook account with default credentials
   */
  private static async connectFacebookAccount(
    userId: number,
    platformId: number,
    credentials: { accessToken: string; pageId?: string }
  ): Promise<void> {
    try {
      // Fetch user info to get account ID and name
      // Note: 'username' field is deprecated in v2.0+, so we only request id, name, and picture
      const response = await fetch(
        `https://graph.facebook.com/v18.0/me?access_token=${credentials.accessToken}&fields=id,name,picture`
      );
      
      if (!response.ok) {
        console.warn('Failed to fetch Facebook account info for auto-connect');
        return;
      }

      const data = await response.json() as {
        id?: string;
        name?: string;
        username?: string;
        picture?: {
          data?: {
            url?: string;
          };
        };
      };

      const accountId = credentials.pageId || data.id || 'default';
      
      // Create account connection
      await SocialAccountModel.account.create({
        user_id: userId,
        platform_id: platformId,
        platform_account_id: accountId,
        platform_username: data.username,
        platform_display_name: data.name,
        access_token: credentials.accessToken,
        account_status: 'connected',
        profile_picture_url: data.picture?.data?.url,
        metadata: {
          auto_connected: true,
          connected_at: new Date().toISOString(),
        },
      });

      console.log(`Auto-connected Facebook account for user ${userId}`);
    } catch (error) {
      console.error('Error connecting Facebook account:', error);
    }
  }

  /**
   * Connect Instagram account with default credentials
   */
  private static async connectInstagramAccount(
    userId: number,
    platformId: number,
    credentials: { accessToken: string; accountId?: string }
  ): Promise<void> {
    try {
      // For Instagram, we can use the account ID or fetch it
      const accountId = credentials.accountId || 'default';
      
      // Try to fetch account info
      let username = '';
      let displayName = '';
      
      if (credentials.accountId) {
        try {
          const response = await fetch(
            `https://graph.instagram.com/${credentials.accountId}?fields=username&access_token=${credentials.accessToken}`
          );
          if (response.ok) {
            const data = await response.json() as { username?: string };
            username = data.username || '';
            displayName = data.username || '';
          }
        } catch (error) {
          // Ignore errors
        }
      }

      // Create account connection
      await SocialAccountModel.account.create({
        user_id: userId,
        platform_id: platformId,
        platform_account_id: accountId,
        platform_username: username,
        platform_display_name: displayName,
        access_token: credentials.accessToken,
        account_status: 'connected',
        metadata: {
          auto_connected: true,
          connected_at: new Date().toISOString(),
        },
      });

      console.log(`Auto-connected Instagram account for user ${userId}`);
    } catch (error) {
      console.error('Error connecting Instagram account:', error);
    }
  }

  /**
   * Connect YouTube account with default credentials
   */
  private static async connectYouTubeAccount(
    userId: number,
    platformId: number,
    credentials: { apiKey: string; channelId?: string }
  ): Promise<void> {
    try {
      if (!credentials.channelId) {
        console.warn('YouTube channel ID not provided for auto-connect');
        return;
      }

      // Fetch channel info using API key
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${credentials.channelId}&key=${credentials.apiKey}`
      );

      if (!response.ok) {
        console.warn('Failed to fetch YouTube channel info for auto-connect');
        return;
      }

      const data = await response.json() as {
        items?: Array<{
          id?: string;
          snippet?: {
            title?: string;
            customUrl?: string;
            thumbnails?: {
              default?: { url?: string };
            };
          };
        }>;
      };

      const channel = data.items?.[0];
      if (!channel) {
        console.warn('YouTube channel not found');
        return;
      }

      // Create account connection
      await SocialAccountModel.account.create({
        user_id: userId,
        platform_id: platformId,
        platform_account_id: credentials.channelId,
        platform_username: channel.snippet?.customUrl || channel.snippet?.title,
        platform_display_name: channel.snippet?.title,
        access_token: credentials.apiKey, // Store API key as access_token for YouTube
        account_status: 'connected',
        profile_picture_url: channel.snippet?.thumbnails?.default?.url,
        metadata: {
          auto_connected: true,
          connected_at: new Date().toISOString(),
        },
      });

      console.log(`Auto-connected YouTube account for user ${userId}`);
    } catch (error) {
      console.error('Error connecting YouTube account:', error);
    }
  }

  /**
   * Get or create account for user with default credentials (fallback)
   */
  static async getOrCreateAccountForUser(
    userId: number,
    platformName: string
  ): Promise<any | null> {
    try {
      const platform = await SocialAccountModel.platform.findByName(platformName);
      if (!platform) {
        return null;
      }

      // Check if user has account
      let account = await SocialAccountModel.account.findByUserIdAndPlatform(
        userId,
        platform.id!
      );

      if (account) {
        return account;
      }

      // Try to auto-connect with default credentials
      const defaultCreds = getDefaultPlatformCredentials();
      const platformLower = platformName.toLowerCase();

      if (platformLower === 'facebook' && defaultCreds.facebook.accessToken) {
        await this.connectFacebookAccount(userId, platform.id!, defaultCreds.facebook);
        return await SocialAccountModel.account.findByUserIdAndPlatform(userId, platform.id!);
      } else if (platformLower === 'instagram' && defaultCreds.instagram.accessToken) {
        await this.connectInstagramAccount(userId, platform.id!, defaultCreds.instagram);
        return await SocialAccountModel.account.findByUserIdAndPlatform(userId, platform.id!);
      } else if (platformLower === 'youtube' && defaultCreds.youtube.apiKey) {
        await this.connectYouTubeAccount(userId, platform.id!, defaultCreds.youtube);
        return await SocialAccountModel.account.findByUserIdAndPlatform(userId, platform.id!);
      }

      return null;
    } catch (error) {
      console.error('Error getting/creating account for user:', error);
      return null;
    }
  }
}

