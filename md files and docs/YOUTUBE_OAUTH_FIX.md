# Fix YouTube OAuth Redirect URI Mismatch Error

## Problem
Error 400: `redirect_uri_mismatch` - The redirect URI `http://localhost:5001/api/social/callback/youtube` is not registered in Google Cloud Console.

## Solution: Add Redirect URI to Google Cloud Console

### Step 1: Go to Google Cloud Console
1. Open: https://console.cloud.google.com/apis/credentials
2. Make sure you're in the correct project

### Step 2: Find Your OAuth 2.0 Client ID
1. Look for the client ID: `420878294938-lgjip5gjja3r05h7jffmk0ve0mf4k699.apps.googleusercontent.com`
2. Click on it to edit

### Step 3: Add Authorized Redirect URI
1. Scroll down to **"Authorized redirect URIs"** section
2. Click **"+ ADD URI"**
3. Add this exact URI:
   ```
   http://localhost:5001/api/social/callback/youtube
   ```
   ⚠️ **IMPORTANT:** Make sure there are no trailing slashes or extra spaces!

4. Click **"SAVE"** at the bottom

### Step 4: Wait and Test
- Google changes may take a few minutes to propagate
- Wait 2-3 minutes after saving
- Then try connecting YouTube again

## Alternative: Check Current Redirect URIs

If you're not sure what's currently registered:

1. In Google Cloud Console, go to your OAuth 2.0 Client ID
2. Look at the "Authorized redirect URIs" list
3. You should see something like:
   ```
   http://localhost:5001/api/social/callback/youtube
   ```
4. If it's not there, add it
5. If there's a similar one but slightly different (e.g., different port, different path), either:
   - Add the correct one, OR
   - Update the backend `.env` to match what's in Google Console

## Common Issues

### Issue 1: Typo in URI
- ✅ Correct: `http://localhost:5001/api/social/callback/youtube`
- ❌ Wrong: `http://localhost:5001/api/social/callback/youtube/` (trailing slash)
- ❌ Wrong: `https://localhost:5001/api/social/callback/youtube` (https instead of http)
- ❌ Wrong: `http://127.0.0.1:5001/api/social/callback/youtube` (127.0.0.1 instead of localhost)

### Issue 2: Wrong OAuth Client ID
- Make sure you're editing the correct OAuth client
- Check that the Client ID matches: `420878294938-lgjip5gjja3r05h7jffmk0ve0mf4k699`

### Issue 3: Changes Not Propagated
- Google can take 1-5 minutes to update
- Try clearing browser cache or using incognito mode
- Wait a few minutes and try again

## Verify Backend Configuration

Make sure your `backend/.env` has:
```env
BACKEND_URL=http://localhost:5001
YOUTUBE_CLIENT_ID=420878294938-lgjip5gjja3r05h7jffmk0ve0mf4k699.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=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
```

After adding the redirect URI and waiting a few minutes, the OAuth flow should work!

## Error: "App has not completed the Google verification process" (Error 403: access_denied)

If you see this error after the redirect URI is fixed, it means:
- ✅ Redirect URI is working (you got past the redirect_uri_mismatch error)
- ❌ Your Google account is not added as a test user

### Solution: Add Test Users

Your OAuth app is in **"Testing"** mode, which means only approved test users can sign in.

#### Step 1: Go to OAuth Consent Screen
1. Open: https://console.cloud.google.com/apis/credentials/consent
2. Make sure you're in the correct project

#### Step 2: Add Test Users
1. Scroll down to **"Test users"** section
2. Click **"+ ADD USERS"**
3. Add your email address: `ayazm9582@gmail.com`
   - You can add multiple emails (one per line)
   - Each user who wants to connect YouTube needs to be added here
4. Click **"ADD"**

#### Step 3: Try Again
- Wait 1-2 minutes for changes to propagate
- Try connecting YouTube again
- You should now be able to sign in! ✅

### Alternative: Publish Your App (For Production)

If you want anyone to be able to connect (not just test users):

1. Go to **"OAuth consent screen"** in Google Cloud Console
2. Complete all required fields:
   - App name: "Social Media Analytics App"
   - User support email: Your email
   - Developer contact: Your email
3. Add required scopes (if not already added)
4. Click **"PUBLISH APP"**
5. ⚠️ **Note:** Publishing requires Google verification, which can take days/weeks
6. For development, adding test users is faster and easier

### Quick Fix Summary

**For Development (Recommended):**
- Add test users in OAuth consent screen
- Fast and easy
- No verification needed

**For Production:**
- Publish the app
- Requires Google verification
- Takes longer but allows anyone to connect

## For Production

When deploying to production, you'll need to add your production redirect URI:
```
https://yourdomain.com/api/social/callback/youtube
```

Make sure to add BOTH:
1. Development URI: `http://localhost:5001/api/social/callback/youtube`
2. Production URI: `https://yourdomain.com/api/social/callback/youtube`

