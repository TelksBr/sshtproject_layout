import { useState, useEffect } from 'react';
import { getConnectionState } from '../utils/appFunctions';
import { onDtunnelEvent } from '../utils/dtEvents';
import { VpnState } from '../types/vpn';

// Permite passar um callback para notificação de eventos
export function useVpnEvents(onEvent?: (eventName: string, payload?: any) => void) {
  const [vpnState, setVpnState] = useState<VpnState>('DISCONNECTED');

  useEffect(() => {
    // Busca estado inicial
    const initialState = getConnectionState();
    if (initialState) setVpnState(initialState);

    const handleVpnStatus = (payload: any) => {
      if (typeof payload === 'object' && payload.state) {
        setVpnState(payload.state);
        onEvent?.('DtVpnStateEvent', payload);
      } else if (typeof payload === 'string') {
        setVpnState(payload as VpnState);
        onEvent?.('DtVpnStateEvent', payload);
      }
    };

    const handleVpnStarted = () => {
      setVpnState('CONNECTED');
      onEvent?.('DtVpnStartedSuccessEvent');
    };

    const handleVpnStopped = () => {
      setVpnState('DISCONNECTED');
      onEvent?.('DtVpnStoppedSuccessEvent');
    };

    // Registra os eventos
    onDtunnelEvent('DtVpnStateEvent', handleVpnStatus);
    onDtunnelEvent('DtVpnStartedSuccessEvent', handleVpnStarted);
    onDtunnelEvent('DtVpnStoppedSuccessEvent', handleVpnStopped);

    // Cleanup - remove os handlers específicos
    return () => {
      (window as any).DtVpnStateEvent = undefined;
      (window as any).DtVpnStartedSuccessEvent = undefined;
      (window as any).DtVpnStoppedSuccessEvent = undefined;
    };
  }, [onEvent]);

  return { vpnState };
}
