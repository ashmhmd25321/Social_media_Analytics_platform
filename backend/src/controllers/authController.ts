import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { UserModel } from '../models/User';
import { hashPassword, comparePassword, generateToken } from '../utils/password';
import { generateTokenPair } from '../utils/jwt';
import { pool } from '../config/database';

export class AuthController {
  /**
   * Register a new user
   */
  static async register(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, password, first_name, last_name } = req.body;

      // Check if user already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'User with this email already exists',
        });
        return;
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user
      const user = await UserModel.create({
        email,
        password_hash: passwordHash,
        first_name,
        last_name,
      });

      // Generate email verification token
      const verificationToken = generateToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

      await UserModel.setEmailVerificationToken(
        user.id,
        verificationToken,
        expiresAt
      );

      // Generate tokens
      const tokens = generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Auto-connect default platform accounts (non-blocking)
      import('../services/AutoConnectService').then(({ AutoConnectService }) => {
        AutoConnectService.autoConnectPlatformsForUser(user.id).catch(err => {
          console.error('Error auto-connecting platforms:', err);
        });
      });

      // TODO: Send verification email with verificationToken
      // For now, we'll include it in the response (remove in production)
      console.log('Email verification token:', verificationToken);

      res.status(201).json({
        success: true,
        message: 'User registered successfully. Please verify your email.',
        data: {
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            is_email_verified: user.is_email_verified,
          },
          tokens,
          // Remove this in production - only for development
          verificationToken: process.env.NODE_ENV === 'development' ? verificationToken : undefined,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Login user
   */
  static async login(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await UserModel.findByEmail(email);
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
        return;
      }

      // Check if user is active
      if (!user.is_active) {
        res.status(403).json({
          success: false,
          message: 'Account is deactivated',
        });
        return;
      }

      // Verify password
      const isValidPassword = await comparePassword(password, user.password_hash);
      if (!isValidPassword) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
        return;
      }

      // Update last login
      await UserModel.updateLastLogin(user.id);

      // Generate tokens
      const tokens = generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            is_email_verified: user.is_email_verified,
            profile_picture_url: user.profile_picture_url,
          },
          tokens,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const user = await UserModel.findById(req.user.userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      const preferences = await UserModel.getPreferences(user.id);

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            is_email_verified: user.is_email_verified,
            profile_picture_url: user.profile_picture_url,
            phone: user.phone,
            timezone: user.timezone,
            created_at: user.created_at,
            last_login_at: user.last_login_at,
          },
          preferences: preferences || null,
        },
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Verify email
   */
  static async verifyEmail(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({
          success: false,
          message: 'Verification token is required',
        });
        return;
      }

      const user = await UserModel.findByEmailVerificationToken(token);
      if (!user) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired verification token',
        });
        return;
      }

      await UserModel.verifyEmail(user.id);

      res.json({
        success: true,
        message: 'Email verified successfully',
      });
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      const user = await UserModel.findByEmail(email);
      if (!user) {
        // Don't reveal if email exists (security best practice)
        res.json({
          success: true,
          message: 'If an account exists with this email, a password reset link has been sent',
        });
        return;
      }

      const resetToken = generateToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour

      await UserModel.setPasswordResetToken(user.id, resetToken, expiresAt);

      // TODO: Send password reset email with resetToken
      console.log('Password reset token:', resetToken);

      res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent',
        // Remove this in production - only for development
        resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
      });
    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { token, password } = req.body;

      const user = await UserModel.findByPasswordResetToken(token);
      if (!user) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token',
        });
        return;
      }

      const passwordHash = await hashPassword(password);
      await UserModel.updatePassword(user.id, passwordHash);

      res.json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(req: AuthRequest, res: Response): Promise<void> {
    try {
      // This is a simplified version - in production, validate refresh token from database
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token is required',
        });
        return;
      }

      // Verify refresh token (same secret as access token)
      const { verifyToken } = require('../utils/jwt');
      const decoded = verifyToken(refreshToken);

      // Generate new access token
      const { generateAccessToken } = require('../utils/jwt');
      const newAccessToken = generateAccessToken({
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      });

      res.json({
        success: true,
        data: {
          accessToken: newAccessToken,
        },
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }
  }
}

