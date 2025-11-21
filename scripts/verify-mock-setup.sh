#!/bin/bash

# Verify Mock Account Setup
echo "=========================================="
echo "Verifying Mock Account Setup"
echo "=========================================="
echo ""

# Check mock account
echo "📋 Checking mock account..."
ACCOUNT_INFO=$(mysql -u root -p12345678 -e "USE social_media_analytics; SELECT id, user_id, platform_display_name, account_status FROM user_social_accounts WHERE access_token = 'mock_token';" 2>&1 | grep -v "Warning")

if [ -z "$ACCOUNT_INFO" ] || [ "$ACCOUNT_INFO" = "id	user_id	platform_display_name	account_status" ]; then
    echo "❌ No mock account found!"
    echo "   Run: ./scripts/create-mock-account.sh"
    exit 1
fi

echo "$ACCOUNT_INFO" | tail -1 | awk '{print "✅ Mock account found: ID=" $1 ", User=" $2 ", Name=" $3 ", Status=" $4}'
echo ""

# Get account ID
ACCOUNT_ID=$(echo "$ACCOUNT_INFO" | tail -1 | awk '{print $1}')

# Check current data
echo "📊 Current Data Status:"
POST_COUNT=$(mysql -u root -p12345678 -e "USE social_media_analytics; SELECT COUNT(*) as count FROM social_posts WHERE account_id = $ACCOUNT_ID;" 2>&1 | grep -v "Warning" | tail -1)
METRICS_COUNT=$(mysql -u root -p12345678 -e "USE social_media_analytics; SELECT COUNT(*) as count FROM post_engagement_metrics WHERE post_id IN (SELECT id FROM social_posts WHERE account_id = $ACCOUNT_ID);" 2>&1 | grep -v "Warning" | tail -1)
JOBS_COUNT=$(mysql -u root -p12345678 -e "USE social_media_analytics; SELECT COUNT(*) as count FROM data_collection_jobs WHERE account_id = $ACCOUNT_ID;" 2>&1 | grep -v "Warning" | tail -1)

echo "   Posts: $POST_COUNT"
echo "   Engagement Metrics: $METRICS_COUNT"
echo "   Collection Jobs: $JOBS_COUNT"
echo ""

# Check backend status
echo "🔧 Backend Server Status:"
if curl -s http://localhost:5001/health > /dev/null 2>&1; then
    echo "   ✅ Backend is running on http://localhost:5001"
else
    echo "   ⚠️  Backend is not running"
    echo "   Start it with: cd backend && npm run dev"
fi
echo ""

# Check frontend status
echo "🔧 Frontend Server Status:"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "   ✅ Frontend is running on http://localhost:3000"
else
    echo "   ⚠️  Frontend is not running"
    echo "   Start it with: cd frontend && npm run dev"
fi
echo ""

echo "=========================================="
echo "📝 Next Steps to Test Phase 4:"
echo "=========================================="
echo ""
echo "Option 1: Test via UI (Recommended)"
echo "   1. Make sure backend and frontend are running"
echo "   2. Go to: http://localhost:3000/settings/accounts"
echo "   3. Find 'Mock Facebook Account'"
echo "   4. Click 'Sync Data' button"
echo "   5. Wait for success message"
echo ""
echo "Option 2: Test via API"
echo "   1. Get JWT token from browser (DevTools → Application → Local Storage)"
echo "   2. Run:"
echo "      curl -X POST http://localhost:5001/api/data/collect/$ACCOUNT_ID \\"
echo "        -H 'Authorization: Bearer YOUR_TOKEN' \\"
echo "        -H 'Content-Type: application/json'"
echo ""
echo "Option 3: Verify Database After Sync"
echo "   Run: mysql -u root -p12345678 -e \"USE social_media_analytics; SELECT COUNT(*) FROM social_posts;\""
echo ""
echo "=========================================="

