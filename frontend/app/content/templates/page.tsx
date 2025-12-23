'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Edit, Trash2, FileText, Sparkles, X, Save } from 'lucide-react';
import Link from 'next/link';

interface Template {
  id: number;
  name: string;
  description?: string;
  content: string;
  content_type: string;
  hashtags?: string[];
  usage_count: number;
  created_at: string;
}

export default function TemplatesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(searchParams.get('create') === 'true');
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
    content_type: 'text',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      // Use cache with short TTL (60 seconds) - templates don't change often
      const response = await api.get<{ data: Template[] }>('/content/templates', true, 60 * 1000);
      if (response.success && response.data) {
        setTemplates(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.content) {
      alert('Name and content are required');
      return;
    }

    setIsSaving(true);
    try {
      const response = await api.post('/content/templates', formData);
      if (response.success) {
        setFormData({ name: '', description: '', content: '', content_type: 'text' });
        setShowCreateForm(false);
        fetchTemplates();
      }
    } catch (error) {
      console.error('Error creating template:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingTemplate || !formData.name || !formData.content) {
      return;
    }

    setIsSaving(true);
    try {
      // Note: Update endpoint would need to be added to backend
      // For now, we'll just show a message
      alert('Update functionality coming soon. Delete and recreate for now.');
      setEditingTemplate(null);
      setFormData({ name: '', description: '', content: '', content_type: 'text' });
    } catch (error) {
      console.error('Error updating template:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      const response = await api.delete(`/content/templates/${id}`);
      if (response.success) {
        fetchTemplates();
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
    }
  };

  const handleUseTemplate = (template: Template) => {
    router.push(`/content/create?template=${template.id}`);
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      content: template.content,
      content_type: template.content_type || 'text',
    });
    setShowCreateForm(true);
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
            <Link href="/content/create" className="inline-flex items-center text-white/80 hover:text-white mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Create Content
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-heading font-bold mb-2">Content Templates</h1>
                <p className="text-white/80">Create and manage reusable content templates</p>
              </div>
              <button
                onClick={() => {
                  setShowCreateForm(!showCreateForm);
                  setEditingTemplate(null);
                  setFormData({ name: '', description: '', content: '', content_type: 'text' });
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all shadow-lg shadow-primary-500/30 hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                {showCreateForm ? 'Cancel' : 'Create Template'}
              </button>
            </div>
          </motion.div>

          {/* Create/Edit Form */}
          {showCreateForm && (
            <motion.div
              className="mb-8 bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <h2 className="text-2xl font-bold text-white mb-4">
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">Template Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Product Launch Post"
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of when to use this template"
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">Content *</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Template content. Use {placeholder} for dynamic content."
                    rows={8}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={editingTemplate ? handleUpdate : handleCreate}
                    disabled={isSaving || !formData.name || !formData.content}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingTemplate(null);
                      setFormData({ name: '', description: '', content: '', content_type: 'text' });
                    }}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Templates Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            </div>
          ) : templates.length === 0 ? (
            <motion.div
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 border-2 border-white/20 shadow-lg text-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <Sparkles className="w-16 h-16 text-white/40 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No templates yet</h3>
              <p className="text-white/60 mb-6">Create your first template to speed up content creation</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Create Template
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template, index) => (
                <motion.div
                  key={template.id}
                  className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg hover:border-primary-300 transition-all"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">{template.name}</h3>
                      {template.description && (
                        <p className="text-white/60 text-sm mb-2">{template.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <span>Used {template.usage_count} times</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-white/70 text-sm mb-4 line-clamp-3">{template.content}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUseTemplate(template)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-500/20 hover:bg-primary-500/30 text-primary-300 rounded-lg transition-colors text-sm"
                    >
                      <FileText className="w-4 h-4" />
                      Use
                    </button>
                    <button
                      onClick={() => handleEdit(template)}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
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

