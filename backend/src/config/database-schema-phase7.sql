-- Phase 7: Reporting & Insights Database Schema

-- Report templates table: Reusable report templates (must be created first)
CREATE TABLE IF NOT EXISTS report_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL, -- NULL for system templates
  name VARCHAR(255) NOT NULL,
  description TEXT,
  report_type ENUM('overview', 'audience', 'content', 'engagement', 'custom') NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  is_system BOOLEAN DEFAULT FALSE, -- System-provided templates
  config JSON NOT NULL, -- Report configuration (sections, metrics, charts)
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
  section_type VARCHAR(100) NOT NULL, -- 'metrics', 'chart', 'table', 'text'
  title VARCHAR(255) NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  config JSON NOT NULL, -- Section-specific configuration
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
  metric_type VARCHAR(100) NOT NULL, -- 'followers', 'engagement_rate', 'likes', etc.
  platform_id INT NULL, -- NULL for all platforms
  account_id INT NULL, -- NULL for all accounts
  is_active BOOLEAN DEFAULT TRUE,
  notification_channels JSON NOT NULL, -- ['email', 'in_app', 'webhook']
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
  context JSON NULL, -- Additional context about the trigger
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
  type VARCHAR(100) NOT NULL, -- 'alert', 'report', 'system', 'account'
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
  category VARCHAR(100) NOT NULL, -- 'posting_time', 'content_type', 'engagement', etc.
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  actionable BOOLEAN DEFAULT TRUE,
  action_url VARCHAR(500) NULL,
  related_metrics JSON NULL,
  confidence_score DECIMAL(3, 2) DEFAULT 0.5, -- 0.0 to 1.0
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
  schedule_config JSON NOT NULL, -- Cron expression or schedule details
  recipients JSON NOT NULL, -- Email addresses or user IDs
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

