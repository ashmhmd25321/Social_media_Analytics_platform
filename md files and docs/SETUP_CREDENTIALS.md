# Quick Setup: Add Your API Credentials

## Add These to `backend/.env`

Copy and paste these lines into your `backend/.env` file:

```env
# Default Platform API Credentials
FACEBOOK_ACCESS_TOKEN=EAAVR3igjlr0BQDGN0ubGZBZA4qMZCUupiZCQQUb0mFZAeRHLYBZBRWl67tFgCo9FI84P8v3QNZBr4xQvwxrmQ2oQI1dZCdpU6ZAYZCW4RNZC4Jz7H1akveni10GTgdDTWLgCJwzA0ZBJqdoJPxruJy5h8nP646sQSYJNmghEP8uKgDRZCbUVE0Ee6lMCcXFllXG6EwBbbx3VogSAk2UZBT8YbHhZCyLWZCkm0G4GSXGS
FACEBOOK_PAGE_ID=
YOUTUBE_API_KEY=AIzaSyBv51l0oue7tS_gCKLBVTGONj3Xsct6WUI
YOUTUBE_CHANNEL_ID=UC...your-channel-id-here
```

## Find Your YouTube Channel ID

1. Go to https://studio.youtube.com
2. Click Settings → Channel → Advanced settings
3. Copy your Channel ID (starts with "UC")

Or check your channel URL: `youtube.com/channel/UC...`

## What Happens Next

✅ **New users** will automatically have accounts connected  
✅ **Existing users** can use the platform without manual connection  
✅ **All users** can still connect their own accounts if they want  

## Restart Backend

After adding to `.env`, restart your backend:

```bash
cd backend
npm run dev
```

That's it! The system will automatically use these credentials for all users. 🚀

