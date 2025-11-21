# Quick Start: Test Phase 4 with Facebook - Step by Step

This is a simplified, actionable guide. Follow each step in order.

---

## ✅ Step 1: Get Facebook App Credentials (5 minutes)

### 1.1 Create Facebook App

1. Go to: **https://developers.facebook.com/**
2. Click: **"My Apps"** → **"Create App"**
3. Select: **"Business"** → Click **"Next"**
4. Fill in:
   - **App Name:** `Social Media Analytics` (or any name)
   - **Email:** Your email
5. Click: **"Create App"**

### 1.2 Get App ID and Secret

1. In App Dashboard: **Settings** → **Basic** (left sidebar)
2. Copy:
   - **App ID** (e.g., `1234567890123456`)
   - **App Secret** (click "Show" to reveal)

**📋 Write these down - you'll need them in Step 3!**

---

## ✅ Step 2: Configure Facebook App (3 minutes)

### 2.1 Add Facebook Login

1. Click: **"+ Add Product"** (left sidebar)
2. Find: **"Facebook Login"**
3. Click: **"Set Up"**

### 2.2 Set Redirect URI

1. Go to: **Facebook Login** → **Settings**
2. Under **"Valid OAuth Redirect URIs"**:
   - Click **"Add URI"**
   - Enter: `http://localhost:5001/api/social/callback/facebook`
   - Click **"Save Changes"**

### 2.3 Add Permissions

1. Go to: **App Review** → **Permissions and Features**
2. Add these permissions (click each, then "Request" or "Add"):
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_read_user_content`
   - `pages_manage_metadata`

**Note:** In Development mode, these work without App Review.

---

## ✅ Step 3: Configure Backend (2 minutes)

### Option A: Using Setup Script (Easiest)

```bash
cd "/Volumes/External_01/ASH/Projects/Social Media Analytics Web"
./scripts/setup-facebook-oauth.sh
```

Enter your App ID and Secret when prompted.

### Option B: Manual Configuration

1. **Open:** `backend/.env`
2. **Add these lines at the end:**
   ```env
   # Facebook OAuth Configuration
   FACEBOOK_CLIENT_ID=your_app_id_here
   FACEBOOK_CLIENT_SECRET=your_app_secret_here
   INSTAGRAM_CLIENT_ID=your_app_id_here
   INSTAGRAM_CLIENT_SECRET=your_app_secret_here
   BACKEND_URL=http://localhost:5001
   ```
3. **Replace** `your_app_id_here` and `your_app_secret_here` with your actual values

**Example:**
```env
FACEBOOK_CLIENT_ID=1234567890123456
FACEBOOK_CLIENT_SECRET=abcdef1234567890abcdef1234567890
INSTAGRAM_CLIENT_ID=1234567890123456
INSTAGRAM_CLIENT_SECRET=abcdef1234567890abcdef1234567890
BACKEND_URL=http://localhost:5001
```

---

## ✅ Step 4: Restart Backend (1 minute)

**IMPORTANT:** Backend must be restarted after changing `.env`!

1. **Stop backend** (Ctrl+C in terminal where it's running)

2. **Restart:**
   ```bash
   cd backend
   npm run dev
   ```

3. **Verify it's running:**
   ```bash
   curl http://localhost:5001/health
   ```
   
   Should return: `{"status":"healthy",...}`

---

## ✅ Step 5: Connect Facebook Account (2 minutes)

### 5.1 Login to App

1. **Open browser:** http://localhost:3000
2. **Login** with your user account
3. **Go to:** Settings → Manage Accounts
   - Or: http://localhost:3000/settings/accounts

### 5.2 Connect Facebook

1. **Find Facebook card** in "Available Platforms"
2. **Click:** "Connect" button
3. **Facebook will ask for permissions:**
   - Review permissions
   - Click **"Continue"** or **"Allow"**
4. **You'll be redirected back** to your app
5. **Facebook should appear** in "Connected Accounts" section

---

## ✅ Step 6: Test Data Collection (2 minutes)

### 6.1 Sync Data

1. **Find your connected Facebook account**
2. **Click:** "Sync Data" button
3. **Wait for completion:**
   - Shows "Syncing..." with spinner
   - Success: "Successfully collected X posts!"

### 6.2 Verify Data

**Check database:**
```bash
mysql -u root -p12345678 -e "USE social_media_analytics; SELECT COUNT(*) as posts FROM social_posts;"
```

**Should show:** Number of posts collected (e.g., `posts: 25`)

---

## ✅ Step 7: View Collected Data

### Via Database:

```bash
# View posts
mysql -u root -p12345678 -e "USE social_media_analytics; SELECT id, platform_post_id, LEFT(content, 50) as content_preview, published_at FROM social_posts ORDER BY published_at DESC LIMIT 10;"

