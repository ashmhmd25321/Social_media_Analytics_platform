import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../config/database';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  role: 'admin' | 'user' | 'viewer';
  is_email_verified: boolean;
  email_verification_token?: string;
  email_verification_expires?: Date;
  password_reset_token?: string;
  password_reset_expires?: Date;
  profile_picture_url?: string;
  phone?: string;
  timezone: string;
  created_at: Date;
  updated_at: Date;
  last_login_at?: Date;
  is_active: boolean;
}

export interface UserPreferences {
  id: number;
  user_id: number;
  notification_email: boolean;
  notification_push: boolean;
  notification_sms: boolean;
  email_digest_frequency: 'daily' | 'weekly' | 'monthly' | 'never';
  preferred_language: string;
  theme: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserData {
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  role?: 'admin' | 'user' | 'viewer';
}

export interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  timezone?: string;
  profile_picture_url?: string;
}

export class UserModel {
  // Find user by email
  static async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows.length > 0 ? (rows[0] as User) : null;
  }

  // Find user by ID
  static async findById(id: number): Promise<User | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id, email, first_name, last_name, role, is_email_verified, profile_picture_url, phone, timezone, created_at, updated_at, last_login_at, is_active FROM users WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? (rows[0] as User) : null;
  }

  // Create new user
  static async create(userData: CreateUserData): Promise<User> {
    const { email, password_hash, first_name, last_name, role = 'user' } = userData;
    
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO users (email, password_hash, first_name, last_name, role) 
       VALUES (?, ?, ?, ?, ?)`,
      [email, password_hash, first_name || null, last_name || null, role]
    );

    const user = await this.findById(result.insertId);
    if (!user) {
      throw new Error('Failed to create user');
    }
    return user;
  }

  // Update user
  static async update(id: number, userData: UpdateUserData): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(userData).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      return await this.findById(id);
    }

    values.push(id);
    await pool.execute(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return await this.findById(id);
  }

  // Update email verification status
  static async verifyEmail(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE users 
       SET is_email_verified = TRUE, 
           email_verification_token = NULL, 
           email_verification_expires = NULL 
       WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }

  // Set email verification token
  static async setEmailVerificationToken(
    id: number,
    token: string,
    expiresAt: Date
  ): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE users 
       SET email_verification_token = ?, 
           email_verification_expires = ? 
       WHERE id = ?`,
      [token, expiresAt, id]
    );
    return result.affectedRows > 0;
  }

  // Find user by email verification token
  static async findByEmailVerificationToken(token: string): Promise<User | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM users 
       WHERE email_verification_token = ? 
       AND email_verification_expires > NOW()`,
      [token]
    );
    return rows.length > 0 ? (rows[0] as User) : null;
  }

  // Set password reset token
  static async setPasswordResetToken(
    id: number,
    token: string,
    expiresAt: Date
  ): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE users 
       SET password_reset_token = ?, 
           password_reset_expires = ? 
       WHERE id = ?`,
      [token, expiresAt, id]
    );
    return result.affectedRows > 0;
  }

  // Find user by password reset token
  static async findByPasswordResetToken(token: string): Promise<User | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM users 
       WHERE password_reset_token = ? 
       AND password_reset_expires > NOW()`,
      [token]
    );
    return rows.length > 0 ? (rows[0] as User) : null;
  }

  // Update password
  static async updatePassword(id: number, passwordHash: string): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE users 
       SET password_hash = ?, 
           password_reset_token = NULL, 
           password_reset_expires = NULL 
       WHERE id = ?`,
      [passwordHash, id]
    );
    return result.affectedRows > 0;
  }

  // Update last login
  static async updateLastLogin(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE users SET last_login_at = NOW() WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  // Get user preferences
  static async getPreferences(userId: number): Promise<UserPreferences | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM user_preferences WHERE user_id = ?',
      [userId]
    );
    return rows.length > 0 ? (rows[0] as UserPreferences) : null;
  }

  // Create or update user preferences
  static async savePreferences(
    userId: number,
    preferences: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    const existing = await this.getPreferences(userId);

    if (existing) {
      const fields: string[] = [];
      const values: any[] = [];

      Object.entries(preferences).forEach(([key, value]) => {
        if (key !== 'id' && key !== 'user_id' && value !== undefined) {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      });

      if (fields.length > 0) {
        values.push(userId);
        await pool.execute(
          `UPDATE user_preferences SET ${fields.join(', ')} WHERE user_id = ?`,
          values
        );
      }

      return (await this.getPreferences(userId))!;
    } else {
      const {
        notification_email = true,
        notification_push = true,
        notification_sms = false,
        email_digest_frequency = 'weekly',
        preferred_language = 'en',
        theme = 'light',
      } = preferences;

      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO user_preferences 
         (user_id, notification_email, notification_push, notification_sms, 
          email_digest_frequency, preferred_language, theme) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          notification_email,
          notification_push,
          notification_sms,
          email_digest_frequency,
          preferred_language,
          theme,
        ]
      );

      const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT * FROM user_preferences WHERE id = ?',
        [result.insertId]
      );
      return rows[0] as UserPreferences;
    }
  }
}

