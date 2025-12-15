import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export const getOAuthConfig = (platform: string): OAuthConfig => {
  // OAuth callback is handled by backend, so use backend URL
  const backendUrl = process.env.BACKEND_URL || process.env.PORT 
    ? `http://localhost:${process.env.PORT || 5001}` 
    : 'http://localhost:5001';
  const redirectUri = `${backendUrl}/api/social/callback/${platform}`;

  const configs: Record<string, OAuthConfig> = {
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
      redirectUri,
      scopes: ['pages_show_list', 'pages_read_engagement', 'instagram_basic', 'instagram_manage_insights'],
    },
    instagram: {
      clientId: process.env.INSTAGRAM_CLIENT_ID || '',
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || '',
      redirectUri,
      scopes: ['user_profile', 'user_media'],
    },
    youtube: {
      clientId: process.env.YOUTUBE_CLIENT_ID || '',
      clientSecret: process.env.YOUTUBE_CLIENT_SECRET || '',
      redirectUri,
      scopes: ['https://www.googleapis.com/auth/youtube.readonly', 'https://www.googleapis.com/auth/youtube.force-ssl'],
    },
  };

  return configs[platform.toLowerCase()] || {
    clientId: '',
    clientSecret: '',
    redirectUri,
    scopes: [],
  };
};

export const generateStateToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Get default API credentials for platforms (from environment variables)
 * 
 * NOTE: 
 * - YouTube API key is general (not user-specific) and can be used for all users
 * - Facebook/Instagram tokens are user-specific and should NOT be shared
 * - Users should connect their own accounts via OAuth for Facebook/Instagram
 */
export const getDefaultPlatformCredentials = () => {
  return {
    facebook: {
      // Optional: Default Facebook access token
      // WARNING: Using this means all users see the same account's data
      // For production, leave empty and use OAuth so each user connects their own account
      accessToken: process.env.FACEBOOK_ACCESS_TOKEN || '',
      pageId: process.env.FACEBOOK_PAGE_ID || '',
    },
    instagram: {
      // Optional: Default Instagram access token (can use Facebook token for Instagram)
      // WARNING: Using this means all users see the same account's data
      // For production, leave empty and use OAuth so each user connects their own account
      accessToken: process.env.INSTAGRAM_ACCESS_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN || '',
      accountId: process.env.INSTAGRAM_ACCOUNT_ID || '',
    },
    youtube: {
      // API key is general (not tied to specific account) - safe to use for all users
      apiKey: process.env.YOUTUBE_API_KEY || '',
      channelId: process.env.YOUTUBE_CHANNEL_ID || '',
    },
  };
};

