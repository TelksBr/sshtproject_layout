import { useState, useCallback, useEffect, useRef } from 'react';
import { startHotspot, stopHotspot, getHotspotStatus } from '../utils/hotspotUtils';

export function useHotspot() {
  const [hotspotState, setHotspotState] = useState<'RUNNING' | 'STOPPED'>('STOPPED');
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Função para verificar e atualizar o estado do hotspot
  const checkHotspotStatus = useCallback(() => {
    const currentStatus = getHotspotStatus();
    if (currentStatus) {
      setHotspotState(currentStatus);
    }
  }, []);

  // Inicializa estado do hotspot quando o componente é montado
  useEffect(() => {
    checkHotspotStatus();
  }, [checkHotspotStatus]);

  // Inicia polling quando há uma operação em andamento
  useEffect(() => {
    if (loading) {
      intervalRef.current = setInterval(checkHotspotStatus, 500);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [loading, checkHotspotStatus]);

  const isEnabled = hotspotState === 'RUNNING';

  const toggleHotspot = useCallback(async () => {
    const initialState = hotspotState;
    setLoading(true);
    
    try {
      if (isEnabled) {
        stopHotspot();
      } else {
        startHotspot();
      }

      // Aguarda até 3 segundos para verificar mudança de estado
      let attempts = 0;
      const maxAttempts = 6; // 3 segundos com check a cada 500ms
      
      const checkChange = () => {
        setTimeout(() => {
          const newStatus = getHotspotStatus();
          if (newStatus && newStatus !== initialState) {
            // Estado mudou com sucesso
            setHotspotState(newStatus);
            setLoading(false);
          } else if (attempts < maxAttempts) {
            attempts++;
            checkChange();
          } else {
            // Timeout - para o loading mesmo sem mudança confirmada
            setLoading(false);
            checkHotspotStatus(); // Verifica estado final
          }
        }, 500);
      };
      
      checkChange();
    } catch (error) {
      setLoading(false);
    }
  }, [isEnabled, hotspotState, checkHotspotStatus]);

  return {
    isEnabled,
    loading,
    toggleHotspot,
    checkStatus: checkHotspotStatus, // Expõe função para verificação manual
  };
}
