# Complete OAuth Credentials Setup

## Add to `backend/.env`

Add all these lines to your `backend/.env` file:

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

## Configure Redirect URIs

### Facebook App:
1. Go to: https://developers.facebook.com/apps/4415283775358718
2. Navigate to: **Facebook Login** → **Settings**
3. Add **Valid OAuth Redirect URI**:
   ```
   http://localhost:5001/api/social/callback/facebook
   ```
4. Click **Save Changes**

### YouTube/Google Cloud Console:
1. Go to: https://console.cloud.google.com/apis/credentials
2. Find OAuth 2.0 Client ID: `420878294938-lgjip5gjja3r05h7jffmk0ve0mf4k699.apps.googleusercontent.com`
3. Click to edit
4. Add **Authorized redirect URI**:
   ```
   http://localhost:5001/api/social/callback/youtube
   ```
5. Click **Save**

## Test OAuth Connection

1. **Restart backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Go to:** `http://localhost:3000/settings/accounts`

3. **Click "Connect Account"** next to Facebook or YouTube

4. **Complete OAuth flow** - Sign in with your account

5. **Account should be connected!** ✅

## Troubleshooting

### "No platforms available" on accounts page:
- Make sure backend is running
- Check database has platform entries (should be created by `database-complete-schema.sql`)
- Check browser console for errors

### "OAuth not configured" error:
- Verify credentials are in `backend/.env`
- Restart backend after adding credentials
- Check for typos in variable names

### "Invalid redirect URI":
- Make sure redirect URI matches exactly in both:
  - Facebook App settings
  - Google Cloud Console
- No trailing slashes!
- Must match: `http://localhost:5001/api/social/callback/[platform]`

---

**All OAuth credentials are now configured!** Users can connect their accounts via OAuth. 🎉

