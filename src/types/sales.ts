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
  payment_id: string;
  qr_code: string;
  amount: number;
  expires_in: number;
  provider: 'mercado_pago' | 'asaas' | string;
  ticket_url?: string;  // Opcional - alguns provedores
  username?: string;    // Opcional - para renovações
  current_expiration?: string;  // Opcional - para renovações
}

// Alias para compatibilidade - DEPRECADO: usar OrderResponse
export interface PurchaseResponse extends OrderResponse {
  invoice_id: string;  // Alias de order_id para compatibilidade
}

// =============================
// API v1 RESTful - Invoice/Order Status
// =============================
export interface InvoiceStatus {
  order_id?: string;    // Campo v1 RESTful
  invoice_id?: string;  // Compatibilidade com legado
  payment_id: string | number;
  status: 'pending' | 'completed' | 'approved' | 'expired' | 'cancelled';
  amount: number;
  created_at?: string;
  expires_at?: string;
  processed_at?: string;
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
  status: 'pending' | 'completed' | 'cancelled' | 'expired';
  amount: number;
  processed_at?: string;
  plan?: {
    name: string;
    price: number;
    validate_days: number;
  };
  ssh_credentials?: SSHCredentials;
  v2ray_credentials?: V2RayCredentials;
  // Campos legados para compatibilidade
  ssh?: {
    host: string;
    port: number;
    username: string;
    password: string;
    expires_at: string;
  };
  v2ray?: {
    uuid: string;
    expires_at: string;
  };
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
