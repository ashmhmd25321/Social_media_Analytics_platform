# Facebook/Instagram OAuth Setup Guide

## About the Console Warning

The message you're seeing:
```
This is a browser feature intended for developers. If someone told you to copy-paste something here...
```

**This is NOT an error!** It's just a security warning from Facebook/Instagram that appears in the browser console. It's designed to prevent XSS attacks. You can safely ignore it - it doesn't affect the OAuth flow.

## Facebook OAuth Setup Steps

### Step 1: Go to Facebook Developers Console
1. Open: https://developers.facebook.com/apps/
2. Find your app (App ID: `4415283775358718`)
3. Click on it to open

### Step 2: Configure Facebook Login
1. In the left sidebar, find **"Facebook Login"** under "Products"
2. If it's not added, click **"+ Add Product"** and add "Facebook Login"
3. Click **"Facebook Login"** → **"Settings"**

### Step 3: Add Valid OAuth Redirect URIs
1. Scroll down to **"Valid OAuth Redirect URIs"**
2. Click **"+ Add URI"** or the input field
3. Add this exact URI:
   ```
   http://localhost:5001/api/social/callback/facebook
   ```
   ⚠️ **IMPORTANT:** 
   - Use `http://` (not `https://`) for localhost
   - No trailing slash
   - Exact match required

4. Click **"Save Changes"**

### Step 4: Configure Instagram (if using Instagram)
Since Instagram uses the same app, you also need to add:

1. Go to **"Instagram Basic Display"** under Products (or add it if not present)
2. In **"Basic Display"** → **"Settings"**
3. Add **"Valid OAuth Redirect URIs"**:
   ```
   http://localhost:5001/api/social/callback/instagram
   ```

### Step 5: App Settings
1. Go to **"Settings"** → **"Basic"** (in left sidebar)
2. Make sure:
   - **App ID**: `4415283775358718`
   - **App Secret**: `7da790d4e3da49c47db3f905a7565d30`
   - **App Domains**: (can leave empty for localhost)
   - **Site URL**: `http://localhost:5001` (optional, but recommended)

### Step 6: Platform Settings (Optional but Recommended)
1. Still in **"Settings"** → **"Basic"**
2. Scroll down to **"Add Platform"**
3. Click **"Website"**
4. Add **"Site URL"**: `http://localhost:5001`

## Test Mode vs Live Mode

### Test Mode (Default)
- Only you and test users can connect
- Limited access
- Good for development

### Live Mode (Production)
- Anyone can connect
- Requires App Review from Facebook
- Need to submit permissions for review

**For development, Test Mode is fine!**

## Required Permissions/Scopes

Make sure your app has these permissions configured:
- `pages_show_list` - To list user's Facebook pages
- `pages_read_engagement` - To read page engagement data
- `instagram_basic` - For Instagram basic info
- `instagram_manage_insights` - For Instagram analytics

## Error: "App not active" (App is not currently accessible)

If you see this error:
```
App not active
This app is not currently accessible and the app developer is aware
of the issue. You will be able to log in when the app is reactivated.
```

This means:
- ✅ Redirect URI is working (you got past the redirect_uri_mismatch error)
- ❌ Your Facebook account is not added as a test user, OR
- ❌ The app is in Development mode and needs test users

### Solution 1: Add Test Users (Recommended for Development)

Your Facebook app is in **"Development"** mode, which means only approved test users can sign in.

#### Step 1: Go to App Roles
1. Open: https://developers.facebook.com/apps/4415283775358718
2. In the left sidebar, click **"Roles"** (under "Settings")

#### Step 2: Add Test Users
1. Scroll down to **"Test Users"** section
2. Click **"+ Add Test Users"**
3. You can either:
   - **Option A:** Add existing Facebook accounts as test users
     - Click **"Add Test Users"**
     - Enter email addresses (one per line) of people who should be able to connect
     - Click **"Add"**
   - **Option B:** Create new test users
     - Click **"Create Test Users"**
     - Enter number of test users to create
     - Click **"Create"**
     - These are fake accounts for testing

#### Step 3: Add Yourself as Admin/Developer
1. Still in **"Roles"** page
2. Scroll to **"Administrators"** or **"Developers"** section
3. Click **"+ Add People"**
4. Enter your Facebook account email or search for your name
5. Select your account
6. Choose role: **"Administrator"** or **"Developer"**
7. Click **"Add"**

#### Step 4: Try Again
- Wait 1-2 minutes for changes to propagate
- Try connecting Facebook again
- You should now be able to sign in! ✅

### Solution 2: Switch to Live Mode (For Production)

If you want anyone to be able to connect (not just test users):

1. Go to **"App Review"** in the left sidebar
2. Click **"Permissions and Features"**
3. Make sure all required permissions are added:
   - `pages_show_list`
   - `pages_read_engagement`
   - `instagram_basic`
   - `instagram_manage_insights`
4. Submit each permission for review (if required)
5. Once approved, switch app to **"Live"** mode
6. ⚠️ **Note:** App Review can take days/weeks
7. For development, adding test users is faster and easier

### Quick Fix Summary

**For Development (Recommended):**
- Add yourself as Administrator/Developer in App Roles
- Add test users if needed
- Fast and easy
- No review needed

**For Production:**
- Switch app to Live mode
- Requires App Review for permissions
- Takes longer but allows anyone to connect

## Troubleshooting

### Error: "Redirect URI Mismatch"
- Check that the redirect URI in Facebook App settings matches exactly: `http://localhost:5001/api/social/callback/facebook`
- Make sure there are no typos or extra spaces
- Remember: `http://` not `https://` for localhost

### Error: "App Not Setup"
- Make sure "Facebook Login" product is added
- Check that settings are saved

### Error: "Invalid OAuth Access Token"
- Make sure your `.env` file has correct credentials:
  ```env
  FACEBOOK_CLIENT_ID=4415283775358718
  FACEBOOK_CLIENT_SECRET=7da790d4e3da49c47db3f905a7565d30
  ```

### The Console Warning
- **Ignore it!** It's just a security message, not an error
- Your OAuth flow should still work

## Verify Setup

1. **Check Backend `.env`** has:
   ```env
   BACKEND_URL=http://localhost:5001
   FACEBOOK_CLIENT_ID=4415283775358718
   FACEBOOK_CLIENT_SECRET=7da790d4e3da49c47db3f905a7565d30
   INSTAGRAM_CLIENT_ID=4415283775358718
   INSTAGRAM_CLIENT_SECRET=7da790d4e3da49c47db3f905a7565d30
   ```

2. **Restart backend** after making changes:
   ```bash
   cd backend
   npm run dev
   ```

3. **Try connecting** at: `http://localhost:3000/settings/accounts`

## Expected Flow

1. Click "Connect Account" for Facebook
2. You'll be redirected to Facebook login page
3. Log in with your Facebook account
4. Grant permissions (if prompted)
5. You'll be redirected back to: `http://localhost:5001/api/social/callback/facebook`
6. Backend processes the OAuth callback
7. You'll be redirected to: `http://localhost:3000/settings/accounts?success=true`
8. Account should now be connected! ✅

## For Production

When deploying to production, update:

1. **Facebook App Settings**:
   - Add production redirect URI: `https://yourdomain.com/api/social/callback/facebook`

2. **Backend `.env`**:
   ```env
   BACKEND_URL=https://yourdomain.com
   FRONTEND_URL=https://yourdomain.com
   ```

3. **Switch App to Live Mode** (requires App Review)

