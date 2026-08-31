import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useDTunnelEvent } from '../hooks/useDTunnelEvent';
import { vibrate, getConfigLabel } from '../utils/appFunctions';
import { recordDebugLog } from '../utils/dtunnelEventBridge';
import {
  loadAppNotifications,
  parseAppNotification,
  saveAppNotifications,
  MAX_APP_NOTIFICATIONS,
  type AppNotification,
} from '../utils/appNotifications';

interface AppNotificationsContextValue {
  items: AppNotification[];
  unreadCount: number;
  incoming: AppNotification | null;
  dismissIncoming: () => void;
  openNotification: (item: AppNotification) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  remove: (id: string) => void;
  clearAll: () => void;
}

const AppNotificationsContext = createContext<AppNotificationsContextValue | undefined>(undefined);

function makeId(): string {
  return `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function AppNotificationsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<AppNotification[]>(() => loadAppNotifications());
  const [incomingQueue, setIncomingQueue] = useState<AppNotification[]>([]);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const commit = useCallback((next: AppNotification[]) => {
    const trimmed = next.slice(0, MAX_APP_NOTIFICATIONS);
    saveAppNotifications(trimmed);
    itemsRef.current = trimmed;
    setItems(trimmed);
    return trimmed;
  }, []);

  const handleIncomingPayload = useCallback((payload: unknown) => {
    const parsed = parseAppNotification(payload);
    if (!parsed) {
      recordDebugLog('app_notif', 'parse_failed_or_empty', payload);
      return;
    }

    recordDebugLog('app_notif', 'received_valid', parsed);

    const prev = itemsRef.current;
    const duplicate = prev.some(
      (item) =>
        item.title === parsed.title &&
        item.message === parsed.message &&
        Date.now() - item.receivedAt < 4000
    );
    if (duplicate) {
      recordDebugLog('app_notif', 'duplicate_ignored', parsed.title);
      return;
    }

    const added: AppNotification = {
      id: makeId(),
      title: parsed.title,
      message: parsed.message,
      image: parsed.image,
      receivedAt: Date.now(),
      read: false,
    };

    commit([added, ...prev]);

    try {
      vibrate(40);
    } catch {
      /* ignore */
    }

    setIncomingQueue((queue) => [...queue, added]);
  }, [commit]);

  // 1. Escuta eventos de notificação do DTunnel SDK
  useDTunnelEvent('notification', handleIncomingPayload);

  // 2. Checagens auxiliares na montagem (caso tenha sido passado via URL ou AppConfig)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Verifica se há parâmetros de notificação na URL do WebView (ex: ?notification=... ou ?notif=...)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const notifFromUrl = urlParams.get('notification') || urlParams.get('notif') || urlParams.get('msg');
      if (notifFromUrl) {
        recordDebugLog('app_notif', 'found_in_url_params', notifFromUrl);
        handleIncomingPayload(notifFromUrl);
      }
    } catch {
      /* ignore */
    }

    // Verifica se há notificação salva no bridge DtGetAppConfig
    try {
      const storedNotif = getConfigLabel('notification') || getConfigLabel('last_notification');
      if (storedNotif) {
        recordDebugLog('app_notif', 'found_in_app_config', storedNotif);
        handleIncomingPayload(storedNotif);
      }
    } catch {
      /* ignore */
    }
  }, [handleIncomingPayload]);

  const dismissIncoming = useCallback(() => {
    setIncomingQueue((queue) => {
      const current = queue[0];
      if (current) {
        commit(
          itemsRef.current.map((item) =>
            item.id === current.id ? { ...item, read: true } : item
          )
        );
      }
      return queue.slice(1);
    });
  }, [commit]);

  const openNotification = useCallback((item: AppNotification) => {
    commit(
      itemsRef.current.map((entry) =>
        entry.id === item.id ? { ...entry, read: true } : entry
      )
    );
    setIncomingQueue((queue) => [item, ...queue.filter((entry) => entry.id !== item.id)]);
  }, [commit]);

  const markAllRead = useCallback(() => {
    if (itemsRef.current.every((item) => item.read)) return;
    commit(itemsRef.current.map((item) => (item.read ? item : { ...item, read: true })));
  }, [commit]);

  const markRead = useCallback((id: string) => {
    commit(itemsRef.current.map((item) => (item.id === id ? { ...item, read: true } : item)));
  }, [commit]);

  const remove = useCallback((id: string) => {
    commit(itemsRef.current.filter((item) => item.id !== id));
  }, [commit]);

  const clearAll = useCallback(() => {
    commit([]);
  }, [commit]);

  const unreadCount = useMemo(() => items.filter((item) => !item.read).length, [items]);
  const incoming = incomingQueue[0] ?? null;

  const value = useMemo(
    () => ({
      items,
      unreadCount,
      incoming,
      dismissIncoming,
      openNotification,
      markAllRead,
      markRead,
      remove,
      clearAll,
    }),
    [items, unreadCount, incoming, dismissIncoming, openNotification, markAllRead, markRead, remove, clearAll]
  );

  return (
    <AppNotificationsContext.Provider value={value}>
      {children}
    </AppNotificationsContext.Provider>
  );
}

export function useAppNotifications() {
  const ctx = useContext(AppNotificationsContext);
  if (!ctx) {
    throw new Error('useAppNotifications must be used within AppNotificationsProvider');
  }
  return ctx;
}
