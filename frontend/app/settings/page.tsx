'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { userApi } from '@/lib/api';
import { Button, Card } from '@/components/ui';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, User, Bell, Globe, Palette, Link2, Save } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    timezone: 'UTC',
  });
  const [preferences, setPreferences] = useState({
    notification_email: true,
    notification_push: true,
    notification_sms: false,
    email_digest_frequency: 'weekly' as 'daily' | 'weekly' | 'monthly' | 'never',
    preferred_language: 'en',
    theme: 'light',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (user) {
          setProfileData({
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            phone: user.phone || '',
            timezone: user.timezone || 'UTC',
          });
        }

        const prefsResponse = await userApi.getPreferences();
        if (prefsResponse.success && prefsResponse.data) {
          // Type assertion for preferences - API returns { preferences: {...} }
          const preferences = (prefsResponse.data as any).preferences;
          if (preferences) {
            setPreferences(preferences);
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePreferenceChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setPreferences({
      ...preferences,
      [name]:
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await userApi.updateProfile(profileData);
      if (response.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        await refreshUser();
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update profile',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await userApi.updatePreferences(preferences);
      if (response.success) {
        setMessage({ type: 'success', text: 'Preferences updated successfully!' });
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to update preferences' });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update preferences',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-secondary-900/85 via-purple-900/80 to-primary-900/85">
          <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1920&q=80)',
            }}
          ></div>
          <div className="relative z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-secondary-900/85 via-purple-900/80 to-primary-900/85">
        {/* Background with image overlay */}
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
        <motion.div
          className="absolute bottom-20 left-20 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
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
            <h1 className="text-4xl font-heading font-bold mb-2">Settings</h1>
            <p className="text-white/80">Manage your account settings and preferences</p>
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

          <div className="space-y-6">
            {/* Connected Accounts Link */}
            <motion.div
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg hover:border-primary-300 transition-all"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Link2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-heading font-bold text-white mb-1">
                      Connected Accounts
                    </h2>
                    <p className="text-white/70">
                      Connect your social media accounts to start tracking analytics
                    </p>
                  </div>
                </div>
                <Link
                  href="/settings/accounts"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all shadow-lg shadow-primary-500/30 hover:shadow-xl"
                >
                  <span className="font-semibold">Manage Accounts</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </motion.div>

            {/* Profile Settings */}
            <motion.div
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border-2 border-white/20 shadow-lg"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-heading font-bold text-white">
                  Profile Settings
                </h2>
              </div>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="first_name" className="block text-sm font-medium text-white/90 mb-2">
                      First Name
                    </label>
                    <input
                      id="first_name"
                      name="first_name"
                      type="text"
                      value={profileData.first_name}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="last_name" className="block text-sm font-medium text-white/90 mb-2">
                      Last Name
                    </label>
                    <input
                      id="last_name"
                      name="last_name"
                      type="text"
                      value={profileData.last_name}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-white/90 mb-2">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium text-white/90 mb-2">
                    Timezone
                  </label>
                  <select
                    id="timezone"
                    name="timezone"
                    value={profileData.timezone}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  >
                    <option value="UTC" className="bg-secondary-900">UTC</option>
                    <option value="America/New_York" className="bg-secondary-900">Eastern Time (ET)</option>
                    <option value="America/Chicago" className="bg-secondary-900">Central Time (CT)</option>
                    <option value="America/Denver" className="bg-secondary-900">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles" className="bg-secondary-900">Pacific Time (PT)</option>
                  </select>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all shadow-lg shadow-primary-500/30 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Profile</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>

            {/* Preferences */}
            <motion.div
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border-2 border-white/20 shadow-lg"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-heading font-bold text-white">
                  Preferences
                </h2>
              </div>
              <form onSubmit={handleSavePreferences} className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Bell className="w-5 h-5 text-white/80" />
                    <h3 className="text-lg font-semibold text-white">Notifications</h3>
                  </div>
                  <div className="space-y-3 pl-7">
                    <label className="flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        name="notification_email"
                        checked={preferences.notification_email}
                        onChange={handlePreferenceChange}
                        className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-white/30 rounded bg-white/10 checked:bg-primary-500"
                      />
                      <span className="ml-3 text-sm text-white/90 group-hover:text-white transition-colors">Email notifications</span>
                    </label>

                    <label className="flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        name="notification_push"
                        checked={preferences.notification_push}
                        onChange={handlePreferenceChange}
                        className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-white/30 rounded bg-white/10 checked:bg-primary-500"
                      />
                      <span className="ml-3 text-sm text-white/90 group-hover:text-white transition-colors">Push notifications</span>
                    </label>

                    <label className="flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        name="notification_sms"
                        checked={preferences.notification_sms}
                        onChange={handlePreferenceChange}
                        className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-white/30 rounded bg-white/10 checked:bg-primary-500"
                      />
                      <span className="ml-3 text-sm text-white/90 group-hover:text-white transition-colors">SMS notifications</span>
                    </label>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Globe className="w-5 h-5 text-white/80" />
                    <label htmlFor="email_digest_frequency" className="text-sm font-medium text-white/90">
                      Email Digest Frequency
                    </label>
                  </div>
                  <select
                    id="email_digest_frequency"
                    name="email_digest_frequency"
                    value={preferences.email_digest_frequency}
                    onChange={handlePreferenceChange}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  >
                    <option value="daily" className="bg-secondary-900">Daily</option>
                    <option value="weekly" className="bg-secondary-900">Weekly</option>
                    <option value="monthly" className="bg-secondary-900">Monthly</option>
                    <option value="never" className="bg-secondary-900">Never</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Globe className="w-5 h-5 text-white/80" />
                    <label htmlFor="preferred_language" className="text-sm font-medium text-white/90">
                      Preferred Language
                    </label>
                  </div>
                  <select
                    id="preferred_language"
                    name="preferred_language"
                    value={preferences.preferred_language}
                    onChange={handlePreferenceChange}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  >
                    <option value="en" className="bg-secondary-900">English</option>
                    <option value="es" className="bg-secondary-900">Spanish</option>
                    <option value="fr" className="bg-secondary-900">French</option>
                    <option value="de" className="bg-secondary-900">German</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Palette className="w-5 h-5 text-white/80" />
                    <label htmlFor="theme" className="text-sm font-medium text-white/90">
                      Theme
                    </label>
                  </div>
                  <select
                    id="theme"
                    name="theme"
                    value={preferences.theme}
                    onChange={handlePreferenceChange}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  >
                    <option value="light" className="bg-secondary-900">Light</option>
                    <option value="dark" className="bg-secondary-900">Dark</option>
                    <option value="auto" className="bg-secondary-900">Auto</option>
                  </select>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all shadow-lg shadow-primary-500/30 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Preferences</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

