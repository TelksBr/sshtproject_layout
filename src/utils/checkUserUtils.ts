export interface UserInfo {
  username: string;
  password?: string;
  limit: number;
  limit_connections: number;
  count_connections: number;
  expiration_date: string;
  expiration_days: number;
  error?: boolean;
  status?: string;
  message?: string;
}

export interface CheckUserResponse {
  success: boolean;
  message: string;
  data?: UserInfo;
  error?: string;
}

// Verificar usuário (CheckUser API - Rota pública, sem autenticação)
export async function checkUser(identifier: string): Promise<CheckUserResponse> {
  try {
    const url = `https://bot.sshtproject.com/check/${encodeURIComponent(identifier)}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    
    if (!response.ok) {
      return {
        success: false,
        message: 'Falha ao buscar informações do usuário'
      };
    }
    
    const result = await response.json();
    const info =
      normalizeUserInfo(result) ||
      (result?.success && result?.data ? normalizeUserInfo(result.data) : null);

    if (info) {
      return {
        success: true,
        message: info.message || 'Usuário validado com sucesso',
        data: info,
      };
    }
    
    return {
      success: false,
      message: result.error || result.message || 'Erro ao buscar dados do usuário',
      error: result.error
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erro ao conectar com a API',
      error: String(error)
    };
  }
}

// Buscar informações do usuário (CheckUser API - Rota pública, sem autenticação)
export async function fetchUserInfo(username: string, deviceId?: string): Promise<UserInfo> {
  try {
    const url = deviceId 
      ? `https://bot.sshtproject.com/check/${encodeURIComponent(username)}?deviceId=${encodeURIComponent(deviceId)}`
      : `https://bot.sshtproject.com/check/${encodeURIComponent(username)}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    
    if (!response.ok) {
      throw new Error('Falha ao buscar informações do usuário');
    }
    
    const result = await response.json();
    const info =
      normalizeUserInfo(result) ||
      (result?.success && result?.data ? normalizeUserInfo(result.data) : null);

    if (info) return info;

    throw new Error(result.error || result.message || 'Erro ao buscar dados do usuário');
  } catch (error) {
    throw error;
  }
}

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function isTruthyFlag(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || value === 'true';
}

export function normalizeUserInfo(raw: Record<string, unknown>): UserInfo | null {
  const username = String(raw.username ?? '').trim();
  if (!username) return null;

  const limit_connections = toNumber(raw.limit_connections ?? raw.limit_connection ?? raw.limit);
  const status = typeof raw.status === 'string' ? raw.status.trim() : '';
  const message = typeof raw.message === 'string' ? raw.message.trim() : '';

  return {
    username,
    password: typeof raw.password === 'string' ? raw.password : undefined,
    limit: limit_connections,
    limit_connections,
    count_connections: toNumber(raw.count_connections ?? raw.count_connection),
    expiration_date: String(raw.expiration_date ?? ''),
    expiration_days: toNumber(raw.expiration_days),
    error: isTruthyFlag(raw.error),
    status: status || undefined,
    message: message || undefined,
  };
}

/** Usuários a até este número de dias da validade veem o botão de renovar. */
export const CHECKUSER_RENEWAL_SOON_DAYS = 7;

export function isUserExpired(info: Pick<UserInfo, 'expiration_days' | 'error' | 'status'>): boolean {
  if (info.error === true) return true;
  const status = String(info.status || '').toLowerCase();
  if (status === 'inactive' || status === 'expired') return true;
  return Number(info.expiration_days) <= 0;
}

export function isUserNearExpiration(info: Pick<UserInfo, 'expiration_days' | 'error' | 'status'>): boolean {
  if (isUserExpired(info)) return false;
  const days = Number(info.expiration_days);
  return Number.isFinite(days) && days > 0 && days <= CHECKUSER_RENEWAL_SOON_DAYS;
}

export function shouldOfferRenewal(info: Pick<UserInfo, 'expiration_days' | 'error' | 'status'>): boolean {
  return isUserExpired(info) || isUserNearExpiration(info);
}

/** Normaliza o payload do evento nativo `checkUserResult` (SDK 2.0). */
export function parseSdkCheckUserPayload(payload: unknown): UserInfo | null {
  let data: unknown = payload;
  if (typeof payload === 'string') {
    const trimmed = payload.trim();
    if (!trimmed) return null;
    try {
      data = JSON.parse(trimmed);
    } catch {
      return null;
    }
  }

  if (!data || typeof data !== 'object') return null;
  return normalizeUserInfo(data as Record<string, unknown>);
}