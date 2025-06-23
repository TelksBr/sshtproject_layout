import { useState, useEffect, useCallback } from 'react';
import { getConnectionState, startConnection, stopConnection, getActiveConfig } from '../utils/appFunctions';

export function useVpnConnection() {
  const [connectionState, setConnectionState] = useState<string>('DISCONNECTED');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStateMessage = (state: string): string => {
    switch (state) {
      case "DISCONNECTED":
        return "Desconectado";
      case "CONNECTING":
        return "Conectando";
      case "CONNECTED":
        return "Conectado";
      case "STOPPING":
        return "Parando";
      case "NO_NETWORK":
        return "Sem Rede";
      case "AUTH":
        return "Autenticando";
      case "AUTH_FAILED":
        return "Falha na Autenticação";
      default:
        return "Desconectado";
    }
  };

  const checkConnection = useCallback(() => {
    const state = getConnectionState() || 'DISCONNECTED';
    setConnectionState(state);
    
    switch (state) {
      case "CONNECTED":
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        break;
      case "CONNECTING":
      case "AUTH":
        setIsConnecting(true);
        setIsConnected(false);
        setError(null);
        break;
      case "AUTH_FAILED":
        setIsConnecting(false);
        setIsConnected(false);
        setError("Falha na autenticação");
        break;
      case "NO_NETWORK":
        setIsConnecting(false);
        setIsConnected(false);
        setError("Sem conexão com a internet");
        break;
      case "STOPPING":
        setIsConnecting(false);
        setIsConnected(false);
        setError(null);
        break;
      case "DISCONNECTED":
      default:
        setIsConnecting(false);
        setIsConnected(false);
        setError(null);
        break;
    }
  }, []);

  const connect = useCallback(() => {
    try {
      const activeConfig = getActiveConfig();
      if (!activeConfig) {
        throw new Error('Selecione uma configuração primeiro');
      }

      setIsConnecting(true);
      setError(null);
      startConnection();

    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao conectar');
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    try {
      stopConnection();
      // Não alteramos os estados aqui pois o checkConnection vai atualizar automaticamente
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao desconectar');
    }
  }, []);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 1000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  return {
    connectionState,
    stateMessage: getStateMessage(connectionState),
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect
  };
}