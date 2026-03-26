import { useState, useEffect, useMemo } from 'react';
import { getMobiles } from '@/lib/api';
import { MobileGateway } from '@/types/telemetry';
import { useTelemetryStore } from '@/store/telemetryStore';

export const useMobiles = () => {
  const [apiMobiles, setApiMobiles] = useState<MobileGateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const discoveredDevices = useTelemetryStore((state) => state.discoveredDevices);

  const fetchMobiles = async () => {
    try {
      setLoading(true);
      const mobiles = await getMobiles();
      setApiMobiles(mobiles);
      setError(null);
    } catch (err: any) {
      console.error('fetchMobiles error', err);
      setError('Backend unreachable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMobiles();
  }, []);

  // For mobiles, we might not merge WS discovered directly if they don't have mobileId,
  // but if the UI is just gateways, we can just return API mobiles.
  const mobiles = useMemo(() => {
    const registry: Record<string, MobileGateway> = {};

    apiMobiles.forEach(m => {
      registry[m.mobileId] = m;
    });

    // Let's assume WS discovery doesn't create "gateways", only updates their status if they're known.
    // Or we keep it simple and just use backend isOnline status.
    Object.entries(discoveredDevices).forEach(([id, meta]) => {
      // If we somehow know the mobileId from WS, we could update it.
      // But WS packets are sensor packets.
      // For now, we rely on the backend's `isOnline` property.
    });

    return Object.values(registry);
  }, [apiMobiles, discoveredDevices]);

  return { mobiles, loading, error, refetch: fetchMobiles };
};