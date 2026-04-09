"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTelemetryStore } from '@/store/telemetryStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useHistory } from '@/hooks/useHistory';
import { getMobileMetadata, getMobileSensors, sendCommand } from '@/lib/api';
import { MobileGateway, SensorNode, NormalizedPacket, SensorType } from '@/types/telemetry';
import { SensorCard } from '@/components/SensorCard';
import { TelemetryTable } from '@/components/TelemetryTable';
import { formatDateTime, toRFC3339 } from '@/lib/utils';
import {
  ArrowLeft,
  Play,
  Square,
  History,
  Trash2,
  Settings,
  CircuitBoard,
  Cpu,
  RefreshCw,
  Calendar,
  Clock,
  CheckCircle2,
  Layers,
  Activity,
  Download,
  Filter,
  Wifi,
  WifiOff,
} from 'lucide-react';

// Stable references to prevent React 19 useSyncExternalStore infinite loop
const EMPTY_PACKETS: NormalizedPacket[] = [];
const selectClearDevice = (state: ReturnType<typeof useTelemetryStore.getState>) => state.clearDevice;

const ALL_SENSORS: SensorType[] = [
  'SHT40', 'LuxSensor', 'LIS2DH', 'SoilSensor',
  'SpeedDistance', 'AmmoniaSensor', 'TempLogger', 'DataLogger',
];

const TIME_RANGES = [
  { label: '1H', value: '1h' },
  { label: '6H', value: '6h' },
  { label: '24H', value: '24h' },
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: 'ALL', value: '' },
];

