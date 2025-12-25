# How to Get Facebook Access Token with Page Permissions

If you're getting the error: **"No Facebook Pages found for this account"** or **"Failed to access Facebook Pages"**, your access token is missing the required permissions.

## Required Permissions

Your Facebook access token needs these permissions:
- ✅ `pages_show_list` - To list your Facebook Pages
- ✅ `pages_read_engagement` - To read page engagement data
- ✅ `pages_read_user_content` - To read page posts (optional but recommended)

## Method 1: Using Facebook Graph API Explorer (Easiest)

### Step 1: Open Graph API Explorer
1. Go to: https://developers.facebook.com/tools/explorer/
2. Make sure you're logged in with the Facebook account that has admin access to your Page

### Step 2: Select Your App
1. In the top-right corner, click the dropdown next to **"Meta App"**
2. Select your app (e.g., "Analytics App" or your app name)
3. If you don't see your app, make sure you're added as an Administrator or Developer

### Step 3: Request Permissions
1. Click **"Get Token"** → **"Get User Access Token"**
2. In the popup, check these permissions:
   - ✅ `pages_show_list`
   - ✅ `pages_read_engagement`
   - ✅ `pages_read_user_content` (optional)
   - ✅ `public_profile` (usually already selected)
3. Click **"Generate Access Token"**
4. **Important:** You may need to approve the permissions in a popup window

### Step 4: Get Page Access Token (Recommended)
After getting the user token, you need to get a **Page Access Token** which has more permissions:

1. In the Graph API Explorer, change the endpoint from `/me` to `/me/accounts`
2. Click **"Submit"** (or press Enter)
3. You should see a list of your Pages with their access tokens
4. Copy the **`access_token`** from the Page you want to use (not the user token)

**Example Response:**
```json
{
  "data": [
    {
      "access_token": "EAAZBvrV0DRv4BO...",  // ← Copy this Page Access Token
      "category": "Business",
      "name": "Analytics App",
      "id": "123456789012345",
      "tasks": ["ANALYZE", "ADVERTISE", "MODERATE", "CREATE_CONTENT"]
    }
  ]
}
```

### Step 5: Use the Token
1. Copy the **Page Access Token** (not the user token)
2. Go to your app's Settings → Accounts
3. Click **"Connect with Token"** for Facebook
4. Paste the Page Access Token
5. Click **"Connect"**

## Method 2: Using OAuth Flow (Automatic)

If you use the **"Connect Facebook"** button (OAuth flow), the system will automatically:
1. Request the required permissions
2. Exchange your token for a long-lived token
3. Fetch your Pages and use the first one found

**Steps:**
1. Go to Settings → Accounts
2. Click **"Connect Facebook"** (not "Connect with Token")
3. Log in and approve the permissions
4. The system will automatically detect and use your Page

## Method 3: Generate Token via Code (Advanced)

If you need to generate a token programmatically, you can use the OAuth flow:

```javascript
// Step 1: Redirect user to Facebook OAuth
const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
  `client_id=YOUR_APP_ID&` +
  `redirect_uri=YOUR_REDIRECT_URI&` +
  `scope=pages_show_list,pages_read_engagement,pages_read_user_content&` +
  `response_type=code`;

// Step 2: Exchange code for token
// Step 3: Exchange user token for page token using /me/accounts
```

## Troubleshooting

### Error: "No Facebook Pages found"
**Solutions:**
1. ✅ Make sure you've created a Facebook Page
2. ✅ Make sure you're an admin of that Page
3. ✅ Use a Page Access Token (not a user token)
4. ✅ Check that your token has `pages_show_list` permission

### Error: "Invalid OAuth access token"
**Solutions:**
1. ✅ Token may have expired - generate a new one
2. ✅ Make sure you're using a Page Access Token (from `/me/accounts`)
3. ✅ Check that the token is for the correct app

### Error: "Insufficient permissions"
**Solutions:**
1. ✅ Regenerate token with all required permissions
2. ✅ Make sure you approved all permissions in the popup
3. ✅ Use Graph API Explorer to verify token permissions

## Verify Your Token Has Permissions

Test your token using Graph API Explorer:
1. Paste your token in the **"Access Token"** field
2. Set endpoint to: `/me/permissions`
3. Click **"Submit"**
4. Look for `pages_show_list` and `pages_read_engagement` with status `"granted"`

**Example Response:**
```json
{
  "data": [
    {
      "permission": "pages_show_list",
      "status": "granted"  // ✅ Good!
    },
    {
      "permission": "pages_read_engagement",
      "status": "granted"  // ✅ Good!
    }
  ]
}
```

## Long-Lived Tokens

User tokens expire in 1-2 hours. To get a long-lived token (60 days):
1. Use the OAuth flow in your app (it automatically exchanges tokens)
2. Or manually exchange using:
   ```
   GET /oauth/access_token?
     grant_type=fb_exchange_token&
     client_id=YOUR_APP_ID&
     client_secret=YOUR_APP_SECRET&
     fb_exchange_token=SHORT_LIVED_TOKEN
   ```

**Note:** Page Access Tokens don't expire (unless you revoke them), so using a Page Access Token is recommended!

## Quick Checklist

Before connecting:
- [ ] Created a Facebook Page
- [ ] You are an admin of that Page
- [ ] Generated access token with `pages_show_list` permission
- [ ] Got Page Access Token from `/me/accounts` endpoint
- [ ] Copied the Page Access Token (not user token)
- [ ] Token is not expired

## Still Having Issues?

1. **Check Page Admin Status:**
   - Go to: https://www.facebook.com/pages/manage/
   - Verify you see your Page listed

2. **Test Token Manually:**
   - Use Graph API Explorer: https://developers.facebook.com/tools/explorer/
   - Test endpoint: `/me/accounts`
   - If it returns empty array, your token doesn't have `pages_show_list` permission

3. **Verify App Permissions:**
   - Go to: https://developers.facebook.com/apps/YOUR_APP_ID/permissions/
   - Make sure `pages_show_list` and `pages_read_engagement` are requested

4. **Try OAuth Flow Instead:**
   - Use the "Connect Facebook" button instead of "Connect with Token"
   - This automatically requests the correct permissions

