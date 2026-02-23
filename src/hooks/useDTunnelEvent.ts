/**
 * Hook para eventos do DTunnel SDK.
 * Usa dtunnelEventBridge para evitar dependência do React Context do pacote
 * (que pode falhar com múltiplas instâncias do React no bundle).
 */

import { useEffect, useRef } from 'react';
import { on } from '../utils/dtunnelEventBridge';

export function useDTunnelEvent(eventName: string, handler: (payload?: unknown) => void): void {
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  }, [handler]);

  useEffect(() => {
    const unsub = on(eventName, (payload) => {
      try {
        ref.current(payload);
      } catch {
        /* swallow */
      }
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [eventName]);
}

export default useDTunnelEvent;
