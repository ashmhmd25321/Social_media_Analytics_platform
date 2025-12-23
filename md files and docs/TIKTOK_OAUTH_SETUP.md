# TikTok OAuth Setup Guide - Complete Step-by-Step Instructions

## 📋 Overview

This guide will walk you through:
1. ✅ Creating a TikTok Developer Account
2. ✅ Creating a TikTok App
3. ✅ Getting OAuth Client Key and Secret
4. ✅ Configuring Redirect URIs
5. ✅ Setting Up Permissions (Scopes)
6. ✅ Adding Test Users
7. ✅ Configuring Your Backend

**Time Required:** ~15-20 minutes  
**Difficulty:** ⭐⭐☆☆☆ (Easy)  
**Cost:** 100% FREE

---

## 🚀 Step 1: Create a TikTok Developer Account

### 1.1 Visit TikTok Developer Portal

1. **Go to TikTok for Developers:**
   - Visit: https://developers.tiktok.com/
   - Click **"Log In"** or **"Sign Up"** in the top right corner

2. **Sign In with TikTok:**
   - If you have a TikTok account: Click **"Log In"** and sign in with your TikTok credentials
   - If you don't have a TikTok account: Click **"Sign Up"** to create one first
     - You'll need a phone number or email to create a TikTok account
     - Complete the TikTok account creation process

### 1.2 Register as a Developer

1. **Complete Developer Registration:**
   - After logging in, you may be prompted to register as a developer
   - Fill in the registration form:
     - **Developer Name:** Your name or company name
     - **Email:** Your email address
     - **Country/Region:** Select your location
     - **Developer Type:** Choose "Individual" or "Business"
   - Read and accept TikTok's Developer Terms of Service
   - Click **"Submit"** or **"Register"**

2. **Verify Your Email (if required):**
   - Check your email for a verification link
   - Click the verification link to activate your developer account

**✅ Step 1 Complete!** You now have a TikTok Developer Account.

---

## 📱 Step 2: Create a TikTok App

### 2.1 Navigate to App Management

1. **Go to Manage Apps:**
   - After logging in, click **"My Apps"** or **"Manage Apps"** in the top navigation
   - Or visit directly: https://developers.tiktok.com/apps

2. **Create New App:**
   - Click the **"+ Create App"** or **"Create New App"** button
   - You may see a welcome screen - click **"Get Started"** or **"Create App"**

### 2.2 Fill in App Details

1. **App Information:**
   - **App Name:** Enter a name for your app
     - Example: `Social Media Analytics Platform`
     - This name will be shown to users during OAuth
   - **App Category:** Select **"Analytics"** or **"Business"**
   - **Description:** Briefly describe your app
     - Example: `Social media analytics and insights platform for tracking TikTok performance`
   - **Website URL:** (Optional) Your website URL
     - For development: `http://localhost:3000`
     - For production: Your actual website URL

2. **Submit Application:**
   - Review all information
   - Click **"Submit"** or **"Create App"**
   - Your app will be created immediately (no approval needed for basic setup!)

**✅ Step 2 Complete!** Your TikTok app is created.

---

## 📄 Step 2.5: Add Terms of Service and Privacy Policy URLs

**⚠️ IMPORTANT:** After creating your app, TikTok requires you to provide Terms of Service and Privacy Policy URLs before you can use OAuth in production. These are **required fields** (marked with *).

### What You Need to Provide

TikTok requires **publicly accessible URLs** (must be `https://` in production) that point to:
1. **Terms of Service URL** - Your app's terms and conditions
2. **Privacy Policy URL** - Your app's privacy policy explaining how you handle user data

### Option 1: Quick Solution for Development/Testing (Recommended)

For development and testing, you can create simple pages using **free hosting services**:

#### Using GitHub Pages (Free & Easy)

1. **Create a GitHub Repository:**
   - Go to https://github.com/new
   - Create a new repository (e.g., `social-media-analytics-legal`)
   - Make it **public** (required for free GitHub Pages)

2. **Create Terms of Service Page:**
   - Create a file: `terms.html` or `terms.md`
   - Add basic terms content (see template below)
   - Commit and push to GitHub

