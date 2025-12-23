import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export interface Notification {
  id?: number;
  user_id: number;
  type: 'content_reminder' | 'campaign_reminder' | 'content_due' | 'campaign_start' | 'campaign_end' | 'system';
  title: string;
  message: string;
  entity_type?: 'content' | 'campaign';
  entity_id?: number;
  is_read: boolean;
  reminder_date?: Date;
  created_at?: Date;
  read_at?: Date;
}

class NotificationModel {
  async create(notification: Notification): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO notifications (
        user_id, type, title, message, entity_type, entity_id, 
        is_read, reminder_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        notification.user_id,
        notification.type,
        notification.title,
        notification.message,
        notification.entity_type || null,
        notification.entity_id || null,
        notification.is_read || false,
        notification.reminder_date || null,
      ]
    );
    return result.insertId;
  }

  async findById(id: number, userId: number): Promise<Notification | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (rows.length === 0) return null;
    return this.mapRowToNotification(rows[0]);
  }

  async findByUser(
    userId: number,
    options: {
      unreadOnly?: boolean;
      type?: Notification['type'];
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<Notification[]> {
    let query = 'SELECT * FROM notifications WHERE user_id = ?';
    const params: any[] = [userId];

    if (options.unreadOnly) {
      query += ' AND is_read = FALSE';
    }

    if (options.type) {
      query += ' AND type = ?';
      params.push(options.type);
    }

    query += ' ORDER BY created_at DESC';

    if (options.limit) {
      const limitInt = parseInt(String(options.limit), 10) || 50;
      const offsetInt = parseInt(String(options.offset || 0), 10) || 0;
      query += ` LIMIT ${limitInt} OFFSET ${offsetInt}`;
    }

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows.map(row => this.mapRowToNotification(row));
  }

  async getUnreadCount(userId: number): Promise<number> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    return rows[0]?.count || 0;
  }

  async markAsRead(id: number, userId: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  }

  async markAllAsRead(userId: number): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    return result.affectedRows;
  }

  async delete(id: number, userId: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  }

  async deleteByEntity(entityType: 'content' | 'campaign', entityId: number): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM notifications WHERE entity_type = ? AND entity_id = ?',
      [entityType, entityId]
    );
    return result.affectedRows;
  }

  async findUpcomingReminders(daysAhead: number = 7): Promise<Notification[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM notifications 
       WHERE reminder_date IS NOT NULL 
       AND reminder_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
       AND reminder_date >= CURDATE()
       AND is_read = FALSE
       ORDER BY reminder_date ASC`,
      [daysAhead]
    );
    return rows.map(row => this.mapRowToNotification(row));
  }

  private mapRowToNotification(row: RowDataPacket): Notification {
    return {
      id: row.id,
      user_id: row.user_id,
      type: row.type,
      title: row.title,
      message: row.message,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      is_read: row.is_read === 1 || row.is_read === true,
      reminder_date: row.reminder_date,
      created_at: row.created_at,
      read_at: row.read_at,
    };
  }
}

export const notificationModel = new NotificationModel();

