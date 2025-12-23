'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  gradient?: string;
  delay?: number;
}

export default function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  gradient = 'from-blue-500 to-cyan-500',
  delay = 0,
}: MetricCardProps) {
  const formattedValue =
    typeof value === 'number'
      ? value >= 1000000
        ? `${(value / 1000000).toFixed(1)}M`
        : value >= 1000
        ? `${(value / 1000).toFixed(1)}K`
        : value.toFixed(0)
      : value;

  return (
    <motion.div
      className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg hover:border-primary-300 transition-all"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay }}
      whileHover={{ y: -4 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-white/70 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-white mb-2">{formattedValue}</h3>
          {trend && (
            <div className="flex items-center gap-1">
              <span
                className={`text-sm font-semibold ${
                  trend.isPositive ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value || 0).toFixed(1)}%
              </span>
              <span className="text-white/60 text-xs">vs last period</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