3. **Create Privacy Policy Page:**
   - Create a file: `privacy.html` or `privacy.md`
   - Add basic privacy policy content (see template below)
   - Commit and push to GitHub

4. **Enable GitHub Pages:**
   - Go to repository **Settings** → **Pages**
   - Select **main branch** as source
   - Your pages will be available at:
     - `https://yourusername.github.io/repository-name/terms.html`
     - `https://yourusername.github.io/repository-name/privacy.html`

5. **Use These URLs in TikTok:**
   - Terms of Service URL: `https://yourusername.github.io/repository-name/terms.html`
   - Privacy Policy URL: `https://yourusername.github.io/repository-name/privacy.html`

#### Using Other Free Hosting Options

- **Netlify Drop:** https://app.netlify.com/drop (drag & drop HTML files)
- **Vercel:** https://vercel.com (connect GitHub repo)
- **GitHub Gist:** Create HTML files and use raw URLs (less professional but works)

### Option 2: Create Simple HTML Pages Locally

1. **Create `terms.html`:**
   ```html
   <!DOCTYPE html>
   <html>
   <head>
       <title>Terms of Service - Social Media Analytics Platform</title>
       <meta charset="UTF-8">
   </head>
   <body>
       <h1>Terms of Service</h1>
       <p>Last updated: [Date]</p>
       <h2>1. Acceptance of Terms</h2>
       <p>By accessing and using this Social Media Analytics Platform, you accept and agree to be bound by these Terms of Service.</p>
       <h2>2. Description of Service</h2>
       <p>This platform provides social media analytics and insights for connected social media accounts.</p>
       <h2>3. User Responsibilities</h2>
       <p>Users are responsible for maintaining the security of their accounts and for all activities that occur under their account.</p>
       <h2>4. Data Collection</h2>
       <p>We collect and analyze data from your connected social media accounts to provide analytics and insights.</p>
       <h2>5. Limitation of Liability</h2>
       <p>This service is provided "as is" without warranties of any kind.</p>
   </body>
   </html>
   ```

2. **Create `privacy.html`:**
   ```html
   <!DOCTYPE html>
   <html>
   <head>
       <title>Privacy Policy - Social Media Analytics Platform</title>
       <meta charset="UTF-8">
   </head>
   <body>
       <h1>Privacy Policy</h1>
       <p>Last updated: [Date]</p>
       <h2>1. Information We Collect</h2>
       <p>We collect information from your connected social media accounts, including:</p>
       <ul>
           <li>Profile information (username, display name, avatar)</li>
           <li>Post and content data</li>
           <li>Engagement metrics (likes, comments, shares, views)</li>
           <li>Follower statistics</li>
       </ul>
       <h2>2. How We Use Your Information</h2>
       <p>We use collected data to:</p>
       <ul>
           <li>Generate analytics and insights</li>
           <li>Display performance metrics</li>
           <li>Provide recommendations</li>
       </ul>
       <h2>3. Data Storage</h2>
       <p>Your data is stored securely in our database and is only accessible to you through your account.</p>
       <h2>4. Third-Party Services</h2>
       <p>We use OAuth to connect to social media platforms. We do not share your data with third parties except as required by law.</p>
       <h2>5. Your Rights</h2>
       <p>You can disconnect your accounts at any time, which will stop data collection. You can also request deletion of your data.</p>
   </body>
   </html>
   ```

3. **Host these files** using one of the free hosting options above.

### Option 3: Use Online Generators (Quick but Generic)

You can use free privacy policy generators, but they create generic content:

- **Privacy Policy Generator:** https://www.privacypolicygenerator.info/
- **Terms of Service Generator:** https://www.termsofservicegenerator.net/

**Note:** These generate generic templates that you should customize for your specific app.

### How to Add URLs in TikTok App Settings

1. **Navigate to App Configuration:**
   - Go to your app dashboard
   - Click on **"App details"** or **"Production"** → **"Draft"** in the left sidebar
   - You'll see the form with required fields

