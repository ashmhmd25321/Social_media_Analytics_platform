'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface ScheduledPost {
  id: number;
  content: string;
  platform_type: string;
  scheduled_at: string;
  status: string;
}

export default function CalendarPage() {
  const { user } = useAuth();
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    fetchScheduledPosts();
  }, []);

  const fetchScheduledPosts = async () => {
    try {
      setLoading(true);
      // DISABLE CACHE for fresh data
      const response = await api.get<{ data: ScheduledPost[] }>('/content/scheduled', false);
      if (response.success && response.data) {
        setScheduledPosts(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getPostsForDate = (date: Date | null): ScheduledPost[] => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return scheduledPosts.filter(post => {
      const postDate = new Date(post.scheduled_at).toISOString().split('T')[0];
      return postDate === dateStr;
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const days = getDaysInMonth(currentDate);
  const selectedDatePosts = selectedDate ? getPostsForDate(selectedDate) : [];

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
            <Link href="/content/scheduled" className="inline-flex items-center text-white/80 hover:text-white mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Scheduled Posts
            </Link>
            <h1 className="text-4xl font-heading font-bold mb-2">Content Calendar</h1>
            <p className="text-white/80">View and manage your scheduled posts on a calendar</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <motion.div
              className="lg:col-span-2 bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <h2 className="text-2xl font-bold text-white">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {/* Week day headers */}
                {weekDays.map(day => (
                  <div key={day} className="text-center text-sm font-medium text-white/70 py-2">
                    {day}
                  </div>
                ))}

                {/* Calendar days */}
                {days.map((day, index) => {
                  const postsForDay = day ? getPostsForDate(day) : [];
                  const isToday = day && day.toDateString() === new Date().toDateString();
                  const isSelected = day && selectedDate && day.toDateString() === selectedDate.toDateString();
                  const isPast = day && day < new Date() && !isToday;

                  return (
                    <button
                      key={index}
                      onClick={() => day && setSelectedDate(day)}
                      className={`
                        aspect-square p-2 rounded-lg transition-all text-left
                        ${!day ? 'bg-transparent' : ''}
                        ${day && !isSelected && !isToday ? 'bg-white/5 hover:bg-white/10' : ''}
                        ${isToday ? 'bg-primary-500/30 border-2 border-primary-400' : ''}
                        ${isSelected ? 'bg-primary-500/50 border-2 border-primary-300' : ''}
                        ${isPast ? 'opacity-50' : ''}
                      `}
                    >
                      {day && (
                        <>
                          <div className={`text-sm font-medium mb-1 ${
                            isToday || isSelected ? 'text-white' : 'text-white/90'
                          }`}>
                            {day.getDate()}
                          </div>
                          {postsForDay.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {postsForDay.slice(0, 3).map((post, idx) => (
                                <div
                                  key={idx}
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    post.status === 'pending' ? 'bg-yellow-400' :
                                    post.status === 'published' ? 'bg-green-400' :
                                    'bg-gray-400'
                                  }`}
                                  title={post.content.substring(0, 50)}
                                />
                              ))}
                              {postsForDay.length > 3 && (
                                <span className="text-xs text-white/60">+{postsForDay.length - 3}</span>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Selected Date Posts */}
            <motion.div
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                {selectedDate
                  ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                  : 'Select a Date'}
              </h3>

              {selectedDate ? (
                selectedDatePosts.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDatePosts.map(post => (
                      <div
                        key={post.id}
                        className="bg-white/5 rounded-lg p-3 border border-white/10"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            post.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                            post.status === 'published' ? 'bg-green-500/20 text-green-300' :
                            'bg-gray-500/20 text-gray-300'
                          }`}>
                            {post.status}
                          </span>
                          <span className="text-xs text-white/60 capitalize">{post.platform_type}</span>
                        </div>
                        <p className="text-white/80 text-sm line-clamp-2 mb-2">{post.content}</p>
                        <div className="flex items-center gap-1 text-xs text-white/60">
                          <Clock className="w-3 h-3" />
                          {new Date(post.scheduled_at).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-white/60">
                    <p>No posts scheduled for this date</p>
                    <Link
                      href="/content/create"
                      className="mt-4 inline-block text-primary-300 hover:text-primary-200 transition-colors text-sm"
                    >
                      Schedule a post →
                    </Link>
                  </div>
                )
              ) : (
                <div className="text-center py-8 text-white/60">
                  <p>Click on a date to view scheduled posts</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

