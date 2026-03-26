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

  if (loading && !gateway) {
    return (
      <div className="min-h-screen bg-cyber-black flex items-center justify-center font-mono">
        <RefreshCw className="w-8 h-8 text-cyber-blue animate-spin" />
        <span className="ml-4 tracking-[0.5em] text-xs">LOADING_GATEWAY...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyber-black text-white p-4 md:p-8 cyber-grid">
      <div className="max-w-[1600px] mx-auto">

        {/* ─── Navigation & Device Header ──────────────────────────── */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-10">
          <div className="flex items-center space-x-5">
            <button
              onClick={() => router.push('/devices')}
              className="p-3 glass bg-white/5 hover:bg-white/10 border-white/10 group transition-all rounded-xl"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-cyber-blue" />
            </button>
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <CircuitBoard className="w-4 h-4 text-cyber-blue" />
                <span className="text-[10px] font-black tracking-[0.4em] text-gray-500 uppercase">
                  Gateway Console
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase truncate max-w-xl">
                {gateway?.name || 'GATEWAY'}{' '}
                <span className="neon-text-blue font-mono text-xl not-italic">
                  #{mobileId}
                </span>
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status badges */}
            <div className="glass px-5 py-3 flex items-center space-x-5 border-white/5 bg-black/40 rounded-xl">
              <div className="flex items-center space-x-2">
                {isStreaming ? (
                  <Wifi className="w-4 h-4 text-cyber-neon animate-pulse" />
                ) : (
                  <WifiOff className="w-4 h-4 text-gray-600" />
                )}
                <span className={`text-xs font-black italic ${isStreaming ? 'text-cyber-neon' : 'text-gray-500'}`}>
                  {isStreaming ? 'LIVE' : 'IDLE'}
                </span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-[9px] text-gray-500 font-bold tracking-widest uppercase">PACKETS</span>
                <span className="text-xs font-mono text-gray-300">{livePackets.length}</span>
              </div>
              {sensors.length > 0 && (
                <>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-500 font-bold tracking-widest uppercase">SENSORS</span>
                    <span className="text-xs font-mono text-cyber-blue uppercase">
                      {mode === 'LIVE' ? sensors.filter(s => s.status === 'STREAMING').length : sensors.length} active
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
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:neon-border-blue transition-all min-w-[160px] appearance-none cursor-pointer"
              >
                {filteredSensors.map(s => (
                  <option key={s.deviceId} value={s.deviceId} className="bg-cyber-black text-white">
                    {s.sensorType} ({s.deviceId}) {mode === 'LIVE' ? '· LIVE' : (s.status === 'STREAMING' ? '· LIVE' : '· OFFLINE')}
                  </option>
                ))}
              </select>
            ) : (
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                    No {mode === 'LIVE' ? 'live' : ''} sensors
                </div>
            )}

            {/* Command buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => handleCommand('START_LIVE')}
                disabled={isSending}
                className="flex items-center space-x-2 px-5 py-3 bg-cyber-blue text-black font-black italic text-xs tracking-widest hover:brightness-110 active:scale-95 transition-all rounded-xl disabled:opacity-30"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>START</span>
              </button>
              <button
                onClick={() => handleCommand('STOP_LIVE')}
                disabled={isSending}
                className="flex items-center space-x-2 px-5 py-3 bg-cyber-black border-2 border-cyber-pink/50 text-cyber-pink font-black italic text-xs tracking-widest hover:bg-cyber-pink/10 transition-all rounded-xl disabled:opacity-30"
              >
                <Square className="w-4 h-4 fill-cyber-pink" />
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
            <div className="flex items-center space-x-3">
              <button
                onClick={() => { setMode('LIVE'); clearHistory(); }}
                className={`flex items-center space-x-3 px-5 py-3 rounded-xl transition-all font-black text-xs tracking-[0.2em] relative overflow-hidden ${
                  mode === 'LIVE'
                    ? 'glass bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/50'
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>LIVE</span>
                {mode === 'LIVE' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyber-blue" />}
              </button>
              <button
                onClick={() => setMode('HISTORY')}
                className={`flex items-center space-x-3 px-5 py-3 rounded-xl transition-all font-black text-xs tracking-[0.2em] relative overflow-hidden ${
                  mode === 'HISTORY'
                    ? 'glass bg-cyber-pink/20 text-cyber-pink border border-cyber-pink/50'
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                <History className="w-4 h-4" />
                <span>HISTORY</span>
                {mode === 'HISTORY' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyber-pink" />}
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
                <div className="glass p-5 rounded-2xl border-white/5 bg-black/30">
                  <div className="flex items-center space-x-3 mb-4">
                    <Filter className="w-4 h-4 text-cyber-pink" />
                    <span className="text-[10px] font-black tracking-[0.4em] text-gray-400 uppercase">
                      Query Parameters
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 items-end">
                    {/* Sensor selector */}
                    <div className="flex flex-col">
                      <label className="text-[9px] font-black tracking-widest text-gray-500 uppercase mb-2">Sensor Type</label>
                      <select
                        value={selectedSensor}
                        onChange={(e) => setSelectedSensor(e.target.value as SensorType)}
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:neon-border-blue transition-all min-w-[160px] appearance-none cursor-pointer"
                      >
                        {ALL_SENSORS.map(s => (
                          <option key={s} value={s} className="bg-cyber-black text-white">{s}</option>
                        ))}
                      </select>
                    </div>

                    {/* Time range pills */}
                    <div className="flex flex-col">
                      <label className="text-[9px] font-black tracking-widest text-gray-500 uppercase mb-2">Time Range</label>
                      <div className="flex space-x-1">
                        {TIME_RANGES.map(tr => (
                          <button
                            key={tr.value}
                            onClick={() => setSelectedTimeRange(tr.value)}
                            className={`px-3 py-2 rounded-lg text-[10px] font-black tracking-wider transition-all ${
                              selectedTimeRange === tr.value
                                ? 'bg-cyber-pink/20 text-cyber-pink border border-cyber-pink/50'
                                : 'bg-white/5 text-gray-500 border border-white/10 hover:text-white'
                            }`}
                          >
                            {tr.label}
                          </button>
                        ))}
                      </div>
                    </div>
<div className="flex flex-col">
  <label className="text-[9px] font-black tracking-widest text-gray-500 uppercase mb-2">
    Custom Range
  </label>
  <div className="flex space-x-2">
    <input
      type="datetime-local"
      value={customStart}
      onChange={(e) => setCustomStart(e.target.value)}
      className="bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-xs"
    />
    <input
      type="datetime-local"
      value={customEnd}
      onChange={(e) => setCustomEnd(e.target.value)}
      className="bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-xs"
    />
  </div>
</div>
                    {/* Limit */}
                    <div className="flex flex-col">
                      <label className="text-[9px] font-black tracking-widest text-gray-500 uppercase mb-2">Limit</label>
                      <input
                        type="number"
                        value={historyLimit}
                        onChange={(e) => setHistoryLimit(Math.max(1, parseInt(e.target.value) || 100))}
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:neon-border-blue transition-all w-24"
                      />
                    </div>

                    {/* Fetch button */}
                    <button
                      onClick={handleFetchHistory}
                      disabled={historyLoading}
                      className="flex items-center space-x-2 px-6 py-2.5 bg-cyber-pink text-black font-black italic text-xs tracking-widest hover:brightness-110 active:scale-95 transition-all rounded-xl disabled:opacity-30"
                    >
                      {historyLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span>FETCH</span>
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

          {/* ─── Right Sidebar (1 col) ────────────────────────────── */}
          <div className="space-y-6">
            {/* Session Controls */}
            <div className="glass p-5 border-white/5 space-y-4 bg-black/40 rounded-2xl">
              <div className="flex items-center space-x-3">
                <Settings className="w-4 h-4 text-gray-500" />
                <span className="text-[10px] font-black tracking-[0.3em] text-gray-400 uppercase">
                  Session Controls
                </span>
              </div>

              <button
                onClick={() => clearDevice(activeSensorId)}
                className="w-full flex items-center justify-between p-3 glass bg-white/5 hover:bg-cyber-pink/10 hover:border-cyber-pink/30 group transition-all rounded-xl"
              >
                <span className="text-[10px] font-black tracking-widest text-gray-400 group-hover:text-cyber-pink">
                  PURGE_BUFFER
                </span>
                <Trash2 className="w-4 h-4 text-gray-600 group-hover:text-cyber-pink" />
              </button>

              {/* Gateway Info */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                <div className="flex items-center justify-between text-[9px] font-black text-gray-500 tracking-widest uppercase">
                  <span>Gateway Info</span>
                </div>
                <InfoRow label="Mobile ID" value={gateway?.mobileId ?? mobileId} />
                <InfoRow label="Sensors Attached" value={sensors.length.toString()} />
                <InfoRow
                  label="Registered"
                  value={gateway?.createdAt ? new Date(gateway.createdAt).toLocaleDateString() : '—'}
                />
              </div>
            </div>

            {/* Live Bus Activity Feed */}
            <div className="glass p-5 border-white/5 bg-black/40 rounded-2xl">
              <div className="flex items-center space-x-3 mb-4">
                <Layers className="w-4 h-4 text-gray-500" />
                <span className="text-[10px] font-black tracking-[0.3em] text-gray-400 uppercase">
                  Live Feed
                </span>
              </div>
              <div className="max-h-[400px] overflow-y-auto pr-1 space-y-2">
                {livePackets.slice(0, 20).map((p, i) => (
                  <div
                    key={`${p.timestamp}-${i}`}
                    className="flex items-center justify-between p-2.5 glass bg-white/[0.02] border-white/5 rounded-lg text-[10px] font-mono hover:bg-white/[0.05] transition-all"
                  >
                    <span className="text-cyber-blue font-bold">{p.sensorType}</span>
                    <span className="text-gray-600">
                      {formatDateTime(p.timestamp).split(',').pop()?.trim()}
                    </span>
                  </div>
                ))}
                {livePackets.length === 0 && (
                  <div className="text-center py-8 text-[9px] text-gray-700 font-black tracking-widest italic">
                    NO_PACKETS...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between text-xs">
    <span className="text-gray-500">{label}</span>
    <span className="font-mono text-gray-300 truncate max-w-[120px]">{value}</span>
  </div>
);
