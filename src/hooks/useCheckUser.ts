import { message as tr, useMessages } from '../i18n/messages';
import { useState, useCallback } from 'react';
import { fetchUserInfo, UserInfo } from '../utils/checkUserUtils';
import { getUsername } from '../utils/appFunctions';

export function useCheckUser() {
  useMessages();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const checkUser = useCallback(async () => {
    const username = getUsername();
    if (!username) {
      setError(tr("m160c07d986"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const info = await fetchUserInfo(username);
      setUserInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : tr("meb71224d8c"));
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