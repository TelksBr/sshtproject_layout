import { useState, useEffect } from 'react';
import { getStatusbarHeight, getNavbarHeight } from '../utils/appFunctions';

export function useAppLayout() {
  const [containerStyle, setContainerStyle] = useState({});
  useEffect(() => {
    const statusBarHeight = getStatusbarHeight();
    const navBarHeight = getNavbarHeight();
    setContainerStyle({
      padding: `${statusBarHeight + 8}px 8px ${navBarHeight + 8}px 8px`
    });
  }, []);
  return { containerStyle };
}
