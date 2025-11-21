'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Linkedin, 
  Youtube, 
  Music,
  Link2,
  CheckCircle,
  X,
  ArrowLeft,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

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

  const platformIcons: Record<string, React.ComponentType<any>> = {
    facebook: Facebook,
    instagram: Instagram,
    twitter: Twitter,
    linkedin: Linkedin,
    youtube: Youtube,
    tiktok: Music,
  };

  useEffect(() => {
    fetchPlatforms();
    fetchConnectedAccounts();
  }, []);

  const fetchPlatforms = async () => {
    try {
      const response = await api.get<{ data: Platform[] }>('/social/platforms');
      console.log('Platforms response:', response);
      if (response.success && response.data) {
        setPlatforms(Array.isArray(response.data) ? response.data : []);
      } else {
        setPlatforms([]);
      }
    } catch (error) {
      console.error('Error fetching platforms:', error);
      setPlatforms([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchConnectedAccounts = async () => {
    try {
      const response = await api.get<{ data: ConnectedAccount[] }>('/social/accounts');
      console.log('Connected accounts response:', response);
      if (response.success && response.data) {
        setConnectedAccounts(Array.isArray(response.data) ? response.data : []);
      } else {
        setConnectedAccounts([]);
      }
    } catch (error) {
      console.error('Error fetching connected accounts:', error);
      setConnectedAccounts([]);
    }
  };

  const handleConnect = async (platformName: string) => {
    try {
      setConnecting(platformName);
      setError('');
      
      const response = await api.post<{ success: boolean; data?: { authUrl?: string } }>(`/social/connect/${platformName}`);
      if (response.data?.success && response.data?.data?.authUrl) {
        // Redirect to OAuth authorization page
        window.location.href = response.data.data.authUrl;
      } else {
        setError('Failed to initiate connection');
        setConnecting(null);
      }
    } catch (error: any) {
      console.error('Error connecting platform:', error);
      setError(error.response?.data?.message || 'Failed to connect platform');
      setConnecting(null);
    }
  };

  const handleDisconnect = async (accountId: number) => {
    if (!confirm('Are you sure you want to disconnect this account?')) {
      return;
    }

    try {
      await api.delete(`/social/disconnect/${accountId}`);
      fetchConnectedAccounts();
    } catch (error) {
      console.error('Error disconnecting account:', error);
      setError('Failed to disconnect account');
    }
  };

  const handleSync = async (accountId: number) => {
    try {
      setSyncing(accountId);
      setError('');
      setSuccess('');
      
      const response = await api.post<{ success: boolean; data?: { posts_collected?: number } }>(`/data/collect/${accountId}`);
      
      if (response.data?.success) {
        setSuccess(`Successfully collected ${response.data.data?.posts_collected || 0} posts!`);
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (error: any) {
      console.error('Error syncing account:', error);
      setError(error.response?.data?.message || 'Failed to sync account data');
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
              Connect your social media accounts to start tracking analytics
            </p>
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
                                @{account.platform_username}
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
                              @{account.platform_username}
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
                        <button
                          onClick={() => handleConnect(platform.name)}
                          disabled={connecting === platform.name}
                          className="mt-4 w-full bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary-500/30 hover:shadow-xl"
                        >
                          {connecting === platform.name ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              <Link2 className="w-5 h-5" />
                              Connect
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

