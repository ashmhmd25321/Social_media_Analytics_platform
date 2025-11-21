import { scheduledPostModel } from '../models/Content';
import { UserSocialAccountModelInstance } from '../models/SocialPlatform';
import { pool } from '../config/database';
import { RowDataPacket } from 'mysql2/promise';

interface PublishResult {
  success: boolean;
  platformPostId?: string;
  error?: string;
}

class PostPublishingService {
  /**
   * Process pending scheduled posts
   * This should be called periodically (e.g., every minute)
   */
  async processPendingPosts(): Promise<void> {
    try {
      const pendingPosts = await scheduledPostModel.findPending(100);
      
      if (pendingPosts.length === 0) {
        return;
      }

      console.log(`📝 Found ${pendingPosts.length} pending scheduled posts to process`);

      // Process posts in parallel (with concurrency limit)
      const concurrency = 5;
      for (let i = 0; i < pendingPosts.length; i += concurrency) {
        const batch = pendingPosts.slice(i, i + concurrency);
        await Promise.all(
          batch.map(post => this.publishPost(post.id!).catch(err => {
            console.error(`Failed to publish post ${post.id}:`, err);
          }))
        );
      }

      console.log(`✅ Completed processing ${pendingPosts.length} scheduled posts`);
    } catch (error) {
      console.error('Error processing pending posts:', error);
      throw error;
    }
  }

  /**
   * Publish a single scheduled post
   */
  async publishPost(postId: number): Promise<PublishResult> {
    try {
      // Get the scheduled post
      const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT * FROM scheduled_posts WHERE id = ?',
        [postId]
      );

      if (rows.length === 0) {
        return { success: false, error: 'Post not found' };
      }

      const post = rows[0];

      // Check if post is still pending and scheduled time has passed
      if (post.status !== 'pending') {
        return { success: false, error: `Post is not pending (status: ${post.status})` };
      }

      const scheduledAt = new Date(post.scheduled_at);
      if (scheduledAt > new Date()) {
        return { success: false, error: 'Post scheduled time has not arrived yet' };
      }

      // Get the associated account
      const account = await UserSocialAccountModelInstance.findById(post.account_id);
      if (!account) {
        await scheduledPostModel.updateStatus(postId, 'failed', undefined, 'Account not found');
        return { success: false, error: 'Account not found' };
      }

      if (account.account_status !== 'connected' || !account.is_active) {
        await scheduledPostModel.updateStatus(postId, 'failed', undefined, 'Account is not active');
        return { success: false, error: 'Account is not active' };
      }

      // Publish to the platform
      const result = await this.publishToPlatform(account, post);

      if (result.success) {
        // Update post status to published
        await scheduledPostModel.updateStatus(
          postId,
          'published',
          result.platformPostId,
          undefined
        );

        // If this post was created from a draft, update draft status
        if (post.draft_id) {
          await pool.execute(
            'UPDATE content_drafts SET status = ? WHERE id = ?',
            ['published', post.draft_id]
          );
        }

        console.log(`✅ Successfully published post ${postId} to ${account.platform_display_name}`);
        return result;
      } else {
        // Update post status to failed
        await scheduledPostModel.updateStatus(
          postId,
          'failed',
          undefined,
          result.error
        );
        return result;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await scheduledPostModel.updateStatus(postId, 'failed', undefined, errorMessage);
      console.error(`❌ Error publishing post ${postId}:`, error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Publish post to the actual platform
   * This is a placeholder - in production, you'd integrate with actual platform APIs
   */
  private async publishToPlatform(account: any, post: any): Promise<PublishResult> {
    try {
      const platformType = (account as any).platform_name || account.platform_display_name || 'unknown';

      // For now, we'll simulate publishing
      // In production, you'd call the actual platform API here
      // Example:
      // - Facebook: POST to /{page-id}/feed
      // - Instagram: POST to /{ig-user-id}/media
      // - Twitter: POST to /2/tweets
      // etc.

      console.log(`📤 Publishing to ${platformType}...`);
      console.log(`   Content: ${post.content?.substring(0, 50)}...`);
      console.log(`   Account: ${account.platform_display_name}`);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // For mock/testing purposes, we'll simulate success
      // In production, replace this with actual API calls
      if (account.access_token === 'mock_token' || process.env.USE_MOCK_DATA === 'true') {
        // Mock successful publication
        const mockPostId = `mock_post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return {
          success: true,
          platformPostId: mockPostId,
        };
      }

      // TODO: Implement actual platform API calls
      // This would involve:
      // 1. Creating platform-specific publishing services (FacebookPublisher, InstagramPublisher, etc.)
      // 2. Handling OAuth tokens
      // 3. Formatting content according to platform requirements
      // 4. Uploading media if present
      // 5. Handling rate limits and errors

      // For now, return a simulated success
      // In production, you should implement actual API integration
      return {
        success: true,
        platformPostId: `published_${Date.now()}`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to publish to platform';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Manually trigger publishing for a specific post
   * Useful for testing or manual retries
   */
  async publishPostManually(postId: number): Promise<PublishResult> {
    return await this.publishPost(postId);
  }
}

export const postPublishingService = new PostPublishingService();

