"use client";

import React, { useState } from 'react';
import { DeviceCard } from '@/components/DeviceCard';
import { useMobiles } from '@/hooks/useDevices';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import { Search, RotateCcw, Radio, Server, Activity, Clock, AlertTriangle, ShieldCheck, UserCircle } from 'lucide-react';

export default function DevicesPage() {
  const { mobiles, loading, error, refetch } = useMobiles();
  const { isAnonymous, email } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Connect to global WS so discovery works on the listing page
  useWebSocket();

  const filteredMobiles = mobiles.filter((m) =>
    (m.mobileId ?? '')
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
    (m.name ?? '')
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen p-6 md:p-12 relative overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-mint-accent/5 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 space-y-8 md:space-y-0">
          <div className="flex items-center space-x-6">
            <div className={`w-16 h-16 glass-card flex items-center justify-center border-mint-accent/20 shadow-lg ${isAnonymous ? 'border-amber-500/20' : 'border-mint-accent/20'}`}>
              {isAnonymous ? (
                <UserCircle className="w-8 h-8 text-amber-500 neon-text-amber animate-pulse" />
              ) : (
                <ShieldCheck className="w-8 h-8 text-mint-accent neon-text-mint animate-pulse" />
              )}
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white uppercase leading-none">
                SENSE <span className={isAnonymous ? 'text-amber-500' : 'text-mint-accent'}>{isAnonymous ? 'GUEST' : 'SECURE'}</span>
              </h1>
              <div className="flex items-center space-x-2 mt-2">
                <span className={`w-2 h-2 rounded-full ${isAnonymous ? 'bg-amber-500 neon-glow-amber' : 'bg-mint-accent neon-glow-mint'}`} />
                <p className="text-text-secondary font-bold text-[10px] tracking-[0.4em] uppercase opacity-70">
                  {isAnonymous ? 'PUBLIC_REPOSITORY' : `USER_REPOSITORY: ${email?.split('@')[0]}`} / {mobiles.length} NODES
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-text-disabled group-focus-within:text-mint-accent transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Find gateway..."
                className="glass-inset bg-white/5 py-3 pl-12 pr-6 text-sm font-medium focus:outline-none focus:bg-white/[0.08] transition-all w-64 md:w-80 text-white placeholder:text-text-disabled"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={refetch}
              className="p-3 glass-card hover:bg-white/10 transition-all border-white/10 group rounded-2xl"
              title="Refresh Data"
            >
              <RotateCcw className={`w-5 h-5 text-mint-accent/70 group-hover:text-mint-accent ${loading ? 'animate-spin' : ''} transition-colors`} />
            </button>
            <Link
              href="/account"
              className="p-3 glass-card hover:bg-mint-accent/10 transition-all border-white/10 group rounded-2xl"
              title="System Profile"
            >
              <UserCircle className="w-5 h-5 text-mint-accent/70 group-hover:text-mint-accent transition-colors" />
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-10 p-5 glass-card bg-red-500/5 border-red-500/20 text-red-500 text-xs font-bold tracking-widest flex items-center rounded-2xl">
            <AlertTriangle className="w-5 h-5 mr-4 animate-bounce" />
            SYSTEM_ERROR: {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <StatCard label="TOTAL NODES" icon={<Server className="w-4 h-4" />} value={mobiles.length} color="text-white" />
          <StatCard label="STREAMING" icon={<Activity className="w-4 h-4" />} value={mobiles.filter(d => d.status === 'STREAMING').length} color="text-mint-accent" />
          <StatCard label="ONLINE" icon={<Radio className="w-4 h-4" />} value={mobiles.filter(d => d.status === 'ONLINE').length} color="text-mint-glow" />
          <StatCard label="OFFLINE" icon={<Clock className="w-4 h-4" />} value={mobiles.filter(d => d.status === 'OFFLINE').length} color="text-text-disabled" />
        </div>

        {/* Device Grid */}
        {loading && mobiles.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card h-80 animate-pulse bg-white/5 rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredMobiles.map(gateway => (
              <DeviceCard key={gateway.mobileId} gateway={gateway} />
            ))}
          </div>
        )}

        {filteredMobiles.length === 0 && !loading && (
          <div className="py-32 text-center glass-inset bg-white/[0.01] rounded-[2.5rem] mt-8">
            <Server className="w-16 h-16 text-text-disabled mx-auto mb-6 opacity-20" />
            <p className="text-text-secondary font-bold uppercase tracking-[0.6em] text-[10px]">
              No gateways detected in system
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const StatCard = ({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) => (
  <div className="glass-card p-6 border-white/5 group transition-all duration-300 relative overflow-hidden bg-white/5 hover:bg-white/[0.08]">
    <div className="flex items-center space-x-4 mb-4 relative z-10">
      <div className={`p-2 glass-inset bg-white/5 ${color} shadow-sm group-hover:scale-110 transition-transform duration-500`}>
        {icon}
      </div>
      <div className="text-[10px] font-bold tracking-[0.3em] text-text-secondary uppercase opacity-70">{label}</div>
    </div>
    <div className={`text-4xl font-bold tracking-tight ${color} relative z-10 drop-shadow-lg tabular-nums`}>
      {value > 0 ? value.toString().padStart(2, '0') : '00'}
    </div>
    
    {/* Subtle Background Glow */}
    <div className={`absolute -bottom-8 -right-8 w-24 h-24 blur-[40px] opacity-10 group-hover:opacity-20 transition-opacity duration-500 bg-current ${color}`} />
  </div>
);
