-- Phase 6: Content Management & Scheduling Schema
-- Add this to the existing database

USE social_media_analytics;

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
    target_platforms JSON, -- Array of platform IDs
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
    draft_id INT NULL, -- Reference to content_drafts if created from draft
    account_id INT NOT NULL, -- Target social media account
    platform_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    content_type ENUM('text', 'image', 'video', 'carousel', 'story', 'reel', 'other') DEFAULT 'text',
    media_urls JSON,
    scheduled_at TIMESTAMP NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    status ENUM('pending', 'processing', 'published', 'failed', 'cancelled') DEFAULT 'pending',
    published_at TIMESTAMP NULL,
    platform_post_id VARCHAR(255) NULL, -- Set when published
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
    is_public BOOLEAN DEFAULT FALSE, -- Public templates available to all users
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
    color VARCHAR(7) DEFAULT '#6366f1', -- Hex color for UI
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

