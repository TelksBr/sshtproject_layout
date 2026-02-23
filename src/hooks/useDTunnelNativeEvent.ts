import { useEffect, useRef } from 'react';
import { on } from '../utils/dtunnelEventBridge';

export function useDTunnelNativeEvent(handler: (event?: unknown) => void): void {
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  }, [handler]);

  useEffect(() => {
    const unsub = on('nativeEvent', (payload) => {
      try {
        ref.current(payload);
      } catch {
        /* swallow */
      }
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);
}

export default useDTunnelNativeEvent;
