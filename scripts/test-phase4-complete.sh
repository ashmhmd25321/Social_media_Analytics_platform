#!/bin/bash

# Comprehensive Phase 4 Testing Script
# Tests all features from Phase 1 to Phase 4

echo "=========================================="
echo "Phase 4 Comprehensive Testing"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0

# Function to test API endpoint
test_api() {
    local name=$1
    local method=$2
    local endpoint=$3
    local token=$4
    local expected_status=$5
    
    echo -n "Testing $name... "
    
    if [ -z "$token" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "http://localhost:5001$endpoint" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "http://localhost:5001$endpoint" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" 2>&1)
    fi
    
    http_code=$(echo "$response" | tail -1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" == "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (Status: $http_code, Expected: $expected_status)"
        echo "Response: $body"
        ((FAILED++))
        return 1
    fi
}

# Check if servers are running
echo "📡 Checking Server Status..."
echo ""

if ! curl -s http://localhost:5001/health > /dev/null 2>&1; then
    echo -e "${RED}✗ Backend server is not running!${NC}"
    echo "   Start it with: cd backend && npm run dev"
    exit 1
fi
echo -e "${GREEN}✓ Backend server is running${NC}"

if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${RED}✗ Frontend server is not running!${NC}"
    echo "   Start it with: cd frontend && npm run dev"
    exit 1
fi
echo -e "${GREEN}✓ Frontend server is running${NC}"
echo ""

# Phase 1: Authentication
echo "=========================================="
echo "Phase 1: Authentication Testing"
echo "=========================================="
echo ""

test_api "Health Check" "GET" "/health" "" "200"
test_api "Get Platforms (Public)" "GET" "/api/social/platforms" "" "200"

# Get JWT token for authenticated tests
echo -n "Getting JWT token... "
TOKEN_RESPONSE=$(curl -s -X POST "http://localhost:5001/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"Test123456"}' 2>&1)

TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ FAILED${NC}"
    echo "Response: $TOKEN_RESPONSE"
    exit 1
else
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
fi
echo ""

# Phase 2: Platform Management
echo "=========================================="
echo "Phase 2: Platform Management Testing"
echo "=========================================="
echo ""

test_api "Get Platforms (Authenticated)" "GET" "/api/social/platforms" "$TOKEN" "200"
test_api "Get Connected Accounts" "GET" "/api/social/accounts" "$TOKEN" "200"
echo ""

# Phase 3: OAuth Integration
echo "=========================================="
echo "Phase 3: OAuth Integration Testing"
echo "=========================================="
echo ""

# Check if mock account exists
echo -n "Checking mock account... "
ACCOUNT_COUNT=$(mysql -u root -p12345678 -e "USE social_media_analytics; SELECT COUNT(*) FROM user_social_accounts WHERE access_token = 'mock_token';" 2>&1 | grep -v "Warning" | tail -1)

if [ "$ACCOUNT_COUNT" -gt "0" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (Mock account exists)"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ WARNING${NC} (No mock account found)"
    echo "   Run: ./scripts/create-mock-account.sh"
fi
echo ""

# Phase 4: Data Collection
echo "=========================================="
echo "Phase 4: Data Collection Testing"
echo "=========================================="
echo ""

# Get account ID
ACCOUNT_ID=$(mysql -u root -p12345678 -e "USE social_media_analytics; SELECT id FROM user_social_accounts WHERE access_token = 'mock_token' LIMIT 1;" 2>&1 | grep -v "Warning" | tail -1)

if [ -z "$ACCOUNT_ID" ]; then
    echo -e "${RED}✗ No mock account found${NC}"
    echo "   Run: ./scripts/create-mock-account.sh"
    exit 1
fi

echo "Using Account ID: $ACCOUNT_ID"
echo ""

# Test data collection
echo -n "Testing data collection... "
COLLECT_RESPONSE=$(curl -s -X POST "http://localhost:5001/api/data/collect/$ACCOUNT_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" 2>&1)

if echo "$COLLECT_RESPONSE" | grep -q '"success":true'; then
    POSTS_COLLECTED=$(echo "$COLLECT_RESPONSE" | grep -o '"posts_collected":[0-9]*' | cut -d':' -f2)
    echo -e "${GREEN}✓ PASSED${NC} (Collected $POSTS_COLLECTED posts)"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    echo "Response: $COLLECT_RESPONSE"
    ((FAILED++))
fi
echo ""

# Test getting posts
test_api "Get Account Posts" "GET" "/api/data/posts/$ACCOUNT_ID" "$TOKEN" "200"

# Test getting collection jobs
test_api "Get Collection Jobs" "GET" "/api/data/jobs/$ACCOUNT_ID" "$TOKEN" "200"

# Test getting follower metrics
test_api "Get Follower Metrics" "GET" "/api/data/followers/$ACCOUNT_ID" "$TOKEN" "200"
echo ""

# Database Verification
echo "=========================================="
echo "Database Verification"
echo "=========================================="
echo ""

echo "📊 Current Database Status:"
mysql -u root -p12345678 -e "USE social_media_analytics; 
SELECT 
    'Users' as 'Table', COUNT(*) as 'Count' FROM users
UNION ALL
SELECT 'Platforms', COUNT(*) FROM social_platforms
UNION ALL
SELECT 'Connected Accounts', COUNT(*) FROM user_social_accounts
UNION ALL
SELECT 'Posts', COUNT(*) FROM social_posts
UNION ALL
SELECT 'Engagement Metrics', COUNT(*) FROM post_engagement_metrics
UNION ALL
SELECT 'Follower Metrics', COUNT(*) FROM follower_metrics
UNION ALL
SELECT 'Collection Jobs', COUNT(*) FROM data_collection_jobs;" 2>&1 | grep -v "Warning"
echo ""

# Sample data check
echo "📝 Sample Posts (Latest 3):"
mysql -u root -p12345678 -e "USE social_media_analytics; 
SELECT id, LEFT(content, 40) as content_preview, content_type, published_at 
FROM social_posts 
ORDER BY published_at DESC 
LIMIT 3;" 2>&1 | grep -v "Warning"
echo ""

# Summary
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo ""
echo -e "Tests ${GREEN}Passed${NC}: $PASSED"
echo -e "Tests ${RED}Failed${NC}: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All Phase 4 tests passed!${NC}"
    echo ""
    echo "Next Steps:"
    echo "1. Test in browser: http://localhost:3000/settings/accounts"
    echo "2. Click 'Sync Data' to test UI integration"
    echo "3. Verify data appears in database"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please review above.${NC}"
    exit 1
fi

