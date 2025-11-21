import { pool } from '../config/database';
import { RowDataPacket } from 'mysql2/promise';
import { UserSocialAccountModelInstance } from '../models/SocialPlatform';

export interface OverviewMetrics {
  totalFollowers: number;
  totalPosts: number;
  totalEngagement: number;
  averageEngagementRate: number;
  connectedPlatforms: number;
  growthRate: number;
}

export interface FollowerTrend {
  date: string;
  followers: number;
  platform: string;
}

export interface EngagementTrend {
  date: string;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
}

export interface TopPost {
  id: number;
  content: string;
  platform: string;
  published_at: Date;
  likes: number;
  comments: number;
  shares: number;
  engagement_rate: number;
  permalink?: string;
}

export interface PlatformComparison {
  platform: string;
  followers: number;
  posts: number;
  engagement: number;
  engagementRate: number;
}

class AnalyticsService {
  /**
   * Get overview metrics for a user
   */
  async getOverviewMetrics(userId: number): Promise<OverviewMetrics> {
    // Get all user's connected accounts
    const accounts = await UserSocialAccountModelInstance.findByUserId(userId);
    const accountIds = accounts.map(acc => acc.id!);

    if (accountIds.length === 0) {
      return {
        totalFollowers: 0,
        totalPosts: 0,
        totalEngagement: 0,
        averageEngagementRate: 0,
        connectedPlatforms: 0,
        growthRate: 0,
      };
    }

    // Get total followers
    const [followerRows] = await pool.execute<RowDataPacket[]>(
      `SELECT SUM(fm.follower_count) as total_followers
       FROM follower_metrics fm
       WHERE fm.account_id IN (${accountIds.map(() => '?').join(',')})
       AND fm.recorded_at = (
         SELECT MAX(recorded_at) 
         FROM follower_metrics fm2 
         WHERE fm2.account_id = fm.account_id
       )`,
      accountIds
    );
    const totalFollowers = followerRows[0]?.total_followers || 0;

    // Get total posts
    const [postRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total_posts
       FROM social_posts
       WHERE user_id = ? AND is_deleted = FALSE`,
      [userId]
    );
    const totalPosts = postRows[0]?.total_posts || 0;

    // Get total engagement (likes + comments + shares)
    const [engagementRows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
         SUM(pem.likes_count) as total_likes,
         SUM(pem.comments_count) as total_comments,
         SUM(pem.shares_count) as total_shares,
         AVG(pem.engagement_rate) as avg_engagement_rate
       FROM post_engagement_metrics pem
       INNER JOIN social_posts sp ON pem.post_id = sp.id
       WHERE sp.user_id = ? AND sp.is_deleted = FALSE`,
      [userId]
    );
    const totalEngagement = 
      (engagementRows[0]?.total_likes || 0) +
      (engagementRows[0]?.total_comments || 0) +
      (engagementRows[0]?.total_shares || 0);
    const averageEngagementRate = parseFloat(engagementRows[0]?.avg_engagement_rate || '0');

    // Calculate growth rate (compare current vs 7 days ago from snapshots)
    let growthRate = 0;
    try {
      const [growthRows] = await pool.execute<RowDataPacket[]>(
        `SELECT 
           SUM(CASE WHEN fs.snapshot_date >= DATE_SUB(CURDATE(), INTERVAL 1 DAY) THEN fs.follower_count ELSE 0 END) as current_followers,
           SUM(CASE WHEN fs.snapshot_date = DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN fs.follower_count ELSE 0 END) as past_followers
         FROM follower_snapshots fs
         WHERE fs.account_id IN (${accountIds.map(() => '?').join(',')})
         AND (fs.snapshot_date >= DATE_SUB(CURDATE(), INTERVAL 1 DAY) 
              OR fs.snapshot_date = DATE_SUB(CURDATE(), INTERVAL 7 DAY))`,
        accountIds
      );
      
      const currentFollowers = growthRows[0]?.current_followers || totalFollowers;
      const pastFollowers = growthRows[0]?.past_followers || totalFollowers;
      growthRate = pastFollowers > 0 
        ? ((currentFollowers - pastFollowers) / pastFollowers) * 100 
        : 0;
    } catch (error) {
      console.error('Error calculating growth rate:', error);
      // Default to 0 if calculation fails
      growthRate = 0;
    }

    return {
      totalFollowers,
      totalPosts,
      totalEngagement,
      averageEngagementRate,
      connectedPlatforms: accounts.length,
      growthRate: parseFloat(growthRate.toFixed(2)),
    };
  }