2. **Fill in Required Fields:**
   - **Terms of Service URL \***: Enter your Terms of Service URL
     - Example: `https://yourusername.github.io/repository-name/terms.html`
   - **Privacy Policy URL \***: Enter your Privacy Policy URL
     - Example: `https://yourusername.github.io/repository-name/privacy.html`
   - **Platforms \***: Check **"Web"** (and "Desktop" if applicable)

3. **Save Changes:**
   - Click **"Save"** button (top right)
   - Wait for confirmation that changes are saved

4. **Important Notes:**
   - ✅ URLs must be publicly accessible (not localhost)
   - ✅ URLs must use `https://` (required for production)
   - ✅ URLs must return actual HTML content (not 404 errors)
   - ✅ You can update these URLs later if needed
   - ⚠️ These URLs are required before submitting for review or using in production

### For Development/Testing

**If you're just testing locally:**
- You can use GitHub Pages URLs (free and works immediately)
- TikTok will accept these URLs even for development
- You can always update them later with your actual production URLs

**✅ Step 2.5 Complete!** Terms of Service and Privacy Policy URLs are configured.

---

## 🔑 Step 3: Get OAuth Client Key and Secret

### 3.1 Access App Credentials

1. **Navigate to App Dashboard:**
   - After creating the app, you'll be redirected to your app dashboard
   - If not, go to **"My Apps"** → Click on your app name

2. **Go to Basic Information:**
   - In the left sidebar, click **"Basic Information"** or **"App Details"**
   - Or look for a **"Credentials"** or **"Keys"** section

### 3.2 Retrieve Your Credentials

1. **Find Client Key (Client ID):**
   - Look for **"Client Key"** or **"App ID"** or **"Client ID"**
   - It will look like: `aw1234567890abcdef`
   - **Copy this value** - you'll need it for your backend

2. **Find Client Secret:**
   - Look for **"Client Secret"** or **"App Secret"**
   - It may be hidden - click **"Show"** or **"Reveal"** to view it
   - It will look like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
   - **Copy this value** - keep it secret!

3. **Save Your Credentials:**
   - ⚠️ **IMPORTANT:** Save both values in a secure place
   - You'll need them in Step 7 to configure your backend
   - The Client Secret is only shown once - if you lose it, you'll need to regenerate it

**✅ Step 3 Complete!** You have your OAuth credentials.

---

## 🔗 Step 4: Configure Redirect URIs

### 4.1 Navigate to OAuth Settings

1. **Go to OAuth Settings:**
   - In your app dashboard, look for **"OAuth"** or **"Login Kit"** in the left sidebar
   - Click on **"OAuth"** or **"Login Kit"** → **"Settings"** or **"Configuration"**

2. **Find Redirect URI Section:**
   - Look for **"Redirect URI"** or **"Callback URL"** or **"Authorized Redirect URIs"**

### 4.2 Add Redirect URIs

1. **Add Development URI:**
   - Click **"Add URI"** or **"+ Add"**
   - Enter your development redirect URI:
     ```
     http://localhost:5001/api/social/callback/tiktok
     ```
   - Click **"Save"** or **"Add"**

2. **Add Production URI (Optional):**
   - If you have a production URL, add it:
     ```
     https://yourdomain.com/api/social/callback/tiktok
     ```
   - Replace `yourdomain.com` with your actual domain

3. **Important Notes:**
   - ✅ Use `http://localhost:5001` for development (not `https`)
   - ✅ Use `https://` for production (required)
   - ✅ The URI must match exactly (no trailing slashes, correct port)
   - ✅ You can add multiple URIs (one per line or separate entries)

**✅ Step 4 Complete!** Redirect URIs are configured.

---

## 🔐 Step 5: Configure Permissions (Scopes)

### 5.1 Understand TikTok Scopes

TikTok uses **scopes** to request specific permissions from users. Here are the scopes you'll need for analytics:

**Required Scopes for Analytics:**
- `user.info.basic` - Access to user's basic profile information (username, display name, avatar)
- `video.list` - Access to user's public videos
- `video.upload` - Permission to view video uploads (optional, for analytics)

