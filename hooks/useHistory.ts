import { useState, useCallback } from 'react';
import { getHistory } from '@/lib/api';
import { NormalizedPacket, SensorType } from '@/types/telemetry';

export const useHistory = (deviceId: string) => {
  const [history, setHistory] = useState<NormalizedPacket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(
    async (
      sensor: SensorType,
      options?: { start_time?: string; end_time?: string; limit?: number }
    ) => {
      try {
        setLoading(true);
        setError(null);
        const data = await getHistory(deviceId, {
          sensor,
          ...options,
          // Default to 10,000 only if caller didn't supply a limit
          limit: options?.limit ?? 10000,
        });
        setHistory(data);
      } catch (err) {
        setError('Failed to fetch historical data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [deviceId]
  );

  const clearHistory = useCallback(() => setHistory([]), []);

  return {
    history,
    loading,
    error,
    fetchHistory,
    clearHistory,
  };
};
