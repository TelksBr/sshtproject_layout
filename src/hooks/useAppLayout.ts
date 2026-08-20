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

  const applyInsets = useCallback((next: AppInsets) => {
    const root = document.documentElement;
    root.style.setProperty('--safe-top', `${next.paddingTop}px`);
    root.style.setProperty('--safe-bottom', `${next.paddingBottom}px`);
    setInsets(next);
  }, []);

  const calculateLayout = useCallback(() => {
    const statusBarHeight = getStatusBarHeight();
    const navBarHeight = getNavBarHeight();
    applyInsets({
      paddingTop: statusBarHeight + 8,
      paddingBottom: navBarHeight + 8,
    });
  }, [applyInsets]);

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
