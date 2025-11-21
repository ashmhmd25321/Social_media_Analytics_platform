# Phase 4 Setup Guide - Complete Step-by-Step Instructions

This guide will help you complete Phase 4 testing with real data and working configurations.

---

## Prerequisites

Before starting, ensure you have:
- ✅ MySQL running and accessible
- ✅ Backend server can connect to MySQL
- ✅ Frontend and backend servers are running
- ✅ Node.js and npm installed

---

## Step 1: Run Database Migration

### Option A: Using MySQL Command Line (Recommended)

1. **Open Terminal** and navigate to the backend directory:
   ```bash
   cd "/Volumes/External_01/ASH/Projects/Social Media Analytics Web/backend"
   ```

2. **Check if database exists** (optional verification):
   ```bash
   mysql -u root -p12345678 -e "SHOW DATABASES LIKE 'social_media_analytics';"
   ```

3. **Run the Phase 4 migration**:
   ```bash
   mysql -u root -p12345678 social_media_analytics < src/config/database-schema-phase4.sql
   ```

   **Note:** If you get a password prompt, enter: `12345678` (as configured in your .env file)

4. **Verify tables were created**:
   ```bash
   mysql -u root -p12345678 -e "USE social_media_analytics; SHOW TABLES;"
   ```

   You should see these new tables:
   - `social_posts`
   - `post_engagement_metrics`
   - `engagement_snapshots`
   - `follower_metrics`
   - `follower_snapshots`
   - `data_collection_jobs`
   - `api_rate_limits`

### Option B: Using MySQL Workbench or phpMyAdmin

1. Open MySQL Workbench or phpMyAdmin
2. Connect to your MySQL server
3. Select the `social_media_analytics` database
4. Open the file: `backend/src/config/database-schema-phase4.sql`
5. Execute the entire script

### Troubleshooting

If you get errors:
- **"Unknown database"**: Run the base schema first:
  ```bash
  mysql -u root -p12345678 < src/config/database-schema.sql
  ```
- **"Access denied"**: Check your MySQL credentials in `backend/.env`
- **"Table already exists"**: The migration uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times

---

## Step 2: Create a Test User

### Option A: Via Web UI (Easiest)

1. **Open your browser** and go to: `http://localhost:3000/auth/register`

2. **Fill in the registration form**:
   - First Name: `Test`
   - Last Name: `User`
   - Email: `test@example.com`
   - Password: `Test123456`
   - Confirm Password: `Test123456`

3. **Click "Create Account"**

4. **Verify the user was created**:
   ```bash
   mysql -u root -p12345678 -e "USE social_media_analytics; SELECT id, email, first_name, last_name FROM users;"
   ```

### Option B: Via API (Using curl)

1. **Open Terminal** and run:
   ```bash
   curl -X POST http://localhost:5001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "Test123456",
       "first_name": "Test",
       "last_name": "User"
     }'
   ```

2. **Expected response**:
   ```json
   {
     "success": true,
     "message": "User registered successfully",
     "data": {
       "user": {
         "id": 1,
         "email": "test@example.com",
         "first_name": "Test",
         "last_name": "User"
       },
       "tokens": {
         "accessToken": "...",
         "refreshToken": "..."
       }
     }
   }
   ```

### Option C: Direct Database Insert (For Testing Only)

⚠️ **Warning:** This bypasses password hashing. Only use for quick testing.

```bash
mysql -u root -p12345678 social_media_analytics -e "
INSERT INTO users (email, password_hash, first_name, last_name, is_email_verified, role)
VALUES ('test@example.com', '\$2a\$10\$placeholder', 'Test', 'User', TRUE, 'user');
"
```

**Note:** The password hash above is a placeholder. Use Option A or B for real users.

---

## Step 3: Configure OAuth Credentials

### For Facebook/Instagram Integration

