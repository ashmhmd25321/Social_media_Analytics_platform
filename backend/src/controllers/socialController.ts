import { Request, Response } from 'express';
import { generateStateToken, getOAuthConfig } from '../config/oauth-config';
import SocialAccountModel, { OAuthStateModelInstance } from '../models/SocialPlatform';
import { AuthRequest } from '../middleware/auth';
import { dataCollectionService } from '../services/DataCollectionService';

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
    
    // For Google OAuth (YouTube), force account selection to avoid auto-login issues
    if (platformName.toLowerCase() === 'youtube') {
      authUrl.searchParams.set('prompt', 'select_account');
      authUrl.searchParams.set('access_type', 'offline'); // Request refresh token
    }

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
            console.log('[YouTube OAuth] Channel connected:', {
              channelId: platformAccountId,
              displayName: platformDisplayName,
              username: platformUsername,
            });
          } else {
            console.warn('[YouTube OAuth] No channel items found in API response');
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
    // First, try to find any existing account (including inactive ones or those with temp_id)
    let existingAccount = await SocialAccountModel.account.findByUserIdAndPlatform(
      stateRecord.user_id,
      platform.id!
    );

    // If not found, check for accounts with temp_id (might be inactive)
    if (!existingAccount) {
      const { pool } = await import('../config/database');
      const [rows] = await pool.execute<any[]>(
        `SELECT usa.* FROM user_social_accounts usa
         WHERE usa.user_id = ? AND usa.platform_id = ? AND usa.platform_account_id = 'temp_id'
         LIMIT 1`,
        [stateRecord.user_id, platform.id!]
      );
      if (rows.length > 0) {
        existingAccount = rows[0] as any;
      }
    }

    if (existingAccount) {
      // Update existing account - model will convert undefined to null
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
      // Try to create new account, but handle duplicate key errors
      try {
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
      } catch (createError: any) {
        // If duplicate key error, find and update the existing account
        if (createError.code === 'ER_DUP_ENTRY' || createError.errno === 1062) {
          console.log('Duplicate account detected, updating existing account instead');
          // Find the account that caused the duplicate
          const { pool } = await import('../config/database');
          const [rows] = await pool.execute<any[]>(
            `SELECT * FROM user_social_accounts 
             WHERE user_id = ? AND platform_id = ? AND platform_account_id = ?
             LIMIT 1`,
            [stateRecord.user_id, platform.id!, platformAccountId]
          );
          
          if (rows.length > 0) {
            const duplicateAccount = rows[0];
            await SocialAccountModel.account.update(duplicateAccount.id, {
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
            throw createError; // Re-throw if we can't find the duplicate
          }
        } else {
          throw createError; // Re-throw if it's not a duplicate key error
        }
      }
    }

    // Clean up state token
    await OAuthStateModelInstance.delete(state as string);

    // Get the account that was just created/updated to trigger initial data sync
    const connectedAccount = await SocialAccountModel.account.findByUserIdAndPlatform(
      stateRecord.user_id,
      platform.id!
    );

    // Clear backend cache for this user to ensure fresh data on next request
    // This is critical - without this, analytics will show stale "no data" state
    const { clearUserCache } = await import('../middleware/cache');
    clearUserCache(stateRecord.user_id);
    console.log(`[DEBUG] Account connected for user ${stateRecord.user_id}. Cache cleared.`);

    // Trigger initial data sync in the background (don't wait for it)
    if (connectedAccount && connectedAccount.id) {
      dataCollectionService.collectAccountData(connectedAccount, { limit: 25 })
        .then(() => {
          console.log(`✅ Initial data sync completed for ${platformName} account ${connectedAccount.id}`);
          // Clear cache again after data sync completes to ensure fresh analytics
          clearUserCache(stateRecord.user_id);
        })
        .catch((error) => {
          console.error(`❌ Initial data sync failed for ${platformName} account ${connectedAccount.id}:`, error);
          // Don't fail the connection if sync fails - user can manually sync later
        });
    }

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
    
    // Verify the account belongs to the user before disconnecting
    const account = await SocialAccountModel.account.findById(parseInt(accountId));
    if (!account || account.user_id !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    // Disconnect the account (sets is_active = FALSE and account_status = 'disconnected')
    const deleted = await SocialAccountModel.account.delete(parseInt(accountId));

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Account not found or already disconnected',
      });
    }

    // Clear backend cache for this user to ensure fresh data on next request
    // This is critical - without this, analytics will show stale data for 5 minutes
    const { clearUserCache } = await import('../middleware/cache');
    clearUserCache(userId);

    console.log(`[DEBUG] Account ${accountId} disconnected for user ${userId}. Cache cleared.`);

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

/**
 * Connect Facebook account with direct access token
 */
export const connectFacebookWithToken = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const { accessToken } = req.body;
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Access token is required',
      });
    }

    // Get Facebook app credentials for token exchange
    const oauthConfig = getOAuthConfig('facebook');
    const clientId = oauthConfig.clientId;
    const clientSecret = oauthConfig.clientSecret;

    // Validate token and fetch account info from Facebook
    try {
      // First, try to exchange short-lived token for long-lived token (if app credentials are available)
      let finalAccessToken = accessToken;
      if (clientId && clientSecret) {
        try {
          const exchangeResponse = await fetch(
            `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${accessToken}`
          );
          
          if (exchangeResponse.ok) {
            const exchangeData = await exchangeResponse.json() as {
              access_token?: string;
              expires_in?: number;
            };
            if (exchangeData.access_token) {
              finalAccessToken = exchangeData.access_token;
              console.log(`[DEBUG] Exchanged short-lived token for long-lived token (expires in ${exchangeData.expires_in} seconds)`);
            }
          }
        } catch (exchangeError) {
          console.warn('[DEBUG] Failed to exchange token for long-lived token, using provided token:', exchangeError);
          // Continue with original token if exchange fails
        }
      }

      // Validate token and fetch account info
      // Note: 'username' field is deprecated in v2.0+, so we only request id, name, and picture
      const response = await fetch(
        `https://graph.facebook.com/v18.0/me?access_token=${finalAccessToken}&fields=id,name,picture`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as {
          error?: {
            message?: string;
          };
        };
        return res.status(400).json({
          success: false,
          message: errorData.error?.message || 'Invalid access token',
        });
      }

      const accountData = await response.json() as {
        id?: string;
        name?: string;
        username?: string;
        picture?: {
          data?: {
            url?: string;
          };
        };
      };

      if (!accountData.id) {
        return res.status(400).json({
          success: false,
          message: 'Failed to fetch account information from Facebook',
        });
      }

      // Try to get user's Facebook Pages first (preferred for data collection)
      let platformAccountId = accountData.id;
      let platformDisplayName = accountData.name || '';
      let platformUsername = accountData.username || undefined;
      let profilePictureUrl = accountData.picture?.data?.url || undefined;
      let pageAccessToken = finalAccessToken; // Default to user token

      try {
        const pagesResponse = await fetch(
          `https://graph.facebook.com/v18.0/me/accounts?access_token=${finalAccessToken}&fields=id,name,username,fan_count,access_token`
        );

        if (pagesResponse.ok) {
          const pagesData = await pagesResponse.json() as {
            data?: Array<{
              id: string;
              name?: string;
              username?: string;
              fan_count?: number;
              access_token?: string;
            }>;
            error?: { message: string };
          };

          if (!pagesData.error && pagesData.data && pagesData.data.length > 0) {
            // Use the first page (preferred for analytics)
            const page = pagesData.data[0];
            platformAccountId = page.id;
            platformDisplayName = page.name || accountData.name || '';
            platformUsername = page.username || accountData.username;
            
            // Use page access token if available (has more permissions for that page)
            if (page.access_token) {
              pageAccessToken = page.access_token;
              console.log(`[DEBUG] Using Facebook Page: ${page.name} (ID: ${page.id}) with page access token`);
            } else {
              console.log(`[DEBUG] Using Facebook Page: ${page.name} (ID: ${page.id}) with user access token`);
            }

            // Get page picture
            try {
              const pictureResponse = await fetch(
                `https://graph.facebook.com/v18.0/${page.id}/picture?type=large&redirect=false&access_token=${finalAccessToken}`
              );
              if (pictureResponse.ok) {
                const pictureData = await pictureResponse.json() as {
                  data?: { url?: string };
                };
                profilePictureUrl = pictureData.data?.url || profilePictureUrl;
              }
            } catch (err) {
              console.warn('[DEBUG] Could not fetch page picture, using user picture');
            }
          } else {
            // No pages found - this will cause issues during data collection
            const errorMsg = pagesData.error?.message || 'No pages found';
            if (pagesData.error) {
              // Check if it's a permission error
              if (errorMsg.includes('permission') || errorMsg.includes('scope') || errorMsg.includes('200')) {
                throw new Error(
                  `Access token is missing required permissions. ` +
                  `Please generate a new token with 'pages_show_list' and 'pages_read_engagement' permissions. ` +
                  `See the guide: FACEBOOK_ACCESS_TOKEN_GUIDE.md ` +
                  `Error: ${errorMsg}`
                );
              }
            }
            // No pages found and no error - user doesn't have any pages
            throw new Error(
              `No Facebook Pages found for this account. ` +
              `Make sure: 1) You have created a Facebook Page, 2) You are an admin of that Page, ` +
              `3) Your access token has 'pages_show_list' permission. ` +
              `See the guide: FACEBOOK_ACCESS_TOKEN_GUIDE.md`
            );
          }
        } else {
          // API request failed
          const errorData = await pagesResponse.json().catch(() => ({})) as {
            error?: { message?: string; code?: number };
          };
          const errorMsg = errorData.error?.message || 'Failed to fetch pages';
          const errorCode = errorData.error?.code;
          
          if (errorCode === 200 || errorMsg.includes('permission') || errorMsg.includes('scope')) {
            throw new Error(
              `Access token is missing required permissions. ` +
              `Please generate a new token with 'pages_show_list' and 'pages_read_engagement' permissions. ` +
              `See the guide: FACEBOOK_ACCESS_TOKEN_GUIDE.md ` +
              `Error: ${errorMsg}`
            );
          }
          
          throw new Error(
            `Failed to fetch Facebook Pages: ${errorMsg}. ` +
            `Make sure your access token has 'pages_show_list' permission. ` +
            `See the guide: FACEBOOK_ACCESS_TOKEN_GUIDE.md`
          );
        }
      } catch (pagesError: any) {
        // Re-throw if it's already our formatted error
        if (pagesError.message && pagesError.message.includes('Access token') || pagesError.message.includes('No Facebook Pages')) {
          throw pagesError;
        }
        // Otherwise, format the error
        const errorMsg = pagesError.response?.data?.error?.message || pagesError.message || 'Unknown error';
        throw new Error(
          `Failed to access Facebook Pages. Make sure your access token has 'pages_show_list' and 'pages_read_engagement' permissions. ` +
          `See the guide: FACEBOOK_ACCESS_TOKEN_GUIDE.md ` +
          `Error: ${errorMsg}`
        );
      }

      // Get Facebook platform
      const platform = await SocialAccountModel.platform.findByName('facebook');
      if (!platform) {
        return res.status(404).json({
          success: false,
          message: 'Facebook platform not found',
        });
      }

      // Check if account already exists by user_id, platform_id, AND platform_account_id
      // This prevents duplicate entry errors when reconnecting
      const existingAccount = await SocialAccountModel.account.findByUserIdPlatformAndAccountId(
        userId,
        platform.id!,
        platformAccountId
      );

      const accountInfo = {
        user_id: userId,
        platform_id: platform.id!,
        platform_account_id: platformAccountId, // Use page ID if available, otherwise user ID
        platform_username: platformUsername,
        platform_display_name: platformDisplayName,
        access_token: pageAccessToken, // Use page token if available, otherwise user token
        profile_picture_url: profilePictureUrl,
        account_status: 'connected' as const,
        is_active: true,
      };

      if (existingAccount) {
        // Update existing account
        await SocialAccountModel.account.update(existingAccount.id!, accountInfo);
      } else {
        // Create new account
        try {
          await SocialAccountModel.account.create(accountInfo);
        } catch (createError: any) {
          // If duplicate key error, find and update the existing account
          if (createError.code === 'ER_DUP_ENTRY' || createError.errno === 1062) {
            console.log('Duplicate account detected, updating existing account instead');
            const duplicateAccount = await SocialAccountModel.account.findByUserIdPlatformAndAccountId(
              userId,
              platform.id!,
              platformAccountId
            );
            if (duplicateAccount) {
              await SocialAccountModel.account.update(duplicateAccount.id!, accountInfo);
            } else {
              throw createError;
            }
          } else {
            throw createError;
          }
        }
      }

      // Clear backend cache for this user
      const { clearUserCache } = await import('../middleware/cache');
      clearUserCache(userId);

      // Get the connected account to trigger initial data sync
      const connectedAccount = await SocialAccountModel.account.findByUserIdAndPlatform(
        userId,
        platform.id!
      );

      // Trigger initial data sync in the background
      if (connectedAccount && connectedAccount.id) {
        dataCollectionService.collectAccountData(connectedAccount, { limit: 25 })
          .then(() => {
            console.log(`✅ Initial data sync completed for Facebook account ${connectedAccount.id}`);
            clearUserCache(userId);
          })
          .catch((error) => {
            console.error(`❌ Initial data sync failed for Facebook account ${connectedAccount.id}:`, error);
          });
      }

      res.status(200).json({
        success: true,
        message: platformAccountId !== accountData.id 
          ? 'Facebook Page connected successfully' 
          : 'Facebook account connected successfully (Note: No Pages found. Create a Facebook Page for better analytics.)',
        data: {
          account_id: connectedAccount?.id,
          platform_account_id: platformAccountId,
          platform_display_name: platformDisplayName,
          is_page: platformAccountId !== accountData.id,
        },
      });
    } catch (error: any) {
      console.error('Error validating Facebook token:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to validate access token',
      });
    }
  } catch (error) {
    console.error('Error connecting Facebook with token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect Facebook account',
    });
  }
};

