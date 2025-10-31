import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { UserModel, UpdateUserData } from '../models/User';

export class UserController {
  /**
   * Update user profile
   */
  static async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { first_name, last_name, phone, timezone } = req.body;
      const updateData: UpdateUserData = {};

      if (first_name !== undefined) updateData.first_name = first_name;
      if (last_name !== undefined) updateData.last_name = last_name;
      if (phone !== undefined) updateData.phone = phone;
      if (timezone !== undefined) updateData.timezone = timezone;

      const updatedUser = await UserModel.update(req.user.userId, updateData);

      if (!updatedUser) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            first_name: updatedUser.first_name,
            last_name: updatedUser.last_name,
            phone: updatedUser.phone,
            timezone: updatedUser.timezone,
            profile_picture_url: updatedUser.profile_picture_url,
          },
        },
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Update user preferences
   */
  static async updatePreferences(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const {
        notification_email,
        notification_push,
        notification_sms,
        email_digest_frequency,
        preferred_language,
        theme,
      } = req.body;

      const preferences = await UserModel.savePreferences(req.user.userId, {
        notification_email,
        notification_push,
        notification_sms,
        email_digest_frequency,
        preferred_language,
        theme,
      });

      res.json({
        success: true,
        message: 'Preferences updated successfully',
        data: {
          preferences,
        },
      });
    } catch (error) {
      console.error('Update preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Get user preferences
   */
  static async getPreferences(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const preferences = await UserModel.getPreferences(req.user.userId);

      res.json({
        success: true,
        data: {
          preferences: preferences || null,
        },
      });
    } catch (error) {
      console.error('Get preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}

