// Utilitário para logo dinâmica
const LOGO_KEY = 'app-logo-base64';

export function getAppLogo(): string | null {
  return getStorageItem<string>(LOGO_KEY);
}

export function setAppLogo(base64: string): void {
  setStorageItem(LOGO_KEY, base64);
}

const STORAGE_PREFIX = '@sshproject:';

export function getStorageItem<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}

export function setStorageItem(key: string, value: any): void {
  localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
}