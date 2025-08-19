// Renovar usuário (compra de renovação)
export interface RenewalPurchaseResponse {
  success: boolean;
  message: string;
  data?: any;
}

export async function purchaseRenewal(username: string, plan_id: string): Promise<RenewalPurchaseResponse> {
  const response = await apiRequest<any>(
    '/api/renewals/purchase',
    {
      method: 'POST',
      body: JSON.stringify({ username, plan_id }),
    }
  );
  return {
    success: response.success,
    message: response.message || (response.data?.message) || '',
    data: response.data,
  };
}
// =============================
// RENOVAÇÃO DE LOGIN
// =============================

export interface RenewalCheckResponse {
  success: boolean;
  message: string;
  data?: {
    username: string;
    can_renew: boolean;
    expires_at?: string;
    [key: string]: any;
  };
}

export async function checkRenewalUser(username: string): Promise<RenewalCheckResponse> {
  const response = await apiRequest<any>(
    '/api/renewals/check',
    {
      method: 'POST',
      body: JSON.stringify({ username }),
    }
  );
  return {
    success: response.success,
    message: response.message || (response.data?.message) || '',
    data: response.data,
  };
}
// Gerar credenciais de teste via email

// Tipagem para resposta flexível
export interface TestGenerateResponse {
  success: boolean;
  message: string;
  code?: string;
  data?: any;
}


export async function generateTestCredentials(email: string): Promise<TestGenerateResponse> {
  const response = await apiRequest<any>(
    '/api/test/generate',
    {
      method: 'POST',
      body: JSON.stringify({ customer_email: email }),
    }
  );

  // Retorna todos os campos relevantes para o modal tratar
  return {
    success: response.success,
    message: response.message || (response.data?.message) || '',
    code: response.data?.code,
    data: response.data,
  };
}
import { 
  Plan, 
  PurchaseRequest, 
  PurchaseResponse, 
  PaymentStatus, 
  CredentialsResponse, 
  ApiResponse 
} from '../types/sales';

const API_BASE_URL = 'https://bot.sshtproject.com';

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

// ============================================
// FUNÇÕES DE RECUPERAÇÃO DE CREDENCIAIS
// ============================================

// Solicitar recuperação de credenciais por email
export async function requestCredentialRecovery(email: string): Promise<{ success: boolean; message: string }> {
  const response = await apiRequest<{ message: string }>('/api/sales/recovery/request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customer_email: email
    }),
  });

  if (!response.success) {
    throw new Error(response.message || 'Erro ao solicitar recuperação de credenciais');
  }

  return {
    success: true,
    message: response.data?.message || 'Solicitação enviada com sucesso! Verifique seu email.'
  };
}

// Recuperar credenciais via token (URL do email)
export async function recoverCredentialsByToken(token: string): Promise<CredentialsResponse> {
  const response = await apiRequest<CredentialsResponse>(`/api/sales/recovery/${token}`);

  if (!response.success || !response.data) {
    throw new Error(response.message || 'Token inválido ou expirado');
  }

  return response.data;
}
