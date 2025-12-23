'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Edit, Trash2, Calendar, FileText, Archive, Search, X, Bell, CheckCircle, Grid, List, Clock } from 'lucide-react';
import Link from 'next/link';

interface Draft {
  id: number;
  title?: string;
  content: string;
  status: string;
  scheduled_at?: string;
  published_at?: string;
  reminder_days_before?: number;
  created_at: string;
  updated_at: string;
}

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  entity_type?: string;
  entity_id?: number;
  is_read: boolean;
  reminder_date?: string;
  created_at: string;
}

export default function ContentLibraryPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [allDrafts, setAllDrafts] = useState<Draft[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchNotifications = async () => {
    try {
      // DISABLE CACHE to ensure fresh data
      const response = await api.get<{ data: Notification[] }>('/notifications?type=content_reminder&unreadOnly=true', false);
      if (response.success && response.data) {
        setNotifications(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      // Always fetch ALL drafts, then filter client-side for reliability
      // DISABLE CACHE to ensure fresh data
      const response = await api.get<{ data: Draft[] }>('/content/drafts', false);
      if (response.success && response.data) {
        const fetchedDrafts = Array.isArray(response.data) ? response.data : [];
        setAllDrafts(fetchedDrafts);
        // Filter will be applied by useEffect below
      } else {
        console.error('Failed to fetch drafts:', response.message);
        setError(response.message || 'Failed to fetch drafts');
        setAllDrafts([]);
        setDrafts([]);
      }
    } catch (error: any) {
      console.error('Error fetching drafts:', error);
      setError(error.message || 'Failed to fetch drafts. Please try again.');
      setAllDrafts([]);
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount and when filter/refreshKey changes
  useEffect(() => {
    fetchDrafts();
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, refreshKey]);

  // Refresh when navigating to this page (check for refresh flag)
  useEffect(() => {
    const checkRefresh = () => {
      const refreshFlag = sessionStorage.getItem('refresh_content_library');
      if (refreshFlag === 'true') {
        sessionStorage.removeItem('refresh_content_library');
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
    window.addEventListener('refreshContentLibrary', handleRefresh);
    return () => window.removeEventListener('refreshContentLibrary', handleRefresh);
  }, [router]);

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

  const handleStatusChange = async (id: number, newStatus: 'draft' | 'scheduled' | 'published' | 'archived') => {
    // Store original state for rollback
    const originalAllDrafts = [...allDrafts];
    
    try {
      // OPTIMISTIC UPDATE: Update BOTH allDrafts and drafts immediately
      const updatedAllDrafts = allDrafts.map(draft => 
        draft.id === id ? { ...draft, status: newStatus } : draft
      );
      setAllDrafts(updatedAllDrafts);
      
      // Also update the filtered drafts array immediately
      const updatedFilteredDrafts = filter !== 'all'
        ? updatedAllDrafts.filter(draft => draft.status === filter)
        : updatedAllDrafts;
      setDrafts(updatedFilteredDrafts);

      // Now make the API call
      const response = await api.put(`/content/drafts/${id}`, { status: newStatus });
      if (response.success) {
        // Clear cache for drafts endpoint to force fresh data
        const { apiCache } = require('@/lib/cache');
        apiCache.delete(apiCache.generateKey('/content/drafts'));
        // Refetch to ensure consistency with server (but UI already updated)
        fetchDrafts().catch(err => console.error('Error refetching:', err));
        fetchNotifications().catch(err => console.error('Error refetching notifications:', err));
      } else {
        // If API call failed, revert the optimistic update
        setAllDrafts(originalAllDrafts);
        const revertedFiltered = filter !== 'all'
          ? originalAllDrafts.filter(draft => draft.status === filter)
          : originalAllDrafts;
        setDrafts(revertedFiltered);
        alert('Failed to update content status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      // Revert optimistic update on error
      setAllDrafts(originalAllDrafts);
      const revertedFiltered = filter !== 'all'
        ? originalAllDrafts.filter(draft => draft.status === filter)
        : originalAllDrafts;
      setDrafts(revertedFiltered);
      alert('Failed to update content status');
    }
  };

  const markNotificationAsRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Calendar view helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getDraftsForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    // Show content based on scheduled_at or created_at, respecting current filter
    let filteredDrafts = allDrafts;
    
    // Apply status filter if not 'all'
    if (filter !== 'all') {
      filteredDrafts = allDrafts.filter(d => d.status === filter);
    }
    
    return filteredDrafts.filter(d => {
      // Show scheduled content on its scheduled date
      if (d.scheduled_at) {
        const scheduledDate = new Date(d.scheduled_at).toISOString().split('T')[0];
        if (scheduledDate === dateStr) return true;
      }
      // Show published content on its published date
      if (d.published_at) {
        const publishedDate = new Date(d.published_at).toISOString().split('T')[0];
        if (publishedDate === dateStr) return true;
      }
      // Show draft content on its creation date (if no scheduled date and filter is 'all' or 'draft')
      if (!d.scheduled_at && d.created_at && (filter === 'all' || filter === 'draft')) {
        const createdDate = new Date(d.created_at).toISOString().split('T')[0];
        if (createdDate === dateStr) return true;
      }
      return false;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-blue-500/30 text-blue-200 border-blue-400/50';
      case 'scheduled':
        return 'bg-purple-500/30 text-purple-200 border-purple-400/50';
      case 'published':
        return 'bg-green-500/30 text-green-200 border-green-400/50';
      case 'archived':
        return 'bg-gray-500/30 text-gray-200 border-gray-400/50';
      default:
        return 'bg-gray-500/30 text-gray-200 border-gray-400/50';
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
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white/10 rounded-lg p-2">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'text-white/60 hover:text-white'}`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('calendar')}
                    className={`p-2 rounded transition-colors ${viewMode === 'calendar' ? 'bg-primary-500 text-white' : 'text-white/60 hover:text-white'}`}
                  >
                    <Calendar className="w-5 h-5" />
                  </button>
                </div>
                <Link
                  href="/content/create"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all shadow-lg shadow-primary-500/30 hover:shadow-xl"
                >
                  <Plus className="w-5 h-5" />
                  Create New
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Notifications */}
          {notifications.length > 0 && (
            <motion.div
              className="mb-6 bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-yellow-300 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-yellow-300 font-semibold mb-2">Upcoming Reminders</h3>
                  <div className="space-y-2">
                    {notifications.map((notif) => (
                      <div key={notif.id} className="flex items-center justify-between bg-white/5 rounded p-2">
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">{notif.title}</p>
                          <p className="text-white/70 text-xs">{notif.message}</p>
                        </div>
                        <button
                          onClick={() => markNotificationAsRead(notif.id)}
                          className="text-yellow-300 hover:text-yellow-200 text-xs px-2 py-1 rounded hover:bg-white/10 transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

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

          {/* Calendar View */}
          {viewMode === 'calendar' && !loading && (
            <motion.div
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setMonth(newDate.getMonth() - 1);
                      setSelectedDate(newDate);
                    }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setSelectedDate(new Date())}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setMonth(newDate.getMonth() + 1);
                      setSelectedDate(newDate);
                    }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
              {/* Calendar Legend */}
              <div className="mb-4 flex flex-wrap gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded border bg-blue-500/30 border-blue-400/50"></div>
                  <span className="text-white/70">Draft</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded border bg-purple-500/30 border-purple-400/50"></div>
                  <span className="text-white/70">Scheduled</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded border bg-green-500/30 border-green-400/50"></div>
                  <span className="text-white/70">Published</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded border bg-gray-500/30 border-gray-400/50"></div>
                  <span className="text-white/70">Archived</span>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-white/60 font-semibold text-sm py-2">
                    {day}
                  </div>
                ))}
                {getDaysInMonth(selectedDate).map((date, index) => {
                  const dayDrafts = date ? getDraftsForDate(date) : [];
                  const isToday = date && date.toDateString() === new Date().toDateString();
                  return (
                    <div
                      key={index}
                      className={`min-h-[80px] p-2 rounded-lg border-2 ${
                        date
                          ? isToday
                            ? 'border-primary-400 bg-primary-500/20'
                            : 'border-white/10 bg-white/5'
                          : 'border-transparent'
                      }`}
                    >
                      {date && (
                        <>
                          <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-primary-300' : 'text-white'}`}>
                            {date.getDate()}
                          </div>
                          {dayDrafts.map((draft) => (
                            <div
                              key={draft.id}
                              className={`text-xs rounded px-1 py-0.5 mb-1 truncate border ${getStatusColor(draft.status)}`}
                              title={`${draft.title || 'Untitled'} (${draft.status})`}
                            >
                              {draft.title || 'Untitled'}
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  );
                })}
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
              <h3 className="text-xl font-bold text-white mb-2">
                {filter === 'all' ? 'No content yet' :
                 filter === 'draft' ? 'No drafts yet' :
                 filter === 'scheduled' ? 'No scheduled content' :
                 filter === 'published' ? 'No published content' :
                 filter === 'archived' ? 'No archived content' :
                 'No content found'}
              </h3>
              <p className="text-white/60 mb-6">
                {filter === 'all' ? 'Create your first content draft to get started' :
                 filter === 'draft' ? 'Create a new draft to get started' :
                 filter === 'scheduled' ? 'Schedule content to see it here' :
                 filter === 'published' ? 'Publish content to see it here' :
                 filter === 'archived' ? 'Archived content will appear here' :
                 'No content matches your filter'}
              </p>
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
                  {draft.scheduled_at && (
                    <div className="flex items-center gap-2 text-xs text-white/60 mb-2">
                      <Clock className="w-3 h-3" />
                      <span>Scheduled: {new Date(draft.scheduled_at).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-white/60 mb-4">
                    <span>Updated {new Date(draft.updated_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex flex-col gap-2">
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
                    <div className="flex gap-2 pt-2 border-t border-white/10">
                      {draft.status === 'draft' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(draft.id, 'published')}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-colors text-sm"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Mark Published
                          </button>
                          <button
                            onClick={() => handleStatusChange(draft.id, 'archived')}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 rounded-lg transition-colors text-sm"
                          >
                            <Archive className="w-4 h-4" />
                            Archive
                          </button>
                        </>
                      )}
                      {draft.status === 'scheduled' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(draft.id, 'published')}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-colors text-sm"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Mark Published
                          </button>
                          <button
                            onClick={() => handleStatusChange(draft.id, 'archived')}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 rounded-lg transition-colors text-sm"
                          >
                            <Archive className="w-4 h-4" />
                            Archive
                          </button>
                        </>
                      )}
                      {draft.status === 'published' && (
                        <button
                          onClick={() => handleStatusChange(draft.id, 'archived')}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 rounded-lg transition-colors text-sm"
                        >
                          <Archive className="w-4 h-4" />
                          Archive
                        </button>
                      )}
                      {draft.status === 'archived' && (
                        <div className="text-center text-white/60 text-sm py-2 w-full">
                          Content archived
                        </div>
                      )}
                    </div>
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

