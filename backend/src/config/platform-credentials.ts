import dotenv from 'dotenv';

dotenv.config();

/**
 * Platform API Credentials Configuration
 * These are default system-level credentials that can be used
 * when users haven't connected their own accounts.
 * 
 * Users can still connect their own accounts for personal data access.
 */

export interface PlatformCredentials {
  facebook?: {
    accessToken: string;
    pageId?: string;
  };
  instagram?: {
    accessToken: string;
    accountId?: string;
  };
  youtube?: {
    apiKey: string;
    channelId?: string;
  };
}

/**
 * Get default platform credentials from environment variables
 * These can be overridden by user-specific account connections
 */
export const getPlatformCredentials = (): PlatformCredentials => {
  return {
    facebook: process.env.FACEBOOK_ACCESS_TOKEN ? {
      accessToken: process.env.FACEBOOK_ACCESS_TOKEN,
      pageId: process.env.FACEBOOK_PAGE_ID,
    } : undefined,
    
    instagram: process.env.INSTAGRAM_ACCESS_TOKEN ? {
      accessToken: process.env.INSTAGRAM_ACCESS_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN, // Instagram uses Facebook token
      accountId: process.env.INSTAGRAM_ACCOUNT_ID,
    } : undefined,
    
    youtube: process.env.YOUTUBE_API_KEY ? {
      apiKey: process.env.YOUTUBE_API_KEY,
      channelId: process.env.YOUTUBE_CHANNEL_ID,
    } : undefined,
  };
};

/**
 * Get credential for a specific platform
 */
export const getPlatformCredential = (platformName: string): string | null => {
  const credentials = getPlatformCredentials();
  const platform = platformName.toLowerCase();

  if (platform === 'facebook' || platform === 'instagram') {
    return credentials.facebook?.accessToken || credentials.instagram?.accessToken || null;
  }

  if (platform === 'youtube') {
    return credentials.youtube?.apiKey || null;
  }

  return null;
};

/**
 * Check if default credentials are available for a platform
 */
export const hasDefaultCredential = (platformName: string): boolean => {
  return getPlatformCredential(platformName) !== null;
};

