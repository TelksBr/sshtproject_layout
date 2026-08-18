import { createContext, useContext, ReactNode } from 'react';
import { useAutoConnect } from '../hooks/useAutoConnect';

type AutoConnectApi = ReturnType<typeof useAutoConnect>;

const AutoConnectContext = createContext<AutoConnectApi | null>(null);

export function AutoConnectProvider({ children }: { children: ReactNode }) {
  const autoConnect = useAutoConnect();

  return (
    <AutoConnectContext.Provider value={autoConnect}>
      {children}
    </AutoConnectContext.Provider>
  );
}

export function useAutoConnectContext(): AutoConnectApi {
  const ctx = useContext(AutoConnectContext);
  if (!ctx) {
    throw new Error('useAutoConnectContext must be used within AutoConnectProvider');
  }
  return ctx;
}
