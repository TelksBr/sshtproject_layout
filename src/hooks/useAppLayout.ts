import { useState, useEffect, useCallback } from 'react';
import { getStatusBarHeight, getNavBarHeight, onOrientationChange } from '../utils/nativeLayout';
import { useThrottle } from '../utils/performanceUtils';

export interface AppInsets {
  paddingTop: number;
  paddingBottom: number;
}

export function useAppLayout() {
  const [insets, setInsets] = useState<AppInsets>({
    paddingTop: 32,
    paddingBottom: 56,
  });

  const calculateLayout = useCallback(() => {
    const statusBarHeight = getStatusBarHeight();
    const navBarHeight = getNavBarHeight();
    setInsets({
      paddingTop: statusBarHeight + 8,
      paddingBottom: navBarHeight + 8,
    });
  }, []);

  const throttledResize = useThrottle(calculateLayout, 100);

  useEffect(() => {
    calculateLayout();

    const unsubscribe = onOrientationChange(() => {
      throttledResize();
    });

    return () => {
      unsubscribe();
    };
  }, [calculateLayout, throttledResize]);

  return { insets };
}
