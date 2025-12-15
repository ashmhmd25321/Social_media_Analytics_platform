import { campaignModel, campaignPostModel, campaignMetricModel, abTestGroupModel } from '../models/Campaign';
import { Campaign, CampaignPost, CampaignMetric, ABTestGroup } from '../models/Campaign';
import { analyticsService } from './AnalyticsService';

class CampaignService {
  /**
   * Create a new campaign
   */
  async createCampaign(campaign: Campaign): Promise<number> {
    return await campaignModel.create(campaign);
  }

  /**
   * Get campaign performance metrics
   */
  async getCampaignMetrics(campaignId: number): Promise<any> {
    const campaign = await campaignModel.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const aggregated = await campaignMetricModel.getAggregatedMetrics(campaignId);
    const dailyMetrics = await campaignMetricModel.findByCampaign(
      campaignId,
      campaign.start_date,
      campaign.end_date || undefined
    );

    // Calculate ROI if budget is set
    let roi = null;
    if (campaign.budget && aggregated.total_revenue) {
      roi = ((aggregated.total_revenue - campaign.budget) / campaign.budget) * 100;
    }

    return {
      campaign,
      aggregated,
      dailyMetrics,
      roi,
      engagementRate: aggregated.avg_engagement_rate || 0,
      ctr: aggregated.avg_ctr || 0,
    };
  }

  /**
   * Update campaign metrics from posts
   */
  async updateCampaignMetrics(campaignId: number, date: Date): Promise<void> {
    // Get all posts for this campaign
    const campaignPosts = await campaignPostModel.findByCampaign(campaignId);
    
    if (campaignPosts.length === 0) return;

    // Aggregate metrics from posts
    const metric: CampaignMetric = {
      campaign_id: campaignId,
      date,
      impressions: 0,
      reach: 0,
      clicks: 0,
      engagements: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      followers_gained: 0,
      conversions: 0,
      revenue: 0,
      spend: 0,
    };

    // TODO: Fetch actual metrics from social_posts and post_engagement_metrics
    // For now, this is a placeholder structure

    await campaignMetricModel.createOrUpdate(metric);
  }

  /**
   * Create A/B test groups for a campaign
   */
  async createABTest(campaignId: number, groups: Omit<ABTestGroup, 'id' | 'campaign_id' | 'created_at'>[]): Promise<number[]> {
    const groupIds: number[] = [];
    
    for (const group of groups) {
      const id = await abTestGroupModel.create({
        ...group,
        campaign_id: campaignId,
      });
      groupIds.push(id);
    }

    return groupIds;
  }

  /**
   * Get A/B test results
   */
  async getABTestResults(campaignId: number): Promise<any> {
    const groups = await abTestGroupModel.findByCampaign(campaignId);
    const campaignPosts = await campaignPostModel.findByCampaign(campaignId);

    const results: any = {};

    for (const group of groups) {
      const groupPosts = campaignPosts.filter(p => p.variant_type === group.variant_type);
      
      // Calculate metrics for this variant
      // TODO: Aggregate actual metrics from posts
      results[group.variant_type] = {
        group,
        postCount: groupPosts.length,
        // Add more metrics here
      };
    }

    return results;
  }

  /**
   * Add post to campaign
   */
  async addPostToCampaign(campaignId: number, postId: number, variantType: 'control' | 'variant_a' | 'variant_b' = 'control'): Promise<number> {
    return await campaignPostModel.create({
      campaign_id: campaignId,
      post_id: postId,
      variant_type: variantType,
    });
  }
}

export const campaignService = new CampaignService();

