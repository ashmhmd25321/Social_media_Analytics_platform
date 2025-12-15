import { reportModel, Report } from '../models/Report';
import { analyticsService } from './AnalyticsService';
import { UserSocialAccountModelInstance } from '../models/SocialPlatform';
import { pool } from '../config/database';
import { RowDataPacket } from 'mysql2/promise';
import * as fs from 'fs';
import * as path from 'path';

interface ReportData {
  overview: any;
  followerTrends: any[];
  engagementTrends: any[];
  platformComparison: any[];
  topPosts: any[];
}

class ReportGenerationService {
  /**
   * Generate a report
   */
  async generateReport(reportId: number, userId: number): Promise<Report> {
    const report = await reportModel.findById(reportId, userId);
    if (!report) {
      throw new Error('Report not found');
    }

    // Update status to generating
    await reportModel.update(reportId, userId, { status: 'generating' });

    try {
      // Fetch report data
      const reportData = await this.fetchReportData(userId, report);

      // Generate report based on format
      let filePath: string;
      let fileSize: number;

      switch (report.format) {
        case 'pdf':
          ({ filePath, fileSize } = await this.generatePDF(report, reportData));
          break;
        case 'excel':
          ({ filePath, fileSize } = await this.generateExcel(report, reportData));
          break;
        case 'html':
          ({ filePath, fileSize } = await this.generateHTML(report, reportData));
          break;
        default:
          throw new Error(`Unsupported format: ${report.format}`);
      }

      // Update report with file info
      await reportModel.update(reportId, userId, {
        status: 'completed',
        file_path: filePath,
        file_size: fileSize,
        generated_at: new Date(),
      });

      return await reportModel.findById(reportId, userId) as Report;
    } catch (error) {
      await reportModel.update(reportId, userId, {
        status: 'failed',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw error;
    }
  }

  /**
   * Get preview data for a report (without generating file)
   */
  async getPreviewData(userId: number, report: Report): Promise<ReportData> {
    return await this.fetchReportData(userId, report);
  }

  /**
   * Fetch data for the report
   */
  private async fetchReportData(userId: number, report: Report): Promise<ReportData> {
    const days = Math.ceil(
      (new Date(report.date_range_end).getTime() - new Date(report.date_range_start).getTime()) / (1000 * 60 * 60 * 24)
    );

    const [overview, followerTrends, engagementTrends, platformComparison, topPosts] = await Promise.all([
      analyticsService.getOverviewMetrics(userId),
      analyticsService.getFollowerTrends(userId, days),
      analyticsService.getEngagementTrends(userId, days),
      analyticsService.getPlatformComparison(userId),
      analyticsService.getTopPosts(userId, 10),
    ]);

    return {
      overview,
      followerTrends,
      engagementTrends,
      platformComparison,
      topPosts,
    };
  }

  /**
   * Generate PDF report (placeholder - requires pdfkit or similar)
   */
  private async generatePDF(report: Report, data: ReportData): Promise<{ filePath: string; fileSize: number }> {
    // TODO: Implement PDF generation using pdfkit or puppeteer
    // For now, create a placeholder file
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const fileName = `report_${report.id}_${Date.now()}.pdf`;
    const filePath = path.join(reportsDir, fileName);

    // Create a simple text file as placeholder
    const content = this.generateReportContent(report, data);
    fs.writeFileSync(filePath, content);

    return {
      filePath: `/reports/${fileName}`,
      fileSize: fs.statSync(filePath).size,
    };
  }

  /**
   * Generate Excel report (placeholder - requires exceljs or similar)
   */
  private async generateExcel(report: Report, data: ReportData): Promise<{ filePath: string; fileSize: number }> {
    // TODO: Implement Excel generation using exceljs
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const fileName = `report_${report.id}_${Date.now()}.xlsx`;
    const filePath = path.join(reportsDir, fileName);

    // Create a simple text file as placeholder
    const content = this.generateReportContent(report, data);
    fs.writeFileSync(filePath, content);

    return {
      filePath: `/reports/${fileName}`,
      fileSize: fs.statSync(filePath).size,
    };
  }

  /**
   * Generate HTML report
   */
  private async generateHTML(report: Report, data: ReportData): Promise<{ filePath: string; fileSize: number }> {
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const fileName = `report_${report.id}_${Date.now()}.html`;
    const filePath = path.join(reportsDir, fileName);

    const html = this.generateHTMLContent(report, data);
    fs.writeFileSync(filePath, html);

    return {
      filePath: `/reports/${fileName}`,
      fileSize: fs.statSync(filePath).size,
    };
  }

  /**
   * Generate report content as text
   */
  private generateReportContent(report: Report, data: ReportData): string {
    const lines: string[] = [];
    lines.push(`Report: ${report.title}`);
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push(`Date Range: ${report.date_range_start} to ${report.date_range_end}`);
    lines.push('');
    lines.push('=== Overview Metrics ===');
    lines.push(`Total Followers: ${data.overview.totalFollowers}`);
    lines.push(`Total Posts: ${data.overview.totalPosts}`);
    lines.push(`Total Engagement: ${data.overview.totalEngagement}`);
    lines.push(`Average Engagement Rate: ${data.overview.averageEngagementRate}%`);
    lines.push(`Connected Platforms: ${data.overview.connectedPlatforms}`);
    lines.push(`Growth Rate: ${data.overview.growthRate}%`);
    lines.push('');
    lines.push('=== Platform Comparison ===');
    data.platformComparison.forEach(platform => {
      lines.push(`${platform.platform}: ${platform.followers} followers, ${platform.posts} posts, ${platform.engagementRate}% engagement rate`);
    });
    lines.push('');
    lines.push('=== Top Posts ===');
    data.topPosts.forEach((post, index) => {
      lines.push(`${index + 1}. ${post.content.substring(0, 50)}... - ${post.engagement_rate}% engagement rate`);
    });

    return lines.join('\n');
  }

  /**
   * Generate HTML content
   */
  private generateHTMLContent(report: Report, data: ReportData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>${report.title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    h2 { color: #666; margin-top: 30px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f2f2f2; }
    .metric { display: inline-block; margin: 10px; padding: 15px; background: #f9f9f9; border-radius: 5px; }
    .metric-value { font-size: 24px; font-weight: bold; color: #4CAF50; }
  </style>
</head>
<body>
  <h1>${report.title}</h1>
  <p><strong>Generated:</strong> ${new Date().toISOString()}</p>
  <p><strong>Date Range:</strong> ${report.date_range_start} to ${report.date_range_end}</p>
  
  <h2>Overview Metrics</h2>
  <div class="metric">
    <div>Total Followers</div>
    <div class="metric-value">${data.overview.totalFollowers.toLocaleString()}</div>
  </div>
  <div class="metric">
    <div>Total Posts</div>
    <div class="metric-value">${data.overview.totalPosts}</div>
  </div>
  <div class="metric">
    <div>Total Engagement</div>
    <div class="metric-value">${data.overview.totalEngagement.toLocaleString()}</div>
  </div>
  <div class="metric">
    <div>Avg Engagement Rate</div>
    <div class="metric-value">${data.overview.averageEngagementRate}%</div>
  </div>
  
  <h2>Platform Comparison</h2>
  <table>
    <thead>
      <tr>
        <th>Platform</th>
        <th>Followers</th>
        <th>Posts</th>
        <th>Engagement</th>
        <th>Engagement Rate</th>
      </tr>
    </thead>
    <tbody>
      ${data.platformComparison.map(p => `
        <tr>
          <td>${p.platform}</td>
          <td>${p.followers.toLocaleString()}</td>
          <td>${p.posts}</td>
          <td>${p.engagement.toLocaleString()}</td>
          <td>${p.engagementRate}%</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <h2>Top Performing Posts</h2>
  <table>
    <thead>
      <tr>
        <th>Rank</th>
        <th>Content</th>
        <th>Platform</th>
        <th>Likes</th>
        <th>Comments</th>
        <th>Shares</th>
        <th>Engagement Rate</th>
      </tr>
    </thead>
    <tbody>
      ${data.topPosts.map((post, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}</td>
          <td>${post.platform}</td>
          <td>${post.likes.toLocaleString()}</td>
          <td>${post.comments.toLocaleString()}</td>
          <td>${post.shares.toLocaleString()}</td>
          <td>${post.engagement_rate}%</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>
    `.trim();
  }
}

export const reportGenerationService = new ReportGenerationService();

