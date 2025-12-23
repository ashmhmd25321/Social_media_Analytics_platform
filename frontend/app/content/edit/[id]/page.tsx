'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Calendar, X } from 'lucide-react';
import Link from 'next/link';

interface Draft {
  id: number;
  title?: string;
  content: string;
  status: string;
  target_platforms?: number[];
  created_at: string;
  updated_at: string;
}

interface ConnectedAccount {
  id: number;
  platform_name: string;
  platform_display_name: string;
  platform_username?: string;
}

export default function EditDraftPage() {
  const router = useRouter();
  const params = useParams();
  const draftId = parseInt(params.id as string);
  const { user } = useAuth();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<number[]>([]);
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchDraft();
    fetchAccounts();
  }, [draftId]);

  const fetchDraft = async () => {
    try {
      setLoading(true);
      // Use cache with short TTL (10 seconds) for draft data
      const response = await api.get<{ data: Draft }>(`/content/drafts/${draftId}`, true, 10 * 1000);
      if (response.success && response.data) {
        const draftData = response.data;
        setDraft(draftData);
        setContent(draftData.content || '');
        setTitle(draftData.title || '');
        setSelectedPlatforms(draftData.target_platforms || []);
      }
    } catch (error) {
      console.error('Error fetching draft:', error);
      setMessage({ type: 'error', text: 'Failed to load draft' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      // Use cache with short TTL (30 seconds) to reduce requests
      const response = await api.get<{ data: ConnectedAccount[] }>('/social/accounts', true, 30 * 1000);
      if (response.success && response.data) {
        setAccounts(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await api.put(`/content/drafts/${draftId}`, {
        title,
        content,
        target_platforms: selectedPlatforms,
      });

      if (response.success) {
        setMessage({ type: 'success', text: 'Draft updated successfully!' });
        setTimeout(() => {
          // Clear cache for drafts endpoint
          const { apiCache } = require('@/lib/cache');
          apiCache.delete(apiCache.generateKey('/content/drafts'));
          // Set refresh flag for content library page
          sessionStorage.setItem('refresh_content_library', 'true');
          // Dispatch custom event
          window.dispatchEvent(new CustomEvent('refreshContentLibrary'));
          router.push('/content/library');
        }, 1500);
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to update draft' });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update draft',
      });
    } finally {
      setSaving(false);
    }
  };

  const togglePlatform = (accountId: number) => {
    setSelectedPlatforms(prev =>
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary-900/85 via-purple-900/80 to-primary-900/85">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!draft) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary-900/85 via-purple-900/80 to-primary-900/85">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Draft not found</h2>
            <Link href="/content/library" className="text-primary-300 hover:underline">
              Back to Content Library
            </Link>
          </div>
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

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div className="mb-8 text-white" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <Link href="/content/library" className="inline-flex items-center text-white/80 hover:text-white mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Content Library
            </Link>
            <h1 className="text-4xl font-heading font-bold mb-2">Edit Draft</h1>
            <p className="text-white/80">Update your content draft</p>
          </motion.div>

          {message && (
            <motion.div
              className={`mb-6 rounded-xl p-4 backdrop-blur-xl border ${
                message.type === 'success'
                  ? 'bg-green-500/20 border-green-400/30 text-green-100'
                  : 'bg-red-500/20 border-red-400/30 text-red-100'
              }`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {message.text}
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Editor */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title */}
              <motion.div
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <label className="block text-sm font-medium text-white/90 mb-2">Title (Optional)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your post a title..."
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                />
              </motion.div>

              {/* Content Editor */}
              <motion.div
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-sm font-medium text-white/90 mb-2">Content</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What's on your mind? Write your post content here..."
                  rows={12}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none"
                />
                <div className="mt-2 text-sm text-white/60">
                  {content.length} characters
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Platform Selection */}
              <motion.div
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="text-lg font-bold text-white mb-4">Select Platforms</h3>
                {accounts.length === 0 ? (
                  <p className="text-white/60 text-sm">No connected accounts. <Link href="/settings/accounts" className="text-primary-300 hover:underline">Connect one</Link></p>
                ) : (
                  <div className="space-y-2">
                    {accounts.map((account) => (
                      <label
                        key={account.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPlatforms.includes(account.id)}
                          onChange={() => togglePlatform(account.id)}
                          className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-white/30 rounded bg-white/10 checked:bg-primary-500"
                        />
                        <span className="text-white/90 text-sm font-medium">
                          {account.platform_display_name}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Actions */}
              <motion.div
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <button
                  onClick={handleSave}
                  disabled={saving || !content.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

