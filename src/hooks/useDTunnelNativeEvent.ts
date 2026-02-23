import { useEffect, useRef } from 'react';
import dtEventBridge from '../utils/dtunnelEventBridge';

export function useDTunnelNativeEvent(handler: (event?: any) => void) {
  const ref = useRef(handler);
  useEffect(() => { ref.current = handler; }, [handler]);

  useEffect(() => {
    const unsub = dtEventBridge.on('nativeEvent', (payload) => {
      try { ref.current(payload); } catch (e) { /* swallow */ }
    });
    return () => { if (typeof unsub === 'function') unsub(); };
  }, []);
}

export default useDTunnelNativeEvent;
