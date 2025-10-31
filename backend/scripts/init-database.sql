-- Initialize Database Script
-- Run this script to set up the database schema

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS social_media_analytics;

-- Use the database
USE social_media_analytics;

-- Run the schema
SOURCE src/config/database-schema.sql;

