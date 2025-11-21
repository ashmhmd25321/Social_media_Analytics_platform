'use client';

import Link from 'next/link';
import { TrendingUp, Users, Zap, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';

export default function HomePage() {
  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background with image overlay - different from login/register pages */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1920&q=80)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-secondary-900/85 via-purple-900/80 to-primary-900/85"></div>
      </div>

      {/* Animated gradient orbs - matching login/register pages */}
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
        {/* Navbar */}
        <Navbar />

        {/* Main Content Container */}
        <div className="max-w-7xl mx-auto w-full pt-24">

          {/* Hero Section */}
          <main className="max-w-6xl mx-auto px-6 py-20">
          <motion.div
            className="text-center mb-16"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Social Media Analytics
              <br />
              <span className="bg-gradient-to-r from-secondary-300 to-primary-300 bg-clip-text text-transparent">
                Made Simple
              </span>
            </h1>
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              Track, analyze, and grow your social media presence across all platforms in one beautiful dashboard.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/auth/register">
                <motion.button
                  className="px-8 py-3 text-base font-medium bg-gradient-to-r from-secondary-500 to-primary-500 hover:from-secondary-600 hover:to-primary-600 text-white rounded-lg shadow-lg shadow-secondary-500/50 hover:shadow-xl transition-all flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Start Free Trial <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
              <Link href="/auth/login">
                <motion.button
                  className="px-8 py-3 text-base font-medium border-2 border-white/30 text-white hover:bg-white/10 rounded-lg transition-colors backdrop-blur-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Sign In
                </motion.button>
              </Link>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            id="features"
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {[
              {
                icon: TrendingUp,
                title: 'Real-Time Analytics',
                description: 'Monitor your performance metrics in real-time across all platforms',
              },
              {
                icon: Users,
                title: 'Multi-Platform',
                description: 'Connect and manage all your social media accounts from one place',
              },
              {
                icon: Zap,
                title: 'Smart Insights',
                description: 'Get AI-powered recommendations to improve your engagement',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl text-center hover:bg-white/15 transition-all"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <div className="w-14 h-14 bg-gradient-to-br from-secondary-400 to-primary-400 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-white/70 text-sm">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </main>
        </div>
      </div>
    </div>
  );
}
