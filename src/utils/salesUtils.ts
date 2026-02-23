// Renovar usuário (compra de renovação)
export interface RenewalPurchaseResponse {
  success: boolean;
  message: string;
  data?: any;
}

export async function purchaseRenewal(username: string, plan_id: string): Promise<RenewalPurchaseResponse> {
  // Validação de parâmetros obrigatórios
  if (!username || username.trim() === '') {
    throw new Error('Username é obrigatório para renovação');
  }
  
  if (!plan_id || plan_id.trim() === '') {
    throw new Error('Plan ID é obrigatório para renovação');
  }
  
  const payload = {
    username: username.trim(),
    plan_id: plan_id.trim()
  };
  
  const response = await apiRequest<any>(
    '/api/v1/renewals/orders',
    {
      method: 'POST',
      body: JSON.stringify(payload),
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
    `/api/v1/renewals/users/${encodeURIComponent(username)}/validation`,
    {
      method: 'GET',
    }
  );
  return {
    success: response.success,
    message: response.message || (response.data?.message) || '',
    data: response.data,
  };
}

// Tipagem para resposta flexível
export interface TestGenerateResponse {
  success: boolean;
  message: string;
  code?: string;
  data?: any;
}
import {
  Plan,
  PurchaseRequest,
  OrderResponse,
  PurchaseResponse,
  InvoiceStatus,
  PaymentStatus,
  CredentialsResponse,
  ApiResponse
} from '../types/sales';

// URL permanece a mesma (legado)
const API_BASE_URL = 'https://bot.sshtproject.com';

// Token fixo fornecido
const SALES_API_TOKEN = 'sales-api_8c28c7dd151694afab5cb0958f1c443bb7e45315ed4cfeb1ea1569093287ca0d';

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
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        ...options?.headers,
        Authorization: `Bearer ${SALES_API_TOKEN}`,
      },
    });
    
    const data = await response.json();
    
    // Tratar erros HTTP
    if (!response.ok) {
      throw new Error(data.error || data.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Validar resposta da API v1
    if (!data.success && data.error) {
      throw new Error(data.error);
    }
    
    return data;
  } catch (error) {
    throw error;
  }
}

// Listar planos disponíveis (API v1)
export async function getPlans(): Promise<Plan[]> {
  const response = await apiRequest<Plan[]>('/api/v1/sales/plans');
  return response.data || [];
}

// Criar nova ordem (API v1 RESTful)
export async function createOrder(purchase: PurchaseRequest): Promise<OrderResponse> {
  const response = await apiRequest<OrderResponse>('/api/v1/sales/orders', {
    method: 'POST',
    body: JSON.stringify(purchase),
  });
  
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Falha ao criar ordem');
  }
  
  // Validar campos críticos
  if (!response.data.order_id || !response.data.payment_id) {
    throw new Error('Dados de pagamento incompletos recebidos da API');
  }
  
  return response.data;
}

// Alias para compatibilidade - DEPRECADO: usar createOrder
export async function createPurchase(purchase: PurchaseRequest): Promise<PurchaseResponse> {
  const orderResponse = await createOrder(purchase);
  // Adicionar invoice_id como alias de order_id para compatibilidade
  return {
    ...orderResponse,
    invoice_id: orderResponse.order_id,
  } as PurchaseResponse;
}

// Verificar status da invoice/order (API v1 RESTful)
export async function getInvoiceStatus(invoiceId: string, forceCheck = false): Promise<InvoiceStatus> {
  const url = `/api/v1/sales/invoices/${invoiceId}${forceCheck ? '?force_check=true' : ''}`;
  const response = await apiRequest<InvoiceStatus>(url);
  
  if (!response.data) {
    throw new Error('Status não encontrado');
  }
  
  return response.data;
}

// Alias para compatibilidade - DEPRECADO: usar getInvoiceStatus
export async function getPaymentStatus(invoiceId: string): Promise<PaymentStatus> {
  return getInvoiceStatus(invoiceId, false);
}

// Buscar credenciais por payment ID (API v1)
export async function getCredentials(paymentId: string | number): Promise<CredentialsResponse> {
  const paymentIdStr = String(paymentId);
  const url = `/api/v1/sales/credentials/${paymentIdStr}`;
  
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

// Solicitar recuperação de credenciais por email (API v1)
export async function requestCredentialRecovery(email: string): Promise<{ success: boolean; message: string }> {
  const response = await apiRequest<{ message: string }>('/api/v1/sales/credential-recovery-requests', {
    method: 'POST',
    body: JSON.stringify({
      customer_email: email
    }),
  });

  if (!response.success) {
    throw new Error(response.error || response.message || 'Erro ao solicitar recuperação de credenciais');
  }

  return {
    success: true,
    message: response.data?.message || response.message || 'Solicitação enviada com sucesso! Verifique seu email.'
  };
}

// Recuperar credenciais via token (URL do email) (API v1)
export async function recoverCredentialsByToken(token: string): Promise<CredentialsResponse> {
  const response = await apiRequest<CredentialsResponse>(`/api/v1/sales/credentials/recovery/${token}`);

  if (!response.success || !response.data) {
    throw new Error(response.error || response.message || 'Token inválido ou expirado');
  }

  return response.data;
}

// ============================================
// TESTE GRATUITO (API v1)
// ============================================
export async function generateTestCredentials(email: string): Promise<TestGenerateResponse> {
  const response = await apiRequest<any>(
    '/api/v1/tests/credentials',
    {
      method: 'POST',
      body: JSON.stringify({ customer_email: email }),
    }
  );

  return {
    success: response.success,
    message: response.message || (response.data?.message) || '',
    code: response.data?.code,
    data: response.data,
  };
}

// Verificar cooldown de teste (API v1)
export async function checkTestCooldown(email: string): Promise<{ can_generate: boolean; cooldown_remaining?: number }> {
  const response = await apiRequest<any>(`/api/v1/tests/cooldowns/${encodeURIComponent(email)}`);
  
  if (!response.data) {
    throw new Error('Erro ao verificar cooldown');
  }
  
  return response.data;
}
