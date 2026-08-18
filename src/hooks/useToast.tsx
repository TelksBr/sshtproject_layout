import React, { createContext, useContext, useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 3000) => {
    const text = String(message || '').trim();
    if (!text) return;

    setToasts((prev) => {
      if (prev.some((t) => t.message === text && t.type === type)) {
        return prev;
      }
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const next = [...prev, { id, message: text, type, duration }];
      if (duration > 0) {
        setTimeout(() => {
          setToasts((current) => current.filter((t) => t.id !== id));
        }, duration);
      }
      return next;
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
