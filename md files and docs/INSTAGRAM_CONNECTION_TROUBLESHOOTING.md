# Instagram Connection Troubleshooting

If you're getting the error: **"Could not find Instagram Business Account"**, follow these steps to diagnose and fix the issue.

## Quick Checklist

- [ ] Instagram account is a **Business** or **Creator** account (not personal)
- [ ] Instagram is **linked to your Facebook Page** (not just your personal profile)
- [ ] You're using a **Page Access Token** (from `/me/accounts`), not a user token
- [ ] Access token has `instagram_basic` permission
- [ ] Access token has `pages_show_list` permission

## Step-by-Step Verification

### Step 1: Verify Instagram Account Type

1. Open the **Instagram mobile app**
2. Go to **Settings** → **Account**
3. Check if you see **"Switch to Personal Account"** option
   - ✅ If you see this, you're on a Business/Creator account (correct!)
   - ❌ If you don't see this, convert to Business account:
     - Go to **Settings** → **Account** → **Switch to Professional Account**

### Step 2: Verify Instagram-Facebook Link

**Method A: Via Facebook**
1. Go to: https://www.facebook.com/pages/manage/
2. Click on your **Facebook Page**
3. Go to **Settings** → **Instagram**
4. Check if your Instagram account is listed
   - ✅ If listed, the connection is correct
   - ❌ If not listed, link it:
     - Click **"Connect Account"**
     - Follow the prompts to connect your Instagram Business account

**Method B: Via Instagram**
1. Open Instagram app
2. Go to **Settings** → **Account** → **Linked Accounts**
3. Check if **Facebook** is listed
   - ✅ If listed, tap it to see which Page it's connected to
   - ❌ If not listed, add it:
     - Tap **"Facebook"**
     - Select your **Facebook Page** (not personal profile)

### Step 3: Verify Access Token Permissions

1. Go to: https://developers.facebook.com/tools/explorer/
2. Paste your access token
3. Test endpoint: `/me/accounts?fields=id,name,instagram_business_account{id,username}`
4. Click **"Submit"**

**Expected Result:**
```json
{
  "data": [
    {
      "id": "YOUR_PAGE_ID",
      "name": "Your Page Name",
      "instagram_business_account": {
        "id": "17841405309211844",
        "username": "your_instagram_username"
      }
    }
  ]
}
```

**If you see `instagram_business_account: null`:**
- ❌ Instagram is not linked to this Page
- Go back to Step 2 and link it properly

**If you get an error about permissions:**
- ❌ Token doesn't have `instagram_basic` permission
- Regenerate token with correct permissions

### Step 4: Get Page Access Token

**Important:** You must use a **Page Access Token**, not a user token!

1. In Graph API Explorer, set endpoint to: `/me/accounts`
2. Add fields: `fields=id,name,access_token,instagram_business_account{id,username}`
3. Click **"Submit"**
4. Copy the `access_token` from the Page (not the user token)

**Why?** Page Access Tokens have more permissions and can access Instagram Business accounts.

### Step 5: Manual Instagram Account ID (If Auto-Detection Fails)

If automatic detection fails, you can provide the Instagram Account ID manually:

1. **Find Your Instagram Account ID:**
   - Go to: https://www.facebook.com/pages/manage/
   - Click your Page → **Settings** → **Instagram**
   - The Instagram Account ID is shown there (long number like `17841405309211844`)

2. **Use in Connection:**
   - When connecting Instagram, paste your Facebook access token
   - **Optionally** paste the Instagram Account ID in the "Instagram Account ID" field
   - Click **"Connect"**

## Common Issues and Solutions

### Issue 1: "Instagram Business Account not found"

**Possible Causes:**
1. Instagram is not linked to Facebook Page
2. Using wrong access token (user token instead of Page token)
3. Token doesn't have `instagram_basic` permission

**Solutions:**
1. ✅ Link Instagram to Facebook Page (see Step 2)
2. ✅ Use Page Access Token from `/me/accounts` (see Step 4)
3. ✅ Regenerate token with `instagram_basic` permission

### Issue 2: "No Facebook Pages found"

**Possible Causes:**
1. Token doesn't have `pages_show_list` permission
2. You don't have a Facebook Page

**Solutions:**
1. ✅ Regenerate token with `pages_show_list` permission
2. ✅ Create a Facebook Page: https://www.facebook.com/pages/create

### Issue 3: Instagram shows as "null" in API response

**Possible Causes:**
1. Instagram is linked to personal profile, not Page
2. Instagram account is personal, not Business

**Solutions:**
1. ✅ Link Instagram to your **Facebook Page** (not personal profile)
2. ✅ Convert Instagram to Business account (see Step 1)

## Testing Your Setup

### Test 1: Check Instagram Link via API

```bash
# Replace YOUR_PAGE_ACCESS_TOKEN with your actual token
curl "https://graph.facebook.com/v18.0/me/accounts?access_token=YOUR_PAGE_ACCESS_TOKEN&fields=id,name,instagram_business_account{id,username}"
```

**Expected:** Should return your Page with `instagram_business_account` object.

### Test 2: Check Instagram Account Directly

```bash
# Replace YOUR_PAGE_ACCESS_TOKEN and INSTAGRAM_ACCOUNT_ID
curl "https://graph.instagram.com/INSTAGRAM_ACCOUNT_ID?fields=id,username&access_token=YOUR_PAGE_ACCESS_TOKEN"
```

**Expected:** Should return Instagram account info.

## Still Having Issues?

1. **Check Backend Logs:**
   - Look for `[DEBUG]` messages in your backend terminal
   - These will show what the system is finding

2. **Verify Token Permissions:**
   - Test token at: https://developers.facebook.com/tools/debug/accesstoken/
   - Check that `instagram_basic` and `pages_show_list` are granted

3. **Try Manual Account ID:**
   - Get Instagram Account ID from Facebook Page Settings
   - Provide it manually in the connection form

4. **Re-link Instagram:**
   - Unlink Instagram from Facebook Page
   - Wait 5 minutes
   - Re-link Instagram to Facebook Page
   - Try connecting again

## Quick Reference

**Required Permissions:**
- `pages_show_list` - To list your Pages
- `pages_read_engagement` - To read Page data
- `instagram_basic` - To access Instagram Business account
- `instagram_manage_insights` - To read Instagram analytics

**Required Setup:**
- ✅ Facebook Page (not just personal profile)
- ✅ Instagram Business/Creator account
- ✅ Instagram linked to Facebook Page
- ✅ Page Access Token (from `/me/accounts`)

**API Endpoints to Test:**
- `/me/accounts?fields=id,name,instagram_business_account{id,username}` - Should show Instagram
- `/PAGE_ID?fields=instagram_business_account` - Should show Instagram for specific page
- `/INSTAGRAM_ACCOUNT_ID?fields=id,username` - Should return Instagram account info

