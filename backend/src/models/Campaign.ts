import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export interface Campaign {
  id?: number;
  team_id?: number;
  user_id: number;
  name: string;
  description?: string;
  campaign_type: 'awareness' | 'engagement' | 'conversion' | 'retention' | 'custom';
  start_date: Date;
  end_date?: Date;
  budget?: number;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  goals?: Record<string, any>;
  created_at?: Date;
  updated_at?: Date;
}

export interface CampaignPost {
  id?: number;
  campaign_id: number;
  post_id: number;
  variant_type: 'control' | 'variant_a' | 'variant_b';
  scheduled_at?: Date;
  published_at?: Date;
  created_at?: Date;
}

export interface CampaignMetric {
  id?: number;
  campaign_id: number;
  date: Date;
  impressions: number;
  reach: number;
  clicks: number;
  engagements: number;
  likes: number;
  comments: number;
  shares: number;
  followers_gained: number;
  conversions: number;
  revenue: number;
  spend: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface ABTestGroup {
  id?: number;
  campaign_id: number;
  name: string;
  description?: string;
  variant_type: 'control' | 'variant_a' | 'variant_b';
  traffic_percentage: number;
  is_active: boolean;
  created_at?: Date;
}

class CampaignModel {
  async create(campaign: Campaign): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO campaigns (team_id, user_id, name, description, campaign_type, start_date, end_date, budget, status, goals)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        campaign.team_id || null,
        campaign.user_id,
        campaign.name,
        campaign.description || null,
        campaign.campaign_type || 'engagement',
        campaign.start_date,
        campaign.end_date || null,
        campaign.budget || null,
        campaign.status || 'draft',
        campaign.goals ? JSON.stringify(campaign.goals) : null,
      ]
    );
    return result.insertId;
  }

  async findById(id: number, userId?: number): Promise<Campaign | null> {
    let query = 'SELECT * FROM campaigns WHERE id = ?';
    const params: any[] = [id];
    
    if (userId) {
      query += ' AND (user_id = ? OR team_id IN (SELECT team_id FROM team_members WHERE user_id = ? AND is_active = TRUE))';
      params.push(userId, userId);
    }
    
    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    if (rows.length === 0) return null;
    return this.mapRowToCampaign(rows[0]);
  }

  async findByUser(userId: number, status?: string): Promise<Campaign[]> {
    let query = `SELECT * FROM campaigns 
                 WHERE user_id = ? OR team_id IN (SELECT team_id FROM team_members WHERE user_id = ? AND is_active = TRUE)`;
    const params: any[] = [userId, userId];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows.map(row => this.mapRowToCampaign(row));
  }

  async findByTeam(teamId: number, status?: string): Promise<Campaign[]> {
    let query = 'SELECT * FROM campaigns WHERE team_id = ?';
    const params: any[] = [teamId];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows.map(row => this.mapRowToCampaign(row));
  }

  async update(id: number, updates: Partial<Campaign>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.campaign_type !== undefined) {
      fields.push('campaign_type = ?');
      values.push(updates.campaign_type);
    }
    if (updates.start_date !== undefined) {
      fields.push('start_date = ?');
      values.push(updates.start_date);
    }
    if (updates.end_date !== undefined) {
      fields.push('end_date = ?');
      values.push(updates.end_date);
    }
    if (updates.budget !== undefined) {
      fields.push('budget = ?');
      values.push(updates.budget);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.goals !== undefined) {
      fields.push('goals = ?');
      values.push(JSON.stringify(updates.goals));
    }

    if (fields.length === 0) return false;

    values.push(id);
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE campaigns SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM campaigns WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  private mapRowToCampaign(row: RowDataPacket): Campaign {
    return {
      id: row.id,
      team_id: row.team_id,
      user_id: row.user_id,
      name: row.name,
      description: row.description,
      campaign_type: row.campaign_type,
      start_date: row.start_date,
      end_date: row.end_date,
      budget: row.budget ? parseFloat(row.budget) : undefined,
      status: row.status,
      goals: row.goals ? (typeof row.goals === 'string' ? JSON.parse(row.goals) : row.goals) : undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

class CampaignPostModel {
  async create(campaignPost: CampaignPost): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO campaign_posts (campaign_id, post_id, variant_type, scheduled_at, published_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        campaignPost.campaign_id,
        campaignPost.post_id,
        campaignPost.variant_type || 'control',
        campaignPost.scheduled_at || null,
        campaignPost.published_at || null,
      ]
    );
    return result.insertId;
  }

  async findByCampaign(campaignId: number): Promise<CampaignPost[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM campaign_posts WHERE campaign_id = ? ORDER BY created_at DESC',
      [campaignId]
    );
    return rows.map(row => this.mapRowToCampaignPost(row));
  }

  async findByPost(postId: number): Promise<CampaignPost | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM campaign_posts WHERE post_id = ?',
      [postId]
    );
    if (rows.length === 0) return null;
    return this.mapRowToCampaignPost(rows[0]);
  }

  private mapRowToCampaignPost(row: RowDataPacket): CampaignPost {
    return {
      id: row.id,
      campaign_id: row.campaign_id,
      post_id: row.post_id,
      variant_type: row.variant_type,
      scheduled_at: row.scheduled_at,
      published_at: row.published_at,
      created_at: row.created_at,
    };
  }
}

