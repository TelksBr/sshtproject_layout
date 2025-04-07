import { useState, useCallback } from 'react';
import { fetchUserInfo, UserInfo } from '../utils/checkUserUtils';
import { getUsername } from '../utils/appFunctions';

export function useCheckUser() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const checkUser = useCallback(async () => {
    const username = getUsername();
    if (!username) {
      setError('Usuário não encontrado');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const info = await fetchUserInfo(username);
      setUserInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar informações do usuário');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    userInfo,
    checkUser
  };
}