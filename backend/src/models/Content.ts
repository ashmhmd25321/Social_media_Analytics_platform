import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export interface ContentDraft {
  id?: number;
  user_id: number;
  title?: string;
  content: string;
  content_type?: 'text' | 'image' | 'video' | 'carousel' | 'story' | 'reel' | 'other';
  media_urls?: string[];
  hashtags?: string[];
  mentions?: string[];
  target_platforms?: number[];
  status?: 'draft' | 'scheduled' | 'published' | 'archived';
  scheduled_at?: Date;
  published_at?: Date;
  reminder_days_before?: number;
  created_at?: Date;
  updated_at?: Date;
  metadata?: Record<string, any>;
}

export interface ScheduledPost {
  id?: number;
  user_id: number;
  draft_id?: number;
  account_id: number;
  platform_type: string;
  content: string;
  content_type?: 'text' | 'image' | 'video' | 'carousel' | 'story' | 'reel' | 'other';
  media_urls?: string[];
  scheduled_at: Date;
  timezone?: string;
  status?: 'pending' | 'processing' | 'published' | 'failed' | 'cancelled';
  published_at?: Date;
  platform_post_id?: string;
  error_message?: string;
  retry_count?: number;
  created_at?: Date;
  updated_at?: Date;
  metadata?: Record<string, any>;
}

export interface ContentTemplate {
  id?: number;
  user_id: number;
  name: string;
  description?: string;
  content: string;
  content_type?: 'text' | 'image' | 'video' | 'carousel' | 'story' | 'reel' | 'other';
  media_urls?: string[];
  hashtags?: string[];
  target_platforms?: number[];
  is_public?: boolean;
  usage_count?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface ContentCategory {
  id?: number;
  user_id: number;
  name: string;
  color?: string;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
}

class ContentDraftModel {
  async create(draft: ContentDraft): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO content_drafts (
        user_id, title, content, content_type, media_urls, hashtags, mentions,
        target_platforms, status, scheduled_at, published_at, reminder_days_before, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        draft.user_id,
        draft.title || null,
        draft.content,
        draft.content_type || 'text',
        draft.media_urls ? JSON.stringify(draft.media_urls) : null,
        draft.hashtags ? JSON.stringify(draft.hashtags) : null,
        draft.mentions ? JSON.stringify(draft.mentions) : null,
        draft.target_platforms ? JSON.stringify(draft.target_platforms) : null,
        draft.status || 'draft',
        draft.scheduled_at || null,
        draft.published_at || null,
        draft.reminder_days_before || null,
        draft.metadata ? JSON.stringify(draft.metadata) : null,
      ]
    );
    return result.insertId;
  }

  async findById(id: number, userId: number): Promise<ContentDraft | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM content_drafts WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (rows.length === 0) return null;
    return this.mapRowToDraft(rows[0]);
  }

  async findByUser(userId: number, status?: string, limit: number = 50, offset: number = 0): Promise<ContentDraft[]> {
    try {
      let query = 'SELECT * FROM content_drafts WHERE user_id = ?';
      const params: any[] = [userId];
      
      if (status && status.trim() !== '') {
        query += ' AND status = ?';
        params.push(status);
      }
      
      // MySQL doesn't accept LIMIT/OFFSET as prepared statement parameters in some versions
      // Convert to integers and use template literals
      const limitInt = parseInt(String(limit), 10) || 50;
      const offsetInt = parseInt(String(offset), 10) || 0;
      query += ` ORDER BY created_at DESC LIMIT ${limitInt} OFFSET ${offsetInt}`;
      
      const [rows] = await pool.execute<RowDataPacket[]>(query, params);
      return rows.map(row => this.mapRowToDraft(row));
    } catch (error: any) {
      // Check if table doesn't exist
      if (error.code === 'ER_NO_SUCH_TABLE' || error.message?.includes("doesn't exist")) {
        throw new Error('Content tables not found. Please run Phase 6 database migration: mysql -u root -p social_media_analytics < backend/src/config/database-schema-phase6.sql');
      }
      throw error;
    }
  }

  async update(id: number, userId: number, updates: Partial<ContentDraft>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'id' || key === 'user_id') return;
      
      if (key === 'media_urls' || key === 'hashtags' || key === 'mentions' || key === 'target_platforms' || key === 'metadata') {
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
      `UPDATE content_drafts SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  async delete(id: number, userId: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM content_drafts WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  }

  private mapRowToDraft(row: RowDataPacket): ContentDraft {
    const parseJson = (value: any): any => {
      if (!value) return [];
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch {
          return [];
        }
      }
      return Array.isArray(value) ? value : [];
    };

    return {
      id: row.id,
      user_id: row.user_id,
      title: row.title,
      content: row.content,
      content_type: row.content_type,
      media_urls: parseJson(row.media_urls),
      hashtags: parseJson(row.hashtags),
      mentions: parseJson(row.mentions),
      target_platforms: parseJson(row.target_platforms),
      status: row.status,
      scheduled_at: row.scheduled_at,
      published_at: row.published_at,
      reminder_days_before: row.reminder_days_before,
      created_at: row.created_at,
      updated_at: row.updated_at,
      metadata: row.metadata ? (typeof row.metadata === 'string' ? (() => {
        try {
          return JSON.parse(row.metadata);
        } catch {
          return {};
        }
      })() : row.metadata) : {},
    };
  }
}

class ScheduledPostModel {
  async create(post: ScheduledPost): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO scheduled_posts (
        user_id, draft_id, account_id, platform_type, content, content_type,
        media_urls, scheduled_at, timezone, status, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        post.user_id,
        post.draft_id || null,
        post.account_id,
        post.platform_type,
        post.content,
        post.content_type || 'text',
        post.media_urls ? JSON.stringify(post.media_urls) : null,
        post.scheduled_at,
        post.timezone || 'UTC',
        post.status || 'pending',
        post.metadata ? JSON.stringify(post.metadata) : null,
      ]
    );
    return result.insertId;
  }

  async findById(id: number, userId: number): Promise<ScheduledPost | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM scheduled_posts WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (rows.length === 0) return null;
    return this.mapRowToPost(rows[0]);
  }

  async findByUser(userId: number, status?: string, limit: number = 50, offset: number = 0): Promise<ScheduledPost[]> {
    try {
      let query = 'SELECT * FROM scheduled_posts WHERE user_id = ?';
      const params: any[] = [userId];
      
      if (status && status.trim() !== '') {
        query += ' AND status = ?';
        params.push(status);
      }
      
      // MySQL doesn't accept LIMIT/OFFSET as prepared statement parameters in some versions
      // Convert to integers and use template literals
      const limitInt = parseInt(String(limit), 10) || 50;
      const offsetInt = parseInt(String(offset), 10) || 0;
      query += ` ORDER BY scheduled_at ASC LIMIT ${limitInt} OFFSET ${offsetInt}`;
      
      const [rows] = await pool.execute<RowDataPacket[]>(query, params);
      return rows.map(row => this.mapRowToPost(row));
    } catch (error: any) {
      // Check if table doesn't exist
      if (error.code === 'ER_NO_SUCH_TABLE' || error.message?.includes("doesn't exist")) {
        throw new Error('Content tables not found. Please run Phase 6 database migration: mysql -u root -p social_media_analytics < backend/src/config/database-schema-phase6.sql');
      }
      throw error;
    }
  }

  async findPending(limit: number = 100): Promise<ScheduledPost[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM scheduled_posts 
       WHERE status = 'pending' 
       AND scheduled_at <= NOW() 
       ORDER BY scheduled_at ASC 
       LIMIT ?`,
      [limit]
    );
    return rows.map(row => this.mapRowToPost(row));
  }

  async updateStatus(id: number, status: string, platformPostId?: string, errorMessage?: string): Promise<boolean> {
    const updates: string[] = ['status = ?'];
    const values: any[] = [status];
    
    if (platformPostId) {
      updates.push('platform_post_id = ?', 'published_at = NOW()');
      values.push(platformPostId);
    }
    
    if (errorMessage) {
      updates.push('error_message = ?');
      values.push(errorMessage);
    }
    
    values.push(id);
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE scheduled_posts SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  async incrementRetry(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE scheduled_posts SET retry_count = retry_count + 1, updated_at = NOW() WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  async delete(id: number, userId: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE scheduled_posts SET status = "cancelled" WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  }

  private mapRowToPost(row: RowDataPacket): ScheduledPost {
    const parseJson = (value: any): any => {
      if (!value) return [];
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch {
          return [];
        }
      }
      return Array.isArray(value) ? value : [];
    };

    const parseJsonObject = (value: any): any => {
      if (!value) return {};
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch {
          return {};
        }
      }
      return typeof value === 'object' ? value : {};
    };

    return {
      id: row.id,
      user_id: row.user_id,
      draft_id: row.draft_id,
      account_id: row.account_id,
      platform_type: row.platform_type,
      content: row.content,
      content_type: row.content_type,
      media_urls: parseJson(row.media_urls),
      scheduled_at: row.scheduled_at,
      timezone: row.timezone,
      status: row.status,
      published_at: row.published_at,
      platform_post_id: row.platform_post_id,
      error_message: row.error_message,
      retry_count: row.retry_count,
      created_at: row.created_at,
      updated_at: row.updated_at,
      metadata: parseJsonObject(row.metadata),
    };
  }
}

