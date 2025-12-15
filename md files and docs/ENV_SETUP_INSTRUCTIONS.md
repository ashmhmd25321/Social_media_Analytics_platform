# Backend .env File Setup

## Problem
The error "Platform OAuth not configured" occurs because the `.env` file doesn't exist or doesn't have the OAuth credentials.

## Solution: Create `.env` file

**IMPORTANT:** Create a file named `.env` in the `backend/` folder with these contents:

### Step 1: Create the file

Create `backend/.env` (not `.env.example`, the actual `.env` file)

### Step 2: Add these contents to `backend/.env`:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_database_password_here
DB_NAME=social_media_analytics

# Server Configuration
PORT=5001
BACKEND_URL=http://localhost:5001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Facebook OAuth Credentials
FACEBOOK_CLIENT_ID=4415283775358718
FACEBOOK_CLIENT_SECRET=7da790d4e3da49c47db3f905a7565d30

# Instagram OAuth Credentials (uses same as Facebook)
INSTAGRAM_CLIENT_ID=4415283775358718
INSTAGRAM_CLIENT_SECRET=7da790d4e3da49c47db3f905a7565d30

# YouTube OAuth Credentials
YOUTUBE_CLIENT_ID=420878294938-lgjip5gjja3r05h7jffmk0ve0mf4k699.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=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

# YouTube API Key
YOUTUBE_API_KEY=AIzaSyBv51l0oue7tS_gCKLBVTGONj3Xsct6WUI

# Python ML Service (Optional)
PYTHON_SERVICE_URL=http://localhost:5000
```

### Step 3: Update Database Password

Replace `your_database_password_here` with your actual MySQL password.

### Step 4: Restart Backend

After creating the `.env` file, restart your backend server:

```bash
cd backend
npm run dev
```

## Verify It Works

1. Backend should start without errors
2. Go to: `http://localhost:3000/settings/accounts`
3. Click "Connect Account" - should work now!

## Important Notes

- `.env` file is gitignored (won't be committed to git)
- Make sure the file is named exactly `.env` (not `.env.txt` or anything else)
- File should be in the `backend/` directory
- No spaces around the `=` sign
- No quotes needed around values (unless the value itself contains spaces)