class CampaignMetricModel {
  async createOrUpdate(metric: CampaignMetric): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO campaign_metrics (
        campaign_id, date, impressions, reach, clicks, engagements, likes, comments, shares,
        followers_gained, conversions, revenue, spend
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        impressions = VALUES(impressions),
        reach = VALUES(reach),
        clicks = VALUES(clicks),
        engagements = VALUES(engagements),
        likes = VALUES(likes),
        comments = VALUES(comments),
        shares = VALUES(shares),
        followers_gained = VALUES(followers_gained),
        conversions = VALUES(conversions),
        revenue = VALUES(revenue),
        spend = VALUES(spend),
        updated_at = NOW()`,
      [
        metric.campaign_id,
        metric.date,
        metric.impressions || 0,
        metric.reach || 0,
        metric.clicks || 0,
        metric.engagements || 0,
        metric.likes || 0,
        metric.comments || 0,
        metric.shares || 0,
        metric.followers_gained || 0,
        metric.conversions || 0,
        metric.revenue || 0,
        metric.spend || 0,
      ]
    );
    return result.insertId;
  }

  async findByCampaign(campaignId: number, startDate?: Date, endDate?: Date): Promise<CampaignMetric[]> {
    let query = 'SELECT * FROM campaign_metrics WHERE campaign_id = ?';
    const params: any[] = [campaignId];
    
    if (startDate) {
      query += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND date <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY date ASC';
    
    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows.map(row => this.mapRowToMetric(row));
  }

  async getAggregatedMetrics(campaignId: number): Promise<any> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        SUM(impressions) as total_impressions,
        SUM(reach) as total_reach,
        SUM(clicks) as total_clicks,
        SUM(engagements) as total_engagements,
        SUM(likes) as total_likes,
        SUM(comments) as total_comments,
        SUM(shares) as total_shares,
        SUM(followers_gained) as total_followers_gained,
        SUM(conversions) as total_conversions,
        SUM(revenue) as total_revenue,
        SUM(spend) as total_spend,
        AVG(CASE WHEN impressions > 0 THEN (engagements / impressions) * 100 ELSE 0 END) as avg_engagement_rate,
        AVG(CASE WHEN reach > 0 THEN (clicks / reach) * 100 ELSE 0 END) as avg_ctr
       FROM campaign_metrics
       WHERE campaign_id = ?`,
      [campaignId]
    );
    return rows[0] || {};
  }

  private mapRowToMetric(row: RowDataPacket): CampaignMetric {
    return {
      id: row.id,
      campaign_id: row.campaign_id,
      date: row.date,
      impressions: row.impressions,
      reach: row.reach,
      clicks: row.clicks,
      engagements: row.engagements,
      likes: row.likes,
      comments: row.comments,
      shares: row.shares,
      followers_gained: row.followers_gained,
      conversions: row.conversions,
      revenue: row.revenue ? parseFloat(row.revenue) : 0,
      spend: row.spend ? parseFloat(row.spend) : 0,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

class ABTestGroupModel {
  async create(group: ABTestGroup): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO ab_test_groups (campaign_id, name, description, variant_type, traffic_percentage, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        group.campaign_id,
        group.name,
        group.description || null,
        group.variant_type,
        group.traffic_percentage || 33.33,
        group.is_active !== undefined ? group.is_active : true,
      ]
    );
    return result.insertId;
  }

  async findByCampaign(campaignId: number): Promise<ABTestGroup[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM ab_test_groups WHERE campaign_id = ? ORDER BY variant_type',
      [campaignId]
    );
    return rows.map(row => this.mapRowToGroup(row));
  }

  private mapRowToGroup(row: RowDataPacket): ABTestGroup {
    return {
      id: row.id,
      campaign_id: row.campaign_id,
      name: row.name,
      description: row.description,
      variant_type: row.variant_type,
      traffic_percentage: parseFloat(row.traffic_percentage),
      is_active: row.is_active,
      created_at: row.created_at,
    };
  }
}

export const campaignModel = new CampaignModel();
export const campaignPostModel = new CampaignPostModel();
export const campaignMetricModel = new CampaignMetricModel();
export const abTestGroupModel = new ABTestGroupModel();

