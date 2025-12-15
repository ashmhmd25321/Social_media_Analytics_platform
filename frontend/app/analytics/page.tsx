'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { motion } from 'framer-motion';
import { 
  Users, 
  FileText, 
  Heart, 
  TrendingUp,
  ArrowRight,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import Link from 'next/link';

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'audience' | 'content' | 'engagement'>('overview');

  const analyticsSections = [
    {
      id: 'overview' as const,
      title: 'Overview',
      description: 'Key metrics and performance summary',
      icon: BarChart3,
      gradient: 'from-blue-500 to-cyan-500',
      href: '/analytics',
    },
    {
      id: 'audience' as const,
      title: 'Audience Analytics',
      description: 'Follower growth, demographics, and activity patterns',
      icon: Users,
      gradient: 'from-purple-500 to-pink-500',
      href: '/analytics/audience',
    },
    {
      id: 'content' as const,
      title: 'Content Performance',
      description: 'Top posts, content type analysis, and performance metrics',
      icon: FileText,
      gradient: 'from-green-500 to-emerald-500',
      href: '/analytics/content',
    },
    {
      id: 'engagement' as const,
      title: 'Engagement Metrics',
      description: 'Likes, comments, shares trends, and response times',
      icon: Heart,
      gradient: 'from-orange-500 to-red-500',
      href: '/analytics/engagement',
    },
  ];

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

        {/* Animated gradient orbs */}
        <motion.div
          className="absolute top-20 right-20 w-72 h-72 bg-secondary-400/20 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div 
            className="mb-8 text-white"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <h1 className="text-4xl font-heading font-bold mb-2">Analytics Dashboard</h1>
            <p className="text-white/80">Comprehensive analytics and insights for your social media presence</p>
          </motion.div>

          {/* Analytics Sections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {analyticsSections.map((section, index) => {
              const Icon = section.icon;
              return (
                <Link key={section.id} href={section.href}>
                  <motion.div
                    className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg hover:border-white/40 transition-all cursor-pointer group"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${section.gradient} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-white/80 group-hover:translate-x-1 transition-all" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{section.title}</h3>
                    <p className="text-white/70 text-sm">{section.description}</p>
                  </motion.div>
                </Link>
              );
            })}
          </div>

          {/* Quick Stats Preview */}
          <motion.div
            className="mt-8 bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-2xl font-bold text-white mb-4">Quick Access</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/dashboard">
                <div className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-primary-300" />
                    <span className="text-white font-medium">Dashboard Overview</span>
                  </div>
                </div>
              </Link>
              <Link href="/reports">
                <div className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary-300" />
                    <span className="text-white font-medium">Generate Reports</span>
                  </div>
                </div>
              </Link>
              <Link href="/insights">
                <div className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-primary-300" />
                    <span className="text-white font-medium">AI Insights</span>
                  </div>
                </div>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

