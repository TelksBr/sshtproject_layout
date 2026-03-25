// Tipos para a API de vendas

// =============================
// API v1 RESTful - Wrapper de Resposta
// =============================
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  limit: number;
  validate: number;
  description: string;
  duration_days?: number; // Opcional - fallback para validate
  protocols?: string[]; // Opcional - fallback para protocolo padrão
}

export interface PurchaseRequest {
  plan_id: string;
  customer_email: string;
  customer_name: string;
}

// =============================
// API v1 RESTful - Order Response
// =============================
export interface OrderResponse {
  order_id: string;
  invoice_id: string;
  payment_id: string | number;
  qr_code: string;
  qr_code_base64?: string;
  amount: number;
  expires_in: number;
  provider: 'mercado_pago' | 'asaas' | string;
  ticket_url?: string;
}

// Alias para compatibilidade - DEPRECADO: usar OrderResponse
export type PurchaseResponse = OrderResponse;

// =============================
// API v1 RESTful - Renewal Validation Response
// =============================
export interface RenewalValidationData {
  user_type: 'ssh' | 'v2ray' | 'both';
  current_expiration: string;
  is_expired: boolean;
  days_until_expiration: number;
  can_renew: boolean;
  ssh?: {
    username: string;
    limit: number;
  };
  v2ray?: {
    uuid: string;
    limit: number;
  };
}

// =============================
// API v1 RESTful - Renewal Order Response
// =============================
export interface RenewalOrderResponse {
  order_id: string;
  invoice_id: string;
  payment_id: string | number;
  qr_code: string;
  qr_code_base64?: string;
  ticket_url?: string;
  amount: number;
  identifier: string;
  username: string | null;
  uuid: string | null;
  current_expiration: string;
  has_ssh: boolean;
  will_create_ssh: boolean;
  will_renew_ssh: boolean;
  ssh_message: string | null;
  has_v2ray: boolean;
  will_create_v2ray: boolean;
  will_renew_v2ray: boolean;
  will_skip_v2ray: boolean;
  v2ray_message: string | null;
  expires_in: number;
  provider: 'mercado_pago' | 'asaas' | string;
}

// =============================
// API v1 RESTful - Invoice/Order Status
// =============================
export interface InvoiceStatus {
  id?: string;
  order_id?: string;
  invoice_id?: string;
  payment_id: string | number;
  status: 'pending' | 'completed' | 'approved' | 'expired' | 'cancelled';
  amount: number;
  created_at?: string;
  expires_at?: string;
  processed_at?: string;
  customer_email?: string;
  customer_name?: string;
  credentials?: CredentialsResponse;
}

// Alias para compatibilidade - DEPRECADO: usar InvoiceStatus
export type PaymentStatus = InvoiceStatus;

export interface SSHCredentials {
  username: string;
  password: string;
  limit: number;
  expiration_date: string;
  created_at: string;
  servers?: Array<{
    name: string;
    host: string;
    port: number;
  }>;
}

export interface V2RayCredentials {
  uuid: string;
  limit: number;
  expiration_date: string;
  created_at: string;
  servers?: Array<{
    name: string;
    host: string;
    port: number;
  }>;
}

export interface CredentialsResponse {
  payment_id: string | number;
  invoice_id: string;
  status: 'pending' | 'completed' | 'approved' | 'cancelled' | 'expired';
  amount: number;
  processed_at?: string;
  approved_at?: string;
  plan?: {
    name: string;
    price: number;
    validate_days: number;
  };
  ssh_credentials?: SSHCredentials;
  v2ray_credentials?: V2RayCredentials;
  // Suporte para resposta de renovação (credentials dentro de credentials)
  credentials?: {
    ssh?: {
      username: string;
      password: string;
      limit: number;
      expiration_date: string;
      is_active: boolean;
    };
    v2ray?: {
      uuid: string;
      limit: number;
      expiration_date: string;
      is_active: boolean;
    };
  };
}

export type PaymentStep = 'plans' | 'form' | 'payment' | 'processing' | 'success' | 'error' | 'email' | 'confirm';
