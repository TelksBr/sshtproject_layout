import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getActiveConfig, setActiveConfig } from '../utils/appFunctions';
import type { ConfigItem } from '../types/config';

interface ActiveConfigContextProps {
  activeConfig: ConfigItem | null;
  setActiveConfigId: (id: string) => void;
  refreshActiveConfig: () => void;
}

const ActiveConfigContext = createContext<ActiveConfigContextProps | undefined>(undefined);

export const ActiveConfigProvider = ({ children }: { children: ReactNode }) => {
  const [activeConfig, setActiveConfigState] = useState<ConfigItem | null>(null);

  // Sempre busca a config ativa ao montar
  useEffect(() => {
    refreshActiveConfig();
  }, []);

  const refreshActiveConfig = () => {
    const config = getActiveConfig();
    setActiveConfigState(config);
  };

  const setActiveConfigId = (id: string) => {
    setActiveConfig(id);
    refreshActiveConfig();
  };

  return (
    <ActiveConfigContext.Provider value={{ activeConfig, setActiveConfigId, refreshActiveConfig }}>
      {children}
    </ActiveConfigContext.Provider>
  );
};

export function useActiveConfig() {
  const ctx = useContext(ActiveConfigContext);
  if (!ctx) throw new Error('useActiveConfig must be used within ActiveConfigProvider');
  return ctx;
}
