#!/bin/bash

# Script to check if content tables exist and create them if missing

echo "🔍 Checking if content tables exist..."

cd "$(dirname "$0")/../backend"

# Check if tables exist (this will prompt for password)
mysql -u root -p -e "
USE social_media_analytics;
SELECT 
    CASE 
        WHEN COUNT(*) = 5 THEN '✅ All tables exist'
        ELSE CONCAT('⚠️  Missing tables. Found: ', COUNT(*), '/5')
    END as status
FROM information_schema.tables 
WHERE table_schema = 'social_media_analytics' 
AND table_name IN ('content_drafts', 'scheduled_posts', 'content_templates', 'content_categories', 'draft_categories');
" 2>/dev/null

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Could not check tables. Running migration..."
    echo ""
    echo "Please enter your MySQL root password when prompted:"
    mysql -u root -p social_media_analytics < src/config/database-schema-phase6.sql
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Migration completed successfully!"
        echo ""
        echo "Verifying tables..."
        mysql -u root -p -e "USE social_media_analytics; SHOW TABLES LIKE 'content%';" 2>/dev/null
    else
        echo ""
        echo "❌ Migration failed. Please check the error above."
        exit 1
    fi
else
    echo ""
    echo "Tables found:"
    mysql -u root -p -e "USE social_media_analytics; SELECT table_name FROM information_schema.tables WHERE table_schema = 'social_media_analytics' AND table_name LIKE 'content%';" 2>/dev/null | grep -v "table_name"
fi

