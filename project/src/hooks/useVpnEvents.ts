import { useState, useEffect } from 'react';
import { getConnectionState } from '../utils/appFunctions';
import { onDtunnelEvent } from '../utils/dtEvents';
import { VpnState } from '../types/vpn';

// Permite passar um callback para notificação de eventos
export function useVpnEvents(onEvent?: (eventName: string, payload?: any) => void) {
  const [vpnState, setVpnState] = useState<VpnState>('DISCONNECTED');

  useEffect(() => {
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
    onDtunnelEvent('DtVpnStateEvent', handleVpnStatus);
    onDtunnelEvent('DtVpnStartedSuccessEvent', () => {
      setVpnState('CONNECTED');
      onEvent?.('DtVpnStartedSuccessEvent');
    });
    onDtunnelEvent('DtVpnStoppedSuccessEvent', () => {
      setVpnState('DISCONNECTED');
      onEvent?.('DtVpnStoppedSuccessEvent');
    });
    return () => {
      onDtunnelEvent('DtVpnStateEvent', () => {});
      onDtunnelEvent('DtVpnStartedSuccessEvent', () => {});
      onDtunnelEvent('DtVpnStoppedSuccessEvent', () => {});
    };
  }, [onEvent]);

  return { vpnState };
}
