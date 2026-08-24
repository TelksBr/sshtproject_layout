import { loadData, saveData, removeData } from './nativeStorage';
import type { ConfigCategory, ConfigItem } from '../types/config';

const CACHE_STORAGE_KEY = 'icon_cache';
const CACHE_VERSION = 1;

interface IconCacheStore {
  version: number;
  icons: Record<string, string>; // url -> data:image/...;base64,...
  lastUpdated: number;
}

// Cache em memória RAM para acesso O(1) síncrono e ultra rápido
const memoryCache = new Map<string, string>();
const subscribers = new Set<() => void>();

// Inicialização imediata ao carregar o módulo
(function initMemoryCache() {
  try {
    const store = loadData<IconCacheStore>(CACHE_STORAGE_KEY);
    if (store && store.version === CACHE_VERSION && store.icons && typeof store.icons === 'object') {
      for (const [url, base64] of Object.entries(store.icons)) {
        if (typeof base64 === 'string' && base64.startsWith('data:image/')) {
          memoryCache.set(url, base64);
        }
      }
    }
  } catch (error) {
    console.error('Erro ao inicializar cache de ícones em memória:', error);
  }
})();

function persistMemoryCache(): void {
  try {
    const icons: Record<string, string> = {};
    for (const [url, base64] of memoryCache.entries()) {
      icons[url] = base64;
    }
    const store: IconCacheStore = {
      version: CACHE_VERSION,
      icons,
      lastUpdated: Date.now(),
    };
    saveData(CACHE_STORAGE_KEY, store);
  } catch (error) {
    console.error('Erro ao persistir cache de ícones no storage:', error);
  }
}

function notifySubscribers(): void {
  subscribers.forEach((callback) => {
    try {
      callback();
    } catch (e) {
      console.error('Erro no listener de cache de ícones:', e);
    }
  });
}

/**
 * Retorna o src a ser renderizado na imagem:
 * - Se a URL estiver em cache, retorna a string Base64.
 * - Caso contrário, retorna a URL original remota para fallback.
 */
export function getIconSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  return memoryCache.get(trimmed) || trimmed;
}

/**
 * Informa se uma URL já está armazenada no cache offline (em formato Base64).
 */
export function isIconCached(url: string | null | undefined): boolean {
  if (!url) return false;
  return memoryCache.has(url.trim());
}

/**
 * Converte um Blob de imagem em Data URL Base64 via FileReader.
 */
export function blobToBase64(blob: Blob): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        resolve(null);
      }
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}

/**
 * Baixa uma imagem remota com timeout e a converte para Base64.
 */
export async function fetchAndConvertBase64(url: string, timeoutMs = 8000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      signal: controller.signal,
      cache: 'force-cache',
    });
    clearTimeout(timer);

    if (!response.ok) return null;

    const blob = await response.blob();
    if (!blob || blob.size === 0) return null;

    return await blobToBase64(blob);
  } catch {
    return null;
  }
}

/**
 * Sincroniza o cache de ícones baseado na lista ativa de configurações/categorias:
 * 1. Extrai todas as URLs ativas (deduplicadas em Set).
 * 2. Garbage Collection: Remove do cache as URLs que não são mais usadas por nenhuma config.
 * 3. Preload: Baixa em background as novas URLs que ainda não foram cacheadas.
 */
export async function syncIconCache(
  catalog: ConfigCategory[] | ConfigItem[]
): Promise<void> {
  if (!catalog || !Array.isArray(catalog)) return;

  // 1. Extração de URLs ativas
  const activeUrls = new Set<string>();

  const processItem = (item: any) => {
    if (!item) return;
    if (typeof item.icon === 'string' && item.icon.trim()) {
      activeUrls.add(item.icon.trim());
    }
    if (Array.isArray(item.items)) {
      item.items.forEach(processItem);
    }
  };

  catalog.forEach(processItem);

  // 2. Garbage Collection (Remoção de ícones órfãos)
  let removedAny = false;
  for (const cachedUrl of Array.from(memoryCache.keys())) {
    if (!activeUrls.has(cachedUrl)) {
      memoryCache.delete(cachedUrl);
      removedAny = true;
    }
  }

  if (removedAny) {
    persistMemoryCache();
    notifySubscribers();
  }

  // 3. Preload de ícones faltantes (Deduplicado)
  const missingUrls = Array.from(activeUrls).filter((url) => !memoryCache.has(url));
  if (missingUrls.length === 0) return;

  // Baixa as imagens com controle de concorrência
  let addedAny = false;
  await Promise.allSettled(
    missingUrls.map(async (url) => {
      const base64 = await fetchAndConvertBase64(url);
      if (base64) {
        memoryCache.set(url, base64);
        addedAny = true;
      }
    })
  );

  if (addedAny) {
    persistMemoryCache();
    notifySubscribers();
  }
}

/**
 * Permite que componentes React se inscrevam para re-renderizar quando novos
 * ícones terminarem de ser baixados e armazenados em cache.
 */
export function subscribeIconCache(callback: () => void): () => void {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

/**
 * Limpa completamente o cache de ícones (memória e localStorage).
 */
export function clearIconCache(): void {
  memoryCache.clear();
  removeData(CACHE_STORAGE_KEY);
  notifySubscribers();
}
