'use client';

import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';

interface BarChartProps {
  data: Array<Record<string, any>>;
  dataKeys: Array<{ key: string; name: string; color: string }>;
  title?: string;
  delay?: number;
}

export default function BarChart({
  data,
  dataKeys,
  title,
  delay = 0,
}: BarChartProps) {
  return (
    <motion.div
      className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/20 shadow-lg"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay }}
    >
      {title && (
        <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <RechartsBarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="platform"
            stroke="rgba(255,255,255,0.7)"
            style={{ fontSize: '12px' }}
          />
          <YAxis stroke="rgba(255,255,255,0.7)" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: '#fff',
            }}
          />
          <Legend
            wrapperStyle={{ color: 'rgba(255,255,255,0.8)' }}
            iconType="square"
          />
          {dataKeys.map(({ key, name, color }) => (
            <Bar key={key} dataKey={key} name={name} fill={color} radius={[8, 8, 0, 0]} />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

