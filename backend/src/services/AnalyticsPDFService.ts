import PDFDocument from 'pdfkit';
import { analyticsService } from './AnalyticsService';
import { UserSocialAccountModelInstance } from '../models/SocialPlatform';
import * as fs from 'fs';
import * as path from 'path';

interface AnalyticsPDFData {
  overview: any;
  audienceMetrics: any;
  contentPerformance: any;
  engagementMetrics: any;
  engagementTrends: any[];
  followerTrends: any[];
  topPosts: any[];
}

class AnalyticsPDFService {
  /**
   * Generate comprehensive analytics PDF
   */
  async generateAnalyticsPDF(userId: number): Promise<{ filePath: string; fileSize: number }> {
    // Fetch all analytics data
    const data = await this.fetchAllAnalyticsData(userId);

    // Create reports directory if it doesn't exist
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Generate PDF file
    const fileName = `analytics_report_${userId}_${Date.now()}.pdf`;
    const filePath = path.join(reportsDir, fileName);

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Generate PDF content
    this.generatePDFContent(doc, data);

    // Finalize PDF
    doc.end();

    // Wait for stream to finish
    await new Promise<void>((resolve, reject) => {
      stream.on('finish', () => {
        resolve();
      });
      stream.on('error', reject);
    });

    const fileSize = fs.statSync(filePath).size;

    return {
      filePath: `/reports/${fileName}`,
      fileSize,
    };
  }

  /**
   * Fetch all analytics data
   */
  private async fetchAllAnalyticsData(userId: number): Promise<AnalyticsPDFData> {
    const [
      overview,
      audienceMetrics,
      contentPerformance,
      engagementMetrics,
      engagementTrends,
      followerTrends,
      topPosts,
    ] = await Promise.all([
      analyticsService.getOverviewMetrics(userId),
      analyticsService.getAudienceMetrics(userId, 30),
      analyticsService.getContentPerformance(userId, 30),
      analyticsService.getEngagementMetrics(userId, 30),
      analyticsService.getEngagementTrends(userId, 30),
      analyticsService.getFollowerTrends(userId, 'day'),
      analyticsService.getTopPosts(userId, 10, 30),
    ]);

    return {
      overview,
      audienceMetrics,
      contentPerformance,
      engagementMetrics,
      engagementTrends,
      followerTrends,
      topPosts,
    };
  }

  /**
   * Generate PDF content
   */
  private generatePDFContent(doc: PDFDocument, data: AnalyticsPDFData): void {
    // Header
    doc.fontSize(24).text('Social Media Analytics Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    // Overview Section
    doc.fontSize(18).text('1. Overview Metrics', { underline: true });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Total Followers: ${data.overview.totalFollowers.toLocaleString()}`);
    doc.text(`Total Posts: ${data.overview.totalPosts.toLocaleString()}`);
    doc.text(`Total Engagement: ${data.overview.totalEngagement.toLocaleString()}`);
    doc.text(`Average Engagement Rate: ${data.overview.averageEngagementRate.toFixed(2)}%`);
    doc.text(`Growth Rate: ${data.overview.growthRate.toFixed(2)}%`);
    doc.text(`Connected Platforms: ${data.overview.connectedPlatforms}`);
    doc.moveDown(2);

    // Audience Analytics Section
    doc.fontSize(18).text('2. Audience Analytics', { underline: true });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Total Followers: ${data.audienceMetrics.totalFollowers.toLocaleString()}`);
    doc.text(`Follower Growth: ${data.audienceMetrics.followerGrowth.toFixed(2)}%`);
    doc.text(`New Followers: ${data.audienceMetrics.newFollowers.toLocaleString()}`);
    doc.moveDown();
    
    if (data.audienceMetrics.platformBreakdown.length > 0) {
      doc.text('Platform Breakdown:');
      data.audienceMetrics.platformBreakdown.forEach((platform: any) => {
        doc.text(`  - ${platform.platform}: ${platform.followers.toLocaleString()} followers (${platform.percentage.toFixed(1)}%)`, { indent: 20 });
      });
    }
    doc.moveDown(2);

    // Content Performance Section
    doc.fontSize(18).text('3. Content Performance', { underline: true });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Total Posts: ${data.contentPerformance.totalPosts.toLocaleString()}`);
    doc.text(`Average Engagement Rate: ${data.contentPerformance.averageEngagementRate.toFixed(2)}%`);
    doc.moveDown();
    
    if (Object.keys(data.contentPerformance.contentTypeBreakdown).length > 0) {
      doc.text('Content Type Breakdown:');
      Object.entries(data.contentPerformance.contentTypeBreakdown).forEach(([type, count]: [string, any]) => {
        doc.text(`  - ${type.charAt(0).toUpperCase() + type.slice(1)}: ${count}`, { indent: 20 });
      });
    }
    doc.moveDown();
    
    if (data.topPosts.length > 0) {
      doc.text('Top Performing Posts:');
      data.topPosts.slice(0, 5).forEach((post: any, index: number) => {
        doc.moveDown(0.5);
        doc.text(`${index + 1}. ${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}`, { indent: 20 });
        doc.text(`   Platform: ${post.platform} | Engagement Rate: ${post.engagement_rate.toFixed(2)}%`, { indent: 20 });
        doc.text(`   Likes: ${post.likes.toLocaleString()} | Comments: ${post.comments.toLocaleString()} | Shares: ${post.shares.toLocaleString()}`, { indent: 20 });
      });
    }
    doc.moveDown(2);

    // Engagement Metrics Section
    doc.fontSize(18).text('4. Engagement Metrics', { underline: true });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Total Likes: ${data.engagementMetrics.totalLikes.toLocaleString()}`);
    doc.text(`Total Comments: ${data.engagementMetrics.totalComments.toLocaleString()}`);
    doc.text(`Total Shares: ${data.engagementMetrics.totalShares.toLocaleString()}`);
    doc.text(`Average Engagement Rate: ${data.engagementMetrics.averageEngagementRate.toFixed(2)}%`);
    doc.moveDown();
    
    if (data.engagementMetrics.engagementByPlatform.length > 0) {
      doc.text('Engagement by Platform:');
      data.engagementMetrics.engagementByPlatform.forEach((platform: any) => {
        doc.text(`  - ${platform.platform}: ${platform.engagement.toLocaleString()} (${platform.rate.toFixed(1)}% rate)`, { indent: 20 });
      });
    }
    doc.moveDown(2);

    // Footer
    doc.fontSize(10).text('This report was generated by Social Media Analytics Platform', { align: 'center' });
  }
}

export const analyticsPDFService = new AnalyticsPDFService();

