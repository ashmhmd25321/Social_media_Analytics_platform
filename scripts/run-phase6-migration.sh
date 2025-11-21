#!/bin/bash

# Phase 6 Database Migration Script
# This script creates the content management tables

echo "🔧 Running Phase 6 Database Migration..."
echo ""
echo "This will create the following tables:"
echo "  - content_drafts"
echo "  - scheduled_posts"
echo "  - content_templates"
echo "  - content_categories"
echo "  - draft_categories"
echo ""

cd "$(dirname "$0")/../backend"

if [ ! -f "src/config/database-schema-phase6.sql" ]; then
    echo "❌ Error: database-schema-phase6.sql not found!"
    exit 1
fi

echo "Running migration..."
echo "You will be prompted for your MySQL root password."
echo ""

mysql -u root -p social_media_analytics < src/config/database-schema-phase6.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "Tables created:"
    mysql -u root -p -e "USE social_media_analytics; SHOW TABLES LIKE 'content%';" 2>/dev/null | grep -v "Tables_in" || echo "  (Run 'mysql -u root -p -e \"USE social_media_analytics; SHOW TABLES LIKE \\\"content%\\\";\"' to verify)"
    echo ""
    echo "🎉 You can now use the Content Library!"
else
    echo ""
    echo "❌ Migration failed. Please check the error above."
    exit 1
fi

