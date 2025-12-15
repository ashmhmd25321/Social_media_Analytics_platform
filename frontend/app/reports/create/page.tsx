'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Eye, Calendar, FileText, Plus, X, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface ReportTemplate {
  id: number;
  name: string;
  description?: string;
  report_type: string;
  sections: any[];
}

interface ReportSection {
  type: 'metrics' | 'chart' | 'table' | 'text';
  title: string;
  config: any;
}

export default function CreateReportPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    report_type: 'overview',
    format: 'html' as 'pdf' | 'excel' | 'html',
    date_range_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    date_range_end: new Date().toISOString().split('T')[0],
  });
  const [sections, setSections] = useState<ReportSection[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      const template = templates.find(t => t.id === selectedTemplate);
      if (template) {
        setFormData(prev => ({ ...prev, report_type: template.report_type }));
        setSections(template.sections || []);
      }
    }
  }, [selectedTemplate, templates]);

  const fetchTemplates = async () => {
    try {
      const response = await api.get<{ data: ReportTemplate[] }>('/reports/templates');
      if (response.success && response.data) {
        setTemplates(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const addSection = (type: ReportSection['type']) => {
    const newSection: ReportSection = {
      type,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Section`,
      config: type === 'metrics' ? { metrics: ['followers', 'engagement'] } :
              type === 'chart' ? { chartType: 'line', dataSource: 'engagement' } :
              type === 'table' ? { columns: ['date', 'platform', 'engagement'] } :
              { content: '' },
    };
    setSections([...sections, newSection]);
  };

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const updateSection = (index: number, updates: Partial<ReportSection>) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], ...updates };
    setSections(updated);
  };

  const handleSave = async (generate: boolean = false) => {
    if (!formData.title || !formData.date_range_start || !formData.date_range_end) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      const reportData = {
        ...formData,
        metadata: { sections },
      };

      const response = await api.post('/reports', reportData);
      if (response.success) {
        if (generate) {
          // Generate report immediately
          const reportId = response.data.id;
          await api.post(`/reports/${reportId}/generate`);
        }
        router.push('/reports');
      }
    } catch (error) {
      console.error('Error creating report:', error);
      alert('Failed to create report');
    } finally {
      setIsSaving(false);
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

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div 
            className="mb-8 text-white"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <Link href="/reports" className="inline-flex items-center text-white/80 hover:text-white mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Reports
            </Link>
            <h1 className="text-4xl font-heading font-bold mb-2">Create Report</h1>
            <p className="text-white/80">Build a custom analytics report</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <motion.div
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                <h2 className="text-2xl font-bold text-white mb-4">Report Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">Report Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Monthly Analytics Report"
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of the report"
                      rows={3}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">Report Type</label>
                      <select
                        value={formData.report_type}
                        onChange={(e) => setFormData({ ...formData, report_type: e.target.value })}
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
                      >
                        <option value="overview">Overview</option>
                        <option value="audience">Audience</option>
                        <option value="content">Content</option>
                        <option value="engagement">Engagement</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">Format</label>
                      <select
                        value={formData.format}
                        onChange={(e) => setFormData({ ...formData, format: e.target.value as any })}
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
                      >
                        <option value="html">HTML</option>
                        <option value="pdf">PDF</option>
                        <option value="excel">Excel</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">Start Date *</label>
                      <input
                        type="date"
                        value={formData.date_range_start}
                        onChange={(e) => setFormData({ ...formData, date_range_start: e.target.value })}
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">End Date *</label>
                      <input
                        type="date"
                        value={formData.date_range_end}
                        onChange={(e) => setFormData({ ...formData, date_range_end: e.target.value })}
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Template Selection */}
              {templates.length > 0 && (
                <motion.div
                  className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <h2 className="text-2xl font-bold text-white mb-4">Use Template</h2>
                  <div className="space-y-2">
                    {templates.map(template => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.id === selectedTemplate ? null : template.id)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          selectedTemplate === template.id
                            ? 'border-primary-400 bg-primary-500/20'
                            : 'border-white/20 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-white font-medium">{template.name}</h3>
                            {template.description && (
                              <p className="text-white/60 text-sm mt-1">{template.description}</p>
                            )}
                          </div>
                          {selectedTemplate === template.id && (
                            <CheckCircle className="w-5 h-5 text-primary-400" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Report Sections */}
              <motion.div
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white">Report Sections</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => addSection('metrics')}
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
                    >
                      <Plus className="w-4 h-4 inline mr-1" />
                      Metrics
                    </button>
                    <button
                      onClick={() => addSection('chart')}
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
                    >
                      <Plus className="w-4 h-4 inline mr-1" />
                      Chart
                    </button>
                    <button
                      onClick={() => addSection('table')}
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
                    >
                      <Plus className="w-4 h-4 inline mr-1" />
                      Table
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  {sections.map((section, index) => (
                    <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => updateSection(index, { title: e.target.value })}
                          className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                          placeholder="Section title"
                        />
                        <button
                          onClick={() => removeSection(index)}
                          className="ml-2 p-2 text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="text-xs text-white/60 capitalize">{section.type}</span>
                    </div>
                  ))}
                  {sections.length === 0 && (
                    <p className="text-white/60 text-center py-8">No sections added yet. Add sections to customize your report.</p>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Actions */}
              <motion.div
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-lg font-bold text-white mb-4">Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => handleSave(false)}
                    disabled={isSaving}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary-500/20 hover:bg-primary-500/30 text-primary-300 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    Save as Draft
                  </button>
                  <button
                    onClick={() => handleSave(true)}
                    disabled={isSaving}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all shadow-lg disabled:opacity-50"
                  >
                    <FileText className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save & Generate'}
                  </button>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    {showPreview ? 'Hide Preview' : 'Preview'}
                  </button>
                </div>
              </motion.div>

              {/* Quick Info */}
              <motion.div
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="text-lg font-bold text-white mb-4">Report Info</h3>
                <div className="space-y-2 text-sm text-white/80">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{sections.length} sections</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span className="uppercase">{formData.format}</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

