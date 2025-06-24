import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getActiveConfig, setActiveConfig } from '../utils/appFunctions';
import type { ConfigItem } from '../types/config';

interface ActiveConfigContextProps {
  activeConfig: ConfigItem | null;
  setActiveConfigId: (id: number) => void;
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

  const setActiveConfigId = (id: number) => {
    setActiveConfig(id);
    // Aguarda 100ms para garantir que a config foi realmente setada pelo nativo
    setTimeout(() => {
      refreshActiveConfig();
    }, 100);
  };

  return (
    <ActiveConfigContext.Provider value={{ activeConfig, setActiveConfigId, refreshActiveConfig }}>
      {children}
    </ActiveConfigContext.Provider>
  );
};

export function useActiveConfig() {
  const ctx = useContext(ActiveConfigContext);
  if (!ctx) {
    console.error('useActiveConfig: contexto não encontrado! O ActiveConfigProvider está englobando o app?');
    throw new Error('useActiveConfig must be used within ActiveConfigProvider');
  }
  return ctx;
}
