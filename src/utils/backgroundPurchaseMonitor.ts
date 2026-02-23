import { getCredentials } from './salesUtils';
import { purchaseStorage, PendingPurchase } from './purchaseStorageManager';
import { CredentialsResponse } from '../types/sales';

// =============================
// TIPOS
// =============================

export interface PurchaseMonitorCallbacks {
  onPurchaseCompleted?: (purchase: PendingPurchase, credentials: CredentialsResponse) => void;
  onPurchaseCancelled?: (purchase: PendingPurchase) => void;
  onPurchaseExpired?: (purchase: PendingPurchase) => void;
  onError?: (purchase: PendingPurchase, error: Error) => void;
}

// =============================
// BACKGROUND PURCHASE MONITOR
// =============================

class BackgroundPurchaseMonitor {
  private intervalId: NodeJS.Timeout | null = null;
  private isMonitoring: boolean = false;
  private callbacks: PurchaseMonitorCallbacks = {};
  private checkInterval: number = 15000; // 15 segundos
  private maxConsecutiveErrors: number = 3;
  private errorCount: Map<string, number> = new Map();

  /**
   * Inicia o monitoramento de compras pendentes
   */
  start(callbacks?: PurchaseMonitorCallbacks): void {
    if (this.isMonitoring) {
      return;
    }

    this.callbacks = callbacks || {};
    this.isMonitoring = true;

    // Verificar imediatamente
    this.checkPendingPurchases();

    // Configurar intervalo
    this.intervalId = setInterval(() => {
      this.checkPendingPurchases();
    }, this.checkInterval);
  }

  /**
   * Para o monitoramento
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isMonitoring = false;
    this.errorCount.clear();
  }

  /**
   * Verifica se está monitorando
   */
  isRunning(): boolean {
    return this.isMonitoring;
  }

  /**
   * Verifica todas as compras pendentes
   */
  private async checkPendingPurchases(): Promise<void> {
    const purchases = purchaseStorage.getPendingPurchases();

    if (purchases.length === 0) {
      return;
    }

    // Verificar cada compra em paralelo
    const promises = purchases.map(purchase => this.checkSinglePurchase(purchase));
    await Promise.allSettled(promises);

    // Atualizar timestamp da última verificação
    purchaseStorage.setLastCheck();
  }

  /**
   * Verifica uma única compra
   */
  private async checkSinglePurchase(purchase: PendingPurchase): Promise<void> {
    try {
      // Verificar se expirou
      const now = new Date().getTime();
      const expiresAt = new Date(purchase.expires_at).getTime();
      
      if (expiresAt < now) {
        this.handleExpiredPurchase(purchase);
        return;
      }

      // Marcar como monitorando
      if (purchase.status === 'pending') {
        purchaseStorage.updatePurchaseStatus(purchase.order_id, 'monitoring');
      }

      // Buscar credenciais
      const credentials = await getCredentials(purchase.payment_id);

      // Verificar se está completa
      if (credentials.status === 'completed') {
        const hasCredentials = 
          credentials.ssh_credentials || 
          credentials.v2ray_credentials ||
          (credentials.credentials?.ssh || credentials.credentials?.v2ray);

        if (hasCredentials) {
          this.handleCompletedPurchase(purchase, credentials);
          this.resetErrorCount(purchase.order_id);
          return;
        }
      }

      // Verificar se foi cancelada
      if (credentials.status === 'cancelled' || credentials.status === 'expired') {
        this.handleCancelledPurchase(purchase);
        return;
      }

      // Ainda pendente - resetar contagem de erros
      this.resetErrorCount(purchase.order_id);

    } catch (error) {
      this.handlePurchaseError(purchase, error as Error);
    }
  }

