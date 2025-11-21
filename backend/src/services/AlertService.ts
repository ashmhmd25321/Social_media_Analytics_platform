import { alertModel, Alert, notificationModel, Notification } from '../models/Report';
import { analyticsService } from './AnalyticsService';
import { UserSocialAccountModelInstance } from '../models/SocialPlatform';
import { pool } from '../config/database';
import { RowDataPacket } from 'mysql2/promise';

class AlertService {
  /**
   * Check all active alerts for a user
   */
  async checkAlerts(userId: number): Promise<void> {
    const alerts = await alertModel.findByUser(userId, true);

    for (const alert of alerts) {
      await this.checkAlert(alert);
    }
  }

  /**
   * Check a specific alert
   */
  async checkAlert(alert: Alert): Promise<boolean> {
    if (!alert.is_active) {
      return false;
    }

    try {
      const currentValue = await this.getMetricValue(alert);
      const shouldTrigger = this.evaluateCondition(
        currentValue,
        alert.threshold_value,
        alert.condition_type
      );

      if (shouldTrigger) {
        await this.triggerAlert(alert, currentValue);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error checking alert ${alert.id}:`, error);
      return false;
    }
  }

  /**
   * Get current metric value for an alert
   */
  private async getMetricValue(alert: Alert): Promise<number> {
    const userId = alert.user_id;

    switch (alert.metric_type) {
      case 'followers':
        const overview = await analyticsService.getOverviewMetrics(userId);
        return overview.totalFollowers;

      case 'engagement_rate':
        const overview2 = await analyticsService.getOverviewMetrics(userId);
        return overview2.averageEngagementRate;

      case 'engagement':
        const overview3 = await analyticsService.getOverviewMetrics(userId);
        return overview3.totalEngagement;

      case 'posts':
        const overview4 = await analyticsService.getOverviewMetrics(userId);
        return overview4.totalPosts;

      default:
        throw new Error(`Unknown metric type: ${alert.metric_type}`);
    }
  }

  /**
   * Evaluate alert condition
   */
  private evaluateCondition(
    currentValue: number,
    threshold: number,
    conditionType: string
  ): boolean {
    switch (conditionType) {
      case 'greater_than':
        return currentValue > threshold;
      case 'less_than':
        return currentValue < threshold;
      case 'equals':
        return Math.abs(currentValue - threshold) < 0.01;
      case 'percentage_change':
        // This would require previous value tracking
        return false;
      default:
        return false;
    }
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(alert: Alert, currentValue: number): Promise<void> {
    // Update alert
    await alertModel.update(alert.id!, alert.user_id, {
      last_triggered_at: new Date(),
      trigger_count: (alert.trigger_count || 0) + 1,
    });

    // Record trigger
    await pool.execute(
      `INSERT INTO alert_triggers (alert_id, triggered_at, metric_value, threshold_value, context)
       VALUES (?, NOW(), ?, ?, ?)`,
      [
        alert.id,
        currentValue,
        alert.threshold_value,
        JSON.stringify({
          metric_type: alert.metric_type,
          condition_type: alert.condition_type,
        }),
      ]
    );

    // Send notifications
    for (const channel of alert.notification_channels) {
      if (channel === 'in_app') {
        await this.createInAppNotification(alert, currentValue);
      } else if (channel === 'email') {
        // TODO: Implement email notification
        console.log(`Email notification for alert ${alert.id} (not implemented yet)`);
      }
    }
  }

  /**
   * Create in-app notification
   */
  private async createInAppNotification(alert: Alert, currentValue: number): Promise<void> {
    const message = this.getAlertMessage(alert, currentValue);

    await notificationModel.create({
      user_id: alert.user_id,
      type: 'alert',
      title: alert.name,
      message: message,
      icon: this.getAlertIcon(alert.alert_type),
      link: '/settings/alerts',
      metadata: {
        alert_id: alert.id,
        metric_type: alert.metric_type,
        current_value: currentValue,
        threshold_value: alert.threshold_value,
      },
    });
  }

  /**
   * Get alert message
   */
  private getAlertMessage(alert: Alert, currentValue: number): string {
    const metricName = alert.metric_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    const threshold = alert.threshold_value;

    switch (alert.condition_type) {
      case 'greater_than':
        return `${metricName} has reached ${currentValue.toLocaleString()}, exceeding your threshold of ${threshold.toLocaleString()}.`;
      case 'less_than':
        return `${metricName} has dropped to ${currentValue.toLocaleString()}, below your threshold of ${threshold.toLocaleString()}.`;
      case 'equals':
        return `${metricName} has reached ${currentValue.toLocaleString()}, matching your threshold.`;
      default:
        return `${metricName} is currently ${currentValue.toLocaleString()}.`;
    }
  }

  /**
   * Get alert icon
   */
  private getAlertIcon(alertType: string): string {
    switch (alertType) {
      case 'follower_milestone':
        return 'users';
      case 'engagement_drop':
        return 'trending-down';
      case 'engagement_spike':
        return 'trending-up';
      case 'new_post':
        return 'file-text';
      default:
        return 'bell';
    }
  }

  /**
   * Create an alert
   */
  async createAlert(alert: Alert): Promise<number> {
    return await alertModel.create(alert);
  }

  /**
   * Get user's alerts
   */
  async getUserAlerts(userId: number, isActive?: boolean): Promise<Alert[]> {
    return await alertModel.findByUser(userId, isActive);
  }

  /**
   * Update an alert
   */
  async updateAlert(alertId: number, userId: number, updates: Partial<Alert>): Promise<boolean> {
    return await alertModel.update(alertId, userId, updates);
  }

  /**
   * Delete an alert
   */
  async deleteAlert(alertId: number, userId: number): Promise<boolean> {
    return await alertModel.delete(alertId, userId);
  }
}

export const alertService = new AlertService();

