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
   * Uses follower_snapshots if available, otherwise falls back to follower_metrics
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

    // First try to get data from follower_snapshots (if available)
    const [snapshotRows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
         DATE_FORMAT(fs.snapshot_date, '%Y-%m-%d') as date,
         SUM(fs.follower_count) as followers,
         sp.name as platform
       FROM follower_snapshots fs
       INNER JOIN user_social_accounts usa ON fs.account_id = usa.id
       INNER JOIN social_platforms sp ON usa.platform_id = sp.id
       WHERE fs.account_id IN (${accountIds.map(() => '?').join(',')})
       AND fs.snapshot_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(fs.snapshot_date), sp.name
       ORDER BY fs.snapshot_date ASC, fs.snapshot_time ASC`,
      [...accountIds, days]
    );

    // If we have snapshot data, use it
    if (snapshotRows.length > 0) {
      return snapshotRows.map(row => {
        // DATE_FORMAT returns a string in YYYY-MM-DD format
        let formattedDate: string;
        if (typeof row.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(row.date)) {
          formattedDate = row.date;
        } else if (row.date instanceof Date) {
          formattedDate = row.date.toISOString().split('T')[0];
        } else {
          // If date is invalid, use current date as fallback
          console.warn(`Invalid date format from database: ${row.date}, using current date`);
          formattedDate = new Date().toISOString().split('T')[0];
        }
        
        return {
          date: formattedDate,
          followers: row.followers || 0,
          platform: row.platform || 'unknown',
        };
      });
    }

    // Fallback: Use follower_metrics and group by date
    // Get the latest follower count per account per day
    const [metricsRows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
         DATE_FORMAT(fm.recorded_at, '%Y-%m-%d') as date,
         SUM(fm.follower_count) as followers,
         sp.name as platform
       FROM follower_metrics fm
       INNER JOIN user_social_accounts usa ON fm.account_id = usa.id
       INNER JOIN social_platforms sp ON usa.platform_id = sp.id
       WHERE fm.account_id IN (${accountIds.map(() => '?').join(',')})
       AND fm.recorded_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       AND fm.recorded_at = (
         SELECT MAX(fm2.recorded_at)
         FROM follower_metrics fm2
         WHERE fm2.account_id = fm.account_id
         AND DATE(fm2.recorded_at) = DATE(fm.recorded_at)
       )
       GROUP BY DATE(fm.recorded_at), sp.name
       ORDER BY DATE(fm.recorded_at) ASC`,
      [...accountIds, days]
    );

    return metricsRows.map(row => {
      // DATE_FORMAT returns a string in YYYY-MM-DD format, so we can use it directly
      // But validate it's a proper date format
      let formattedDate: string;
      if (typeof row.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(row.date)) {
        formattedDate = row.date;
      } else if (row.date instanceof Date) {
        formattedDate = row.date.toISOString().split('T')[0];
      } else {
        // If date is invalid, use current date as fallback
        console.warn(`Invalid date format from database: ${row.date}, using current date`);
        formattedDate = new Date().toISOString().split('T')[0];
      }
      
      return {
        date: formattedDate,
        followers: row.followers || 0,
        platform: row.platform || 'unknown',
      };
    });
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
    limit: number = 10,
    days?: number
  ): Promise<TopPost[]> {
    const query = days
      ? `SELECT 
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
           sp.published_at,
           sp.permalink,
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

    const params = days ? [userId, days, limit] : [userId, limit];
    const [rows] = await pool.execute<RowDataPacket[]>(query, params);

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
    bestPostingDays: Array<{ day: string; engagement: number }>;
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

    // Get best posting days (by day of week)
    const [dayRows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
         DAYNAME(sp.published_at) as day_name,
         AVG(COALESCE(pem.likes_count, 0) + COALESCE(pem.comments_count, 0) + COALESCE(pem.shares_count, 0)) as avg_engagement
       FROM social_posts sp
       INNER JOIN user_social_accounts usa ON sp.account_id = usa.id
       LEFT JOIN post_engagement_metrics pem ON sp.id = pem.post_id
       WHERE sp.user_id = ?
         AND sp.is_deleted = FALSE
         AND sp.published_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
         AND sp.published_at IS NOT NULL
         AND usa.is_active = TRUE
         AND usa.account_status = 'connected'
       GROUP BY DAYNAME(sp.published_at)
       ORDER BY 
         CASE DAYNAME(sp.published_at)
           WHEN 'Monday' THEN 1
           WHEN 'Tuesday' THEN 2
           WHEN 'Wednesday' THEN 3
           WHEN 'Thursday' THEN 4
           WHEN 'Friday' THEN 5
           WHEN 'Saturday' THEN 6
           WHEN 'Sunday' THEN 7
         END`,
      [userId, days]
    );

    // Initialize all days with 0 engagement
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const bestPostingDays = dayNames.map(day => ({
      day,
      engagement: 0,
    }));

    // Fill in actual data
    dayRows.forEach(row => {
      const dayIndex = dayNames.indexOf(row.day_name);
      if (dayIndex !== -1) {
        // Ensure engagement is a number
        const avgEngagement = parseFloat(row.avg_engagement) || 0;
        bestPostingDays[dayIndex].engagement = Math.round(avgEngagement);
      }
    });

    return {
      totalPosts,
      averageEngagementRate,
      contentTypeBreakdown,
      bestPostingDays,
    };
  }
}

export const analyticsService = new AnalyticsService();

