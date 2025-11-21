#!/bin/bash

# Script to check if content tables exist and create them if needed

echo "🔍 Checking if content tables exist..."

mysql -u root -p -e "
USE social_media_analytics;

SELECT 
    CASE 
        WHEN COUNT(*) = 3 THEN '✅ All tables exist'
        ELSE CONCAT('⚠️  Missing tables. Found: ', COUNT(*), '/3')
    END as status
FROM information_schema.tables 
WHERE table_schema = 'social_media_analytics' 
AND table_name IN ('content_drafts', 'scheduled_posts', 'content_templates');

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'social_media_analytics' 
AND table_name IN ('content_drafts', 'scheduled_posts', 'content_templates');
"

echo ""
echo "If tables are missing, run:"
echo "  cd backend && mysql -u root -p social_media_analytics < src/config/database-schema-phase6.sql"

