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
        <DataPoint icon={<Thermometer className="text-mint-accent" />} label="TEMPERATURE" value={`${v.temperature?.toFixed(1) ?? '0'}°C`} />
        <DataPoint icon={<Droplets className="text-mint-glow" />} label="HUMIDITY" value={`${v.humidity?.toFixed(1) ?? '0'}%`} />
      </div>
      <LiveChart packets={packets} keys={['temperature', 'humidity']} colors={['#6CFFB0', '#8EF9C5']} title="ENVIRONMENT" variant="area" />
    </div>
  );

  const renderLux = () => (
    <div className="space-y-6">
      <DataPoint icon={<Sun className="text-mint-accent" />} label="LUMINOSITY" value={`${v.lux?.toFixed(0) ?? '0'} LUX`} />
      <LiveChart packets={packets} keys={['lux']} colors={['#6CFFB0']} title="Light Intensity" unit=" LX" variant="area" />
    </div>
  );

  const renderLIS2DH = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <AxisBox label="X" value={v.x?.toFixed(3) ?? '0'} color="text-mint-accent" />
        <AxisBox label="Y" value={v.y?.toFixed(3) ?? '0'} color="text-mint-glow" />
        <AxisBox label="Z" value={v.z?.toFixed(3) ?? '0'} color="text-white" />
      </div>
      <LiveChart packets={packets} keys={['x', 'y', 'z']} colors={['#6CFFB0', '#8EF9C5', '#FFFFFF']} title="Accelerometer" unit=" G" />
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
        <DataPoint icon={<Sprout className="text-mint-accent" />} label="MOISTURE" value={`${v.moisture?.toFixed(1)}%`} />
        <DataPoint icon={<Thermometer className="text-mint-glow" />} label="SOIL_TEMP" value={`${v.temperature?.toFixed(1)}°C`} />
      </div>
      <LiveChart packets={packets} keys={['moisture', 'temperature']} colors={['#6CFFB0', '#8EF9C5']} title="Soil Metrics" variant="area" />
    </div>
  );

  const renderSpeed = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <DataPoint icon={<Zap className="text-mint-accent" />} label="VELOCITY" value={`${v.speed?.toFixed(1)} km/h`} />
        <DataPoint icon={<Move className="text-mint-glow" />} label="DISTANCE" value={`${v.distance?.toFixed(2)} m`} />
      </div>
      <LiveChart packets={packets} keys={['speed', 'distance']} colors={['#6CFFB0', '#8EF9C5']} title="Speed Profile" />
    </div>
  );

  const renderAmmonia = () => (
    <div className="space-y-6">
      <DataPoint icon={<Wind className="text-mint-accent" />} label="AMMONIA_NH3" value={`${v.ammonia?.toFixed(1)} ppm`} />
      <LiveChart packets={packets} keys={['ammonia']} colors={['#6CFFB0']} title="Gas Concentration" unit=" ppm" variant="area" />
    </div>
  );

  const renderTempLogger = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <DataPoint icon={<Thermometer className="text-mint-accent" />} label="LOG_TEMP" value={`${v.temperature?.toFixed(1)}°C`} />
        <DataPoint icon={<Droplets className="text-mint-glow" />} label="LOG_HUM" value={`${v.humidity?.toFixed(1)}%`} />
      </div>
      <LiveChart packets={packets} keys={['temperature', 'humidity']} colors={['#6CFFB0', '#8EF9C5']} title="Temp Logger" variant="area" />
    </div>
  );

  const renderDataLogger = () => {
    const currentId = v.currentPacketId ?? 0;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 glass-inset bg-white/5">
          <div className="flex items-center space-x-4">
            <Database className="w-5 h-5 text-mint-accent" />
            <div>
              <div className="text-[10px] text-text-secondary font-bold tracking-widest uppercase">SEQUENCE</div>
              <div className="text-lg font-bold text-white">PKT_{currentId.toFixed(0)}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSen6x = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-2">
        <NutrientBox label="PM1.0" value={`${v.pm1?.toFixed(1) ?? '0'}`} />
        <NutrientBox label="PM2.5" value={`${v.pm25?.toFixed(1) ?? '0'}`} />
        <NutrientBox label="PM4.0" value={`${v.pm4?.toFixed(1) ?? '0'}`} />
        <NutrientBox label="PM10" value={`${v.pm10?.toFixed(1) ?? '0'}`} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <DataPoint icon={<Database className="text-mint-accent" />} label="CO2" value={`${v.co2?.toFixed(0) ?? '0'} ppm`} />
        <DataPoint icon={<Wind className="text-mint-glow" />} label="VOC" value={`${v.voc?.toFixed(0) ?? '0'}`} />
        <DataPoint icon={<AlertTriangle className="text-white" />} label="NOx" value={`${v.nox?.toFixed(0) ?? '0'}`} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <DataPoint icon={<Thermometer className="text-mint-accent" />} label="TEMP" value={`${v.temperature?.toFixed(2)}°C`} />
        <DataPoint icon={<Droplets className="text-mint-glow" />} label="HUMIDITY" value={`${v.humidity?.toFixed(2)}%`} />
      </div>

      <LiveChart 
        packets={packets} 
        keys={['pm25', 'co2', 'temperature']} 
        colors={['#6CFFB0', '#8EF9C5', '#FFFFFF']} 
        title="Air Quality" 
        variant="area" 
      />
    </div>
  );

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
      case 'SEN6x': return renderSen6x();
      default: return (
        <div className="p-10 text-center glass-inset opacity-30 italic text-text-secondary">
          UNSUPPORTED: {sensorType}
        </div>
      );
    }
  };

  return (
    <div className="glass-card p-8 group transition-all duration-500">
      {/* Type watermark */}
      <div className="absolute top-4 right-4 text-[4rem] font-bold text-white/[0.03] pointer-events-none uppercase tracking-tighter">
        {sensorType}
      </div>

      {showHeader && (
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div>
            <span className="text-[10px] font-bold tracking-[0.3em] text-mint-accent uppercase opacity-60">
              {latest.deviceId ? `NODE / ${latest.deviceId}` : 'TELEMETRY'}
            </span>
            <h2 className="text-2xl font-bold tracking-tight flex items-center mt-1 text-white">
              {sensorType}
              <Radio className="w-4 h-4 ml-3 text-mint-accent animate-pulse" />
            </h2>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-text-secondary font-bold tracking-widest uppercase block">SIGNAL</span>
            <span className={`text-xl font-bold font-mono tracking-tighter ${latest.rssi > -70 ? 'text-mint-accent' : 'text-white/60'}`}>
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
  <div className="flex items-center p-4 glass-inset group/dp transition-all duration-300 hover:bg-white/[0.05]">
    <div className="mr-4 p-2 bg-black/20 rounded-xl group-hover/dp:scale-110 transition-transform duration-300">{icon}</div>
    <div>
      <div className="text-[9px] text-text-secondary font-bold tracking-widest uppercase mb-1 opacity-70">{label}</div>
      <div className="text-xl font-bold font-mono tracking-tighter text-white">{value}</div>
    </div>
  </div>
);

const AxisBox = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div className={`p-3 glass-inset text-center ${color}`}>
    <div className="text-[8px] opacity-50 uppercase font-bold mb-1 tracking-widest">{label} AXIS</div>
    <div className="text-lg font-bold font-mono tracking-tighter">{value}g</div>
  </div>
);

const NutrientBox = ({ label, value }: { label: string; value: string }) => (
  <div className="glass-inset p-3 text-center transition-all duration-300 hover:bg-white/5">
    <div className="text-[9px] text-mint-accent font-bold mb-1 opacity-70 tracking-widest">{label}</div>
    <div className="text-sm font-bold text-white tabular-nums">{value}</div>
  </div>
);
