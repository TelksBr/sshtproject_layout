/**
 * Payment Logger
 * Sistema de logging para debug de pagamentos e compras
 */

export enum PaymentLogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export interface PaymentLog {
  level: PaymentLogLevel;
  timestamp: string;
  message: string;
  data?: any;
  orderId?: string;
  paymentId?: string;
}

class PaymentLogger {
  private logs: PaymentLog[] = [];
  private maxLogs: number = 100;
  private enabled: boolean = true;
  private logToConsole: boolean = true;

  /**
   * Habilita/desabilita logging
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Habilita/desabilita console log
   */
  setConsoleLogging(enabled: boolean): void {
    this.logToConsole = enabled;
  }

  /**
   * Log de debug
   */
  debug(message: string, data?: any, orderId?: string, paymentId?: string): void {
    this.addLog(PaymentLogLevel.DEBUG, message, data, orderId, paymentId);
  }

  /**
   * Log de info
   */
  info(message: string, data?: any, orderId?: string, paymentId?: string): void {
    this.addLog(PaymentLogLevel.INFO, message, data, orderId, paymentId);
  }

  /**
   * Log de warning
   */
  warn(message: string, data?: any, orderId?: string, paymentId?: string): void {
    this.addLog(PaymentLogLevel.WARN, message, data, orderId, paymentId);
  }

  /**
   * Log de erro
   */
  error(message: string, data?: any, orderId?: string, paymentId?: string): void {
    this.addLog(PaymentLogLevel.ERROR, message, data, orderId, paymentId);
  }

  /**
   * Adiciona log à lista
   */
  private addLog(
    level: PaymentLogLevel,
    message: string,
    data?: any,
    orderId?: string,
    paymentId?: string
  ): void {
    if (!this.enabled) return;

    const log: PaymentLog = {
      level,
      timestamp: new Date().toISOString(),
      message,
      data,
      orderId,
      paymentId
    };

    this.logs.push(log);

    // Manter apenas os últimos N logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log no console
    if (this.logToConsole) {
      const prefix = `[Payment ${level}]`;
      const info = [];
      if (orderId) info.push(`Order: ${orderId}`);
      if (paymentId) info.push(`Payment: ${paymentId}`);
      const suffix = info.length > 0 ? ` (${info.join(', ')})` : '';

      switch (level) {
        case PaymentLogLevel.DEBUG:
          console.log(`%c${prefix}${suffix} ${message}`, 'color: #666; font-size: 12px;', data);
          break;
        case PaymentLogLevel.INFO:
          console.log(`%c${prefix}${suffix} ${message}`, 'color: #2196F3; font-weight: bold;', data);
          break;
        case PaymentLogLevel.WARN:
          console.warn(`${prefix}${suffix} ${message}`, data);
          break;
        case PaymentLogLevel.ERROR:
          console.error(`${prefix}${suffix} ${message}`, data);
          break;
      }
    }
  }

  /**
   * Retorna todos os logs
   */
  getLogs(): PaymentLog[] {
    return [...this.logs];
  }

  /**
   * Retorna logs filtrados por nível
   */
  getLogsByLevel(level: PaymentLogLevel): PaymentLog[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * Retorna logs filtrados por orderId
   */
  getLogsByOrderId(orderId: string): PaymentLog[] {
    return this.logs.filter((log) => log.orderId === orderId);
  }

  /**
   * Retorna logs filtrados por paymentId
   */
  getLogsByPaymentId(paymentId: string): PaymentLog[] {
    return this.logs.filter((log) => log.paymentId === paymentId);
  }

  /**
   * Exporta logs como JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Exporta logs como CSV
   */
  exportLogsAsCSV(): string {
    const headers = ['Timestamp', 'Level', 'Message', 'OrderID', 'PaymentID', 'Data'];
    const rows = this.logs.map((log) => [
      log.timestamp,
      log.level,
      log.message,
      log.orderId || '',
      log.paymentId || '',
      log.data ? JSON.stringify(log.data) : ''
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return csv;
  }

  /**
   * Limpa todos os logs
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Retorna estatísticas dos logs
   */
  getStats(): {
    totalLogs: number;
    debugCount: number;
    infoCount: number;
    warnCount: number;
    errorCount: number;
    oldestLog?: string;
    newestLog?: string;
  } {
    return {
      totalLogs: this.logs.length,
      debugCount: this.logs.filter((l) => l.level === PaymentLogLevel.DEBUG).length,
      infoCount: this.logs.filter((l) => l.level === PaymentLogLevel.INFO).length,
      warnCount: this.logs.filter((l) => l.level === PaymentLogLevel.WARN).length,
      errorCount: this.logs.filter((l) => l.level === PaymentLogLevel.ERROR).length,
      oldestLog: this.logs[0]?.timestamp,
      newestLog: this.logs[this.logs.length - 1]?.timestamp
    };
  }
}

export const paymentLogger = new PaymentLogger();

// Habilitar logging em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  paymentLogger.setEnabled(true);
  paymentLogger.setConsoleLogging(true);
}

export default PaymentLogger;
