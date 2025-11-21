import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export interface DataCollectionJob {
  id?: number;
  user_id: number;
  account_id: number;
  job_type: 'full_sync' | 'incremental_sync' | 'manual_sync' | 'scheduled_sync';
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  platform_type: string;
  items_collected?: number;
  items_updated?: number;
  items_failed?: number;
  error_message?: string;
  started_at?: Date;
  completed_at?: Date;
  duration_seconds?: number;
  metadata?: Record<string, any>;
  created_at?: Date;
}

export interface ApiRateLimit {
  id?: number;
  account_id: number;
  platform_type: string;
  endpoint: string;
  requests_made?: number;
  requests_limit?: number;
  window_start: Date;
  window_end: Date;
  reset_at: Date;
  created_at?: Date;
  updated_at?: Date;
}

class DataCollectionJobModel {
  // Create a new job
  async create(job: DataCollectionJob): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO data_collection_jobs (
        user_id, account_id, job_type, status, platform_type, metadata
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        job.user_id,
        job.account_id,
        job.job_type,
        job.status || 'pending',
        job.platform_type,
        job.metadata ? JSON.stringify(job.metadata) : null,
      ]
    );
    return result.insertId;
  }

  // Update job status
  async updateStatus(
    jobId: number,
    status: DataCollectionJob['status'],
    updates?: Partial<Pick<DataCollectionJob, 'items_collected' | 'items_updated' | 'items_failed' | 'error_message' | 'duration_seconds'>>
  ): Promise<void> {
    const setParts: string[] = ['status = ?'];
    const values: any[] = [status];

    if (status === 'running') {
      setParts.push('started_at = CURRENT_TIMESTAMP');
    }

    if (status === 'completed' || status === 'failed') {
      setParts.push('completed_at = CURRENT_TIMESTAMP');
      if (updates?.duration_seconds) {
        setParts.push('duration_seconds = ?');
        values.push(updates.duration_seconds);
      }
    }

    if (updates?.items_collected !== undefined) {
      setParts.push('items_collected = ?');
      values.push(updates.items_collected);
    }

    if (updates?.items_updated !== undefined) {
      setParts.push('items_updated = ?');
      values.push(updates.items_updated);
    }

    if (updates?.items_failed !== undefined) {
      setParts.push('items_failed = ?');
      values.push(updates.items_failed);
    }

    if (updates?.error_message !== undefined) {
      setParts.push('error_message = ?');
      values.push(updates.error_message);
    }

    values.push(jobId);

    await pool.execute(
      `UPDATE data_collection_jobs SET ${setParts.join(', ')} WHERE id = ?`,
      values
    );
  }

  // Get job by ID
  async findById(jobId: number): Promise<DataCollectionJob | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM data_collection_jobs WHERE id = ?',
      [jobId]
    );
    return rows.length > 0 ? (rows[0] as DataCollectionJob) : null;
  }

  // Get jobs by account
  async findByAccount(accountId: number, limit: number = 50): Promise<DataCollectionJob[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM data_collection_jobs 
       WHERE account_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [accountId, limit]
    );
    return rows as DataCollectionJob[];
  }
}

class ApiRateLimitModel {
  // Get or create rate limit record
  async getOrCreate(rateLimit: ApiRateLimit): Promise<ApiRateLimit> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM api_rate_limits 
       WHERE account_id = ? AND platform_type = ? AND endpoint = ? 
       AND reset_at > CURRENT_TIMESTAMP
       ORDER BY reset_at DESC 
       LIMIT 1`,
      [rateLimit.account_id, rateLimit.platform_type, rateLimit.endpoint]
    );

    if (rows.length > 0) {
      return rows[0] as ApiRateLimit;
    }

    // Create new record
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO api_rate_limits (
        account_id, platform_type, endpoint, requests_made, requests_limit,
        window_start, window_end, reset_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        rateLimit.account_id,
        rateLimit.platform_type,
        rateLimit.endpoint,
        rateLimit.requests_made || 0,
        rateLimit.requests_limit || 0,
        rateLimit.window_start,
        rateLimit.window_end,
        rateLimit.reset_at,
      ]
    );

    return {
      ...rateLimit,
      id: result.insertId,
    };
  }

  // Update rate limit
  async update(rateLimitId: number, requestsMade: number): Promise<void> {
    await pool.execute(
      'UPDATE api_rate_limits SET requests_made = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [requestsMade, rateLimitId]
    );
  }

  // Check if rate limit is available
  async canMakeRequest(accountId: number, platformType: string, endpoint: string): Promise<boolean> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM api_rate_limits 
       WHERE account_id = ? AND platform_type = ? AND endpoint = ? 
       AND reset_at > CURRENT_TIMESTAMP
       ORDER BY reset_at DESC 
       LIMIT 1`,
      [accountId, platformType, endpoint]
    );

    if (rows.length === 0) {
      return true; // No rate limit record, assume available
    }

    const rateLimit = rows[0] as ApiRateLimit;
    return (rateLimit.requests_made || 0) < (rateLimit.requests_limit || 0);
  }
}

export const dataCollectionJobModel = new DataCollectionJobModel();
export const apiRateLimitModel = new ApiRateLimitModel();

