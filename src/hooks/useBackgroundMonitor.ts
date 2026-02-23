import { useEffect, useCallback, useRef } from 'react';
import { purchaseMonitor, PurchaseMonitorCallbacks } from '../utils/backgroundPurchaseMonitor';
import { purchaseStorage, PendingPurchase } from '../utils/purchaseStorageManager';
import { paymentNotificationManager } from '../utils/paymentNotificationManager';
import { CredentialsResponse } from '../types/sales';

export interface BackgroundMonitorHook {
  isMonitoring: boolean;
  pendingCount: number;
  forceCheck: () => Promise<void>;
  stats: {
    isRunning: boolean;
    pendingCount: number;
    checkInterval: number;
    lastCheck: string | null;
  };
}

export interface BackgroundMonitorOptions {
  /**
   * Habilitar/desabilitar monitor (padrão: true apenas se houver compras pendentes)
   * Defina como false para desabilitar completamente em webview
   */
  enabled?: boolean;
  
  /**
   * Mostra notificação quando compra for aprovada
   */
  onPurchaseCompleted?: (purchase: PendingPurchase, credentials: CredentialsResponse) => void;
  
  /**
   * Callback quando compra for cancelada
   */
  onPurchaseCancelled?: (purchase: PendingPurchase) => void;
  
  /**
   * Callback quando compra expirar
   */
  onPurchaseExpired?: (purchase: PendingPurchase) => void;
  
  /**
   * Callback de erro
   */
  onError?: (purchase: PendingPurchase, error: Error) => void;
}

/**
 * Hook para inicializar e gerenciar o monitor de compras em background
 * 
 * Este hook deve ser usado no componente principal (App.tsx) para garantir
 * que o monitor seja iniciado automaticamente quando a aplicação carregar
 */
export function useBackgroundMonitor(options?: BackgroundMonitorOptions): BackgroundMonitorHook {
  const optionsRef = useRef(options);
  const isInitializedRef = useRef(false);

  // Atualizar ref quando options mudar
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Inicializar monitor automaticamente
  useEffect(() => {
    // Evitar dupla inicialização
    if (isInitializedRef.current) {
      return;
    }

    isInitializedRef.current = true;

    // Se desabilitado explicitamente, não iniciar
    if (options?.enabled === false) {
      return;
    }

    // Verificar se há compras pendentes
    const pending = purchaseStorage.getPendingPurchases();
    
    // Só inicia se houver compras pendentes (otimização webview)
    if (pending.length > 0) {
      // Callbacks padrão
      const callbacks: PurchaseMonitorCallbacks = {
        onPurchaseCompleted: (purchase, credentials) => {
          // Mostrar notificação popup
          paymentNotificationManager.notifyPaymentApproved(
            purchase.order_id,
            purchase.amount,
            purchase.plan_name
          );
          
          // Mostrar notificação nativa se suportado
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🎉 Compra Aprovada!', {
              body: `${purchase.plan_name || 'Sua compra'} foi aprovada! Credenciais prontas.`,
              icon: '/logo.png',
              tag: purchase.order_id
            });
          }
          
          // Chamar callback personalizado
          optionsRef.current?.onPurchaseCompleted?.(purchase, credentials);
        },
        
        onPurchaseCancelled: (purchase) => {
          optionsRef.current?.onPurchaseCancelled?.(purchase);
        },
        
        onPurchaseExpired: (purchase) => {
          optionsRef.current?.onPurchaseExpired?.(purchase);
        },
        
        onError: (purchase, error) => {
          optionsRef.current?.onError?.(purchase, error);
        }
      };

      // Iniciar monitor
      purchaseMonitor.start(callbacks);
    }

    // Solicitar permissão para notificações (apenas se enabled !== false)
    if (options?.enabled !== false && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Cleanup ao desmontar
    return () => {
      purchaseMonitor.stop();
      isInitializedRef.current = false;
    };
  }, [options?.enabled]);

  // Forçar verificação
  const forceCheck = useCallback(async () => {
    await purchaseMonitor.forceCheck();
  }, []);

  // Retornar stats e controles
  const stats = purchaseMonitor.getStats();

  return {
    isMonitoring: stats.isRunning,
    pendingCount: stats.pendingCount,
    forceCheck,
    stats
  };
}

export default useBackgroundMonitor;
