'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { Plus, Target, TrendingUp, Calendar, DollarSign, ArrowRight, Play, Pause, CheckCircle, Bell, List, Grid, Clock } from 'lucide-react';
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
  reminder_days_before?: number;
  created_at: string;
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

export default function CampaignsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchNotifications = async () => {
    try {
      // DISABLE CACHE to ensure fresh data
      const response = await api.get<{ data: Notification[] }>('/notifications?type=campaign_reminder&unreadOnly=true', false);
      if (response.success && response.data) {
        setNotifications(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      // Always fetch all campaigns, then filter client-side for reliability
      // DISABLE CACHE to ensure fresh data
      const response = await api.get<{ data: Campaign[] }>('/campaigns', false);
      if (response.success && response.data) {
        const fetchedCampaigns: Campaign[] = Array.isArray(response.data) ? response.data : [];
        
        // Store all campaigns
        setAllCampaigns(fetchedCampaigns);
        
        // Apply client-side filter based on selected status
        const filteredCampaigns = filter !== 'all' 
          ? fetchedCampaigns.filter(campaign => campaign.status === filter)
          : fetchedCampaigns;
        
        setCampaigns(filteredCampaigns);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  // Memoized refresh function that uses the fetch functions
  // Fetch data on mount and when filter/refreshKey changes
  useEffect(() => {
    fetchCampaigns();
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, refreshKey]);

  // Update filtered campaigns when filter or allCampaigns changes
  useEffect(() => {
    const filteredCampaigns = filter !== 'all' 
      ? allCampaigns.filter(campaign => campaign.status === filter)
      : allCampaigns;
    setCampaigns(filteredCampaigns);
  }, [filter, allCampaigns]);

  // Refresh when navigating to this page (check for refresh flag)
  useEffect(() => {
    const checkRefresh = () => {
      const refreshFlag = sessionStorage.getItem('refresh_campaigns');
      if (refreshFlag === 'true') {
        sessionStorage.removeItem('refresh_campaigns');
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
    window.addEventListener('refreshCampaigns', handleRefresh);
    return () => window.removeEventListener('refreshCampaigns', handleRefresh);
  }, [router]);

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

  const handleStatusChange = async (id: number, newStatus: 'active' | 'paused' | 'completed', e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : newStatus === 'paused' ? 'pause' : 'complete'} this campaign?`)) {
      return;
    }
    
    // Store original state for rollback
    const originalCampaigns = [...allCampaigns];
    
    try {
      // OPTIMISTIC UPDATE: Update BOTH allCampaigns and campaigns immediately
      const updatedAllCampaigns = allCampaigns.map(campaign => 
        campaign.id === id ? { ...campaign, status: newStatus } : campaign
      );
      setAllCampaigns(updatedAllCampaigns);
      
      // Also update the filtered campaigns array immediately
      const updatedFilteredCampaigns = filter !== 'all'
        ? updatedAllCampaigns.filter(campaign => campaign.status === filter)
        : updatedAllCampaigns;
      setCampaigns(updatedFilteredCampaigns);

      // Now make the API call
      const response = await api.put(`/campaigns/${id}`, { status: newStatus });
      if (response.success) {
        // Clear cache for campaigns endpoint to force fresh data
        const { apiCache } = require('@/lib/cache');
        apiCache.delete(apiCache.generateKey('/campaigns'));
        // Refetch to ensure consistency with server (but UI already updated)
        fetchCampaigns().catch(err => console.error('Error refetching:', err));
        fetchNotifications().catch(err => console.error('Error refetching notifications:', err));
      } else {
        // If API call failed, revert the optimistic update
        setAllCampaigns(originalCampaigns);
        const revertedFiltered = filter !== 'all'
          ? originalCampaigns.filter(campaign => campaign.status === filter)
          : originalCampaigns;
        setCampaigns(revertedFiltered);
        alert('Failed to update campaign status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      // Revert optimistic update on error
      setAllCampaigns(originalCampaigns);
      const revertedFiltered = filter !== 'all'
        ? originalCampaigns.filter(campaign => campaign.status === filter)
        : originalCampaigns;
      setCampaigns(revertedFiltered);
      alert('Failed to update campaign status');
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
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getCampaignsForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return campaigns.filter(c => {
      // First check if campaign matches the current filter
      if (filter !== 'all' && c.status !== filter) {
        return false;
      }
      // Then check if campaign matches the date
      const startDate = new Date(c.start_date).toISOString().split('T')[0];
      const endDate = c.end_date ? new Date(c.end_date).toISOString().split('T')[0] : null;
      return startDate === dateStr || (endDate && endDate === dateStr) || 
             (startDate <= dateStr && endDate && endDate >= dateStr);
    });
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
                  href="/campaigns/create"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all shadow-lg shadow-primary-500/30 hover:shadow-xl"
                >
                  <Plus className="w-5 h-5" />
                  Create Campaign
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
                  <h3 className="text-yellow-300 font-semibold mb-2">Upcoming Campaign Reminders</h3>
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

          {/* Calendar View */}
          {viewMode === 'calendar' && !loading && (
            <motion.div
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg mb-6"
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
              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-white/60 font-semibold text-sm py-2">
                    {day}
                  </div>
                ))}
                {getDaysInMonth(selectedDate).map((date, index) => {
                  const dayCampaigns = date ? getCampaignsForDate(date) : [];
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
                          {dayCampaigns.map((campaign) => (
                            <div
                              key={campaign.id}
                              className="text-xs bg-blue-500/30 text-white rounded px-1 py-0.5 mb-1 truncate"
                              title={campaign.name}
                            >
                              {campaign.name}
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
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-primary-300" onClick={() => router.push(`/campaigns/${campaign.id}`)}>
                      <span className="text-sm font-medium">View Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-white/10">
                      {campaign.status === 'draft' && (
                        <button
                          onClick={(e) => handleStatusChange(campaign.id, 'active', e)}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-colors text-sm"
                        >
                          <Play className="w-4 h-4" />
                          Activate
                        </button>
                      )}
                      {campaign.status === 'active' && (
                        <>
                          <button
                            onClick={(e) => handleStatusChange(campaign.id, 'paused', e)}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded-lg transition-colors text-sm"
                          >
                            <Pause className="w-4 h-4" />
                            Pause
                          </button>
                          <button
                            onClick={(e) => handleStatusChange(campaign.id, 'completed', e)}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors text-sm"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Complete
                          </button>
                        </>
                      )}
                      {campaign.status === 'paused' && (
                        <>
                          <button
                            onClick={(e) => handleStatusChange(campaign.id, 'active', e)}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-colors text-sm"
                          >
                            <Play className="w-4 h-4" />
                            Resume
                          </button>
                          <button
                            onClick={(e) => handleStatusChange(campaign.id, 'completed', e)}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors text-sm"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Complete
                          </button>
                        </>
                      )}
                      {(campaign.status === 'completed' || campaign.status === 'cancelled') && (
                        <div className="text-center text-white/60 text-sm py-2">
                          Campaign {campaign.status}
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