class ContentTemplateModel {
  async create(template: ContentTemplate): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO content_templates (
        user_id, name, description, content, content_type, media_urls,
        hashtags, target_platforms, is_public
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        template.user_id,
        template.name,
        template.description || null,
        template.content,
        template.content_type || 'text',
        template.media_urls ? JSON.stringify(template.media_urls) : null,
        template.hashtags ? JSON.stringify(template.hashtags) : null,
        template.target_platforms ? JSON.stringify(template.target_platforms) : null,
        template.is_public || false,
      ]
    );
    return result.insertId;
  }

  async findByUser(userId: number, includePublic: boolean = true): Promise<ContentTemplate[]> {
    let query = 'SELECT * FROM content_templates WHERE user_id = ?';
    const params: any[] = [userId];
    
    if (includePublic) {
      query += ' OR is_public = TRUE';
    }
    
    query += ' ORDER BY usage_count DESC, created_at DESC';
    
    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows.map(row => this.mapRowToTemplate(row));
  }

  async incrementUsage(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE content_templates SET usage_count = usage_count + 1 WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  private mapRowToTemplate(row: RowDataPacket): ContentTemplate {
    return {
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      description: row.description,
      content: row.content,
      content_type: row.content_type,
      media_urls: row.media_urls ? JSON.parse(row.media_urls) : [],
      hashtags: row.hashtags ? JSON.parse(row.hashtags) : [],
      target_platforms: row.target_platforms ? JSON.parse(row.target_platforms) : [],
      is_public: row.is_public,
      usage_count: row.usage_count,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

export const contentDraftModel = new ContentDraftModel();
export const scheduledPostModel = new ScheduledPostModel();
export const contentTemplateModel = new ContentTemplateModel();

