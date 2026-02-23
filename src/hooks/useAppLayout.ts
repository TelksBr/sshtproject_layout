import { useState, useEffect, useCallback } from 'react';
import { getStatusBarHeight, getNavBarHeight, onOrientationChange } from '../utils/nativeLayout';
import { useThrottle } from '../utils/performanceUtils';

export function useAppLayout() {
  const [containerStyle, setContainerStyle] = useState({});
  
  // Função para calcular layout via SDK nativeLayout abstraction
  const calculateLayout = useCallback(() => {
    const statusBarHeight = getStatusBarHeight();
    const navBarHeight = getNavBarHeight();
    setContainerStyle({
      padding: `${statusBarHeight + 8}px 8px ${navBarHeight + 8}px 8px`
    });
  }, []);
  
  // Throttled resize handler para performance
  const throttledResize = useThrottle(calculateLayout, 100);
  
  useEffect(() => {
    // Calcular layout inicial
    calculateLayout();
    
    // Escutar eventos de orientação via SDK abstraction
    const unsubscribe = onOrientationChange(() => {
      throttledResize();
    });
    
    return () => {
      unsubscribe();
    };
  }, [calculateLayout, throttledResize]);
  
  return { containerStyle };
}
