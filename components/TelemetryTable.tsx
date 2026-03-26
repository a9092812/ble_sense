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
<div className="glass border border-white/10 rounded-2xl shadow-2xl flex flex-col h-[400px]">
      <div className="bg-black/40 px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Terminal className="w-4 h-4 text-cyber-blue" />
          <h3 className="text-xs font-black tracking-[0.4em] text-gray-400 uppercase">DATA_LOG</h3>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-[10px] font-mono text-gray-600 bg-white/5 px-2 py-0.5 rounded">
            {rows.length} / {packets.length} rows
          </span>
        </div>
      </div>
      <div className="overflow-auto flex-1">
        <table className="w-full text-left text-xs font-mono">
         <thead className="sticky top-0 z-10 bg-black text-gray-500 border-b border-white/5">
            <tr>
              
              <th className="px-5 py-3 font-black uppercase tracking-widest italic text-[10px]">TIMESTAMP</th>
              <th className="px-5 py-3 font-black uppercase tracking-widest italic text-[10px]">TYPE</th>
              <th className="px-5 py-3 font-black uppercase tracking-widest italic text-[10px]">RSSI</th>
              {valueKeys.map(key => (
                <th key={key} className="px-5 py-3 font-black uppercase tracking-widest italic text-[10px]">
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((packet, index) => (
              <tr key={`${packet.timestamp}-${index}`} className="hover:bg-cyber-blue/[0.03] transition-colors group">
                <td className="px-5 py-3 whitespace-nowrap text-gray-400 group-hover:text-white">
                  {formatDateTime(packet.timestamp)}
                </td>
                <td className="px-5 py-3 whitespace-nowrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-white/10 text-cyber-blue border border-cyber-blue/30 uppercase tracking-tighter">
                    {packet.sensorType}
                  </span>
                </td>
                <td className="px-5 py-3 whitespace-nowrap">
                  <span className={`font-black ${packet.rssi > -70 ? 'text-cyber-neon' : 'text-cyber-pink'}`}>
                    {packet.rssi} <span className="text-[8px] opacity-60">dBm</span>
                  </span>
                </td>
                {valueKeys.map(key => (
                  <td key={key} className="px-5 py-3 whitespace-nowrap text-gray-300 tabular-nums">
                    {packet.values[key] !== undefined ? packet.values[key].toFixed(2) : '—'}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3 + valueKeys.length} className="px-6 py-20 text-center text-gray-600 italic font-mono tracking-widest opacity-50">
                  NO_DATA_AWAITING_SIGNAL
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
