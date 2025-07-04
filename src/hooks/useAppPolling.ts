import { useState, useEffect } from 'react';
import { getLocalIP } from '../utils/appFunctions';

export function useAppPolling() {
  const [localIP, setLocalIP] = useState('127.0.0.1');
  // Adicione outros estados de polling global aqui se necessário

  useEffect(() => {
    const updateIP = () => setLocalIP(getLocalIP() ?? '127.0.0.1');
    updateIP();
    const interval = setInterval(updateIP, 1500);
    return () => clearInterval(interval);
  }, []);

  return { localIP };
}
