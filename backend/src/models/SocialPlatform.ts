import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export interface SocialPlatform {
  id?: number;
  name: string;
  display_name: string;
  icon_url?: string;
  api_base_url?: string;
  oauth_auth_url?: string;
  oauth_token_url?: string;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserSocialAccount {
  id?: number;
  user_id: number;
  platform_id: number;
  platform_account_id: string;
  platform_username?: string;
  platform_display_name?: string;
  access_token: string;
  refresh_token?: string;
  token_expires_at?: Date;
  token_refresh_expires_at?: Date;
  profile_picture_url?: string;
  account_status?: 'connected' | 'disconnected' | 'expired' | 'error';
  is_active?: boolean;
  last_synced_at?: Date;
  metadata?: Record<string, any>;
  created_at?: Date;
  updated_at?: Date;
}

export interface OAuthState {
  id?: number;
  user_id: number;
  platform_id: number;
  state_token: string;
  redirect_uri?: string;
  expires_at: Date;
  created_at?: Date;
}

class SocialPlatformModel {
  async findAll(): Promise<SocialPlatform[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM social_platforms WHERE is_active = TRUE ORDER BY display_name'
    );
    return rows as SocialPlatform[];
  }

  async findById(id: number): Promise<SocialPlatform | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM social_platforms WHERE id = ?',
      [id]
    );
    return (rows[0] as SocialPlatform) || null;
  }

  async findByName(name: string): Promise<SocialPlatform | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM social_platforms WHERE name = ?',
      [name]
    );
    return (rows[0] as SocialPlatform) || null;
  }
}

class UserSocialAccountModel {
  async create(account: UserSocialAccount): Promise<UserSocialAccount> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO user_social_accounts 
       (user_id, platform_id, platform_account_id, platform_username, platform_display_name, 
        access_token, refresh_token, token_expires_at, token_refresh_expires_at, 
        profile_picture_url, account_status, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        account.user_id,
        account.platform_id,
        account.platform_account_id,
        account.platform_username || null,
        account.platform_display_name || null,
        account.access_token,
        account.refresh_token || null,
        account.token_expires_at || null,
        account.token_refresh_expires_at || null,
        account.profile_picture_url || null,
        account.account_status || 'connected',
        account.metadata ? JSON.stringify(account.metadata) : null,
      ]
    );
    return { ...account, id: result.insertId };
  }

  async findById(accountId: number): Promise<UserSocialAccount | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT usa.*, sp.name as platform_name, sp.display_name as platform_display_name, sp.name as platform_type
       FROM user_social_accounts usa
       JOIN social_platforms sp ON usa.platform_id = sp.id
       WHERE usa.id = ?`,
      [accountId]
    );
    return rows.length > 0 ? (rows[0] as UserSocialAccount) : null;
  }

  async findByUserId(userId: number): Promise<UserSocialAccount[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT usa.*, sp.name as platform_name, sp.display_name as platform_display_name, sp.icon_url as platform_icon
       FROM user_social_accounts usa
       JOIN social_platforms sp ON usa.platform_id = sp.id
       WHERE usa.user_id = ? AND usa.is_active = TRUE
       ORDER BY usa.created_at DESC`,
      [userId]
    );
    return rows as UserSocialAccount[];
  }

  async findByUserIdAndPlatform(
    userId: number,
    platformId: number
  ): Promise<UserSocialAccount | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT usa.*, sp.name as platform_name, sp.display_name as platform_display_name
       FROM user_social_accounts usa
       JOIN social_platforms sp ON usa.platform_id = sp.id
       WHERE usa.user_id = ? AND usa.platform_id = ? AND usa.is_active = TRUE`,
      [userId, platformId]
    );
    return (rows[0] as UserSocialAccount) || null;
  }

  async update(id: number, updates: Partial<UserSocialAccount>): Promise<boolean> {
    let fields = Object.keys(updates)
      .filter((key) => key !== 'id' && key !== 'metadata')
      .map((key) => `${key} = ?`)
      .join(', ');
    
    let values: any[] = Object.entries(updates)
      .filter(([key]) => key !== 'id' && key !== 'metadata')
      .map(([, value]) => value);

    if (updates.metadata !== undefined) {
      if (fields) {
        fields += ', metadata = ?';
      } else {
        fields = 'metadata = ?';
      }
      values.push(JSON.stringify(updates.metadata));
    }

    if (!fields) {
      return false;
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE user_social_accounts SET ${fields} WHERE id = ?`,
      [...values, id]
    );
    return result.affectedRows > 0;
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE user_social_accounts SET is_active = FALSE, account_status = "disconnected" WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  async updateLastSynced(accountId: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE user_social_accounts SET last_synced_at = NOW() WHERE id = ?',
      [accountId]
    );
    return result.affectedRows > 0;
  }
}

class OAuthStateModel {
  async create(state: OAuthState): Promise<OAuthState> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO oauth_states (user_id, platform_id, state_token, redirect_uri, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        state.user_id,
        state.platform_id,
        state.state_token,
        state.redirect_uri || null,
        state.expires_at,
      ]
    );
    return { ...state, id: result.insertId };
  }

  async findByToken(token: string): Promise<OAuthState | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM oauth_states WHERE state_token = ? AND expires_at > NOW()',
      [token]
    );
    return (rows[0] as OAuthState) || null;
  }

  async delete(token: string): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM oauth_states WHERE state_token = ?',
      [token]
    );
    return result.affectedRows > 0;
  }

  async cleanupExpired(): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM oauth_states WHERE expires_at < NOW()'
    );
    return result.affectedRows;
  }
}

export const SocialPlatformModelInstance = new SocialPlatformModel();
export const UserSocialAccountModelInstance = new UserSocialAccountModel();
export const OAuthStateModelInstance = new OAuthStateModel();

export default {
  platform: SocialPlatformModelInstance,
  account: UserSocialAccountModelInstance,
  oauthState: OAuthStateModelInstance,
};

