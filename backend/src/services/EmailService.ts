/**
 * Email Service
 * 
 * This service handles sending emails for notifications, reports, and alerts.
 * 
 * To enable email functionality, install a package like:
 * - nodemailer (for SMTP)
 * - @sendgrid/mail (for SendGrid)
 * - aws-sdk (for AWS SES)
 * 
 * Then configure the service with your credentials and uncomment the implementation.
 */

interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer | string;
  }>;
}

class EmailService {
  private isConfigured = false;

  /**
   * Initialize email service
   * Call this with your email provider configuration
   */
  initialize(config: any): void {
    // TODO: Initialize email provider (nodemailer, SendGrid, etc.)
    // Example with nodemailer:
    // const nodemailer = require('nodemailer');
    // this.transporter = nodemailer.createTransport({
    //   host: config.host,
    //   port: config.port,
    //   secure: config.secure,
    //   auth: {
    //     user: config.user,
    //     pass: config.pass,
    //   },
    // });
    this.isConfigured = true;
    console.log('📧 Email service initialized (placeholder)');
  }

  /**
   * Send an email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured) {
      console.log('📧 Email service not configured. Would send email:', {
        to: options.to,
        subject: options.subject,
      });
      return false;
    }

    try {
      // TODO: Implement actual email sending
      // Example:
      // await this.transporter.sendMail({
      //   from: process.env.EMAIL_FROM,
      //   to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      //   subject: options.subject,
      //   html: options.html,
      //   text: options.text,
      //   attachments: options.attachments,
      // });
      
      console.log('📧 Email sent:', options.subject, 'to', options.to);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Send alert notification email
   */
  async sendAlertNotification(
    email: string,
    alertName: string,
    message: string,
    metricValue: number
  ): Promise<boolean> {
    const html = `
      <h2>Alert: ${alertName}</h2>
      <p>${message}</p>
      <p><strong>Current Value:</strong> ${metricValue}</p>
      <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings/alerts">View Alerts</a></p>
    `;

    return await this.sendEmail({
      to: email,
      subject: `Alert: ${alertName}`,
      html,
      text: `${alertName}\n\n${message}\n\nCurrent Value: ${metricValue}`,
    });
  }

  /**
   * Send report email
   */
  async sendReportEmail(
    emails: string[],
    reportTitle: string,
    reportPath?: string
  ): Promise<boolean> {
    const html = `
      <h2>Your Report is Ready</h2>
      <p>Your report "${reportTitle}" has been generated successfully.</p>
      ${reportPath ? `<p><a href="${process.env.API_URL || 'http://localhost:5001'}${reportPath}">Download Report</a></p>` : ''}
      <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/reports">View All Reports</a></p>
    `;

    return await this.sendEmail({
      to: emails,
      subject: `Report Ready: ${reportTitle}`,
      html,
      text: `Your report "${reportTitle}" has been generated successfully.`,
      attachments: reportPath ? [{
        filename: `${reportTitle}.pdf`,
        path: reportPath,
      }] : undefined,
    });
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, firstName: string): Promise<boolean> {
    const html = `
      <h2>Welcome to Social Media Analytics Platform!</h2>
      <p>Hi ${firstName},</p>
      <p>Thank you for joining us. Get started by connecting your social media accounts.</p>
      <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings/accounts">Connect Accounts</a></p>
    `;

    return await this.sendEmail({
      to: email,
      subject: 'Welcome to Social Media Analytics Platform',
      html,
      text: `Hi ${firstName},\n\nThank you for joining us. Get started by connecting your social media accounts.`,
    });
  }
}

export const emailService = new EmailService();

