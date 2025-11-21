# Phase 4: Facebook/Instagram Setup & Testing Guide

Complete step-by-step guide to test Phase 4 with real Facebook/Instagram data.

---

## 📋 Prerequisites

- [ ] MySQL database running
- [ ] Backend server can connect to MySQL
- [ ] Frontend and backend servers running
- [ ] Facebook Developer account (free)
- [ ] Facebook Page (or personal profile for testing)

---

## Step 1: Create Facebook App

### 1.1 Access Facebook Developers

1. **Go to:** https://developers.facebook.com/
2. **Login** with your Facebook account
3. **Click:** "My Apps" (top right)
4. **Click:** "Create App"

### 1.2 Create New App

1. **Select App Type:** 
   - Choose **"Business"** (recommended) or **"Other"**
   - Click **"Next"**

2. **Fill App Details:**
   - **App Name:** `Social Media Analytics` (or any name)
   - **App Contact Email:** Your email address
   - **Business Account:** (Optional) Leave blank or select
   - **Click:** "Create App"

3. **Complete Security Check:** (if prompted)
   - Enter your password
   - Complete CAPTCHA if shown

### 1.3 Get App Credentials

1. **In App Dashboard:** Go to **Settings** → **Basic** (left sidebar)

2. **Copy These Values:**
   - **App ID** - Copy this (e.g., `1234567890123456`)
   - **App Secret** - Click "Show" button, copy the secret (e.g., `abcdef1234567890abcdef1234567890`)

   ⚠️ **Keep these secure!** We'll add them to `.env` file.

---

## Step 2: Configure Facebook App

### 2.1 Add Facebook Login Product

1. **In App Dashboard:** Click **"+ Add Product"** (left sidebar)
2. **Find:** "Facebook Login"
3. **Click:** "Set Up" button

### 2.2 Configure OAuth Redirect URIs

1. **Go to:** Facebook Login → **Settings** (left sidebar)

2. **In "Valid OAuth Redirect URIs" section:**
   - **Click:** "Add URI"
   - **Enter:** `http://localhost:5001/api/social/callback/facebook`
   - **Click:** "Save Changes"

   ⚠️ **Important:** This must match exactly what's in your backend config!

### 2.3 Configure App Domains (Optional but Recommended)

1. **Go to:** Settings → **Basic**
2. **In "App Domains":**
   - Add: `localhost`
   - **Click:** "Save Changes"

### 2.4 Add Required Permissions

1. **Go to:** App Review → **Permissions and Features** (left sidebar)

2. **Add These Permissions:**
   - `pages_show_list` - To list user's Facebook Pages
   - `pages_read_engagement` - To read page engagement metrics
   - `pages_read_user_content` - To read page posts
   - `pages_manage_metadata` - To manage page metadata
   - `instagram_basic` - For Instagram basic info (if using Instagram)
   - `instagram_manage_insights` - For Instagram insights (if using Instagram)

3. **For Each Permission:**
   - Click the permission name
   - Click "Request" or "Add" button
   - Some may require App Review (but work in Development mode)

### 2.5 Add Test Users (For Development)

1. **Go to:** Roles → **Roles** (left sidebar)
2. **Add Testers:**
   - Click "Add People"
   - Enter your Facebook email or name
   - Select "Developer" or "Tester" role
   - Click "Add"

**OR**

1. **Go to:** Roles → **Test Users**
2. **Click:** "Add Test Users"
3. **Create test users** for testing

---

## Step 3: Configure Backend Environment

### 3.1 Update `.env` File

**Open:** `backend/.env`

**Add these lines at the end:**
```env
# Facebook OAuth Configuration
FACEBOOK_CLIENT_ID=your_app_id_here
FACEBOOK_CLIENT_SECRET=your_app_secret_here

# Instagram (uses same credentials if using Facebook Login)
INSTAGRAM_CLIENT_ID=your_app_id_here
INSTAGRAM_CLIENT_SECRET=your_app_secret_here
```

**Replace with your actual values:**
```env
FACEBOOK_CLIENT_ID=1234567890123456
FACEBOOK_CLIENT_SECRET=abcdef1234567890abcdef1234567890
INSTAGRAM_CLIENT_ID=1234567890123456
INSTAGRAM_CLIENT_SECRET=abcdef1234567890abcdef1234567890
```

### 3.2 Verify Configuration

**Check the file was saved correctly:**
```bash
cd backend
cat .env | grep FACEBOOK
```

**You should see:**
```
FACEBOOK_CLIENT_ID=1234567890123456
FACEBOOK_CLIENT_SECRET=abcdef1234567890abcdef1234567890
```

---

## Step 4: Restart Backend Server

**Important:** Backend must be restarted after changing `.env` file!

1. **Stop the backend server** (Ctrl+C in terminal)

2. **Restart it:**
   ```bash
   cd backend
   npm run dev
   ```

3. **Verify it's running:**
   ```bash
   curl http://localhost:5001/health
   ```
   
   Should return: `{"status":"healthy","timestamp":"..."}`

---

## Step 5: Test OAuth Connection

### 5.1 Login to Application

1. **Open browser:** http://localhost:3000
2. **Login** with your user account
3. **Navigate to:** Settings → Manage Accounts
   - Or go directly to: http://localhost:3000/settings/accounts

### 5.2 Connect Facebook Account

1. **Find Facebook card** in "Available Platforms" section
2. **Click:** "Connect" button
3. **You'll be redirected to Facebook:**
   - Facebook login page (if not logged in)
   - Permission approval page
4. **Review permissions** and click "Continue" or "Allow"
5. **You'll be redirected back** to your app

### 5.3 Verify Connection

