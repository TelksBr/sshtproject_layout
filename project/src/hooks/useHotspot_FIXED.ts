import { useState, useCallback, useEffect } from 'react';
import { startHotspot, stopHotspot, getHotspotStatus } from '../utils/hotspotUtils';
import { onDtunnelEvent } from '../utils/dtEvents';

export function useHotspot() {
  const [hotspotState, setHotspotState] = useState<'RUNNING' | 'STOPPED'>('STOPPED');
  const [loading, setLoading] = useState(false);

  // Inicializa estado do hotspot
  useEffect(() => {
    const initialState = getHotspotStatus();
    setHotspotState(initialState === 'RUNNING' ? 'RUNNING' : 'STOPPED');
  }, []);

  // Escuta eventos de mudança de estado do hotspot
  useEffect(() => {
    const handleHotspotStateChange = (payload: { state: 'RUNNING' | 'STOPPED' }) => {
      setHotspotState(payload.state);
    };

    onDtunnelEvent('DtHotspotStateEvent', handleHotspotStateChange);

    return () => {
      onDtunnelEvent('DtHotspotStateEvent', () => {});
    };
  }, []);

  const isEnabled = hotspotState === 'RUNNING';

  const toggleHotspot = useCallback(async () => {
    setLoading(true);
    try {
      if (isEnabled) {
        stopHotspot();
      } else {
        startHotspot();
      }
    } catch (error) {
      console.error('Erro ao alterar hotspot:', error);
    } finally {
      setLoading(false);
    }
  }, [isEnabled]);

  return {
    isEnabled,
    loading,
    toggleHotspot,
  };
}