1. **Get Facebook App Credentials**:
   - Go to [Facebook Developers](https://developers.facebook.com/)
   - Create a new app or use an existing one
   - Go to Settings → Basic
   - Copy your **App ID** and **App Secret**

2. **Update `backend/.env` file**:

   Open `backend/.env` and add these lines:

   ```env
   # Facebook/Instagram OAuth
   FACEBOOK_CLIENT_ID=your_facebook_app_id_here
   FACEBOOK_CLIENT_SECRET=your_facebook_app_secret_here
   FACEBOOK_REDIRECT_URI=http://localhost:5001/api/social/callback/facebook

   # Instagram (uses same credentials if using Facebook Login)
   INSTAGRAM_CLIENT_ID=your_instagram_app_id_here
   INSTAGRAM_CLIENT_SECRET=your_instagram_app_secret_here
   INSTAGRAM_REDIRECT_URI=http://localhost:5001/api/social/callback/instagram
   ```

3. **Example with real placeholder values**:
   ```env
   FACEBOOK_CLIENT_ID=1234567890123456
   FACEBOOK_CLIENT_SECRET=abcdef1234567890abcdef1234567890
   FACEBOOK_REDIRECT_URI=http://localhost:5001/api/social/callback/facebook
   ```

4. **Restart the backend server** after updating `.env`:
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart:
   cd backend
   npm run dev
   ```

### Configure Facebook App Settings

1. **Add Valid OAuth Redirect URIs**:
   - In Facebook App Dashboard → Settings → Basic
   - Add to "Valid OAuth Redirect URIs":
     - `http://localhost:5001/api/social/callback/facebook`
     - `http://localhost:5001/api/social/callback/instagram`

2. **Add Required Permissions**:
   - Go to App Dashboard → Permissions and Features
   - Add these permissions:
     - `pages_read_engagement` (for Facebook Pages)
     - `pages_read_user_content` (for reading posts)
     - `instagram_basic` (for Instagram)
     - `instagram_content_publish` (optional, for posting)

3. **Test Mode**:
   - Your app will be in "Development Mode" initially
   - Only you and test users can use it
   - For production, submit for App Review

### Testing Without Real OAuth (Development)

If you don't have Facebook credentials yet, you can still test the structure:

1. The data collection endpoints will work
2. You'll get an error when trying to connect accounts (expected)
3. The UI and flow will work correctly

---

## Step 4: Fix TypeScript Errors

### Fix the Settings Page TypeScript Error

The error is in `frontend/app/settings/page.tsx` at line 45. The issue is that `preferences` property doesn't exist on the response type.

**Fix it:**

1. **Open the file**: `frontend/app/settings/page.tsx`

2. **Find line 44-46** (around there):
   ```typescript
   const prefsResponse = await userApi.getPreferences();
   if (prefsResponse.success && prefsResponse.data?.preferences) {
     setPreferences(prefsResponse.data.preferences);
   }
   ```

3. **Replace with**:
   ```typescript
   const prefsResponse = await userApi.getPreferences();
   if (prefsResponse.success && prefsResponse.data) {
     setPreferences(prefsResponse.data as any);
   }
   ```

   Or better, check the actual API response structure and type it properly.

### Quick Fix Command

Run this to see the exact error:
```bash
cd frontend
npm run build
```

The error will show the exact line and issue.

---

## Step 5: Verify Everything Works

### 1. Test Database Connection

```bash
cd backend
npm run dev
```

Look for: `✅ Database connection successful`

### 2. Test User Login

1. Go to: `http://localhost:3000/auth/login`
2. Login with:
   - Email: `test@example.com`
   - Password: `Test123456`

### 3. Test Dashboard

1. After login, you should be redirected to `/dashboard`
2. The dashboard should show:
   - Welcome message
   - Connected Platforms: 0
   - Total Followers: 0
   - Analytics Reports: 0

### 4. Test Accounts Page

1. Navigate to: `http://localhost:3000/settings/accounts`
2. You should see:
   - "Available Platforms" section
   - Platform cards (Facebook, Instagram, Twitter, etc.)
   - "Connect" buttons

### 5. Test Data Collection API (Without OAuth)

Even without OAuth, you can test the API structure:

```bash
# Get your access token from browser localStorage or login response
TOKEN="your_access_token_here"

# Test the data collection endpoint (will fail without connected account, but structure is tested)
curl -X POST http://localhost:5001/api/data/collect/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

Expected response (if no account): `404 Account not found` or `403 Access denied`

---

## Step 6: Test Data Collection (With OAuth)

Once OAuth is configured:

1. **Connect a Facebook Account**:
   - Go to: `http://localhost:3000/settings/accounts`
   - Click "Connect" on Facebook
   - Complete OAuth flow
   - Account should appear in "Connected Accounts"

2. **Sync Data**:
   - Click "Sync Data" button on connected account
   - Wait for sync to complete
   - Check console for job status

3. **Verify Data Collection**:
   ```bash
   # Check if posts were collected
   mysql -u root -p12345678 -e "USE social_media_analytics; SELECT COUNT(*) FROM social_posts;"
   
   # Check collection jobs
   mysql -u root -p12345678 -e "USE social_media_analytics; SELECT * FROM data_collection_jobs ORDER BY created_at DESC LIMIT 5;"
   ```

---

## Troubleshooting

### Database Issues

**Error: "Can't connect to MySQL"**
- Check MySQL is running: `mysqladmin -u root -p12345678 status`
- Verify credentials in `backend/.env`
- Check MySQL port (default: 3306)

**Error: "Table doesn't exist"**
- Make sure you ran the base schema first
- Check migration file path is correct
- Verify you're using the right database

### Authentication Issues

**Error: "Invalid credentials"**
- Verify user exists in database
- Check password is correct
- Ensure password is hashed properly (use registration API)

**Error: "Token expired"**
- Login again to get new token
- Check token expiry in `.env`: `JWT_EXPIRES_IN=7d`

### OAuth Issues

**Error: "Redirect URI mismatch"**
- Verify redirect URI in Facebook App matches `.env`
- Must be exactly: `http://localhost:5001/api/social/callback/facebook`

**Error: "Invalid OAuth credentials"**
- Double-check App ID and App Secret in `.env`
- Ensure no extra spaces or quotes
- Restart backend server after updating `.env`

---

## Quick Verification Checklist

- [ ] Database migration completed successfully
- [ ] Test user created and can login
- [ ] Dashboard loads without errors
- [ ] Accounts page loads without errors
- [ ] No console errors in browser
- [ ] OAuth credentials configured (if testing Facebook/Instagram)
- [ ] TypeScript errors fixed
- [ ] Backend server running without errors

---

## Next Steps

Once Phase 4 testing is complete:

1. ✅ Test data collection with real Facebook/Instagram accounts
2. ✅ Verify scheduled jobs run correctly
3. ✅ Test error handling and retry mechanisms
4. ✅ Move to Phase 5: Analytics Dashboard

---

**Need Help?** Check the console logs in both browser (F12) and terminal for detailed error messages.

