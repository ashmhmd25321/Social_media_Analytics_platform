'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { Users, TrendingUp, ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';
import { LineChart, MetricCard, BarChart } from '@/components/analytics';
import { usePageRefresh } from '@/hooks/usePageRefresh';

interface AudienceMetrics {
  totalFollowers: number;
  followerGrowth: number;
  newFollowers: number;
  peakActivityHours: Array<{ hour: number; activity: number }>;
  platformBreakdown: Array<{ platform: string; followers: number; percentage: number }>;
}

interface FollowerTrend {
  date: string;
  followers: number;
  platform: string;
}

export default function AudienceAnalyticsPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<AudienceMetrics | null>(null);
  const [followerTrends, setFollowerTrends] = useState<FollowerTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<number>(30);
  const [followerView, setFollowerView] = useState<'day' | 'month' | 'year'>('day');

  const fetchAudienceData = async () => {
    try {
      setLoading(true);
      
      // Fetch follower trends - DISABLE CACHE for fresh data, use view parameter (not time range)
      const trendsResponse = await api.get<{ data: FollowerTrend[] }>(`/analytics/followers/trends?view=${followerView}`, false);
      if (trendsResponse.success && trendsResponse.data) {
        setFollowerTrends(trendsResponse.data);
      }

      // Fetch audience metrics - DISABLE CACHE for fresh data, pass timeRange
      const metricsResponse = await api.get<AudienceMetrics>(`/analytics/audience?days=${timeRange}`, false);
      if (metricsResponse.success && metricsResponse.data) {
        setMetrics(metricsResponse.data);
      } else {
        // Set empty metrics if no data available
        setMetrics({
          totalFollowers: 0,
          followerGrowth: 0,
          newFollowers: 0,
          peakActivityHours: [],
          platformBreakdown: [],
        });
      }
    } catch (error) {
      console.error('Error fetching audience data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use the refresh hook to refetch data when page becomes visible or when navigating back
  usePageRefresh(fetchAudienceData, [timeRange, followerView]);

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
                <h1 className="text-4xl font-heading font-bold mb-2">Audience Analytics</h1>
                <p className="text-white/80">Follower growth, demographics, and activity patterns</p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <MetricCard
              title="Total Followers"
              value={metrics?.totalFollowers.toLocaleString() || '0'}
              icon={Users}
              delay={0.1}
            />
            <MetricCard
              title="New Followers"
              value={metrics?.newFollowers.toString() || '0'}
              icon={TrendingUp}
              delay={0.2}
            />
            <MetricCard
              title="Growth Rate"
              value={`${metrics?.followerGrowth.toFixed(1) || '0'}%`}
              icon={TrendingUp}
              delay={0.3}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Follower Growth Chart */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">Follower Growth</h3>
                  <div className="flex gap-2">
                    {(['day', 'month', 'year'] as const).map((view) => (
                      <button
                        key={view}
                        onClick={() => setFollowerView(view)}
                        className={`px-3 py-1 rounded-lg text-sm transition-all ${
                          followerView === view
                            ? 'bg-primary-500 text-white'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        {view.charAt(0).toUpperCase() + view.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <LineChart
                  data={followerTrends.map(t => ({
                    date: t.date,
                    'New Followers': t.followers,
                  }))}
                  dataKey="New Followers"
                  color="#06b6d4"
                  noWrapper={true}
                />
              </div>
            </motion.div>

            {/* Followers Count by Platform */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg">
                <h3 className="text-xl font-bold text-white mb-4">Followers Count by Platform</h3>
                {metrics?.platformBreakdown && metrics.platformBreakdown.length > 0 ? (
                  <BarChart
                    data={metrics.platformBreakdown.map(p => ({
                      name: p.platform.charAt(0).toUpperCase() + p.platform.slice(1),
                      followers: p.followers,
                    }))}
                    dataKeys={[
                      { key: 'followers', name: 'Followers', color: '#8b5cf6' },
                    ]}
                    delay={0.5}
                    noWrapper={true}
                  />
                ) : (
                  <div className="text-center py-8 text-white/60">
                    <p>No platform data available.</p>
                    <p className="text-sm mt-2">Connect and sync your social media accounts to see follower breakdown.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </ProtectedRoute>
  );
}

