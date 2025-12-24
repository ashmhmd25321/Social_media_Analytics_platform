'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, TrendingUp, ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';
import { LineChart, MetricCard, BarChart } from '@/components/analytics';
import { usePageRefresh } from '@/hooks/usePageRefresh';

interface EngagementTrend {
  date: string;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
}

interface EngagementMetrics {
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  averageEngagementRate: number;
  averageResponseTime: number;
  engagementByPlatform: Array<{ platform: string; engagement: number; rate: number }>;
}

export default function EngagementMetricsPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<EngagementMetrics | null>(null);
  const [engagementTrends, setEngagementTrends] = useState<EngagementTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<number>(30);

  const fetchEngagementData = async () => {
    try {
      setLoading(true);
      
      // Fetch engagement trends - DISABLE CACHE for fresh data
      const trendsResponse = await api.get<{ data: EngagementTrend[] }>(`/analytics/engagement/trends?days=${timeRange}`, false);
      if (trendsResponse.success && trendsResponse.data) {
        setEngagementTrends(trendsResponse.data);
      }

      // Fetch engagement metrics - DISABLE CACHE for fresh data
      const metricsResponse = await api.get<EngagementMetrics>(`/analytics/engagement/metrics?days=${timeRange}`, false);
      if (metricsResponse.success && metricsResponse.data) {
        setMetrics(metricsResponse.data);
      } else {
        // Set empty metrics if no data available
        setMetrics({
          totalLikes: 0,
          totalComments: 0,
          totalShares: 0,
          averageEngagementRate: 0,
          averageResponseTime: 0,
          engagementByPlatform: [],
        });
      }
    } catch (error) {
      console.error('Error fetching engagement data:', error);
      // Set empty metrics on error
      setMetrics({
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        averageEngagementRate: 0,
        averageResponseTime: 0,
        engagementByPlatform: [],
      });
    } finally {
      setLoading(false);
    }
  };

  // Use the refresh hook to refetch data when page becomes visible or when navigating back
  usePageRefresh(fetchEngagementData, [timeRange]);

  const exportData = () => {
    // TODO: Implement CSV/PDF export
    alert('Export functionality coming soon!');
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
            className="mb-8 text-white flex items-center justify-between"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <div className="flex items-center gap-4">
              <Link href="/analytics">
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
              </Link>
              <div>
                <h1 className="text-4xl font-heading font-bold mb-2">Engagement Metrics</h1>
                <p className="text-white/80">Likes, comments, shares trends, and response times</p>
              </div>
            </div>
            <button
              onClick={exportData}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <Download className="w-5 h-5" />
              <span>Export</span>
            </button>
          </motion.div>

          {/* Time Range Selector */}
          <motion.div
            className="mb-6 flex gap-2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {[7, 30, 90, 365].map((days) => (
              <button
                key={days}
                onClick={() => setTimeRange(days)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  timeRange === days
                    ? 'bg-primary-500 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {days === 365 ? '1 Year' : `${days} Days`}
              </button>
            ))}
          </motion.div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title="Total Likes"
              value={metrics?.totalLikes.toLocaleString() || '0'}
              icon={Heart}
              delay={0.1}
            />
            <MetricCard
              title="Total Comments"
              value={metrics?.totalComments.toLocaleString() || '0'}
              icon={MessageCircle}
              delay={0.2}
            />
            <MetricCard
              title="Total Shares"
              value={metrics?.totalShares.toLocaleString() || '0'}
              icon={Share2}
              delay={0.3}
            />
            <MetricCard
              title="Avg Engagement Rate"
              value={`${metrics?.averageEngagementRate.toFixed(1) || '0'}%`}
              icon={TrendingUp}
              delay={0.4}
            />
          </div>

          {/* Engagement Breakdown Chart */}
          <motion.div
            className="mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <BarChart
              simpleData={[
                {
                  name: 'Likes',
                  value: metrics?.totalLikes || 0,
                  color: '#ef4444',
                },
                {
                  name: 'Comments',
                  value: metrics?.totalComments || 0,
                  color: '#3b82f6',
                },
                {
                  name: 'Shares',
                  value: metrics?.totalShares || 0,
                  color: '#10b981',
                },
              ]}
              title="Total Engagement Breakdown"
            />
          </motion.div>

          {/* Engagement by Platform */}
          {metrics?.engagementByPlatform && metrics.engagementByPlatform.length > 0 ? (
            <motion.div
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg mb-8"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <h3 className="text-xl font-bold text-white mb-4">Engagement by Platform</h3>
              <div className="space-y-4">
                {metrics.engagementByPlatform.map((platform, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-white/10 last:border-b-0">
                    <span className="text-white font-medium">{platform.platform}</span>
                    <div className="text-right">
                      <div className="text-white font-bold">{platform.engagement.toLocaleString()}</div>
                      <div className="text-sm text-white/60">{platform.rate.toFixed(1)}% rate</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg mb-8"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <h3 className="text-xl font-bold text-white mb-4">Engagement by Platform</h3>
              <div className="text-center py-8 text-white/60">
                <p>No engagement data available. Connect accounts and sync data to see engagement by platform.</p>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </ProtectedRoute>
  );
}

