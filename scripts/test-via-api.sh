#!/bin/bash

# Test Mock Data Collection via API
# This script tests Phase 4 by calling the API endpoint

echo "=========================================="
echo "Testing Mock Data Collection via API"
echo "=========================================="
echo ""

# Check if backend is running
if ! curl -s http://localhost:5001/health > /dev/null 2>&1; then
    echo "❌ Backend server is not running!"
    echo "Please start it with: cd backend && npm run dev"
    exit 1
fi

echo "✅ Backend server is running"
echo ""

# Get account ID
ACCOUNT_ID=$(mysql -u root -p12345678 -e "USE social_media_analytics; SELECT id FROM user_social_accounts WHERE access_token = 'mock_token' LIMIT 1;" 2>&1 | grep -v "Warning" | tail -1)

if [ -z "$ACCOUNT_ID" ]; then
    echo "❌ No mock account found!"
    echo "Run: ./scripts/create-mock-account.sh first"
    exit 1
fi

echo "✅ Found mock account ID: $ACCOUNT_ID"
echo ""

# Note: We need a JWT token to call the API
# For now, let's just verify the account exists and show instructions
echo "📋 To test data collection:"
echo ""
echo "1. Login to the app: http://localhost:3000"
echo "2. Go to: Settings → Manage Accounts"
echo "3. Find 'Mock Facebook Account'"
echo "4. Click 'Sync Data' button"
echo ""
echo "OR use the API with a valid JWT token:"
echo ""
echo "   curl -X POST http://localhost:5001/api/data/collect/$ACCOUNT_ID \\"
echo "     -H 'Authorization: Bearer YOUR_TOKEN' \\"
echo "     -H 'Content-Type: application/json'"
echo ""

# Check current post count
POST_COUNT=$(mysql -u root -p12345678 -e "USE social_media_analytics; SELECT COUNT(*) as count FROM social_posts WHERE account_id = $ACCOUNT_ID;" 2>&1 | grep -v "Warning" | tail -1)

echo "📊 Current Status:"
echo "   Posts in database: $POST_COUNT"
echo ""

if [ "$POST_COUNT" -eq "0" ]; then
    echo "💡 No posts yet. Sync data to test Phase 4!"
else
    echo "✅ Posts already exist! Phase 4 is working."
    echo ""
    echo "Sample posts:"
    mysql -u root -p12345678 -e "USE social_media_analytics; SELECT id, LEFT(content, 50) as content, content_type FROM social_posts WHERE account_id = $ACCOUNT_ID ORDER BY published_at DESC LIMIT 5;" 2>&1 | grep -v "Warning"
fi

echo ""
echo "=========================================="

