# CREATE THIS FILE: backend/.env

## Instructions

1. Go to the `backend` folder
2. Create a new file named `.env` (just `.env`, not `.env.txt`)
3. Copy and paste ALL the contents below into the file
4. Save the file
5. Restart your backend server

## Contents for backend/.env file:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
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

# Instagram OAuth Credentials
INSTAGRAM_CLIENT_ID=4415283775358718
INSTAGRAM_CLIENT_SECRET=7da790d4e3da49c47db3f905a7565d30

# YouTube OAuth Credentials
YOUTUBE_CLIENT_ID=420878294938-lgjip5gjja3r05h7jffmk0ve0mf4k699.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=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

# YouTube API Key
YOUTUBE_API_KEY=AIzaSyBv51l0oue7tS_gCKLBVTGONj3Xsct6WUI

# Python ML Service
PYTHON_SERVICE_URL=http://localhost:5000
```

## After Creating the File:

1. **Update DB_PASSWORD** if your MySQL has a password
2. **Restart backend:**
   ```bash
   cd backend
   npm run dev
   ```
3. **Test:** Go to `http://localhost:3000/settings/accounts` and click "Connect Account"

The OAuth error will be fixed once this file exists with the credentials!

