// ❌ Removido: Suporte a window.Dt* (dtunnelBridge)

/**
 * Abstração para Storage Persistente
 * ✅ Usa: localStorage do browser com prefixo '@sshtproject:' para isolamento
 * ❌ Removido: window.DtStorage (SDK DTunnel)
 * 
 * Nota: O SDK DTunnel não oferece API de storage nativa na versão atual.
 * Utilizamos localStorage do browser com prefixo '@sshtproject:' para isolamento.
 * No futuro, se o SDK adicionar storage nativo, essa abstração facilitará migração.
 */

const STORAGE_PREFIX = '@sshtproject:' as const;

/**
 * Tipos de dados suportados
 */
export type StorageValue = string | number | boolean | Record<string, any> | null;

/**
 * Salva um valor no storage (com namespace sshtproject)
 * ✅ Usa: localStorage do browser
 */
export function saveData<T extends StorageValue>(key: string, value: T): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
  } catch (error) {
    console.error(`Erro ao salvar ${key}:`, error);
  }
}

/**
 * Lê um valor do storage
 * ✅ Usa: localStorage do browser
 */
export function loadData<T extends StorageValue>(key: string, defaultValue?: T): T | null {
  try {
    const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!item) return defaultValue ?? null;

    try {
      return JSON.parse(item) as T;
    } catch {
      return item as T;
    }
  } catch (error) {
    console.error(`Erro ao ler ${key}:`, error);
    return defaultValue ?? null;
  }
}

/**
 * Remove um valor do storage
 * ✅ Usa: localStorage do browser
 */
export function removeData(key: string): void {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  } catch (error) {
    console.error(`Erro ao remover ${key}:`, error);
  }
}

/**
 * Limpa todos os dados do storage
 * ✅ Usa: localStorage do browser
 */
export function clearStorage(): void {
  try {
    // Remove apenas itens com prefixo @sshtproject:
    const keys = Array.from({ length: localStorage.length }, (_, i) =>
      localStorage.key(i)
    ).filter((key): key is string => key?.startsWith(STORAGE_PREFIX) ?? false);

    keys.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Erro ao limpar storage:', error);
  }
}

/**
 * Obtém todas as chaves armazenadas
 */
export function getStorageKeys(): string[] {
  try {
    // Checa se há método SDK para storage
    if (typeof (window as any).DtStorage !== 'undefined') {
      const result = call('DtStorage', 'keys');
      if (Array.isArray(result)) return result as string[];
    }

    // Fallback: localStorage
    return Array.from({ length: localStorage.length }, (_, i) => {
      const key = localStorage.key(i);
      return key?.startsWith(STORAGE_PREFIX) ? key.slice(STORAGE_PREFIX.length) : null;
    }).filter((k): k is string => k !== null);
  } catch (error) {
    console.error('Erro ao obter chaves:', error);
    return [];
  }
}

/**
 * Verifica se tem um valor armazenado
 */
export function hasData(key: string): boolean {
  try {
    const value = loadData(key);
    return value !== null;
  } catch {
    return false;
  }
}
