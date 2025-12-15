# User Account Connection Guide

## How It Works ✅

### System-Level API Keys (General Access)

1. **YouTube API Key** (`AIza...`)
   - This is a **general API key** - not tied to any specific account
   - Enables the system to make API calls to YouTube
   - Can be shared across all users
   - Users still connect their own YouTube channels

2. **Facebook/Instagram**
   - Requires **OAuth flow** - each user connects their own account
   - Each user gets their own access token
   - Each user sees only their own data

### User Flow

1. **User Signs Up** → Creates account in your system
2. **User Connects Their Accounts** → Uses OAuth to connect Facebook/YouTube
3. **User Sees Their Data** → Analytics show their own posts/engagement

## Setup Instructions

### For Backend (`.env`)

```env
# YouTube API Key (general - not user-specific)
YOUTUBE_API_KEY=AIzaSyBv51l0oue7tS_gCKLBVTGONj3Xsct6WUI
YOUTUBE_CHANNEL_ID=UC...your-default-channel-if-needed

# OAuth Client IDs/Secrets (for users to connect their own accounts)
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret
INSTAGRAM_CLIENT_ID=your-instagram-app-id
INSTAGRAM_CLIENT_SECRET=your-instagram-app-secret
YOUTUBE_CLIENT_ID=your-youtube-client-id
YOUTUBE_CLIENT_SECRET=your-youtube-client-secret

# Remove or leave empty (users connect their own accounts):
# FACEBOOK_ACCESS_TOKEN=  (Don't use - each user has their own)
```

### What Each User Does

1. **Signs Up/Logs In** to your platform
2. **Goes to Settings → Accounts**
3. **Clicks "Connect"** next to Facebook/YouTube
4. **Signs in with their own Facebook/YouTube account** (OAuth)
5. **Their account is connected** → They see their own data

## Benefits

✅ **Each user sees their own data**  
✅ **No shared accounts**  
✅ **Secure** - Users authenticate with their own credentials  
✅ **YouTube API key** - General access, works for all users  
✅ **Facebook/Instagram** - Each user connects via OAuth  

## Updated Implementation

The system now:
- ✅ Only auto-connects YouTube (if channel ID provided) using the general API key
- ✅ Requires users to connect Facebook/Instagram via OAuth (their own accounts)
- ✅ Each user's tokens are stored separately in database
- ✅ Users see only their own analytics

## Next Steps

1. **Set up OAuth Apps** (if not done):
   - Facebook App: https://developers.facebook.com
   - YouTube OAuth: https://console.cloud.google.com

2. **Add OAuth credentials to `.env`**

3. **Users connect their accounts** via the UI

4. **Enjoy!** Each user sees their own data! 🎉

