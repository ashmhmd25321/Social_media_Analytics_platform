import { Request, Response } from 'express';
import { generateStateToken, getOAuthConfig } from '../config/oauth-config';
import SocialAccountModel, { OAuthStateModelInstance } from '../models/SocialPlatform';
import { AuthRequest } from '../middleware/auth';

type AuthenticatedRequest = AuthRequest;

/**
 * Get all available social media platforms
 */
export const getPlatforms = async (req: Request, res: Response) => {
  try {
    const platforms = await SocialAccountModel.platform.findAll();
    res.status(200).json({
      success: true,
      data: platforms,
    });
  } catch (error) {
    console.error('Error fetching platforms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch platforms',
    });
  }
};

/**
 * Initiate OAuth flow for a platform
 */
export const initiateOAuth = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const { platformName } = req.params;
    const platform = await SocialAccountModel.platform.findByName(platformName);

    if (!platform) {
      return res.status(404).json({
        success: false,
        message: 'Platform not found',
      });
    }

    const oauthConfig = getOAuthConfig(platformName);
    if (!oauthConfig.clientId) {
      return res.status(400).json({
        success: false,
        message: 'Platform OAuth not configured',
      });
    }

    // Generate state token for CSRF protection
    const stateToken = generateStateToken();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await OAuthStateModelInstance.create({
      user_id: userId,
      platform_id: platform.id!,
      state_token: stateToken,
      redirect_uri: oauthConfig.redirectUri,
      expires_at: expiresAt,
    });

    // Build OAuth authorization URL
    const authUrl = new URL(platform.oauth_auth_url || '');
    authUrl.searchParams.set('client_id', oauthConfig.clientId);
    authUrl.searchParams.set('redirect_uri', oauthConfig.redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', oauthConfig.scopes.join(' '));
    authUrl.searchParams.set('state', stateToken);

    res.status(200).json({
      success: true,
      data: {
        authUrl: authUrl.toString(),
        stateToken,
      },
    });
  } catch (error) {
    console.error('Error initiating OAuth:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate OAuth flow',
    });
  }
};

/**
 * Handle OAuth callback
 */
