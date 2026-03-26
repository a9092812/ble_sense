"use client";

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { formatTimestamp } from '@/lib/utils';
import { NormalizedPacket } from '@/types/telemetry';

interface LiveChartProps {
  packets: NormalizedPacket[];
  keys: string[];
  colors?: string[];
  unit?: string;
  title?: string;
  maxPoints?: number;
  variant?: 'line' | 'area';
}

const DEFAULT_COLORS = ['#00f2ff', '#ff00ff', '#39ff14', '#bc00ff', '#ffae00', '#ff6b6b', '#4ecdc4', '#ffe66d'];

export const LiveChart: React.FC<LiveChartProps> = ({
  packets,
  keys,
  colors = DEFAULT_COLORS,
  unit = '',
  title,
  maxPoints = 60,
  variant = 'line',
}) => {
  const chartData = useMemo(() => {
    return packets
      .slice(0, maxPoints)
      .reverse()
      .map(p => ({
        time: formatTimestamp(p.timestamp),
        ...p.values,
      }));
  }, [packets, maxPoints, keys]);

  if (chartData.length === 0) {
    return (
      <div className="w-full h-[280px] flex items-center justify-center glass p-4 rounded-2xl border-white/5 bg-black/20">
        <p className="text-[10px] text-gray-600 font-black tracking-[0.5em] uppercase">
          Awaiting Data Points...
        </p>
      </div>
    );
  }

  const ChartComponent = variant === 'area' ? AreaChart : LineChart;

  return (
    <div className="w-full h-[280px] flex flex-col glass p-4 rounded-2xl border-white/5 bg-black/20">
      {title && (
        <div className="text-[10px] font-black tracking-[0.4em] text-gray-500 uppercase mb-3 flex items-center justify-between">
          <div className="flex items-center">
            <span className="w-2 h-2 bg-cyber-blue mr-3 rounded-full pulsing-glow" />
            {title}
          </div>
          <div className="text-[8px] opacity-40 font-mono">
            {packets.length} pts
          </div>
        </div>
      )}
      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <ChartComponent data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              {colors.map((color, i) => (
                <linearGradient key={`grad-${i}`} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#333"
              fontSize={9}
              tickLine={false}
              axisLine={false}
              minTickGap={40}
            />
            <YAxis
              stroke="#333"
              fontSize={9}
              tickLine={false}
              axisLine={false}
              unit={unit}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(5, 5, 5, 0.95)',
                border: '1px solid rgba(0, 242, 255, 0.3)',
                borderRadius: '10px',
                fontSize: '11px',
                fontFamily: 'monospace',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}
              itemStyle={{ color: '#fff', padding: '2px 0' }}
              labelStyle={{ color: '#00f2ff', marginBottom: '4px', fontWeight: 'bold' }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              height={30}
              iconType="circle"
              wrapperStyle={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '2px' }}
            />
            {keys.map((key, index) =>
              variant === 'area' ? (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[index % colors.length]}
                  fill={`url(#grad-${index % colors.length})`}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              ) : (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              )
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