**Optional Scopes:**
- `user.info.stats` - Access to user statistics (follower count, etc.)
- `video.data` - Access to video metadata and analytics

### 5.2 Set Up Scopes

1. **Navigate to Scopes:**
   - In your app dashboard, go to **"OAuth"** or **"Login Kit"** → **"Scopes"** or **"Permissions"**

2. **Add Required Scopes:**
   - Look for **"Available Scopes"** or **"Requested Scopes"**
   - Add the following scopes:
     - ✅ `user.info.basic`
     - ✅ `video.list`
     - ✅ `user.info.stats` (if available)
   - Click **"Save"** or **"Update"**

3. **Note on Scope Approval:**
   - Some scopes may require approval for production use
   - For development/testing, you can use basic scopes immediately
   - Advanced scopes may need app review (similar to Facebook)

**✅ Step 5 Complete!** Permissions are configured.

---

## 👥 Step 6: Add Test Users (For Development)

### 6.1 Understanding Test Users

**Important:** For development and testing, you can use your own TikTok account without adding it as a test user. However, if you want to test with multiple accounts, you'll need to add them.

### 6.2 Add Test Users (If Needed)

1. **Navigate to Test Users:**
   - In your app dashboard, look for **"Test Users"** or **"Sandbox"** in the left sidebar
   - Or go to **"Settings"** → **"Test Users"**

2. **Add Test User:**
   - Click **"+ Add Test User"** or **"Add User"**
   - Enter the TikTok username or user ID of the account you want to add
   - Click **"Add"** or **"Save"**

3. **Note:**
   - For basic development, you can skip this step
   - You can test with your own TikTok account immediately
   - Test users are mainly needed for advanced features or production testing

**✅ Step 6 Complete!** Test users are added (if needed).

---

## ⚙️ Step 7: Configure Your Backend

### 7.1 Add Credentials to Environment Variables

1. **Open Your Backend `.env` File:**
   - Navigate to: `backend/.env`
   - If it doesn't exist, create it from `backend/.env.example`

2. **Add TikTok OAuth Credentials:**
   ```env
   # TikTok OAuth Configuration
   TIKTOK_CLIENT_ID=your_client_key_here
   TIKTOK_CLIENT_SECRET=your_client_secret_here
   ```
   
   **Replace:**
   - `your_client_key_here` with your **Client Key** from Step 3
   - `your_client_secret_here` with your **Client Secret** from Step 3

3. **Example:**
   ```env
   # TikTok OAuth Configuration
   TIKTOK_CLIENT_ID=aw1234567890abcdef
   TIKTOK_CLIENT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
   ```

### 7.2 Update OAuth Configuration

The backend code will need to be updated to support TikTok. This will be done in the implementation phase.

**For now, just save your credentials!**

### 7.3 Restart Your Backend

1. **Restart the Server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Verify Configuration:**
   - Check that the server starts without errors
   - The TikTok OAuth endpoints should now be available

**✅ Step 7 Complete!** Backend is configured.

---

## 🧪 Step 8: Test the Connection

### 8.1 Test OAuth Flow

1. **Start Your Backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Your Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Connection:**
   - Go to: http://localhost:3000/settings/accounts
   - Click **"Connect"** on TikTok
   - You should be redirected to TikTok's OAuth page
   - Log in with your TikTok account
   - Grant permissions
   - You should be redirected back to your app
   - Account should be connected! ✅

### 8.2 Verify Data Collection

1. **Sync Data:**
   - Click **"Sync Data"** on the connected TikTok account
   - Check if videos and analytics are collected
   - View in dashboard

2. **Check Backend Logs:**
   - Look for successful API calls
   - Verify data is being stored in database

**✅ Step 8 Complete!** TikTok OAuth is working!

---

## 📝 Quick Reference

### Your TikTok App Credentials

Save these for reference:

```
Client Key (Client ID): aw1234567890abcdef
Client Secret: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
Redirect URI: http://localhost:5001/api/social/callback/tiktok
```

### Environment Variables

