import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getStorageItem, setStorageItem } from '../utils/storageUtils';
import { isNativeDarkMode } from '../utils/appFunctions';

export type ThemeMode = 'auto' | 'dark' | 'light';
export type EffectiveTheme = 'dark' | 'light';

interface ThemeContextType {
  mode: ThemeMode;
  effectiveTheme: EffectiveTheme;
  isDark: boolean;
  cycleMode: () => ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const STORAGE_KEY = 'app-theme-preference-v1';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = getStorageItem<ThemeMode>(STORAGE_KEY);
    if (saved === 'auto' || saved === 'dark' || saved === 'light') {
      return saved;
    }
    return 'auto';
  });

  const [nativeIsDark, setNativeIsDark] = useState<boolean>(() => isNativeDarkMode());

  // Escuta mudanças de tema nativo quando em modo 'auto'
  useEffect(() => {
    const checkNative = () => {
      const isDark = isNativeDarkMode();
      setNativeIsDark(isDark);
    };
    checkNative();
    const interval = window.setInterval(checkNative, 2000);
    return () => window.clearInterval(interval);
  }, []);

  const effectiveTheme: EffectiveTheme = mode === 'auto' ? (nativeIsDark ? 'dark' : 'light') : mode;

  // Atualiza atributo HTML no DOM
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', effectiveTheme);
    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [effectiveTheme]);

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
    setStorageItem(STORAGE_KEY, nextMode);
  }, []);

  const cycleMode = useCallback((): ThemeMode => {
    let next: ThemeMode = 'auto';
    if (mode === 'auto') next = 'dark';
    else if (mode === 'dark') next = 'light';
    else if (mode === 'light') next = 'auto';

    setMode(next);
    return next;
  }, [mode, setMode]);

  return (
    <ThemeContext.Provider
      value={{
        mode,
        effectiveTheme,
        isDark: effectiveTheme === 'dark',
        cycleMode,
        setMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
}
