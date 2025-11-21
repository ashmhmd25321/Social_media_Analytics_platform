#!/bin/bash

# Facebook OAuth Setup Script
# This script helps you configure Facebook OAuth credentials

echo "=========================================="
echo "Facebook OAuth Setup Helper"
echo "=========================================="
echo ""

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo "❌ Error: backend/.env file not found!"
    echo "Please create it first by copying backend/.env.example"
    exit 1
fi

echo "📝 Current Facebook configuration:"
echo ""
grep -E "FACEBOOK_CLIENT_ID|FACEBOOK_CLIENT_SECRET" backend/.env || echo "   (Not configured yet)"
echo ""

echo "Please provide your Facebook App credentials:"
echo ""
read -p "Enter Facebook App ID: " APP_ID
read -p "Enter Facebook App Secret: " APP_SECRET

if [ -z "$APP_ID" ] || [ -z "$APP_SECRET" ]; then
    echo "❌ Error: App ID and Secret are required!"
    exit 1
fi

# Check if FACEBOOK_CLIENT_ID already exists
if grep -q "FACEBOOK_CLIENT_ID" backend/.env; then
    # Update existing values
    sed -i.bak "s/FACEBOOK_CLIENT_ID=.*/FACEBOOK_CLIENT_ID=$APP_ID/" backend/.env
    sed -i.bak "s/FACEBOOK_CLIENT_SECRET=.*/FACEBOOK_CLIENT_SECRET=$APP_SECRET/" backend/.env
    echo "✅ Updated existing Facebook credentials"
else
    # Add new values
    echo "" >> backend/.env
    echo "# Facebook OAuth Configuration" >> backend/.env
    echo "FACEBOOK_CLIENT_ID=$APP_ID" >> backend/.env
    echo "FACEBOOK_CLIENT_SECRET=$APP_SECRET" >> backend/.env
    echo "INSTAGRAM_CLIENT_ID=$APP_ID" >> backend/.env
    echo "INSTAGRAM_CLIENT_SECRET=$APP_SECRET" >> backend/.env
    echo "✅ Added Facebook credentials to .env"
fi

echo ""
echo "=========================================="
echo "✅ Configuration Complete!"
echo "=========================================="
echo ""
echo "⚠️  IMPORTANT: Restart your backend server for changes to take effect!"
echo ""
echo "Next steps:"
echo "1. Make sure redirect URI is configured in Facebook App:"
echo "   http://localhost:5001/api/social/callback/facebook"
echo ""
echo "2. Restart backend:"
echo "   cd backend && npm run dev"
echo ""
echo "3. Test connection in browser:"
echo "   http://localhost:3000/settings/accounts"
echo ""

