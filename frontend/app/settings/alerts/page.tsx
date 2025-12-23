'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { usePageRefresh } from '@/hooks/usePageRefresh';
import { motion } from 'framer-motion';
import { Bell, Plus, Edit, Trash2, ToggleLeft, ToggleRight, BellRing } from 'lucide-react';
import Link from 'next/link';

interface Alert {
  id: number;
  name: string;
  description?: string;
  alert_type: string;
  condition_type: string;
  threshold_value: number;
  metric_type: string;
  is_active: boolean;
  notification_channels: string[];
  last_triggered_at?: string;
  trigger_count: number;
}

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  icon?: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export default function AlertsPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'alerts' | 'notifications'>('alerts');

  const refreshData = async () => {
    await Promise.all([fetchAlerts(), fetchNotifications(), fetchUnreadCount()]);
  };

  // Use the refresh hook to refetch data when page becomes visible or when navigating back
  usePageRefresh(refreshData, []);

  const fetchAlerts = async () => {
    try {
      // DISABLE CACHE for fresh data
      const response = await api.get<{ data: Alert[] }>('/alerts', false);
      if (response.success && response.data) {
        setAlerts(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      // DISABLE CACHE for fresh data
      const response = await api.get<{ data: Notification[] }>('/alerts/notifications?limit=50', false);
      if (response.success && response.data) {
        setNotifications(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      // DISABLE CACHE for fresh data
      const response = await api.get<{ data: { count: number } }>('/alerts/notifications/unread-count', false);
      if (response.success && response.data) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const toggleAlert = async (id: number, isActive: boolean) => {
    try {
      const response = await api.put(`/alerts/${id}`, { is_active: !isActive });
      if (response.success) {
        setAlerts(alerts.map(alert => alert.id === id ? { ...alert, is_active: !isActive } : alert));
      }
    } catch (error) {
      console.error('Error toggling alert:', error);
    }
  };

  const deleteAlert = async (id: number) => {
    if (!confirm('Are you sure you want to delete this alert?')) return;

    try {
      const response = await api.delete(`/alerts/${id}`);
      if (response.success) {
        setAlerts(alerts.filter(alert => alert.id !== id));
      }
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      const response = await api.post(`/alerts/notifications/${id}/read`);
      if (response.success) {
        setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await api.post('/alerts/notifications/read-all');
      if (response.success) {
        setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-secondary-900/85 via-purple-900/80 to-primary-900/85">
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1920&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)',
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
            <Link href="/settings" className="inline-flex items-center text-white/80 hover:text-white mb-4 transition-colors">
              ← Back to Settings
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-heading font-bold mb-2">Alerts & Notifications</h1>
                <p className="text-white/80">Manage your alerts and view notifications</p>
              </div>
              {activeTab === 'alerts' && (
                <Link
                  href="/settings/alerts/create"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all shadow-lg shadow-primary-500/30 hover:shadow-xl"
                >
                  <Plus className="w-5 h-5" />
                  Create Alert
                </Link>
              )}
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div
            className="mb-6 flex gap-2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeTab === 'alerts'
                  ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              <Bell className="w-5 h-5" />
              Alerts
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 relative ${
                activeTab === 'notifications'
                  ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              <BellRing className="w-5 h-5" />
              Notifications
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </motion.div>

          {/* Content */}
          {activeTab === 'alerts' ? (
            loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
              </div>
            ) : alerts.length === 0 ? (
              <motion.div
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 border-2 border-white/20 shadow-lg text-center"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                <Bell className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No alerts yet</h3>
                <p className="text-white/60 mb-6">Create alerts to get notified about important metrics</p>
                <Link
                  href="/settings/alerts/create"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  Create Alert
                </Link>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {alerts.map((alert, index) => (
                  <motion.div
                    key={alert.id}
                    className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-white">{alert.name}</h3>
                          <button
                            onClick={() => toggleAlert(alert.id, alert.is_active)}
                            className="text-white/60 hover:text-white transition-colors"
                          >
                            {alert.is_active ? (
                              <ToggleRight className="w-6 h-6 text-green-400" />
                            ) : (
                              <ToggleLeft className="w-6 h-6" />
                            )}
                          </button>
                        </div>
                        {alert.description && (
                          <p className="text-white/70 text-sm mb-3">{alert.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 text-sm text-white/60">
                          <span className="px-2 py-1 rounded bg-white/10 capitalize">{alert.alert_type}</span>
                          <span className="px-2 py-1 rounded bg-white/10">{alert.metric_type}</span>
                          <span className="px-2 py-1 rounded bg-white/10">
                            {alert.condition_type.replace('_', ' ')} {alert.threshold_value}
                          </span>
                          {alert.trigger_count > 0 && (
                            <span className="px-2 py-1 rounded bg-green-500/20 text-green-300">
                              Triggered {alert.trigger_count} times
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        className="ml-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-4">
              {notifications.length > 0 && (
                <div className="flex justify-end mb-4">
                  <button
                    onClick={markAllAsRead}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
                  >
                    Mark all as read
                  </button>
                </div>
              )}
              {notifications.length === 0 ? (
                <motion.div
                  className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 border-2 border-white/20 shadow-lg text-center"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                >
                  <BellRing className="w-16 h-16 text-white/40 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">No notifications</h3>
                  <p className="text-white/60">You're all caught up!</p>
                </motion.div>
              ) : (
                notifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    className={`bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 ${
                      notification.is_read ? 'border-white/10' : 'border-primary-300/50'
                    } shadow-lg cursor-pointer hover:border-primary-300 transition-all`}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center flex-shrink-0`}>
                        <BellRing className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-1">{notification.title}</h3>
                        <p className="text-white/70 text-sm mb-2">{notification.message}</p>
                        <div className="text-xs text-white/60">
                          {new Date(notification.created_at).toLocaleString()}
                        </div>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 rounded-full bg-primary-400 flex-shrink-0 mt-2"></div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

