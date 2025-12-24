# Facebook Privacy Policy URL Setup

## Quick Answer

You need to host your Privacy Policy on a publicly accessible URL (not localhost). Here are the easiest options:

### Option 1: GitHub Pages (Free & Recommended)

1. **Create a GitHub repository:**
   - Go to https://github.com/new
   - Create a new public repository (e.g., `social-media-analytics-legal`)

2. **Upload the privacy policy:**
   - Use the file: `md files and docs/facebook-privacy-policy.html`
   - Rename it to `privacy.html` or `privacy-policy.html`
   - Upload it to your GitHub repository

3. **Enable GitHub Pages:**
   - Go to repository **Settings** → **Pages**
   - Select **main branch** (or your default branch) as source
   - Click **Save**

4. **Your Privacy Policy URL will be:**
   ```
   https://yourusername.github.io/repository-name/privacy.html
   ```
   Or if you put it in the root:
   ```
   https://yourusername.github.io/repository-name/privacy-policy.html
   ```

### Option 2: Use Existing Template

I've created a ready-to-use privacy policy file for you:
- **File:** `md files and docs/facebook-privacy-policy.html`
- Just upload it to GitHub Pages or any web hosting service

---

## How to Add Privacy Policy URL in Facebook App

1. **Go to Facebook Developers:**
   - Visit: https://developers.facebook.com/apps/727127977129842
   - Click on your app

2. **Navigate to App Settings:**
   - Click **"Settings"** → **"Basic"** (in left sidebar)

3. **Add Privacy Policy URL:**
   - Scroll down to **"Privacy Policy URL"** field
   - Enter your hosted URL (e.g., `https://yourusername.github.io/repository-name/privacy.html`)
   - ⚠️ **IMPORTANT:**
     - Must be publicly accessible (not localhost)
     - Must use `https://` (required)
     - Must return actual HTML content (not 404)

4. **Click "Save Changes"**

---

## Quick Setup Steps (5 minutes)

### Step 1: Create GitHub Repository
1. Go to: https://github.com/new
2. Repository name: `social-media-analytics-legal` (or any name)
3. Make it **Public**
4. Click **"Create repository"**

### Step 2: Upload Privacy Policy
1. In your new repository, click **"Add file"** → **"Upload files"**
2. Drag and drop `md files and docs/facebook-privacy-policy.html`
3. Rename it to `privacy.html` (or keep the name)
4. Click **"Commit changes"**

### Step 3: Enable GitHub Pages
1. Go to repository **Settings** (top right)
2. Scroll to **"Pages"** (left sidebar)
3. Under **"Source"**, select **"Deploy from a branch"**
4. Select **"main"** branch and **"/ (root)"** folder
5. Click **"Save"**

### Step 4: Get Your URL
1. Wait 1-2 minutes for GitHub Pages to deploy
2. Your URL will be:
   ```
   https://yourusername.github.io/social-media-analytics-legal/privacy.html
   ```
   (Replace `yourusername` with your GitHub username)

### Step 5: Add to Facebook
1. Copy your GitHub Pages URL
2. Go to Facebook App → Settings → Basic
3. Paste URL in **"Privacy Policy URL"** field
4. Click **"Save Changes"**

---

## Alternative: Free Hosting Options

### Netlify Drop (Easiest - No Account Needed)
1. Go to: https://app.netlify.com/drop
2. Drag and drop `facebook-privacy-policy.html`
3. Get instant URL: `https://random-name-123.netlify.app/privacy.html`
4. Use this URL in Facebook

### Vercel
1. Go to: https://vercel.com
2. Sign up (free)
3. Create new project
4. Upload HTML file
5. Get URL: `https://your-project.vercel.app/privacy.html`

### GitHub Gist (Quick but Less Professional)
1. Go to: https://gist.github.com
2. Create new gist
3. Paste HTML content
4. Use raw URL: `https://gist.githubusercontent.com/username/gist-id/raw/privacy.html`

---

## What Facebook Requires

✅ **Must have:**
- Publicly accessible URL (not localhost)
- HTTPS (required)
- Returns actual HTML content
- Accessible without authentication

❌ **Cannot use:**
- `http://localhost:3000/privacy` (not public)
- `http://example.com/privacy` (must be HTTPS)
- URLs that return 404 errors
- URLs behind authentication/login

---

## Example URLs That Work

✅ **Good:**
- `https://yourusername.github.io/repo-name/privacy.html`
- `https://your-app.netlify.app/privacy.html`
- `https://your-domain.com/privacy-policy.html`

❌ **Bad:**
- `http://localhost:3000/privacy` (not public)
- `http://example.com/privacy` (not HTTPS)
- `https://example.com/privacy` (if it returns 404)

---

## Testing Your URL

Before adding to Facebook, test that your URL works:

1. **Open URL in browser** - Should show the privacy policy page
2. **Check HTTPS** - URL should start with `https://`
3. **Check accessibility** - Open in incognito/private mode (no login required)
4. **Check content** - Should display HTML, not JSON or error

---

## Quick Checklist

- [ ] Privacy policy HTML file created/uploaded
- [ ] File hosted on publicly accessible URL
- [ ] URL uses HTTPS
- [ ] URL accessible without login
- [ ] URL added to Facebook App → Settings → Basic → Privacy Policy URL
- [ ] Changes saved in Facebook

---

## Need Help?

If you need assistance:
1. **GitHub Pages not working?** - Wait 2-3 minutes after enabling, then check again
2. **URL not accessible?** - Make sure repository is public (not private)
3. **Facebook rejecting URL?** - Verify URL works in browser first, check it's HTTPS

---

**Last Updated:** December 2024  
**Status:** Ready to Use ✅

