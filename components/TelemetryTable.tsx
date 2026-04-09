"use client";

import React from 'react';
import { NormalizedPacket } from '@/types/telemetry';
import { formatDateTime } from '@/lib/utils';
import { Terminal } from 'lucide-react';

interface TelemetryTableProps {
  packets: NormalizedPacket[];
  maxRows?: number;
}

export const TelemetryTable: React.FC<TelemetryTableProps> = ({ packets, maxRows = 50 }) => {
  const rows = packets.slice(0, maxRows);

  // Collect all unique value keys across all packets
  const valueKeys = Array.from(
    new Set(rows.flatMap(p => Object.keys(p.values)))
  );

  return (
    <div className="glass-card border-none flex flex-col h-[500px] overflow-hidden bg-white/5">
      <div className="px-6 py-5 flex items-center justify-between relative z-20 shadow-sm border-b border-white/5">
        <div className="flex items-center space-x-4">
          <div className="p-2 glass-inset bg-white/5 rounded-lg">
            <Terminal className="w-4 h-4 text-mint-accent" />
          </div>
          <h3 className="text-[10px] font-bold tracking-[0.4em] text-text-secondary uppercase opacity-70">TELEMETRY_LOG</h3>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-[9px] font-bold text-text-disabled bg-white/5 px-3 py-1 rounded-full uppercase tracking-widest">
            {rows.length} / {packets.length} BUFFERED
          </span>
        </div>
      </div>
      
      <div className="overflow-auto flex-1 relative z-10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <table className="w-full text-left text-[11px] font-bold">
          <thead className="sticky top-0 z-20 bg-charcoal-dark/95 backdrop-blur-md text-text-secondary border-b border-white/5 shadow-sm">
            <tr>
              <th className="px-6 py-4 uppercase tracking-widest text-[9px] opacity-50">TIMESTAMP</th>
              <th className="px-6 py-4 uppercase tracking-widest text-[9px] opacity-50">NODE_TYPE</th>
              <th className="px-6 py-4 uppercase tracking-widest text-[9px] opacity-50">RSSI</th>
              {valueKeys.map(key => (
                <th key={key} className="px-6 py-4 uppercase tracking-widest text-[9px] opacity-50">
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((packet, index) => (
              <tr key={`${packet.timestamp}-${index}`} className="hover:bg-white/[0.03] transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap text-text-disabled group-hover:text-white font-mono transition-colors">
                  {formatDateTime(packet.timestamp)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-3 py-1 rounded-lg text-[9px] font-bold bg-mint-accent/10 text-mint-accent/90 border border-mint-accent/20 uppercase tracking-widest">
                    {packet.sensorType}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`font-mono text-xs ${packet.rssi > -70 ? 'text-mint-accent shadow-mint-accent/20 text-shadow-sm' : 'text-text-disabled'}`}>
                    {packet.rssi} <span className="text-[9px] opacity-60">dBm</span>
                  </span>
                </td>
                {valueKeys.map(key => (
                  <td key={key} className="px-6 py-4 whitespace-nowrap text-white/80 font-mono tracking-tighter tabular-nums">
                    {packet.values[key] !== undefined ? packet.values[key].toFixed(2) : '—'}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3 + valueKeys.length} className="px-6 py-32 text-center text-text-disabled uppercase font-bold tracking-[1em] opacity-20 text-[10px]">
                  Waiting for data signal...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
