# Fix: "This app is not currently accessible" - Facebook OAuth Error

## 🔴 The Problem

When clicking "Connect Facebook", you see:
- **"This app is not currently accessible and the app developer is aware of the issue"**
- **"Can't load URL - The domain of this URL isn't included in the app's domains"**

Even though your app shows as "Active" in Facebook Developers.

## ✅ The Solution

This error happens because Facebook requires **two critical settings** to be configured:

1. **App Domains** must include `localhost`
2. **Valid OAuth Redirect URIs** must include your callback URL
3. **App Mode** - If in Development Mode, you need to be added as a test user/developer

---

## 📋 Step-by-Step Fix

### Step 1: Add App Domain

1. **Go to Facebook Developers:**
   - Visit: https://developers.facebook.com/apps/
   - Find your app (App ID: `727127977129842`)
   - Click on it to open

2. **Go to Basic Settings:**
   - In the left sidebar, click **"Settings"** → **"Basic"**

3. **Add App Domain:**
   - Scroll down to **"App Domains"** section
   - Click **"+ Add Domain"** or the input field
   - Enter: `localhost`
   - ⚠️ **IMPORTANT:** 
     - Just type `localhost` (no `http://` or port number)
     - Don't add `localhost:5001` or `localhost:3000`
     - Just `localhost` is enough

4. **Click "Save Changes"** (bottom of page)

### Step 2: Configure Facebook Login Redirect URI

1. **Add Facebook Login Product (if not added):**
   - In the left sidebar, look for **"Products"**
   - If you don't see **"Facebook Login"**, click **"+ Add Product"**
   - Find **"Facebook Login"** and click **"Set Up"**

2. **Configure Facebook Login Settings:**
   - Click **"Facebook Login"** in the left sidebar
   - Click **"Settings"** (under Facebook Login)

3. **Add Valid OAuth Redirect URI:**
   - Scroll down to **"Valid OAuth Redirect URIs"**
   - Click **"+ Add URI"** or the input field
   - Add this **exact** URI:
     ```
     http://localhost:5001/api/social/callback/facebook
     ```
   - ⚠️ **IMPORTANT:**
     - Use `http://` (not `https://`) for localhost
     - Include the port number `:5001`
     - Include the full path `/api/social/callback/facebook`
     - No trailing slash

4. **Click "Save Changes"** (bottom of page)

### Step 3: Add Yourself as Developer/Admin (For Development Mode)

**If your app is in Development Mode** (most new apps are), you need to add yourself:

1. **Go to App Roles:**
   - In the left sidebar, click **"Settings"** → **"Roles"**

2. **Add Yourself as Administrator:**
   - Scroll to **"Administrators"** section
   - Click **"+ Add People"**
   - Enter your **Facebook account email** (the one you use to log into Facebook)
   - Or search for your name
   - Select your account
   - Choose role: **"Administrator"**
   - Click **"Add"**

3. **Alternative: Add as Developer:**
   - Scroll to **"Developers"** section
   - Click **"+ Add People"**
   - Add your Facebook account email
   - Click **"Add"**

**Why?** In Development Mode, only users added as Administrators, Developers, or Test Users can use the app.

**⚠️ Note About Test Users:**
- Facebook has **deprecated** the ability to create test users for most app types
- The "Test Users" feature is often **disabled** in newer Facebook apps
- **This is normal and expected!** You don't need test users
- Instead, add yourself (and any collaborators) as **Administrators** or **Developers**
- Anyone added as Administrator/Developer can use the app in Development Mode

### Step 4: Verify Settings

Double-check these settings:

✅ **Settings → Basic:**
- App ID: `727127977129842`
- App Secret: `dccd94c2519a2f7bc759a56d796409b6`
- **App Domains:** `localhost` (must be present)

✅ **Facebook Login → Settings:**
- **Valid OAuth Redirect URIs:** `http://localhost:5001/api/social/callback/facebook` (must be present)

✅ **Settings → Roles:**
- Your Facebook account email is listed as Administrator or Developer

