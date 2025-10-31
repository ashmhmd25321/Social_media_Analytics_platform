'use client';

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { BarChart3, TrendingUp, Users, Zap, CheckCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HomePage() {
  return (
    <div className="min-h-screen relative flex flex-col bg-gradient-to-br from-neutral-50 via-white to-primary-50/50">
      {/* Simple, clean background with subtle pattern */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <motion.nav
          className="flex justify-between items-center py-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-heading font-bold text-primary-600 flex items-center gap-2">
            <BarChart3 className="w-7 h-7" />
            Social Media Analytics
          </h1>
          <div className="flex space-x-4">
            <Link href="/auth/login">
              <Button variant="ghost" className="hover:bg-primary-50">
                Login
              </Button>
            </Link>
            <Link href="/auth/register">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button variant="primary" className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600">
                  Sign Up
                </Button>
              </motion.div>
            </Link>
          </div>
        </motion.nav>

        <main className="py-20 flex-1 flex items-center">
          <div className="text-center w-full max-w-4xl mx-auto">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-neutral-900 mb-6 leading-tight">
                Unified Social Media
                <br />
                <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                  Analytics Platform
                </span>
              </h2>
            </motion.div>
            
            <motion.p
              className="text-xl md:text-2xl text-neutral-600 mb-12 leading-relaxed"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Manage, analyze, and optimize your social media presence across multiple platforms with real-time analytics and actionable insights.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-20"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Link href="/auth/register">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="primary"
                    size="lg"
                    className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white shadow-lg shadow-primary-500/30 flex items-center gap-2 px-8 py-6 text-lg"
                  >
                    Get Started <ArrowRight className="w-5 h-5" />
                  </Button>
                </motion.div>
              </Link>
              <Link href="/auth/login">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-2 border-primary-300 text-primary-600 hover:bg-primary-50 px-8 py-6 text-lg"
                  >
                    Sign In
                  </Button>
                </motion.div>
              </Link>
            </motion.div>

            {/* Features Grid - Clean and Simple */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              {[
                {
                  icon: TrendingUp,
                  title: 'Real-Time Analytics',
                  description: 'Track your performance metrics in real-time across all platforms',
                  color: 'from-blue-500 to-cyan-500',
                },
                {
                  icon: Users,
                  title: 'Multi-Platform',
                  description: 'Connect and manage all your social media accounts in one place',
                  color: 'from-purple-500 to-pink-500',
                },
                {
                  icon: Zap,
                  title: 'Actionable Insights',
                  description: 'Get AI-powered recommendations to improve your engagement',
                  color: 'from-orange-500 to-red-500',
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="bg-white rounded-2xl p-8 border border-neutral-200 shadow-sm hover:shadow-md transition-all duration-300"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 1 + index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 mx-auto`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-heading font-bold text-neutral-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-neutral-600 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            {/* Trust Indicators - Simple */}
            <motion.div
              className="mt-16 flex flex-wrap justify-center items-center gap-8 text-neutral-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.4 }}
            >
              {[
                'Secure & Private',
                '24/7 Support',
                'Enterprise Ready',
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary-500" />
                  <span className="text-sm md:text-base">{item}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
