import { useCallback } from 'react';
import { useTelemetryStore } from '@/store/telemetryStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { NormalizedPacket } from '@/types/telemetry';

// Stable empty array reference to avoid React 19 useSyncExternalStore infinite loop
const EMPTY_PACKETS: NormalizedPacket[] = [];
const selectClearDevice = (state: ReturnType<typeof useTelemetryStore.getState>) => state.clearDevice;

export const useLiveTelemetry = (deviceId: string) => {
  useWebSocket();

  const selectPackets = useCallback(
    (state: ReturnType<typeof useTelemetryStore.getState>) => state.devicePackets[deviceId] || EMPTY_PACKETS,
    [deviceId]
  );

  const packets = useTelemetryStore(selectPackets);
  const clearDevice = useTelemetryStore(selectClearDevice);

  return {
    packets,
    clear: () => clearDevice(deviceId),
  };
};
