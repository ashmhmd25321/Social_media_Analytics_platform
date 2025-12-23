'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Calendar, Image, Video, FileText, X, Hash, Sparkles, Clock } from 'lucide-react';
import Link from 'next/link';
import HashtagSuggestions from '@/components/content/HashtagSuggestions';
import OptimalPostingTime from '@/components/content/OptimalPostingTime';

interface ConnectedAccount {
  id: number;
  platform_name: string;
  platform_display_name: string;
  platform_username?: string;
}

export default function CreateContentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<number[]>([]);
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [scheduledAt, setScheduledAt] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [isSaving, setIsSaving] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    fetchAccounts();
    fetchTemplates();
  }, []);

  // Handle template selection from URL
  useEffect(() => {
    const templateId = searchParams.get('template');
    if (templateId && templates.length > 0) {
      const template = templates.find(t => t.id === parseInt(templateId));
      if (template) {
        setSelectedTemplate(template.id);
        setContent(template.content);
        setTitle(template.name);
        if (template.hashtags) {
          setHashtags(Array.isArray(template.hashtags) ? template.hashtags : []);
        }
      }
    }
  }, [searchParams, templates]);

  useEffect(() => {
    if (selectedTemplate) {
      const template = templates.find(t => t.id === selectedTemplate);
      if (template) {
        setContent(template.content);
        setTitle(template.name);
        if (template.hashtags) {
          setHashtags(Array.isArray(template.hashtags) ? template.hashtags : []);
        }
      }
    }
  }, [selectedTemplate, templates]);

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

  const fetchTemplates = async () => {
    try {
      // Use cache with short TTL (30 seconds) to reduce requests
      const response = await api.get<{ data: any[] }>('/content/templates', true, 30 * 1000);
      if (response.success && response.data) {
        setTemplates(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleHashtagAdd = (hashtag: string) => {
    if (!hashtags.includes(hashtag)) {
      setHashtags([...hashtags, hashtag]);
      // Add hashtag to content if not already there
      if (!content.includes(hashtag)) {
        setContent(content + (content.trim() ? ' ' : '') + hashtag);
      }
    }
  };

  const handleHashtagRemove = (hashtag: string) => {
    setHashtags(hashtags.filter(h => h !== hashtag));
    // Remove from content
    setContent(content.replace(new RegExp(`\\s*${hashtag}\\s*`, 'g'), ' ').trim());
  };

  const handleTimeSelect = (hour: number) => {
    if (scheduledAt) {
      const date = new Date(scheduledAt);
      date.setHours(hour, 0, 0, 0);
      setScheduledAt(date.toISOString().slice(0, 16));
    } else {
      const date = new Date();
      date.setHours(hour, 0, 0, 0);
      date.setDate(date.getDate() + 1); // Tomorrow
      setScheduledAt(date.toISOString().slice(0, 16));
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await api.post('/content/drafts', {
        title,
        content: content + (hashtags.length > 0 ? ' ' + hashtags.join(' ') : ''),
        hashtags: hashtags,
        target_platforms: selectedPlatforms,
        status: 'draft',
      });

      if (response.success) {
        setMessage({ type: 'success', text: 'Draft saved successfully!' });
        // Clear form
        setTitle('');
        setContent('');
        setSelectedPlatforms([]);
        // Navigate immediately to library
        setTimeout(() => {
          // Clear cache for drafts endpoint
          const { apiCache } = require('@/lib/cache');
          apiCache.delete(apiCache.generateKey('/content/drafts'));
          // Set refresh flag for content library page
          sessionStorage.setItem('refresh_content_library', 'true');
          // Dispatch custom event
          window.dispatchEvent(new CustomEvent('refreshContentLibrary'));
          router.push('/content/library');
        }, 1000);
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to save draft' });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save draft',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSchedule = async () => {
    if (!selectedPlatforms.length) {
      setMessage({ type: 'error', text: 'Please select at least one platform' });
      return;
    }

    if (!scheduledAt) {
      setMessage({ type: 'error', text: 'Please select a date and time' });
      return;
    }

    setIsScheduling(true);
    setMessage(null);

    try {
      // Schedule for each selected account
      const schedulePromises = selectedPlatforms.map(accountId =>
        api.post('/content/schedule', {
          account_id: accountId,
          content,
          content_type: 'text',
          scheduled_at: scheduledAt,
          timezone,
        })
      );

      await Promise.all(schedulePromises);
      setMessage({ type: 'success', text: 'Post scheduled successfully!' });
      setTimeout(() => {
        // Clear cache for scheduled posts endpoint
        const { apiCache } = require('@/lib/cache');
        apiCache.delete(apiCache.generateKey('/content/scheduled'));
        // Set refresh flag for scheduled posts page
        sessionStorage.setItem('refresh_content_scheduled', 'true');
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('refreshContentScheduled'));
        router.push('/content/scheduled');
      }, 1500);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to schedule post',
      });
    } finally {
      setIsScheduling(false);
    }
  };

  const togglePlatform = (accountId: number) => {
    setSelectedPlatforms(prev =>
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
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

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div className="mb-8 text-white" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <Link href="/content/library" className="inline-flex items-center text-white/80 hover:text-white mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Content Library
            </Link>
            <h1 className="text-4xl font-heading font-bold mb-2">Create Content</h1>
            <p className="text-white/80">Create and schedule your social media posts</p>
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
                
                {/* Hashtag Suggestions */}
                {content.length >= 10 && (
                  <HashtagSuggestions
                    content={content}
                    accountId={selectedPlatforms[0]}
                    onHashtagAdd={handleHashtagAdd}
                    selectedHashtags={hashtags}
                  />
                )}

                {/* Selected Hashtags */}
                {hashtags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {hashtags.map((hashtag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-primary-500/20 text-primary-300 rounded-full text-sm"
                      >
                        {hashtag}
                        <button
                          onClick={() => handleHashtagRemove(hashtag)}
                          className="hover:text-primary-200 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Media Placeholder */}
              <motion.div
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg border-dashed"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="text-center py-8">
                  <Image className="w-12 h-12 text-white/40 mx-auto mb-3" />
                  <p className="text-white/60 text-sm">Media upload coming soon</p>
                  <p className="text-white/40 text-xs mt-1">Image and video support will be added</p>
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

              {/* Templates */}
              <motion.div
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Templates
                  </h3>
                  <Link
                    href="/content/templates"
                    className="text-sm text-primary-300 hover:text-primary-200 transition-colors"
                  >
                    Manage
                  </Link>
                </div>
                {templates.length === 0 ? (
                  <p className="text-white/60 text-sm mb-3">No templates yet.</p>
                ) : (
                  <select
                    value={selectedTemplate || ''}
                    onChange={(e) => setSelectedTemplate(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  >
                    <option value="" className="bg-secondary-900">Select a template...</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id} className="bg-secondary-900">
                        {template.name}
                      </option>
                    ))}
                  </select>
                )}
                <Link
                  href="/content/templates?create=true"
                  className="mt-3 block text-center text-sm text-primary-300 hover:text-primary-200 transition-colors"
                >
                  + Create New Template
                </Link>
              </motion.div>

              {/* Scheduling */}
              <motion.div
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Schedule Post
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">Date & Time</label>
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">Timezone</label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    >
                      <option value="UTC" className="bg-secondary-900">UTC</option>
                      <option value="America/New_York" className="bg-secondary-900">Eastern Time (ET)</option>
                      <option value="America/Chicago" className="bg-secondary-900">Central Time (CT)</option>
                      <option value="America/Denver" className="bg-secondary-900">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles" className="bg-secondary-900">Pacific Time (PT)</option>
                    </select>
                  </div>
                  
                  {/* Optimal Posting Time Suggestions */}
                  {selectedPlatforms.length > 0 && (
                    <OptimalPostingTime
                      accountId={selectedPlatforms[0]}
                      onTimeSelect={handleTimeSelect}
                      selectedDateTime={scheduledAt}
                    />
                  )}
                </div>
              </motion.div>

              {/* Actions */}
              <motion.div
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <div className="space-y-3">
                  <button
                    onClick={handleSaveDraft}
                    disabled={isSaving || !content.trim()}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save as Draft'}
                  </button>
                  <button
                    onClick={handleSchedule}
                    disabled={isScheduling || !content.trim() || !scheduledAt || selectedPlatforms.length === 0}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all shadow-lg shadow-primary-500/30 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Calendar className="w-4 h-4" />
                    {isScheduling ? 'Scheduling...' : 'Schedule Post'}
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

