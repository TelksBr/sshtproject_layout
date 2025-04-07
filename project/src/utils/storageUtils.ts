import { useState, useEffect } from 'react';

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