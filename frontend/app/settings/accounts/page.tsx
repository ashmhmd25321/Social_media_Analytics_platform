'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { 
  Facebook, 
  Instagram, 
  Youtube, 
  Link2,
  CheckCircle,
  X,
  ArrowLeft,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePageRefresh } from '@/hooks/usePageRefresh';

interface Platform {
  id: number;
  name: string;
  display_name: string;
  icon_url?: string;
}

interface ConnectedAccount {
  id: number;
  platform_id: number;
  platform_name: string;
  platform_display_name: string;
  platform_username?: string;
  account_status: string;
  profile_picture_url?: string;
}

export default function AccountsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showFacebookTokenModal, setShowFacebookTokenModal] = useState(false);
  const [facebookToken, setFacebookToken] = useState('');
  const [showInstagramTokenModal, setShowInstagramTokenModal] = useState(false);
  const [instagramToken, setInstagramToken] = useState('');
  const [instagramAccountId, setInstagramAccountId] = useState('');

  const platformIcons: Record<string, React.ComponentType<any>> = {
    facebook: Facebook,
    instagram: Instagram,
    youtube: Youtube,
  };

  // Check for OAuth callback success and clear cache
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isSuccess = urlParams.get('success') === 'true' || urlParams.get('connected') === 'true';
    const hasError = urlParams.get('error');
    
    if (isSuccess && !hasError) {
      // Clear all relevant caches after successful OAuth connection
      const { apiCache } = require('@/lib/cache');
      apiCache.delete(apiCache.generateKey('/social/accounts'));
      apiCache.delete(apiCache.generateKey('/analytics/overview'));
      apiCache.delete(apiCache.generateKey('/analytics/platforms/comparison'));
      apiCache.delete(apiCache.generateKey('/analytics/followers/trends'));
      apiCache.delete(apiCache.generateKey('/analytics/engagement/trends'));
      apiCache.delete(apiCache.generateKey('/analytics/posts/top'));
      
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      
      // Refresh connected accounts to show the new connection
      fetchConnectedAccounts(true).then(() => {
        // After accounts are refreshed, trigger page refresh events
        // Give a small delay to allow backend data sync to start
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('pageRefresh', { detail: '/dashboard' }));
            window.dispatchEvent(new CustomEvent('pageRefresh', { detail: '/analytics' }));
            window.dispatchEvent(new CustomEvent('pageRefresh'));
            // Also refresh router to update any Next.js cached data
            router.refresh();
          }
        }, 1500); // 1.5 second delay to allow backend data sync to start
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshData = async () => {
    await Promise.all([fetchPlatforms(), fetchConnectedAccounts()]);
  };

  // Use the refresh hook to refetch data when page becomes visible or when navigating back
  usePageRefresh(refreshData, []);

  const fetchPlatforms = async () => {
    try {
      // Use cache with short TTL (60 seconds) - platforms don't change often
      const response = await api.get<{ data: Platform[] }>('/social/platforms', true, 60 * 1000);
      console.log('Platforms response:', response);
      if (response.success && response.data) {
        setPlatforms(Array.isArray(response.data) ? response.data : []);
        setError(''); // Clear any previous errors
      } else {
        setPlatforms([]);
      }
    } catch (error: any) {
      console.error('Error fetching platforms:', error);
      setPlatforms([]);
      // Show helpful error message if backend is not reachable
      if (error.message && error.message.includes('Unable to connect')) {
        setError('Backend server is not running. Please start the backend server on port 5001.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchConnectedAccounts = async (bypassCache: boolean = false) => {
    try {
      // Use cache with short TTL (30 seconds) - clear on connect/disconnect
      // But bypass cache if explicitly requested (e.g., after disconnect)
      const response = await api.get<{ data: ConnectedAccount[] }>('/social/accounts', !bypassCache, 30 * 1000);
      console.log('Connected accounts response:', response);
      if (response.success && response.data) {
        setConnectedAccounts(Array.isArray(response.data) ? response.data : []);
        setError(''); // Clear any previous errors
      } else {
        setConnectedAccounts([]);
      }
    } catch (error: any) {
      console.error('Error fetching connected accounts:', error);
      setConnectedAccounts([]);
      // Show helpful error message if backend is not reachable
      if (error.message && error.message.includes('Unable to connect')) {
        setError('Backend server is not running. Please start the backend server on port 5001.');
      } else if (error.message && error.message.includes('Session expired')) {
        // Don't show error for session expiration, it's handled by redirect
        setError('');
      }
    }
  };

  const handleConnect = async (platformName: string) => {
    // For Facebook, show token input modal instead of OAuth
    if (platformName.toLowerCase() === 'facebook') {
      setShowFacebookTokenModal(true);
      return;
    }
    
    // For Instagram, show token input modal instead of OAuth
    if (platformName.toLowerCase() === 'instagram') {
      setShowInstagramTokenModal(true);
      return;
    }

    try {
      setConnecting(platformName);
      setError('');
      
      console.log(`[DEBUG] Initiating OAuth connection for platform: ${platformName}`);
      
      const response = await api.post<{ authUrl?: string; stateToken?: string }>(`/social/connect/${platformName}`);
      
      console.log(`[DEBUG] OAuth initiation response:`, response);
      
      // The API client returns { success, data, message }
      // So response.data contains the actual data from backend
      if (response.success && response.data?.authUrl) {
        console.log(`[DEBUG] Redirecting to OAuth URL: ${response.data.authUrl}`);
        // Redirect to OAuth authorization page
        window.location.href = response.data.authUrl;
      } else {
        const errorMsg = response.message || 'Failed to initiate connection';
        console.error(`[DEBUG] OAuth initiation failed:`, {
          success: response.success,
          message: response.message,
          data: response.data,
        });
        setError(errorMsg);
        setConnecting(null);
      }
    } catch (error: any) {
      console.error('[DEBUG] Error connecting platform:', error);
      console.error('[DEBUG] Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response,
      });
      
      // Handle different error types
      let errorMessage = 'Failed to initiate connection';
      
      if (error.message) {
        if (error.message.includes('Unable to connect')) {
          errorMessage = 'Backend server is not running. Please start the backend server on port 5001.';
        } else if (error.message.includes('Session expired')) {
          errorMessage = 'Your session has expired. Please login again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      setConnecting(null);
    }
  };

  const handleFacebookTokenSubmit = async () => {
    if (!facebookToken.trim()) {
      setError('Please enter a Facebook access token');
      return;
    }

    try {
      setConnecting('facebook');
      setError('');
      setSuccess('');

      const response = await api.post<{ account_id?: number; platform_account_id?: string; platform_display_name?: string }>(
        '/social/connect/facebook/token',
        { accessToken: facebookToken.trim() }
      );

      if (response.success) {
        setSuccess('Facebook account connected successfully!');
        setShowFacebookTokenModal(false);
        setFacebookToken('');
        
        // Clear cache
        const { apiCache } = require('@/lib/cache');
        apiCache.delete(apiCache.generateKey('/social/accounts'));
        apiCache.delete(apiCache.generateKey('/analytics/overview'));
        apiCache.delete(apiCache.generateKey('/analytics/platforms/comparison'));
        apiCache.delete(apiCache.generateKey('/analytics/followers/trends'));
        apiCache.delete(apiCache.generateKey('/analytics/engagement/trends'));
        apiCache.delete(apiCache.generateKey('/analytics/posts/top'));

        // Refresh connected accounts
        await fetchConnectedAccounts(true);
        
        // Trigger page refresh events
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('pageRefresh', { detail: '/dashboard' }));
            window.dispatchEvent(new CustomEvent('pageRefresh', { detail: '/analytics' }));
            window.dispatchEvent(new CustomEvent('pageRefresh'));
            router.refresh();
          }
        }, 1500);
      } else {
        setError(response.message || 'Failed to connect Facebook account');
      }
    } catch (error: any) {
      console.error('Error connecting Facebook with token:', error);
      let errorMessage = 'Failed to connect Facebook account';
      
      if (error.message) {
        if (error.message.includes('Unable to connect')) {
          errorMessage = 'Backend server is not running. Please start the backend server on port 5001.';
        } else if (error.message.includes('Session expired')) {
          errorMessage = 'Your session has expired. Please login again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setConnecting(null);
    }
  };

  const handleInstagramTokenSubmit = async () => {
    if (!instagramToken.trim()) {
      setError('Please enter a Facebook access token (same token used for Facebook)');
      return;
    }

    try {
      setConnecting('instagram');
      setError('');
      setSuccess('');

      const response = await api.post<{ account_id?: number; platform_account_id?: string; platform_display_name?: string }>(
        '/social/connect/instagram/token',
        { 
          accessToken: instagramToken.trim(),
          instagramAccountId: instagramAccountId.trim() || undefined,
        }
      );

      if (response.success) {
        setSuccess('Instagram account connected successfully!');
        setShowInstagramTokenModal(false);
        setInstagramToken('');
        setInstagramAccountId('');
        
        // Clear cache
        const { apiCache } = require('@/lib/cache');
        apiCache.delete(apiCache.generateKey('/social/accounts'));
        apiCache.delete(apiCache.generateKey('/analytics/overview'));
        apiCache.delete(apiCache.generateKey('/analytics/platforms/comparison'));
        apiCache.delete(apiCache.generateKey('/analytics/followers/trends'));
        apiCache.delete(apiCache.generateKey('/analytics/engagement/trends'));
        apiCache.delete(apiCache.generateKey('/analytics/posts/top'));

        // Refresh connected accounts
        await fetchConnectedAccounts(true);
        
        // Trigger page refresh events
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('pageRefresh', { detail: '/dashboard' }));
            window.dispatchEvent(new CustomEvent('pageRefresh', { detail: '/analytics' }));
            window.dispatchEvent(new CustomEvent('pageRefresh'));
            router.refresh();
          }
        }, 1500);
      } else {
        setError(response.message || 'Failed to connect Instagram account');
      }
    } catch (error: any) {
      console.error('Error connecting Instagram with token:', error);
      let errorMessage = 'Failed to connect Instagram account';
      
      if (error.message) {
        if (error.message.includes('Unable to connect')) {
          errorMessage = 'Backend server is not running. Please start the backend server on port 5001.';
        } else if (error.message.includes('Session expired')) {
          errorMessage = 'Your session has expired. Please login again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (accountId: number) => {
    if (!confirm('Are you sure you want to disconnect this account?')) {
      return;
    }

    // Store the account before disconnecting (for potential rollback)
    const accountToDisconnect = connectedAccounts.find(acc => acc.id === accountId);
    
    try {
      setError('');
      setSuccess('');
      
      // Clear ALL relevant caches BEFORE disconnecting to ensure fresh data
      const { apiCache } = require('@/lib/cache');
      apiCache.delete(apiCache.generateKey('/social/accounts'));
      apiCache.delete(apiCache.generateKey('/analytics/overview'));
      apiCache.delete(apiCache.generateKey('/analytics/platforms/comparison'));
      apiCache.delete(apiCache.generateKey('/analytics/followers/trends'));
      apiCache.delete(apiCache.generateKey('/analytics/engagement/trends'));
      apiCache.delete(apiCache.generateKey('/analytics/posts/top'));
      
      // OPTIMISTIC UPDATE: Remove from state immediately for instant UI feedback
      setConnectedAccounts(prev => prev.filter(acc => acc.id !== accountId));
      
      // Call the disconnect endpoint - backend will clear its cache
      const response = await api.delete<{ success: boolean; message?: string }>(`/social/disconnect/${accountId}`);
      
      if (response.success) {
        // Wait a moment for backend to fully process the disconnect
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Force fresh fetch WITHOUT cache to confirm the disconnect
        // This ensures we're in sync with the backend
        await fetchConnectedAccounts(true);
        
        // Double-check: if account still appears in fresh data, remove it again
        // This handles edge cases where backend hasn't fully processed yet
        setConnectedAccounts(prev => {
          const stillConnected = prev.find(acc => acc.id === accountId);
          if (stillConnected) {
            console.warn('[Disconnect] Account still in list after disconnect, removing again');
            return prev.filter(acc => acc.id !== accountId);
          }
          return prev;
        });
        
        setSuccess('Account disconnected successfully');
        
        // Trigger page refresh events for dashboard and other pages
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('pageRefresh', { detail: '/dashboard' }));
          window.dispatchEvent(new CustomEvent('pageRefresh'));
          // Also trigger refresh for analytics pages
          window.dispatchEvent(new CustomEvent('pageRefresh', { detail: '/analytics' }));
        }
        
        // Refresh router to update any Next.js cached data
        router.refresh();
        
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } else {
        // API call failed - restore the account to state
        if (accountToDisconnect) {
          setConnectedAccounts(prev => {
            // Only add back if not already present
            if (!prev.find(acc => acc.id === accountId)) {
              return [...prev, accountToDisconnect];
            }
            return prev;
          });
        }
        setError(response.message || 'Failed to disconnect account');
        // Re-fetch to restore correct state
        await fetchConnectedAccounts(true);
      }
    } catch (error: any) {
      console.error('Error disconnecting account:', error);
      
      // API call failed - restore the account to state
      if (accountToDisconnect) {
        setConnectedAccounts(prev => {
          // Only add back if not already present
          if (!prev.find(acc => acc.id === accountId)) {
            return [...prev, accountToDisconnect];
          }
          return prev;
        });
      }
      
      setError(error.response?.data?.message || error.message || 'Failed to disconnect account');
      // Re-fetch to restore correct state
      await fetchConnectedAccounts(true);
    }
  };

  const handleSync = async (accountId: number) => {
    try {
      setSyncing(accountId);
      setError('');
      setSuccess('');
      
      const response = await api.post<{ success: boolean; data?: { posts_collected?: number; engagement_metrics_collected?: number; follower_metrics_collected?: number }; message?: string; error?: string }>(`/data/collect/${accountId}`);
      
      // Backend returns: { success: true, message: '...', data: { posts_collected: ..., ... } }
      // So we check response.success (not response.data.success)
      if (response.success) {
        // Clear cache for analytics and dashboard data
        const { apiCache } = require('@/lib/cache');
        apiCache.delete(apiCache.generateKey('/analytics/overview'));
        apiCache.delete(apiCache.generateKey('/analytics/followers/trends'));
        apiCache.delete(apiCache.generateKey('/analytics/engagement/trends'));
        apiCache.delete(apiCache.generateKey('/analytics/platforms/comparison'));
        apiCache.delete(apiCache.generateKey('/analytics/posts/top'));
        
        const postsCollected = response.data?.posts_collected || 0;
        const engagementCollected = response.data?.engagement_metrics_collected || 0;
        const followersCollected = response.data?.follower_metrics_collected || 0;
        
        setSuccess(`Successfully synced! Collected ${postsCollected} posts, ${engagementCollected} engagement metrics, and ${followersCollected} follower metrics. Refreshing dashboard...`);
        
        // Trigger page refresh events instead of full page reload
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('pageRefresh', { detail: '/dashboard' }));
          window.dispatchEvent(new CustomEvent('pageRefresh', { detail: '/analytics' }));
          window.dispatchEvent(new CustomEvent('pageRefresh'));
          router.refresh();
        }
        
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } else {
        setError(response.message || response.error || 'Failed to sync account data');
      }
    } catch (error: any) {
      console.error('Error syncing account:', error);
      // The API client throws errors, so we need to check the error structure
      const errorMessage = error.message || 'Failed to sync account data';
      setError(errorMessage);
      console.error('Full error details:', {
        error: error,
        message: errorMessage,
      });
    } finally {
      setSyncing(null);
    }
  };

  const isConnected = (platformId: number) => {
    return connectedAccounts.some(
      (account) => account.platform_id === platformId && account.account_status === 'connected'
    );
  };

  const getConnectedAccount = (platformId: number) => {
    return connectedAccounts.find(
      (account) => account.platform_id === platformId && account.account_status === 'connected'
    );
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-secondary-900/85 via-purple-900/80 to-primary-900/85 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1920&q=80)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-secondary-900/85 via-purple-900/80 to-primary-900/85"></div>
          </div>
          <div className="relative z-10">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-secondary-900/85 via-purple-900/80 to-primary-900/85">
        {/* Background with image overlay - unique for accounts page */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1920&q=80)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-secondary-900/85 via-purple-900/80 to-primary-900/85"></div>
        </div>

        {/* Animated gradient orbs - matching homepage/dashboard */}
        <motion.div
          className="absolute top-20 right-20 w-72 h-72 bg-secondary-400/20 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-20 left-20 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            className="mb-8"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <Link
              href="/settings"
              className="inline-flex items-center text-white/80 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Settings
            </Link>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-2">
              Connected Accounts
            </h1>
            <p className="text-white/80 text-lg">
              Connect your social media accounts using OAuth
            </p>
            <div className="mt-4 bg-blue-500/20 backdrop-blur-xl border border-blue-400/30 rounded-xl p-4">
              <p className="text-blue-200 text-sm">
                <strong>How it works:</strong> Click "Connect Account" to sign in with your social media account. Each user connects their own account and sees their own analytics data.
              </p>
            </div>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              className="mb-6 bg-red-500/20 backdrop-blur-xl border border-red-400/30 rounded-xl p-4 flex items-center justify-between shadow-lg"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-red-200 text-sm">{error}</p>
              <button
                onClick={() => setError('')}
                className="text-red-300 hover:text-red-100"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* Success Message */}
          {success && (
            <motion.div
              className="mb-6 bg-green-500/20 backdrop-blur-xl border border-green-400/30 rounded-xl p-4 flex items-center justify-between shadow-lg"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-green-200 text-sm">{success}</p>
              <button
                onClick={() => setSuccess('')}
                className="text-green-300 hover:text-green-100"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* Connected Accounts Section */}
          {connectedAccounts.length > 0 && (
            <motion.div
              className="mb-12"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-white mb-6">
                Connected Accounts
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {connectedAccounts.map((account) => {
                  const IconComponent = platformIcons[account.platform_name.toLowerCase()] || Link2;
                  return (
                    <motion.div
                      key={account.id}
                      className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all"
                      whileHover={{ y: -5, scale: 1.02 }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center shadow-lg">
                            <IconComponent className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">
                              {account.platform_display_name}
                            </h3>
                            {account.platform_username && (
                              <p className="text-sm text-white/70">
                                {account.platform_username.startsWith('@') 
                                  ? account.platform_username 
                                  : `@${account.platform_username}`}
                              </p>
                            )}
                          </div>
                        </div>
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleSync(account.id)}
                          disabled={syncing === account.id}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/30"
                        >
                          {syncing === account.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Syncing...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4" />
                              Sync Data
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDisconnect(account.id)}
                          className="text-sm text-red-300 hover:text-red-200 font-medium transition-colors"
                        >
                          Disconnect
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Available Platforms */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-white mb-6">
              Available Platforms
            </h2>
            {platforms.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 text-center">
                <p className="text-white/70 mb-4">No platforms available. Make sure the backend is running and the database has platform entries.</p>
                <button
                  onClick={() => fetchPlatforms()}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {platforms.map((platform, index) => {
                const IconComponent = platformIcons[platform.name.toLowerCase()] || Link2;
                const connected = isConnected(platform.id!);
                const account = getConnectedAccount(platform.id!);

                return (
                  <motion.div
                    key={platform.id}
                    className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border-2 border-white/20 hover:border-primary-400/50 transition-all shadow-lg hover:shadow-xl"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center mb-4 shadow-lg">
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-heading font-bold text-white mb-2">
                        {platform.display_name}
                      </h3>
                      
                      {connected && account ? (
                        <div className="w-full">
                          <div className="flex items-center justify-center gap-2 text-green-400 mb-4">
                            <CheckCircle className="w-5 h-5" />
                            <span className="text-sm font-medium">Connected</span>
                          </div>
                          {account.platform_username && (
                            <p className="text-sm text-white/70 mb-4">
                              {account.platform_username.startsWith('@') 
                                ? account.platform_username 
                                : `@${account.platform_username}`}
                            </p>
                          )}
                          <button
                            onClick={() => handleDisconnect(account.id)}
                            className="w-full text-sm text-red-300 hover:text-red-200 font-medium py-2 transition-colors"
                          >
                            Disconnect
                          </button>
                        </div>
                      ) : (
                        <div className="w-full">
                          <button
                            onClick={() => handleConnect(platform.name)}
                            disabled={connecting === platform.name}
                            className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary-500/30 hover:shadow-xl"
                          >
                            {connecting === platform.name ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Connecting...
                              </>
                            ) : (
                              <>
                                <Link2 className="w-5 h-5" />
                                Connect Account
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
            )}
          </motion.div>

        </div>
      </div>

      {/* Facebook Token Input Modal */}
      {showFacebookTokenModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-secondary-900 to-primary-900 rounded-2xl p-6 border-2 border-white/20 shadow-2xl max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-white">Connect Facebook Account</h3>
              <button
                onClick={() => {
                  setShowFacebookTokenModal(false);
                  setFacebookToken('');
                  setError('');
                }}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-white/70 mb-4 text-sm">
              Enter your Facebook access token to connect your account. You can get this token from Facebook Graph API Explorer or your app settings.
            </p>

            <div className="mb-4">
              <label className="block text-white/90 mb-2 text-sm font-medium">
                Access Token
              </label>
              <textarea
                value={facebookToken}
                onChange={(e) => setFacebookToken(e.target.value)}
                placeholder="EAAZBvrV0DRv4BQeZCUT5ZAufAW6KtEwyCSimM3sFoekQDG3ZBgqWvIgVewnUV7vBveoRDdpDxSidB122cV5d8HSNVaZCIuZB9wEwc3hBAVhrMzH2wqDznVYULpzRJtUeEOZCcCdf2YRH58kkNdxCZBcbYbzKurqDIFyZBReL0860tohtvt9IIOnoZAckOEoA7SJc9pB2cDZBYXpI8tUcoyLXwCT0x2tsjKthcLttgq2swNyAJUpGJFbZAZB8IptVLn92EWiJhgoxKnzrsK4iNhle7orER"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={4}
                disabled={connecting === 'facebook'}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowFacebookTokenModal(false);
                  setFacebookToken('');
                  setError('');
                }}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                disabled={connecting === 'facebook'}
              >
                Cancel
              </button>
              <button
                onClick={handleFacebookTokenSubmit}
                disabled={connecting === 'facebook' || !facebookToken.trim()}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {connecting === 'facebook' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Instagram Token Modal */}
      {showInstagramTokenModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-secondary-900 to-primary-900 rounded-2xl p-6 border-2 border-white/20 shadow-2xl max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-white">Connect Instagram Account</h3>
              <button
                onClick={() => {
                  setShowInstagramTokenModal(false);
                  setInstagramToken('');
                  setInstagramAccountId('');
                  setError('');
                }}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-white/70 mb-4 text-sm">
              Enter your <strong>Facebook access token</strong> (the same token you used for Facebook). 
              Your Instagram Business account must be linked to your Facebook Page.
            </p>

            <div className="mb-4 bg-blue-500/20 border border-blue-400/30 rounded-lg p-3">
              <p className="text-blue-200 text-xs">
                <strong>Note:</strong> Use the same Facebook access token. The system will automatically detect your Instagram Business account linked to your Facebook Page.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-white/90 mb-2 text-sm font-medium">
                Facebook Access Token
              </label>
              <textarea
                value={instagramToken}
                onChange={(e) => setInstagramToken(e.target.value)}
                placeholder="EAAZBvrV0DRv4BQeZCUT5ZAufAW6KtEwyCSimM3sFoekQDG3ZBgqWvIgVewnUV7vBveoRDdpDxSidB122cV5d8HSNVaZCIuZB9wEwc3hBAVhrMzH2wqDznVYULpzRJtUeEOZCcCdf2YRH58kkNdxCZBcbYbzKurqDIFyZBReL0860tohtvt9IIOnoZAckOEoA7SJc9pB2cDZBYXpI8tUcoyLXwCT0x2tsjKthcLttgq2swNyAJUpGJFbZAZB8IptVLn92EWiJhgoxKnzrsK4iNhle7orER"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={4}
                disabled={connecting === 'instagram'}
              />
            </div>

            <div className="mb-4">
              <label className="block text-white/90 mb-2 text-sm font-medium">
                Instagram Account ID <span className="text-white/60 text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                value={instagramAccountId}
                onChange={(e) => setInstagramAccountId(e.target.value)}
                placeholder="e.g., 17841405309211844"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={connecting === 'instagram'}
              />
              <p className="text-white/60 text-xs mt-1">
                Only needed if automatic detection fails. You can find this in Facebook Page Settings → Instagram.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowInstagramTokenModal(false);
                  setInstagramToken('');
                  setInstagramAccountId('');
                  setError('');
                }}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                disabled={connecting === 'instagram'}
              >
                Cancel
              </button>
              <button
                onClick={handleInstagramTokenSubmit}
                disabled={connecting === 'instagram' || !instagramToken.trim()}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {connecting === 'instagram' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </ProtectedRoute>
  );
}

