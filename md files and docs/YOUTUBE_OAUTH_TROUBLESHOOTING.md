# YouTube OAuth "disabled_client" Error - Troubleshooting Guide

## Error: `Error 401: disabled_client`

This error means your Google OAuth client has been disabled or is misconfigured in Google Cloud Console.

## Quick Fixes

### Option 1: Check OAuth Client Status (Recommended)

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/apis/credentials
   - Sign in with the Google account that created the OAuth client

2. **Find Your OAuth Client:**
   - Look for OAuth 2.0 Client ID: `420878294938-lgjip5gjja3r05h7jffmk0ve0mf4k699.apps.googleusercontent.com`
   - Or search for your `YOUTUBE_CLIENT_ID` from `.env`

3. **Check Status:**
   - If it shows "Disabled" or has a warning icon, click to edit
   - Make sure it's **Enabled**
   - Check if there are any restrictions or errors

4. **Verify OAuth Consent Screen:**
   - Go to: **APIs & Services** → **OAuth consent screen**
   - Make sure the app is **Published** (not just in Testing mode)
   - If in Testing mode, add your email as a **Test User**

### Option 2: Re-enable the OAuth Client

1. In Google Cloud Console → **Credentials**
2. Click on your OAuth 2.0 Client ID
3. If it's disabled, click **Enable** or **Restore**
4. Save changes

### Option 3: Create a New OAuth Client

If the old one can't be restored:

1. **Create New OAuth Client:**
   - Go to: **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Name: "Social Media Analytics"
   - Authorized redirect URIs:
     ```
     http://localhost:5001/api/social/callback/youtube
     ```
   - Click **Create**

2. **Update `.env` file:**
   ```env
   YOUTUBE_CLIENT_ID=your_new_client_id_here
   YOUTUBE_CLIENT_SECRET=your_new_client_secret_here
   ```

3. **Restart backend:**
   ```bash
   cd backend
   npm run dev
   ```

### Option 4: Use API Key Instead (Simpler for Development)

If OAuth is causing issues, you can use the API key method (which you might already be using):

1. **Make sure you have in `.env`:**
   ```env
   YOUTUBE_API_KEY=AIzaSyBv51l0oue7tS_gCKLBVTGONj3Xsct6WUI
   YOUTUBE_CHANNEL_ID=your_channel_id_here
   ```

2. **Connect via API Key:**
   - Go to Settings → Accounts
   - Instead of clicking "Connect Account" (OAuth), you can manually enter:
     - API Key: Your `YOUTUBE_API_KEY`
     - Channel ID: Your YouTube channel ID

## Common Causes

1. **OAuth App in Testing Mode:**
   - Solution: Add your email as a test user OR publish the app

2. **OAuth Client Disabled:**
   - Solution: Re-enable it in Google Cloud Console

3. **Quota Exceeded:**
   - Solution: Check API quotas in Google Cloud Console
   - YouTube Data API has daily quotas (usually 10,000 units/day)

4. **Wrong Redirect URI:**
   - Solution: Make sure redirect URI matches exactly:
     ```
     http://localhost:5001/api/social/callback/youtube
     ```

## Check API Quotas

1. Go to: https://console.cloud.google.com/apis/dashboard
2. Select your project
3. Click on **YouTube Data API v3**
4. Check **Quotas** tab
5. If quota exceeded, wait 24 hours or request quota increase

## Alternative: Use API Key Method

For development/testing, using API key is simpler:

1. **Get your Channel ID:**
   - Go to: https://studio.youtube.com
   - Settings → Channel → Advanced settings
   - Copy your Channel ID (starts with `UC...`)

2. **Add to `.env`:**
   ```env
   YOUTUBE_API_KEY=AIzaSyBv51l0oue7tS_gCKLBVTGONj3Xsct6WUI
   YOUTUBE_CHANNEL_ID=UCxxxxxxxxxxxxxxxxxxxxx
   ```

3. **The system will auto-connect using API key** (no OAuth needed)

## Still Having Issues?

1. **Check backend logs** for detailed error messages
2. **Verify `.env` file** has correct credentials
3. **Restart backend** after changing `.env`
4. **Clear browser cache** and try again
5. **Check Google Cloud Console** for any warnings or errors

