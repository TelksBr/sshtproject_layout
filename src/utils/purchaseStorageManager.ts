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
}

export interface SavedCredential {
  id: string;
  created_at: string;
  is_default: boolean;
  is_active: boolean;
  label?: string; // Nome personalizado pelo usuário
  payment_id?: string;
  
  // Credenciais SSH (opcional)
  ssh?: {
    username: string;
    password: string;
  };
  
  // Credenciais V2Ray (opcional)
  v2ray?: {
    uuid: string;
  };
  
  // Servidores disponíveis
  servers?: Array<{
    name: string;
    host: string;
    port: number;
  }>;
  
  // Dados de validação (obtidos via CheckUser) - cache
  validation?: {
    limit?: number;
    expiration_date?: string;
    count_connections?: number;
    expiration_days?: number;
    last_checked?: string;
  };
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

  /**
   * Salva credenciais no localStorage (SSH e V2Ray juntos)
   */
  saveCredentials(credentials: CredentialsResponse, label?: string): string {
    try {
      // Verificar se já existe credencial com este payment_id
      if (credentials.payment_id && this.hasCredentialByPaymentId(credentials.payment_id)) {
        return ''; // Retorna vazio para indicar que não salvou
      }
      
      const saved = this.getSavedCredentials();
      
      // Gerar ID único
      const id = `cred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Criar credencial unificada (SSH + V2Ray juntos)
      const newCred: SavedCredential = {
        id,
        created_at: new Date().toISOString(),
        is_default: saved.length === 0,
        is_active: true,
        payment_id: String(credentials.payment_id),
        servers: []
      };
      
      // Adicionar SSH se disponível
      if (credentials.ssh_credentials) {
        newCred.ssh = {
          username: credentials.ssh_credentials.username,
          password: credentials.ssh_credentials.password
        };
        newCred.servers = credentials.ssh_credentials.servers || [];
        
        // Cache dos dados de validação
        newCred.validation = {
          limit: credentials.ssh_credentials.limit,
          expiration_date: credentials.ssh_credentials.expiration_date,
          last_checked: new Date().toISOString()
        };
      }
      
      // Adicionar V2Ray se disponível
      if (credentials.v2ray_credentials) {
        newCred.v2ray = {
          uuid: credentials.v2ray_credentials.uuid
        };
        
        // Se não tinha servers do SSH, usar do V2Ray
        if (!newCred.servers?.length) {
          newCred.servers = credentials.v2ray_credentials.servers || [];
        }
        
        // Cache dos dados de validação (se SSH não definiu)
        if (!newCred.validation) {
          newCred.validation = {
            limit: credentials.v2ray_credentials.limit,
            expiration_date: credentials.v2ray_credentials.expiration_date,
            last_checked: new Date().toISOString()
          };
        }
      }
      
      // Suporte para formato legado (renovação)
      if (credentials.credentials) {
        if (credentials.credentials.ssh) {
          newCred.ssh = {
            username: credentials.credentials.ssh.username,
            password: credentials.credentials.ssh.password
          };
          newCred.validation = {
            limit: credentials.credentials.ssh.limit,
            expiration_date: credentials.credentials.ssh.expiration_date,
            last_checked: new Date().toISOString()
          };
        }
        if (credentials.credentials.v2ray) {
          newCred.v2ray = {
            uuid: credentials.credentials.v2ray.uuid
          };
          if (!newCred.validation) {
            newCred.validation = {
              limit: credentials.credentials.v2ray.limit,
              expiration_date: credentials.credentials.v2ray.expiration_date,
              last_checked: new Date().toISOString()
            };
          }
        }
      }
      
      // Gerar label automático
      if (!label) {
        if (newCred.ssh && newCred.v2ray) {
          label = `SSH + V2Ray - ${newCred.ssh.username}`;
        } else if (newCred.ssh) {
          label = `SSH - ${newCred.ssh.username}`;
        } else if (newCred.v2ray) {
          label = `V2Ray - ${newCred.v2ray.uuid.substring(0, 8)}...`;
        } else {
          label = 'Credencial';
        }
      }
      newCred.label = label;
      
      saved.push(newCred);
      saveData(SAVED_CREDENTIALS_KEY, saved);
      return id;
    } catch (error) {
      return '';
    }
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
      
      // Filtrar credenciais expiradas (opcional - manter para histórico)
      return credentials.sort((a, b) => {
        // Default primeiro
        if (a.is_default && !b.is_default) return -1;
        if (!a.is_default && b.is_default) return 1;
        
        // Mais recente primeiro
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    } catch (error) {
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
    const credentials = this.getSavedCredentials();
    return credentials.some(c => c.payment_id === String(paymentId));
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

  /**
   * Verifica se credencial está expirada (baseado no cache de validação)
   */
  isCredentialExpired(credential: SavedCredential): boolean {
    if (!credential.validation?.expiration_date) return false;
    const now = new Date().getTime();
    const expiresAt = new Date(credential.validation.expiration_date).getTime();
    return expiresAt < now;
  }

  /**
   * Retorna dias até expiração (baseado no cache de validação)
   */
  getDaysUntilExpiration(credential: SavedCredential): number {
    if (!credential.validation?.expiration_date) return 999;
    const now = new Date().getTime();
    const expiresAt = new Date(credential.validation.expiration_date).getTime();
    const diff = expiresAt - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
  
  /**
   * Atualiza dados de validação (cache do CheckUser)
   */
  updateValidation(id: string, validation: SavedCredential['validation']): boolean {
    try {
      const credentials = this.getSavedCredentials();
      const target = credentials.find(c => c.id === id);
      
      if (!target) return false;

      target.validation = {
        ...validation,
        last_checked: new Date().toISOString()
      };
      
      saveData(SAVED_CREDENTIALS_KEY, credentials);
      return true;
    } catch (error) {
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
