-- Phase 3: Social Media Platform Integration Schema
-- Add this to the existing database

USE social_media_analytics;

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

-- Insert default platforms
INSERT INTO social_platforms (name, display_name, api_base_url, oauth_auth_url, oauth_token_url) VALUES
('facebook', 'Facebook', 'https://graph.facebook.com/v18.0', 'https://www.facebook.com/v18.0/dialog/oauth', 'https://graph.facebook.com/v18.0/oauth/access_token'),
('instagram', 'Instagram', 'https://graph.instagram.com', 'https://api.instagram.com/oauth/authorize', 'https://api.instagram.com/oauth/access_token'),
('twitter', 'Twitter/X', 'https://api.twitter.com/2', 'https://twitter.com/i/oauth2/authorize', 'https://api.twitter.com/2/oauth2/token'),
('linkedin', 'LinkedIn', 'https://api.linkedin.com/v2', 'https://www.linkedin.com/oauth/v2/authorization', 'https://www.linkedin.com/oauth/v2/accessToken'),
('youtube', 'YouTube', 'https://www.googleapis.com/youtube/v3', 'https://accounts.google.com/o/oauth2/v2/auth', 'https://oauth2.googleapis.com/token'),
('tiktok', 'TikTok', 'https://open.tiktokapis.com/v2', 'https://www.tiktok.com/auth/authorize', 'https://open.tiktokapis.com/v2/oauth/token/');

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