  /**
   * Get follower trends over time
   */
  async getFollowerTrends(
    userId: number,
    days: number = 30
  ): Promise<FollowerTrend[]> {
    const accounts = await UserSocialAccountModelInstance.findByUserId(userId);
    const accountIds = accounts.map(acc => acc.id!);

    if (accountIds.length === 0) {
      return [];
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
         DATE(fs.snapshot_date) as date,
         fs.follower_count as followers,
         sp.name as platform
       FROM follower_snapshots fs
       INNER JOIN user_social_accounts usa ON fs.account_id = usa.id
       INNER JOIN social_platforms sp ON usa.platform_id = sp.id
       WHERE fs.account_id IN (${accountIds.map(() => '?').join(',')})
       AND fs.snapshot_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       ORDER BY fs.snapshot_date ASC, fs.snapshot_time ASC`,
      [...accountIds, days]
    );

    return rows.map(row => ({
      date: row.date.toISOString().split('T')[0],
      followers: row.followers || 0,
      platform: row.platform || 'unknown',
    }));
  }

  /**
   * Get engagement trends over time
   */
  async getEngagementTrends(
    userId: number,
    days: number = 30
  ): Promise<EngagementTrend[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT 
           DATE(es.snapshot_date) as date,
           COALESCE(SUM(es.likes_count), 0) as likes,
           COALESCE(SUM(es.comments_count), 0) as comments,
           COALESCE(SUM(es.shares_count), 0) as shares,
           COALESCE(AVG(es.engagement_rate), 0) as engagement_rate
         FROM engagement_snapshots es
         INNER JOIN social_posts sp ON es.post_id = sp.id
         WHERE sp.user_id = ?
         AND es.snapshot_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
         GROUP BY DATE(es.snapshot_date)
         ORDER BY es.snapshot_date ASC`,
        [userId, days]
      );

      return rows.map(row => ({
        date: row.date ? (row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date)) : new Date().toISOString().split('T')[0],
        likes: Number(row.likes) || 0,
        comments: Number(row.comments) || 0,
        shares: Number(row.shares) || 0,
        engagementRate: parseFloat(String(row.engagement_rate || '0')),
      }));
    } catch (error) {
      console.error('Error fetching engagement trends:', error);
      // Return empty array if there's an error or no data
      return [];
    }
  }

  /**
   * Get top performing posts
   */
  async getTopPosts(
    userId: number,
    limit: number = 10
  ): Promise<TopPost[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
         sp.id,
         sp.content,
         sp.platform_type as platform,
         sp.published_at,
         sp.permalink,
         pem.likes_count as likes,
         pem.comments_count as comments,
         pem.shares_count as shares,
         pem.engagement_rate
       FROM social_posts sp
       LEFT JOIN post_engagement_metrics pem ON sp.id = pem.post_id
       WHERE sp.user_id = ? AND sp.is_deleted = FALSE
       ORDER BY pem.engagement_rate DESC, pem.likes_count DESC
       LIMIT ?`,
      [userId, limit]
    );

    return rows.map(row => ({
      id: row.id,
      content: row.content || '',
      platform: row.platform || 'unknown',
      published_at: row.published_at,
      likes: row.likes || 0,
      comments: row.comments || 0,
      shares: row.shares || 0,
      engagement_rate: parseFloat(row.engagement_rate || '0'),
      permalink: row.permalink || undefined,
    }));
  }

  /**
   * Get platform comparison metrics
   */
  async getPlatformComparison(userId: number): Promise<PlatformComparison[]> {
    const accounts = await UserSocialAccountModelInstance.findByUserId(userId);
    const accountIds = accounts.map(acc => acc.id!);

    if (accountIds.length === 0) {
      return [];
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
         platform_info.name as platform,
         COALESCE(MAX(fm.follower_count), 0) as followers,
         COUNT(DISTINCT posts.id) as posts,
         COALESCE(SUM(pem.likes_count + pem.comments_count + pem.shares_count), 0) as engagement,
         COALESCE(AVG(pem.engagement_rate), 0) as engagement_rate
       FROM user_social_accounts usa
       INNER JOIN social_platforms platform_info ON usa.platform_id = platform_info.id
       LEFT JOIN follower_metrics fm ON usa.id = fm.account_id
       LEFT JOIN social_posts posts ON usa.id = posts.account_id AND posts.is_deleted = FALSE
       LEFT JOIN post_engagement_metrics pem ON posts.id = pem.post_id
       WHERE usa.user_id = ? AND usa.is_active = TRUE
       GROUP BY platform_info.name, platform_info.id
       ORDER BY followers DESC`,
      [userId]
    );

    return rows.map(row => ({
      platform: row.platform || 'unknown',
      followers: row.followers || 0,
      posts: row.posts || 0,
      engagement: row.engagement || 0,
      engagementRate: parseFloat(row.engagement_rate || '0'),
    }));
  }
}

export const analyticsService = new AnalyticsService();

