# Testing Phase 4 with Mock Data (No Facebook API Required)

Since Facebook app creation is having issues, we can test Phase 4 completely with **mock/test data**. This verifies the entire infrastructure works!

---

## 🎯 Option 1: Use Mock Service (Recommended)

### Step 1: Create Mock Account in Database

**Run this script:**
```bash
cd "/Volumes/External_01/ASH/Projects/Social Media Analytics Web"
./scripts/create-mock-account.sh
```

**Or manually via SQL:**
```bash
mysql -u root -p12345678 social_media_analytics << EOF
INSERT INTO user_social_accounts (
  user_id,
  platform_id,
  platform_account_id,
  platform_username,
  platform_display_name,
  access_token,
  account_status,
  is_active
) VALUES (
  1,  -- Replace with your user ID
  1,  -- Facebook platform ID
  'mock_account_test',
  'mock_user',
  'Mock Facebook Account',
  'mock_token',
  'connected',
  TRUE
);
EOF
```

### Step 2: Test Data Collection

1. **Login to app:** http://localhost:3000
2. **Go to:** Settings → Manage Accounts
3. **You should see:** "Mock Facebook Account" in connected accounts
4. **Click:** "Sync Data" button
5. **Result:** Should collect 25 mock posts with engagement metrics!

### Step 3: Verify Data

**Check database:**
```bash
# Check posts collected
mysql -u root -p12345678 -e "USE social_media_analytics; SELECT COUNT(*) as total_posts FROM social_posts;"

# View sample posts
mysql -u root -p12345678 -e "USE social_media_analytics; SELECT id, platform_post_id, LEFT(content, 50) as content, content_type, published_at FROM social_posts ORDER BY published_at DESC LIMIT 10;"

# Check engagement metrics
mysql -u root -p12345678 -e "USE social_media_analytics; SELECT post_id, likes_count, comments_count, shares_count, engagement_rate FROM post_engagement_metrics LIMIT 10;"

# Check collection jobs
mysql -u root -p12345678 -e "USE social_media_analytics; SELECT id, status, items_collected, items_updated, duration_seconds FROM data_collection_jobs ORDER BY created_at DESC LIMIT 5;"
```

---

## 🎯 Option 2: Enable Mock Mode Globally

**Add to `backend/.env`:**
```env
USE_MOCK_DATA=true
```

**Then restart backend:**
```bash
cd backend
npm run dev
```

**Now ALL accounts will use mock data** (useful for testing)

---

## 🎯 Option 3: Insert Test Data Directly

**Create a script to insert sample data:**

```bash
mysql -u root -p12345678 social_media_analytics << 'EOF'
-- Get your user ID and account ID first
SET @user_id = 1;  -- Replace with your user ID
SET @account_id = (SELECT id FROM user_social_accounts WHERE user_id = @user_id LIMIT 1);

-- Insert sample posts
INSERT INTO social_posts (
  user_id, account_id, platform_post_id, platform_type, content, content_type,
  media_urls, permalink, published_at, created_at, updated_at
) VALUES
(@user_id, @account_id, 'post_1', 'facebook', 'Excited to share our latest product launch! 🚀', 'image', 
 '["https://picsum.photos/800/600"]', 'https://facebook.com/post/1', NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY, NOW()),
(@user_id, @account_id, 'post_2', 'facebook', 'Thank you to everyone who joined us!', 'text',
 NULL, 'https://facebook.com/post/2', NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY, NOW()),
(@user_id, @account_id, 'post_3', 'facebook', 'Check out this amazing tutorial!', 'video',
 '["https://picsum.photos/800/600"]', 'https://facebook.com/post/3', NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 3 DAY, NOW());

-- Insert engagement metrics
INSERT INTO post_engagement_metrics (post_id, likes_count, comments_count, shares_count, impressions_count, engagement_rate)
SELECT id, 
  FLOOR(50 + RAND() * 200) as likes,
  FLOOR(5 + RAND() * 20) as comments,
  FLOOR(2 + RAND() * 10) as shares,
  FLOOR(1000 + RAND() * 2000) as impressions,
  ROUND((FLOOR(50 + RAND() * 200) + FLOOR(5 + RAND() * 20) + FLOOR(2 + RAND() * 10)) / (FLOOR(1000 + RAND() * 2000)) * 100, 2) as engagement_rate
FROM social_posts 
WHERE account_id = @account_id
ON DUPLICATE KEY UPDATE
  likes_count = VALUES(likes_count),
  comments_count = VALUES(comments_count),
  shares_count = VALUES(shares_count);

-- Insert follower metrics
INSERT INTO follower_metrics (account_id, follower_count, following_count, posts_count)
VALUES (@account_id, 5000, 200, (SELECT COUNT(*) FROM social_posts WHERE account_id = @account_id))
ON DUPLICATE KEY UPDATE
  follower_count = VALUES(follower_count),
  posts_count = (SELECT COUNT(*) FROM social_posts WHERE account_id = @account_id);
EOF
```

---

## ✅ What Mock Data Includes

**Mock Service generates:**
- ✅ 25 realistic posts (text, image, video, carousel)
- ✅ Engagement metrics (likes, comments, shares, saves)
- ✅ Views and impressions
- ✅ Engagement rate calculations
- ✅ Follower metrics
- ✅ Posts from last 30 days
- ✅ Realistic content and media URLs

**All stored in database just like real data!**

---

## 🧪 Testing Steps

### 1. Create Mock Account
```bash
./scripts/create-mock-account.sh
```

### 2. Verify Account Created
```bash
mysql -u root -p12345678 -e "USE social_media_analytics; SELECT id, platform_display_name, account_status FROM user_social_accounts WHERE access_token = 'mock_token';"
```

### 3. Test via UI
- Go to: http://localhost:3000/settings/accounts
- Find "Mock Facebook Account"
- Click "Sync Data"
- Should see: "Successfully collected 25 posts!"

### 4. Verify Data
```bash
# Check posts
mysql -u root -p12345678 -e "USE social_media_analytics; SELECT COUNT(*) FROM social_posts;"

# Check metrics
mysql -u root -p12345678 -e "USE social_media_analytics; SELECT COUNT(*) FROM post_engagement_metrics;"
```

---

## 🎯 Benefits of Mock Data Testing

✅ **No API credentials needed**  
✅ **Test entire Phase 4 infrastructure**  
✅ **Verify database storage works**  
✅ **Test UI and API endpoints**  
✅ **Fast and reliable**  
✅ **Can test with any amount of data**  

---

## 📊 Expected Results

After mock data sync:
- ✅ 25 posts in `social_posts` table
- ✅ 25 engagement metrics records
- ✅ 1 follower metrics record
- ✅ 1 collection job with status "completed"
- ✅ Success message in UI

---

## 🔄 Later: Switch to Real Facebook API

Once you get Facebook app credentials:
1. Remove `USE_MOCK_DATA=true` from `.env`
2. Create real Facebook account connection
3. System will automatically use real API
4. Mock data structure matches real data format!

---

**Ready to test?** Run the script and let's verify Phase 4 works! 🚀