export default function DeviceDashboard() {
  const { deviceId: mobileId } = useParams() as { deviceId: string };
  const router = useRouter();

  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [gateway, setGateway] = useState<MobileGateway | null>(null);
  const [sensors, setSensors] = useState<SensorNode[]>([]);
  const [activeSensorId, setActiveSensorId] = useState<string>('');
  const [mode, setMode] = useState<'LIVE' | 'HISTORY'>('HISTORY');
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [liveCommandState, setLiveCommandState] = useState<'idle' | 'streaming'>('idle');

  // History controls
  const [selectedSensor, setSelectedSensor] = useState<SensorType>('SHT40');
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [historyLimit, setHistoryLimit] = useState(10000);
  const [playbackData, setPlaybackData] = useState<NormalizedPacket[]>([]);

  // Live store - Use stable selectors to avoid useSyncExternalStore infinite loop (React 19)
  const selectPackets = useCallback(
    // We fetch packets specifically for the mobileId. Actually, `useTelemetryStore` packets might be indexed by sensor deviceId.
    // So we'll get all packets for the activeSensorId.
    (state: ReturnType<typeof useTelemetryStore.getState>) => state.devicePackets[activeSensorId] || EMPTY_PACKETS,
    [activeSensorId]
  );
  const livePackets = useTelemetryStore(selectPackets);
  const clearDevice = useTelemetryStore(selectClearDevice);

  // WebSocket connection
  useWebSocket();

  // History hook
  const { history, loading: historyLoading, error: historyError, fetchHistory, clearHistory } = useHistory(activeSensorId || mobileId);

  useEffect(() => {
    async function loadDevice() {
      try {
        const data = await getMobileMetadata(mobileId);
        if (data) setGateway(data);
        
        const gatewaySensors = await getMobileSensors(mobileId);
        setSensors(gatewaySensors);

        if (gatewaySensors.length > 0) {
          const defaultSensor = gatewaySensors[0];
          setActiveSensorId(defaultSensor.deviceId);
          if (defaultSensor.sensorType && ALL_SENSORS.includes(defaultSensor.sensorType as SensorType)) {
            setSelectedSensor(defaultSensor.sensorType as SensorType);
          }
        }
      } catch (err) {
        console.error('Failed to load gateway meta', err);
      } finally {
        setLoading(false);
      }
    }
    loadDevice();
  }, [mobileId]);


useEffect(() => {
  if (mode !== 'HISTORY' || history.length === 0) return;

  let i = history.length - 1;

  const interval = setInterval(() => {
    setPlaybackData((prev) => {
      if (i < 0) return prev;
      const next = [history[i], ...prev];
      i--;
      return next;
    });
  }, 200); // speed control

  return () => clearInterval(interval);
}, [history, mode]);
  const isStreaming = livePackets.length > 0 && (Date.now() - livePackets[0].timestamp < 10000);

  // Group live packets by sensor type
  const typesOnBus = useMemo(() => {
    const groups: Record<string, NormalizedPacket[]> = {};
    livePackets.forEach(p => {
      if (!groups[p.sensorType]) groups[p.sensorType] = [];
      groups[p.sensorType].push(p);
    });
    return groups;
  }, [livePackets]);

  // Filter sensors based on mode: Live only shows active sensors, History shows all.
  const filteredSensors = useMemo(() => {
    if (mode === 'LIVE') {
      return sensors.filter(s => s.status === 'STREAMING');
    }
    return sensors;
  }, [sensors, mode]);

  // Ensure activeSensorId is set correctly if mode changes
  useEffect(() => {
    if (filteredSensors.length > 0) {
      const currentExists = filteredSensors.some(s => s.deviceId === activeSensorId);
      if (!currentExists) {
        setActiveSensorId(filteredSensors[0].deviceId);
        const s = filteredSensors[0];
        if (s.sensorType && ALL_SENSORS.includes(s.sensorType as SensorType)) {
          setSelectedSensor(s.sensorType as SensorType);
        }
      }
    } else if (mode === 'LIVE') {
        setActiveSensorId('');
    }
  }, [mode, filteredSensors, activeSensorId]);

  const handleCommand = async (type: 'START_LIVE' | 'STOP_LIVE') => {
    if (!activeSensorId) return;
    setIsSending(true);
    try {
      const ok = await sendCommand({ mobileId, deviceId: activeSensorId, type });
      if (ok) {
        setLiveCommandState(type === 'START_LIVE' ? 'streaming' : 'idle');
      }
      setTimeout(() => setIsSending(false), 500);
    } catch {
      setIsSending(false);
    }
  };

const handleFetchHistory = () => {
  const params: { start_time?: string; end_time?: string; limit?: number } = {
    limit: historyLimit,
  };

  if (customStart && customEnd) {
    params.start_time = new Date(customStart).toISOString();
    params.end_time = new Date(customEnd).toISOString();
  } else if (selectedTimeRange) {
    params.start_time = toRFC3339(selectedTimeRange);
  }

  fetchHistory(selectedSensor, params);
};

  // Auto-switch to history mode when fetching
  useEffect(() => {
    if (history.length > 0) setMode('HISTORY');
  }, [history]);

  return (
    <div className="min-h-screen p-4 md:p-8 relative overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-mint-accent/5 blur-[150px] rounded-full -mr-80 -mt-80 pointer-events-none" />
      
      {loading && !gateway ? (
        <div className="min-h-screen flex items-center justify-center font-bold">
          <RefreshCw className="w-8 h-8 text-mint-accent animate-spin" />
          <span className="ml-4 tracking-[0.3em] text-xs uppercase text-text-secondary">SYSTEM_BOOT...</span>
        </div>
      ) : (
        <div className="max-w-[1600px] mx-auto relative z-10">

        {/* Navigation & Device Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-12">
          <div className="flex items-center space-x-6">
            <button
              onClick={() => router.push('/devices')}
              className="p-3 glass-card bg-white/5 hover:bg-white/10 group transition-all rounded-2xl"
            >
              <ArrowLeft className="w-5 h-5 text-mint-accent group-hover:scale-110 transition-transform" />
            </button>
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <CircuitBoard className="w-4 h-4 text-mint-accent/70" />
                <span className="text-[10px] font-bold tracking-[0.4em] text-text-secondary uppercase opacity-70">
                  NODE CONSOLE
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight uppercase truncate max-w-xl text-white">
                {gateway?.name || 'GATEWAY'}{' '}
                <span className="text-mint-accent font-mono text-xl ml-2">
                  #{mobileId.slice(-6)}
                </span>
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Status badges */}
            <div className="glass-card px-6 py-4 flex items-center space-x-6 bg-white/5 rounded-2xl">
              <div className="flex items-center space-x-3">
                {isStreaming ? (
                  <Wifi className="w-5 h-5 text-mint-accent neon-text-mint animate-pulse" />
                ) : (
                  <WifiOff className="w-5 h-5 text-text-disabled" />
                )}
                <span className={`text-xs font-bold tracking-widest ${isStreaming ? 'text-mint-accent' : 'text-text-disabled'}`}>
                  {isStreaming ? 'STREAMING' : 'READY'}
                </span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-[9px] text-text-secondary font-bold tracking-widest uppercase mb-1">BUFFER</span>
                <span className="text-xs font-mono text-white">{livePackets.length} <span className="opacity-40">PKTS</span></span>
              </div>
              {sensors.length > 0 && (
                <>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="flex flex-col">
                    <span className="text-[9px] text-text-secondary font-bold tracking-widest uppercase mb-1">NODES</span>
                    <span className="text-xs font-mono text-mint-accent">
                      {mode === 'LIVE' ? sensors.filter(s => s.status === 'STREAMING').length : sensors.length} ON BUS
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Sensor Selection */}
            {filteredSensors.length > 0 ? (
              <select
                value={activeSensorId}
                onChange={(e) => {
                  setActiveSensorId(e.target.value);
                  const s = sensors.find(s => s.deviceId === e.target.value);
                  if (s && s.sensorType && ALL_SENSORS.includes(s.sensorType as SensorType)) {
                    setSelectedSensor(s.sensorType as SensorType);
                  }
                }}
                className="glass-inset bg-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none transition-all min-w-[200px] appearance-none cursor-pointer border-none"
              >
                {filteredSensors.map(s => (
                  <option key={s.deviceId} value={s.deviceId} className="bg-charcoal-dark text-white">
                    {s.sensorType} · {s.deviceId.slice(-6)}
                  </option>
                ))}
              </select>
            ) : (
                <div className="glass-inset bg-white/5 rounded-xl px-4 py-3 text-[10px] font-bold text-text-disabled uppercase tracking-widest">
                    Bus Scan in progress...
                </div>
            )}

            {/* Command buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => handleCommand('START_LIVE')}
                disabled={isSending}
                className="flex items-center space-x-3 px-6 py-3 bg-mint-accent text-charcoal-dark font-bold text-xs tracking-widest uppercase hover:brightness-110 active:scale-95 transition-all rounded-xl disabled:opacity-30 shadow-lg shadow-mint-accent/20"
              >
                <Play className="w-4 h-4 fill-charcoal-dark" />
                <span>START</span>
              </button>
              <button
                onClick={() => handleCommand('STOP_LIVE')}
                disabled={isSending}
                className="flex items-center space-x-3 px-6 py-3 glass-card bg-white/5 text-white/70 font-bold text-xs tracking-widest uppercase hover:bg-red-500/10 hover:text-red-500 transition-all rounded-xl disabled:opacity-30"
              >
                <Square className="w-4 h-4" />
                <span>STOP</span>
              </button>
            </div>
          </div>
        </div>

        {/* ─── Main Content Grid ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Left: Main content area (3 cols) */}
          <div className="lg:col-span-3 space-y-6">

            {/* Mode Tabs */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => { setMode('LIVE'); clearHistory(); }}
                className={`flex items-center space-x-3 px-6 py-4 rounded-2xl transition-all font-bold text-xs tracking-[0.2em] relative overflow-hidden ${
                  mode === 'LIVE'
                    ? 'glass-card bg-mint-accent/10 text-mint-accent shadow-lg shadow-mint-accent/5'
                    : 'text-text-disabled hover:text-white'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>REALTIME TELEMETRY</span>
                {mode === 'LIVE' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-mint-accent" />}
              </button>
              <button
                onClick={() => setMode('HISTORY')}
                className={`flex items-center space-x-3 px-6 py-4 rounded-2xl transition-all font-bold text-xs tracking-[0.2em] relative overflow-hidden ${
                  mode === 'HISTORY'
                    ? 'glass-card bg-white/10 text-white shadow-lg'
                    : 'text-text-disabled hover:text-white'
                }`}
              >
                <History className="w-4 h-4" />
                <span>HISTORICAL ANALYSIS</span>
                {mode === 'HISTORY' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-white" />}
              </button>
            </div>

            {/* ─── LIVE MODE ──────────────────────────────────────── */}
            {mode === 'LIVE' && (
              <div className="space-y-6">
                {Object.keys(typesOnBus).length > 0 ? (
                  Object.entries(typesOnBus).map(([type, pkts]) => (
                    <SensorCard key={type} packets={pkts} sensorType={type as SensorType} />
                  ))
                ) : (
                  <div className="glass-card py-32 flex flex-col items-center justify-center border-dashed border-white/10">
                    <Cpu className="w-12 h-12 text-gray-800 mb-6 animate-pulse" />
                    <p className="text-gray-600 font-black uppercase tracking-[0.6em] text-[10px]">
                      Waiting for Telemetry on Gateway #{mobileId}
                    </p>
                    <p className="text-gray-700 text-[9px] mt-3 font-mono">
                      Click START to begin live streaming from selected sensor
                    </p>
                  </div>
                )}

                {/* Raw packet table for live */}
                {livePackets.length > 0 && (
                  <TelemetryTable packets={livePackets} maxRows={30} />
                )}
              </div>
            )}

            {/* ─── HISTORY MODE ───────────────────────────────────── */}
            {mode === 'HISTORY' && (
              <div className="space-y-6">
                {/* Filters bar */}
                <div className="glass-card p-6 rounded-2xl bg-white/5 shadow-inner">
                  <div className="flex items-center space-x-3 mb-6">
                    <Filter className="w-4 h-4 text-white" />
                    <span className="text-[10px] font-bold tracking-[0.4em] text-text-secondary uppercase opacity-70">
                      QUERY PARAMETERS
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-5 items-end">
                    {/* Sensor selector */}
                    <div className="flex flex-col">
                      <label className="text-[9px] font-bold tracking-widest text-text-secondary uppercase mb-2 opacity-50">Sensor Type</label>
                      <select
                        value={selectedSensor}
                        onChange={(e) => setSelectedSensor(e.target.value as SensorType)}
                        className="glass-inset bg-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none transition-all min-w-[180px] appearance-none cursor-pointer border-none"
                      >
                        {ALL_SENSORS.map(s => (
                          <option key={s} value={s} className="bg-charcoal-dark text-white">{s}</option>
                        ))}
                      </select>
                    </div>

                    {/* Time range pills */}
                    <div className="flex flex-col">
                      <label className="text-[9px] font-bold tracking-widest text-text-secondary uppercase mb-2 opacity-50">Time Range</label>
                      <div className="flex space-x-1">
                        {TIME_RANGES.map(tr => (
                          <button
                            key={tr.value}
                            onClick={() => setSelectedTimeRange(tr.value)}
                            className={`px-3 py-2 rounded-lg text-[10px] font-bold tracking-wider transition-all ${
                              selectedTimeRange === tr.value
                                ? 'glass-card bg-mint-accent/20 text-mint-accent border-mint-accent/20'
                                : 'bg-white/5 text-text-disabled hover:text-white'
                            }`}
                          >
                            {tr.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[9px] font-bold tracking-widest text-text-secondary uppercase mb-2 flex items-center opacity-50">
                        <Calendar className="w-3 h-3 mr-2" /> Custom Range
                      </label>
                      <div className="flex items-center space-x-2 glass-inset bg-white/5 rounded-xl p-1.5 transition-all">
                        <div className="relative flex items-center group">
                          <Calendar className="absolute left-3 w-3 h-3 text-text-disabled pointer-events-none" />
                          <input
                            type="datetime-local"
                            value={customStart}
                            onChange={(e) => setCustomStart(e.target.value)}
                            className="bg-transparent border-none pl-8 pr-2 py-1 text-[10px] font-bold text-white focus:outline-none w-[160px] cursor-pointer"
                          />
                        </div>
                        <div className="text-text-disabled text-[10px]">➔</div>
                        <div className="relative flex items-center group">
                          <Clock className="absolute left-3 w-3 h-3 text-text-disabled pointer-events-none" />
                          <input
                            type="datetime-local"
                            value={customEnd}
                            onChange={(e) => setCustomEnd(e.target.value)}
                            className="bg-transparent border-none pl-8 pr-2 py-1 text-[10px] font-bold text-white focus:outline-none w-[160px] cursor-pointer"
                          />
                        </div>
                        <button 
                          onClick={handleFetchHistory}
                          className="p-2 hover:bg-mint-accent/20 rounded-lg group transition-all"
                          title="Apply Custom Range"
                        >
                          <CheckCircle2 className="w-4 h-4 text-mint-accent group-hover:scale-110 transition-transform" />
                        </button>
                      </div>
                    </div>
                    {/* Limit */}
                    <div className="flex flex-col">
                      <label className="text-[9px] font-bold tracking-widest text-text-secondary uppercase mb-2 opacity-50">Limit</label>
                      <input
                        type="number"
                        value={historyLimit}
                        onChange={(e) => setHistoryLimit(Math.max(1, parseInt(e.target.value) || 100))}
                        className="glass-inset bg-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none transition-all w-24 border-none"
                      />
                    </div>

                    {/* Fetch button */}
                    <button
                      onClick={handleFetchHistory}
                      disabled={historyLoading}
                      className="flex items-center space-x-3 px-8 py-2.5 bg-mint-accent text-charcoal-dark font-bold text-xs tracking-widest uppercase hover:brightness-110 active:scale-95 transition-all rounded-xl disabled:opacity-30"
                    >
                      {historyLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span>QUERY</span>
                    </button>
                  </div>
                </div>

                {/* History results */}
                {historyError && (
                  <div className="p-4 glass bg-cyber-pink/5 border-cyber-pink/30 text-cyber-pink text-[11px] font-black tracking-widest rounded-xl">
                    ERROR: {historyError}
                  </div>
                )}

                {history.length > 0 ? (
                  <>
                    <SensorCard packets={playbackData} sensorType={selectedSensor} showHeader={true} />
                    <TelemetryTable packets={playbackData} />
                  </>
                ) : (
                  !historyLoading && (
                    <div className="glass-card py-28 flex flex-col items-center justify-center border-dashed border-white/10">
                      <Calendar className="w-12 h-12 text-gray-800 mb-6" />
                      <p className="text-gray-600 font-black uppercase tracking-[0.6em] text-[10px]">
                        Select a sensor and time range, then click FETCH
                      </p>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar (1 col) */}
          <div className="space-y-6">
            {/* Session Controls */}
            <div className="glass-card p-6 space-y-6 bg-white/5">
              <div className="flex items-center space-x-3">
                <Settings className="w-5 h-5 text-mint-accent/50" />
                <span className="text-[10px] font-bold tracking-[0.3em] text-text-secondary uppercase opacity-70">
                  SESSION CONTROL
                </span>
              </div>

              <button
                onClick={() => clearDevice(activeSensorId)}
                className="w-full flex items-center justify-between p-4 glass-inset bg-white/5 hover:bg-white/10 group transition-all rounded-xl"
              >
                <span className="text-[10px] font-bold tracking-widest text-text-secondary group-hover:text-white uppercase transition-colors">
                  Purge Buffer
                </span>
                <Trash2 className="w-4 h-4 text-text-disabled group-hover:text-red-500 transition-colors" />
              </button>

              {/* Gateway Info */}
              <div className="p-4 rounded-xl bg-white/[0.03] space-y-4 shadow-inner">
                <div className="flex items-center justify-between text-[9px] font-bold text-text-secondary tracking-widest uppercase opacity-50">
                  <span>SYSTEM METRICS</span>
                </div>
                <InfoRow label="Access ID" value={gateway?.mobileId ?? mobileId} />
                <InfoRow label="Active Nodes" value={sensors.length.toString()} />
                <InfoRow
                  label="Registered"
                  value={gateway?.createdAt ? new Date(gateway.createdAt).toLocaleDateString() : 'N/A'}
                />
              </div>
            </div>

            {/* Live Bus Activity Feed */}
            <div className="glass-card p-6 bg-white/5 max-h-[500px] flex flex-col">
              <div className="flex items-center space-x-3 mb-6">
                <Layers className="w-5 h-5 text-mint-accent/50" />
                <span className="text-[10px] font-bold tracking-[0.3em] text-text-secondary uppercase opacity-70">
                  LIVE ACTIVITY
                </span>
              </div>
              <div className="overflow-y-auto pr-1 space-y-3 flex-grow">
                {livePackets.slice(0, 30).map((p, i) => (
                  <div
                    key={`${p.timestamp}-${i}`}
                    className="flex items-center justify-between p-3 glass-inset bg-white/[0.02] rounded-xl text-[10px] font-bold hover:bg-white/[0.05] transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-mint-accent shadow-sm" />
                      <span className="text-white uppercase tracking-tighter">{p.sensorType}</span>
                    </div>
                    <span className="text-text-disabled font-mono text-[9px]">
                      {formatDateTime(p.timestamp).split(',').pop()?.trim()}
                    </span>
                  </div>
                ))}
                {livePackets.length === 0 && (
                  <div className="text-center py-12 flex flex-col items-center">
                    <Activity className="w-10 h-10 text-text-disabled opacity-10 mb-4" />
                    <p className="text-[9px] text-text-disabled font-bold tracking-widest uppercase opacity-40">
                      NO_ACTIVITY_DETECTED
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between text-[11px] font-medium">
    <span className="text-text-secondary opacity-60 uppercase tracking-tighter">{label}</span>
    <span className="font-mono text-white/90 truncate max-w-[120px]">{value}</span>
  </div>
);
