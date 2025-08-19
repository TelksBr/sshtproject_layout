// Renovar usuário (compra de renovação)
export interface RenewalPurchaseResponse {
  success: boolean;
  message: string;
  data?: any;
}

export async function purchaseRenewal(username: string, plan_id: string): Promise<RenewalPurchaseResponse> {
  const response = await apiService.post<any>('/api/renewals/purchase', { username, plan_id });
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
  const response = await apiService.post<any>('/api/renewals/check', { username });
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
  const response = await apiService.post<any>('/api/test/generate', { customer_email: email });

  // Retorna todos os campos relevantes para o modal tratar
  return {
    success: response.success,
    message: response.message || (response.data?.message) || '',
    code: response.data?.code,
    data: response.data,
  };
}
import { Plan, PurchaseRequest, PurchaseResponse, PaymentStatus, CredentialsResponse, ApiResponse } from '../types/sales';
import { apiService } from '../services/apiService';
import { AppError } from './errorHandler';

// Listar planos disponíveis
export async function getPlans(): Promise<Plan[]> {
  const response = await apiService.get<ApiResponse<Plan[]>>('/api/sales/plans');
  return response.data || [];
}

// Criar nova compra
export async function createPurchase(purchase: PurchaseRequest): Promise<PurchaseResponse> {
  const response = await apiService.post<ApiResponse<PurchaseResponse>>('/api/sales/purchase', purchase);
  if (!response.data) {
    throw new AppError('Resposta inválida do servidor - dados não encontrados', 'INVALID_RESPONSE');
  }
  // Validar campos críticos
  if (!response.data.invoice_id || !response.data.payment_id) {
    throw new AppError('Dados de pagamento incompletos recebidos da API', 'INCOMPLETE_DATA');
  }
  return response.data;
}

// Verificar status da compra por invoice ID
export async function getPaymentStatus(invoiceId: string): Promise<PaymentStatus> {
  const response = await apiService.get<ApiResponse<PaymentStatus>>(`/api/sales/status/${invoiceId}`);
  if (!response.data) {
    throw new AppError('Status não encontrado', 'STATUS_NOT_FOUND');
  }
  return response.data;
}

// Buscar credenciais por payment ID
export async function getCredentials(paymentId: string | number): Promise<CredentialsResponse> {
  const paymentIdStr = String(paymentId);
  const url = `/api/sales/credentials/${paymentIdStr}`;
  
  try {
    const response = await apiService.get<ApiResponse<CredentialsResponse>>(url);
    if (!response.data) {
      throw new AppError('Credenciais não encontradas', 'CREDENTIALS_NOT_FOUND');
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
  const response = await apiService.post<ApiResponse<{ message: string }>>('/api/sales/recovery/request', {
    customer_email: email
  });

  if (!response.success) {
    throw new AppError(response.message || 'Erro ao solicitar recuperação de credenciais', 'RECOVERY_REQUEST_FAILED');
  }

  return {
    success: true,
    message: response.data?.message || 'Solicitação enviada com sucesso! Verifique seu email.'
  };
}

// Recuperar credenciais via token (URL do email)
export async function recoverCredentialsByToken(token: string): Promise<CredentialsResponse> {
  const response = await apiService.get<ApiResponse<CredentialsResponse>>(`/api/sales/recovery/${token}`);

  if (!response.success || !response.data) {
    throw new AppError(response.message || 'Token inválido ou expirado', 'INVALID_TOKEN');
  }

  return response.data;
}
