import { useState, useEffect, useCallback } from 'react';
import { paymentNotificationManager, PaymentNotification } from '../utils/paymentNotificationManager';
import { purchaseStorage, PendingPurchase } from '../utils/purchaseStorageManager';
import { CredentialsResponse } from '../types/sales';

export interface UsePurchaseNotificationsResult {
  notifications: PaymentNotification[];
  dismissNotification: (orderId: string) => void;
}

/**
 * Hook para gerenciar notificações de pagamento
 * Deve ser usado em componente de nível superior (App.tsx)
 */
export function usePurchaseNotifications(): UsePurchaseNotificationsResult {
  const [notifications, setNotifications] = useState<PaymentNotification[]>([]);

  // Configurar callbacks do notification manager
  useEffect(() => {
    paymentNotificationManager.setCallbacks({
      onNotification: (notification) => {
        setNotifications((prev) => {
          // Evitar duplicatas
          if (prev.some((n) => n.order_id === notification.order_id)) {
            return prev;
          }
          return [...prev, notification];
        });
      },
      onDismiss: (orderId) => {
        setNotifications((prev) => prev.filter((n) => n.order_id !== orderId));
      }
    });

    // Limpar notificações antigas ao montar
    paymentNotificationManager.clearOldNotifications();
  }, []);

  // Callback de pagamento aprovado (para usar em background monitor)
  const handlePaymentApproved = useCallback(
    (purchase: PendingPurchase, credentials: CredentialsResponse) => {
      paymentNotificationManager.notifyPaymentApproved(
        purchase.order_id,
        purchase.amount,
        purchase.plan_name
      );
    },
    []
  );

  // Descartar notificação
  const dismissNotification = useCallback((orderId: string) => {
    paymentNotificationManager.dismissNotification(orderId);
  }, []);

  return {
    notifications,
    dismissNotification,
    handlePaymentApproved
  } as any;
}

export default usePurchaseNotifications;
