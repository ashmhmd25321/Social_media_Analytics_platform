'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { Plus, Target, TrendingUp, Calendar, DollarSign, ArrowRight, Play, Pause, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface Campaign {
  id: number;
  name: string;
  description?: string;
  campaign_type: string;
  start_date: string;
  end_date?: string;
  budget?: number;
  status: string;
  created_at: string;
}

export default function CampaignsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchCampaigns();
  }, [filter]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const status = filter === 'all' ? undefined : filter;
      const response = await api.get<{ data: Campaign[] }>(`/campaigns${status ? `?status=${status}` : ''}`);
      if (response.success && response.data) {
        setCampaigns(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-300';
      case 'paused':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'completed':
        return 'bg-blue-500/20 text-blue-300';
      case 'draft':
        return 'bg-gray-500/20 text-gray-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="w-4 h-4" />;
      case 'paused':
        return <Pause className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

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
            className="mb-8 text-white"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-heading font-bold mb-2">Campaigns</h1>
                <p className="text-white/80">Create and manage your marketing campaigns</p>
              </div>
              <Link
                href="/campaigns/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all shadow-lg shadow-primary-500/30 hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                Create Campaign
              </Link>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            className="mb-6 flex gap-2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {['all', 'draft', 'active', 'paused', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                  filter === status
                    ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                {status}
              </button>
            ))}
          </motion.div>

          {/* Campaigns List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            </div>
          ) : campaigns.length === 0 ? (
            <motion.div
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 border-2 border-white/20 shadow-lg text-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <Target className="w-16 h-16 text-white/40 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No campaigns yet</h3>
              <p className="text-white/60 mb-6">Create your first campaign to get started</p>
              <Link
                href="/campaigns/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Create Campaign
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" role="list" aria-label="Campaigns">
              {campaigns.map((campaign, index) => (
                <motion.div
                  key={campaign.id}
                  className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg hover:border-primary-300 transition-all cursor-pointer"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  whileHover={{ y: -4 }}
                  onClick={() => router.push(`/campaigns/${campaign.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">{campaign.name}</h3>
                      {campaign.description && (
                        <p className="text-white/60 text-sm line-clamp-2 mb-2">{campaign.description}</p>
                      )}
                      <div className="flex items-center gap-2">
                        {getStatusIcon(campaign.status)}
                        <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-white/60 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(campaign.start_date).toLocaleDateString()}
                        {campaign.end_date && ` - ${new Date(campaign.end_date).toLocaleDateString()}`}
                      </span>
                    </div>
                    {campaign.budget && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span>${campaign.budget.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      <span className="capitalize">{campaign.campaign_type}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-primary-300">
                    <span className="text-sm font-medium">View Details</span>
                    <ArrowRight className="w-4 h-4" />
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

