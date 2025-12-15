'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { ArrowLeft, Target, TrendingUp, DollarSign, Eye, MousePointerClick, Heart, MessageCircle, Share2, Users, BarChart3, Play, Pause } from 'lucide-react';
import Link from 'next/link';
import { LineChart } from '@/components/analytics';

interface Campaign {
  id: number;
  name: string;
  description?: string;
  campaign_type: string;
  start_date: string;
  end_date?: string;
  budget?: number;
  status: string;
  goals?: any;
}

interface CampaignMetrics {
  campaign: Campaign;
  aggregated: {
    total_impressions: number;
    total_reach: number;
    total_clicks: number;
    total_engagements: number;
    total_likes: number;
    total_comments: number;
    total_shares: number;
    total_followers_gained: number;
    total_conversions: number;
    total_revenue: number;
    total_spend: number;
    avg_engagement_rate: number;
    avg_ctr: number;
  };
  dailyMetrics: any[];
  roi: number | null;
  engagementRate: number;
  ctr: number;
}

export default function CampaignDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const campaignId = parseInt(params.id as string);
  const [metrics, setMetrics] = useState<CampaignMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'ab-test'>('overview');

  useEffect(() => {
    fetchCampaignData();
  }, [campaignId]);

  const fetchCampaignData = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ data: CampaignMetrics }>(`/campaigns/${campaignId}`);
      if (response.success && response.data) {
        setMetrics(response.data);
      }
    } catch (error) {
      console.error('Error fetching campaign data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!metrics) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center text-white">
          <p>Campaign not found</p>
        </div>
      </ProtectedRoute>
    );
  }

  const { campaign, aggregated, roi, engagementRate, ctr } = metrics;

  return (
    <ProtectedRoute>
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-secondary-900/85 via-purple-900/80 to-primary-900/85">
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1920&q=80)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-secondary-900/85 via-purple-900/80 to-primary-900/85"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div 
            className="mb-8 text-white"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <Link href="/campaigns" className="inline-flex items-center text-white/80 hover:text-white mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Campaigns
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-heading font-bold mb-2">{campaign.name}</h1>
                {campaign.description && <p className="text-white/80">{campaign.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                  campaign.status === 'active' ? 'bg-green-500/20 text-green-300' :
                  campaign.status === 'paused' ? 'bg-yellow-500/20 text-yellow-300' :
                  campaign.status === 'completed' ? 'bg-blue-500/20 text-blue-300' :
                  'bg-gray-500/20 text-gray-300'
                }`}>
                  {campaign.status}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="mb-6 flex gap-2 border-b border-white/20">
            {[
              { id: 'overview', label: 'Overview', icon: Target },
              { id: 'metrics', label: 'Metrics', icon: BarChart3 },
              { id: 'ab-test', label: 'A/B Test', icon: TrendingUp },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-400 text-primary-300'
                      : 'border-transparent text-white/60 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          {activeTab === 'overview' && (
            <motion.div
              className="space-y-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              {/* Key Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6" role="region" aria-label="Campaign metrics">
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Eye className="w-5 h-5 text-blue-400" />
                    <span className="text-white/60 text-sm">Impressions</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {aggregated.total_impressions?.toLocaleString() || 0}
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="w-5 h-5 text-green-400" />
                    <span className="text-white/60 text-sm">Reach</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {aggregated.total_reach?.toLocaleString() || 0}
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <MousePointerClick className="w-5 h-5 text-purple-400" />
                    <span className="text-white/60 text-sm">Clicks</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {aggregated.total_clicks?.toLocaleString() || 0}
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Heart className="w-5 h-5 text-red-400" />
                    <span className="text-white/60 text-sm">Engagements</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {aggregated.total_engagements?.toLocaleString() || 0}
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" role="region" aria-label="Performance metrics">
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg">
                  <div className="text-white/60 text-sm mb-2">Engagement Rate</div>
                  <div className="text-3xl font-bold text-white">
                    {engagementRate?.toFixed(2) || 0}%
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg">
                  <div className="text-white/60 text-sm mb-2">Click-Through Rate</div>
                  <div className="text-3xl font-bold text-white">
                    {ctr?.toFixed(2) || 0}%
                  </div>
                </div>

                {roi !== null && (
                  <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg">
                    <div className="text-white/60 text-sm mb-2">ROI</div>
                    <div className={`text-3xl font-bold ${roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {roi.toFixed(1)}%
                    </div>
                  </div>
                )}
              </div>

              {/* Campaign Info */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg">
                <h2 className="text-xl font-bold text-white mb-4">Campaign Information</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-white/60">Type:</span>
                    <span className="text-white ml-2 capitalize">{campaign.campaign_type}</span>
                  </div>
                  <div>
                    <span className="text-white/60">Start Date:</span>
                    <span className="text-white ml-2">{new Date(campaign.start_date).toLocaleDateString()}</span>
                  </div>
                  {campaign.end_date && (
                    <div>
                      <span className="text-white/60">End Date:</span>
                      <span className="text-white ml-2">{new Date(campaign.end_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {campaign.budget && (
                    <div>
                      <span className="text-white/60">Budget:</span>
                      <span className="text-white ml-2">${campaign.budget.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'metrics' && (
            <motion.div
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <h2 className="text-xl font-bold text-white mb-4">Performance Metrics</h2>
              {metrics.dailyMetrics && metrics.dailyMetrics.length > 0 ? (
                <div className="h-64">
                  <LineChart
                    data={metrics.dailyMetrics.map(m => ({
                      date: m.date,
                      value: m.engagements || 0,
                    }))}
                    label="Engagements"
                  />
                </div>
              ) : (
                <p className="text-white/60 text-center py-8">No metrics data available yet</p>
              )}
            </motion.div>
          )}

          {activeTab === 'ab-test' && (
            <motion.div
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <h2 className="text-xl font-bold text-white mb-4">A/B Test Results</h2>
              <p className="text-white/60 text-center py-8">A/B test functionality coming soon</p>
            </motion.div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

