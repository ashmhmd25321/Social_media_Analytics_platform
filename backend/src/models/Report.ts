import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export interface Report {
  id?: number;
  user_id: number;
  title: string;
  description?: string;
  report_type: 'overview' | 'audience' | 'content' | 'engagement' | 'custom';
  template_id?: number;
  date_range_start: Date;
  date_range_end: Date;
  timezone?: string;
  format: 'pdf' | 'excel' | 'html';
  status: 'draft' | 'generating' | 'completed' | 'failed';
  file_path?: string;
  file_size?: number;
  metadata?: Record<string, any>;
  scheduled_at?: Date;
  generated_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface ReportTemplate {
  id?: number;
  user_id?: number;
  name: string;
  description?: string;
  report_type: 'overview' | 'audience' | 'content' | 'engagement' | 'custom';
  is_public?: boolean;
  is_system?: boolean;
  config: Record<string, any>;
  usage_count?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface ReportSection {
  id?: number;
  report_id: number;
  section_type: string;
  title: string;
  order_index: number;
  config: Record<string, any>;
  created_at?: Date;
}

export interface Alert {
  id?: number;
  user_id: number;
  name: string;
  description?: string;
  alert_type: 'follower_milestone' | 'engagement_drop' | 'engagement_spike' | 'new_post' | 'custom';
  condition_type: 'greater_than' | 'less_than' | 'equals' | 'percentage_change';
  threshold_value: number;
  metric_type: string;
  platform_id?: number;
  account_id?: number;
  is_active?: boolean;
  notification_channels: string[];
  last_triggered_at?: Date;
  trigger_count?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface Notification {
  id?: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  icon?: string;
  link?: string;
  is_read?: boolean;
  metadata?: Record<string, any>;
  created_at?: Date;
  read_at?: Date;
}

export interface Insight {
  id?: number;
  user_id: number;
  insight_type: 'performance' | 'recommendation' | 'trend' | 'opportunity';
  category: string;
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  actionable?: boolean;
  action_url?: string;
  related_metrics?: Record<string, any>;
  confidence_score?: number;
  is_dismissed?: boolean;
  dismissed_at?: Date;
  created_at?: Date;
  expires_at?: Date;
}

class ReportModel {
  async create(report: Report): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO reports (
        user_id, title, description, report_type, template_id,
        date_range_start, date_range_end, timezone, format, status,
        file_path, file_size, metadata, scheduled_at, generated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        report.user_id,
        report.title,
        report.description || null,
        report.report_type,
        report.template_id || null,
        report.date_range_start,
        report.date_range_end,
        report.timezone || 'UTC',
        report.format,
        report.status || 'draft',
        report.file_path || null,
        report.file_size || null,
        report.metadata ? JSON.stringify(report.metadata) : null,
        report.scheduled_at || null,
        report.generated_at || null,
      ]
    );
    return result.insertId;
  }

  async findById(id: number, userId: number): Promise<Report | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM reports WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (rows.length === 0) return null;
    return this.mapRowToReport(rows[0]);
  }

  async findByUser(userId: number, status?: string, limit: number = 50, offset: number = 0): Promise<Report[]> {
    let query = 'SELECT * FROM reports WHERE user_id = ?';
    const params: any[] = [userId];
    
    if (status && status.trim() !== '') {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows.map(row => this.mapRowToReport(row));
  }

  async update(id: number, userId: number, updates: Partial<Report>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'id' || key === 'user_id') return;
      
      if (key === 'metadata') {
        fields.push(`${key} = ?`);
        values.push(value ? JSON.stringify(value) : null);
      } else {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return false;

    values.push(id, userId);
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE reports SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ? AND user_id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  async delete(id: number, userId: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM reports WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  }

  private mapRowToReport(row: RowDataPacket): Report {
    return {
      id: row.id,
      user_id: row.user_id,
      title: row.title,
      description: row.description,
      report_type: row.report_type,
      template_id: row.template_id,
      date_range_start: row.date_range_start,
      date_range_end: row.date_range_end,
      timezone: row.timezone,
      format: row.format,
      status: row.status,
      file_path: row.file_path,
      file_size: row.file_size,
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : {},
      scheduled_at: row.scheduled_at,
      generated_at: row.generated_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

class ReportTemplateModel {
  async create(template: ReportTemplate): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO report_templates (
        user_id, name, description, report_type, is_public, is_system, config
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        template.user_id || null,
        template.name,
        template.description || null,
        template.report_type,
        template.is_public || false,
        template.is_system || false,
        JSON.stringify(template.config),
      ]
    );
    return result.insertId;
  }

  async findById(id: number): Promise<ReportTemplate | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM report_templates WHERE id = ?',
      [id]
    );
    if (rows.length === 0) return null;
    return this.mapRowToTemplate(rows[0]);
  }

  async findByUser(userId: number, includePublic: boolean = true): Promise<ReportTemplate[]> {
    let query = 'SELECT * FROM report_templates WHERE (user_id = ? OR (is_public = TRUE AND is_system = FALSE))';
    const params: any[] = [userId];
    
    if (includePublic) {
      query += ' OR is_system = TRUE';
    }
    
    query += ' ORDER BY is_system DESC, usage_count DESC, created_at DESC';
    
    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows.map(row => this.mapRowToTemplate(row));
  }

  async incrementUsage(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE report_templates SET usage_count = usage_count + 1 WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  private mapRowToTemplate(row: RowDataPacket): ReportTemplate {
    return {
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      description: row.description,
      report_type: row.report_type,
      is_public: row.is_public,
      is_system: row.is_system,
      config: row.config ? (typeof row.config === 'string' ? JSON.parse(row.config) : row.config) : {},
      usage_count: row.usage_count,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

class AlertModel {
  async create(alert: Alert): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO alerts (
        user_id, name, description, alert_type, condition_type, threshold_value,
        metric_type, platform_id, account_id, is_active, notification_channels
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        alert.user_id,
        alert.name,
        alert.description || null,
        alert.alert_type,
        alert.condition_type,
        alert.threshold_value,
        alert.metric_type,
        alert.platform_id || null,
        alert.account_id || null,
        alert.is_active !== undefined ? alert.is_active : true,
        JSON.stringify(alert.notification_channels),
      ]
    );
    return result.insertId;
  }

  async findById(id: number, userId: number): Promise<Alert | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM alerts WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (rows.length === 0) return null;
    return this.mapRowToAlert(rows[0]);
  }

  async findByUser(userId: number, isActive?: boolean): Promise<Alert[]> {
    let query = 'SELECT * FROM alerts WHERE user_id = ?';
    const params: any[] = [userId];
    
    if (isActive !== undefined) {
      query += ' AND is_active = ?';
      params.push(isActive);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows.map(row => this.mapRowToAlert(row));
  }

  async update(id: number, userId: number, updates: Partial<Alert>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'id' || key === 'user_id') return;
      
      if (key === 'notification_channels') {
        fields.push(`${key} = ?`);
        values.push(JSON.stringify(value));
      } else {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return false;

    values.push(id, userId);
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE alerts SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ? AND user_id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  async delete(id: number, userId: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM alerts WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  }

  private mapRowToAlert(row: RowDataPacket): Alert {
    return {
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      description: row.description,
      alert_type: row.alert_type,
      condition_type: row.condition_type,
      threshold_value: row.threshold_value,
      metric_type: row.metric_type,
      platform_id: row.platform_id,
      account_id: row.account_id,
      is_active: row.is_active,
      notification_channels: row.notification_channels ? (typeof row.notification_channels === 'string' ? JSON.parse(row.notification_channels) : row.notification_channels) : [],
      last_triggered_at: row.last_triggered_at,
      trigger_count: row.trigger_count,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

class NotificationModel {
  async create(notification: Notification): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO notifications (
        user_id, type, title, message, icon, link, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        notification.user_id,
        notification.type,
        notification.title,
        notification.message,
        notification.icon || null,
        notification.link || null,
        notification.metadata ? JSON.stringify(notification.metadata) : null,
      ]
    );
    return result.insertId;
  }

  async findByUser(userId: number, isRead?: boolean, limit: number = 50): Promise<Notification[]> {
    let query = 'SELECT * FROM notifications WHERE user_id = ?';
    const params: any[] = [userId];
    
    if (isRead !== undefined) {
      query += ' AND is_read = ?';
      params.push(isRead);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);
    
    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows.map(row => this.mapRowToNotification(row));
  }

  async markAsRead(id: number, userId: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  }

  async markAllAsRead(userId: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    return result.affectedRows > 0;
  }

  async getUnreadCount(userId: number): Promise<number> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    return rows[0]?.count || 0;
  }

  private mapRowToNotification(row: RowDataPacket): Notification {
    return {
      id: row.id,
      user_id: row.user_id,
      type: row.type,
      title: row.title,
      message: row.message,
      icon: row.icon,
      link: row.link,
      is_read: row.is_read,
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : {},
      created_at: row.created_at,
      read_at: row.read_at,
    };
  }
}

class InsightModel {
  async create(insight: Insight): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO insights (
        user_id, insight_type, category, title, description, priority,
        actionable, action_url, related_metrics, confidence_score, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        insight.user_id,
        insight.insight_type,
        insight.category,
        insight.title,
        insight.description,
        insight.priority || 'medium',
        insight.actionable !== undefined ? insight.actionable : true,
        insight.action_url || null,
        insight.related_metrics ? JSON.stringify(insight.related_metrics) : null,
        insight.confidence_score || 0.5,
        insight.expires_at || null,
      ]
    );
    return result.insertId;
  }

  async findByUser(userId: number, isDismissed?: boolean, limit: number = 50): Promise<Insight[]> {
    let query = 'SELECT * FROM insights WHERE user_id = ?';
    const params: any[] = [userId];
    
    if (isDismissed !== undefined) {
      query += ' AND is_dismissed = ?';
      params.push(isDismissed);
    } else {
      query += ' AND is_dismissed = FALSE';
    }
    
    query += ' AND (expires_at IS NULL OR expires_at > NOW())';
    query += ' ORDER BY priority DESC, confidence_score DESC, created_at DESC LIMIT ?';
    params.push(limit);
    
    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows.map(row => this.mapRowToInsight(row));
  }

  async dismiss(id: number, userId: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE insights SET is_dismissed = TRUE, dismissed_at = NOW() WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  }

  private mapRowToInsight(row: RowDataPacket): Insight {
    return {
      id: row.id,
      user_id: row.user_id,
      insight_type: row.insight_type,
      category: row.category,
      title: row.title,
      description: row.description,
      priority: row.priority,
      actionable: row.actionable,
      action_url: row.action_url,
      related_metrics: row.related_metrics ? (typeof row.related_metrics === 'string' ? JSON.parse(row.related_metrics) : row.related_metrics) : {},
      confidence_score: row.confidence_score,
      is_dismissed: row.is_dismissed,
      dismissed_at: row.dismissed_at,
      created_at: row.created_at,
      expires_at: row.expires_at,
    };
  }
}

export interface ScheduledReport {
  id?: number;
  user_id: number;
  report_template_id: number;
  schedule_type: 'daily' | 'weekly' | 'monthly' | 'custom';
  schedule_config: Record<string, any>;
  recipients: string[]; // Email addresses
  format: 'pdf' | 'excel' | 'html';
  is_active: boolean;
  last_generated_at?: Date;
  next_generation_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

class ScheduledReportModel {
  async create(scheduledReport: ScheduledReport): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO scheduled_reports (
        user_id, report_template_id, schedule_type, schedule_config, recipients, format, is_active, next_generation_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        scheduledReport.user_id,
        scheduledReport.report_template_id,
        scheduledReport.schedule_type,
        JSON.stringify(scheduledReport.schedule_config),
        JSON.stringify(scheduledReport.recipients),
        scheduledReport.format,
        scheduledReport.is_active !== undefined ? scheduledReport.is_active : true,
        scheduledReport.next_generation_at || null,
      ]
    );
    return result.insertId;
  }

  async findById(id: number, userId: number): Promise<ScheduledReport | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM scheduled_reports WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (rows.length === 0) return null;
    return this.mapRowToScheduledReport(rows[0]);
  }

  async findByUser(userId: number, isActive?: boolean): Promise<ScheduledReport[]> {
    let query = 'SELECT * FROM scheduled_reports WHERE user_id = ?';
    const params: any[] = [userId];
    
    if (isActive !== undefined) {
      query += ' AND is_active = ?';
      params.push(isActive);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows.map(row => this.mapRowToScheduledReport(row));
  }

  async findDueReports(): Promise<ScheduledReport[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM scheduled_reports 
       WHERE is_active = TRUE 
       AND next_generation_at <= NOW() 
       ORDER BY next_generation_at ASC`
    );
    return rows.map(row => this.mapRowToScheduledReport(row));
  }

  async update(id: number, userId: number, updates: Partial<ScheduledReport>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.schedule_type !== undefined) {
      fields.push('schedule_type = ?');
      values.push(updates.schedule_type);
    }
    if (updates.schedule_config !== undefined) {
      fields.push('schedule_config = ?');
      values.push(JSON.stringify(updates.schedule_config));
    }
    if (updates.recipients !== undefined) {
      fields.push('recipients = ?');
      values.push(JSON.stringify(updates.recipients));
    }
    if (updates.format !== undefined) {
      fields.push('format = ?');
      values.push(updates.format);
    }
    if (updates.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(updates.is_active);
    }
    if (updates.last_generated_at !== undefined) {
      fields.push('last_generated_at = ?');
      values.push(updates.last_generated_at);
    }
    if (updates.next_generation_at !== undefined) {
      fields.push('next_generation_at = ?');
      values.push(updates.next_generation_at);
    }

    if (fields.length === 0) return false;

    values.push(id, userId);
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE scheduled_reports SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ? AND user_id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  async delete(id: number, userId: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM scheduled_reports WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  }

  private mapRowToScheduledReport(row: RowDataPacket): ScheduledReport {
    return {
      id: row.id,
      user_id: row.user_id,
      report_template_id: row.report_template_id,
      schedule_type: row.schedule_type,
      schedule_config: row.schedule_config ? (typeof row.schedule_config === 'string' ? JSON.parse(row.schedule_config) : row.schedule_config) : {},
      recipients: row.recipients ? (typeof row.recipients === 'string' ? JSON.parse(row.recipients) : row.recipients) : [],
      format: row.format,
      is_active: row.is_active,
      last_generated_at: row.last_generated_at,
      next_generation_at: row.next_generation_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

export const reportModel = new ReportModel();
export const reportTemplateModel = new ReportTemplateModel();
export const alertModel = new AlertModel();
export const notificationModel = new NotificationModel();
export const insightModel = new InsightModel();
export const scheduledReportModel = new ScheduledReportModel();