# View engagement metrics
mysql -u root -p12345678 -e "USE social_media_analytics; SELECT post_id, likes_count, comments_count, shares_count FROM post_engagement_metrics LIMIT 10;"

# View collection jobs
mysql -u root -p12345678 -e "USE social_media_analytics; SELECT id, status, items_collected, duration_seconds, created_at FROM data_collection_jobs ORDER BY created_at DESC LIMIT 5;"
```

### Via API:

**Get your token:**
1. Browser DevTools (F12) → Application → Local Storage
2. Copy `accessToken` value

**Test API:**
```bash
TOKEN="your_token_here"
ACCOUNT_ID=1  # Replace with your account ID from database

# Get posts
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5001/api/data/posts/$ACCOUNT_ID

# Get jobs
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5001/api/data/jobs/$ACCOUNT_ID
```

---

## 🐛 Troubleshooting

### "Platform OAuth not configured"
- ✅ Check `.env` has `FACEBOOK_CLIENT_ID` and `FACEBOOK_CLIENT_SECRET`
- ✅ Restart backend server
- ✅ No extra spaces/quotes in `.env` values

### "Redirect URI mismatch"
- ✅ Facebook App → Facebook Login → Settings
- ✅ Verify URI: `http://localhost:5001/api/social/callback/facebook`
- ✅ Must match exactly (no trailing slash)

### "No pages found"
- ✅ Make sure you have a Facebook Page (not just profile)
- ✅ Grant `pages_show_list` permission
- ✅ Check backend logs for errors

### "0 posts collected"
- ✅ Page might have no posts
- ✅ Check backend console for API errors
- ✅ Verify access token has correct permissions

### Connection works but sync fails
- ✅ Check backend console logs
- ✅ Verify Facebook API is accessible
- ✅ Check rate limits in database

---

## 📊 Success Indicators

You'll know it's working when:

✅ Facebook account appears in "Connected Accounts"  
✅ "Sync Data" button completes without errors  
✅ Success message shows post count > 0  
✅ Database has posts in `social_posts` table  
✅ Engagement metrics in `post_engagement_metrics` table  
✅ Collection job shows `status = 'completed'`  

---

## 🎯 What's Next?

Once Phase 4 is working:

1. **Test scheduled jobs** - Wait for hourly sync
2. **Connect multiple accounts** - Test with different pages
3. **Move to Phase 5** - Build Analytics Dashboard

---

## 📝 Quick Reference

**Facebook App:** https://developers.facebook.com/apps/  
**Backend URL:** http://localhost:5001  
**Frontend URL:** http://localhost:3000  
**Redirect URI:** `http://localhost:5001/api/social/callback/facebook`  
**Database:** `social_media_analytics`  

**Key Files:**
- `backend/.env` - OAuth credentials
- `backend/src/config/oauth-config.ts` - OAuth configuration
- `backend/src/controllers/socialController.ts` - OAuth handler

---

**Ready?** Start with Step 1 and provide your App ID and Secret when you reach Step 3!

