# Using Facebook Access Token for Instagram

Yes! **You can use the same Facebook access token for Instagram** if you have an **Instagram Business account** linked to your Facebook Page.

## Requirements

1. ✅ **Facebook Page** - You must have a Facebook Page (not just a personal profile)
2. ✅ **Instagram Business Account** - Your Instagram account must be a **Business** or **Creator** account (not a personal account)
3. ✅ **Linked Accounts** - Your Instagram Business account must be **linked to your Facebook Page**
4. ✅ **Access Token** - The same Facebook access token that works for your Facebook Page

## Step-by-Step Guide

### Step 1: Convert Instagram to Business Account

If your Instagram account is still a **personal account**, you need to convert it:

1. Open the **Instagram mobile app**
2. Go to **Settings** → **Account**
3. Tap **"Switch to Professional Account"** or **"Switch to Business Account"**
4. Follow the prompts to complete the conversion

### Step 2: Link Instagram to Facebook Page

1. In Instagram app, go to **Settings** → **Account** → **Linked Accounts**
2. Select **"Facebook"**
3. Choose your **Facebook Page** (the one you're using for analytics)
4. Confirm the linking

**Alternative Method (via Facebook):**
1. Go to your Facebook Page: https://www.facebook.com/pages/manage/
2. Click on your Page
3. Go to **Settings** → **Instagram**
4. Click **"Connect Account"** and follow the prompts

### Step 3: Get Your Facebook Access Token

Use the **same access token** you used for Facebook. You can get it from:

**Option A: Facebook Graph API Explorer**
1. Go to: https://developers.facebook.com/tools/explorer/
2. Select your app
3. Click **"Get Token"** → **"Get User Access Token"**
4. Select permissions: `pages_show_list`, `pages_read_engagement`, `instagram_basic`, `instagram_manage_insights`
5. Generate token
6. Get Page Access Token:
   - Change endpoint to: `/me/accounts`
   - Click **"Submit"**
   - Copy the `access_token` from your Page

**Option B: Use Your Existing Token**
- If you already connected Facebook, you can use the same token for Instagram

### Step 4: Connect Instagram in Your App

1. Go to **Settings** → **Accounts**
2. Find **Instagram** in the list
3. Click **"Connect with Token"** (or similar button)
4. Paste your **Facebook access token** (the same one you used for Facebook)
5. Click **"Connect"**

The system will automatically:
- ✅ Detect your Instagram Business Account ID from your Facebook Page
- ✅ Fetch your Instagram username and profile info
- ✅ Connect your Instagram account

## How It Works

The system automatically:
1. Uses your Facebook access token
2. Fetches your Facebook Pages using `/me/accounts`
3. Finds the Instagram Business Account linked to your Page
4. Connects your Instagram account using the same token

## Troubleshooting

### Error: "Could not find Instagram Business Account"

**Possible Causes:**
1. ❌ Instagram account is not a Business/Creator account
2. ❌ Instagram is not linked to your Facebook Page
3. ❌ Access token doesn't have `instagram_basic` permission

**Solutions:**
1. ✅ Convert Instagram to Business account (see Step 1)
2. ✅ Link Instagram to Facebook Page (see Step 2)
3. ✅ Regenerate token with `instagram_basic` and `instagram_manage_insights` permissions

### Error: "Invalid access token"

**Solutions:**
1. ✅ Make sure you're using a **Page Access Token** (from `/me/accounts`), not a user token
2. ✅ Regenerate token with correct permissions
3. ✅ Make sure token hasn't expired

### Error: "No Instagram account found for this Facebook Page"

**Solutions:**
1. ✅ Verify Instagram is linked to your Facebook Page:
   - Go to: https://www.facebook.com/pages/manage/
   - Click your Page → **Settings** → **Instagram**
   - Check if Instagram account is listed
2. ✅ Make sure you're using the correct Facebook Page
3. ✅ Try linking Instagram again if it's not showing up

## Verify Your Setup

### Check Instagram Business Account:
1. Open Instagram app
2. Go to **Settings** → **Account**
3. You should see **"Switch to Personal Account"** option (meaning you're on Business account)

### Check Instagram-Facebook Link:
1. Go to: https://www.facebook.com/pages/manage/
2. Click your Page
3. Go to **Settings** → **Instagram**
4. You should see your Instagram account listed

### Test Token Permissions:
1. Go to: https://developers.facebook.com/tools/explorer/
2. Paste your token
3. Test endpoint: `/me/accounts?fields=id,name,instagram_business_account`
4. You should see `instagram_business_account` with an ID

## Important Notes

1. **Same Token**: You use the **exact same Facebook access token** for both Facebook and Instagram
2. **Business Account Only**: Personal Instagram accounts cannot be connected via API
3. **Linked Required**: Instagram must be linked to your Facebook Page
4. **Permissions**: Token needs `instagram_basic` and `instagram_manage_insights` permissions

## Quick Checklist

Before connecting Instagram:
- [ ] Instagram account is Business or Creator account
- [ ] Instagram is linked to your Facebook Page
- [ ] You have a Facebook Page (not just personal profile)
- [ ] Access token has `instagram_basic` permission
- [ ] Access token has `instagram_manage_insights` permission
- [ ] You're using a Page Access Token (from `/me/accounts`)

## Summary

**Yes, you can use the same Facebook access token for Instagram!** Just make sure:
1. Your Instagram is a **Business account**
2. It's **linked to your Facebook Page**
3. Your token has the **Instagram permissions**

The system will automatically detect and connect your Instagram account when you provide the same Facebook token.

