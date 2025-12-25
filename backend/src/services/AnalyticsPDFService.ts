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
    let filePath: string | null = null;
    
    try {
      // Fetch all analytics data
      const data = await this.fetchAllAnalyticsData(userId);

      // Create reports directory if it doesn't exist
      const reportsDir = path.join(process.cwd(), 'reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      // Generate PDF file
      const fileName = `analytics_report_${userId}_${Date.now()}.pdf`;
      filePath = path.join(reportsDir, fileName);

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
        stream.on('error', (error: Error) => {
          console.error('PDF stream error:', error);
          reject(error);
        });
        
        // Handle PDF document errors
        doc.on('error', (error: Error) => {
          console.error('PDF document error:', error);
          reject(error);
        });
        
        // Timeout after 30 seconds
        setTimeout(() => {
          reject(new Error('PDF generation timeout'));
        }, 30000);
      });

      // Verify file was created
      if (!fs.existsSync(filePath)) {
        throw new Error('PDF file was not created');
      }

      const fileSize = fs.statSync(filePath).size;

      return {
        filePath: `/reports/${fileName}`,
        fileSize,
      };
    } catch (error) {
      // Clean up file if it exists but generation failed
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (unlinkError) {
          console.error('Error cleaning up failed PDF file:', unlinkError);
        }
      }
      
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  /**
   * Fetch all analytics data
   */
  private async fetchAllAnalyticsData(userId: number): Promise<AnalyticsPDFData> {
    try {
      const [
        overview,
        audienceMetrics,
        contentPerformance,
        engagementMetrics,
        engagementTrends,
        followerTrends,
        topPosts,
      ] = await Promise.allSettled([
        analyticsService.getOverviewMetrics(userId),
        analyticsService.getAudienceMetrics(userId, 30),
        analyticsService.getContentPerformance(userId, 30),
        analyticsService.getEngagementMetrics(userId, 30),
        analyticsService.getEngagementTrends(userId, 30),
        analyticsService.getFollowerTrends(userId, 'day'),
        analyticsService.getTopPosts(userId, 10, 30),
      ]);

      // Extract values from Promise.allSettled results, using defaults if rejected
      const getValue = (result: PromiseSettledResult<any>, defaultValue: any) => {
        return result.status === 'fulfilled' ? result.value : defaultValue;
      };

      return {
        overview: getValue(overview, {
          totalFollowers: 0,
          totalPosts: 0,
          totalEngagement: 0,
          averageEngagementRate: 0,
          connectedPlatforms: 0,
          growthRate: 0,
        }),
        audienceMetrics: getValue(audienceMetrics, {
          totalFollowers: 0,
          followerGrowth: 0,
          newFollowers: 0,
          platformBreakdown: [],
        }),
        contentPerformance: getValue(contentPerformance, {
          totalPosts: 0,
          averageEngagementRate: 0,
          contentTypeBreakdown: {},
          bestPostingDays: [],
        }),
        engagementMetrics: getValue(engagementMetrics, {
          totalLikes: 0,
          totalComments: 0,
          totalShares: 0,
          averageEngagementRate: 0,
          averageResponseTime: 0,
          engagementByPlatform: [],
        }),
        engagementTrends: getValue(engagementTrends, []),
        followerTrends: getValue(followerTrends, []),
        topPosts: getValue(topPosts, []),
      };
    } catch (error) {
      console.error('Error fetching analytics data for PDF:', error);
      // Return empty data structure if all fails
      return {
        overview: {
          totalFollowers: 0,
          totalPosts: 0,
          totalEngagement: 0,
          averageEngagementRate: 0,
          connectedPlatforms: 0,
          growthRate: 0,
        },
        audienceMetrics: {
          totalFollowers: 0,
          followerGrowth: 0,
          newFollowers: 0,
          platformBreakdown: [],
        },
        contentPerformance: {
          totalPosts: 0,
          averageEngagementRate: 0,
          contentTypeBreakdown: {},
          bestPostingDays: [],
        },
        engagementMetrics: {
          totalLikes: 0,
          totalComments: 0,
          totalShares: 0,
          averageEngagementRate: 0,
          averageResponseTime: 0,
          engagementByPlatform: [],
        },
        engagementTrends: [],
        followerTrends: [],
        topPosts: [],
      };
    }
  }

  /**
   * Generate PDF content
   */
  private generatePDFContent(doc: InstanceType<typeof PDFDocument>, data: AnalyticsPDFData): void {
    try {
      // Header
      doc.fontSize(24).text('Social Media Analytics Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(2);

      // Overview Section
      doc.fontSize(18).text('1. Overview Metrics', { underline: true });
      doc.moveDown();
      doc.fontSize(12);
      const overview = data.overview || {};
      doc.text(`Total Followers: ${(overview.totalFollowers || 0).toLocaleString()}`);
      doc.text(`Total Posts: ${(overview.totalPosts || 0).toLocaleString()}`);
      doc.text(`Total Engagement: ${(overview.totalEngagement || 0).toLocaleString()}`);
      doc.text(`Average Engagement Rate: ${((overview.averageEngagementRate || 0)).toFixed(2)}%`);
      doc.text(`Growth Rate: ${((overview.growthRate || 0)).toFixed(2)}%`);
      doc.text(`Connected Platforms: ${overview.connectedPlatforms || 0}`);
      doc.moveDown(2);

      // Audience Analytics Section
      doc.fontSize(18).text('2. Audience Analytics', { underline: true });
      doc.moveDown();
      doc.fontSize(12);
      const audience = data.audienceMetrics || {};
      doc.text(`Total Followers: ${(audience.totalFollowers || 0).toLocaleString()}`);
      doc.text(`Follower Growth: ${((audience.followerGrowth || 0)).toFixed(2)}%`);
      doc.text(`New Followers: ${(audience.newFollowers || 0).toLocaleString()}`);
      doc.moveDown();
      
      if (audience.platformBreakdown && Array.isArray(audience.platformBreakdown) && audience.platformBreakdown.length > 0) {
        doc.text('Platform Breakdown:');
        audience.platformBreakdown.forEach((platform: any) => {
          const platformName = platform?.platform || 'Unknown';
          const followers = platform?.followers || 0;
          const percentage = platform?.percentage || 0;
          doc.text(`  - ${platformName}: ${followers.toLocaleString()} followers (${percentage.toFixed(1)}%)`, { indent: 20 });
        });
      }
      doc.moveDown(2);

      // Content Performance Section
      doc.fontSize(18).text('3. Content Performance', { underline: true });
      doc.moveDown();
      doc.fontSize(12);
      const content = data.contentPerformance || {};
      doc.text(`Total Posts: ${(content.totalPosts || 0).toLocaleString()}`);
      doc.text(`Average Engagement Rate: ${((content.averageEngagementRate || 0)).toFixed(2)}%`);
      doc.moveDown();
      
      if (content.contentTypeBreakdown && typeof content.contentTypeBreakdown === 'object') {
        const contentTypeKeys = Object.keys(content.contentTypeBreakdown);
        if (contentTypeKeys.length > 0) {
          doc.text('Content Type Breakdown:');
          Object.entries(content.contentTypeBreakdown).forEach(([type, count]: [string, any]) => {
            const countNum = typeof count === 'number' ? count : 0;
            doc.text(`  - ${type.charAt(0).toUpperCase() + type.slice(1)}: ${countNum}`, { indent: 20 });
          });
        }
      }
      doc.moveDown();
      
      if (data.topPosts && Array.isArray(data.topPosts) && data.topPosts.length > 0) {
        doc.text('Top Performing Posts:');
        data.topPosts.slice(0, 5).forEach((post: any, index: number) => {
          doc.moveDown(0.5);
          const postContent = post?.content || '';
          const contentPreview = postContent.length > 100 ? postContent.substring(0, 100) + '...' : postContent;
          const platform = post?.platform || 'Unknown';
          const engagementRate = post?.engagement_rate || 0;
          const likes = post?.likes || post?.likes_count || 0;
          const comments = post?.comments || post?.comments_count || 0;
          const shares = post?.shares || post?.shares_count || 0;
          
          doc.text(`${index + 1}. ${contentPreview || '(No content)'}`, { indent: 20 });
          doc.text(`   Platform: ${platform} | Engagement Rate: ${engagementRate.toFixed(2)}%`, { indent: 20 });
          doc.text(`   Likes: ${likes.toLocaleString()} | Comments: ${comments.toLocaleString()} | Shares: ${shares.toLocaleString()}`, { indent: 20 });
        });
      }
      doc.moveDown(2);

      // Engagement Metrics Section
      doc.fontSize(18).text('4. Engagement Metrics', { underline: true });
      doc.moveDown();
      doc.fontSize(12);
      const engagement = data.engagementMetrics || {};
      doc.text(`Total Likes: ${(engagement.totalLikes || 0).toLocaleString()}`);
      doc.text(`Total Comments: ${(engagement.totalComments || 0).toLocaleString()}`);
      doc.text(`Total Shares: ${(engagement.totalShares || 0).toLocaleString()}`);
      doc.text(`Average Engagement Rate: ${((engagement.averageEngagementRate || 0)).toFixed(2)}%`);
      doc.moveDown();
      
      if (engagement.engagementByPlatform && Array.isArray(engagement.engagementByPlatform) && engagement.engagementByPlatform.length > 0) {
        doc.text('Engagement by Platform:');
        engagement.engagementByPlatform.forEach((platform: any) => {
          const platformName = platform?.platform || 'Unknown';
          const platformEngagement = platform?.engagement || 0;
          const platformRate = platform?.rate || 0;
          doc.text(`  - ${platformName}: ${platformEngagement.toLocaleString()} (${platformRate.toFixed(1)}% rate)`, { indent: 20 });
        });
      }
      doc.moveDown(2);

      // Footer
      doc.fontSize(10).text('This report was generated by Social Media Analytics Platform', { align: 'center' });
    } catch (error) {
      console.error('Error generating PDF content:', error);
      doc.fontSize(12).text('Error generating report content. Please try again.', { align: 'center' });
      throw error;
    }
  }
}

export const analyticsPDFService = new AnalyticsPDFService();

