import { getStorageItem, setStorageItem } from './storageUtils';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  image?: string;
  receivedAt: number;
  read: boolean;
}

const STORAGE_KEY = 'app-panel-notifications';
export const MAX_APP_NOTIFICATIONS = 40;

function isNotification(value: unknown): value is AppNotification {
  if (!value || typeof value !== 'object') return false;
  const item = value as AppNotification;
  return Boolean(item.id && (item.title || item.message));
}

function extractImageUrl(rec: Record<string, unknown>): string | undefined {
  const candidates = [
    rec.image,
    rec.imageUrl,
    rec.image_url,
    rec.img,
    rec.picture,
    rec.gif,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
    if (candidate && typeof candidate === 'object') {
      const nested = candidate as Record<string, unknown>;
      const url = nested.url ?? nested.src ?? nested.href ?? nested.path;
      if (typeof url === 'string' && url.trim()) return url.trim();
    }
  }

  return undefined;
}

export function parseAppNotification(payload: unknown): Omit<AppNotification, 'id' | 'receivedAt' | 'read'> | null {
  let data: unknown = payload;

  if (typeof payload === 'string') {
    const trimmed = payload.trim();
    if (!trimmed) return null;
    try {
      data = JSON.parse(trimmed);
    } catch {
      return { title: 'Notificação', message: trimmed };
    }
  }

  if (!data || typeof data !== 'object') return null;
  const rec = data as Record<string, unknown>;
  const nested =
    rec.data && typeof rec.data === 'object' && !Array.isArray(rec.data)
      ? (rec.data as Record<string, unknown>)
      : rec;
  const title = String(nested.title ?? nested.titulo ?? rec.title ?? rec.titulo ?? '').trim();
  const message = String(
    nested.message ?? nested.msg ?? nested.body ?? nested.content ?? nested.texto ??
      rec.message ?? rec.msg ?? rec.body ?? rec.content ?? rec.texto ?? ''
  ).trim();
  const image = extractImageUrl(nested) ?? extractImageUrl(rec);

  if (!title && !message && !image) return null;

  return {
    title: title || 'Notificação',
    message,
    image,
  };
}

export function loadAppNotifications(): AppNotification[] {
  try {
    const stored = getStorageItem<AppNotification[]>(STORAGE_KEY);
    if (!Array.isArray(stored)) return [];
    return stored.filter(isNotification).slice(0, MAX_APP_NOTIFICATIONS);
  } catch {
    return [];
  }
}

export function saveAppNotifications(items: AppNotification[]): void {
  try {
    setStorageItem(STORAGE_KEY, items.filter(isNotification).slice(0, MAX_APP_NOTIFICATIONS));
  } catch {
    /* WebView sem storage disponível */
  }
}

export function formatNotificationTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `há ${days}d`;
  return new Date(timestamp).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
