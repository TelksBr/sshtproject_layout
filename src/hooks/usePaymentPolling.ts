import { useState, useEffect, useRef, useCallback } from 'react';
import { getCredentials } from '../utils/salesUtils';

interface PaymentPollingResult {
  isPolling: boolean;
  credentials: any;
  error: string | null;
  attempts: number;
  maxAttempts: number;
  resetPolling: () => void;
}

const usePaymentPolling = (paymentId: string | null): PaymentPollingResult => {
  const [isPolling, setIsPolling] = useState(false);
  const [credentials, setCredentials] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const attemptsRef = useRef(0);
  
  // Configuração fixa: 15 minutos com verificações a cada 10 segundos
  const EXPIRATION_MINUTES = 15;
  const INTERVAL_SECONDS = 10;
  const maxAttempts = Math.floor((EXPIRATION_MINUTES * 60) / INTERVAL_SECONDS); // 90 tentativas

  const clearCache = async () => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
    } catch (e) {
      // Silencioso - não precisa log
    }
  };

  const checkPaymentStatus = useCallback(async () => {
    if (!paymentId) return;

    try {
      attemptsRef.current += 1;
      setAttempts(attemptsRef.current);

      // Limpar cache antes de cada verificação
      await clearCache();

      const credentialsResponse = await getCredentials(paymentId);

      if (credentialsResponse?.status === 'completed' && 
          (credentialsResponse.ssh_credentials || credentialsResponse.v2ray_credentials)) {
        setCredentials(credentialsResponse);
        setIsPolling(false);
        setError(null);
        
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }

      // Verificar se atingiu o limite de tentativas
      if (attemptsRef.current >= maxAttempts) {
        setIsPolling(false);
        setError('Tempo limite para verificação do pagamento foi atingido');
        
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }

    } catch (err) {
      const error = err as Error;
      setError(error.message);

      // Em caso de erro crítico, parar o polling
      if (attemptsRef.current >= 3 || error.message.includes('404') || error.message.includes('401')) {
        setIsPolling(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }
  }, [paymentId, maxAttempts]);

  const startPolling = useCallback(() => {
    if (!paymentId || isPolling) return;

    setIsPolling(true);
    setError(null);
    setCredentials(null);
    attemptsRef.current = 0;
    setAttempts(0);

    // Primeira verificação imediata
    checkPaymentStatus();

    // Configurar intervalo
    intervalRef.current = setInterval(checkPaymentStatus, INTERVAL_SECONDS * 1000);
  }, [paymentId, isPolling, checkPaymentStatus]);

  const resetPolling = useCallback(() => {
    setIsPolling(false);
    setCredentials(null);
    setError(null);
    setAttempts(0);
    attemptsRef.current = 0;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Iniciar polling automaticamente quando paymentId for fornecido
  useEffect(() => {
    if (paymentId && !isPolling && !credentials) {
      startPolling();
    }
  }, [paymentId, startPolling, isPolling, credentials]);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isPolling,
    credentials,
    error,
    attempts,
    maxAttempts,
    resetPolling
  };
};

export default usePaymentPolling;