1. **Check "Connected Accounts" section:**
   - Facebook should appear with a green checkmark
   - Should show your page name or username

2. **Verify in Database:**
   ```bash
   mysql -u root -p12345678 -e "USE social_media_analytics; SELECT id, platform_account_id, platform_display_name, account_status FROM user_social_accounts WHERE platform_id = 1;"
   ```

   Should show your connected account with:
   - `platform_account_id` = Your Facebook Page ID
   - `account_status` = `connected`

---

## Step 6: Test Data Collection

### 6.1 Sync Data via UI

1. **On Accounts Page:** Find your connected Facebook account
2. **Click:** "Sync Data" button
3. **Wait for sync to complete:**
   - Button shows "Syncing..." with spinner
   - Success message: "Successfully collected X posts!"

### 6.2 Verify Data Collection

**Check Database for Collected Posts:**
```bash
mysql -u root -p12345678 -e "USE social_media_analytics; SELECT COUNT(*) as total_posts FROM social_posts;"
```

**Check Collection Jobs:**
```bash
mysql -u root -p12345678 -e "USE social_media_analytics; SELECT id, status, items_collected, items_updated, duration_seconds, created_at FROM data_collection_jobs ORDER BY created_at DESC LIMIT 5;"
```

**View Collected Posts:**
```bash
mysql -u root -p12345678 -e "USE social_media_analytics; SELECT id, platform_post_id, content, content_type, published_at FROM social_posts ORDER BY published_at DESC LIMIT 10;"
```

**View Engagement Metrics:**
```bash
mysql -u root -p12345678 -e "USE social_media_analytics; SELECT post_id, likes_count, comments_count, shares_count, engagement_rate FROM post_engagement_metrics LIMIT 10;"
```

### 6.3 Test via API

**Get your access token from browser:**
1. Open browser DevTools (F12)
2. Go to Application → Local Storage
3. Copy `accessToken` value

**Test Collection API:**
```bash
TOKEN="your_access_token_here"
ACCOUNT_ID=1  # Replace with your account ID

curl -X POST "http://localhost:5001/api/data/collect/$ACCOUNT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Get Collection Jobs:**
```bash
curl -X GET "http://localhost:5001/api/data/jobs/$ACCOUNT_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**Get Collected Posts:**
```bash
curl -X GET "http://localhost:5001/api/data/posts/$ACCOUNT_ID" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Step 7: Troubleshooting

### Issue: "Platform OAuth not configured"

**Solution:**
- Check `.env` file has `FACEBOOK_CLIENT_ID` and `FACEBOOK_CLIENT_SECRET`
- Restart backend server
- Verify no extra spaces or quotes in `.env` values

### Issue: "Redirect URI mismatch"

**Error from Facebook:** "Redirect URI Mismatch"

**Solution:**
1. Check Facebook App → Facebook Login → Settings
2. Verify redirect URI is exactly: `http://localhost:5001/api/social/callback/facebook`
3. Make sure it's saved in Facebook
4. Check backend `.env` - redirect URI should match

### Issue: "Invalid OAuth access token"

**Solution:**
1. Disconnect and reconnect the account
2. Check token hasn't expired
3. Verify permissions are granted in Facebook App

### Issue: "No pages found"

**Solution:**
1. Make sure you have a Facebook Page (not just personal profile)
2. Grant `pages_show_list` permission
3. Check you're using a Page access token, not user token

### Issue: "Rate limit exceeded"

**Solution:**
- Facebook has rate limits based on app tier
- Wait a few minutes and try again
- Check rate limit tracking in database

### Issue: Data collection returns 0 posts

**Possible Causes:**
1. Page has no posts
2. Access token doesn't have correct permissions
3. Page is private/restricted
4. API call failed (check backend logs)

**Debug:**
```bash
# Check backend logs for errors
# Look for Facebook API error messages
```

---

## Step 8: Verify Complete Flow

### Checklist:

- [ ] Facebook App created
- [ ] App ID and Secret copied
- [ ] OAuth redirect URI configured in Facebook
- [ ] Permissions added
- [ ] `.env` file updated with credentials
- [ ] Backend server restarted
- [ ] Facebook account connected via UI
- [ ] Account appears in "Connected Accounts"
- [ ] "Sync Data" button works
- [ ] Posts collected and stored in database
- [ ] Engagement metrics collected
- [ ] Follower metrics collected
- [ ] Collection jobs tracked in database

---

## 📊 Expected Results

After successful sync, you should see:

1. **Database Tables Populated:**
   - `social_posts` - Contains your Facebook posts
   - `post_engagement_metrics` - Contains likes, comments, shares
   - `follower_metrics` - Contains follower count
   - `data_collection_jobs` - Contains job history

2. **UI Shows:**
   - Success message with post count
   - Connected account with sync button
   - No error messages

3. **API Returns:**
   - Posts with engagement metrics
   - Follower metrics
   - Collection job history

---

## 🎯 Next Steps

Once Phase 4 is working:

1. **Test Scheduled Jobs:**
   - Wait for hourly sync (or trigger manually)
   - Verify data updates automatically

2. **Test Multiple Accounts:**
   - Connect multiple Facebook Pages
   - Sync each independently

3. **Move to Phase 5:**
   - Build Analytics Dashboard
   - Visualize collected data
   - Create charts and reports

---

## 📝 Notes

- **Development Mode:** Your app is in Development mode, so only you and test users can use it
- **Token Expiration:** Facebook tokens may expire; system should handle refresh
- **Rate Limits:** Facebook has rate limits; system tracks and manages them
- **Page vs Profile:** For best results, use a Facebook Page (not personal profile)

---

**Ready to start?** Follow the steps above and provide your Facebook App ID and Secret when you reach Step 3!
