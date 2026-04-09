"use client";

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { 
  UserCircle, 
  Mail, 
  ShieldCheck, 
  Key, 
  Calendar, 
  LogOut, 
  ArrowLeft,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

export default function AccountPage() {
  const { user, isAnonymous, email, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen p-6 md:p-12 relative overflow-hidden flex flex-col items-center justify-center">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-mint-accent/5 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-red-500/5 blur-[100px] rounded-full -ml-32 -mb-32 pointer-events-none" />
      
      <div className="max-w-2xl w-full relative z-10">
        {/* Navigation Back */}
        <Link 
          href="/devices" 
          className="inline-flex items-center space-x-2 text-text-secondary hover:text-white transition-colors mb-8 group"
        >
          <div className="p-2 glass-card rounded-xl group-hover:bg-white/5">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold tracking-[0.2em] uppercase">Return to Terminal</span>
        </Link>

        {/* Profile Header */}
        <div className="glass-card p-10 mb-8 border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <UserCircle className="w-32 h-32" />
          </div>
          
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8 relative z-10">
            <div className={`w-24 h-24 glass-card flex items-center justify-center border-2 ${isAnonymous ? 'border-amber-500/20' : 'border-mint-accent/20'} shadow-2xl pulsing-glow`}>
              {isAnonymous ? (
                <UserCircle className="w-12 h-12 text-amber-500 neon-text-amber" />
              ) : (
                <ShieldCheck className="w-12 h-12 text-mint-accent neon-text-mint" />
              )}
            </div>
            
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold tracking-tight text-white mb-2 uppercase">
                {isAnonymous ? 'Guest User' : (email?.split('@')[0] || 'Authenticated User')}
              </h1>
              <div className="flex items-center justify-center md:justify-start space-x-3">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${isAnonymous ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-mint-accent/10 text-mint-accent border border-mint-accent/20'}`}>
                  {isAnonymous ? 'Public Access' : 'Secure Level 1'}
                </span>
                <span className="text-text-disabled text-[10px] font-bold tracking-[0.2em] uppercase">
                  v2.0.4-stable
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Account Details Grid */}
        <div className="grid grid-cols-1 gap-4 mb-8">
          <DetailItem 
            icon={<Mail className="w-4 h-4" />} 
            label="Verified Identity" 
            value={email || 'Anonymous Session'} 
          />
          <DetailItem 
            icon={<Key className="w-4 h-4" />} 
            label="System Identification" 
            value={user.uid} 
            isSensitive
          />
          <DetailItem 
            icon={<Calendar className="w-4 h-4" />} 
            label="Terminal Initialized" 
            value={user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleString() : 'N/A'} 
          />
          <DetailItem 
            icon={<ShieldAlert className="w-4 h-4" />} 
            label="Last Secure Access" 
            value={user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : 'N/A'} 
          />
        </div>

        {/* Actions */}
        <button
          onClick={logout}
          className="w-full glass-card p-6 border-red-500/20 hover:bg-red-500/10 transition-all group flex items-center justify-between"
        >
          <div className="flex items-center space-x-4">
            <div className="p-2 glass-inset bg-red-500/10 text-red-500 group-hover:scale-110 transition-transform">
              <LogOut className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold tracking-widest text-white uppercase">Terminate Session</div>
              <div className="text-[10px] font-medium text-red-500/60 uppercase tracking-tighter">Sign out of all secure gateways</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-red-500/50 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}

const DetailItem = ({ icon, label, value, isSensitive = false }: { icon: React.ReactNode; label: string; value: string; isSensitive?: boolean }) => {
  const [show, setShow] = React.useState(!isSensitive);
  
  return (
    <div className="glass-inset bg-white/5 p-5 flex items-center justify-between group hover:bg-white/[0.08] transition-all">
      <div className="flex items-center space-x-4">
        <div className="p-2 text-mint-accent opacity-70 group-hover:opacity-100 transition-opacity">
          {icon}
        </div>
        <div>
          <div className="text-[10px] font-bold tracking-[0.2em] text-text-disabled uppercase mb-1">{label}</div>
          <div className={`text-sm font-medium ${isSensitive && !show ? 'blur-sm select-none' : ''} transition-all duration-300`}>
            {value}
          </div>
        </div>
      </div>
      {isSensitive && (
        <button 
          onClick={() => setShow(!show)}
          className="text-[10px] font-black tracking-widest text-mint-accent/40 hover:text-mint-accent transition-colors uppercase px-2 py-1"
        >
          {show ? 'Hide' : 'Show'}
        </button>
      )}
    </div>
  );
};
