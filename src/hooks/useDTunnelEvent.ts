import { useEffect, useRef } from 'react';
import dtEventBridge from '../utils/dtunnelEventBridge';

export function useDTunnelEvent(eventName: string, handler: (payload?: unknown) => void) {
  const ref = useRef(handler);
  useEffect(() => { ref.current = handler; }, [handler]);

  useEffect(() => {
    const unsub = dtEventBridge.on(eventName, (payload) => {
      try { ref.current(payload); } catch (e) { /* swallow */ }
    });
    return () => { if (typeof unsub === 'function') unsub(); };
  }, [eventName]);
}

export default useDTunnelEvent;
