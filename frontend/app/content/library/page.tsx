'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Edit, Trash2, Calendar, FileText, Archive, Search, X } from 'lucide-react';
import Link from 'next/link';

interface Draft {
  id: number;
  title?: string;
  content: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function ContentLibraryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [allDrafts, setAllDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDrafts();
  }, [filter]);

  // Refresh drafts when page becomes visible (e.g., after navigation)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchDrafts();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      const status = filter === 'all' ? undefined : filter;
      // Don't include status parameter if it's undefined or empty
      const url = status && status.trim() !== '' 
        ? `/content/drafts?status=${status}` 
        : '/content/drafts';
      const response = await api.get<{ data: Draft[] }>(url);
      if (response.success && response.data) {
        const fetchedDrafts = Array.isArray(response.data) ? response.data : [];
        setAllDrafts(fetchedDrafts);
        setDrafts(fetchedDrafts);
      } else {
        console.error('Failed to fetch drafts:', response.message);
        setError(response.message || 'Failed to fetch drafts');
        setDrafts([]);
      }
    } catch (error: any) {
      console.error('Error fetching drafts:', error);
      setError(error.message || 'Failed to fetch drafts. Please try again.');
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this draft?')) return;

    try {
      const response = await api.delete(`/content/drafts/${id}`);
      if (response.success) {
        const updated = drafts.filter(d => d.id !== id);
        setDrafts(updated);
        setAllDrafts(allDrafts.filter(d => d.id !== id));
      }
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
  };

  // Filter drafts based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      // Apply status filter only
      if (filter === 'all') {
        setDrafts(allDrafts);
      } else {
        setDrafts(allDrafts.filter(d => d.status === filter));
      }
    } else {
      // Apply both search and status filter
      const query = searchQuery.toLowerCase();
      let filtered = allDrafts.filter(d => {
        const matchesSearch = 
          (d.title?.toLowerCase().includes(query) || false) ||
          d.content.toLowerCase().includes(query);
        const matchesFilter = filter === 'all' || d.status === filter;
        return matchesSearch && matchesFilter;
      });
      setDrafts(filtered);
    }
  }, [searchQuery, filter, allDrafts]);

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
            <Link href="/dashboard" className="inline-flex items-center text-white/80 hover:text-white mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-heading font-bold mb-2">Content Library</h1>
                <p className="text-white/80">Manage your drafts and scheduled posts</p>
              </div>
              <Link
                href="/content/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all shadow-lg shadow-primary-500/30 hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                Create New
              </Link>
            </div>
          </motion.div>

          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            {/* Search Bar */}
            <motion.div
              className="relative"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title or content..."
                className="w-full pl-12 pr-12 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </motion.div>

            {/* Status Filters */}
            <motion.div
              className="flex gap-2 flex-wrap"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              {['all', 'draft', 'scheduled', 'published', 'archived'].map((status) => (
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
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              className="mb-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-200"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between">
                <span>{error}</span>
                <button
                  onClick={() => {
                    setError(null);
                    fetchDrafts();
                  }}
                  className="text-red-300 hover:text-red-200 text-sm underline"
                >
                  Retry
                </button>
              </div>
            </motion.div>
          )}

          {/* Drafts List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            </div>
          ) : drafts.length === 0 ? (
            <motion.div
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 border-2 border-white/20 shadow-lg text-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <FileText className="w-16 h-16 text-white/40 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No drafts yet</h3>
              <p className="text-white/60 mb-6">Create your first content draft to get started</p>
              <Link
                href="/content/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Create Draft
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {drafts.map((draft, index) => (
                <motion.div
                  key={draft.id}
                  className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg hover:border-primary-300 transition-all"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">
                        {draft.title || 'Untitled Draft'}
                      </h3>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        draft.status === 'draft' ? 'bg-blue-500/20 text-blue-300' :
                        draft.status === 'scheduled' ? 'bg-purple-500/20 text-purple-300' :
                        draft.status === 'published' ? 'bg-green-500/20 text-green-300' :
                        'bg-gray-500/20 text-gray-300'
                      }`}>
                        {draft.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-white/70 text-sm mb-4 line-clamp-3">
                    {draft.content}
                  </p>
                  <div className="flex items-center justify-between text-xs text-white/60 mb-4">
                    <span>Updated {new Date(draft.updated_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/content/edit/${draft.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(draft.id)}
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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

