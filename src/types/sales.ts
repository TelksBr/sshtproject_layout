// Tipos para a API de vendas
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

export interface PurchaseResponse {
  invoice_id: string;
  payment_id: string;
  qr_code?: string;
  ticket_url?: string;
  amount: number;
  username?: string;
  current_expiration?: string;
  expires_in?: number;
}

export interface PaymentStatus {
  invoice_id: string;
  payment_id?: string | number; // Pode vir como string ou number da API
  status: 'pending' | 'completed' | 'approved' | 'expired' | 'cancelled';
  amount: number;
  created_at: string;
  expires_at: string;
  processed_at?: string;
}

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
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  status?: string;
}

export type PaymentStep = 'plans' | 'form' | 'payment' | 'processing' | 'success' | 'error' | 'email' | 'confirm';
