// ─── Server Response Types (exact match) ─────────────────────────────────────

export interface ApiMobile {
  id: number;
  mobileId: string;
  name: string;
  lastSeen: string;
  createdAt: string;
  isOnline: boolean;
}

export interface ApiSensor {
  id: number;
  mobileId: string;
  deviceId: string;
  deviceAddress: string;
  sensorType: string;
  lastSeen: string;
  createdAt: string;
  isLive: boolean;
}

export interface HistoryResponse<T> {
  success: boolean;
  data: T[];
}

export interface CommandRequest {
  mobileId: string;
  deviceId: string;
  type: "START_LIVE" | "STOP_LIVE";
}

export interface CommandResponse {
  success: boolean;
}

// ─── Sensor Type Union ────────────────────────────────────────────────────────

export type SensorType =
  | "SHT40"
  | "LuxSensor"
  | "LIS2DH"
  | "SoilSensor"
  | "SpeedDistance"
  | "AmmoniaSensor"
  | "TempLogger"
  | "DataLogger";

// ─── History Data Shapes (from GET /api/devices/{id}/history) ─────────────────

export interface SHT40Data {
  timestamp: string;
  deviceId: string;
  temperature: number;
  humidity: number;
}

export interface AmmoniaData {
  timestamp: string;
  deviceId: string;
  ammonia: number;
  rawData: string;
}

export interface LIS2DHData {
  timestamp: string;
  deviceId: string;
  x: number;
  y: number;
  z: number;
}

export interface LuxData {
  timestamp: string;
  deviceId: string;
  lux: number;
  rawData?: string;
}

export interface SoilData {
  timestamp: string;
  deviceId: string;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  moisture: number;
  temperature: number;
  ec: number;
  pH: number;
  salinity: number;
}

export interface SpeedDistanceData {
  timestamp: string;
  deviceId: string;
  speed: number;
  distance: number;
}

export interface TempLoggerData {
  timestamp: string;
  deviceId: string;
  temperature: number;
  humidity: number;
  deviceAddress?: string;
  rawData?: string;
}

export interface DataLoggerData {
  timestamp: string;
  deviceId: string;
  currentPacketId: number;
  lastPacketId: number;
  payloadAccel?: Array<[number, number, number]>;
}

// ─── WebSocket Live Packet (from ws://backend/ws) ────────────────────────────

export interface LivePacket {
  deviceId: string;
  deviceAddress: string;
  rssi: number;
  rawAdvertisement: string;
  parsedType: SensorType;
  parsedData: ParsedDataPayload;
  timestamp: number; // Unix epoch seconds
}

// The parsedData object always has a "type" field and then typed fields with
// string values like "12.0 ppm" that need numeric extraction
export interface ParsedDataPayload {
  type: SensorType;
  [key: string]: any;
}

// ─── Internal UI Models ──────────────────────────────────────────────────────

export interface MobileGateway {
  id: number;
  mobileId: string;
  name: string;
  createdAt: string;
  status: "ONLINE" | "OFFLINE" | "STREAMING";
  lastSeen: number;
}

export interface SensorNode {
  id: number;
  mobileId: string;
  deviceId: string;
  deviceAddress: string;
  sensorType: string;
  createdAt: string;
  status: "ONLINE" | "OFFLINE" | "STREAMING";
  lastSeen: number;
}

// ─── Normalized packet for charts & tables ───────────────────────────────────

export interface NormalizedPacket {
  timestamp: number;       // ms epoch
  mobileId?: string;       // gateway phone ID (from WS broadcast)
  deviceId: string;        // BLE sensor MAC
  deviceAddress: string;
  rssi: number;
  sensorType: SensorType;
  values: Record<string, number>;
  rawParsedData: any;
}
