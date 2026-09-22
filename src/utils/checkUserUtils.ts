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

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export function parseCheckUserDate(value?: string | null): Date | null {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed) || /Z$/i.test(trimmed)) {
    const iso = new Date(trimmed);
    return Number.isNaN(iso.getTime()) ? null : iso;
  }

  const br = trimmed.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/
  );
  if (br) {
    const date = new Date(
      parseInt(br[3], 10),
      parseInt(br[2], 10) - 1,
      parseInt(br[1], 10),
      br[4] ? parseInt(br[4], 10) : 23,
      br[5] ? parseInt(br[5], 10) : 59,
      br[6] ? parseInt(br[6], 10) : 59
    );
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split('-').map(Number);
    return new Date(year, month - 1, day, 23, 59, 59);
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatBrazilDateTime(value?: string | null): string {
  const date = parseCheckUserDate(value);
  if (!date) return String(value || '').trim() || '—';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export interface ValidityRemaining {
  expired: boolean;
  remainingMs: number | null;
  days: number;
  hours: number;
  minutes: number;
  unit: 'days' | 'hours' | 'minutes' | 'expired';
  label: string;
}

function remainingFromMs(ms: number): ValidityRemaining {
  if (ms <= 0) {
    const abs = Math.abs(ms);
    const days = Math.floor(abs / DAY_MS);
    const hours = Math.floor(abs / HOUR_MS);
    return {
      expired: true,
      remainingMs: ms,
      days,
      hours,
      minutes: Math.floor(abs / 60000),
      unit: 'expired',
      label: days >= 1 ? `Expirado há ${days}d` : hours >= 1 ? `Expirado há ${hours}h` : 'Expirado',
    };
  }

  const days = Math.floor(ms / DAY_MS);
  const hours = Math.max(1, Math.ceil(ms / HOUR_MS));
  const minutes = Math.max(1, Math.ceil(ms / 60000));

  if (ms < HOUR_MS) {
    return {
      expired: false,
      remainingMs: ms,
      days: 0,
      hours: 0,
      minutes,
      unit: 'minutes',
      label: minutes === 1 ? '1 min' : `${minutes} min`,
    };
  }

  if (ms < DAY_MS) {
    return {
      expired: false,
      remainingMs: ms,
      days: 0,
      hours,
      minutes,
      unit: 'hours',
      label: hours === 1 ? '1 hora' : `${hours} horas`,
    };
  }

  return {
    expired: false,
    remainingMs: ms,
    days,
    hours,
    minutes,
    unit: 'days',
    label: days === 1 ? '1 dia' : `${days} dias`,
  };
}

export function getValidityRemaining(
  info: Pick<UserInfo, 'expiration_date' | 'expiration_days'>
): ValidityRemaining {
  const date = parseCheckUserDate(info.expiration_date);
  if (date) return remainingFromMs(date.getTime() - Date.now());

  const days = Number(info.expiration_days);
  if (!Number.isFinite(days)) {
    return { expired: false, remainingMs: null, days: 0, hours: 0, minutes: 0, unit: 'days', label: '—' };
  }
  if (days <= 0) {
    return remainingFromMs(days * DAY_MS || -1);
  }
  return remainingFromMs(days * DAY_MS);
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

export function isUserExpired(
  info: Pick<UserInfo, 'expiration_days' | 'expiration_date' | 'error' | 'status'>
): boolean {
  if (info.error === true) return true;
  const status = String(info.status || '').toLowerCase();
  if (status === 'inactive' || status === 'expired') return true;
  return getValidityRemaining(info).expired;
}

export function isUserNearExpiration(
  info: Pick<UserInfo, 'expiration_days' | 'expiration_date' | 'error' | 'status'>
): boolean {
  if (isUserExpired(info)) return false;
  const remaining = getValidityRemaining(info);
  if (remaining.remainingMs == null) return false;
  return remaining.remainingMs <= CHECKUSER_RENEWAL_SOON_DAYS * DAY_MS;
}

export function shouldOfferRenewal(
  info: Pick<UserInfo, 'expiration_days' | 'expiration_date' | 'error' | 'status'>
): boolean {
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