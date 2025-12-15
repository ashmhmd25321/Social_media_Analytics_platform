'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function CreateCampaignPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    campaign_type: 'engagement' as 'awareness' | 'engagement' | 'conversion' | 'retention' | 'custom',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    budget: '',
    goals: {
      target_engagement: '',
      target_followers: '',
    },
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.start_date) {
      alert('Name and start date are required');
      return;
    }

    setIsSaving(true);
    try {
      const response = await api.post('/campaigns', {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        end_date: formData.end_date || undefined,
        goals: {
          target_engagement: formData.goals.target_engagement ? parseInt(formData.goals.target_engagement) : undefined,
          target_followers: formData.goals.target_followers ? parseInt(formData.goals.target_followers) : undefined,
        },
        status: 'draft',
      });
      if (response.success) {
        router.push(`/campaigns/${response.data.id}`);
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign');
    } finally {
      setIsSaving(false);
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

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div 
            className="mb-8 text-white"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <Link href="/campaigns" className="inline-flex items-center text-white/80 hover:text-white mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Campaigns
            </Link>
            <h1 className="text-4xl font-heading font-bold mb-2">Create Campaign</h1>
            <p className="text-white/80">Set up a new marketing campaign</p>
          </motion.div>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg space-y-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Campaign Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Summer Product Launch"
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Campaign description and objectives"
                rows={4}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2" htmlFor="campaign-type">Campaign Type</label>
                <select
                  id="campaign-type"
                  value={formData.campaign_type}
                  onChange={(e) => setFormData({ ...formData, campaign_type: e.target.value as any })}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-400 min-h-[44px]"
                  aria-label="Campaign type"
                >
                  <option value="awareness">Awareness</option>
                  <option value="engagement">Engagement</option>
                  <option value="conversion">Conversion</option>
                  <option value="retention">Retention</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2" htmlFor="budget">Budget ($)</label>
                <input
                  id="budget"
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400 min-h-[44px]"
                  aria-label="Campaign budget in dollars"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2" htmlFor="start-date">Start Date *</label>
                <input
                  id="start-date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-400 min-h-[44px]"
                  required
                  aria-required="true"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2" htmlFor="end-date">End Date</label>
                <input
                  id="end-date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-400 min-h-[44px]"
                  aria-label="Campaign end date"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Goals (Optional)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                  type="number"
                  value={formData.goals.target_engagement}
                  onChange={(e) => setFormData({
                    ...formData,
                    goals: { ...formData.goals, target_engagement: e.target.value },
                  })}
                  placeholder="Target Engagement"
                  className="px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400 min-h-[44px]"
                  aria-label="Target engagement goal"
                />
                <input
                  type="number"
                  value={formData.goals.target_followers}
                  onChange={(e) => setFormData({
                    ...formData,
                    goals: { ...formData.goals, target_followers: e.target.value },
                  })}
                  placeholder="Target Followers"
                  className="px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400 min-h-[44px]"
                  aria-label="Target followers goal"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all shadow-lg disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Creating...' : 'Create Campaign'}
              </button>
              <Link
                href="/campaigns"
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Cancel
              </Link>
            </div>
          </motion.form>
        </div>
      </div>
    </ProtectedRoute>
  );
}

