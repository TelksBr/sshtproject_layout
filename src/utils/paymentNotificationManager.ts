/**
 * Payment Notification Manager
 * Gerencia notificações de pagamento aprovado com popup, toast e badges
 */

export interface PaymentNotification {
  order_id: string;
  message: string;
  amount: number;
  plan_name?: string;
  timestamp: number;
  shown: boolean;
}

class PaymentNotificationManager {
  private notifications: Map<string, PaymentNotification> = new Map();
  private callbacks: {
    onNotification?: (notification: PaymentNotification) => void;
    onDismiss?: (orderId: string) => void;
  } = {};

  /**
   * Registra callbacks para notificações
   */
  setCallbacks(callbacks: { onNotification?: (notification: PaymentNotification) => void; onDismiss?: (orderId: string) => void }) {
    this.callbacks = callbacks;
  }

  /**
   * Cria e exibe notificação de pagamento aprovado
   */
  notifyPaymentApproved(
    order_id: string,
    amount: number,
    plan_name?: string
  ): PaymentNotification {
    const notification: PaymentNotification = {
      order_id,
      message: `✅ Pagamento de ${plan_name || `R$ ${amount}`} foi aprovado!`,
      amount,
      plan_name,
      timestamp: Date.now(),
      shown: false
    };

    this.notifications.set(order_id, notification);

    // Chamar callback para renderizar UI
    if (this.callbacks.onNotification) {
      notification.shown = true;
      this.callbacks.onNotification(notification);
    }

    // Tenta notificação nativa se disponível
    this.tryNativeNotification(notification);

    return notification;
  }

  /**
   * Tenta usar API nativa de notificações do Android
   */
  private tryNativeNotification(notification: PaymentNotification) {
    try {
      if ('DTunnel' in window) {
        const dTunnel = (window as any).DTunnel;
        if (dTunnel?.toast) {
          dTunnel.toast({
            message: notification.message,
            duration: 3000
          });
        }
      }
    } catch (error) {
      // Silencio - falha graciosa
    }
  }

  /**
   * Obtém notificação não exibida
   */
  getPendingNotifications(): PaymentNotification[] {
    return Array.from(this.notifications.values()).filter(n => !n.shown);
  }

  /**
   * Marca notificação como exibida
   */
  markAsShown(orderId: string): void {
    const notification = this.notifications.get(orderId);
    if (notification) {
      notification.shown = true;
    }
  }

  /**
   * Descarta notificação
   */
  dismissNotification(orderId: string): void {
    this.notifications.delete(orderId);
    if (this.callbacks.onDismiss) {
      this.callbacks.onDismiss(orderId);
    }
  }

  /**
   * Limpa notificações antigas (>1 hora)
   */
  clearOldNotifications(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [key, notification] of this.notifications.entries()) {
      if (notification.timestamp < oneHourAgo) {
        this.notifications.delete(key);
      }
    }
  }
}

export const paymentNotificationManager = new PaymentNotificationManager();

export default PaymentNotificationManager;
