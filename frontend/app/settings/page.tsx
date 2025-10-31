'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { userApi } from '@/lib/api';
import { Button, Card } from '@/components/ui';
import { useRouter } from 'next/navigation';

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
        if (prefsResponse.success && prefsResponse.data?.preferences) {
          setPreferences(prefsResponse.data.preferences);
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
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-neutral-50">
        <nav className="bg-white border-b border-neutral-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="text-primary-600 hover:text-primary-700"
                >
                  ← Back to Dashboard
                </button>
                <h1 className="text-xl font-heading font-bold text-primary-600">
                  Settings
                </h1>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-neutral-600">{user?.email}</span>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {message && (
            <div
              className={`mb-6 rounded-lg p-4 ${
                message.type === 'success'
                  ? 'bg-success-50 border border-success-200 text-success-800'
                  : 'bg-error-50 border border-error-200 text-error-800'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="space-y-6">
            {/* Profile Settings */}
            <Card>
              <h2 className="text-2xl font-heading font-bold text-neutral-900 mb-6">
                Profile Settings
              </h2>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="first_name" className="block text-sm font-medium text-neutral-700 mb-2">
                      First Name
                    </label>
                    <input
                      id="first_name"
                      name="first_name"
                      type="text"
                      value={profileData.first_name}
                      onChange={handleProfileChange}
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label htmlFor="last_name" className="block text-sm font-medium text-neutral-700 mb-2">
                      Last Name
                    </label>
                    <input
                      id="last_name"
                      name="last_name"
                      type="text"
                      value={profileData.last_name}
                      onChange={handleProfileChange}
                      className="input w-full"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    className="input w-full"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium text-neutral-700 mb-2">
                    Timezone
                  </label>
                  <select
                    id="timezone"
                    name="timezone"
                    value={profileData.timezone}
                    onChange={handleProfileChange}
                    className="input w-full"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  </select>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" variant="primary" isLoading={isSaving}>
                    Save Profile
                  </Button>
                </div>
              </form>
            </Card>

            {/* Preferences */}
            <Card>
              <h2 className="text-2xl font-heading font-bold text-neutral-900 mb-6">
                Preferences
              </h2>
              <form onSubmit={handleSavePreferences} className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-800 mb-3">Notifications</h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="notification_email"
                        checked={preferences.notification_email}
                        onChange={handlePreferenceChange}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                      />
                      <span className="ml-2 text-sm text-neutral-700">Email notifications</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="notification_push"
                        checked={preferences.notification_push}
                        onChange={handlePreferenceChange}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                      />
                      <span className="ml-2 text-sm text-neutral-700">Push notifications</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="notification_sms"
                        checked={preferences.notification_sms}
                        onChange={handlePreferenceChange}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                      />
                      <span className="ml-2 text-sm text-neutral-700">SMS notifications</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label htmlFor="email_digest_frequency" className="block text-sm font-medium text-neutral-700 mb-2">
                    Email Digest Frequency
                  </label>
                  <select
                    id="email_digest_frequency"
                    name="email_digest_frequency"
                    value={preferences.email_digest_frequency}
                    onChange={handlePreferenceChange}
                    className="input w-full"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="never">Never</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="preferred_language" className="block text-sm font-medium text-neutral-700 mb-2">
                    Preferred Language
                  </label>
                  <select
                    id="preferred_language"
                    name="preferred_language"
                    value={preferences.preferred_language}
                    onChange={handlePreferenceChange}
                    className="input w-full"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="theme" className="block text-sm font-medium text-neutral-700 mb-2">
                    Theme
                  </label>
                  <select
                    id="theme"
                    name="theme"
                    value={preferences.theme}
                    onChange={handlePreferenceChange}
                    className="input w-full"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" variant="primary" isLoading={isSaving}>
                    Save Preferences
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

