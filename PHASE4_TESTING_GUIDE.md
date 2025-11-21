# Phase 4: Data Collection & Storage - Testing Guide

## ✅ Implementation Status

**Infrastructure:** ✅ **COMPLETE**
**Facebook/Instagram Integration:** ✅ **COMPLETE**
**Scheduled Jobs:** ✅ **COMPLETE**
**Frontend UI:** ✅ **COMPLETE**

## 🚀 Setup Steps

### 1. Run Database Migration

```bash
cd backend
mysql -u root -p social_media_analytics < src/config/database-schema-phase4.sql
```

This creates the following tables:
- `social_posts`
- `post_engagement_metrics`
- `engagement_snapshots`
- `follower_metrics`
- `follower_snapshots`
- `data_collection_jobs`
- `api_rate_limits`

### 2. Verify Backend is Running

```bash
# Check if backend is running
curl http://localhost:5001/health

# Should return: {"status":"healthy","timestamp":"..."}
```

### 3. Verify Frontend is Running

Open: http://localhost:3000

## 🧪 Testing the Data Collection

### Step 1: Login to the Application

1. Navigate to: http://localhost:3000/auth/login
2. Login with your credentials
3. You'll be redirected to the dashboard

### Step 2: Connect a Social Media Account

1. Go to **Settings** → **Manage Connected Accounts**
   - Or navigate to: http://localhost:3000/settings/accounts

2. **Note:** For Facebook/Instagram to work, you need:
   - Facebook App ID and Secret configured in `backend/.env`
   - OAuth redirect URI configured in Facebook Developer Console
   - Valid access tokens

### Step 3: Test Manual Data Sync

1. On the **Connected Accounts** page, you'll see connected accounts
2. Each account has a **"Sync Data"** button
3. Click **"Sync Data"** on a connected Facebook account
4. You should see:
   - Loading state: "Syncing..."
   - Success message: "Successfully collected X posts!"
   - Or error message if something fails

### Step 4: View Collected Data

**Via Browser:**
- The sync button shows success/error messages
- Posts will be stored in the database

**Via API (for testing):**
```bash
# Get posts for an account (requires auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5001/api/data/posts/ACCOUNT_ID

# Get collection jobs
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5001/api/data/jobs/ACCOUNT_ID

# Get follower metrics
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5001/api/data/followers/ACCOUNT_ID
```

## 📊 API Endpoints

All endpoints require authentication (JWT token in Authorization header).

### Data Collection
- `POST /api/data/collect/:accountId` - Manually sync account data
  - Query params: `?limit=50&since=2024-01-01`
  - Response: `{ success: true, data: { posts_collected: X, ... } }`

### Data Retrieval
- `GET /api/data/posts/:accountId` - Get posts for an account
  - Query params: `?limit=50&offset=0`
  - Response: `{ success: true, posts: [...], total: X }`

- `GET /api/data/posts` - Get all user's posts
  - Response: `{ success: true, posts: [...], total: X }`

- `GET /api/data/followers/:accountId` - Get follower metrics
  - Response: `{ success: true, metrics: { follower_count: X, ... } }`

- `GET /api/data/jobs/:accountId` - Get collection job history
  - Response: `{ success: true, jobs: [...] }`

## 🔄 Scheduled Jobs

The scheduler automatically runs:
- **Daily Full Sync:** 2:00 AM (all active accounts)
- **Hourly Incremental Sync:** Every hour (all active accounts)

To disable scheduler:
```env
ENABLE_SCHEDULER=false
```

## ⚠️ Important Notes

### Facebook/Instagram Integration

**Requirements:**
1. Facebook App created in Facebook Developer Console
2. App ID and Secret in `backend/.env`:
   ```env
   FACEBOOK_APP_ID=your_app_id
   FACEBOOK_APP_SECRET=your_app_secret
   ```

3. OAuth Redirect URI configured:
   - Facebook: `http://localhost:5001/api/social/callback/facebook`
   - Add this to Facebook App settings

4. Required Permissions:
   - `pages_read_engagement` (for posts and engagement)
   - `pages_read_user_content` (for page content)
   - `pages_show_list` (for page list)

**Limitations:**
- Facebook API has rate limits
- Some metrics require specific permissions
- Instagram accounts need to be connected via Facebook

### Testing Without Real Accounts

If you don't have Facebook OAuth credentials, you can:
1. Test the API structure and endpoints
2. Test the UI flow (sync button, loading states)
3. Mock the Facebook service for development

## 🐛 Troubleshooting

### "Account is not connected or active"
- Make sure the account status is `connected` in database
- Check `is_active` is `true`

### "Failed to collect data"
- Check account has valid `access_token`
- Verify token hasn't expired
- Check Facebook API permissions
- Review server logs for detailed error

### "No posts collected"
- Account might not have any posts
- API permissions might be insufficient
- Rate limits might be exceeded

### Database Errors
- Make sure Phase 4 schema is migrated
- Check MySQL is running
- Verify database connection in `.env`

## 📝 Next Steps

1. **Test with Real Facebook Account:**
   - Connect a Facebook page
   - Click "Sync Data"
   - Verify posts are collected

2. **Implement Other Platforms:**
   - Twitter/X API integration
   - LinkedIn API integration
   - YouTube API integration
   - TikTok API integration

3. **Build Analytics Dashboard:**
   - Display collected posts
   - Show engagement metrics
   - Create visualizations (Phase 5)

---

**Ready for Testing!** 🎉

The infrastructure is complete and ready. Once you have OAuth credentials configured, you can test the full data collection flow.

