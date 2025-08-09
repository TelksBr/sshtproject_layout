// Utilitário para monitorar performance do polling
interface PollingMetrics {
  startTime: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastRequestTime: number;
}

class PollingMonitor {
  private metrics: Map<string, PollingMetrics> = new Map();

  startSession(sessionId: string): void {
    this.metrics.set(sessionId, {
      startTime: Date.now(),
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastRequestTime: 0
    });
  }

  recordRequest(sessionId: string, success: boolean, responseTime: number): void {
    const metric = this.metrics.get(sessionId);
    if (!metric) return;

    metric.totalRequests++;
    metric.lastRequestTime = Date.now();
    
    if (success) {
      metric.successfulRequests++;
    } else {
      metric.failedRequests++;
    }

    // Calcular média de tempo de resposta
    metric.averageResponseTime = (
      (metric.averageResponseTime * (metric.totalRequests - 1) + responseTime) / 
      metric.totalRequests
    );

    this.metrics.set(sessionId, metric);
  }

  getMetrics(sessionId: string): PollingMetrics | null {
    return this.metrics.get(sessionId) || null;
  }

  endSession(sessionId: string): PollingMetrics | null {
    const metric = this.metrics.get(sessionId);
    if (metric) {
      this.metrics.delete(sessionId);
      return metric;
    }
    return null;
  }

  // Detectar possíveis problemas
  detectIssues(sessionId: string): string[] {
    const metric = this.metrics.get(sessionId);
    if (!metric) return [];

    const issues: string[] = [];
    
    // Taxa de falha alta
    if (metric.totalRequests > 5 && (metric.failedRequests / metric.totalRequests) > 0.3) {
      issues.push('Taxa de falha alta (>30%)');
    }

    // Tempo de resposta alto
    if (metric.averageResponseTime > 2000) {
      issues.push('Tempo de resposta alto (>2s)');
    }

    // Muitas requisições
    if (metric.totalRequests > 50) {
      issues.push('Muitas requisições - possível flooding');
    }

    return issues;
  }
}

export const pollingMonitor = new PollingMonitor();
