import { useState, useEffect } from 'react';
import { getConnectionState } from '../utils/appFunctions';
import { useDTunnelEvent } from './useDTunnelEvent';
import { VpnState } from '../types/vpn';

// Permite passar um callback para notificação de eventos
export function useVpnEvents(onEvent?: (eventName: string, payload?: any) => void) {
  const [vpnState, setVpnState] = useState<VpnState>('DISCONNECTED');

  // Atualiza estado inicial
  useEffect(() => {
    const initialState = getConnectionState();
    if (initialState) setVpnState(initialState);
  }, []);

  // Escuta mudanças no estado VPN via SDK
  useDTunnelEvent('vpnState', (payload: any) => {
    if (typeof payload === 'object' && payload.state) {
      setVpnState(payload.state);
      onEvent?.('DtVpnStateEvent', payload);
    } else if (typeof payload === 'string') {
      setVpnState(payload as VpnState);
      onEvent?.('DtVpnStateEvent', payload);
    }
  });

  // Escuta sucesso na conexão
  useDTunnelEvent('vpnStartedSuccess', () => {
    setVpnState('CONNECTED');
    onEvent?.('DtVpnStartedSuccessEvent');
  });

  // Escuta desconexão bem-sucedida
  useDTunnelEvent('vpnStoppedSuccess', () => {
    setVpnState('DISCONNECTED');
    onEvent?.('DtVpnStoppedSuccessEvent');
  });

  return { vpnState };
}