### Step 5: Restart Backend

After making changes in Facebook:

1. **Restart your backend server:**
   ```bash
   cd backend
   # Stop the server (Ctrl+C)
   npm run dev
   ```

2. **Clear browser cache** (optional but recommended):
   - Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
   - Clear cached images and files
   - Or use Incognito/Private mode

### Step 6: Test Again

1. **Go to:** http://localhost:3000/settings/accounts
2. **Click "Connect"** next to Facebook
3. **You should now see the Facebook login page** (not the error)

---

## 🔍 Troubleshooting

### Still seeing "This app is not currently accessible"?

**Check 1: App Mode**
- Go to **Settings → Basic**
- Look at the top - does it say **"Development"** or **"Live"**?
- If **"Development"**, make sure you added yourself as Administrator/Developer in Step 3

**Check 2: App Domains**
- Go to **Settings → Basic**
- Scroll to **"App Domains"**
- Make sure `localhost` is listed (without `http://` or port)

**Check 3: Redirect URI**
- Go to **Facebook Login → Settings**
- Scroll to **"Valid OAuth Redirect URIs"**
- Make sure `http://localhost:5001/api/social/callback/facebook` is listed exactly
- Check for typos, extra spaces, or wrong port number

**Check 4: Wait a Few Minutes**
- Facebook settings can take 1-2 minutes to propagate
- Wait 2-3 minutes after saving changes, then try again

**Check 5: Use Incognito Mode**
- Sometimes browser cache causes issues
- Try in Incognito/Private browsing mode

### "Invalid OAuth Redirect URI" error?

This means the redirect URI in your app settings doesn't match what your backend is sending.

1. **Check your backend `.env`:**
   ```env
   BACKEND_URL=http://localhost:5001
   ```

2. **Verify the redirect URI in Facebook:**
   - Must be exactly: `http://localhost:5001/api/social/callback/facebook`
   - No trailing slash
   - Correct port number (`5001`)

3. **Restart backend** after changing `.env`

### "App not in development mode" but still can't connect?

1. **Check App Review Status:**
   - Go to **App Review** in left sidebar
   - Some permissions require App Review even for your own account
   - For development, basic permissions should work without review

2. **Try Basic Permissions First:**
   - The scopes `pages_show_list`, `pages_read_engagement` might need review
   - For testing, try with just `email` and `public_profile` first

---

## 📝 Quick Checklist

Before testing, verify:

- [ ] App Domain: `localhost` added in Settings → Basic
- [ ] Redirect URI: `http://localhost:5001/api/social/callback/facebook` added in Facebook Login → Settings
- [ ] Your Facebook account email added as Administrator/Developer in Settings → Roles
- [ ] Backend `.env` has correct `FACEBOOK_CLIENT_ID` and `FACEBOOK_CLIENT_SECRET`
- [ ] Backend server restarted after changes
- [ ] Browser cache cleared (or using Incognito mode)

---

## 🎯 Expected Result

After following these steps:

1. Click "Connect Facebook" in your app
2. You should see **Facebook's login page** (not an error)
3. Log in with your Facebook account
4. Grant permissions
5. You'll be redirected back to your app
6. Account should be connected! ✅

---

## 📚 Additional Resources

- **Facebook Developers Console:** https://developers.facebook.com/apps/727127977129842
- **Facebook Login Documentation:** https://developers.facebook.com/docs/facebook-login/
- **OAuth Redirect URI Guide:** https://developers.facebook.com/docs/facebook-login/security#redirect-uri

---

## 💡 Pro Tip

For production deployment, you'll need to:
1. Add your production domain to **App Domains** (e.g., `yourdomain.com`)
2. Add production redirect URI: `https://yourdomain.com/api/social/callback/facebook`
3. Submit your app for App Review (if using advanced permissions)
4. Switch app mode from "Development" to "Live"

---

**Last Updated:** 2024  
**App ID:** 727127977129842  
**Status:** Ready to Fix ✅

