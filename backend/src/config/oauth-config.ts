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
    twitter: {
      clientId: process.env.TWITTER_CLIENT_ID || '',
      clientSecret: process.env.TWITTER_CLIENT_SECRET || '',
      redirectUri,
      scopes: ['tweet.read', 'users.read', 'offline.access'],
    },
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
      redirectUri,
      scopes: ['r_liteprofile', 'r_emailaddress', 'w_member_social'],
    },
    youtube: {
      clientId: process.env.YOUTUBE_CLIENT_ID || '',
      clientSecret: process.env.YOUTUBE_CLIENT_SECRET || '',
      redirectUri,
      scopes: ['https://www.googleapis.com/auth/youtube.readonly', 'https://www.googleapis.com/auth/youtube.force-ssl'],
    },
    tiktok: {
      clientId: process.env.TIKTOK_CLIENT_ID || '',
      clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
      redirectUri,
      scopes: ['user.info.basic', 'video.list'],
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

