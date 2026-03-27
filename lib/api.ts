import axios from 'axios';
import {
  ApiMobile,
  ApiSensor,
  MobileGateway,
  SensorNode,
  CommandRequest,
  NormalizedPacket,
  LivePacket,
  SensorType,
} from '@/types/telemetry';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// ─── Sensor field mappings per sensor type ───────────────────────────────────

export const SENSOR_FIELDS: Record<SensorType, { keys: string[]; unit: string; colors: string[] }> = {
  SHT40:          { keys: ['temperature', 'humidity'],                                             unit: '',     colors: ['#00f2ff', '#ff00ff'] },
  LuxSensor:      { keys: ['lux'],                                                                unit: ' LX',  colors: ['#ffae00'] },
  LIS2DH:         { keys: ['x', 'y', 'z'],                                                       unit: ' G',   colors: ['#00f2ff', '#ff00ff', '#39ff14'] },
  SoilSensor:     { keys: ['nitrogen', 'phosphorus', 'potassium', 'moisture', 'temperature', 'ec', 'pH', 'salinity'], unit: '', colors: ['#39ff14', '#ff00ff', '#00f2ff', '#ffae00', '#bc00ff', '#ff6b6b', '#4ecdc4', '#ffe66d'] },
  SpeedDistance:   { keys: ['speed', 'distance'],                                                  unit: '',     colors: ['#00f2ff', '#ff00ff'] },
  AmmoniaSensor:  { keys: ['ammonia'],                                                            unit: ' ppm', colors: ['#39ff14'] },
  TempLogger:     { keys: ['temperature', 'humidity'],                                            unit: '',     colors: ['#00f2ff', '#ff00ff'] },
  DataLogger:     { keys: ['currentPacketId'],                                                    unit: '',     colors: ['#bc00ff'] },
  SEN6x:          { keys: ['pm1', 'pm25', 'pm4', 'pm10', 'temperature', 'humidity', 'co2', 'voc', 'nox'], unit: '', colors: ['#00f2ff', '#ff00ff', '#39ff14', '#ffae00', '#bc00ff', '#ff6b6b', '#4ecdc4', '#ffe66d', '#bc00ff'] },
};

// ─── Numeric Extraction ──────────────────────────────────────────────────────
// The WebSocket parsedData has string values like "12.0 ppm", "25.3 °C" etc.
// This strips the unit suffix and returns a float.

export function extractNumeric(val: any): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const match = val.match(/-?[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  }
  return 0;
}

// ─── Normalize API Models → UI Models ────────────────────────────────────────

export function normalizeMobile(m: ApiMobile): MobileGateway {
  return {
    id: m.id,
    mobileId: m.mobileId,
    name: m.name || `Gateway ${m.mobileId}`,
    createdAt: m.createdAt || '',
    status: m.isOnline ? 'ONLINE' : 'OFFLINE',
    // Use lastSeen (server-computed from HTTP traffic), not createdAt
    lastSeen: m.lastSeen ? new Date(m.lastSeen).getTime() : Date.now(),
  };
}

export function normalizeSensorNode(s: ApiSensor): SensorNode {
  return {
    id: s.id,
    mobileId: s.mobileId,
    deviceId: s.deviceId,
    deviceAddress: s.deviceAddress || '',
    sensorType: s.sensorType || '',
    createdAt: s.createdAt || '',
    // Use lastSeen (server-computed per-packet), not createdAt
    // isLive = true means lastSeen < 30s ago
    status: s.isLive ? 'STREAMING' : 'OFFLINE',
    lastSeen: s.lastSeen ? new Date(s.lastSeen).getTime() : Date.now(),
  };
}

// ─── Normalize WebSocket LivePacket → NormalizedPacket ────────────────────────

