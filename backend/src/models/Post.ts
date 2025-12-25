import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export interface SocialPost {
  id?: number;
  user_id: number;
  account_id: number;
  platform_post_id: string;
  platform_type: string;
  content?: string;
  content_type?: 'text' | 'image' | 'video' | 'carousel' | 'story' | 'reel' | 'other';
  media_urls?: string[];
  permalink?: string;
  published_at?: Date;
  created_at?: Date;
  updated_at?: Date;
  is_deleted?: boolean;
  metadata?: Record<string, any>;
  created_at_local?: Date;
  updated_at_local?: Date;
}

export interface PostEngagementMetrics {
  id?: number;
  post_id: number;
  likes_count?: number;
  comments_count?: number;
  shares_count?: number;
  saves_count?: number;
  views_count?: number;
  clicks_count?: number;
  impressions_count?: number;
  reach_count?: number;
  engagement_rate?: number;
  recorded_at?: Date;
}

export interface EngagementSnapshot {
  id?: number;
  post_id: number;
  likes_count?: number;
  comments_count?: number;
  shares_count?: number;
  saves_count?: number;
  views_count?: number;
  clicks_count?: number;
  impressions_count?: number;
  reach_count?: number;
  engagement_rate?: number;
  snapshot_date: Date;
  snapshot_time: Date;
  created_at?: Date;
}

export interface FollowerMetrics {
  id?: number;
  account_id: number;
  follower_count?: number;
  following_count?: number;
  posts_count?: number;
  recorded_at?: Date;
}

export interface FollowerSnapshot {
  id?: number;
  account_id: number;
  follower_count?: number;
  following_count?: number;
  posts_count?: number;
  snapshot_date: Date;
  snapshot_time: Date;
  created_at?: Date;
}

class PostModel {
  // Create or update a post
  async upsert(post: SocialPost): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO social_posts (
        user_id, account_id, platform_post_id, platform_type, content, content_type,
        media_urls, permalink, published_at, created_at, updated_at, is_deleted, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        platform_type = VALUES(platform_type),
        content = VALUES(content),
        content_type = VALUES(content_type),
        media_urls = VALUES(media_urls),
        permalink = VALUES(permalink),
        published_at = VALUES(published_at),
        created_at = VALUES(created_at),
        updated_at = VALUES(updated_at),
        is_deleted = VALUES(is_deleted),
        metadata = VALUES(metadata),
        updated_at_local = CURRENT_TIMESTAMP`,
      [
        post.user_id,
        post.account_id,
        post.platform_post_id,
        post.platform_type,
        post.content || null,
        post.content_type || 'text',
        post.media_urls ? JSON.stringify(post.media_urls) : null,
        post.permalink || null,
        post.published_at || null,
        post.created_at || null,
        post.updated_at || null,
        post.is_deleted || false,
        post.metadata ? JSON.stringify(post.metadata) : null,
      ]
    );
    return result.insertId;
  }

  // Get posts by account
  async findByAccount(accountId: number, limit: number = 100, offset: number = 0): Promise<SocialPost[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM social_posts 
       WHERE account_id = ? AND is_deleted = FALSE 
       ORDER BY published_at DESC 
       LIMIT ? OFFSET ?`,
      [accountId, limit, offset]
    );
    return rows as SocialPost[];
  }

  // Get posts by user
  async findByUser(userId: number, limit: number = 100, offset: number = 0): Promise<SocialPost[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM social_posts 
       WHERE user_id = ? AND is_deleted = FALSE 
       ORDER BY published_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );
    return rows as SocialPost[];
  }

  // Get post by platform post ID
  async findByPlatformPostId(accountId: number, platformPostId: string): Promise<SocialPost | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM social_posts WHERE account_id = ? AND platform_post_id = ?',
      [accountId, platformPostId]
    );
    return rows.length > 0 ? (rows[0] as SocialPost) : null;
  }
}

