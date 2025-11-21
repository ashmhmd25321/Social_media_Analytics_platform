#!/bin/bash

# Script to create content management tables (Phase 6)

echo "🔧 Creating Content Management Tables (Phase 6)..."
echo ""

cd "$(dirname "$0")/../backend"

if [ ! -f "src/config/database-schema-phase6.sql" ]; then
    echo "❌ Error: database-schema-phase6.sql not found!"
    exit 1
fi

echo "Running migration..."
mysql -u root -p social_media_analytics < src/config/database-schema-phase6.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Content tables created successfully!"
    echo ""
    echo "Created tables:"
    echo "  - content_drafts"
    echo "  - scheduled_posts"
    echo "  - content_templates"
    echo "  - content_categories"
    echo "  - draft_categories"
else
    echo ""
    echo "❌ Error creating tables. Please check the error above."
    exit 1
fi