```env
TIKTOK_CLIENT_ID=your_client_key_here
TIKTOK_CLIENT_SECRET=your_client_secret_here
```

### Important URLs

- **Developer Portal:** https://developers.tiktok.com/
- **My Apps:** https://developers.tiktok.com/apps
- **API Documentation:** https://developers.tiktok.com/doc/
- **OAuth Documentation:** https://developers.tiktok.com/doc/login-kit-manage-user-access-tokens

---

## 🛠️ Troubleshooting

### Problem: "Invalid redirect URI"

**Solution:**
- Make sure the redirect URI in TikTok app settings matches exactly:
  ```
  http://localhost:5001/api/social/callback/tiktok
  ```
- Check for typos, extra spaces, or wrong port number
- Make sure you're using `http://` for localhost (not `https://`)

### Problem: "Invalid client credentials"

**Solution:**
- Verify your Client Key and Client Secret are correct in `.env`
- Make sure there are no extra spaces or quotes
- Restart your backend server after updating `.env`

### Problem: "Insufficient permissions"

**Solution:**
- Check that required scopes are added in TikTok app settings
- Make sure users grant all requested permissions during OAuth
- Some scopes may require app review for production

### Problem: "App not found" or "App not approved"

**Solution:**
- Make sure your app is created and active
- Check that you're using the correct Client Key
- For development, basic apps work immediately (no approval needed)

### Problem: "Rate limit exceeded"

**Solution:**
- TikTok has rate limits on API calls
- Wait a few minutes and try again
- Implement caching in your backend (already in code)

---

## 🔒 Security Best Practices

1. **Never Commit Secrets:**
   - ✅ Never commit `.env` file to git
   - ✅ Add `.env` to `.gitignore`
   - ✅ Use environment variables in production

2. **Protect Client Secret:**
   - ✅ Keep Client Secret secure
   - ✅ Don't share it publicly
   - ✅ Rotate it if compromised

3. **Use HTTPS in Production:**
   - ✅ Always use `https://` for production redirect URIs
   - ✅ Never use `http://` in production

4. **Token Management:**
   - ✅ Store access tokens securely in database
   - ✅ Implement token refresh mechanism
   - ✅ Handle token expiration gracefully

---

## 📚 Additional Resources

- **TikTok Developer Portal:** https://developers.tiktok.com/
- **OAuth 2.0 Guide:** https://developers.tiktok.com/doc/login-kit-manage-user-access-tokens
- **Scopes Overview:** https://developers.tiktok.com/doc/scopes-overview
- **API Reference:** https://developers.tiktok.com/doc/
- **Video API:** https://developers.tiktok.com/doc/tiktok-api-v2-get-video-list

---

## ✅ Checklist

Use this checklist to ensure you've completed all steps:

- [ ] Created TikTok Developer Account
- [ ] Created TikTok App
- [ ] Got Client Key (Client ID)
- [ ] Got Client Secret
- [ ] Added Redirect URI: `http://localhost:5001/api/social/callback/tiktok`
- [ ] Configured Required Scopes
- [ ] Added credentials to `backend/.env`
- [ ] Restarted backend server
- [ ] Tested OAuth connection
- [ ] Verified data collection works

---

## 🎉 Success!

If you've completed all steps, you should now have:
- ✅ TikTok Developer Account
- ✅ TikTok App created
- ✅ OAuth credentials configured
- ✅ Backend ready for TikTok integration

**Next Steps:**
- The backend code needs to be updated to support TikTok OAuth
- A `TikTokService.ts` file needs to be created for data collection
- Frontend UI needs to be updated to show TikTok as an option

**Need Help?**
- Check the troubleshooting section above
- Review TikTok's official documentation
- Contact TikTok Developer Support if needed

---

## 📞 Support

If you encounter issues:
1. Check TikTok Developer Documentation
2. Review error messages in backend logs
3. Verify all credentials are correct
4. Test with a different TikTok account
5. Contact TikTok Developer Support: https://developers.tiktok.com/support

---

**Last Updated:** 2024  
**Platform:** TikTok for Developers  
**Status:** ✅ Ready for Implementation

