import { CredentialsResponse } from '../types/sales';
import { loadData, saveData, removeData } from './nativeStorage';

// =============================
// TIPOS
// =============================

export interface PendingPurchase {
  order_id: string;
  payment_id: string;
  amount: number;
  created_at: string;
  expires_at: string;
  status: 'pending' | 'monitoring' | 'completed' | 'cancelled' | 'expired';
  customer_email: string;
  plan_name?: string;
  qr_code?: string;
  ticket_url?: string;
  kind?: 'purchase' | 'renewal';
}

export type ValidationSource = 'sales' | 'renewal' | 'checkuser';

export interface SavedCredential {
  id: string;
  created_at: string;
  is_default: boolean;
  is_active: boolean;
  label?: string;
  payment_id?: string;
  payment_ids?: string[];
  ssh?: {
    username: string;
    password: string;
  };
  v2ray?: {
    uuid: string;
  };
  servers?: Array<{
    name: string;
    host: string;
    port: number;
  }>;
  validation?: {
    limit?: number;
    expiration_date?: string;
    count_connections?: number;
    expiration_days?: number;
    last_checked?: string;
    source?: ValidationSource;
  };
}

export interface NormalizedSalesCredentials {
  ssh?: { username: string; password: string; limit?: number; expiration_date?: string };
  v2ray?: { uuid: string; limit?: number; expiration_date?: string };
  servers?: Array<{ name: string; host: string; port: number }>;
}

const STALE_MS = 60 * 60 * 1000;

function normalizeKey(value?: string | null): string {
  return (value || '').trim().toLowerCase();
}

