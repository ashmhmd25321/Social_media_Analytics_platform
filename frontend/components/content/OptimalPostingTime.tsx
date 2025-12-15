'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Clock, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface OptimalPostingTimeProps {
  accountId?: number;
  onTimeSelect: (hour: number) => void;
  selectedDateTime?: string;
}

interface BestHour {
  hour: number;
  avgEngagement: number;
  postCount: number;
  label: string;
}

export default function OptimalPostingTime({
  accountId,
  onTimeSelect,
  selectedDateTime,
}: OptimalPostingTimeProps) {
  const [bestHours, setBestHours] = useState<BestHour[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOptimalTimes = async () => {
      if (!accountId) return;

      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (accountId) {
          params.append('accountId', accountId.toString());
        }

        const response = await api.get<{ data: { bestHours: BestHour[] } }>(
          `/content/posting-time/suggest?${params.toString()}`
        );

        if (response.success && response.data) {
          setBestHours(response.data.bestHours);
        }
      } catch (error) {
        console.error('Error fetching optimal posting times:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOptimalTimes();
  }, [accountId]);

  if (bestHours.length === 0 && !loading) {
    return null;
  }

  const handleTimeClick = (hour: number) => {
    if (selectedDateTime) {
      const date = new Date(selectedDateTime);
      date.setHours(hour, 0, 0, 0);
      onTimeSelect(hour);
    }
  };

  return (
    <motion.div
      className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-primary-300" />
        <span className="text-sm font-medium text-white/90">Optimal Posting Times</span>
        {loading && <span className="text-xs text-white/60">Loading...</span>}
      </div>
      <div className="space-y-2">
        {bestHours.map((bestHour, index) => (
          <button
            key={index}
            onClick={() => handleTimeClick(bestHour.hour)}
            className="w-full flex items-center justify-between p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">{bestHour.label}</span>
              {bestHour.avgEngagement > 0 && (
                <span className="text-xs text-white/60">
                  {bestHour.avgEngagement.toFixed(1)}% avg engagement
                </span>
              )}
            </div>
            {bestHour.avgEngagement > 0 && (
              <TrendingUp className="w-4 h-4 text-green-400" />
            )}
          </button>
        ))}
      </div>
      <p className="text-xs text-white/60 mt-3">
        Based on your historical engagement data. Click to set time.
      </p>
    </motion.div>
  );
}

