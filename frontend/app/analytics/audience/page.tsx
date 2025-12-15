'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Clock, MapPin, ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';
import { LineChart, MetricCard } from '@/components/analytics';
import { BarChart } from 'recharts';

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

  useEffect(() => {
    fetchAudienceData();
  }, [timeRange]);

  const fetchAudienceData = async () => {
    try {
      setLoading(true);
      
      // Fetch follower trends
      const trendsResponse = await api.get<{ data: FollowerTrend[] }>(`/analytics/followers/trends?days=${timeRange}`);
      if (trendsResponse.success && trendsResponse.data) {
        setFollowerTrends(trendsResponse.data);
      }

      // Fetch audience metrics (will need to add this endpoint)
      const metricsResponse = await api.get<{ data: AudienceMetrics }>('/analytics/audience');
      if (metricsResponse.success && metricsResponse.data) {
        setMetrics(metricsResponse.data);
      } else {
        // Mock data for now until backend endpoint is ready
        setMetrics({
          totalFollowers: 12500,
          followerGrowth: 12.5,
          newFollowers: 156,
          peakActivityHours: [
            { hour: 9, activity: 85 },
            { hour: 12, activity: 120 },
            { hour: 15, activity: 95 },
            { hour: 18, activity: 140 },
            { hour: 21, activity: 110 },
          ],
          platformBreakdown: [
            { platform: 'Facebook', followers: 7500, percentage: 60 },
            { platform: 'Instagram', followers: 5000, percentage: 40 },
          ],
        });
      }
    } catch (error) {
      console.error('Error fetching audience data:', error);
    } finally {
      setLoading(false);
    }
  };

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
              trend={metrics?.followerGrowth || 0}
              delay={0.1}
            />
            <MetricCard
              title="New Followers"
              value={metrics?.newFollowers.toString() || '0'}
              icon={TrendingUp}
              trend={metrics?.followerGrowth || 0}
              delay={0.2}
            />
            <MetricCard
              title="Growth Rate"
              value={`${metrics?.followerGrowth.toFixed(1) || '0'}%`}
              icon={TrendingUp}
              trend={metrics?.followerGrowth || 0}
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
              <LineChart
                data={followerTrends.map(t => ({
                  date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                  followers: t.followers,
                }))}
                dataKey="followers"
                title="Follower Growth"
                color="#8b5cf6"
              />
            </motion.div>

            {/* Platform Breakdown */}
            <motion.div
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-xl font-bold text-white mb-4">Platform Breakdown</h3>
              <div className="space-y-4">
                {metrics?.platformBreakdown.map((platform, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{platform.platform}</span>
                      <span className="text-white/70">{platform.followers.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all"
                        style={{ width: `${platform.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Peak Activity Hours */}
          {metrics?.peakActivityHours && (
            <motion.div
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-6 h-6 text-primary-300" />
                <h3 className="text-xl font-bold text-white">Peak Activity Hours</h3>
              </div>
              <div className="grid grid-cols-12 gap-2">
                {Array.from({ length: 24 }, (_, hour) => {
                  const activity = metrics.peakActivityHours.find(a => a.hour === hour)?.activity || 0;
                  const maxActivity = Math.max(...metrics.peakActivityHours.map(a => a.activity));
                  const height = maxActivity > 0 ? (activity / maxActivity) * 100 : 0;
                  
                  return (
                    <div key={hour} className="flex flex-col items-center">
                      <div className="w-full bg-white/10 rounded-t-lg relative" style={{ height: '120px' }}>
                        <div
                          className="absolute bottom-0 w-full bg-gradient-to-t from-primary-500 to-secondary-500 rounded-t-lg transition-all"
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <span className="text-xs text-white/60 mt-2">{hour % 12 || 12}{hour >= 12 ? 'PM' : 'AM'}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

