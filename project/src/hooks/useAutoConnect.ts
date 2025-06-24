import { useState, useRef } from 'react';
import { getAllConfigs } from '../utils/appFunctions';
import { autoConnectTest } from '../utils/autoConnectUtils';
import { ConfigItem } from '../types/config';

export function useAutoConnect() {
  const [open, setOpen] = useState(false);
  const [currentName, setCurrentName] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [tested, setTested] = useState(0);
  const [success, setSuccess] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelRef = useRef<{ cancelled: boolean }>({ cancelled: false });

  const openModal = () => {
    setOpen(true);
    setSuccess(null);
    setError(null);
    setRunning(false);
    cancelRef.current.cancelled = false;
  };
  const closeModal = () => {
    cancelRef.current.cancelled = true;
    setOpen(false);
    setRunning(false);
  };

  const startAutoConnect = async () => {
    setRunning(true);
    setSuccess(null);
    setError(null);
    cancelRef.current.cancelled = false;
    const allConfigs: ConfigItem[] = getAllConfigs().flatMap(c => c.items);
    setTotal(allConfigs.length);
    setTested(0);
    try {
      const result = await autoConnectTest({
        configs: allConfigs,
        setCurrentName,
        setTested,
        setActiveConfig: () => {},
        setActiveConfigState: () => {},
        setSelectedCategory: () => {},
        setSuccess,
        setError,
        cancelRef,
      });
      setRunning(false);
      if (!result) setSuccess(null);
    } catch (e) {
      setError('Erro na conexão automática.');
      setRunning(false);
    }
  };

  return {
    open,
    openModal,
    closeModal,
    currentName,
    total,
    tested,
    success,
    running,
    error,
    startAutoConnect,
  };
}
