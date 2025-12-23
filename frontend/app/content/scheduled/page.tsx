'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, X, CheckCircle, Clock, AlertCircle, CalendarDays } from 'lucide-react';
import Link from 'next/link';

interface ScheduledPost {
  id: number;
  content: string;
  platform_type: string;
  scheduled_at: string;
  status: string;
  created_at: string;
}

export default function ScheduledPostsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchScheduledPosts = async () => {
    try {
      setLoading(true);
      const status = filter === 'all' ? undefined : filter;
      // Don't include status parameter if it's undefined or empty
      const url = status && status.trim() !== '' 
        ? `/content/scheduled?status=${status}` 
        : '/content/scheduled';
      // DISABLE CACHE to ensure fresh data
      const response = await api.get<{ data: ScheduledPost[] }>(url, false);
      if (response.success && response.data) {
        setPosts(Array.isArray(response.data) ? response.data : []);
      } else {
        console.error('Failed to fetch scheduled posts:', response.message);
        setPosts([]);
      }
    } catch (error: any) {
      console.error('Error fetching scheduled posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount and when filter/refreshKey changes
  useEffect(() => {
    fetchScheduledPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, refreshKey]);

  // Refresh when navigating to this page (check for refresh flag)
  useEffect(() => {
    const checkRefresh = () => {
      const refreshFlag = sessionStorage.getItem('refresh_content_scheduled');
      if (refreshFlag === 'true') {
        sessionStorage.removeItem('refresh_content_scheduled');
        // Force refresh by updating refreshKey
        setRefreshKey(prev => prev + 1);
        // Also call router.refresh() for Next.js cache invalidation
        router.refresh();
      }
    };

    // Check immediately
    checkRefresh();

    // Also check after a short delay (in case navigation just completed)
    const timer = setTimeout(checkRefresh, 300);
    return () => clearTimeout(timer);
  }, [pathname, router]);

  // Listen for custom refresh events
  useEffect(() => {
    const handleRefresh = () => {
      setRefreshKey(prev => prev + 1);
      router.refresh();
    };
    window.addEventListener('refreshContentScheduled', handleRefresh);
    return () => window.removeEventListener('refreshContentScheduled', handleRefresh);
  }, [router]);

  const handleCancel = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this scheduled post?')) return;

    try {
      const response = await api.delete(`/content/scheduled/${id}`);
      if (response.success) {
        setPosts(posts.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error('Error cancelling post:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-blue-400" />;
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
            <Link href="/content/library" className="inline-flex items-center text-white/80 hover:text-white mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Content Library
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-heading font-bold mb-2">Scheduled Posts</h1>
                <p className="text-white/80">View and manage your scheduled social media posts</p>
              </div>
              <Link
                href="/content/calendar"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <CalendarDays className="w-5 h-5" />
                Calendar View
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
            {['all', 'pending', 'published', 'failed', 'cancelled'].map((status) => (
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

          {/* Scheduled Posts List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            </div>
          ) : posts.length === 0 ? (
            <motion.div
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 border-2 border-white/20 shadow-lg text-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <Calendar className="w-16 h-16 text-white/40 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No scheduled posts</h3>
              <p className="text-white/60 mb-6">Schedule your first post to get started</p>
              <Link
                href="/content/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all shadow-lg"
              >
                <Calendar className="w-5 h-5" />
                Schedule Post
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg hover:border-primary-300 transition-all"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  whileHover={{ y: -2 }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {getStatusIcon(post.status)}
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white capitalize">
                          {post.platform_type}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                          post.status === 'published' ? 'bg-green-500/20 text-green-300' :
                          post.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                          post.status === 'failed' ? 'bg-red-500/20 text-red-300' :
                          'bg-gray-500/20 text-gray-300'
                        }`}>
                          {post.status}
                        </span>
                      </div>
                      <p className="text-white/90 mb-3 line-clamp-2">{post.content}</p>
                      <div className="flex items-center gap-4 text-sm text-white/60">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(post.scheduled_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {post.status === 'pending' && (
                      <button
                        onClick={() => handleCancel(post.id)}
                        className="ml-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
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

