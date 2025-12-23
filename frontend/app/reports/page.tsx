'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { FileText, Download, Plus, Calendar, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Report {
  id: number;
  title: string;
  description?: string;
  report_type: string;
  format: 'pdf' | 'excel' | 'html';
  status: 'draft' | 'generating' | 'completed' | 'failed';
  date_range_start: string;
  date_range_end: string;
  file_path?: string;
  generated_at?: string;
  created_at: string;
}

export default function ReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const status = filter === 'all' ? undefined : filter;
      // DISABLE CACHE for fresh data
      const response = await api.get<{ data: Report[] }>(`/reports?status=${status || ''}`, false);
      if (response.success && response.data) {
        setReports(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (reportId: number) => {
    try {
      const response = await api.post(`/reports/${reportId}/generate`);
      if (response.success) {
        await fetchReports();
      }
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const deleteReport = async (id: number) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      const response = await api.delete(`/reports/${id}`);
      if (response.success) {
        setReports(reports.filter(r => r.id !== id));
      }
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'generating':
        return <Clock className="w-5 h-5 text-yellow-400 animate-spin" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-blue-400" />;
    }
  };

  const downloadReport = (report: Report) => {
    if (report.file_path) {
      window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}${report.file_path}`, '_blank');
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-heading font-bold mb-2">Reports</h1>
                <p className="text-white/80">Generate and manage your analytics reports</p>
              </div>
              <Link
                href="/reports/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all shadow-lg shadow-primary-500/30 hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                Create Report
              </Link>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            className="mb-6 flex gap-2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {['all', 'draft', 'generating', 'completed', 'failed'].map((status) => (
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

          {/* Reports List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            </div>
          ) : reports.length === 0 ? (
            <motion.div
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 border-2 border-white/20 shadow-lg text-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <FileText className="w-16 h-16 text-white/40 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No reports yet</h3>
              <p className="text-white/60 mb-6">Create your first report to get started</p>
              <Link
                href="/reports/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Create Report
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map((report, index) => (
                <motion.div
                  key={report.id}
                  className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg hover:border-primary-300 transition-all"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(report.status)}
                        <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                          report.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                          report.status === 'generating' ? 'bg-yellow-500/20 text-yellow-300' :
                          report.status === 'failed' ? 'bg-red-500/20 text-red-300' :
                          'bg-blue-500/20 text-blue-300'
                        }`}>
                          {report.status}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1">{report.title}</h3>
                      {report.description && (
                        <p className="text-white/60 text-sm mb-2 line-clamp-2">{report.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-white/60 mb-4">
                    <span className="capitalize">{report.report_type}</span>
                    <span className="uppercase">{report.format}</span>
                  </div>
                  <div className="text-xs text-white/60 mb-4">
                    <div className="flex items-center gap-1 mb-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(report.date_range_start).toLocaleDateString()} - {new Date(report.date_range_end).toLocaleDateString()}
                    </div>
                    {report.generated_at && (
                      <div>Generated: {new Date(report.generated_at).toLocaleDateString()}</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {report.status === 'completed' && report.file_path ? (
                      <button
                        onClick={() => downloadReport(report)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-colors text-sm"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    ) : report.status === 'draft' ? (
                      <button
                        onClick={() => generateReport(report.id)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-500/20 hover:bg-primary-500/30 text-primary-300 rounded-lg transition-colors text-sm"
                      >
                        <FileText className="w-4 h-4" />
                        Generate
                      </button>
                    ) : null}
                    <button
                      onClick={() => deleteReport(report.id)}
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

