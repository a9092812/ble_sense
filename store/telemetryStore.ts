import { create } from 'zustand';
import { NormalizedPacket } from '@/types/telemetry';

interface TelemetryState {
  // Global rolling packet log
  packets: NormalizedPacket[];
  // Per-device packet buffers (keyed by deviceId)
  devicePackets: Record<string, NormalizedPacket[]>;
  // Devices discovered via WebSocket (not from API)
  discoveredDevices: Record<string, { deviceAddress: string; sensorType: string; lastSeen: number }>;
  maxPackets: number;

  addPackets: (newPackets: NormalizedPacket[]) => void;
  clear: (deviceId?: string) => void;
  clearDevice: (deviceId: string) => void;
}

export const useTelemetryStore = create<TelemetryState>((set) => ({
  packets: [],
  devicePackets: {},
  discoveredDevices: {},
  maxPackets: 500,

  addPackets: (newPackets) =>
    set((state) => {
      const nextDevicePackets = { ...state.devicePackets };
      const nextDiscovered = { ...state.discoveredDevices };
      let nextGlobalPackets = [...state.packets];

      newPackets.forEach((packet) => {
        const id = String(packet.deviceId);
        if (!id || id === 'undefined' || id === '') return;

        // Device-specific buffer (newest first)
        const buffer = nextDevicePackets[id] || [];
        nextDevicePackets[id] = [packet, ...buffer].slice(0, state.maxPackets);

        // Global rolling log
        nextGlobalPackets = [packet, ...nextGlobalPackets].slice(0, state.maxPackets);

        // Discovery metadata from live WS
        nextDiscovered[id] = {
          deviceAddress: packet.deviceAddress,
          sensorType: packet.sensorType,
          lastSeen: packet.timestamp || Date.now(),
        };
      });

      return {
        packets: nextGlobalPackets,
        devicePackets: nextDevicePackets,
        discoveredDevices: nextDiscovered,
      };
    }),

  clear: (deviceId) => {
    if (deviceId) {
      set((state) => {
        const nextDevicePackets = { ...state.devicePackets };
        nextDevicePackets[deviceId] = [];
        return { devicePackets: nextDevicePackets };
      });
    } else {
      set({ packets: [], devicePackets: {}, discoveredDevices: {} });
    }
  },

  clearDevice: (deviceId) =>
    set((state) => {
      const nextDevicePackets = { ...state.devicePackets };
      nextDevicePackets[deviceId] = [];
      return { devicePackets: nextDevicePackets };
    }),
}));
