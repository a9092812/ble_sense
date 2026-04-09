import { useEffect, useRef } from 'react';
import { TelemetryWebSocket, getWebSocketUrl } from '@/lib/websocket';
import { useTelemetryStore } from '@/store/telemetryStore';
import { NormalizedPacket } from '@/types/telemetry';
import { normalizeLivePacket } from '@/lib/api';

export const useWebSocket = () => {
  const addPackets = useTelemetryStore((state) => state.addPackets);
  const bufferRef = useRef<NormalizedPacket[]>([]);
  const wsRef = useRef<TelemetryWebSocket | null>(null);

  useEffect(() => {
    // Batch flush cycle: prevents UI lockup on high-throughput bursts
    const flushInterval = setInterval(() => {
      if (bufferRef.current.length > 0) {
        addPackets([...bufferRef.current]);
        bufferRef.current = [];
      }
    }, 100);

    if (wsRef.current) return;

    const connectWs = async () => {
      const url = await getWebSocketUrl();
      wsRef.current = new TelemetryWebSocket(url, (raw: any) => {
        const items = Array.isArray(raw) ? raw : [raw];
        items.forEach(item => {
          const packet = normalizeLivePacket(item);
          if (packet && packet.deviceId) {
            bufferRef.current.push(packet);
          }
        });
      });
      wsRef.current.connect();
    };

    connectWs();

    return () => {
      clearInterval(flushInterval);
      wsRef.current?.disconnect();
      wsRef.current = null;
    };
  }, [addPackets]);

  return wsRef.current;
};
