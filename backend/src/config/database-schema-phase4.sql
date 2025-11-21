-- Phase 4: Data Collection & Storage Schema
-- Add this to the existing database

USE social_media_analytics;

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
    window_start TIMESTAMP NOT NULL,
    window_end TIMESTAMP NOT NULL,
    reset_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES user_social_accounts(id) ON DELETE CASCADE,
    INDEX idx_account_platform (account_id, platform_type),
    INDEX idx_reset_at (reset_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

