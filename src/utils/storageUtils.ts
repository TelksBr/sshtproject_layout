import { loadData, saveData, removeData } from './nativeStorage';

// Utilitário para logo dinâmica
const LOGO_KEY = 'app-logo-base64';

export function getAppLogo(): string | null {
  return loadData<string>(LOGO_KEY);
}

export function setAppLogo(base64: string): void {
  saveData(LOGO_KEY, base64);
}

// Wrapper functions mantidas para backward compatibility
// Agora delegam para nativeStorage (que usa SDK quando disponível, senão localStorage)
export function getStorageItem<T>(key: string): T | null {
  return loadData<T>(key);
}

export function setStorageItem(key: string, value: any): void {
  saveData(key, value);
}

export function removeStorageItem(key: string): void {
  removeData(key);
}