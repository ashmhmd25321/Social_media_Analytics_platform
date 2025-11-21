'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import {
  BarChart3,
  Settings,
  LogOut,
  TrendingUp,
  Link2,
  FileText,
  User,
  Sparkles,
  ArrowRight,
  Activity,
  Users,
  Heart,
  MessageCircle,
  Share2,
  Brain,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { MetricCard, LineChart, BarChart } from '@/components/analytics';

interface OverviewMetrics {
  totalFollowers: number;
  totalPosts: number;
  totalEngagement: number;
  averageEngagementRate: number;
  connectedPlatforms: number;
  growthRate: number;
}

interface FollowerTrend {
  date: string;
  followers: number;
  platform: string;
}

interface EngagementTrend {
  date: string;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
}

interface PlatformComparison {
  platform: string;
  followers: number;
  posts: number;
  engagement: number;
  engagementRate: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [overview, setOverview] = useState<OverviewMetrics | null>(null);
  const [followerTrends, setFollowerTrends] = useState<FollowerTrend[]>([]);
  const [engagementTrends, setEngagementTrends] = useState<EngagementTrend[]>([]);
  const [platformComparison, setPlatformComparison] = useState<PlatformComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<number>(30);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch overview metrics
      const overviewResponse = await api.get<{ data: OverviewMetrics }>('/analytics/overview');
      if (overviewResponse.success && overviewResponse.data) {
        setOverview(overviewResponse.data);
      }

      // Fetch follower trends
      const followerResponse = await api.get<{ data: FollowerTrend[] }>(`/analytics/followers/trends?days=${timeRange}`);
      if (followerResponse.success && followerResponse.data) {
        setFollowerTrends(followerResponse.data);
      }

      // Fetch engagement trends
      const engagementResponse = await api.get<{ data: EngagementTrend[] }>(`/analytics/engagement/trends?days=${timeRange}`);
      if (engagementResponse.success && engagementResponse.data) {
        setEngagementTrends(engagementResponse.data);
      }

