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

const DEFAULT_COLORS = ['#6CFFB0', '#8EF9C5', '#FFFFFF', '#455A64', '#B0BEC5'];

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

  const ChartComponent = variant === 'area' ? AreaChart : LineChart;

  return (
    <div className="w-full h-[300px] flex flex-col glass-inset p-6 bg-white/[0.02] transition-all duration-500">
      {chartData.length === 0 ? (
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-[10px] text-text-disabled font-bold tracking-[0.4em] uppercase opacity-40">
            Awaiting telemetry stream...
          </p>
        </div>
      ) : (
        <>
          {title && (
            <div className="text-[10px] font-bold tracking-[0.4em] text-text-secondary uppercase mb-6 flex items-center justify-between opacity-70">
              <div className="flex items-center">
                <div className="w-1.5 h-1.5 bg-mint-accent mr-3 rounded-full shadow-[0_0_8px_rgba(108,255,176,0.5)] animate-pulse" />
                {title}
              </div>
              <div className="text-[9px] font-mono tabular-nums opacity-40">
                {packets.length} RECORDS
              </div>
            </div>
          )}
          <div className="flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <ChartComponent data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  {colors.map((color, i) => (
                    <linearGradient key={`grad-${i}`} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="6 6" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis
                  dataKey="time"
                  stroke="rgba(255,255,255,0.2)"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={60}
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontWeight: 'bold' }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.2)"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  unit={unit}
                  domain={['auto', 'auto']}
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontWeight: 'bold' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E232E',
                    border: 'none',
                    borderRadius: '16px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    boxShadow: '20px 20px 60px #090b0e, -20px -20px 60px #171c26',
                    padding: '12px',
                  }}
                  itemStyle={{ color: '#fff', padding: '2px 0' }}
                  labelStyle={{ color: '#6CFFB0', marginBottom: '8px', fontWeight: '800', letterSpacing: '0.1em' }}
                  cursor={{ stroke: 'rgba(108,255,176,0.1)', strokeWidth: 2 }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.2em', opacity: 0.6 }}
                />
                {keys.map((key, index) =>
                  variant === 'area' ? (
                    <Area
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={colors[index % colors.length]}
                      fill={`url(#grad-${index % colors.length})`}
                      strokeWidth={2.5}
                      dot={false}
                      isAnimationActive={false}
                    />
                  ) : (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={colors[index % colors.length]}
                      strokeWidth={2.5}
                      dot={false}
                      isAnimationActive={false}
                    />
                  )
                )}
              </ChartComponent>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};
