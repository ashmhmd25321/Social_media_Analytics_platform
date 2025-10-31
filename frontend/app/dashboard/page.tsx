'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui';
import { Card } from '@/components/ui';
import {
  BarChart3,
  Settings,
  LogOut,
  TrendingUp,
  Link2,
  FileText,
  User,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const dashboardCards = [
    {
      icon: TrendingUp,
      title: 'Analytics Overview',
      description: 'View your social media performance metrics',
      gradient: 'from-blue-500 to-cyan-500',
      hoverGradient: 'from-blue-600 to-cyan-600',
    },
    {
      icon: Link2,
      title: 'Connected Accounts',
      description: 'Manage your social media account connections',
      gradient: 'from-purple-500 to-pink-500',
      hoverGradient: 'from-purple-600 to-pink-600',
    },
    {
      icon: FileText,
      title: 'Reports',
      description: 'Generate and view analytics reports',
      gradient: 'from-orange-500 to-red-500',
      hoverGradient: 'from-orange-600 to-red-600',
    },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30">
        {/* Navigation */}
        <nav className="bg-white/80 backdrop-blur-md border-b border-neutral-200/50 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <motion.div
                className="flex items-center gap-2"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-heading font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                  Social Media Analytics
                </h1>
              </motion.div>
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/settings')}
                  className="flex items-center gap-2 hover:bg-primary-50"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Button>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-100">
                  <User className="w-4 h-4 text-neutral-600" />
                  <span className="text-sm text-neutral-700 font-medium">
                    {user?.first_name} {user?.last_name}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="flex items-center gap-2 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 right-10 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute bottom-20 left-10 w-96 h-96 bg-secondary-200/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>

        <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <motion.div
            className="mb-12"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Sparkles className="w-8 h-8 text-primary-500" />
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-heading font-bold bg-gradient-to-r from-neutral-900 via-primary-600 to-secondary-600 bg-clip-text text-transparent">
                Dashboard
              </h2>
            </div>
            <p className="text-lg text-neutral-600 ml-11">
              Welcome back, {user?.first_name}! Here's your social media analytics overview.
            </p>
          </motion.div>

          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardCards.map((card, index) => (
              <motion.div
                key={index}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <Card className="relative overflow-hidden border-2 hover:border-primary-200 transition-all duration-300 cursor-pointer group h-full">
                  {/* Gradient overlay on hover */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                  />
                  
                  <div className="relative p-6">
                    <div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300`}
                    >
                      <card.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-heading font-bold text-neutral-900 mb-2 group-hover:text-primary-600 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-neutral-600 text-sm leading-relaxed">
                      {card.description}
                    </p>
                    <motion.div
                      className="mt-4 flex items-center text-primary-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      initial={{ x: -10 }}
                      whileHover={{ x: 0 }}
                    >
                      Explore <span className="ml-1">→</span>
                    </motion.div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Quick Stats Section */}
          <motion.div
            className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {[
              { label: 'Connected Platforms', value: '0', icon: Link2, color: 'from-blue-500 to-cyan-500' },
              { label: 'Total Followers', value: '0', icon: User, color: 'from-purple-500 to-pink-500' },
              { label: 'Analytics Reports', value: '0', icon: FileText, color: 'from-orange-500 to-red-500' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-neutral-200/50 shadow-sm"
                whileHover={{ scale: 1.05, shadow: 'lg' }}
                transition={{ duration: 0.2 }}
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-neutral-900 mb-1">{stat.value}</div>
                <div className="text-sm text-neutral-600">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
