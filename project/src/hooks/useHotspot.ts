import { useState, useEffect } from 'react';
import { getHotspotStatus, startHotspot, stopHotspot } from '../utils/hotspotUtils';

export function useHotspot() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkStatus = () => {
      const status = getHotspotStatus();
      if (status !== null) {
        setIsEnabled(status === 'RUNNING');
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 1000);

    return () => clearInterval(interval);
  }, []);

  const toggleHotspot = async () => {
    setLoading(true);
    try {
      if (isEnabled) {
        stopHotspot();
      } else {
        startHotspot();
      }
      await new Promise(resolve => setTimeout(resolve, 500));
      const status = getHotspotStatus();
      if (status !== null) {
        setIsEnabled(status === 'RUNNING');
      }
    } catch (error) {
      console.error('Error toggling hotspot:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    isEnabled,
    loading,
    toggleHotspot
  };
}