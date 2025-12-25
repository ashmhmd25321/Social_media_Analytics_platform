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
    // Get all user's ACTIVE connected accounts only
    // findByUserId now filters by is_active = TRUE AND account_status = 'connected'
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
    // IMPORTANT: Only count posts from active accounts for consistency
    const [postRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total_posts
       FROM social_posts sp
       INNER JOIN user_social_accounts usa ON sp.account_id = usa.id
       WHERE sp.user_id = ? 
         AND sp.is_deleted = FALSE
         AND usa.is_active = TRUE
         AND usa.account_status = 'connected'`,
      [userId]
    );
    const totalPosts = postRows[0]?.total_posts || 0;

    // Get total engagement (likes + comments + shares)
    // IMPORTANT: Only count engagement from posts linked to active accounts
    // This ensures consistency with platform-specific engagement calculations
    const [engagementRows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
         SUM(pem.likes_count) as total_likes,
         SUM(pem.comments_count) as total_comments,
         SUM(pem.shares_count) as total_shares,
         AVG(pem.engagement_rate) as avg_engagement_rate
       FROM post_engagement_metrics pem
       INNER JOIN social_posts sp ON pem.post_id = sp.id
       INNER JOIN user_social_accounts usa ON sp.account_id = usa.id
       WHERE sp.user_id = ? 
         AND sp.is_deleted = FALSE
         AND usa.is_active = TRUE
         AND usa.account_status = 'connected'`,
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
   * Returns daily follower additions (new followers per day), not cumulative counts
   * Supports day/month/year view aggregation
   * Uses follower_snapshots if available, otherwise falls back to follower_metrics
   */
  async getFollowerTrends(
    userId: number,
    view: 'day' | 'month' | 'year' = 'day'
  ): Promise<FollowerTrend[]> {
    const accounts = await UserSocialAccountModelInstance.findByUserId(userId);
    const accountIds = accounts.map(acc => acc.id!);

    if (accountIds.length === 0) {
      return [];
    }

    // Query structure depends on view type (day/month/year)

    // First try to get data from follower_snapshots (if available)
    // Get the latest snapshot per account per period to calculate additions
    const snapshotQuery = view === 'day'
      ? `SELECT 
           DATE_FORMAT(fs.snapshot_date, '%Y-%m-%d') as date,
           SUM(fs.follower_count) as total_followers
         FROM follower_snapshots fs
         INNER JOIN user_social_accounts usa ON fs.account_id = usa.id
         WHERE fs.account_id IN (${accountIds.map(() => '?').join(',')})
         AND fs.snapshot_date = (
           SELECT MAX(fs2.snapshot_date)
           FROM follower_snapshots fs2
           WHERE fs2.account_id = fs.account_id
           AND DATE(fs2.snapshot_date) = DATE(fs.snapshot_date)
         )
         GROUP BY DATE(fs.snapshot_date)
         ORDER BY DATE(fs.snapshot_date) ASC`
      : view === 'month'
      ? `SELECT 
           DATE_FORMAT(fs.snapshot_date, '%Y-%m') as date,
           SUM(fs.follower_count) as total_followers
         FROM follower_snapshots fs
         INNER JOIN user_social_accounts usa ON fs.account_id = usa.id
         WHERE fs.account_id IN (${accountIds.map(() => '?').join(',')})
         AND (fs.snapshot_date, fs.account_id) = (
           SELECT MAX(fs2.snapshot_date), fs2.account_id
           FROM follower_snapshots fs2
           WHERE fs2.account_id = fs.account_id
           AND YEAR(fs2.snapshot_date) = YEAR(fs.snapshot_date)
           AND MONTH(fs2.snapshot_date) = MONTH(fs.snapshot_date)
         )
         GROUP BY YEAR(fs.snapshot_date), MONTH(fs.snapshot_date)
         ORDER BY YEAR(fs.snapshot_date) ASC, MONTH(fs.snapshot_date) ASC`
      : `SELECT 
           DATE_FORMAT(fs.snapshot_date, '%Y') as date,
           SUM(fs.follower_count) as total_followers
         FROM follower_snapshots fs
         INNER JOIN user_social_accounts usa ON fs.account_id = usa.id
         WHERE fs.account_id IN (${accountIds.map(() => '?').join(',')})
         AND (fs.snapshot_date, fs.account_id) = (
           SELECT MAX(fs2.snapshot_date), fs2.account_id
           FROM follower_snapshots fs2
           WHERE fs2.account_id = fs.account_id
           AND YEAR(fs2.snapshot_date) = YEAR(fs.snapshot_date)
         )
         GROUP BY YEAR(fs.snapshot_date)
         ORDER BY YEAR(fs.snapshot_date) ASC`;

    const [snapshotRows] = await pool.execute<RowDataPacket[]>(snapshotQuery, accountIds);

    // If we have snapshot data, calculate daily additions
    if (snapshotRows.length > 0) {
      const trends: FollowerTrend[] = [];
      
      for (let i = 0; i < snapshotRows.length; i++) {
        const currentRow = snapshotRows[i];
        const currentDate = currentRow.date;
        const currentTotal = Number(currentRow.total_followers) || 0;
        
        // Calculate additions: difference from previous period
        let additions = 0;
        if (i === 0) {
          // First period: all followers are "new"
          additions = currentTotal;
        } else {
          // Calculate difference from previous period
          const prevRow = snapshotRows[i - 1];
          const prevTotal = Number(prevRow.total_followers) || 0;
          additions = Math.max(0, currentTotal - prevTotal);
        }
        
        trends.push({
          date: currentDate,
          followers: additions,
          platform: 'all', // Aggregated across all platforms
        });
      }
      
      return trends;
    }

    // Fallback: Use follower_metrics
    // Get the latest follower count per account per day/month/year
    const metricsQuery = view === 'day'
      ? `SELECT 
           DATE_FORMAT(fm.recorded_at, '%Y-%m-%d') as date,
           SUM(fm.follower_count) as total_followers
         FROM follower_metrics fm
         INNER JOIN user_social_accounts usa ON fm.account_id = usa.id
         WHERE fm.account_id IN (${accountIds.map(() => '?').join(',')})
         AND fm.recorded_at = (
           SELECT MAX(fm2.recorded_at)
           FROM follower_metrics fm2
           WHERE fm2.account_id = fm.account_id
           AND DATE(fm2.recorded_at) = DATE(fm.recorded_at)
         )
         GROUP BY DATE(fm.recorded_at)
         ORDER BY DATE(fm.recorded_at) ASC`
      : view === 'month'
      ? `SELECT 
           DATE_FORMAT(fm.recorded_at, '%Y-%m') as date,
           SUM(fm.follower_count) as total_followers
         FROM follower_metrics fm
         INNER JOIN user_social_accounts usa ON fm.account_id = usa.id
         WHERE fm.account_id IN (${accountIds.map(() => '?').join(',')})
         AND fm.recorded_at = (
           SELECT MAX(fm2.recorded_at)
           FROM follower_metrics fm2
           WHERE fm2.account_id = fm.account_id
           AND YEAR(fm2.recorded_at) = YEAR(fm.recorded_at)
           AND MONTH(fm2.recorded_at) = MONTH(fm.recorded_at)
         )
         GROUP BY YEAR(fm.recorded_at), MONTH(fm.recorded_at)
         ORDER BY YEAR(fm.recorded_at) ASC, MONTH(fm.recorded_at) ASC`
      : `SELECT 
           DATE_FORMAT(fm.recorded_at, '%Y') as date,
           SUM(fm.follower_count) as total_followers
         FROM follower_metrics fm
         INNER JOIN user_social_accounts usa ON fm.account_id = usa.id
         WHERE fm.account_id IN (${accountIds.map(() => '?').join(',')})
         AND fm.recorded_at = (
           SELECT MAX(fm2.recorded_at)
           FROM follower_metrics fm2
           WHERE fm2.account_id = fm.account_id
           AND YEAR(fm2.recorded_at) = YEAR(fm.recorded_at)
         )
         GROUP BY YEAR(fm.recorded_at)
         ORDER BY YEAR(fm.recorded_at) ASC`;

    const [metricsRows] = await pool.execute<RowDataPacket[]>(metricsQuery, accountIds);

    // Calculate daily additions from metrics
    const trends: FollowerTrend[] = [];
    for (let i = 0; i < metricsRows.length; i++) {
      const currentRow = metricsRows[i];
      const currentDate = currentRow.date;
      const currentTotal = Number(currentRow.total_followers) || 0;
      
      let additions = 0;
      if (i === 0) {
        additions = currentTotal;
      } else {
        const prevRow = metricsRows[i - 1];
        const prevTotal = Number(prevRow.total_followers) || 0;
        additions = Math.max(0, currentTotal - prevTotal);
      }
      
      trends.push({
        date: currentDate,
        followers: additions,
        platform: 'all',
      });
    }

    return trends;
  }

  /**
   * Get engagement trends over time
   * Groups engagement by the actual post published date (not when data was synced)
   */
  async getEngagementTrends(
    userId: number,
    days: number = 30
  ): Promise<EngagementTrend[]> {
    try {
      // Get posts with engagement metrics, deduplicate by platform_post_id
      // Use DATE_FORMAT to get date as string to avoid timezone issues
      // Fetch all posts with engagement, deduplicate in code, then group by date
      const [allPostRows] = await pool.execute<RowDataPacket[]>(
        `SELECT 
           sp.id,
           sp.platform_post_id,
           DATE_FORMAT(sp.published_at, '%Y-%m-%d') as published_date,
           sp.platform_type,
           sp.updated_at_local,
           COALESCE(pem.likes_count, 0) as likes_count,
           COALESCE(pem.comments_count, 0) as comments_count,
           COALESCE(pem.shares_count, 0) as shares_count,
           COALESCE(pem.engagement_rate, 0) as engagement_rate
         FROM social_posts sp
         INNER JOIN user_social_accounts usa ON sp.account_id = usa.id
         LEFT JOIN post_engagement_metrics pem ON sp.id = pem.post_id
         WHERE sp.user_id = ?
           AND sp.is_deleted = FALSE
           AND sp.published_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
           AND sp.published_at IS NOT NULL
           AND usa.is_active = TRUE
           AND usa.account_status = 'connected'
         ORDER BY sp.published_at DESC`,
        [userId, days]
      );

      // Deduplicate in code: for each platform_post_id, keep the one with highest priority
      const platformPriority: Record<string, number> = {
        'instagram': 3,
        'youtube': 2,
        'facebook': 1,
      };

      const postMap = new Map<string, { 
        published_date: string; 
        priority: number; 
        updated_at: Date;
        likes_count: number;
        comments_count: number;
        shares_count: number;
        engagement_rate: number;
      }>();
      
      for (const row of allPostRows) {
        const platformPostId = row.platform_post_id;
        const platform = (row.platform_type || 'unknown').toLowerCase();
        const priority = platformPriority[platform] || 0;
        
        // Use the date string directly from SQL (YYYY-MM-DD format, no timezone issues)
        const publishedDateStr = row.published_date; // Already formatted as YYYY-MM-DD from SQL
        if (!publishedDateStr) {
          continue; // Skip posts without published_at
        }
        
        const updatedAt = row.updated_at_local ? new Date(row.updated_at_local) : new Date(0);
        const likesCount = Number(row.likes_count) || 0;
        const commentsCount = Number(row.comments_count) || 0;
        const sharesCount = Number(row.shares_count) || 0;
        const engagementRate = parseFloat(String(row.engagement_rate || '0'));

        const existing = postMap.get(platformPostId);
        if (!existing) {
          postMap.set(platformPostId, { 
            published_date: publishedDateStr, 
            priority, 
            updated_at: updatedAt,
            likes_count: likesCount,
            comments_count: commentsCount,
            shares_count: sharesCount,
            engagement_rate: engagementRate,
          });
        } else {
          // Keep the post with higher priority, or if same priority, keep the most recently updated
          if (priority > existing.priority || 
              (priority === existing.priority && updatedAt > existing.updated_at)) {
            postMap.set(platformPostId, { 
              published_date: publishedDateStr, 
              priority, 
              updated_at: updatedAt,
              likes_count: likesCount,
              comments_count: commentsCount,
              shares_count: sharesCount,
              engagement_rate: engagementRate,
            });
          }
        }
      }

      // Group by date and sum engagement metrics
      const dateMap = new Map<string, { 
        likes: number; 
        comments: number; 
        shares: number; 
        engagement_rates: number[];
      }>();
      
      for (const { published_date, likes_count, comments_count, shares_count, engagement_rate } of postMap.values()) {
        const existing = dateMap.get(published_date);
        if (!existing) {
          dateMap.set(published_date, {
            likes: likes_count,
            comments: comments_count,
            shares: shares_count,
            engagement_rates: engagement_rate > 0 ? [engagement_rate] : [],
          });
        } else {
          existing.likes += likes_count;
          existing.comments += comments_count;
          existing.shares += shares_count;
          if (engagement_rate > 0) {
            existing.engagement_rates.push(engagement_rate);
          }
        }
      }

      // Convert to array and calculate average engagement rate
      return Array.from(dateMap.entries())
        .map(([date, metrics]) => {
          const avgEngagementRate = metrics.engagement_rates.length > 0
            ? metrics.engagement_rates.reduce((sum, rate) => sum + rate, 0) / metrics.engagement_rates.length
            : 0;
          
          return {
            date,
            likes: metrics.likes,
            comments: metrics.comments,
            shares: metrics.shares,
            engagementRate: avgEngagementRate,
          };
        })
        .sort((a, b) => a.date.localeCompare(b.date)); // Sort ascending by date
    } catch (error) {
      console.error('Error fetching engagement trends:', error);
      // Return empty array if there's an error or no data
      return [];
    }
  }

  /**
   * Get posts published over time (by actual post published dates)
   * This replaces follower growth chart with real data
   */
  async getPostsOverTime(
    userId: number,
    days: number = 30
  ): Promise<Array<{ date: string; count: number }>> {
    try {
      // Get posts by actual date from social_posts table
      // Deduplicate by platform_post_id: prefer Instagram > YouTube > Facebook, then most recent
      // Fetch all posts, deduplicate in code, then group by date
      // Use DATE_FORMAT to get date as string to avoid timezone issues
      const [allPostRows] = await pool.execute<RowDataPacket[]>(
        `SELECT 
           sp.id,
           sp.platform_post_id,
           DATE_FORMAT(sp.published_at, '%Y-%m-%d') as published_date,
           sp.platform_type,
           sp.updated_at_local
         FROM social_posts sp
         INNER JOIN user_social_accounts usa ON sp.account_id = usa.id
         WHERE sp.user_id = ?
           AND sp.is_deleted = FALSE
           AND sp.published_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
           AND sp.published_at IS NOT NULL
           AND usa.is_active = TRUE
           AND usa.account_status = 'connected'
         ORDER BY sp.published_at DESC`,
        [userId, days]
      );

      // Deduplicate in code: for each platform_post_id, keep the one with highest priority
      const platformPriority: Record<string, number> = {
        'instagram': 3,
        'youtube': 2,
        'facebook': 1,
      };

      const postMap = new Map<string, { published_date: string; priority: number; updated_at: Date }>();
      
      for (const row of allPostRows) {
        const platformPostId = row.platform_post_id;
        const platform = (row.platform_type || 'unknown').toLowerCase();
        const priority = platformPriority[platform] || 0;
        
        // Use the date string directly from SQL (YYYY-MM-DD format, no timezone issues)
        const publishedDateStr = row.published_date; // Already formatted as YYYY-MM-DD from SQL
        if (!publishedDateStr) {
          continue; // Skip posts without published_at
        }
        
        const updatedAt = row.updated_at_local ? new Date(row.updated_at_local) : new Date(0);

        const existing = postMap.get(platformPostId);
        if (!existing) {
          postMap.set(platformPostId, { 
            published_date: publishedDateStr, 
            priority, 
            updated_at: updatedAt
          });
        } else {
          // Keep the post with higher priority, or if same priority, keep the most recently updated
          if (priority > existing.priority || 
              (priority === existing.priority && updatedAt > existing.updated_at)) {
            postMap.set(platformPostId, { 
              published_date: publishedDateStr, 
              priority, 
              updated_at: updatedAt
            });
          }
        }
      }

      // Group by date and count - use date string directly from SQL (no timezone conversion)
      const dateMap = new Map<string, number>();
      for (const { published_date } of postMap.values()) {
        dateMap.set(published_date, (dateMap.get(published_date) || 0) + 1);
      }

      // Convert to array and sort
      return Array.from(dateMap.entries())
        .map(([post_date, post_count]) => ({ 
          date: post_date, 
          count: post_count 
        }))
        .sort((a, b) => a.date.localeCompare(b.date)); // Sort ascending by date
    } catch (error) {
      console.error('Error fetching posts over time:', error);
      return [];
    }
  }

  /**
   * Get engagement metrics (totals, averages, by platform)
   */
  async getEngagementMetrics(
    userId: number,
    days: number = 30
  ): Promise<{
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    averageEngagementRate: number;
    averageResponseTime: number;
    engagementByPlatform: Array<{ platform: string; engagement: number; rate: number }>;
  }> {
    const accounts = await UserSocialAccountModelInstance.findByUserId(userId);
    const accountIds = accounts.map(acc => acc.id!);

    if (accountIds.length === 0) {
      return {
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        averageEngagementRate: 0,
        averageResponseTime: 0,
        engagementByPlatform: [],
      };
    }

    // Get total engagement metrics
    const [totalRows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
         COALESCE(SUM(pem.likes_count), 0) as total_likes,
         COALESCE(SUM(pem.comments_count), 0) as total_comments,
         COALESCE(SUM(pem.shares_count), 0) as total_shares,
         COALESCE(AVG(pem.engagement_rate), 0) as avg_engagement_rate
       FROM post_engagement_metrics pem
       INNER JOIN social_posts sp ON pem.post_id = sp.id
       INNER JOIN user_social_accounts usa ON sp.account_id = usa.id
       WHERE sp.user_id = ?
         AND sp.is_deleted = FALSE
         AND usa.is_active = TRUE
         AND usa.account_status = 'connected'
         AND sp.published_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
      [userId, days]
    );

    const totalLikes = Number(totalRows[0]?.total_likes) || 0;
    const totalComments = Number(totalRows[0]?.total_comments) || 0;
    const totalShares = Number(totalRows[0]?.total_shares) || 0;
    const averageEngagementRate = parseFloat(String(totalRows[0]?.avg_engagement_rate || '0'));

    // Get engagement by platform - show ALL connected platforms, even if they have 0 engagement
    // First, get all connected platforms
    const [platformRows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
         platform.name as platform,
         platform.id as platform_id,
         COALESCE(SUM(pem.likes_count + pem.comments_count + pem.shares_count), 0) as total_engagement,
         COALESCE(AVG(pem.engagement_rate), 0) as avg_rate,
         COUNT(DISTINCT posts.id) as post_count
       FROM user_social_accounts usa
       INNER JOIN social_platforms platform ON usa.platform_id = platform.id
       LEFT JOIN social_posts posts ON usa.id = posts.account_id 
         AND posts.is_deleted = FALSE
         AND posts.published_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       LEFT JOIN post_engagement_metrics pem ON posts.id = pem.post_id
       WHERE usa.user_id = ?
         AND usa.is_active = TRUE
         AND usa.account_status = 'connected'
       GROUP BY platform.name, platform.id
       ORDER BY total_engagement DESC`,
      [days, userId]
    );

    const engagementByPlatform = platformRows.map(row => ({
      platform: row.platform || 'unknown',
      engagement: Number(row.total_engagement) || 0,
      rate: parseFloat(String(row.avg_rate || '0')),
    }));

    // Calculate average response time (placeholder - would need comment timestamps)
    // For now, we'll set it to 0 or calculate from available data if possible
    const averageResponseTime = 0; // TODO: Implement actual response time calculation

    return {
      totalLikes,
      totalComments,
      totalShares,
      averageEngagementRate,
      averageResponseTime,
      engagementByPlatform,
    };
  }

  /**
   * Get top performing posts
   */
  async getTopPosts(
    userId: number,
    limit: number = 10,
    days?: number
  ): Promise<TopPost[]> {
    // Fetch all posts first, then deduplicate in code
    const query = days
      ? `SELECT 
           sp.id,
           sp.content,
           sp.platform_type as platform,
           sp.platform_post_id,
           sp.published_at,
           sp.permalink,
           sp.updated_at_local,
           pem.likes_count as likes,
           pem.comments_count as comments,
           pem.shares_count as shares,
           pem.engagement_rate
         FROM social_posts sp
         INNER JOIN user_social_accounts usa ON sp.account_id = usa.id
         LEFT JOIN post_engagement_metrics pem ON sp.id = pem.post_id
         WHERE sp.user_id = ? 
           AND sp.is_deleted = FALSE
           AND sp.published_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
           AND usa.is_active = TRUE
           AND usa.account_status = 'connected'
         ORDER BY pem.engagement_rate DESC, pem.likes_count DESC
         LIMIT ?`
      : `SELECT 
           sp.id,
           sp.content,
           sp.platform_type as platform,
           sp.platform_post_id,
           sp.published_at,
           sp.permalink,
           sp.updated_at_local,
           pem.likes_count as likes,
           pem.comments_count as comments,
           pem.shares_count as shares,
           pem.engagement_rate
         FROM social_posts sp
         INNER JOIN user_social_accounts usa ON sp.account_id = usa.id
         LEFT JOIN post_engagement_metrics pem ON sp.id = pem.post_id
         WHERE sp.user_id = ? 
           AND sp.is_deleted = FALSE
           AND usa.is_active = TRUE
           AND usa.account_status = 'connected'
         ORDER BY pem.engagement_rate DESC, pem.likes_count DESC
         LIMIT ?`;

    const params = days ? [userId, days, limit * 2] : [userId, limit * 2]; // Fetch more to account for duplicates
    const [rows] = await pool.execute<RowDataPacket[]>(query, params);

    // Deduplicate posts: for each platform_post_id, keep the one with:
    // 1. Highest priority platform_type (instagram > youtube > facebook)
    // 2. Most recently updated if same platform_type
    const postMap = new Map<string, TopPost & { priority: number; updated_at: Date }>();
    
    const platformPriority: Record<string, number> = {
      'instagram': 3,
      'youtube': 2,
      'facebook': 1,
    };

    for (const row of rows) {
      const platformPostId = row.platform_post_id;
      const platform = (row.platform || 'unknown').toLowerCase();
      const priority = platformPriority[platform] || 0;
      const updatedAt = row.updated_at_local ? new Date(row.updated_at_local) : new Date(0);

      const post: TopPost & { priority: number; updated_at: Date } = {
        id: row.id,
        content: row.content || '',
        platform: row.platform || 'unknown',
        published_at: row.published_at,
        likes: row.likes || 0,
        comments: row.comments || 0,
        shares: row.shares || 0,
        engagement_rate: parseFloat(row.engagement_rate || '0'),
        permalink: row.permalink || undefined,
        priority,
        updated_at: updatedAt,
      };

      const existing = postMap.get(platformPostId);
      if (!existing) {
        postMap.set(platformPostId, post);
      } else {
        // Keep the post with higher priority, or if same priority, keep the most recently updated
        if (priority > existing.priority || 
            (priority === existing.priority && updatedAt > existing.updated_at)) {
          postMap.set(platformPostId, post);
        }
      }
    }

    // Convert map to array, sort by engagement, and limit
    const results = Array.from(postMap.values())
      .sort((a, b) => {
        if (b.engagement_rate !== a.engagement_rate) {
          return b.engagement_rate - a.engagement_rate;
        }
        return b.likes - a.likes;
      })
      .slice(0, limit)
      .map(({ priority, updated_at, ...post }) => post); // Remove helper fields

    return results;
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

    // Get follower counts per platform
    const [followerRows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
         platform_info.name as platform,
         COALESCE(MAX(fm.follower_count), 0) as followers
       FROM user_social_accounts usa
       INNER JOIN social_platforms platform_info ON usa.platform_id = platform_info.id
       LEFT JOIN follower_metrics fm ON usa.id = fm.account_id
       WHERE usa.user_id = ? AND usa.is_active = TRUE
       GROUP BY platform_info.name, platform_info.id`,
      [userId]
    );

    // Get all posts with engagement metrics, then deduplicate
    const [postRows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
         sp.id,
         sp.platform_post_id,
         sp.platform_type,
         sp.updated_at_local,
         platform_info.name as platform_name,
         COALESCE(pem.likes_count, 0) as likes_count,
         COALESCE(pem.comments_count, 0) as comments_count,
         COALESCE(pem.shares_count, 0) as shares_count,
         COALESCE(pem.engagement_rate, 0) as engagement_rate
       FROM social_posts sp
       INNER JOIN user_social_accounts usa ON sp.account_id = usa.id
       INNER JOIN social_platforms platform_info ON usa.platform_id = platform_info.id
       LEFT JOIN post_engagement_metrics pem ON sp.id = pem.post_id
       WHERE sp.user_id = ?
         AND sp.is_deleted = FALSE
         AND usa.is_active = TRUE
         AND usa.account_status = 'connected'`,
      [userId]
    );

    // Deduplicate posts: for each platform_post_id, keep the one with highest priority
    const platformPriority: Record<string, number> = {
      'instagram': 3,
      'youtube': 2,
      'facebook': 1,
    };

    const postMap = new Map<string, {
      platform: string;
      likes: number;
      comments: number;
      shares: number;
      engagement_rate: number;
      priority: number;
      updated_at: Date;
    }>();

    for (const row of postRows) {
      const platformPostId = row.platform_post_id;
      const platform = (row.platform_type || 'unknown').toLowerCase();
      const priority = platformPriority[platform] || 0;
      const updatedAt = row.updated_at_local ? new Date(row.updated_at_local) : new Date(0);
      const platformName = row.platform_name || 'unknown';

      const existing = postMap.get(platformPostId);
      if (!existing) {
        postMap.set(platformPostId, {
          platform: platformName,
          likes: Number(row.likes_count) || 0,
          comments: Number(row.comments_count) || 0,
          shares: Number(row.shares_count) || 0,
          engagement_rate: parseFloat(String(row.engagement_rate || '0')),
          priority,
          updated_at: updatedAt,
        });
      } else {
        // Keep the post with higher priority, or if same priority, keep the most recently updated
        if (priority > existing.priority || 
            (priority === existing.priority && updatedAt > existing.updated_at)) {
          postMap.set(platformPostId, {
            platform: platformName,
            likes: Number(row.likes_count) || 0,
            comments: Number(row.comments_count) || 0,
            shares: Number(row.shares_count) || 0,
            engagement_rate: parseFloat(String(row.engagement_rate || '0')),
            priority,
            updated_at: updatedAt,
          });
        }
      }
    }

    // Group by platform and calculate metrics
    const platformMap = new Map<string, {
      followers: number;
      posts: number;
      engagement: number;
      engagement_rates: number[];
    }>();

    // Initialize with follower counts
    for (const row of followerRows) {
      platformMap.set(row.platform, {
        followers: Number(row.followers) || 0,
        posts: 0,
        engagement: 0,
        engagement_rates: [],
      });
    }

    // Count posts and sum engagement by platform
    for (const { platform, likes, comments, shares, engagement_rate } of postMap.values()) {
      const existing = platformMap.get(platform);
      if (existing) {
        existing.posts += 1;
        existing.engagement += likes + comments + shares;
        if (engagement_rate > 0) {
          existing.engagement_rates.push(engagement_rate);
        }
      } else {
        // Platform not in follower rows, but has posts - add it
        platformMap.set(platform, {
          followers: 0,
          posts: 1,
          engagement: likes + comments + shares,
          engagement_rates: engagement_rate > 0 ? [engagement_rate] : [],
        });
      }
    }

    // Convert to array and calculate average engagement rate
    return Array.from(platformMap.entries())
      .map(([platform, metrics]) => ({
        platform,
        followers: metrics.followers,
        posts: metrics.posts,
        engagement: metrics.engagement,
        engagementRate: metrics.engagement_rates.length > 0
          ? metrics.engagement_rates.reduce((sum, rate) => sum + rate, 0) / metrics.engagement_rates.length
          : 0,
      }))
      .sort((a, b) => b.followers - a.followers);
  }

  /**
   * Get audience analytics metrics
   * @param userId - User ID
   * @param days - Number of days for time range (default: 30)
   */
  async getAudienceMetrics(userId: number, days: number = 30): Promise<{
    totalFollowers: number;
    followerGrowth: number;
    newFollowers: number;
    peakActivityHours: Array<{ hour: number; activity: number }>;
    platformBreakdown: Array<{ platform: string; followers: number; percentage: number }>;
  }> {
    const accounts = await UserSocialAccountModelInstance.findByUserId(userId);
    const accountIds = accounts.map(acc => acc.id!);

    if (accountIds.length === 0) {
      return {
        totalFollowers: 0,
        followerGrowth: 0,
        newFollowers: 0,
        peakActivityHours: [],
        platformBreakdown: [],
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

    // Calculate growth (compare current vs X days ago using follower_metrics)
    // Get current followers (latest record per account)
    const currentFollowers = totalFollowers;
    
    // Get followers from X days ago (or closest available)
    const [pastFollowerRows] = await pool.execute<RowDataPacket[]>(
      `SELECT SUM(fm.follower_count) as past_followers
       FROM follower_metrics fm
       WHERE fm.account_id IN (${accountIds.map(() => '?').join(',')})
       AND fm.recorded_at <= DATE_SUB(NOW(), INTERVAL ? DAY)
       AND fm.recorded_at = (
         SELECT MAX(recorded_at)
         FROM follower_metrics fm2
         WHERE fm2.account_id = fm.account_id
         AND fm2.recorded_at <= DATE_SUB(NOW(), INTERVAL ? DAY)
       )`,
      [...accountIds, days, days]
    );
    
    // Get the first data collection date for each account to check if account is "new"
    const [firstDataRows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
         account_id,
         MIN(recorded_at) as first_recorded_at
       FROM follower_metrics
       WHERE account_id IN (${accountIds.map(() => '?').join(',')})
       GROUP BY account_id`,
      accountIds
    );
    
    // Check if any account's first data collection was within the time range
    // If so, all current followers should count as "new followers"
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const hasNewAccounts = firstDataRows.length > 0 && firstDataRows.some(row => {
      const firstRecorded = new Date(row.first_recorded_at);
      return firstRecorded >= cutoffDate;
    });
    
    // If no historical data exists, default to 0 (not totalFollowers)
    // This means if account was just created, pastFollowers = 0, so all current followers are "new"
    const pastFollowers = pastFollowerRows[0]?.past_followers ?? 0;
    
    // Calculate new followers:
    // - If account's first data was collected within time range, all followers are new
    // - Otherwise, calculate difference from historical data
    const newFollowers = hasNewAccounts 
      ? currentFollowers  // All followers are new if account data was first collected within time range
      : Math.max(0, currentFollowers - pastFollowers);
    
    // Calculate growth rate:
    // - If we have historical data, calculate percentage growth
    // - If account is new (first data within time range), show 100% growth (or 0 if no followers)
    // - Otherwise, 0% growth
    const followerGrowth = pastFollowers > 0 
      ? ((currentFollowers - pastFollowers) / pastFollowers) * 100 
      : (hasNewAccounts && currentFollowers > 0 ? 100 : 0);

    // Get platform breakdown - get latest follower count per platform
    const [platformRows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
         sp.name as platform,
         COALESCE(SUM(latest_fm.follower_count), 0) as followers
       FROM user_social_accounts usa
       INNER JOIN social_platforms sp ON usa.platform_id = sp.id
       LEFT JOIN (
         SELECT fm1.account_id, fm1.follower_count
         FROM follower_metrics fm1
         WHERE fm1.recorded_at = (
           SELECT MAX(fm2.recorded_at)
           FROM follower_metrics fm2
           WHERE fm2.account_id = fm1.account_id
         )
       ) latest_fm ON usa.id = latest_fm.account_id
       WHERE usa.user_id = ? 
         AND usa.is_active = TRUE 
         AND usa.account_status = 'connected'
       GROUP BY sp.name, sp.id`,
      [userId]
    );

    const platformBreakdown = platformRows
      .filter(row => row.followers > 0) // Only show platforms with followers
      .map(row => ({
        platform: row.platform || 'unknown',
        followers: row.followers || 0,
        percentage: totalFollowers > 0 ? (row.followers / totalFollowers) * 100 : 0,
      }));

    // Calculate peak activity hours from actual engagement data
    // Analyze engagement by hour of day from posts within the specified time range
    const [activityRows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
         HOUR(sp.published_at) as hour,
         SUM(COALESCE(pem.likes_count, 0) + COALESCE(pem.comments_count, 0) + COALESCE(pem.shares_count, 0)) as total_engagement,
         COUNT(*) as post_count
       FROM social_posts sp
       INNER JOIN user_social_accounts usa ON sp.account_id = usa.id
       LEFT JOIN post_engagement_metrics pem ON sp.id = pem.post_id
       WHERE sp.user_id = ?
         AND sp.is_deleted = FALSE
         AND sp.published_at IS NOT NULL
         AND sp.published_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
         AND usa.is_active = TRUE
         AND usa.account_status = 'connected'
       GROUP BY HOUR(sp.published_at)
       ORDER BY total_engagement DESC`,
      [userId, days]
    );

    // Initialize all 24 hours with 0 activity
    const peakActivityHours: Array<{ hour: number; activity: number }> = Array.from(
      { length: 24 },
      (_, hour) => ({ hour, activity: 0 })
    );

    // Fill in actual activity data
    activityRows.forEach(row => {
      const hour = row.hour;
      if (hour >= 0 && hour < 24) {
        peakActivityHours[hour].activity = Math.round(row.total_engagement || 0);
      }
    });

    // If no activity data, return empty array (frontend will handle empty state)
    const hasActivity = peakActivityHours.some(h => h.activity > 0);
    const finalPeakActivityHours = hasActivity ? peakActivityHours : [];

    return {
      totalFollowers,
      followerGrowth: parseFloat(followerGrowth.toFixed(2)),
      newFollowers,
      peakActivityHours: finalPeakActivityHours,
      platformBreakdown,
    };
  }

  /**
   * Get content type breakdown
   */
  async getContentTypeBreakdown(userId: number, days?: number): Promise<{
    text: number;
    image: number;
    video: number;
    carousel: number;
  }> {
    const query = days
      ? `SELECT 
           sp.content_type,
           COUNT(*) as count
         FROM social_posts sp
         INNER JOIN user_social_accounts usa ON sp.account_id = usa.id
         WHERE sp.user_id = ? 
           AND sp.is_deleted = FALSE
           AND sp.published_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
           AND usa.is_active = TRUE
           AND usa.account_status = 'connected'
         GROUP BY sp.content_type`
      : `SELECT 
           content_type,
           COUNT(*) as count
         FROM social_posts
         WHERE user_id = ? AND is_deleted = FALSE
         GROUP BY content_type`;

    const params = days ? [userId, days] : [userId];
    const [rows] = await pool.execute<RowDataPacket[]>(query, params);

    const breakdown = {
      text: 0,
      image: 0,
      video: 0,
      carousel: 0,
    };

    rows.forEach(row => {
      const type = (row.content_type || 'text').toLowerCase();
      if (type in breakdown) {
        breakdown[type as keyof typeof breakdown] = row.count || 0;
      }
    });

    return breakdown;
  }

  /**
   * Get content performance metrics
   */
  async getContentPerformance(
    userId: number,
    days: number = 30
  ): Promise<{
    totalPosts: number;
    averageEngagementRate: number;
    contentTypeBreakdown: {
      text: number;
      image: number;
      video: number;
      carousel: number;
    };
    postsByDay: Array<{ date: string; count: number }>;
  }> {
    // Get total posts count
    const [postCountRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total_posts
       FROM social_posts sp
       INNER JOIN user_social_accounts usa ON sp.account_id = usa.id
       WHERE sp.user_id = ?
         AND sp.is_deleted = FALSE
         AND sp.published_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
         AND usa.is_active = TRUE
         AND usa.account_status = 'connected'`,
      [userId, days]
    );
    const totalPosts = postCountRows[0]?.total_posts || 0;

    // Get average engagement rate
    const [engagementRows] = await pool.execute<RowDataPacket[]>(
      `SELECT AVG(pem.engagement_rate) as avg_engagement_rate
       FROM social_posts sp
       INNER JOIN user_social_accounts usa ON sp.account_id = usa.id
       LEFT JOIN post_engagement_metrics pem ON sp.id = pem.post_id
       WHERE sp.user_id = ?
         AND sp.is_deleted = FALSE
         AND sp.published_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
         AND usa.is_active = TRUE
         AND usa.account_status = 'connected'`,
      [userId, days]
    );
    const averageEngagementRate = parseFloat(engagementRows[0]?.avg_engagement_rate || '0');

    // Get content type breakdown (filtered by time range)
    const contentTypeBreakdown = await this.getContentTypeBreakdown(userId, days);

    // Get posts by actual date from social_posts table
    // Deduplicate by platform_post_id: prefer Instagram > YouTube > Facebook, then most recent
    // Fetch all posts, deduplicate in code, then group by date
    // Use DATE_FORMAT to get date as string to avoid timezone issues
    const [allPostRows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
         sp.id,
         sp.platform_post_id,
         DATE_FORMAT(sp.published_at, '%Y-%m-%d') as published_date,
         sp.published_at as published_at_full,
         sp.platform_type,
         sp.updated_at_local
       FROM social_posts sp
       INNER JOIN user_social_accounts usa ON sp.account_id = usa.id
       WHERE sp.user_id = ?
         AND sp.is_deleted = FALSE
         AND sp.published_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
         AND sp.published_at IS NOT NULL
         AND usa.is_active = TRUE
         AND usa.account_status = 'connected'
       ORDER BY sp.published_at DESC`,
      [userId, days]
    );

    // Deduplicate in code: for each platform_post_id, keep the one with highest priority
    const platformPriority: Record<string, number> = {
      'instagram': 3,
      'youtube': 2,
      'facebook': 1,
    };

    const postMap = new Map<string, { published_date: string; priority: number; updated_at: Date; id: number; platform: string }>();
    
    console.log(`[getContentPerformance] Fetched ${allPostRows.length} posts from database`);
    
    for (const row of allPostRows) {
      const platformPostId = row.platform_post_id;
      const platform = (row.platform_type || 'unknown').toLowerCase();
      const priority = platformPriority[platform] || 0;
      
      // Use the date string directly from SQL (YYYY-MM-DD format, no timezone issues)
      const publishedDateStr = row.published_date; // Already formatted as YYYY-MM-DD from SQL
      if (!publishedDateStr) {
        console.warn(`[getContentPerformance] Post ${row.id} has no published_date, skipping`);
        continue; // Skip posts without published_at
      }
      
      const updatedAt = row.updated_at_local ? new Date(row.updated_at_local) : new Date(0);

      const existing = postMap.get(platformPostId);
      if (!existing) {
        postMap.set(platformPostId, { 
          published_date: publishedDateStr, 
          priority, 
          updated_at: updatedAt,
          id: row.id,
          platform: platform
        });
      } else {
        // Keep the post with higher priority, or if same priority, keep the most recently updated
        if (priority > existing.priority || 
            (priority === existing.priority && updatedAt > existing.updated_at)) {
          postMap.set(platformPostId, { 
            published_date: publishedDateStr, 
            priority, 
            updated_at: updatedAt,
            id: row.id,
            platform: platform
          });
        }
      }
    }

    console.log(`[getContentPerformance] After deduplication: ${postMap.size} unique posts`);

    // Group by date and count - use date string directly from SQL (no timezone conversion)
    const dateMap = new Map<string, number>();
    for (const { published_date, id, platform } of postMap.values()) {
      dateMap.set(published_date, (dateMap.get(published_date) || 0) + 1);
      
      // Debug log for Dec 19 specifically
      if (published_date === '2025-12-19') {
        console.log(`[getContentPerformance] ⚠️ Found Dec 19 post: ID=${id}, platform=${platform}, published_date=${published_date}`);
      }
    }
    
    console.log(`[getContentPerformance] Date counts:`, Array.from(dateMap.entries()));

    // Convert to array and sort
    const dayRows = Array.from(dateMap.entries())
      .map(([post_date, post_count]) => ({ post_date, post_count }))
      .sort((a, b) => b.post_date.localeCompare(a.post_date))
      .slice(0, 30);
    
    console.log(`[getContentPerformance] Final dayRows:`, dayRows);

    const postsByDay = dayRows.map(row => {
      // post_date is already a string in YYYY-MM-DD format from DATE_FORMAT
      const dateStr = String(row.post_date || '').trim();
      
      return {
        date: dateStr,
        count: Number(row.post_count) || 0,
      };
    });

    return {
      totalPosts,
      averageEngagementRate,
      contentTypeBreakdown,
      postsByDay,
    };
  }
}

export const analyticsService = new AnalyticsService();