export function normalizeLivePacket(raw: any): NormalizedPacket | null {
  // WS broadcast format per spec: { mobileId, deviceId, parsedType, parsedData, rssi, timestamp }
  const deviceId = raw.deviceId ?? raw.DeviceID ?? raw.device_id;
  if (!deviceId) return null;

  let ts = raw.timestamp ?? raw.Timestamp ?? Date.now();
  if (typeof ts === 'number' && ts < 1e12) ts *= 1000; // seconds → ms
  if (typeof ts === 'string') ts = new Date(ts).getTime();

  const sensorType: SensorType = raw.parsedType ?? raw.ParsedType ?? '';
  const pd = raw.parsedData ?? raw.ParsedData ?? {};

  // Extract numeric values from parsedData (handles "12.0 ppm" style strings)
  const values: Record<string, number> = {};
  const fields = SENSOR_FIELDS[sensorType];
  if (fields) {
    for (const key of fields.keys) {
      const v = pd[key] ?? pd[key.charAt(0).toUpperCase() + key.slice(1)] ?? 0;
      values[key] = extractNumeric(v);
    }
  }

  return {
    timestamp: Number(ts),
    deviceId: String(deviceId),
    // mobileId captured from WS message for store keying if needed
    mobileId: raw.mobileId ?? '',
    deviceAddress: raw.deviceAddress ?? raw.DeviceAddress ?? '',
    rssi: raw.rssi ?? raw.RSSI ?? -60,
    sensorType,
    values,
    rawParsedData: pd,
  };
}

// ─── Normalize History Record → NormalizedPacket ─────────────────────────────
// History API returns flat objects like {timestamp, deviceId, temperature, humidity}

export function normalizeHistoryRecord(record: any, sensorType: SensorType): NormalizedPacket {
  let ts = record.timestamp ?? record.Timestamp ?? '';
  if (typeof ts === 'string') ts = new Date(ts).getTime();
  if (typeof ts === 'number' && ts < 1e12) ts *= 1000;

  const values: Record<string, number> = {};
  const fields = SENSOR_FIELDS[sensorType];
  if (fields) {
    for (const key of fields.keys) {
      const v = record[key] ?? record[key.charAt(0).toUpperCase() + key.slice(1)] ?? 0;
      values[key] = extractNumeric(v);
    }
  }

  return {
    timestamp: Number(ts) || Date.now(),
    deviceId: String(record.deviceId ?? record.DeviceID ?? ''),
    deviceAddress: record.deviceAddress ?? '',
    rssi: record.rssi ?? -60,
    sensorType,
    values,
    rawParsedData: record,
  };
}

// ─── API Functions ───────────────────────────────────────────────────────────

export async function getMobiles(): Promise<MobileGateway[]> {
  const res = await fetch(`${API_BASE_URL}/api/mobiles`);
  const json = await res.json();
  if (!json.success || !Array.isArray(json.data)) return [];
  return json.data.map(normalizeMobile);
}

export async function getMobileMetadata(mobileId: string): Promise<MobileGateway | null> {
  const mobiles = await getMobiles();
  return mobiles.find(m => m.mobileId === mobileId) || null;
}

export async function getMobileSensors(mobileId: string): Promise<SensorNode[]> {
  const res = await fetch(`${API_BASE_URL}/api/mobiles/${mobileId}/sensors`);
  const json = await res.json();
  if (!json.success || !Array.isArray(json.data)) return [];
  return json.data.map(normalizeSensorNode);
}

export async function sendCommand(command: CommandRequest): Promise<boolean> {
  try {
    const { data } = await api.post('/api/command', command);
    return data.success === true;
  } catch {
    return false;
  }
}

export async function getHistory(
  deviceId: string,
  params: {
    sensor: SensorType;
    start_time?: string;
    end_time?: string;
    limit?: number;
  }
): Promise<NormalizedPacket[]> {
  try {
    const { data } = await api.get(`/api/devices/${deviceId}/history`, { params });
    const items = data.data || [];
    return items.map((r: any) => normalizeHistoryRecord(r, params.sensor));
  } catch {
    return [];
  }
}

export default api;