export const handleOAuthCallback = async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;
    const { platformName } = req.params;

    if (!code || !state) {
      return res.status(400).json({
        success: false,
        message: 'Missing authorization code or state',
      });
    }

    // Verify state token
    const stateRecord = await OAuthStateModelInstance.findByToken(state as string);
    if (!stateRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired state token',
      });
    }

    const platform = await SocialAccountModel.platform.findById(stateRecord.platform_id);
    if (!platform) {
      return res.status(404).json({
        success: false,
        message: 'Platform not found',
      });
    }

    const oauthConfig = getOAuthConfig(platformName);
    
    // Exchange authorization code for access token
    // Facebook-specific token exchange
    let tokenData: {
      access_token: string;
      token_type?: string;
      expires_in?: number;
      refresh_token?: string;
    };

    if (platformName.toLowerCase() === 'facebook') {
      // Facebook uses GET with query params for token exchange
      const tokenUrl = new URL(platform.oauth_token_url || '');
      tokenUrl.searchParams.set('client_id', oauthConfig.clientId);
      tokenUrl.searchParams.set('client_secret', oauthConfig.clientSecret);
      tokenUrl.searchParams.set('redirect_uri', oauthConfig.redirectUri);
      tokenUrl.searchParams.set('code', code as string);

      const fbTokenResponse = await fetch(tokenUrl.toString());
      
      if (!fbTokenResponse.ok) {
        const errorText = await fbTokenResponse.text();
        console.error('Facebook token exchange error:', errorText);
        throw new Error(`Failed to exchange code for token: ${errorText}`);
      }

      // Facebook returns JSON or URL-encoded string
      const responseText = await fbTokenResponse.text();
      let responseData: any;
      
      try {
        responseData = JSON.parse(responseText);
      } catch {
        // If not JSON, parse as URL-encoded
        const urlParams = new URLSearchParams(responseText);
        responseData = {
          access_token: urlParams.get('access_token'),
          expires_in: urlParams.get('expires_in'),
        };
      }
      
      if (responseData.error) {
        throw new Error(`Facebook API error: ${responseData.error.message || responseData.error}`);
      }
      
      tokenData = {
        access_token: responseData.access_token || '',
        expires_in: responseData.expires_in ? parseInt(responseData.expires_in) : undefined,
      };
    } else {
      // Generic OAuth 2.0 token exchange (POST)
      const tokenResponse = await fetch(platform.oauth_token_url || '', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: oauthConfig.clientId,
          client_secret: oauthConfig.clientSecret,
          code: code as string,
          redirect_uri: oauthConfig.redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token exchange error:', errorText);
        throw new Error(`Failed to exchange code for token: ${errorText}`);
      }

      tokenData = await tokenResponse.json() as {
        access_token: string;
        token_type?: string;
        expires_in?: number;
        refresh_token?: string;
      };
    }

    if (!tokenData.access_token) {
      throw new Error('No access token received from platform');
    }

    // For Facebook: Fetch user's pages to get page ID
    let platformAccountId = 'temp_id';
    let platformUsername = '';
    let platformDisplayName = '';
    let profilePictureUrl = '';

    if (platformName.toLowerCase() === 'facebook') {
      try {
        // First, get user's pages
        const pagesResponse = await fetch(
          `https://graph.facebook.com/v18.0/me/accounts?access_token=${tokenData.access_token}`
        );
        
        if (pagesResponse.ok) {
          const pagesData = await pagesResponse.json() as {
            data?: Array<{
              id: string;
              name?: string;
              username?: string;
            }>;
            error?: { message: string };
          };
          
          if (pagesData.error) {
            console.error('Facebook API error:', pagesData.error.message);
          } else if (pagesData.data && pagesData.data.length > 0) {
            // Use the first page
            const page = pagesData.data[0];
            platformAccountId = page.id;
            platformDisplayName = page.name || '';
            platformUsername = page.username || '';
            
            // Get page picture if available
            if (page.id) {
              try {
                const pictureResponse = await fetch(
                  `https://graph.facebook.com/v18.0/${page.id}/picture?type=large&redirect=false&access_token=${tokenData.access_token}`
                );
                if (pictureResponse.ok) {
                  const pictureData = await pictureResponse.json() as {
                    data?: { url?: string };
                  };
                  profilePictureUrl = pictureData.data?.url || '';
                }
              } catch (err) {
                console.error('Error fetching page picture:', err);
              }
            }
          } else {
            // No pages, try to get user info
            const userResponse = await fetch(
              `https://graph.facebook.com/v18.0/me?fields=id,name,picture&access_token=${tokenData.access_token}`
            );
            if (userResponse.ok) {
              const userData = await userResponse.json() as {
                id?: string;
                name?: string;
                picture?: {
                  data?: {
                    url?: string;
                  };
                };
                error?: { message: string };
              };
              
              if (userData.error) {
                console.error('Facebook API error:', userData.error.message);
              } else {
                platformAccountId = userData.id || 'temp_id';
                platformDisplayName = userData.name || '';
                if (userData.picture?.data?.url) {
                  profilePictureUrl = userData.picture.data.url;
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Error fetching Facebook page info:', err);
        // Continue with temp_id if page fetch fails
      }
    }

    // Save or update account connection
    const existingAccount = await SocialAccountModel.account.findByUserIdAndPlatform(
      stateRecord.user_id,
      platform.id!
    );

    if (existingAccount) {
      await SocialAccountModel.account.update(existingAccount.id!, {
        platform_account_id: platformAccountId,
        platform_username: platformUsername || undefined,
        platform_display_name: platformDisplayName || undefined,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || undefined,
        token_expires_at: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : undefined,
        profile_picture_url: profilePictureUrl || undefined,
        account_status: 'connected',
        is_active: true,
      });
    } else {
      await SocialAccountModel.account.create({
        user_id: stateRecord.user_id,
        platform_id: platform.id!,
        platform_account_id: platformAccountId,
        platform_username: platformUsername || undefined,
        platform_display_name: platformDisplayName || undefined,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || undefined,
        token_expires_at: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : undefined,
        profile_picture_url: profilePictureUrl || undefined,
        account_status: 'connected',
      });
    }

    // Clean up state token
    await OAuthStateModelInstance.delete(state as string);

    // Redirect to frontend success page
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings/accounts?success=true&platform=${platformName}`);
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    res.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings/accounts?error=connection_failed`
    );
  }
};

/**
 * Get user's connected accounts
 */
export const getConnectedAccounts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const accounts = await SocialAccountModel.account.findByUserId(userId);
    res.status(200).json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    console.error('Error fetching connected accounts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch connected accounts',
    });
  }
};

/**
 * Disconnect a social media account
 */
export const disconnectAccount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const { accountId } = req.params;
    const deleted = await SocialAccountModel.account.delete(parseInt(accountId));

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Account disconnected successfully',
    });
  } catch (error) {
    console.error('Error disconnecting account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect account',
    });
  }
};