      // Fetch platform comparison
      const platformResponse = await api.get<{ data: PlatformComparison[] }>('/analytics/platforms/comparison');
      if (platformResponse.success && platformResponse.data) {
        setPlatformComparison(platformResponse.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const dashboardCards = [
    {
      icon: TrendingUp,
      title: 'Analytics Overview',
      description: 'View your social media performance metrics',
      gradient: 'from-blue-500 to-cyan-500',
      href: '/analytics',
    },
    {
      icon: Link2,
      title: 'Connected Accounts',
      description: 'Manage your social media account connections',
      gradient: 'from-purple-500 to-pink-500',
      href: '/settings/accounts',
    },
    {
      icon: FileText,
      title: 'Content Library',
      description: 'Create and schedule your social media posts',
      gradient: 'from-green-500 to-emerald-500',
      href: '/content/library',
    },
    {
      icon: Brain,
      title: 'NLP & AI Features',
      description: 'Analyze sentiment, extract keywords, and get AI recommendations',
      gradient: 'from-indigo-500 to-purple-500',
      href: '/nlp',
    },
    {
      icon: BarChart3,
      title: 'Reports',
      description: 'Generate and view analytics reports',
      gradient: 'from-orange-500 to-red-500',
      href: '/reports',
    },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen relative flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background with image overlay - matching homepage */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1920&q=80)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-secondary-900/85 via-purple-900/80 to-primary-900/85"></div>
        </div>

        {/* Animated gradient orbs - matching homepage */}
        <motion.div
          className="absolute top-20 right-20 w-72 h-72 bg-secondary-400/20 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-20 left-20 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <div className="relative z-10 w-full">
          {/* Navigation */}
          <nav className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-xl border-b border-white/20 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <Link href="/" className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary-400 to-primary-400 flex items-center justify-center shadow-lg">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xl font-bold text-white tracking-tight">
                    <span className="bg-gradient-to-r from-secondary-300 to-primary-300 bg-clip-text text-transparent">
                      Metric
                    </span>
                    Pulse
                  </span>
                </Link>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => router.push('/settings')}
                    className="text-white/80 hover:text-white transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm">
                    <User className="w-4 h-4 text-white/80" />
                    <span className="text-sm text-white font-medium">
                      {user?.first_name} {user?.last_name}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 rounded-lg transition-all shadow-lg flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto w-full pt-24">
            <main className="max-w-6xl mx-auto px-6 py-20">
              {/* Welcome Section */}
              <motion.div
                className="text-center mb-16"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="flex items-center justify-center gap-3 mb-4">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Sparkles className="w-8 h-8 text-secondary-300" />
                  </motion.div>
                  <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
                    Welcome back, {user?.first_name}!
                  </h1>
                </div>
                <p className="text-xl text-white/80 mb-6 max-w-2xl mx-auto">
                  Here's your social media analytics overview
                </p>
              </motion.div>


              {/* Time Range Filter */}
              <motion.div
                className="mb-6 flex items-center justify-between"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <h2 className="text-2xl font-bold text-white">Analytics Overview</h2>
                <div className="flex gap-2">
                  {[7, 30, 90].map((days) => (
                    <button
                      key={days}
                      onClick={() => setTimeRange(days)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        timeRange === days
                          ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                          : 'bg-white/10 text-white/80 hover:bg-white/20'
                      }`}
                    >
                      {days} days
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Key Metrics Cards */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 animate-pulse"
                    >
                      <div className="h-20 bg-white/10 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : overview ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <MetricCard
                    title="Total Followers"
                    value={overview.totalFollowers}
                    icon={Users}
                    trend={{
                      value: overview.growthRate,
                      isPositive: overview.growthRate >= 0,
                    }}
                    gradient="from-blue-500 to-cyan-500"
                    delay={0.1}
                  />
                  <MetricCard
                    title="Total Posts"
                    value={overview.totalPosts}
                    icon={FileText}
                    gradient="from-purple-500 to-pink-500"
                    delay={0.2}
                  />
                  <MetricCard
                    title="Total Engagement"
                    value={overview.totalEngagement}
                    icon={Heart}
                    gradient="from-orange-500 to-red-500"
                    delay={0.3}
                  />
                  <MetricCard
                    title="Avg Engagement Rate"
                    value={`${overview.averageEngagementRate.toFixed(2)}%`}
                    icon={TrendingUp}
                    gradient="from-green-500 to-emerald-500"
                    delay={0.4}
                  />
                </div>
              ) : null}

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Follower Growth Chart */}
                {followerTrends.length > 0 && (
                  <LineChart
                    data={followerTrends.map(t => ({
                      date: t.date,
                      followers: t.followers,
                    }))}
                    dataKey="followers"
                    title="Follower Growth"
                    color="#8b5cf6"
                    delay={0.5}
                  />
                )}

                {/* Engagement Trends Chart */}
                {engagementTrends.length > 0 && (
                  <LineChart
                    data={engagementTrends.map(t => ({
                      date: t.date,
                      likes: t.likes,
                      comments: t.comments,
                      shares: t.shares,
                    }))}
                    dataKeys={[
                      { key: 'likes', name: 'Likes', color: '#ec4899' },
                      { key: 'comments', name: 'Comments', color: '#3b82f6' },
                      { key: 'shares', name: 'Shares', color: '#10b981' },
                    ]}
                    title="Engagement Trends"
                    delay={0.6}
                  />
                )}
              </div>

              {/* Platform Comparison */}
              {platformComparison.length > 0 && (
                <BarChart
                  data={platformComparison}
                  dataKeys={[
                    { key: 'followers', name: 'Followers', color: '#8b5cf6' },
                    { key: 'posts', name: 'Posts', color: '#ec4899' },
                    { key: 'engagement', name: 'Engagement', color: '#f59e0b' },
                  ]}
                  title="Platform Comparison"
                  delay={0.7}
                />
              )}

              {/* Quick Actions */}
              <motion.div
                className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                {dashboardCards.map((card, index) => (
                  <Link key={index} href={card.href}>
                    <motion.div
                      className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl text-center hover:bg-white/15 transition-all cursor-pointer group"
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.9 + index * 0.1 }}
                      whileHover={{ y: -5, scale: 1.02 }}
                    >
                      <div className={`w-14 h-14 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                        <card.icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">{card.title}</h3>
                      <p className="text-white/70 text-sm mb-4">
                        {card.description}
                      </p>
                      <div className="flex items-center justify-center text-secondary-300 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        Explore <ArrowRight className="w-4 h-4 ml-1" />
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </motion.div>
            </main>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
