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
    console.log('[DEBUG] initiateOAuth called');
    console.log('[DEBUG] Request params:', req.params);
    console.log('[DEBUG] User:', req.user);
    
    const userId = req.user?.userId;
    if (!userId) {
      console.error('[DEBUG] User not authenticated - no userId in request');
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const { platformName } = req.params;
    console.log(`[DEBUG] Platform name: ${platformName}`);
    
    const platform = await SocialAccountModel.platform.findByName(platformName);
    console.log(`[DEBUG] Platform found:`, platform ? { id: platform.id, name: platform.name } : 'NOT FOUND');

    if (!platform) {
      console.error(`[DEBUG] Platform not found: ${platformName}`);
      return res.status(404).json({
        success: false,
        message: 'Platform not found',
      });
    }

    console.log(`[DEBUG] Platform OAuth auth URL: ${platform.oauth_auth_url}`);
    
    const oauthConfig = getOAuthConfig(platformName);
    console.log(`[DEBUG] OAuth config:`, {
      hasClientId: !!oauthConfig.clientId,
      hasClientSecret: !!oauthConfig.clientSecret,
      redirectUri: oauthConfig.redirectUri,
      scopes: oauthConfig.scopes,
    });

    if (!oauthConfig.clientId || !oauthConfig.clientSecret) {
      console.error(`[DEBUG] OAuth not configured for platform: ${platformName}`);
      return res.status(400).json({
        success: false,
        message: 'Platform OAuth not configured. Please configure OAuth credentials in the backend.',
      });
    }

    // Generate state token for CSRF protection
    const stateToken = generateStateToken();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    console.log(`[DEBUG] Generated state token: ${stateToken.substring(0, 10)}...`);

    try {
      await OAuthStateModelInstance.create({
        user_id: userId,
        platform_id: platform.id!,
        state_token: stateToken,
        redirect_uri: oauthConfig.redirectUri,
        expires_at: expiresAt,
      });
      console.log('[DEBUG] OAuth state record created successfully');
    } catch (dbError) {
      console.error('[DEBUG] Error creating OAuth state record:', dbError);
      throw dbError;
    }

    // Build OAuth authorization URL
    if (!platform.oauth_auth_url) {
      console.error(`[DEBUG] Platform ${platformName} has no oauth_auth_url`);
      return res.status(500).json({
        success: false,
        message: `Platform ${platformName} OAuth URL not configured`,
      });
    }

    const authUrl = new URL(platform.oauth_auth_url);
    authUrl.searchParams.set('client_id', oauthConfig.clientId);
    authUrl.searchParams.set('redirect_uri', oauthConfig.redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', oauthConfig.scopes.join(' '));
    authUrl.searchParams.set('state', stateToken);

    const finalAuthUrl = authUrl.toString();
    console.log(`[DEBUG] Generated OAuth URL: ${finalAuthUrl.substring(0, 100)}...`);

    res.status(200).json({
      success: true,
      data: {
        authUrl: finalAuthUrl,
        stateToken,
      },
    });
  } catch (error) {
    console.error('[DEBUG] Error initiating OAuth:', error);
    console.error('[DEBUG] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to initiate OAuth flow',
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
    } else if (platformName.toLowerCase() === 'youtube') {
      // Fetch YouTube channel info
      try {
        const channelResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true&access_token=${tokenData.access_token}`
        );
        
        if (channelResponse.ok) {
          const channelData = await channelResponse.json() as {
            items?: Array<{
              id?: string;
              snippet?: {
                title?: string;
                customUrl?: string;
                thumbnails?: {
                  default?: {
                    url?: string;
                  };
                };
              };
            }>;
            error?: { message: string };
          };
          
          if (channelData.error) {
            console.error('YouTube API error:', channelData.error.message);
          } else if (channelData.items && channelData.items.length > 0) {
            const channel = channelData.items[0];
            platformAccountId = channel.id || 'temp_id';
            platformDisplayName = channel.snippet?.title || '';
            platformUsername = channel.snippet?.customUrl || channel.snippet?.title || '';
            profilePictureUrl = channel.snippet?.thumbnails?.default?.url || '';
          }
        }
      } catch (err) {
        console.error('Error fetching YouTube channel info:', err);
        // Continue with temp_id if channel fetch fails
      }
    } else if (platformName.toLowerCase() === 'instagram') {
      // Instagram uses Facebook Graph API
      try {
        const userResponse = await fetch(
          `https://graph.instagram.com/me?fields=id,username&access_token=${tokenData.access_token}`
        );
        if (userResponse.ok) {
          const userData = await userResponse.json() as {
            id?: string;
            username?: string;
            error?: { message: string };
          };
          
          if (userData.error) {
            console.error('Instagram API error:', userData.error.message);
          } else {
            platformAccountId = userData.id || 'temp_id';
            platformUsername = userData.username || '';
            platformDisplayName = userData.username || '';
          }
        }
      } catch (err) {
        console.error('Error fetching Instagram user info:', err);
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

