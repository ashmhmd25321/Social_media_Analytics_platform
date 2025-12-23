import axios from 'axios';
import { UserSocialAccount } from '../../models/SocialPlatform';
import SocialAccountModel from '../../models/SocialPlatform';

/**
 * Service to refresh expired OAuth tokens
 */
class TokenRefreshService {
  /**
   * Refresh YouTube/Google OAuth token
   */
  async refreshYouTubeToken(account: UserSocialAccount): Promise<string | null> {
    if (!account.refresh_token) {
      console.warn(`[TokenRefresh] No refresh token available for account ${account.id}`);
      return null;
    }

    try {
      const oauthConfig = (await import('../../config/oauth-config')).getOAuthConfig('youtube');
      
      const response = await axios.post('https://oauth2.googleapis.com/token', null, {
        params: {
          client_id: oauthConfig.clientId,
          client_secret: oauthConfig.clientSecret,
          refresh_token: account.refresh_token,
          grant_type: 'refresh_token',
        },
      });

      if (response.data.access_token) {
        const newAccessToken = response.data.access_token;
        const expiresIn = response.data.expires_in || 3600; // Default 1 hour
        
        // Update account with new token
        await SocialAccountModel.account.update(account.id!, {
          access_token: newAccessToken,
          token_expires_at: new Date(Date.now() + expiresIn * 1000),
          // Note: Google may or may not return a new refresh_token
          // If it does, update it; otherwise keep the existing one
          refresh_token: response.data.refresh_token || account.refresh_token,
        });

        console.log(`[TokenRefresh] Successfully refreshed YouTube token for account ${account.id}`);
        return newAccessToken;
      }

      return null;
    } catch (error: any) {
      console.error(`[TokenRefresh] Failed to refresh YouTube token for account ${account.id}:`, error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Check if token is expired or about to expire (within 5 minutes)
   */
  isTokenExpired(account: UserSocialAccount): boolean {
    if (!account.token_expires_at) {
      // If no expiry date, assume it might be expired (conservative approach)
      return true;
    }

    const expiresAt = new Date(account.token_expires_at);
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    return expiresAt <= fiveMinutesFromNow;
  }

  /**
   * Get valid access token, refreshing if necessary
   */
  async getValidAccessToken(account: UserSocialAccount): Promise<string | null> {
    // Check if token is expired
    if (this.isTokenExpired(account)) {
      console.log(`[TokenRefresh] Token expired for account ${account.id}, attempting refresh...`);
      
      if (account.platform_id) {
        const platform = await SocialAccountModel.platform.findById(account.platform_id);
        const platformName = platform?.name?.toLowerCase();

        if (platformName === 'youtube') {
          const newToken = await this.refreshYouTubeToken(account);
          if (newToken) {
            // Fetch updated account to get new token
            const updatedAccount = await SocialAccountModel.account.findById(account.id!);
            return updatedAccount?.access_token || null;
          }
        }
      }

      // If refresh failed, return null
      console.warn(`[TokenRefresh] Could not refresh token for account ${account.id}`);
      return null;
    }

    // Token is still valid
    return account.access_token || null;
  }
}

export default new TokenRefreshService();

