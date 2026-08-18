import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getCredentialIdentifier,
  purchaseStorage,
  SavedCredential,
} from '../utils/purchaseStorageManager';
import { checkRenewalUser, purchaseRenewal } from '../utils/salesUtils';
import { checkUser } from '../utils/checkUserUtils';

export interface CredentialsManagerHook {
  credentials: SavedCredential[];
  loading: boolean;
  validatingAll: boolean;
  error: string | null;

  refreshCredentials: () => void;
  validateCredentials: (id: string) => Promise<boolean>;
  validateAll: (force?: boolean) => Promise<void>;
  setDefault: (id: string) => boolean;
  updateLabel: (id: string, label: string) => boolean;
  removeCredential: (id: string) => boolean;
  addManualCredential: (credential: Omit<SavedCredential, 'id' | 'created_at'>) => string;
  clearAll: () => void;

  checkRenewal: (username: string) => Promise<{ canRenew: boolean; message: string; data?: any }>;
  renewCredential: (username: string, planId: string) => Promise<{ success: boolean; message: string; data?: any }>;

  getDefaultCredential: () => SavedCredential | null;
  getActiveCredentials: () => SavedCredential[];
  getExpiredCredentials: () => SavedCredential[];
  getCredentialById: (id: string) => SavedCredential | null;
}

async function validateOne(id: string): Promise<boolean> {
  const credential = purchaseStorage.getCredentialById(id);
  if (!credential) return false;

  const identifier = getCredentialIdentifier(credential);
  if (!identifier) return false;

  const result = await checkUser(identifier);
  if (!result.success || !result.data) return false;

  purchaseStorage.updateValidation(id, {
    limit: result.data.limit,
    expiration_date: result.data.expiration_date,
    count_connections: result.data.count_connections,
    expiration_days: result.data.expiration_days,
    source: 'checkuser',
  });
  return true;
}

export function useCredentialsManager(): CredentialsManagerHook {
  const [credentials, setCredentials] = useState<SavedCredential[]>([]);
  const [loading, setLoading] = useState(false);
  const [validatingAll, setValidatingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const validatingRef = useRef(false);

  const refreshCredentials = useCallback(() => {
    try {
      setError(null);
      setCredentials(purchaseStorage.getSavedCredentials());
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  const validateCredentials = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      const success = await validateOne(id);
      refreshCredentials();
      return success;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  }, [refreshCredentials]);

  const validateAll = useCallback(async (force = false) => {
    if (validatingRef.current) return;
    validatingRef.current = true;
    setValidatingAll(true);
    try {
      const saved = purchaseStorage.getSavedCredentials();
      const targets = force
        ? saved
        : saved.filter(
            (item) =>
              purchaseStorage.isCredentialExpired(item) ||
              purchaseStorage.isValidationStale(item)
          );

      await Promise.allSettled(targets.map((item) => validateOne(item.id)));
      refreshCredentials();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      validatingRef.current = false;
      setValidatingAll(false);
    }
  }, [refreshCredentials]);

  useEffect(() => {
    refreshCredentials();
    validateAll(false);
  }, [refreshCredentials, validateAll]);

  const setDefault = useCallback((id: string): boolean => {
    const success = purchaseStorage.setDefaultCredential(id);
    if (success) refreshCredentials();
    return success;
  }, [refreshCredentials]);

  const updateLabel = useCallback((id: string, label: string): boolean => {
    const success = purchaseStorage.updateCredentialLabel(id, label);
    if (success) refreshCredentials();
    return success;
  }, [refreshCredentials]);

  const removeCredential = useCallback((id: string): boolean => {
    const success = purchaseStorage.removeCredential(id);
    if (success) refreshCredentials();
    return success;
  }, [refreshCredentials]);

  const addManualCredential = useCallback((
    credential: Omit<SavedCredential, 'id' | 'created_at'>
  ): string => {
    const id = purchaseStorage.addManualCredential(credential);
    if (id) refreshCredentials();
    return id;
  }, [refreshCredentials]);

  const clearAll = useCallback(() => {
    purchaseStorage.clearAllCredentials();
    refreshCredentials();
  }, [refreshCredentials]);

  const checkRenewal = useCallback(async (identifier: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await checkRenewalUser(identifier);
      return {
        canRenew: response.data?.can_renew || false,
        message: response.message,
        data: response.data,
      };
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      return { canRenew: false, message: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const renewCredential = useCallback(async (identifier: string, planId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await purchaseRenewal(identifier, planId);
      return {
        success: response.success,
        message: response.message,
        data: response.data,
      };
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getDefaultCredential = useCallback(() => purchaseStorage.getDefaultCredential(), []);

  const getActiveCredentials = useCallback(() => {
    return credentials.filter((c) => !purchaseStorage.isCredentialExpired(c));
  }, [credentials]);

  const getExpiredCredentials = useCallback(() => {
    return credentials.filter((c) => purchaseStorage.isCredentialExpired(c));
  }, [credentials]);

  const getCredentialById = useCallback((id: string) => {
    return purchaseStorage.getCredentialById(id);
  }, []);

  return {
    credentials,
    loading,
    validatingAll,
    error,
    refreshCredentials,
    validateCredentials,
    validateAll,
    setDefault,
    updateLabel,
    removeCredential,
    addManualCredential,
    clearAll,
    checkRenewal,
    renewCredential,
    getDefaultCredential,
    getActiveCredentials,
    getExpiredCredentials,
    getCredentialById,
  };
}

export default useCredentialsManager;
