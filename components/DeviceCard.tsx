"use client";

import React from 'react';
import Link from 'next/link';
import { MobileGateway } from '@/types/telemetry';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { Cpu, Activity, Clock, ChevronRight, Layers } from 'lucide-react';

interface GatewayCardProps {
  gateway: MobileGateway;
}

export const DeviceCard: React.FC<GatewayCardProps> = ({ gateway }) => {
  const isOnline = gateway.status === 'ONLINE' || gateway.status === 'STREAMING';
  const isStreaming = gateway.status === 'STREAMING';

  return (
    <div className="glass-card p-6 flex flex-col h-full group relative overflow-hidden">
      {/* Visual background flair */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-blue/5 blur-3xl -mr-16 -mt-16 group-hover:bg-cyber-blue/10 transition-all duration-500" />

      <div className="flex justify-between items-start mb-6">
        <div className="p-3 bg-white/5 rounded-xl border border-white/10 group-hover:neon-border-blue transition-all">
          <Cpu className={`w-6 h-6 ${isOnline ? 'neon-text-blue pulsing-glow' : 'text-gray-600'}`} />
        </div>
        <div className={`px-2.5 py-1 rounded text-[10px] font-black tracking-[0.2em] uppercase ${
          isStreaming ? 'bg-cyber-neon/20 text-cyber-neon border border-cyber-neon/50 pulsing-glow' :
          isOnline ? 'bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/50' :
          'bg-gray-800 text-gray-500 border border-gray-700'
        }`}>
          {gateway.status}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-black italic tracking-tighter mb-1 truncate group-hover:text-cyber-blue transition-colors">
          {gateway.name || 'GATEWAY NODE'}
        </h3>
        <code className="text-[10px] text-gray-500 font-mono tracking-tight">
          ID: {gateway.mobileId}
        </code>
      </div>

      <div className="space-y-3 flex-grow">
        <div className="flex items-center text-xs text-gray-400 font-mono">
          <Activity className="w-4 h-4 mr-3 text-cyber-blue/60 shrink-0" />
          <span className="opacity-70">MOBILE:</span>
          <span className="ml-2 text-gray-200">{gateway.mobileId}</span>
        </div>
        <div className="flex items-center text-xs text-gray-400 font-mono">
          <Clock className="w-4 h-4 mr-3 text-cyber-pink/60 shrink-0" />
          <span className="opacity-70">REG:</span>
          <span className="ml-2 text-gray-200">
            {gateway.createdAt ? formatDate(gateway.createdAt) : formatRelativeTime(gateway.lastSeen)}
          </span>
        </div>
      </div>

      <div className="mt-6">
        <Link
          href={`/device/${gateway.mobileId}`}
          className="w-full py-3 px-4 glass bg-white/5 flex items-center justify-center space-x-2 text-[11px] font-black tracking-[0.3em] hover:bg-white/10 hover:neon-border-blue transition-all"
        >
          <span>VIEW SENSORS</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
