'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { FileText, TrendingUp, Image, Video, File, ArrowLeft, Download, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { MetricCard } from '@/components/analytics';
import { usePageRefresh } from '@/hooks/usePageRefresh';

interface TopPost {
  id: number;
  content: string;
  platform: string;
  published_at: string;
  likes: number;
  comments: number;
  shares: number;
  engagement_rate: number;
  permalink?: string;
}

interface ContentTypeMetrics {
  text: number;
  image: number;
  video: number;
  carousel: number;
}

interface ContentPerformance {
  totalPosts: number;
  averageEngagementRate: number;
  topPosts: TopPost[];
  contentTypeBreakdown: ContentTypeMetrics;
  bestPostingDays: Array<{ day: string; engagement: number }>;
}

export default function ContentPerformancePage() {
  const { user } = useAuth();
  const [performance, setPerformance] = useState<ContentPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<number>(30);

  const fetchContentData = async () => {
    try {
      setLoading(true);
      
      // Fetch content performance metrics - DISABLE CACHE for fresh data
      const performanceResponse = await api.get<{ data: ContentPerformance }>(`/analytics/content/performance?days=${timeRange}`, false);
      
      // Fetch top posts - DISABLE CACHE for fresh data (filtered by time range)
      const topPostsResponse = await api.get<{ data: TopPost[] }>(`/analytics/posts/top?limit=10&days=${timeRange}`, false);
      
      if (performanceResponse.success && performanceResponse.data) {
        const performanceData = performanceResponse.data;
        const topPosts = topPostsResponse.success && topPostsResponse.data ? topPostsResponse.data : [];
        
        setPerformance({
          totalPosts: performanceData.totalPosts,
          averageEngagementRate: performanceData.averageEngagementRate,
          topPosts: topPosts,
          contentTypeBreakdown: performanceData.contentTypeBreakdown,
          bestPostingDays: performanceData.bestPostingDays,
        });
      } else {
        // If no data available, set empty state
        setPerformance({
          totalPosts: 0,
          averageEngagementRate: 0,
          topPosts: topPostsResponse.success && topPostsResponse.data ? topPostsResponse.data : [],
          contentTypeBreakdown: {
            text: 0,
            image: 0,
            video: 0,
            carousel: 0,
          },
          bestPostingDays: [
            { day: 'Monday', engagement: 0 },
            { day: 'Tuesday', engagement: 0 },
            { day: 'Wednesday', engagement: 0 },
            { day: 'Thursday', engagement: 0 },
            { day: 'Friday', engagement: 0 },
            { day: 'Saturday', engagement: 0 },
            { day: 'Sunday', engagement: 0 },
          ],
        });
      }
    } catch (error) {
      console.error('Error fetching content data:', error);
      // Set empty state on error
      setPerformance({
        totalPosts: 0,
        averageEngagementRate: 0,
        topPosts: [],
        contentTypeBreakdown: {
          text: 0,
          image: 0,
          video: 0,
          carousel: 0,
        },
        bestPostingDays: [
          { day: 'Monday', engagement: 0 },
          { day: 'Tuesday', engagement: 0 },
          { day: 'Wednesday', engagement: 0 },
          { day: 'Thursday', engagement: 0 },
          { day: 'Friday', engagement: 0 },
          { day: 'Saturday', engagement: 0 },
          { day: 'Sunday', engagement: 0 },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  // Use the refresh hook to refetch data when page becomes visible or when navigating back
  usePageRefresh(fetchContentData, [timeRange]);

  const exportData = () => {
    // TODO: Implement CSV/PDF export
    alert('Export functionality coming soon!');
  };

  const getContentTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'image':
        return Image;
      case 'video':
        return Video;
      case 'carousel':
        return File;
      default:
        return FileText;
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
                <h1 className="text-4xl font-heading font-bold mb-2">Content Performance</h1>
                <p className="text-white/80">Top posts, content type analysis, and performance metrics</p>
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
              title="Total Posts"
              value={performance?.totalPosts.toString() || '0'}
              icon={FileText}
              trend={0}
              delay={0.1}
            />
            <MetricCard
              title="Avg Engagement Rate"
              value={`${performance?.averageEngagementRate.toFixed(1) || '0'}%`}
              icon={TrendingUp}
              trend={performance?.averageEngagementRate || 0}
              delay={0.2}
            />
            <MetricCard
              title="Top Post Engagement"
              value={performance?.topPosts[0]?.engagement_rate.toFixed(1) + '%' || '0%'}
              icon={TrendingUp}
              trend={performance?.topPosts[0]?.engagement_rate || 0}
              delay={0.3}
            />
          </div>

          {/* Content Type Breakdown */}
          {performance?.contentTypeBreakdown && (
            <motion.div
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg mb-8"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-xl font-bold text-white mb-4">Content Type Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(performance.contentTypeBreakdown).map(([type, count]) => {
                  const Icon = getContentTypeIcon(type);
                  const total = Object.values(performance.contentTypeBreakdown).reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? (count / total) * 100 : 0;
                  
                  return (
                    <div key={type} className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Icon className="w-5 h-5 text-primary-300" />
                        <span className="text-white font-medium capitalize">{type}</span>
                      </div>
                      <div className="text-2xl font-bold text-white mb-1">{count}</div>
                      <div className="text-sm text-white/60">{percentage.toFixed(1)}% of total</div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Top Posts */}
          <motion.div
            className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-xl font-bold text-white mb-4">Top Performing Posts</h3>
            <div className="space-y-4">
              {performance?.topPosts.length > 0 ? (
                performance.topPosts.map((post, index) => (
                  <div
                    key={post.id}
                    className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-primary-500/20 text-primary-300 rounded text-xs font-medium">
                            #{index + 1}
                          </span>
                          <span className="px-2 py-1 bg-white/10 text-white/70 rounded text-xs capitalize">
                            {post.platform}
                          </span>
                          <span className="text-xs text-white/60">
                            {new Date(post.published_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-white/90 mb-3 line-clamp-2">{post.content || 'No content'}</p>
                        <div className="flex items-center gap-4 text-sm text-white/70">
                          <span>❤️ {post.likes.toLocaleString()}</span>
                          <span>💬 {post.comments.toLocaleString()}</span>
                          <span>🔁 {post.shares.toLocaleString()}</span>
                          <span className="text-primary-300 font-medium">
                            {post.engagement_rate.toFixed(1)}% engagement
                          </span>
                        </div>
                      </div>
                      {post.permalink && (
                        <a
                          href={post.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-5 h-5 text-white/70" />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-white/60">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No posts found. Connect accounts and sync data to see your top posts.</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Best Posting Days */}
          {performance?.bestPostingDays && (
            <motion.div
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <h3 className="text-xl font-bold text-white mb-4">Best Posting Days</h3>
              <div className="space-y-2">
                {performance.bestPostingDays.map((day, index) => {
                  const engagement = Number(day.engagement) || 0;
                  
                  return (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-white/10 last:border-b-0">
                      <span className="text-white font-medium">{day.day}</span>
                      <span className="text-white/70 font-semibold">{engagement.toLocaleString()} avg engagement</span>
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

