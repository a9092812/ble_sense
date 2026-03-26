"use client";

import React from 'react';
import { NormalizedPacket, SensorType } from '@/types/telemetry';
import { LiveChart } from './LiveChart';
import { SENSOR_FIELDS } from '@/lib/api';
import {
  Thermometer,
  Droplets,
  Sun,
  Move,
  Sprout,
  Zap,
  Wind,
  Database,
  AlertTriangle,
  Radio,
} from 'lucide-react';

interface SensorCardProps {
  packets: NormalizedPacket[];
  sensorType: SensorType;
  showHeader?: boolean;
}

export const SensorCard: React.FC<SensorCardProps> = ({ packets, sensorType, showHeader = true }) => {
  if (packets.length === 0) return null;

  const latest = packets[0];
  const v = latest.values;
  const fields = SENSOR_FIELDS[sensorType];

  const renderSHT40 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <DataPoint icon={<Thermometer className="text-cyber-blue" />} label="TEMPERATURE" value={`${v.temperature?.toFixed(1) ?? '0'}°C`} />
        <DataPoint icon={<Droplets className="text-cyber-pink" />} label="HUMIDITY" value={`${v.humidity?.toFixed(1) ?? '0'}%`} />
      </div>
      <LiveChart packets={packets} keys={['temperature', 'humidity']} colors={fields.colors} title="ENV_METRICS" variant="area" />
    </div>
  );

  const renderLux = () => (
    <div className="space-y-6">
      <DataPoint icon={<Sun className="text-yellow-400" />} label="LUMINOSITY" value={`${v.lux?.toFixed(0) ?? '0'} LUX`} />
      <LiveChart packets={packets} keys={['lux']} colors={fields.colors} title="Light Intensity" unit=" LX" variant="area" />
    </div>
  );

  const renderLIS2DH = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <AxisBox label="X" value={v.x?.toFixed(3) ?? '0'} color="border-cyber-blue text-cyber-blue" />
        <AxisBox label="Y" value={v.y?.toFixed(3) ?? '0'} color="border-cyber-pink text-cyber-pink" />
        <AxisBox label="Z" value={v.z?.toFixed(3) ?? '0'} color="border-cyber-neon text-cyber-neon" />
      </div>
      <LiveChart packets={packets} keys={['x', 'y', 'z']} colors={fields.colors} title="3-Axis Accelerometer" unit=" G" />
    </div>
  );

  const renderSoil = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-2">
        <NutrientBox label="N" value={`${v.nitrogen?.toFixed(0) ?? '0'}`} />
        <NutrientBox label="P" value={`${v.phosphorus?.toFixed(0) ?? '0'}`} />
        <NutrientBox label="K" value={`${v.potassium?.toFixed(0) ?? '0'}`} />
        <NutrientBox label="pH" value={`${v.pH?.toFixed(1) ?? '7.0'}`} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <DataPoint icon={<Sprout className="text-green-500" />} label="MOISTURE" value={`${v.moisture?.toFixed(1)}%`} />
        <DataPoint icon={<Thermometer className="text-cyber-blue" />} label="SOIL_TEMP" value={`${v.temperature?.toFixed(1)}°C`} />
      </div>
      <LiveChart packets={packets} keys={['moisture', 'temperature']} colors={['#39ff14', '#00f2ff']} title="Soil Metrics" variant="area" />
    </div>
  );

  const renderSpeed = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <DataPoint icon={<Zap className="text-cyber-blue" />} label="VELOCITY" value={`${v.speed?.toFixed(1)} km/h`} />
        <DataPoint icon={<Move className="text-cyber-pink" />} label="DISTANCE" value={`${v.distance?.toFixed(2)} m`} />
      </div>
      <LiveChart packets={packets} keys={['speed', 'distance']} colors={fields.colors} title="Speed Profile" />
    </div>
  );

  const renderAmmonia = () => (
    <div className="space-y-6">
      <DataPoint icon={<Wind className="text-cyber-neon" />} label="AMMONIA_NH3" value={`${v.ammonia?.toFixed(1)} ppm`} />
      <LiveChart packets={packets} keys={['ammonia']} colors={fields.colors} title="Gas Concentration" unit=" ppm" variant="area" />
    </div>
  );

  const renderTempLogger = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <DataPoint icon={<Thermometer className="text-cyber-blue" />} label="LOG_TEMP" value={`${v.temperature?.toFixed(1)}°C`} />
        <DataPoint icon={<Droplets className="text-cyber-pink" />} label="LOG_HUM" value={`${v.humidity?.toFixed(1)}%`} />
      </div>
      <LiveChart packets={packets} keys={['temperature', 'humidity']} colors={fields.colors} title="Temp Logger" variant="area" />
    </div>
  );

  const renderDataLogger = () => {
    const currentId = v.currentPacketId ?? 0;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 glass bg-cyber-blue/5 border-cyber-blue/20">
          <div className="flex items-center space-x-4">
            <Database className="w-5 h-5 text-cyber-blue" />
            <div>
              <div className="text-[10px] text-gray-500 font-mono">CURRENT_SEQUENCE</div>
              <div className="text-lg font-black italic">PID_{currentId.toFixed(0)}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (sensorType) {
      case 'SHT40': return renderSHT40();
      case 'LuxSensor': return renderLux();
      case 'LIS2DH': return renderLIS2DH();
      case 'SoilSensor': return renderSoil();
      case 'SpeedDistance': return renderSpeed();
      case 'AmmoniaSensor': return renderAmmonia();
      case 'TempLogger': return renderTempLogger();
      case 'DataLogger': return renderDataLogger();
      default: return (
        <div className="p-10 text-center border border-dashed border-white/10 opacity-30 italic">
          UNSUPPORTED_TYPE: {sensorType}
        </div>
      );
    }
  };

  return (
    <div className="glass-card p-8 border-l-4 border-l-cyber-blue relative overflow-hidden group">
      {/* Type watermark */}
      <div className="absolute top-4 right-4 text-[4rem] font-black italic text-white/[0.02] pointer-events-none uppercase tracking-tighter">
        {sensorType}
      </div>

      {showHeader && (
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div>
            <span className="text-[10px] font-black tracking-[0.5em] text-cyber-blue uppercase opacity-60">
              TELEMETRY / {latest.deviceId}
            </span>
            <h2 className="text-2xl font-black italic tracking-tighter flex items-center mt-1">
              {sensorType}
              <Radio className="w-4 h-4 ml-3 text-cyber-neon animate-pulse" />
            </h2>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-gray-500 font-mono uppercase block">SIGNAL</span>
            <span className={`text-xl font-black font-mono tracking-tighter ${latest.rssi > -70 ? 'text-cyber-neon' : 'text-cyber-pink'}`}>
              {latest.rssi} <span className="text-xs">dBm</span>
            </span>
          </div>
        </div>
      )}

      <div className="relative z-10">
        {renderContent()}
      </div>
    </div>
  );
};

// ─── Sub-components ────────────────────────────────────────────────────────────

const DataPoint = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center p-4 glass bg-white/[0.03] border-white/5 rounded-2xl group/dp hover:bg-white/[0.05] transition-all">
    <div className="mr-4 p-2 bg-black/40 rounded-lg group-hover/dp:scale-110 transition-transform">{icon}</div>
    <div>
      <div className="text-[9px] text-gray-500 font-black tracking-widest uppercase mb-1">{label}</div>
      <div className="text-xl font-bold font-mono tracking-tighter text-white">{value}</div>
    </div>
  </div>
);

const AxisBox = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div className={`p-3 bg-black/40 rounded-xl border-b-2 text-center ${color} glass`}>
    <div className="text-[8px] opacity-60 uppercase font-black mb-1">{label}-AXIS</div>
    <div className="text-lg font-black font-mono tracking-tighter">{value}g</div>
  </div>
);

const NutrientBox = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5 hover:border-cyber-blue/30 transition-all">
    <div className="text-[9px] text-cyber-blue font-black mb-1">{label}</div>
    <div className="text-sm font-black italic tabular-nums">{value}</div>
  </div>
);
