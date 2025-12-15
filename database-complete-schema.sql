-- =====================================================
-- Social Media Analytics Platform - Complete Database Schema
-- =====================================================
-- This script creates the complete database schema for the Social Media Analytics Platform
-- Run this script in phpMyAdmin or MySQL command line
-- =====================================================

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS social_media_analytics 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Use the database
USE social_media_analytics;

-- =====================================================
-- PHASE 2: User Authentication Tables
-- =====================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role ENUM('admin', 'user', 'viewer') DEFAULT 'user',
    is_email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    email_verification_expires DATETIME,
    password_reset_token VARCHAR(255),
    password_reset_expires DATETIME,
    profile_picture_url VARCHAR(500),
    phone VARCHAR(20),
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email),
    INDEX idx_email_verification_token (email_verification_token),
    INDEX idx_password_reset_token (password_reset_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    notification_email BOOLEAN DEFAULT TRUE,
    notification_push BOOLEAN DEFAULT TRUE,
    notification_sms BOOLEAN DEFAULT FALSE,
    email_digest_frequency ENUM('daily', 'weekly', 'monthly', 'never') DEFAULT 'weekly',
    preferred_language VARCHAR(10) DEFAULT 'en',
    theme VARCHAR(20) DEFAULT 'light',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_preferences (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Refresh tokens table for secure token management
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PHASE 3: Social Media Platform Integration
-- =====================================================

-- Social media platforms table
CREATE TABLE IF NOT EXISTS social_platforms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    icon_url VARCHAR(500),
    api_base_url VARCHAR(255),
    oauth_auth_url VARCHAR(500),
    oauth_token_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default platforms (Free APIs only: Facebook, Instagram, YouTube)
INSERT IGNORE INTO social_platforms (name, display_name, api_base_url, oauth_auth_url, oauth_token_url) VALUES
('facebook', 'Facebook', 'https://graph.facebook.com/v18.0', 'https://www.facebook.com/v18.0/dialog/oauth', 'https://graph.facebook.com/v18.0/oauth/access_token'),
('instagram', 'Instagram', 'https://graph.instagram.com', 'https://api.instagram.com/oauth/authorize', 'https://api.instagram.com/oauth/access_token'),
('youtube', 'YouTube', 'https://www.googleapis.com/youtube/v3', 'https://accounts.google.com/o/oauth2/v2/auth', 'https://oauth2.googleapis.com/token');

-- User social media account connections
CREATE TABLE IF NOT EXISTS user_social_accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    platform_id INT NOT NULL,
    platform_account_id VARCHAR(255) NOT NULL,
    platform_username VARCHAR(255),
    platform_display_name VARCHAR(255),
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at TIMESTAMP NULL,
    token_refresh_expires_at TIMESTAMP NULL,
    profile_picture_url VARCHAR(500),
    account_status ENUM('connected', 'disconnected', 'expired', 'error') DEFAULT 'connected',
    is_active BOOLEAN DEFAULT TRUE,
    last_synced_at TIMESTAMP NULL,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (platform_id) REFERENCES social_platforms(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_platform_account (user_id, platform_id, platform_account_id),
    INDEX idx_user_id (user_id),
    INDEX idx_platform_id (platform_id),
    INDEX idx_account_status (account_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- OAuth state management (for CSRF protection)
CREATE TABLE IF NOT EXISTS oauth_states (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    platform_id INT NOT NULL,
    state_token VARCHAR(255) NOT NULL UNIQUE,
    redirect_uri VARCHAR(500),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (platform_id) REFERENCES social_platforms(id) ON DELETE CASCADE,
    INDEX idx_state_token (state_token),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PHASE 4: Data Collection & Storage
-- =====================================================

-- Posts/Content storage table
CREATE TABLE IF NOT EXISTS social_posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    account_id INT NOT NULL,
    platform_post_id VARCHAR(255) NOT NULL,
    platform_type VARCHAR(50) NOT NULL,
    content TEXT,
    content_type ENUM('text', 'image', 'video', 'carousel', 'story', 'reel', 'other') DEFAULT 'text',
    media_urls JSON,
    permalink VARCHAR(500),
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    metadata JSON,
    created_at_local TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at_local TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES user_social_accounts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_platform_post (account_id, platform_post_id),
    INDEX idx_user_id (user_id),
    INDEX idx_account_id (account_id),
    INDEX idx_platform_type (platform_type),
    INDEX idx_published_at (published_at),
    INDEX idx_created_at_local (created_at_local)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Engagement metrics table (current metrics per post)
CREATE TABLE IF NOT EXISTS post_engagement_metrics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    shares_count INT DEFAULT 0,
    saves_count INT DEFAULT 0,
    views_count INT DEFAULT 0,
    clicks_count INT DEFAULT 0,
    impressions_count INT DEFAULT 0,
    reach_count INT DEFAULT 0,
    engagement_rate DECIMAL(10, 4) DEFAULT 0.0000,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_post_metric (post_id),
    INDEX idx_post_id (post_id),
    INDEX idx_recorded_at (recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Historical engagement snapshots (for tracking changes over time)
CREATE TABLE IF NOT EXISTS engagement_snapshots (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    shares_count INT DEFAULT 0,
    saves_count INT DEFAULT 0,
    views_count INT DEFAULT 0,
    clicks_count INT DEFAULT 0,
    impressions_count INT DEFAULT 0,
    reach_count INT DEFAULT 0,
    engagement_rate DECIMAL(10, 4) DEFAULT 0.0000,
    snapshot_date DATE NOT NULL,
    snapshot_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE,
    INDEX idx_post_id (post_id),
    INDEX idx_snapshot_date (snapshot_date),
    INDEX idx_snapshot_datetime (snapshot_date, snapshot_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Follower/Audience data table
CREATE TABLE IF NOT EXISTS follower_metrics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    account_id INT NOT NULL,
    follower_count INT DEFAULT 0,
    following_count INT DEFAULT 0,
    posts_count INT DEFAULT 0,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES user_social_accounts(id) ON DELETE CASCADE,
    INDEX idx_account_id (account_id),
    INDEX idx_recorded_at (recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Historical follower snapshots
CREATE TABLE IF NOT EXISTS follower_snapshots (
    id INT PRIMARY KEY AUTO_INCREMENT,
    account_id INT NOT NULL,
    follower_count INT DEFAULT 0,
    following_count INT DEFAULT 0,
    posts_count INT DEFAULT 0,
    snapshot_date DATE NOT NULL,
    snapshot_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES user_social_accounts(id) ON DELETE CASCADE,
    INDEX idx_account_id (account_id),
    INDEX idx_snapshot_date (snapshot_date),
    INDEX idx_snapshot_datetime (snapshot_date, snapshot_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data collection jobs/logs table
CREATE TABLE IF NOT EXISTS data_collection_jobs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    account_id INT NOT NULL,
    job_type ENUM('full_sync', 'incremental_sync', 'manual_sync', 'scheduled_sync') NOT NULL,
    status ENUM('pending', 'running', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    platform_type VARCHAR(50) NOT NULL,
    items_collected INT DEFAULT 0,
    items_updated INT DEFAULT 0,
    items_failed INT DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    duration_seconds INT NULL,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES user_social_accounts(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_account_id (account_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- API rate limit tracking
CREATE TABLE IF NOT EXISTS api_rate_limits (
    id INT PRIMARY KEY AUTO_INCREMENT,
    account_id INT NOT NULL,
    platform_type VARCHAR(50) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    requests_made INT DEFAULT 0,
    requests_limit INT DEFAULT 0,
    window_start DATETIME NOT NULL,
    window_end DATETIME NOT NULL,
    reset_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES user_social_accounts(id) ON DELETE CASCADE,
    INDEX idx_account_platform (account_id, platform_type),
    INDEX idx_reset_at (reset_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- NLP & Sentiment Analysis Schema
-- =====================================================

-- Add sentiment analysis columns to social_posts table
-- Note: If columns already exist, you may need to comment out these ALTER statements
ALTER TABLE social_posts
ADD COLUMN sentiment_score DECIMAL(5, 2) DEFAULT NULL,
ADD COLUMN sentiment_comparative DECIMAL(5, 2) DEFAULT NULL,
ADD COLUMN sentiment_classification ENUM('positive', 'neutral', 'negative') DEFAULT NULL,
ADD COLUMN extracted_keywords JSON DEFAULT NULL,
ADD COLUMN extracted_hashtags JSON DEFAULT NULL,
ADD COLUMN extracted_mentions JSON DEFAULT NULL,
ADD COLUMN content_type_detected VARCHAR(50) DEFAULT NULL,
ADD COLUMN language_detected VARCHAR(10) DEFAULT 'en';

-- Add indexes for sentiment columns
ALTER TABLE social_posts ADD INDEX idx_sentiment_classification (sentiment_classification);
ALTER TABLE social_posts ADD INDEX idx_sentiment_score (sentiment_score);

-- Create table for comment sentiment analysis
CREATE TABLE IF NOT EXISTS comment_sentiments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,
    comment_text TEXT NOT NULL,
    sentiment_score DECIMAL(5, 2) NOT NULL,
    sentiment_comparative DECIMAL(5, 2) NOT NULL,
    sentiment_classification ENUM('positive', 'neutral', 'negative') NOT NULL,
    positive_words JSON DEFAULT NULL,
    negative_words JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE,
    INDEX idx_post_id (post_id),
    INDEX idx_sentiment_classification (sentiment_classification),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create table for content recommendations
CREATE TABLE IF NOT EXISTS content_recommendations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    account_id INT NULL,
    recommendation_type ENUM('topic', 'hashtag', 'posting_time', 'content_type', 'tone') NOT NULL,
    recommendation_value TEXT NOT NULL,
    confidence_score DECIMAL(3, 2) DEFAULT 0.5,
    based_on_posts_count INT DEFAULT 0,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    is_applied BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES user_social_accounts(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_account_id (account_id),
    INDEX idx_recommendation_type (recommendation_type),
    INDEX idx_generated_at (generated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create table for sentiment trends
CREATE TABLE IF NOT EXISTS sentiment_trends (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    account_id INT NULL,
    date DATE NOT NULL,
    positive_count INT DEFAULT 0,
    neutral_count INT DEFAULT 0,
    negative_count INT DEFAULT 0,
    avg_sentiment_score DECIMAL(5, 2) DEFAULT 0,
    total_posts INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES user_social_accounts(id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_account_date (user_id, account_id, date),
    INDEX idx_user_id (user_id),
    INDEX idx_account_id (account_id),
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PHASE 6: Content Management & Scheduling
-- =====================================================

-- Content drafts table
CREATE TABLE IF NOT EXISTS content_drafts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255),
    content TEXT NOT NULL,
    content_type ENUM('text', 'image', 'video', 'carousel', 'story', 'reel', 'other') DEFAULT 'text',
    media_urls JSON,
    hashtags JSON,
    mentions JSON,
    target_platforms JSON,
    status ENUM('draft', 'scheduled', 'published', 'archived') DEFAULT 'draft',
    scheduled_at TIMESTAMP NULL,
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    metadata JSON,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_scheduled_at (scheduled_at),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Scheduled posts table
CREATE TABLE IF NOT EXISTS scheduled_posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    draft_id INT NULL,
    account_id INT NOT NULL,
    platform_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    content_type ENUM('text', 'image', 'video', 'carousel', 'story', 'reel', 'other') DEFAULT 'text',
    media_urls JSON,
    scheduled_at TIMESTAMP NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    status ENUM('pending', 'processing', 'published', 'failed', 'cancelled') DEFAULT 'pending',
    published_at TIMESTAMP NULL,
    platform_post_id VARCHAR(255) NULL,
    error_message TEXT NULL,
    retry_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    metadata JSON,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES user_social_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (draft_id) REFERENCES content_drafts(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_account_id (account_id),
    INDEX idx_scheduled_at (scheduled_at),
    INDEX idx_status (status),
    INDEX idx_platform_type (platform_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Content templates table
CREATE TABLE IF NOT EXISTS content_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    content_type ENUM('text', 'image', 'video', 'carousel', 'story', 'reel', 'other') DEFAULT 'text',
    media_urls JSON,
    hashtags JSON,
    target_platforms JSON,
    is_public BOOLEAN DEFAULT FALSE,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_public (is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Content categories table (for organizing drafts and posts)
CREATE TABLE IF NOT EXISTS content_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7) DEFAULT '#6366f1',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_category (user_id, name),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Link drafts to categories (many-to-many)
CREATE TABLE IF NOT EXISTS draft_categories (
    draft_id INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (draft_id, category_id),
    FOREIGN KEY (draft_id) REFERENCES content_drafts(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES content_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PHASE 7: Reporting & Insights
-- =====================================================

-- Report templates table: Reusable report templates
CREATE TABLE IF NOT EXISTS report_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  report_type ENUM('overview', 'audience', 'content', 'engagement', 'custom') NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  is_system BOOLEAN DEFAULT FALSE,
  config JSON NOT NULL,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_public (is_public),
  INDEX idx_is_system (is_system)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reports table: Stores generated reports
CREATE TABLE IF NOT EXISTS reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  report_type ENUM('overview', 'audience', 'content', 'engagement', 'custom') NOT NULL DEFAULT 'overview',
  template_id INT NULL,
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  timezone VARCHAR(50) DEFAULT 'UTC',
  format ENUM('pdf', 'excel', 'html') NOT NULL DEFAULT 'pdf',
  status ENUM('draft', 'generating', 'completed', 'failed') NOT NULL DEFAULT 'draft',
  file_path VARCHAR(500) NULL,
  file_size INT NULL,
  metadata JSON NULL,
  scheduled_at DATETIME NULL,
  generated_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES report_templates(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Report sections table: Custom sections in reports
CREATE TABLE IF NOT EXISTS report_sections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_id INT NOT NULL,
  section_type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  config JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  INDEX idx_report_id (report_id),
  INDEX idx_order (order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Alerts table: User-defined alerts
CREATE TABLE IF NOT EXISTS alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  alert_type ENUM('follower_milestone', 'engagement_drop', 'engagement_spike', 'new_post', 'custom') NOT NULL,
  condition_type ENUM('greater_than', 'less_than', 'equals', 'percentage_change') NOT NULL,
  threshold_value DECIMAL(10, 2) NOT NULL,
  metric_type VARCHAR(100) NOT NULL,
  platform_id INT NULL,
  account_id INT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  notification_channels JSON NOT NULL,
  last_triggered_at DATETIME NULL,
  trigger_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (platform_id) REFERENCES social_platforms(id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES user_social_accounts(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_active (is_active),
  INDEX idx_alert_type (alert_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Alert triggers table: History of alert triggers
CREATE TABLE IF NOT EXISTS alert_triggers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  alert_id INT NOT NULL,
  triggered_at DATETIME NOT NULL,
  metric_value DECIMAL(10, 2) NOT NULL,
  threshold_value DECIMAL(10, 2) NOT NULL,
  context JSON NULL,
  notification_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE,
  INDEX idx_alert_id (alert_id),
  INDEX idx_triggered_at (triggered_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications table: In-app notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  icon VARCHAR(100) NULL,
  link VARCHAR(500) NULL,
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at),
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insights table: Generated insights and recommendations
CREATE TABLE IF NOT EXISTS insights (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  insight_type ENUM('performance', 'recommendation', 'trend', 'opportunity') NOT NULL,
  category VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  actionable BOOLEAN DEFAULT TRUE,
  action_url VARCHAR(500) NULL,
  related_metrics JSON NULL,
  confidence_score DECIMAL(3, 2) DEFAULT 0.5,
  is_dismissed BOOLEAN DEFAULT FALSE,
  dismissed_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_insight_type (insight_type),
  INDEX idx_priority (priority),
  INDEX idx_is_dismissed (is_dismissed),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Scheduled reports table: Automatically generated reports
CREATE TABLE IF NOT EXISTS scheduled_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  report_template_id INT NOT NULL,
  schedule_type ENUM('daily', 'weekly', 'monthly', 'custom') NOT NULL,
  schedule_config JSON NOT NULL,
  recipients JSON NOT NULL,
  format ENUM('pdf', 'excel', 'html') NOT NULL DEFAULT 'pdf',
  is_active BOOLEAN DEFAULT TRUE,
  last_generated_at DATETIME NULL,
  next_generation_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (report_template_id) REFERENCES report_templates(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_active (is_active),
  INDEX idx_next_generation_at (next_generation_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PHASE 8: Advanced Features (Teams & Campaigns)
-- =====================================================

-- Teams table: Organizations/teams that users belong to
CREATE TABLE IF NOT EXISTS teams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id INT NOT NULL,
  plan_type ENUM('free', 'basic', 'professional', 'enterprise') DEFAULT 'free',
  max_members INT DEFAULT 5,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_owner_id (owner_id),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Team members table: Users belonging to teams with roles
CREATE TABLE IF NOT EXISTS team_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  team_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('owner', 'admin', 'editor', 'viewer') NOT NULL DEFAULT 'viewer',
  permissions JSON,
  invited_by INT,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_team_user (team_id, user_id),
  INDEX idx_team_id (team_id),
  INDEX idx_user_id (user_id),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Team invitations table
CREATE TABLE IF NOT EXISTS team_invitations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  team_id INT NOT NULL,
  email VARCHAR(255) NOT NULL,
  role ENUM('admin', 'editor', 'viewer') NOT NULL DEFAULT 'viewer',
  invited_by INT NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_team_id (team_id),
  INDEX idx_email (email),
  INDEX idx_token (token),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Content approval workflows table
CREATE TABLE IF NOT EXISTS content_approvals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  content_id INT NOT NULL,
  content_type ENUM('draft', 'scheduled') NOT NULL,
  team_id INT NOT NULL,
  submitted_by INT NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'changes_requested') DEFAULT 'pending',
  approver_id INT NULL,
  approval_notes TEXT,
  approved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_content (content_id, content_type),
  INDEX idx_team_id (team_id),
  INDEX idx_status (status),
  INDEX idx_submitted_by (submitted_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Team activity logs table
CREATE TABLE IF NOT EXISTS team_activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  team_id INT NOT NULL,
  user_id INT NOT NULL,
  action_type VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INT,
  description TEXT,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_team_id (team_id),
  INDEX idx_user_id (user_id),
  INDEX idx_action_type (action_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  team_id INT NULL,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  campaign_type ENUM('awareness', 'engagement', 'conversion', 'retention', 'custom') DEFAULT 'engagement',
  start_date DATE NOT NULL,
  end_date DATE NULL,
  budget DECIMAL(10, 2) NULL,
  status ENUM('draft', 'active', 'paused', 'completed', 'cancelled') DEFAULT 'draft',
  goals JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_team_id (team_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Campaign posts table: Links posts to campaigns
CREATE TABLE IF NOT EXISTS campaign_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id INT NOT NULL,
  post_id INT NOT NULL,
  variant_type ENUM('control', 'variant_a', 'variant_b') DEFAULT 'control',
  scheduled_at TIMESTAMP NULL,
  published_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE,
  INDEX idx_campaign_id (campaign_id),
  INDEX idx_post_id (post_id),
  INDEX idx_variant_type (variant_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Campaign metrics table: Aggregated campaign performance
CREATE TABLE IF NOT EXISTS campaign_metrics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id INT NOT NULL,
  date DATE NOT NULL,
  impressions INT DEFAULT 0,
  reach INT DEFAULT 0,
  clicks INT DEFAULT 0,
  engagements INT DEFAULT 0,
  likes INT DEFAULT 0,
  comments INT DEFAULT 0,
  shares INT DEFAULT 0,
  followers_gained INT DEFAULT 0,
  conversions INT DEFAULT 0,
  revenue DECIMAL(10, 2) DEFAULT 0,
  spend DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  UNIQUE KEY unique_campaign_date (campaign_id, date),
  INDEX idx_campaign_id (campaign_id),
  INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A/B test groups table
CREATE TABLE IF NOT EXISTS ab_test_groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  variant_type ENUM('control', 'variant_a', 'variant_b') NOT NULL,
  traffic_percentage DECIMAL(5, 2) DEFAULT 33.33,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  INDEX idx_campaign_id (campaign_id),
  INDEX idx_variant_type (variant_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Hashtag performance tracking table
CREATE TABLE IF NOT EXISTS hashtag_performance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  team_id INT NULL,
  hashtag VARCHAR(255) NOT NULL,
  platform_type VARCHAR(50) NOT NULL,
  post_count INT DEFAULT 0,
  total_impressions INT DEFAULT 0,
  total_engagement INT DEFAULT 0,
  total_reach INT DEFAULT 0,
  avg_engagement_rate DECIMAL(5, 2) DEFAULT 0,
  first_used_at TIMESTAMP NULL,
  last_used_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_hashtag_platform (user_id, hashtag, platform_type),
  INDEX idx_user_id (user_id),
  INDEX idx_team_id (team_id),
  INDEX idx_hashtag (hashtag),
  INDEX idx_platform_type (platform_type),
  INDEX idx_avg_engagement_rate (avg_engagement_rate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trend analysis table: Stores trend data for analytics
CREATE TABLE IF NOT EXISTS trend_analysis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  team_id INT NULL,
  trend_type VARCHAR(100) NOT NULL,
  trend_name VARCHAR(255) NOT NULL,
  direction ENUM('rising', 'declining', 'stable') NOT NULL,
  change_percentage DECIMAL(10, 2),
  confidence_score DECIMAL(5, 2) DEFAULT 0,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_team_id (team_id),
  INDEX idx_trend_type (trend_type),
  INDEX idx_direction (direction),
  INDEX idx_period (period_start, period_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Predictive analytics table: Stores predictions and forecasts
CREATE TABLE IF NOT EXISTS predictive_analytics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  team_id INT NULL,
  prediction_type VARCHAR(100) NOT NULL,
  target_date DATE NOT NULL,
  predicted_value DECIMAL(10, 2),
  confidence_interval_lower DECIMAL(10, 2),
  confidence_interval_upper DECIMAL(10, 2),
  confidence_score DECIMAL(5, 2) DEFAULT 0,
  model_version VARCHAR(50),
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_team_id (team_id),
  INDEX idx_prediction_type (prediction_type),
  INDEX idx_target_date (target_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PHASE 9: Database Query Optimization
-- =====================================================

-- Analytics queries optimization
-- Note: If indexes already exist, these will fail. You can safely ignore those errors.
ALTER TABLE follower_metrics ADD INDEX idx_account_recorded (account_id, recorded_at);
ALTER TABLE follower_snapshots ADD INDEX idx_account_date (account_id, snapshot_date);
ALTER TABLE post_engagement_metrics ADD INDEX idx_post_engagement (post_id, recorded_at);
ALTER TABLE engagement_snapshots ADD INDEX idx_post_date (post_id, snapshot_date);

-- Social posts optimization
ALTER TABLE social_posts ADD INDEX idx_user_platform (user_id, platform_type);
ALTER TABLE social_posts ADD INDEX idx_user_created (user_id, created_at_local);
ALTER TABLE social_posts ADD INDEX idx_user_deleted (user_id, is_deleted);

-- Content management optimization
ALTER TABLE content_drafts ADD INDEX idx_user_status (user_id, status);
ALTER TABLE scheduled_posts ADD INDEX idx_user_scheduled (user_id, scheduled_at, status);
ALTER TABLE scheduled_posts ADD INDEX idx_status_scheduled (status, scheduled_at);

-- Team and campaign optimization
ALTER TABLE team_members ADD INDEX idx_user_active (user_id, is_active);
ALTER TABLE campaigns ADD INDEX idx_user_status (user_id, status);
ALTER TABLE campaign_metrics ADD INDEX idx_campaign_date (campaign_id, date);

-- Reports and insights optimization
ALTER TABLE reports ADD INDEX idx_user_status_created (user_id, status, created_at);
ALTER TABLE insights ADD INDEX idx_user_dismissed (user_id, is_dismissed, created_at);
ALTER TABLE notifications ADD INDEX idx_user_read (user_id, is_read, created_at);

-- Composite indexes for common query patterns
ALTER TABLE social_posts ADD INDEX idx_user_platform_created (user_id, platform_type, created_at_local);
ALTER TABLE post_engagement_metrics ADD INDEX idx_post_recorded (post_id, recorded_at DESC);

-- =====================================================
-- Script Complete
-- =====================================================
-- All tables and indexes have been created successfully!
-- The database is ready for use.
-- =====================================================

