import { useState, useEffect, useCallback } from 'react';
import { getAppPadding, onOrientationChange } from '../utils/nativeLayout';
import { useThrottle } from '../utils/performanceUtils';

export interface NotificationPosition {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Hook para calcular posição de notificações respeitando padding do SDK
 * Usa getAppPadding() que considera status bar e navigation bar
 */
export function useNotificationPosition() {
  const [position, setPosition] = useState<NotificationPosition>({
    top: 8,
    right: 8,
    bottom: 8,
    left: 8
  });

  // Calcular posição com base no padding do app
  const calculatePosition = useCallback(() => {
    const padding = getAppPadding();
    setPosition({
      top: padding.top,
      right: padding.right,
      bottom: padding.bottom,
      left: padding.left
    });
  }, []);

  // Throttled resize handler para performance
  const throttledResize = useThrottle(calculatePosition, 100);

  useEffect(() => {
    // Calcular posição inicial
    calculatePosition();

    // Escutar eventos de orientação via SDK abstraction
    const unsubscribe = onOrientationChange(() => {
      throttledResize();
    });

    return () => {
      unsubscribe();
    };
  }, [calculatePosition, throttledResize]);

  return { position };
}
