#!/bin/bash

# Create Mock Social Media Account for Testing
# This creates a test account that uses mock data instead of real API

echo "=========================================="
echo "Creating Mock Social Media Account"
echo "=========================================="
echo ""

# Check if user is logged in and get user ID
read -p "Enter your user ID (from database, or press Enter to use user ID 1): " USER_ID
USER_ID=${USER_ID:-1}

echo ""
echo "Creating mock Facebook account for user ID: $USER_ID"
echo ""

# Create mock account in database
mysql -u root -p12345678 social_media_analytics << EOF
INSERT INTO user_social_accounts (
  user_id,
  platform_id,
  platform_account_id,
  platform_username,
  platform_display_name,
  access_token,
  account_status,
  is_active
) VALUES (
  $USER_ID,
  1,  -- Facebook platform ID
  'mock_account_$(date +%s)',
  'mock_user',
  'Mock Facebook Account',
  'mock_token',  -- Special token that triggers mock data
  'connected',
  TRUE
)
ON DUPLICATE KEY UPDATE
  access_token = 'mock_token',
  account_status = 'connected',
  is_active = TRUE;
EOF

if [ $? -eq 0 ]; then
    echo "✅ Mock account created successfully!"
    echo ""
    echo "Account Details:"
    mysql -u root -p12345678 -e "USE social_media_analytics; SELECT id, platform_display_name, account_status FROM user_social_accounts WHERE access_token = 'mock_token' ORDER BY id DESC LIMIT 1;"
    echo ""
    echo "You can now:"
    echo "1. Go to http://localhost:3000/settings/accounts"
    echo "2. The mock account should appear"
    echo "3. Click 'Sync Data' to test data collection"
else
    echo "❌ Error creating mock account"
    exit 1
fi

