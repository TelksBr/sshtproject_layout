export interface UserInfo {
  username: string;
  limit_connections: number;
  count_connections: number;
  expiration_date: string;
  expiration_days: number;
}

export async function fetchUserInfo(username: string): Promise<UserInfo> {
  try {
    const response = await fetch(`http://bot.sshtproject.com/check/${username}`);
    if (!response.ok) {
      throw new Error('Falha ao buscar informações do usuário');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar informações do usuário:', error);
    throw error;
  }
}