/**
 * Connect Instagram account with direct access token
 * Note: Instagram Business accounts use the same Facebook access token
 */
export const connectInstagramWithToken = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const { accessToken, instagramAccountId } = req.body;
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Access token is required',
      });
    }

    // Get Facebook app credentials for token exchange
    const oauthConfig = getOAuthConfig('facebook');
    const clientId = oauthConfig.clientId;
    const clientSecret = oauthConfig.clientSecret;

    // Validate token and fetch account info from Instagram
    try {
      // First, try to exchange short-lived token for long-lived token (if app credentials are available)
      let finalAccessToken = accessToken;
      if (clientId && clientSecret) {
        try {
          const exchangeResponse = await fetch(
            `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${accessToken}`
          );
          
          if (exchangeResponse.ok) {
            const exchangeData = await exchangeResponse.json() as {
              access_token?: string;
              expires_in?: number;
              error?: {
                message?: string;
                code?: number;
              };
            };
            
            if (exchangeData.error) {
              // Token is expired or invalid
              if (exchangeData.error.message?.includes('expired') || exchangeData.error.message?.includes('Session has expired')) {
                throw new Error('Access token has expired. Please generate a new token from Facebook Graph API Explorer.');
              }
              throw new Error(`Token exchange failed: ${exchangeData.error.message}`);
            }
            
            if (exchangeData.access_token) {
              finalAccessToken = exchangeData.access_token;
              console.log(`[DEBUG] Exchanged short-lived token for long-lived token (expires in ${exchangeData.expires_in} seconds)`);
            }
          } else {
            // Check if token is expired
            const errorText = await exchangeResponse.text();
            if (errorText.includes('expired') || errorText.includes('Session has expired')) {
              throw new Error('Access token has expired. Please generate a new token from Facebook Graph API Explorer.');
            }
          }
        } catch (exchangeError: any) {
          // If it's our custom error about expiration, re-throw it
          if (exchangeError.message && exchangeError.message.includes('expired')) {
            throw exchangeError;
          }
          console.warn('[DEBUG] Failed to exchange token for long-lived token, using provided token:', exchangeError);
          // Continue with original token if exchange fails (might be a long-lived token already)
        }
      }

      let instagramId = instagramAccountId;
      let instagramUsername = '';
      let instagramDisplayName = '';

      // If Instagram Account ID is not provided, try to find it from Facebook Pages
      if (!instagramId) {
        try {
          // Get user's Facebook Pages
          const pagesResponse = await fetch(
            `https://graph.facebook.com/v18.0/me/accounts?access_token=${finalAccessToken}&fields=id,name,instagram_business_account{id,username}`
          );

          if (pagesResponse.ok) {
            const pagesData = await pagesResponse.json() as {
              data?: Array<{
                id?: string;
                name?: string;
                instagram_business_account?: {
                  id?: string;
                  username?: string;
                };
              }>;
              error?: {
                message?: string;
                code?: number;
              };
            };

            if (pagesData.error) {
              console.error('[DEBUG] Facebook API error when fetching pages:', pagesData.error);
              
              // Check if token is expired
              if (pagesData.error.message?.includes('expired') || pagesData.error.message?.includes('Session has expired')) {
                throw new Error('Access token has expired. Please generate a new token from Facebook Graph API Explorer and try again.');
              }
              
              // Continue to try other methods for other errors
            } else if (pagesData.data && pagesData.data.length > 0) {
              console.log(`[DEBUG] Found ${pagesData.data.length} Facebook Page(s)`);
              
              // Try to find Instagram Business account in pages
              let pageWithInstagram = pagesData.data.find(
                page => page.instagram_business_account?.id
              );

              // If not found, try fetching each page individually (sometimes nested fields don't work)
              if (!pageWithInstagram) {
                console.log('[DEBUG] Instagram Business Account not found in initial query, checking each page individually...');
                for (const page of pagesData.data) {
                  if (page.id) {
                    try {
                      const pageDetailsResponse = await fetch(
                        `https://graph.facebook.com/v18.0/${page.id}?access_token=${finalAccessToken}&fields=id,name,instagram_business_account{id,username}`
                      );
                      
                      if (pageDetailsResponse.ok) {
                        const pageDetails = await pageDetailsResponse.json() as {
                          id?: string;
                          name?: string;
                          instagram_business_account?: {
                            id?: string;
                            username?: string;
                          };
                        };
                        
                        if (pageDetails.instagram_business_account?.id) {
                          pageWithInstagram = pageDetails;
                          console.log(`[DEBUG] Found Instagram Business Account on page: ${pageDetails.name} (${pageDetails.id})`);
                          break;
                        }
                      }
                    } catch (pageError) {
                      console.warn(`[DEBUG] Error fetching details for page ${page.id}:`, pageError);
                    }
                  }
                }
              }

              if (pageWithInstagram?.instagram_business_account) {
                instagramId = pageWithInstagram.instagram_business_account.id;
                instagramUsername = pageWithInstagram.instagram_business_account.username || '';
                instagramDisplayName = pageWithInstagram.instagram_business_account.username || '';
                console.log(`[DEBUG] Using Instagram Business Account: ${instagramId} (${instagramUsername})`);
              } else {
                console.warn('[DEBUG] No Instagram Business Account found in any Facebook Page');
              }
            } else {
              console.warn('[DEBUG] No Facebook Pages found');
            }
          } else {
            const errorText = await pagesResponse.text();
            console.error('[DEBUG] Failed to fetch Facebook Pages:', errorText);
            
            // Check if token is expired
            if (errorText.includes('expired') || errorText.includes('Session has expired')) {
              throw new Error('Access token has expired. Please generate a new token from Facebook Graph API Explorer and try again.');
            }
          }
        } catch (error) {
          console.error('[DEBUG] Error fetching Instagram account from Facebook Pages:', error);
        }
      }

      // If we still don't have an Instagram ID, try to get it directly from the token
      if (!instagramId) {
        try {
          const instagramResponse = await fetch(
            `https://graph.instagram.com/me?fields=id,username&access_token=${finalAccessToken}`
          );

          if (instagramResponse.ok) {
            const instagramData = await instagramResponse.json() as {
              id?: string;
              username?: string;
              error?: { message: string };
            };

            if (instagramData.error) {
              return res.status(400).json({
                success: false,
                message: instagramData.error.message || 'Invalid Instagram access token',
              });
            }

            if (instagramData.id) {
              instagramId = instagramData.id;
              instagramUsername = instagramData.username || '';
              instagramDisplayName = instagramData.username || '';
            }
          }
        } catch (error) {
          console.warn('[DEBUG] Failed to fetch Instagram account directly:', error);
        }
      }

      // If we still don't have an Instagram ID, return error with helpful instructions
      if (!instagramId) {
        return res.status(400).json({
          success: false,
          message: 'Could not find Instagram Business Account. ' +
            'Please ensure: 1) Your Instagram is a Business/Creator account, ' +
            '2) It is linked to your Facebook Page (not just your personal profile), ' +
            '3) Your access token has "instagram_basic" permission. ' +
            'Alternatively, you can provide the instagramAccountId manually.',
          errorCode: 'INSTAGRAM_ACCOUNT_NOT_FOUND',
        });
      }

      // Fetch Instagram account details to get username if not already set
      if (!instagramUsername) {
        try {
          const accountResponse = await fetch(
            `https://graph.instagram.com/${instagramId}?fields=username&access_token=${finalAccessToken}`
          );

          if (accountResponse.ok) {
            const accountData = await accountResponse.json() as {
              username?: string;
            };
            instagramUsername = accountData.username || '';
            instagramDisplayName = accountData.username || '';
          }
        } catch (error) {
          console.warn('[DEBUG] Failed to fetch Instagram username:', error);
        }
      }

      // Get Instagram platform
      const platform = await SocialAccountModel.platform.findByName('instagram');
      if (!platform) {
        return res.status(404).json({
          success: false,
          message: 'Instagram platform not found',
        });
      }

      // Check if account already exists by user_id, platform_id, AND platform_account_id
      // This prevents duplicate entry errors when reconnecting
      const existingAccount = await SocialAccountModel.account.findByUserIdPlatformAndAccountId(
        userId,
        platform.id!,
        instagramId
      );

      const accountInfo = {
        user_id: userId,
        platform_id: platform.id!,
        platform_account_id: instagramId,
        platform_username: instagramUsername || undefined,
        platform_display_name: instagramDisplayName || instagramId,
        access_token: finalAccessToken, // Use the long-lived token if exchange was successful
        account_status: 'connected' as const,
        is_active: true,
      };

      if (existingAccount) {
        // Update existing account
        await SocialAccountModel.account.update(existingAccount.id!, accountInfo);
      } else {
        // Create new account
        try {
          await SocialAccountModel.account.create(accountInfo);
        } catch (createError: any) {
          // If duplicate key error, find and update the existing account
          if (createError.code === 'ER_DUP_ENTRY' || createError.errno === 1062) {
            console.log('Duplicate account detected, updating existing account instead');
            const duplicateAccount = await SocialAccountModel.account.findByUserIdPlatformAndAccountId(
              userId,
              platform.id!,
              instagramId
            );
            if (duplicateAccount) {
              await SocialAccountModel.account.update(duplicateAccount.id!, accountInfo);
            } else {
              throw createError;
            }
          } else {
            throw createError;
          }
        }
      }

      // Clear backend cache for this user
      const { clearUserCache } = await import('../middleware/cache');
      clearUserCache(userId);

      // Get the connected account to trigger initial data sync
      const connectedAccount = await SocialAccountModel.account.findByUserIdAndPlatform(
        userId,
        platform.id!
      );

      // Trigger initial data sync in the background
      if (connectedAccount && connectedAccount.id) {
        dataCollectionService.collectAccountData(connectedAccount, { limit: 25 })
          .then(() => {
            console.log(`✅ Initial data sync completed for Instagram account ${connectedAccount.id}`);
            clearUserCache(userId);
          })
          .catch((error) => {
            console.error(`❌ Initial data sync failed for Instagram account ${connectedAccount.id}:`, error);
          });
      }

      res.status(200).json({
        success: true,
        message: 'Instagram account connected successfully',
        data: {
          account_id: connectedAccount?.id,
          platform_account_id: instagramId,
          platform_display_name: instagramDisplayName || instagramId,
          platform_username: instagramUsername,
        },
      });
    } catch (error: any) {
      console.error('Error validating Instagram token:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to validate access token',
      });
    }
  } catch (error) {
    console.error('Error connecting Instagram with token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect Instagram account',
    });
  }
};

