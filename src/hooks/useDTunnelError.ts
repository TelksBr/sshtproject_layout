import { useEffect, useRef } from 'react';
import dtEventBridge from '../utils/dtunnelEventBridge';

export function useDTunnelError(handler: (err?: any) => void) {
  const ref = useRef(handler);
  useEffect(() => { ref.current = handler; }, [handler]);

  useEffect(() => {
    const unsub = dtEventBridge.on('error', (payload) => {
      try { ref.current(payload); } catch (e) { /* swallow */ }
    });
    return () => { if (typeof unsub === 'function') unsub(); };
  }, []);
}

export default useDTunnelError;
