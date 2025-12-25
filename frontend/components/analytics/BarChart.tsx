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
  Cell,
} from 'recharts';
import { motion } from 'framer-motion';

interface BarChartProps {
  data: Array<Record<string, any>>;
  dataKeys?: Array<{ key: string; name: string; color: string }>;
  title?: string;
  delay?: number;
  // Simple format: array of { name, value, color }
  simpleData?: Array<{ name: string; value: number; color: string }>;
  // Custom XAxis dataKey (defaults to 'name')
  xAxisKey?: string;
  // If true, render without wrapper (for custom layout)
  noWrapper?: boolean;
}

export default function BarChart({
  data,
  dataKeys,
  title,
  delay = 0,
  simpleData,
  xAxisKey = 'name',
  noWrapper = false,
}: BarChartProps) {
  // If simpleData is provided, use it instead
  const chartData = simpleData 
    ? simpleData.map(item => ({ name: item.name, value: item.value }))
    : data;
  
  const chartDataKeys = simpleData
    ? simpleData.map((item, index) => ({ key: 'value', name: item.name, color: item.color }))
    : (dataKeys || []);

  // Chart content (reusable)
  const chartContent = (
    <ResponsiveContainer width="100%" height={300}>
        <RechartsBarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey={xAxisKey}
            stroke="rgba(255,255,255,0.7)"
            style={{ fontSize: '12px' }}
          />
          <YAxis stroke="rgba(255,255,255,0.7)" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: '#ffffff',
            }}
            itemStyle={{
              color: '#ffffff',
            }}
            labelStyle={{
              color: '#ffffff',
            }}
            formatter={(value: any) => value.toLocaleString()}
          />
          {!simpleData && chartDataKeys.length > 0 && (
            <Legend 
              wrapperStyle={{ color: 'rgba(255,255,255,0.9)', paddingTop: '20px' }}
              iconType="rect"
            />
          )}
          {simpleData ? (
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => {
                const colorItem = simpleData.find(s => s.name === entry.name);
                return <Cell key={`cell-${index}`} fill={colorItem?.color || '#8b5cf6'} />;
              })}
            </Bar>
          ) : (
            chartDataKeys.map(({ key, name, color }) => (
              <Bar key={key} dataKey={key} name={name} fill={color} radius={[8, 8, 0, 0]} />
            ))
          )}
        </RechartsBarChart>
      </ResponsiveContainer>
  );

  // If noWrapper is true, return just the chart content (for custom wrapper)
  if (noWrapper) {
    return (
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay }}
        className="w-full"
      >
        {chartContent}
      </motion.div>
    );
  }

  // Otherwise, return with wrapper
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
      {chartContent}
    </motion.div>
  );
}

