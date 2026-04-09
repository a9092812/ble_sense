"use client";

import React from 'react';
import Link from 'next/link';
import { MobileGateway } from '@/types/telemetry';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { useAuth } from '@/components/AuthProvider';
import { Cpu, Activity, Clock, ChevronRight, User } from 'lucide-react';

interface GatewayCardProps {
  gateway: MobileGateway;
}

export const DeviceCard: React.FC<GatewayCardProps> = ({ gateway }) => {
  const { isAnonymous } = useAuth();
  const isOnline = gateway.status === 'ONLINE' || gateway.status === 'STREAMING';
  const isStreaming = gateway.status === 'STREAMING';

  return (
    <div className={`glass-card p-6 flex flex-col h-full group transition-all duration-500 hover:scale-[1.02] border border-white/5 ${isAnonymous ? 'hover:border-amber-500/20' : 'hover:border-mint-accent/20'}`}>
      {/* Subtle Glow on Hover */}
      <div className={`absolute -top-24 -right-24 w-48 h-48 blur-3xl rounded-full transition-all duration-700 opacity-0 group-hover:opacity-10 ${isAnonymous ? 'bg-amber-500' : 'bg-mint-accent'}`} />

      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className={`p-3 glass-inset bg-white/5 border border-white/5 transition-all duration-500 ${isAnonymous ? 'group-hover:border-amber-500/20' : 'group-hover:border-mint-accent/20'}`}>
          {isAnonymous ? (
            <User className={`w-6 h-6 ${isOnline ? 'text-amber-500 neon-text-amber' : 'text-text-disabled'}`} />
          ) : (
            <Cpu className={`w-6 h-6 ${isOnline ? 'text-mint-accent neon-text-mint' : 'text-text-disabled'}`} />
          )}
        </div>
        <div className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border transition-all duration-300 ${
          isStreaming ? (isAnonymous ? 'bg-amber-500/20 text-amber-500 border-amber-500/30 neon-glow-amber' : 'bg-mint-accent/20 text-mint-accent border-mint-accent/30 neon-glow-mint') :
          isOnline ? (isAnonymous ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-mint-accent/10 text-mint-accent border-mint-accent/20') :
          'bg-white/5 text-text-disabled border-white/10'
        }`}>
          {gateway.status}
        </div>
      </div>

      <div className="mb-6 relative z-10">
        <h3 className={`text-xl font-bold tracking-tight mb-1 truncate text-white transition-colors duration-300 ${isAnonymous ? 'group-hover:text-amber-500' : 'group-hover:text-mint-accent'}`}>
          {gateway.name || (isAnonymous ? 'ANONYMOUS NODE' : 'SECURE GATEWAY')}
        </h3>
        <code className="text-[10px] text-text-secondary font-mono tracking-tight opacity-70">
          {isAnonymous ? `ID:${gateway.mobileId.slice(-8)}` : gateway.mobileId}
        </code>
      </div>

      <div className="space-y-3 flex-grow relative z-10">
        <div className="flex items-center text-xs text-text-secondary font-medium">
          <Activity className="w-4 h-4 mr-3 text-mint-accent/60 shrink-0" />
          <span className="opacity-50 uppercase tracking-tighter">Mobile ID</span>
          <span className="ml-auto text-white/90 font-mono text-[10px]">{gateway.mobileId}</span>
        </div>
        <div className="flex items-center text-xs text-text-secondary font-medium">
          <Clock className="w-4 h-4 mr-3 text-mint-accent/60 shrink-0" />
          <span className="opacity-50 uppercase tracking-tighter">Registered</span>
          <span className="ml-auto text-white/90 font-mono text-[10px]">
            {gateway.createdAt ? formatDate(gateway.createdAt) : formatRelativeTime(gateway.lastSeen)}
          </span>
        </div>
      </div>

      <div className="mt-8 relative z-10">
        <Link
          href={`/device/${gateway.mobileId}`}
          className="w-full py-3 px-4 glass-inset bg-white/5 flex items-center justify-center space-x-2 text-[11px] font-bold tracking-[0.2em] uppercase text-text-secondary hover:text-white hover:bg-white/10 hover:border-mint-accent/30 transition-all duration-300"
        >
          <span>OPEN DASHBOARD</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
};
