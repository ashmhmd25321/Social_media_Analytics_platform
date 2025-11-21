-- NLP & Sentiment Analysis Schema Additions
-- Add sentiment analysis fields to existing tables

USE social_media_analytics;

-- Add sentiment analysis columns to social_posts table
ALTER TABLE social_posts
ADD COLUMN IF NOT EXISTS sentiment_score DECIMAL(5, 2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sentiment_comparative DECIMAL(5, 2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sentiment_classification ENUM('positive', 'neutral', 'negative') DEFAULT NULL,
ADD COLUMN IF NOT EXISTS extracted_keywords JSON DEFAULT NULL,
ADD COLUMN IF NOT EXISTS extracted_hashtags JSON DEFAULT NULL,
ADD COLUMN IF NOT EXISTS extracted_mentions JSON DEFAULT NULL,
ADD COLUMN IF NOT EXISTS content_type_detected VARCHAR(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS language_detected VARCHAR(10) DEFAULT 'en',
ADD INDEX idx_sentiment_classification (sentiment_classification),
ADD INDEX idx_sentiment_score (sentiment_score);

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

