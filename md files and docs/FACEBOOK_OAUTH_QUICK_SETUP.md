# OAuth Credentials Quick Setup

## Add to `backend/.env`

Add these lines to your `backend/.env` file:

```env
# Facebook OAuth Credentials
FACEBOOK_CLIENT_ID=4415283775358718
FACEBOOK_CLIENT_SECRET=7da790d4e3da49c47db3f905a7565d30

# Instagram (uses same credentials as Facebook)
INSTAGRAM_CLIENT_ID=4415283775358718
INSTAGRAM_CLIENT_SECRET=7da790d4e3da49c47db3f905a7565d30

# YouTube OAuth Credentials
YOUTUBE_CLIENT_ID=420878294938-lgjip5gjja3r05h7jffmk0ve0mf4k699.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=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

# YouTube API Key (for API access)
YOUTUBE_API_KEY=AIzaSyBv51l0oue7tS_gCKLBVTGONj3Xsct6WUI

# Backend URL (for OAuth redirects)
BACKEND_URL=http://localhost:5001
FRONTEND_URL=http://localhost:3000
```

## Important: Configure Redirect URIs

### Facebook App:
1. Go to [Facebook Developers](https://developers.facebook.com/apps/4415283775358718)
2. Go to **Facebook Login** → **Settings**
3. Add this **Valid OAuth Redirect URI**:
   ```
   http://localhost:5001/api/social/callback/facebook
   ```
4. Click **Save Changes**

### YouTube/Google Cloud Console:
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Find your OAuth 2.0 Client ID: `420878294938-lgjip5gjja3r05h7jffmk0ve0mf4k699.apps.googleusercontent.com`
3. Click on it to edit
4. Add this **Authorized redirect URI**:
   ```
   http://localhost:5001/api/social/callback/youtube
   ```
5. Click **Save**

## Test It

1. **Restart your backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Go to:** `http://localhost:3000/settings/accounts`

3. **Click "Connect Account"** next to Facebook

4. **You should be redirected** to Facebook login

5. **Log in with your Facebook account**

6. **Grant permissions**

7. **You'll be redirected back** and your account will be connected!

## That's It! ✅

Your Facebook OAuth is now configured. Users can connect their Facebook accounts via OAuth.

