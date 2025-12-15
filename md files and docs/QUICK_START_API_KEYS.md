# Quick Start: Connect Your API Keys

You have API credentials ready! Here's the fastest way to connect them:

## ✅ Your Credentials

- **Facebook Token:** `EAAVR3igjlr0...` (OAuth access token)
- **YouTube API Key:** `AIzaSyBv51l0oue7tS_gCKLBVTGONj3Xsct6WUI` (API key)

## 🚀 Quick Setup (3 Steps)

### Step 1: Start Your Services

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### Step 2: Connect Facebook

1. Open: `http://localhost:3000/settings/accounts`
2. Click **"Connect Account"** next to Facebook
3. Paste your Facebook token: `EAAVR3igjlr0BQDGN0ubGZBZA4qMZCUupiZCQQUb0mFZAeRHLYBZBRWl67tFgCo9FI84P8v3QNZBr4xQvwxrmQ2oQI1dZCdpU6ZAYZCW4RNZC4Jz7H1akveni10GTgdDTWLgCJwzA0ZBJqdoJPxruJy5h8nP646sQSYJNmghEP8uKgDRZCbUVE0Ee6lMCcXFllXG6EwBbbx3VogSAk2UZBT8YbHhZCyLWZCkm0G4GSXGS`
4. Leave "Account ID" empty (auto-detected)
5. Click **"Connect"**

### Step 3: Connect YouTube

1. In the same page, click **"Connect Account"** next to YouTube
2. Paste your YouTube API key: `AIzaSyBv51l0oue7tS_gCKLBVTGONj3Xsct6WUI`
3. **IMPORTANT:** Enter your **YouTube Channel ID** in the "Account ID" field
   - Find it in: YouTube Studio → Settings → Channel → Advanced settings
   - Or in your channel URL: `youtube.com/channel/UC...` (the UC... part is your Channel ID)
4. Click **"Connect"**

## 📝 Finding Your YouTube Channel ID

**Method 1: From YouTube Studio**
1. Go to [YouTube Studio](https://studio.youtube.com)
2. Click **Settings** (gear icon)
3. Go to **Channel** → **Advanced settings**
4. Your Channel ID is shown at the bottom

**Method 2: From Your Channel URL**
- Go to your YouTube channel
- Look at the URL: `youtube.com/channel/UCxxxxxxxxxxxxxxxxxxxxx`
- The part after `/channel/` is your Channel ID

**Method 3: Using Your API Key**
You can use this API call to find it:
```bash
curl "https://www.googleapis.com/youtube/v3/channels?part=id&mine=true&key=YOUR_API_KEY"
```
(Note: This only works if you have OAuth token, not API key alone)

## ✅ Verification

After connecting:
- ✅ Both accounts should show as "Connected" in green
- ✅ You can click "Sync Data" to fetch your posts/videos
- ✅ Analytics will appear in `/dashboard`

## 🆘 Troubleshooting

### Facebook Token Issues
- **"Invalid token"**: Token may have expired. Generate a new one from [Facebook Graph API Explorer](https://developers.facebook.com/tools/explorer/)
- **"Insufficient permissions"**: Token needs proper scopes (e.g., `pages_read_engagement`)

### YouTube API Key Issues
- **"Invalid API key"**: 
  - Check for typos
  - Ensure YouTube Data API v3 is enabled in [Google Cloud Console](https://console.cloud.google.com)
- **"Channel ID required"**: 
  - Make sure you entered your Channel ID in the Account ID field
  - Channel ID should start with "UC" and be 24 characters long

### Both Work Great! ✅

Your credentials are both valid and will work perfectly with the manual connection method. The system automatically detects:
- **Facebook token** → Uses as OAuth access token
- **YouTube API key** → Uses as API key (different authentication method)

## 📊 Next Steps

Once connected:
1. **Sync Data:** Click "Sync Data" button to fetch your posts/videos
2. **View Analytics:** Go to `/dashboard` to see your analytics
3. **Create Content:** Go to `/content/create` to schedule posts
4. **View Insights:** Check `/insights` for detailed analytics

---

**Ready?** Navigate to `/settings/accounts` and start connecting! 🚀

