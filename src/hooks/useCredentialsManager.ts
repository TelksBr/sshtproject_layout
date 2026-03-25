import { useState, useEffect, useCallback } from 'react';
import { purchaseStorage, SavedCredential } from '../utils/purchaseStorageManager';
import { checkRenewalUser, purchaseRenewal } from '../utils/salesUtils';
import { checkUser } from '../utils/checkUserUtils';

export interface CredentialsManagerHook {
  credentials: SavedCredential[];
  loading: boolean;
  error: string | null;
  
  // Ações
  refreshCredentials: () => void;
  validateCredentials: (id: string) => Promise<boolean>;
  setDefault: (id: string) => boolean;
  updateLabel: (id: string, label: string) => boolean;
  removeCredential: (id: string) => boolean;
  addManualCredential: (credential: Omit<SavedCredential, 'id' | 'created_at'>) => string;
  clearAll: () => void;
  
  // Renovação
  checkRenewal: (username: string) => Promise<{ canRenew: boolean; message: string; data?: any }>;
  renewCredential: (username: string, planId: string) => Promise<{ success: boolean; message: string; data?: any }>;
  
  // Utilitários
  getDefaultCredential: () => SavedCredential | null;
  getActiveCredentials: () => SavedCredential[];
  getExpiredCredentials: () => SavedCredential[];
  getCredentialById: (id: string) => SavedCredential | null;
}

export function useCredentialsManager(): CredentialsManagerHook {
  const [credentials, setCredentials] = useState<SavedCredential[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar credenciais
  const refreshCredentials = useCallback(() => {
    try {
      setLoading(true);
      setError(null);
      const saved = purchaseStorage.getSavedCredentials();
      setCredentials(saved);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar ao montar
  useEffect(() => {
    refreshCredentials();
  }, [refreshCredentials]);

  // Validar credencial via CheckUser API
  const validateCredentials = useCallback(async (id: string): Promise<boolean> => {
    const credential = credentials.find(c => c.id === id);
    if (!credential) return false;

    try {
      setLoading(true);
      setError(null);
      
      let identifier = '';
      
      // Usar username SSH como identificador
      if (credential.ssh?.username) {
        identifier = credential.ssh.username;
      } 
      // Ou usar UUID V2Ray como identificador
      else if (credential.v2ray?.uuid) {
        identifier = credential.v2ray.uuid;
      } else {
        return false;
      }

      const result = await checkUser(identifier);
      
      if (result.success && result.data) {
        // Atualizar cache de validação
        purchaseStorage.updateValidation(id, {
          limit: result.data.limit,
          expiration_date: result.data.expiration_date,
          count_connections: result.data.count_connections,
          expiration_days: result.data.expiration_days
        });
        
        // Atualizar is_active baseado na expiração
        const isExpired = new Date(result.data.expiration_date).getTime() < Date.now();
        if (isExpired !== !credential.is_active) {
          purchaseStorage.updateCredential(id, { is_active: !isExpired });
        }
        
        refreshCredentials();
        return true;
      }
      
      return false;
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [credentials, refreshCredentials]);

  // Definir como padrão
  const setDefault = useCallback((id: string): boolean => {
    const success = purchaseStorage.setDefaultCredential(id);
    if (success) {
      refreshCredentials();
    }
    return success;
  }, [refreshCredentials]);

  // Atualizar label
  const updateLabel = useCallback((id: string, label: string): boolean => {
    const success = purchaseStorage.updateCredentialLabel(id, label);
    if (success) {
      refreshCredentials();
    }
    return success;
  }, [refreshCredentials]);

  // Remover credencial
  const removeCredential = useCallback((id: string): boolean => {
    const success = purchaseStorage.removeCredential(id);
    if (success) {
      refreshCredentials();
    }
    return success;
  }, [refreshCredentials]);

  // Adicionar credencial manual
  const addManualCredential = useCallback((
    credential: Omit<SavedCredential, 'id' | 'created_at'>
  ): string => {
    const id = purchaseStorage.addManualCredential(credential);
    if (id) {
      refreshCredentials();
    }
    return id;
  }, [refreshCredentials]);

  // Limpar todas
  const clearAll = useCallback(() => {
    purchaseStorage.clearAllCredentials();
    refreshCredentials();
  }, [refreshCredentials]);

  // Verificar renovação
  const checkRenewal = useCallback(async (identifier: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await checkRenewalUser(identifier);
      
      return {
        canRenew: response.data?.can_renew || false,
        message: response.message,
        data: response.data
      };
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      return {
        canRenew: false,
        message: error.message
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Renovar credencial
  const renewCredential = useCallback(async (identifier: string, planId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await purchaseRenewal(identifier, planId);
      
      return {
        success: response.success,
        message: response.message,
        data: response.data
      };
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      return {
        success: false,
        message: error.message
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Obter credencial padrão
  const getDefaultCredential = useCallback(() => {
    return purchaseStorage.getDefaultCredential();
  }, []);

  // Obter credenciais ativas
  const getActiveCredentials = useCallback(() => {
    return credentials.filter(c => {
      if (!c.is_active) return false;
      return !purchaseStorage.isCredentialExpired(c);
    });
  }, [credentials]);

  // Obter credenciais expiradas
  const getExpiredCredentials = useCallback(() => {
    return credentials.filter(c => purchaseStorage.isCredentialExpired(c));
  }, [credentials]);

  // Obter credencial por ID
  const getCredentialById = useCallback((id: string) => {
    return purchaseStorage.getCredentialById(id);
  }, []);

  return {
    credentials,
    loading,
    error,
    
    // Ações
    refreshCredentials,
    validateCredentials,
    setDefault,
    updateLabel,
    removeCredential,
    addManualCredential,
    clearAll,
    
    // Renovação
    checkRenewal,
    renewCredential,
    
    // Utilitários
    getDefaultCredential,
    getActiveCredentials,
    getExpiredCredentials,
    getCredentialById
  };
}

export default useCredentialsManager;
