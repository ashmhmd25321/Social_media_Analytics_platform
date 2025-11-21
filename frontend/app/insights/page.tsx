'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { Lightbulb, TrendingUp, AlertCircle, Target, X, RefreshCw, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Insight {
  id: number;
  insight_type: 'performance' | 'recommendation' | 'trend' | 'opportunity';
  category: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionable: boolean;
  action_url?: string;
  confidence_score: number;
  created_at: string;
}

export default function InsightsPage() {
  const { user } = useAuth();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ data: Insight[] }>('/insights');
      if (response.success && response.data) {
        setInsights(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = async () => {
    try {
      setGenerating(true);
      const response = await api.post('/insights/generate');
      if (response.success) {
        await fetchInsights();
      }
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setGenerating(false);
    }
  };

  const dismissInsight = async (id: number) => {
    try {
      const response = await api.post(`/insights/${id}/dismiss`);
      if (response.success) {
        setInsights(insights.filter(insight => insight.id !== id));
      }
    } catch (error) {
      console.error('Error dismissing insight:', error);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'performance':
        return TrendingUp;
      case 'recommendation':
        return Target;
      case 'trend':
        return TrendingUp;
      case 'opportunity':
        return Lightbulb;
      default:
        return Lightbulb;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'from-red-500 to-orange-500';
      case 'high':
        return 'from-orange-500 to-yellow-500';
      case 'medium':
        return 'from-blue-500 to-cyan-500';
      case 'low':
        return 'from-gray-500 to-gray-600';
      default:
        return 'from-blue-500 to-cyan-500';
    }
  };

  const groupedInsights = insights.reduce((acc, insight) => {
    if (!acc[insight.insight_type]) {
      acc[insight.insight_type] = [];
    }
    acc[insight.insight_type].push(insight);
    return acc;
  }, {} as Record<string, Insight[]>);

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
          <motion.div className="mb-8 text-white" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-heading font-bold mb-2">Insights & Recommendations</h1>
                <p className="text-white/80">AI-powered insights to help optimize your social media strategy</p>
              </div>
              <button
                onClick={generateInsights}
                disabled={generating}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all shadow-lg shadow-primary-500/30 hover:shadow-xl disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${generating ? 'animate-spin' : ''}`} />
                {generating ? 'Generating...' : 'Generate Insights'}
              </button>
            </div>
          </motion.div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            </div>
          ) : insights.length === 0 ? (
            <motion.div
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 border-2 border-white/20 shadow-lg text-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <Lightbulb className="w-16 h-16 text-white/40 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No insights yet</h3>
              <p className="text-white/60 mb-6">Generate insights to get personalized recommendations</p>
              <button
                onClick={generateInsights}
                disabled={generating}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all shadow-lg"
              >
                <RefreshCw className={`w-5 h-5 ${generating ? 'animate-spin' : ''}`} />
                Generate Insights
              </button>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedInsights).map(([type, typeInsights]) => (
                <motion.div
                  key={type}
                  className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                >
                  <h2 className="text-2xl font-bold text-white mb-4 capitalize">{type} Insights</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {typeInsights.map((insight) => {
                      const Icon = getInsightIcon(insight.insight_type);
                      return (
                        <motion.div
                          key={insight.id}
                          className="bg-white/5 rounded-xl p-5 border border-white/10 hover:border-white/20 transition-all"
                          whileHover={{ y: -2 }}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getPriorityColor(insight.priority)} flex items-center justify-center`}>
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-white">{insight.title}</h3>
                                <span className="text-xs text-white/60 capitalize">{insight.category}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => dismissInsight(insight.id)}
                              className="text-white/40 hover:text-white transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-white/70 text-sm mb-4">{insight.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-white/60">
                              <span>Confidence: {(insight.confidence_score * 100).toFixed(0)}%</span>
                              <span className="px-2 py-1 rounded bg-white/10 text-white/80 capitalize text-xs">
                                {insight.priority}
                              </span>
                            </div>
                            {insight.actionable && insight.action_url && (
                              <Link
                                href={insight.action_url}
                                className="inline-flex items-center gap-1 text-sm text-primary-300 hover:text-primary-200 transition-colors"
                              >
                                Take Action
                                <ArrowRight className="w-4 h-4" />
                              </Link>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

