import { useState, useEffect, useCallback } from 'react';
import { getStatusbarHeight, getNavbarHeight } from '../utils/appFunctions';
import { useThrottle } from '../utils/performanceUtils';

export function useAppLayout() {
  const [containerStyle, setContainerStyle] = useState({});
  
  // Função para calcular layout
  const calculateLayout = useCallback(() => {
    const statusBarHeight = getStatusbarHeight();
    const navBarHeight = getNavbarHeight();
    setContainerStyle({
      padding: `${statusBarHeight + 8}px 8px ${navBarHeight + 8}px 8px`
    });
  }, []);
  
  // Throttled resize handler para performance
  const throttledResize = useThrottle(calculateLayout, 100);
  
  useEffect(() => {
    // Calcular layout inicial
    calculateLayout();
    
    // Escutar eventos de resize com throttle
    const handleResize = () => {
      throttledResize();
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [calculateLayout, throttledResize]);
  
  return { containerStyle };
}
