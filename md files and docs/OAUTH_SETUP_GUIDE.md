# OAuth Setup Guide for Social Media Analytics Platform

## Overview

OAuth is the **recommended method** for connecting accounts because:
- ✅ **Each user connects their OWN account** - When a user clicks "Connect", they log in with their own Facebook/Instagram/YouTube account
- ✅ **More secure** - Users don't need to manually copy/paste tokens
- ✅ **Automatic token refresh** - Tokens are refreshed automatically when they expire
- ✅ **Better user experience** - Simple "Connect" button, no technical knowledge needed
- ✅ **Industry standard** - This is how all major apps connect social media accounts

**Important:** The App ID/Secret in `.env` are YOUR application's credentials (like a registration), NOT tied to any specific user. Each user authenticates with their own account.

---

## Facebook & Instagram Setup

### Step 1: Create Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Choose "Business" as the app type
4. Fill in app details:
   - App Name: Your app name
   - App Contact Email: Your email
   - Business Account: Select or create one

### Step 2: Add Products
1. In your app dashboard, click "Add Product"
2. Add **Facebook Login**
3. Add **Instagram Basic Display** (for Instagram)

### Step 3: Configure OAuth Settings
1. Go to **Settings** → **Basic**
2. Note your **App ID** and **App Secret**
3. Add **Valid OAuth Redirect URIs**:
   ```
   http://localhost:5001/api/social/callback/facebook
   http://localhost:5001/api/social/callback/instagram
   ```
   (Replace `localhost:5001` with your production backend URL when deploying)

### Step 4: Add to Backend `.env`
```env
FACEBOOK_CLIENT_ID=your_app_id_here
FACEBOOK_CLIENT_SECRET=your_app_secret_here
INSTAGRAM_CLIENT_ID=your_app_id_here  # Same as Facebook
INSTAGRAM_CLIENT_SECRET=your_app_secret_here  # Same as Facebook
```

### Step 5: Test Mode vs Live Mode
- **Test Mode**: Only you and test users can connect
- **Live Mode**: Anyone can connect (requires app review for some permissions)

---

## YouTube Setup

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name (e.g., "Social Media Analytics")
4. Click "Create"

### Step 2: Enable YouTube Data API
1. In your project, go to **APIs & Services** → **Library**
2. Search for "YouTube Data API v3"
3. Click on it and click **Enable**

### Step 3: Create OAuth 2.0 Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. If prompted, configure OAuth consent screen first:
   - User Type: External (unless you have Google Workspace)
   - App name: Your app name
   - User support email: Your email
   - Developer contact: Your email
   - Click "Save and Continue"
   - Add scopes:
     - `https://www.googleapis.com/auth/youtube.readonly`
     - `https://www.googleapis.com/auth/youtube.force-ssl`
   - Click "Save and Continue"
   - Add test users (your email) if in testing mode
   - Click "Save and Continue"
4. Back to Credentials, create OAuth client:
   - Application type: **Web application**
   - Name: "Social Media Analytics Web Client"
   - Authorized redirect URIs:
     ```
     http://localhost:5001/api/social/callback/youtube
     ```
     (Replace `localhost:5001` with your production backend URL when deploying)
   - Click "Create"
5. Copy the **Client ID** and **Client Secret**

### Step 4: Add to Backend `.env`
```env
YOUTUBE_CLIENT_ID=your_client_id_here
YOUTUBE_CLIENT_SECRET=your_client_secret_here
```

### Step 5: Publish Your App (for production)
- Go to **OAuth consent screen**
- Click "Publish App" when ready for production use
- Note: App review may be required for certain scopes

---

## How OAuth Works (Multi-User Support)

### The Flow:
1. **User clicks "Connect with OAuth"** on your platform
2. **User is redirected** to Facebook/Instagram/YouTube login page
3. **User logs in with THEIR account** (not yours!)
4. **User grants permissions** to your app
5. **Platform redirects back** with an authorization code
6. **Your backend exchanges code** for access token
7. **Token is saved** to database linked to that specific user

### Key Points:
- ✅ **App ID/Secret** = Your app's registration (like a license plate)
- ✅ **User's login** = Each user authenticates with their own account
- ✅ **Access token** = Unique to each user, gives access to THEIR data only
- ✅ **Multiple users** = Each gets their own token for their own account

---

## Environment Variables Summary

Add these to your `backend/.env` file:

```env
# Facebook & Instagram (same credentials)
FACEBOOK_CLIENT_ID=your_facebook_app_id
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret
INSTAGRAM_CLIENT_ID=your_facebook_app_id  # Same as Facebook
INSTAGRAM_CLIENT_SECRET=your_facebook_app_secret  # Same as Facebook

# YouTube
YOUTUBE_CLIENT_ID=your_google_client_id
YOUTUBE_CLIENT_SECRET=your_google_client_secret

# Backend URL (for OAuth redirects)
BACKEND_URL=http://localhost:5001
FRONTEND_URL=http://localhost:3000
```

---

## Testing OAuth

