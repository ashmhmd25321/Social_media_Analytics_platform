'use client';

import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';

interface LineChartProps {
  data: Array<Record<string, any>>;
  dataKey?: string;
  dataKeys?: Array<{ key: string; name: string; color: string }>;
  title?: string;
  color?: string;
  delay?: number;
}

export default function LineChart({
  data,
  dataKey,
  dataKeys,
  title,
  color = '#8b5cf6',
  delay = 0,
}: LineChartProps) {
  const keysToRender = dataKeys || (dataKey ? [{ key: dataKey, name: dataKey, color }] : []);
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
        <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="date"
            stroke="rgba(255,255,255,0.7)"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getMonth() + 1}/${date.getDate()}`;
            }}
          />
          <YAxis stroke="rgba(255,255,255,0.7)" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: '#fff',
            }}
            labelFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString();
            }}
          />
          <Legend
            wrapperStyle={{ color: 'rgba(255,255,255,0.8)' }}
            iconType="line"
          />
          {keysToRender.map(({ key, name, color: lineColor }) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              name={name}
              stroke={lineColor}
              strokeWidth={2}
              dot={{ fill: lineColor, r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

