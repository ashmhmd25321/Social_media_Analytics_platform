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
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    connectedPlatforms: 0,
    totalFollowers: 0,
    analyticsReports: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch connected accounts
      const accountsResponse = await api.get<{ data: any[] }>('/social/accounts');
      const accounts = accountsResponse.data?.data || [];
      
      setStats({
        connectedPlatforms: accounts.length,
        totalFollowers: 0, // Will be calculated from follower metrics
        analyticsReports: 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
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

              {/* Dashboard Cards */}
              <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                {dashboardCards.map((card, index) => (
                  <Link key={index} href={card.href}>
                    <motion.div
                      className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl text-center hover:bg-white/15 transition-all cursor-pointer group"
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
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

              {/* Quick Stats Section */}
              <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                {[
                  { 
                    label: 'Connected Platforms', 
                    value: loading ? '...' : stats.connectedPlatforms.toString(), 
                    icon: Link2, 
                    gradient: 'from-blue-500 to-cyan-500' 
                  },
                  { 
                    label: 'Total Followers', 
                    value: loading ? '...' : stats.totalFollowers.toString(), 
                    icon: User, 
                    gradient: 'from-purple-500 to-pink-500' 
                  },
                  { 
                    label: 'Analytics Reports', 
                    value: loading ? '...' : stats.analyticsReports.toString(), 
                    icon: FileText, 
                    gradient: 'from-orange-500 to-red-500' 
                  },
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl"
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 1 + index * 0.1 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                  >
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-3 shadow-lg`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-4xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-sm text-white/70">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </main>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
