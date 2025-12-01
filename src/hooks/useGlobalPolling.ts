import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  getConnectionState, 
  getLocalIP, 
  getDownloadBytes, 
  getUploadBytes 
} from '../utils/appFunctions';
import { getHotspotStatus, startHotspot, stopHotspot } from '../utils/hotspotUtils';
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

// Estado global compartilhado (inicializado preguiçosamente)
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
let globalStateInitialized = false;

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

// Cria o estado inicial buscando diretamente os valores nativos.
// Isso evita que o app renderize primeiro com valores default (DESCONNECTED / 0.0.0.0)
// quando o usuário já está conectado.
function createInitialGlobalState(): GlobalPollingState {
  const now = Date.now();

  let vpnState: VpnState = 'DISCONNECTED';
  let localIP = '0.0.0.0';
  let downloadBytes = 0;
  let uploadBytes = 0;
  let hotspotState: 'RUNNING' | 'STOPPED' = 'STOPPED';

  try {
    const s = getConnectionState() as VpnState | null;
    if (s) {
      vpnState = s;
    }
  } catch {
    // mantém valor padrão
  }

  try {
    const ip = getLocalIP();
    if (ip) {
      localIP = ip;
    }
  } catch {
    // mantém 0.0.0.0
  }

  try {
    const d = getDownloadBytes();
    if (typeof d === 'number' && !Number.isNaN(d)) {
      downloadBytes = d;
    }
  } catch {
    // mantém 0
  }

  try {
    const u = getUploadBytes();
    if (typeof u === 'number' && !Number.isNaN(u)) {
      uploadBytes = u;
    }
  } catch {
    // mantém 0
  }

  try {
    const status = getHotspotStatus();
    if (status === 'RUNNING') {
      hotspotState = 'RUNNING';
    }
  } catch {
    // mantém STOPPED
  }

  return {
    vpnState,
    localIP,
    networkStats: {
      downloadSpeed: '0 KB/s',
      uploadSpeed: '0 KB/s',
      totalDownloaded: downloadBytes,
      totalUploaded: uploadBytes,
      formattedTotalDownloaded: formatBytes(downloadBytes),
      formattedTotalUploaded: formatBytes(uploadBytes)
    },
    hotspotState,
    lastUpdate: now
  };
}

// Garante que o estado global inicial foi resolvido a partir do nativo
function ensureGlobalStateInitialized(): GlobalPollingState {
  if (!globalStateInitialized) {
    try {
      globalState = createInitialGlobalState();
    } catch {
      // Em caso de erro inesperado, mantém defaults mas atualiza o timestamp
      globalState = {
        ...globalState,
        lastUpdate: Date.now()
      };
    }
    globalStateInitialized = true;
  }
  return globalState;
}

// Função para atualizar o estado global
// Mais resiliente: cada chamada nativa é protegida individualmente para evitar
// que um erro bloqueie a atualização do restante do estado.
const updateGlobalStateImmediate = () => {
  // Garante que já temos um snapshot inicial válido
  ensureGlobalStateInitialized();
  const previous = globalState;
  const now = Date.now();

  // Valores baseados no estado anterior (fallback seguro)
  let vpnState: VpnState = previous.vpnState;
  let localIP: string = previous.localIP;
  let downloadBytes: number = previous.networkStats.totalDownloaded;
  let uploadBytes: number = previous.networkStats.totalUploaded;
  let hotspotState: 'RUNNING' | 'STOPPED' = previous.hotspotState;

  // Atualiza estado VPN
  try {
    const state = getConnectionState() as VpnState | null;
    if (state) {
      vpnState = state;
    }
  } catch {
    // Mantém valor anterior em caso de erro
  }

  // Atualiza IP local
  try {
    const ip = getLocalIP();
    if (ip) {
      localIP = ip;
    } else if (!localIP) {
      localIP = '0.0.0.0';
    }
  } catch {
    if (!localIP) {
      localIP = '0.0.0.0';
    }
  }

  // Atualiza bytes de download
  try {
    const bytes = getDownloadBytes();
    if (typeof bytes === 'number' && !Number.isNaN(bytes)) {
      downloadBytes = bytes;
    }
  } catch {
    // Mantém valor anterior
  }

  // Atualiza bytes de upload
  try {
    const bytes = getUploadBytes();
    if (typeof bytes === 'number' && !Number.isNaN(bytes)) {
      uploadBytes = bytes;
    }
  } catch {
    // Mantém valor anterior
  }

  // Calcular velocidades baseado na diferença
  const timeDiff = Math.max(0.001, (now - previous.lastUpdate) / 1000); // evita divisão por zero
  const downloadDiff = Math.max(0, downloadBytes - previous.networkStats.totalDownloaded);
  const uploadDiff = Math.max(0, uploadBytes - previous.networkStats.totalUploaded);

  const downloadSpeed = downloadDiff / timeDiff;
  const uploadSpeed = uploadDiff / timeDiff;

  // Obter status do hotspot (não deve bloquear o resto do estado)
  try {
    const status = getHotspotStatus();
    if (status === 'RUNNING') {
      hotspotState = 'RUNNING';
    } else if (status === 'STOPPED') {
      hotspotState = 'STOPPED';
    } else {
      hotspotState = 'STOPPED';
    }
  } catch {
    // Se falhar, mantém o último valor conhecido (ou STOPPED já definido acima)
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
};

// Versão debounced para chamadas manuais (evita spam de atualizações)
const updateGlobalState = debounce(updateGlobalStateImmediate, 100);

// Versão throttled para notificação de listeners (evita re-renders excessivos)
const notifyListeners = throttle(() => {
  listeners.forEach(listener => {
    try {
      listener();
    } catch (error) {
      // Error in polling listener
    }
  });
}, 100); // Throttle notificações a cada 100ms

// Função para iniciar o polling global
const startGlobalPolling = () => {
  if (globalInterval === null) {
    // Garante que o estado inicial foi lido do nativo
    ensureGlobalStateInitialized();

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
  const [state, setState] = useState<GlobalPollingState>(() => ensureGlobalStateInitialized());
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
  
  const toggleHotspot = useCallback(async () => {
    setLoading(true);
    
    try {
      let success = false;
      
      if (hotspotState === 'RUNNING') {
        // Para o hotspot se estiver rodando
        success = stopHotspot();
      } else {
        // Inicia o hotspot se estiver parado
        success = startHotspot();
      }
      
      if (success) {
        // Aguarda processamento com verificações periódicas
        let attempts = 0;
        const maxAttempts = 10; // 5 segundos total
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Força verificação do novo status
          updateGlobalStateImmediate();
          
          // Verifica se o estado mudou
          const newStatus = getHotspotStatus();
          
          if (newStatus !== hotspotState) {
            break;
          }
          
          attempts++;
        }
        
        // Força atualização final
        forceUpdate();
      }
    } catch (error) {
      // Error toggling hotspot
    } finally {
      setLoading(false);
    }
  }, [hotspotState, forceUpdate]);

  const checkStatus = useCallback(() => {
    // Força verificação imediata do status
    updateGlobalStateImmediate();
    forceUpdate();
  }, [forceUpdate]);
  
  return {
    isEnabled: hotspotState === 'RUNNING',
    hotspotState,
    loading,
    toggleHotspot,
    checkStatus
  };
}