  /**
   * Trata compra completada
   */
  private handleCompletedPurchase(
    purchase: PendingPurchase, 
    credentials: CredentialsResponse
  ): void {
    // Atualizar status
    purchaseStorage.updatePurchaseStatus(purchase.order_id, 'completed');

    // Salvar credenciais (verifica duplicação automaticamente)
    const label = purchase.plan_name 
      ? `Compra ${purchase.plan_name}` 
      : 'Compra Recente';
    
    purchaseStorage.saveCredentials(credentials, label);

    // Remover da lista de pendentes após um delay
    setTimeout(() => {
      purchaseStorage.removePendingPurchase(purchase.order_id);
    }, 5000);

    // Chamar callback
    if (this.callbacks.onPurchaseCompleted) {
      this.callbacks.onPurchaseCompleted(purchase, credentials);
    }
  }

  /**
   * Trata compra cancelada
   */
  private handleCancelledPurchase(purchase: PendingPurchase): void {
    // Atualizar status
    purchaseStorage.updatePurchaseStatus(purchase.order_id, 'cancelled');

    // Remover da lista de pendentes
    setTimeout(() => {
      purchaseStorage.removePendingPurchase(purchase.order_id);
    }, 3000);

    // Chamar callback
    if (this.callbacks.onPurchaseCancelled) {
      this.callbacks.onPurchaseCancelled(purchase);
    }
  }

  /**
   * Trata compra expirada
   */
  private handleExpiredPurchase(purchase: PendingPurchase): void {
    // Atualizar status
    purchaseStorage.updatePurchaseStatus(purchase.order_id, 'expired');

    // Remover da lista de pendentes
    setTimeout(() => {
      purchaseStorage.removePendingPurchase(purchase.order_id);
    }, 3000);

    // Chamar callback
    if (this.callbacks.onPurchaseExpired) {
      this.callbacks.onPurchaseExpired(purchase);
    }
  }

  /**
   * Trata erro ao verificar compra
   */
  private handlePurchaseError(purchase: PendingPurchase, error: Error): void {
    const currentErrors = this.errorCount.get(purchase.order_id) || 0;
    const newErrorCount = currentErrors + 1;

    this.errorCount.set(purchase.order_id, newErrorCount);

    // Se atingiu o máximo de erros consecutivos, remove da lista
    if (newErrorCount >= this.maxConsecutiveErrors) {
      purchaseStorage.removePendingPurchase(purchase.order_id);
      this.errorCount.delete(purchase.order_id);
    }

    // Chamar callback de erro
    if (this.callbacks.onError) {
      this.callbacks.onError(purchase, error);
    }
  }

  /**
   * Reseta contagem de erros para uma compra
   */
  private resetErrorCount(orderId: string): void {
    this.errorCount.delete(orderId);
  }

  /**
   * Adiciona uma compra para monitoramento
   */
  addPurchase(purchase: PendingPurchase): void {
    purchaseStorage.savePendingPurchase(purchase);
    
    // Se não está monitorando, verificar imediatamente
    if (!this.isMonitoring) {
      this.checkSinglePurchase(purchase);
    }
  }

  /**
   * Remove uma compra do monitoramento
   */
  removePurchase(orderId: string): void {
    purchaseStorage.removePendingPurchase(orderId);
    this.errorCount.delete(orderId);
  }

  /**
   * Retorna estatísticas do monitor
   */
  getStats(): {
    isRunning: boolean;
    pendingCount: number;
    checkInterval: number;
    lastCheck: string | null;
  } {
    return {
      isRunning: this.isMonitoring,
      pendingCount: purchaseStorage.getPendingPurchases().length,
      checkInterval: this.checkInterval,
      lastCheck: purchaseStorage.getLastCheck()
    };
  }

  /**
   * Força verificação imediata
   */
  forceCheck(): Promise<void> {
    return this.checkPendingPurchases();
  }
}

// Exportar instância singleton
export const purchaseMonitor = new BackgroundPurchaseMonitor();

// Exportar classe para testes
export default BackgroundPurchaseMonitor;
