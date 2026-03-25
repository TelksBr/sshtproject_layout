export interface UserInfo {
  username: string;
  password?: string;
  limit: number;
  limit_connections: number;
  count_connections: number;
  expiration_date: string;
  expiration_days: number;
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
    
    // API retorna dados diretamente (sem wrapper)
    if (result && result.username) {
      return {
        success: true,
        message: 'Usuário validado com sucesso',
        data: {
          username: result.username,
          password: result.password,
          limit: result.limit_connections || result.limit,
          limit_connections: result.limit_connections,
          count_connections: result.count_connections,
          expiration_date: result.expiration_date,
          expiration_days: result.expiration_days
        }
      };
    }
    
    // Fallback para formato com wrapper (compatibilidade)
    if (result.success && result.data) {
      return {
        success: true,
        message: 'Usuário validado com sucesso',
        data: {
          ...result.data,
          limit: result.data.limit_connections || result.data.limit
        }
      };
    }
    
    return {
      success: false,
      message: result.error || 'Erro ao buscar dados do usuário',
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
    
    // API retorna dados diretamente (sem wrapper)
    if (result && result.username) {
      return result;
    }
    
    // Fallback para formato com wrapper (compatibilidade)
    if (result.success && result.data) {
      return result.data;
    }
    
    throw new Error(result.error || 'Erro ao buscar dados do usuário');
  } catch (error) {
    throw error;
  }
}