class EngagementMetricsModel {
  // Upsert engagement metrics for a post
  async upsert(metrics: PostEngagementMetrics): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO post_engagement_metrics (
        post_id, likes_count, comments_count, shares_count, saves_count,
        views_count, clicks_count, impressions_count, reach_count, engagement_rate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        likes_count = VALUES(likes_count),
        comments_count = VALUES(comments_count),
        shares_count = VALUES(shares_count),
        saves_count = VALUES(saves_count),
        views_count = VALUES(views_count),
        clicks_count = VALUES(clicks_count),
        impressions_count = VALUES(impressions_count),
        reach_count = VALUES(reach_count),
        engagement_rate = VALUES(engagement_rate),
        recorded_at = CURRENT_TIMESTAMP`,
      [
        metrics.post_id,
        metrics.likes_count || 0,
        metrics.comments_count || 0,
        metrics.shares_count || 0,
        metrics.saves_count || 0,
        metrics.views_count || 0,
        metrics.clicks_count || 0,
        metrics.impressions_count || 0,
        metrics.reach_count || 0,
        metrics.engagement_rate || 0,
      ]
    );
    return result.insertId;
  }

  // Create historical snapshot
  async createSnapshot(snapshot: EngagementSnapshot): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO engagement_snapshots (
        post_id, likes_count, comments_count, shares_count, saves_count,
        views_count, clicks_count, impressions_count, reach_count, engagement_rate,
        snapshot_date, snapshot_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE(?), TIME(?))`,
      [
        snapshot.post_id,
        snapshot.likes_count || 0,
        snapshot.comments_count || 0,
        snapshot.shares_count || 0,
        snapshot.saves_count || 0,
        snapshot.views_count || 0,
        snapshot.clicks_count || 0,
        snapshot.impressions_count || 0,
        snapshot.reach_count || 0,
        snapshot.engagement_rate || 0,
        snapshot.snapshot_date,
        snapshot.snapshot_time,
      ]
    );
    return result.insertId;
  }

  // Get metrics for a post
  async findByPostId(postId: number): Promise<PostEngagementMetrics | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM post_engagement_metrics WHERE post_id = ?',
      [postId]
    );
    return rows.length > 0 ? (rows[0] as PostEngagementMetrics) : null;
  }
}

class FollowerMetricsModel {
  // Upsert follower metrics
  async upsert(metrics: FollowerMetrics): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO follower_metrics (
        account_id, follower_count, following_count, posts_count
      ) VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        follower_count = VALUES(follower_count),
        following_count = VALUES(following_count),
        posts_count = VALUES(posts_count),
        recorded_at = CURRENT_TIMESTAMP`,
      [
        metrics.account_id,
        metrics.follower_count || 0,
        metrics.following_count || 0,
        metrics.posts_count || 0,
      ]
    );
    return result.insertId;
  }

  // Create historical snapshot
  // Uses INSERT ... ON DUPLICATE KEY UPDATE to update if snapshot for same account/date/time exists
  async createSnapshot(snapshot: FollowerSnapshot): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO follower_snapshots (
        account_id, follower_count, following_count, posts_count,
        snapshot_date, snapshot_time
      ) VALUES (?, ?, ?, ?, DATE(?), TIME(?))
      ON DUPLICATE KEY UPDATE
        follower_count = VALUES(follower_count),
        following_count = VALUES(following_count),
        posts_count = VALUES(posts_count),
        snapshot_time = VALUES(snapshot_time)`,
      [
        snapshot.account_id,
        snapshot.follower_count || 0,
        snapshot.following_count || 0,
        snapshot.posts_count || 0,
        snapshot.snapshot_date,
        snapshot.snapshot_time,
      ]
    );
    return result.insertId || result.affectedRows > 0 ? 1 : 0;
  }

  // Get current metrics for an account
  async findByAccountId(accountId: number): Promise<FollowerMetrics | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM follower_metrics WHERE account_id = ? ORDER BY recorded_at DESC LIMIT 1',
      [accountId]
    );
    return rows.length > 0 ? (rows[0] as FollowerMetrics) : null;
  }
}

export const postModel = new PostModel();
export const engagementMetricsModel = new EngagementMetricsModel();
export const followerMetricsModel = new FollowerMetricsModel();