1. **Start your backend server**
2. **Go to** `http://localhost:3000/settings/accounts`
3. **Click "Connect with OAuth"** on any platform
4. **You should be redirected** to the platform's login page
5. **Log in with your account**
6. **Grant permissions**
7. **You'll be redirected back** and your account will be connected

---

## Troubleshooting

### "Platform OAuth not configured"
- Check that environment variables are set in `backend/.env`
- Restart your backend server after adding env variables
- Check for typos in variable names

### "Invalid redirect URI"
- Make sure the redirect URI in your OAuth app matches exactly:
  - `http://localhost:5001/api/social/callback/facebook`
  - `http://localhost:5001/api/social/callback/youtube`
- No trailing slashes!

### "App not in development mode"
- For Facebook: Add test users in App Dashboard → Roles → Test Users
- For YouTube: Add test users in OAuth consent screen

### Token expires quickly
- OAuth tokens can be refreshed automatically using refresh tokens
- The system handles token refresh automatically

---

## Production Deployment

When deploying to production:

1. **Update redirect URIs** in all OAuth apps:
   - Facebook: `https://yourdomain.com/api/social/callback/facebook`
   - YouTube: `https://yourdomain.com/api/social/callback/youtube`

2. **Update environment variables**:
   ```env
   BACKEND_URL=https://api.yourdomain.com
   FRONTEND_URL=https://yourdomain.com
   ```

3. **Publish your apps**:
   - Facebook: Switch to Live mode
   - YouTube: Publish OAuth consent screen

4. **Submit for review** (if needed for certain permissions)

---

## Manual Connection vs OAuth

### OAuth (Recommended) ✅
- Better user experience
- More secure
- Automatic token refresh
- Industry standard
- Requires one-time setup (App ID/Secret)

### Manual Connection (Fallback)
- Users enter their own tokens
- No backend setup needed
- Good for testing
- Users need technical knowledge
- Tokens may expire and need manual refresh

**Recommendation:** Use OAuth as primary method, keep manual connection as fallback option.

---

## Recommended YouTube Tutorials

### Facebook OAuth Setup
1. **"Facebook Login with OAuth 2.0 - Complete Tutorial"**
   - Search: "Facebook OAuth 2.0 tutorial 2024"
   - Look for videos that cover:
     - Creating Facebook App
     - Configuring OAuth redirect URIs
     - Getting App ID and App Secret
     - Testing OAuth flow

2. **"Facebook Graph API Tutorial for Beginners"**
   - Search: "Facebook Graph API tutorial"
   - Helps understand how Facebook API works with OAuth

### YouTube/Google OAuth Setup
1. **"OAuth 2.0 (Google API) - Complete Guide"**
   - Video ID: `9vh4VGjaMco` (mentioned in Google docs)
   - Search: "Google OAuth 2.0 tutorial YouTube API"
   - Covers:
     - Google Cloud Console setup
     - Creating OAuth credentials
     - YouTube Data API integration

2. **"YouTube Data API v3 - OAuth 2.0 Setup"**
   - Search: "YouTube Data API OAuth setup tutorial"
   - Step-by-step guide for YouTube API authentication

3. **"Google Cloud Console - OAuth 2.0 Setup Tutorial"**
   - Search: "Google Cloud OAuth 2.0 setup"
   - Covers creating projects and credentials

### Instagram OAuth Setup
1. **"Instagram Graph API - OAuth Setup Tutorial"**
   - Search: "Instagram Graph API OAuth tutorial"
   - Note: Instagram uses Facebook's OAuth system
   - Same setup as Facebook but with Instagram permissions

### General OAuth 2.0 Concepts
1. **"OAuth 2.0 Explained in Simple Terms"**
   - Search: "OAuth 2.0 explained"
   - Helps understand the OAuth flow conceptually

2. **"OAuth 2.0 Flow - Authorization Code Grant"**
   - Search: "OAuth 2.0 authorization code flow"
   - Explains the technical flow used by all platforms

### How to Find Good Tutorials
When searching YouTube, use these keywords:
- `[Platform] OAuth setup tutorial 2024`
- `[Platform] API authentication guide`
- `[Platform] developer console setup`
- `OAuth 2.0 [Platform] integration`

**Tips:**
- ✅ Look for videos from 2023-2024 (APIs change frequently)
- ✅ Prefer videos with step-by-step screen recordings
- ✅ Check video comments for updates/clarifications
- ✅ Watch official platform channels (Facebook Developers, Google Developers)

### Popular Channels
- **Traversy Media** - General web development tutorials
- **The Net Ninja** - OAuth and API tutorials
- **freeCodeCamp.org** - Comprehensive tutorials
- **Facebook Developers** (Official) - Facebook/Instagram specific
- **Google Developers** (Official) - Google/YouTube specific

---

## Quick Video Search Links

Copy and paste these into YouTube search:

1. **Facebook OAuth:**
   ```
   Facebook OAuth 2.0 setup tutorial 2024
   ```

2. **YouTube OAuth:**
   ```
   YouTube Data API OAuth 2.0 setup Google Cloud
   ```

3. **Instagram OAuth:**
   ```
   Instagram Graph API OAuth setup Facebook
   ```

4. **General OAuth:**
   ```
   OAuth 2.0 explained simple tutorial
   ```