export function parseExpiration(value?: string | null): Date | null {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const br = trimmed.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/
  );
  if (br) {
    const day = parseInt(br[1], 10);
    const month = parseInt(br[2], 10) - 1;
    const year = parseInt(br[3], 10);
    const hasTime = Boolean(br[4]);
    const date = new Date(
      year,
      month,
      day,
      hasTime ? parseInt(br[4], 10) : 23,
      hasTime ? parseInt(br[5], 10) : 59,
      br[6] ? parseInt(br[6], 10) : 59
    );
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split('-').map(Number);
    return new Date(year, month - 1, day, 23, 59, 59);
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function normalizeSalesCredentials(response: CredentialsResponse): NormalizedSalesCredentials {
  const sshSrc = response.ssh_credentials || response.credentials?.ssh;
  const v2raySrc = response.v2ray_credentials || response.credentials?.v2ray;
  const servers =
    response.ssh_credentials?.servers ||
    response.v2ray_credentials?.servers ||
    [];

  return {
    ssh: sshSrc?.username
      ? {
          username: sshSrc.username,
          password: 'password' in sshSrc ? sshSrc.password || '' : '',
          limit: sshSrc.limit,
          expiration_date: sshSrc.expiration_date,
        }
      : undefined,
    v2ray: v2raySrc?.uuid
      ? {
          uuid: v2raySrc.uuid,
          limit: v2raySrc.limit,
          expiration_date: v2raySrc.expiration_date,
        }
      : undefined,
    servers,
  };
}

export function getCredentialIdentifier(credential: SavedCredential): string {
  return credential.ssh?.username || credential.v2ray?.uuid || '';
}

// =============================
// STORAGE MANAGER
// =============================

// ✅ Usar saveData/loadData do nativeStorage que já adiciona o prefixo
// Aqui apenas o nome da chave sem prefixo
const PENDING_PURCHASES_KEY = 'pending_purchases';
const SAVED_CREDENTIALS_KEY = 'saved_credentials';
const LAST_CHECK_KEY = 'last_check';

class PurchaseStorageManager {
  // =============================
  // COMPRAS PENDENTES
  // =============================

  /**
   * Salva uma compra pendente no localStorage
   */
  savePendingPurchase(purchase: PendingPurchase): void {
    try {
      const purchases = this.getPendingPurchases();
      
      // Remove duplicatas (mesmo order_id)
      const filtered = purchases.filter(p => p.order_id !== purchase.order_id);
      
      filtered.push({
        ...purchase,
        status: purchase.status || 'pending'
      });

      saveData(PENDING_PURCHASES_KEY, filtered);
    } catch (error) {
      // Error handling
    }
  }

  /**
   * Retorna todas as compras pendentes
   */
  getPendingPurchases(): PendingPurchase[] {
    try {
      const data = loadData<PendingPurchase[]>(PENDING_PURCHASES_KEY);
      if (!data) return [];
      
      const purchases: PendingPurchase[] = data ?? [];
      
      // Filtrar compras expiradas (mais de 24h)
      const now = new Date().getTime();
      const filtered = purchases.filter(p => {
        if (p.status === 'completed' || p.status === 'cancelled') {
          return false; // Remove finalizadas
        }
        
        const expiresAt = new Date(p.expires_at).getTime();
        const createdAt = new Date(p.created_at).getTime();
        const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
        
        // Remove se expirou ou foi criada há mais de 24h
        if (expiresAt < now || hoursSinceCreation > 24) {
          return false;
        }
        
        return true;
      });

      // Salvar lista filtrada
      if (filtered.length !== purchases.length) {
        saveData(PENDING_PURCHASES_KEY, filtered);
      }

      return filtered;
    } catch (error) {
      return [];
    }
  }

  /**
   * Atualiza o status de uma compra pendente
   */
  updatePurchaseStatus(
    order_id: string, 
    status: PendingPurchase['status']
  ): void {
    try {
      const purchases = this.getPendingPurchases();
      const updated = purchases.map(p => 
        p.order_id === order_id ? { ...p, status } : p
      );
      saveData(PENDING_PURCHASES_KEY, updated);
    } catch (error) {
      // Error handling
    }
  }

  /**
   * Remove uma compra pendente
   */
  removePendingPurchase(order_id: string): void {
    try {
      const purchases = this.getPendingPurchases();
      const filtered = purchases.filter(p => p.order_id !== order_id);
      saveData(PENDING_PURCHASES_KEY, filtered);
    } catch (error) {
      // Error handling
    }
  }

  /**
   * Limpa todas as compras pendentes
   */
  clearPendingPurchases(): void {
    try {
      removeData(PENDING_PURCHASES_KEY);
    } catch (error) {
      // Error handling
    }
  }

  // =============================
  // CREDENCIAIS SALVAS
  // =============================

  saveCredentials(credentials: CredentialsResponse, label?: string): string {
    return this.upsertFromSales(credentials, 'sales', label);
  }

  findCredentialByIdentity(username?: string, uuid?: string): SavedCredential | null {
    const userKey = normalizeKey(username);
    const uuidKey = normalizeKey(uuid);
    if (!userKey && !uuidKey) return null;

    return this.getSavedCredentials().find((credential) => {
      if (userKey && normalizeKey(credential.ssh?.username) === userKey) return true;
      if (uuidKey && normalizeKey(credential.v2ray?.uuid) === uuidKey) return true;
      return false;
    }) || null;
  }

  upsertFromSales(
    response: CredentialsResponse,
    source: ValidationSource = 'sales',
    label?: string
  ): string {
    try {
      const extracted = normalizeSalesCredentials(response);
      if (!extracted.ssh && !extracted.v2ray) return '';

      const saved = this.getSavedCredentials();
      const existing = this.findCredentialByIdentity(extracted.ssh?.username, extracted.v2ray?.uuid);
      const paymentId = response.payment_id ? String(response.payment_id) : undefined;
      const expirationDate = extracted.ssh?.expiration_date || extracted.v2ray?.expiration_date;
      const limit = extracted.ssh?.limit ?? extracted.v2ray?.limit;
      const now = new Date().toISOString();

      const validation = {
        limit,
        expiration_date: expirationDate,
        last_checked: now,
        source,
      };

      if (existing) {
        const target = saved.find((item) => item.id === existing.id);
        if (!target) return '';

        if (extracted.ssh) {
          target.ssh = {
            username: extracted.ssh.username,
            password: extracted.ssh.password || target.ssh?.password || '',
          };
        }
        if (extracted.v2ray) {
          target.v2ray = { uuid: extracted.v2ray.uuid };
        }
        if (extracted.servers?.length) {
          target.servers = extracted.servers;
        }

        const ids = new Set(
          [...(target.payment_ids || []), target.payment_id, paymentId].filter(Boolean) as string[]
        );
        target.payment_ids = Array.from(ids);
        if (paymentId) target.payment_id = paymentId;
        target.validation = { ...target.validation, ...validation };
        target.is_active = !this.isCredentialExpired(target);

        saveData(SAVED_CREDENTIALS_KEY, saved);
        return target.id;
      }

      const id = `cred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      let autoLabel = label;
      if (!autoLabel) {
        if (extracted.ssh && extracted.v2ray) autoLabel = `SSH + V2Ray - ${extracted.ssh.username}`;
        else if (extracted.ssh) autoLabel = `SSH - ${extracted.ssh.username}`;
        else if (extracted.v2ray) autoLabel = `V2Ray - ${extracted.v2ray.uuid.substring(0, 8)}...`;
        else autoLabel = 'Credencial';
      }

      const newCred: SavedCredential = {
        id,
        created_at: now,
        is_default: saved.length === 0,
        is_active: true,
        label: autoLabel,
        payment_id: paymentId,
        payment_ids: paymentId ? [paymentId] : [],
        ssh: extracted.ssh
          ? { username: extracted.ssh.username, password: extracted.ssh.password }
          : undefined,
        v2ray: extracted.v2ray ? { uuid: extracted.v2ray.uuid } : undefined,
        servers: extracted.servers || [],
        validation,
      };
      newCred.is_active = !this.isCredentialExpired(newCred);

      saved.push(newCred);
      saveData(SAVED_CREDENTIALS_KEY, saved);
      return id;
    } catch {
      return '';
    }
  }

  isValidationStale(credential: SavedCredential, maxAgeMs: number = STALE_MS): boolean {
    if (!credential.validation?.last_checked) return true;
    const checked = new Date(credential.validation.last_checked).getTime();
    if (Number.isNaN(checked)) return true;
    return Date.now() - checked > maxAgeMs;
  }

  /**
   * Adiciona credencial manualmente
   */
  addManualCredential(credential: Omit<SavedCredential, 'id' | 'created_at'>): string {
    try {
      const saved = this.getSavedCredentials();
      const id = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newCred: SavedCredential = {
        ...credential,
        id,
        created_at: new Date().toISOString(),
        is_default: credential.is_default || saved.length === 0
      };

      // Se marcar como default, desmarcar outras
      if (newCred.is_default) {
        saved.forEach(c => c.is_default = false);
      }

      saved.push(newCred);
      saveData(SAVED_CREDENTIALS_KEY, saved);
      return id;
    } catch (error) {
      return '';
    }
  }

  /**
   * Atualiza campos de uma credencial
   */
  updateCredential(id: string, updates: Partial<SavedCredential>): boolean {
    try {
      const credentials = this.getSavedCredentials();
      const target = credentials.find(c => c.id === id);
      
      if (!target) return false;

      Object.assign(target, updates);
      
      saveData(SAVED_CREDENTIALS_KEY, credentials);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Retorna todas as credenciais salvas
   */
  getSavedCredentials(): SavedCredential[] {
    try {
      const credentials = loadData<SavedCredential[]>(SAVED_CREDENTIALS_KEY);
      if (!credentials) return [];

      return credentials
        .map((credential) => ({
          ...credential,
          is_active: !this.isCredentialExpired(credential),
        }))
        .sort((a, b) => {
          if (a.is_default && !b.is_default) return -1;
          if (!a.is_default && b.is_default) return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    } catch {
      return [];
    }
  }

  /**
   * Obtém credencial por ID
   */
  getCredentialById(id: string): SavedCredential | null {
    const credentials = this.getSavedCredentials();
    return credentials.find(c => c.id === id) || null;
  }

  /**
   * Verifica se credencial já existe pelo payment_id
   */
  hasCredentialByPaymentId(paymentId: string | number): boolean {
    const id = String(paymentId);
    return this.getSavedCredentials().some(
      (c) => c.payment_id === id || c.payment_ids?.includes(id)
    );
  }

  /**
   * Obtém credencial padrão
   */
  getDefaultCredential(): SavedCredential | null {
    const credentials = this.getSavedCredentials();
    return credentials.find(c => c.is_default && c.is_active) || null;
  }

  /**
   * Define credencial como padrão
   */
  setDefaultCredential(id: string): boolean {
    try {
      const credentials = this.getSavedCredentials();
      const target = credentials.find(c => c.id === id);
      
      if (!target) return false;

      // Desmarcar todas as outras
      credentials.forEach(c => {
        c.is_default = c.id === id;
      });

      saveData(SAVED_CREDENTIALS_KEY, credentials);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Atualiza label da credencial
   */
  updateCredentialLabel(id: string, label: string): boolean {
    try {
      const credentials = this.getSavedCredentials();
      const target = credentials.find(c => c.id === id);
      
      if (!target) return false;

      target.label = label;
      saveData(SAVED_CREDENTIALS_KEY, credentials);
      return true;
    } catch (error) {

      return false;
    }
  }

  /**
   * Remove credencial
   */
  removeCredential(id: string): boolean {
    try {
      const credentials = this.getSavedCredentials();
      const filtered = credentials.filter(c => c.id !== id);
      
      if (filtered.length === credentials.length) return false;

        saveData(SAVED_CREDENTIALS_KEY, filtered);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Limpa todas as credenciais
   */
  clearAllCredentials(): void {
    try {
      removeData(SAVED_CREDENTIALS_KEY);
    } catch (error) {
      // Error handling
    }
  }

  isCredentialExpired(credential: SavedCredential): boolean {
    const days = credential.validation?.expiration_days;
    if (typeof days === 'number' && !Number.isNaN(days)) {
      return days <= 0;
    }
    const expiresAt = parseExpiration(credential.validation?.expiration_date);
    if (!expiresAt) return false;
    return expiresAt.getTime() < Date.now();
  }

  getDaysUntilExpiration(credential: SavedCredential): number {
    const days = credential.validation?.expiration_days;
    if (typeof days === 'number' && !Number.isNaN(days)) {
      return days;
    }
    const expiresAt = parseExpiration(credential.validation?.expiration_date);
    if (!expiresAt) return 999;
    return Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  updateValidation(id: string, validation: SavedCredential['validation']): boolean {
    try {
      const credentials = this.getSavedCredentials();
      const target = credentials.find((c) => c.id === id);
      if (!target) return false;

      target.validation = {
        ...target.validation,
        ...validation,
        last_checked: new Date().toISOString(),
      };
      target.is_active = !this.isCredentialExpired(target);

      saveData(SAVED_CREDENTIALS_KEY, credentials);
      return true;
    } catch {
      return false;
    }
  }

  // =============================
  // ÚLTIMA VERIFICAÇÃO
  // =============================

  /**
   * Salva timestamp da última verificação
   */
  setLastCheck(): void {
    try {
      saveData(LAST_CHECK_KEY, new Date().toISOString());
    } catch (error) {
      // Error handling
    }
  }

  /**
   * Retorna timestamp da última verificação
   */
  getLastCheck(): string | null {
    try {
      return loadData<string>(LAST_CHECK_KEY);
    } catch (error) {
      return null;
    }
  }
}

// Exportar instância singleton
export const purchaseStorage = new PurchaseStorageManager();

// Exportar classe para testes
export default PurchaseStorageManager;
