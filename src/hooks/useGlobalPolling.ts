import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  getConnectionState, 
  getLocalIP, 
  getDownloadBytes, 
  getUploadBytes 
} from '../utils/appFunctions';
import { getHotspotStatus } from '../utils/hotspotUtils';
import { onDtunnelEvent } from '../utils/dtEvents';
import { debounce, throttle } from '../utils/performanceUtils';
import { VpnState } from '../types/vpn';

interface GlobalPollingState {
  vpnState: VpnState;
  localIP: string;
  networkStats: {
    downloadSpeed: string;
    uploadSpeed: string;
    totalDownloaded: number;
    totalUploaded: number;
    formattedTotalDownloaded: string;
    formattedTotalUploaded: string;
  };
  hotspotState: 'RUNNING' | 'STOPPED';
  lastUpdate: number;
}

// Estado global compartilhado
let globalState: GlobalPollingState = {
  vpnState: 'DISCONNECTED',
  localIP: '0.0.0.0',
  networkStats: {
    downloadSpeed: '0 KB/s',
    uploadSpeed: '0 KB/s',
    totalDownloaded: 0,
    totalUploaded: 0,
    formattedTotalDownloaded: '0 KB',
    formattedTotalUploaded: '0 KB'
  },
  hotspotState: 'STOPPED',
  lastUpdate: Date.now()
};

// Sistema de listeners para notificar componentes
const listeners = new Set<() => void>();
let activeListenersCount = 0;
let globalInterval: NodeJS.Timeout | null = null;

// Função para formatar bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 KB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Função para formatar velocidade
function formatSpeed(bytesPerSecond: number): string {
  return formatBytes(bytesPerSecond) + '/s';
}

// Função para atualizar o estado global
const updateGlobalStateImmediate = () => {
  try {
    const vpnState = getConnectionState() as VpnState;
    const localIP = getLocalIP() || '0.0.0.0';
    const downloadBytes = getDownloadBytes() || 0;
    const uploadBytes = getUploadBytes() || 0;
    
    // Calcular velocidades baseado na diferença
    const now = Date.now();
    const timeDiff = (now - globalState.lastUpdate) / 1000; // segundos
    
    const downloadDiff = Math.max(0, downloadBytes - globalState.networkStats.totalDownloaded);
    const uploadDiff = Math.max(0, uploadBytes - globalState.networkStats.totalUploaded);
    
    const downloadSpeed = timeDiff > 0 ? downloadDiff / timeDiff : 0;
    const uploadSpeed = timeDiff > 0 ? uploadDiff / timeDiff : 0;
    
    // Obter status do hotspot
    let hotspotState: 'RUNNING' | 'STOPPED' = 'STOPPED';
    try {
      const status = getHotspotStatus();
      hotspotState = status ? 'RUNNING' : 'STOPPED';
    } catch (error) {
      // Ignore hotspot errors
    }
    
    // Atualizar estado global
    globalState = {
      vpnState,
      localIP,
      networkStats: {
        downloadSpeed: formatSpeed(downloadSpeed),
        uploadSpeed: formatSpeed(uploadSpeed),
        totalDownloaded: downloadBytes,
        totalUploaded: uploadBytes,
        formattedTotalDownloaded: formatBytes(downloadBytes),
        formattedTotalUploaded: formatBytes(uploadBytes)
      },
      hotspotState,
      lastUpdate: now
    };
    
    // Notificar todos os listeners (throttled para performance)
    notifyListeners();
  } catch (error) {
    console.error('Error updating global state:', error);
  }
};

// Versão debounced para chamadas manuais (evita spam de atualizações)
const updateGlobalState = debounce(updateGlobalStateImmediate, 100);

// Versão throttled para notificação de listeners (evita re-renders excessivos)
const notifyListeners = throttle(() => {
  listeners.forEach(listener => {
    try {
      listener();
    } catch (error) {
      console.warn('Error in polling listener:', error);
    }
  });
}, 100); // Throttle notificações a cada 100ms

// Função para iniciar o polling global
const startGlobalPolling = () => {
  if (globalInterval === null) {
    // Atualização inicial (imediata)
    updateGlobalStateImmediate();
    
    // Interval de 2000ms (usa versão imediata para manter consistência)
    globalInterval = setInterval(updateGlobalStateImmediate, 2000);
  }
};

// Função para parar o polling global
const stopGlobalPolling = () => {
  if (globalInterval !== null) {
    clearInterval(globalInterval);
    globalInterval = null;
  }
};

/**
 * Hook global que substitui todos os pollings individuais
 * Otimização: Um único interval para todo o app
 */
export function useGlobalPolling() {
  const [state, setState] = useState<GlobalPollingState>(globalState);
  const listenerRef = useRef<(() => void) | null>(null);
  
  useEffect(() => {
    // Cria listener para este hook
    const listener = () => {
      setState({ ...globalState });
    };
    
    listenerRef.current = listener;
    listeners.add(listener);
    activeListenersCount++;
    
    // Inicia polling global se necessário
    startGlobalPolling();
    
    // Registra eventos VPN para forçar atualizações imediatas
    const handleVpnEvents = () => {
      // Força atualização imediata quando eventos VPN disparam
      setTimeout(updateGlobalState, 100);
    };
    
    try {
      onDtunnelEvent('DtVpnStateEvent', handleVpnEvents);
      onDtunnelEvent('DtVpnStartedSuccessEvent', handleVpnEvents);
      onDtunnelEvent('DtVpnStoppedSuccessEvent', handleVpnEvents);
    } catch (error) {
      // Ignore event registration errors in development
    }
    
    // Cleanup
    return () => {
      if (listenerRef.current) {
        listeners.delete(listenerRef.current);
        activeListenersCount--;
        
        // Para polling se não há mais listeners
        if (activeListenersCount === 0) {
          stopGlobalPolling();
        }
      }
    };
  }, []);
  
  // Método para forçar atualização (útil para eventos)
  const forceUpdate = useCallback(() => {
    updateGlobalState();
  }, []);
  
  return {
    ...state,
    forceUpdate
  };
}

/**
 * Hook específico para network stats (compatibilidade)
 */
export function useNetworkStatsGlobal() {
  const { networkStats } = useGlobalPolling();
  return networkStats;
}

/**
 * Hook específico para hotspot (compatibilidade)  
 */
export function useHotspotGlobal() {
  const { hotspotState, forceUpdate } = useGlobalPolling();
  const [loading, setLoading] = useState(false);
  
  const toggleHotspot = useCallback(() => {
    setLoading(true);
    // Simula operação async
    setTimeout(() => {
      forceUpdate();
      setLoading(false);
    }, 1000);
  }, [forceUpdate]);
  
  return {
    isEnabled: hotspotState === 'RUNNING',
    hotspotState,
    loading,
    toggleHotspot,
    checkStatus: forceUpdate
  };
}