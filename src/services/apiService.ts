// Serviço centralizado para chamadas de API
import { APP_CONFIG } from '../constants';
import { AppError } from '../utils/errorHandler';

interface ApiRequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = APP_CONFIG.API.BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async request<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    const {
      timeout = APP_CONFIG.TIMEOUTS.FETCH,
      retries = 1,
      ...fetchOptions
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        // Detectar WebView e adicionar cache-busting
        const isWebView = navigator.userAgent.includes('wv') || navigator.userAgent.includes('WebView');
        let url = `${this.baseUrl}${endpoint}`;
        
        if (isWebView) {
          const separator = endpoint.includes('?') ? '&' : '?';
          url += `${separator}_t=${Date.now()}`;
        }

        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            ...fetchOptions.headers,
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new AppError(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`,
            'API_ERROR',
            { status: response.status, endpoint }
          );
        }

        const data = await response.json();
        return data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt === retries - 1) {
          throw lastError instanceof AppError ? lastError : new AppError(
            lastError.message,
            'NETWORK_ERROR',
            { endpoint, attempt: attempt + 1 }
          );
        }
        
        // Aguarda antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }

    throw lastError || new AppError('Request failed', 'UNKNOWN_ERROR');
  }

  async get<T>(endpoint: string, options?: Omit<ApiRequestOptions, 'method'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

export const apiService = new ApiService();