"use client";

import React, { useState } from 'react';
import { DeviceCard } from '@/components/DeviceCard';
import { useMobiles } from '@/hooks/useDevices';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Search, RotateCcw, Radio, Server, Activity, Clock } from 'lucide-react';

export default function DevicesPage() {
  const { mobiles, loading, error, refetch } = useMobiles();
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
    <div className="min-h-screen cyber-grid bg-cyber-black text-white p-6 md:p-12 selection:bg-cyber-blue selection:text-black">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 space-y-8 md:space-y-0">
          <div>
            <div className="flex items-center space-x-5 mb-4">
              <div className="w-14 h-14 glass bg-cyber-blue/10 flex items-center justify-center neon-border-blue border-2 rounded-2xl rotate-3 shadow-[0_0_30px_rgba(0,242,255,0.2)]">
                <Radio className="w-7 h-7 neon-text-blue pulsing-glow" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-none">
                  Sense <span className="neon-text-blue">TELEMETRY</span>
                </h1>
                <p className="text-gray-500 font-black text-xs tracking-[0.5em] uppercase mt-1">
                  Gateway Control Center
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-[10px] font-mono text-gray-500">
              <span className="w-1.5 h-1.5 bg-cyber-neon rounded-full animate-pulse" />
              <span className="tracking-widest">System Online · {mobiles.length} gateways registered</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-600 group-focus-within:text-cyber-blue transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search by Gateway ID or Name..."
                className="bg-white/[0.03] border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-xs font-mono focus:outline-none focus:neon-border-blue focus:bg-white/[0.07] transition-all w-72"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={refetch}
              title="Refresh gateway registry"
              className="p-3 glass hover:bg-white/10 transition-all border-white/10 hover:neon-border-blue group rounded-xl"
            >
              <RotateCcw className={`w-5 h-5 text-gray-400 group-hover:text-cyber-blue ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-10 p-5 glass bg-cyber-pink/5 border-cyber-pink/30 text-cyber-pink text-[11px] font-black tracking-widest flex items-center rounded-2xl">
            <span className="w-2.5 h-2.5 bg-cyber-pink rounded-full mr-4 shadow-[0_0_10px_#ff00ff] animate-pulse" />
            SYSTEM_ERROR: {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <StatCard label="TOTAL GATEWAYS" icon={<Server className="w-4 h-4" />} value={mobiles.length} color="text-white" />
          <StatCard label="STREAMING SENSORS" icon={<Activity className="w-4 h-4" />} value={mobiles.filter(d => d.status === 'STREAMING').length} color="text-cyber-neon" />
          <StatCard label="GATEWAYS ONLINE" icon={<Radio className="w-4 h-4" />} value={mobiles.filter(d => d.status === 'ONLINE').length} color="text-cyber-blue" />
          <StatCard label="GATEWAYS OFFLINE" icon={<Clock className="w-4 h-4" />} value={mobiles.filter(d => d.status === 'OFFLINE').length} color="text-gray-600" />
        </div>

        {/* Device Grid */}
        {loading && mobiles.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="glass-card h-72 animate-pulse opacity-40 rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMobiles.map(gateway => (
              <DeviceCard key={gateway.mobileId} gateway={gateway} />
            ))}
          </div>
        )}

        {filteredMobiles.length === 0 && !loading && (
          <div className="py-28 text-center glass bg-white/[0.01] border-dashed border-white/10 rounded-[2rem] mt-6">
            <Radio className="w-12 h-12 text-gray-800 mx-auto mb-6 opacity-20" />
            <p className="text-gray-600 font-black uppercase tracking-[0.8em] text-[10px]">
              No gateways found
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const StatCard = ({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) => (
  <div className="glass p-6 border-t-2 border-t-white/10 group hover:neon-border-blue transition-all relative overflow-hidden bg-black/40 rounded-xl">
    <div className="flex items-center space-x-3 mb-2 opacity-50 group-hover:opacity-100 transition-opacity">
      <div className={color}>{icon}</div>
      <div className="text-[10px] font-black tracking-[0.3em] text-gray-400 uppercase">{label}</div>
    </div>
    <div className={`text-3xl font-black italic tracking-tighter ${color} drop-shadow-2xl`}>
      {value > 0 ? value.toString().padStart(2, '0') : '0'}
    </div>
  </div>
);
