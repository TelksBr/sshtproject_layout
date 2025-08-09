import { 
  Plan, 
  PurchaseRequest, 
  PurchaseResponse, 
  PaymentStatus, 
  CredentialsResponse, 
  ApiResponse 
} from '../types/sales';

const API_BASE_URL = 'http://bot.sshtproject.com';

// Função auxiliar para fazer requisições
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    // Detectar WebView e adicionar cache-busting
    const isWebView = navigator.userAgent.includes('wv') || navigator.userAgent.includes('WebView');
    let url = `${API_BASE_URL}${endpoint}`;
    
    if (isWebView) {
      // Adicionar timestamp para evitar cache no WebView
      const separator = endpoint.includes('?') ? '&' : '?';
      url += `${separator}_t=${Date.now()}`;
    }
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        ...options?.headers,
      },
      ...options,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || data.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    return data;
  } catch (error) {
    throw error;
  }
}

// Listar planos disponíveis
export async function getPlans(): Promise<Plan[]> {
  const response = await apiRequest<Plan[]>('/api/sales/plans');
  return response.data || [];
}

// Criar nova compra
export async function createPurchase(purchase: PurchaseRequest): Promise<PurchaseResponse> {
  const response = await apiRequest<PurchaseResponse>('/api/sales/purchase', {
    method: 'POST',
    body: JSON.stringify(purchase),
  });
  if (!response.data) {
    throw new Error('Resposta inválida do servidor - dados não encontrados');
  }
  // Validar campos críticos
  if (!response.data.invoice_id || !response.data.payment_id) {
    throw new Error('Dados de pagamento incompletos recebidos da API');
  }
  return response.data;
}

// Verificar status da compra por invoice ID
export async function getPaymentStatus(invoiceId: string): Promise<PaymentStatus> {
  const response = await apiRequest<PaymentStatus>(`/api/sales/status/${invoiceId}`);
  if (!response.data) {
    throw new Error('Status não encontrado');
  }
  return response.data;
}

// Buscar credenciais por payment ID
export async function getCredentials(paymentId: string | number): Promise<CredentialsResponse> {
  const paymentIdStr = String(paymentId);
  const url = `/api/sales/credentials/${paymentIdStr}`;
  
  try {
    const response = await apiRequest<CredentialsResponse>(url);
    if (!response.data) {
      throw new Error('Credenciais não encontradas');
    }
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Validar email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Formatar preço
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price);
}

// Formatar data
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// Calcular tempo restante até expiração
export function getTimeUntilExpiration(expiresAt: string): { 
  minutes: number; 
  seconds: number; 
  isExpired: boolean 
} {
  const now = new Date().getTime();
  const expiry = new Date(expiresAt).getTime();
  const diff = expiry - now;
  
  if (diff <= 0) {
    return { minutes: 0, seconds: 0, isExpired: true };
  }
  
  const minutes = Math.floor(diff / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { minutes, seconds, isExpired: false };
}
