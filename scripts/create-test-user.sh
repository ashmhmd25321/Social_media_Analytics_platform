#!/bin/bash

# Create Test User Script
# This script creates a test user via the API

echo "Creating test user via API..."

# Register the user
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456",
    "first_name": "Test",
    "last_name": "User"
  }' | jq '.'

echo ""
echo "Test user created! You can now login with:"
echo "Email: test@example.com"
echo "Password: Test123456"

