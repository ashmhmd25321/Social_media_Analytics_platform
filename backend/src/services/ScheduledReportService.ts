import { scheduledReportModel, reportTemplateModel, reportModel } from '../models/Report';
import { reportGenerationService } from './ReportGenerationService';
import { emailService } from './EmailService';
import { ScheduledReport } from '../models/Report';

class ScheduledReportService {
  /**
   * Calculate next generation time based on schedule type
   */
  calculateNextGeneration(scheduleType: string, scheduleConfig: any): Date {
    const now = new Date();
    const next = new Date(now);

    switch (scheduleType) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        next.setHours(scheduleConfig.hour || 8, scheduleConfig.minute || 0, 0, 0);
        break;
      case 'weekly':
        const daysUntilNext = (scheduleConfig.dayOfWeek || 1) - now.getDay();
        next.setDate(next.getDate() + (daysUntilNext <= 0 ? daysUntilNext + 7 : daysUntilNext));
        next.setHours(scheduleConfig.hour || 8, scheduleConfig.minute || 0, 0, 0);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        next.setDate(scheduleConfig.dayOfMonth || 1);
        next.setHours(scheduleConfig.hour || 8, scheduleConfig.minute || 0, 0, 0);
        break;
      default:
        next.setDate(next.getDate() + 1);
    }

    return next;
  }

  /**
   * Process due scheduled reports
   */
  async processDueReports(): Promise<void> {
    try {
      const dueReports = await scheduledReportModel.findDueReports();
      console.log(`📊 Found ${dueReports.length} scheduled reports due for generation`);

      for (const scheduledReport of dueReports) {
        try {
          await this.generateScheduledReport(scheduledReport);
        } catch (error) {
          console.error(`Error generating scheduled report ${scheduledReport.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error processing scheduled reports:', error);
    }
  }

  /**
   * Generate a scheduled report
   */
  async generateScheduledReport(scheduledReport: ScheduledReport): Promise<void> {
    const template = await reportTemplateModel.findById(scheduledReport.report_template_id);
    if (!template) {
      throw new Error(`Template ${scheduledReport.report_template_id} not found`);
    }

    // Calculate date range based on schedule type
    const dateRange = this.calculateDateRange(scheduledReport.schedule_type);
    
    // Create report from template
    const reportId = await reportModel.create({
      user_id: scheduledReport.user_id,
      title: `${template.name} - ${new Date().toLocaleDateString()}`,
      description: `Automated report generated on ${new Date().toISOString()}`,
      report_type: template.report_type,
      template_id: scheduledReport.report_template_id,
      date_range_start: dateRange.start,
      date_range_end: dateRange.end,
      format: scheduledReport.format,
      status: 'draft',
      metadata: template.config,
    });

    // Generate the report
    const report = await reportGenerationService.generateReport(reportId, scheduledReport.user_id);

    // Update scheduled report
    const nextGeneration = this.calculateNextGeneration(
      scheduledReport.schedule_type,
      scheduledReport.schedule_config
    );

    await scheduledReportModel.update(scheduledReport.id!, scheduledReport.user_id, {
      last_generated_at: new Date(),
      next_generation_at: nextGeneration,
    });

    // Send email notifications to recipients
    if (scheduledReport.recipients.length > 0) {
      await this.sendEmailNotifications(scheduledReport, report);
    }

    console.log(`✅ Generated scheduled report ${reportId} for user ${scheduledReport.user_id}`);
  }

  /**
   * Calculate date range for scheduled report
   */
  private calculateDateRange(scheduleType: string): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();

    switch (scheduleType) {
      case 'daily':
        start.setDate(start.getDate() - 1);
        break;
      case 'weekly':
        start.setDate(start.getDate() - 7);
        break;
      case 'monthly':
        start.setMonth(start.getMonth() - 1);
        break;
      default:
        start.setDate(start.getDate() - 30);
    }

    return { start, end };
  }

  /**
   * Send email notifications
   */
  private async sendEmailNotifications(
    scheduledReport: ScheduledReport,
    report: any
  ): Promise<void> {
    try {
      await emailService.sendReportEmail(
        scheduledReport.recipients,
        report.title,
        report.file_path
      );
    } catch (error) {
      console.error('Error sending email notifications:', error);
    }
  }
}

export const scheduledReportService = new ScheduledReportService();

