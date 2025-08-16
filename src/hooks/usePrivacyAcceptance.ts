import { useState, useEffect } from 'react';
import { getStorageItem, setStorageItem } from '../utils';
import { APP_CONFIG } from '../constants';

export function usePrivacyAcceptance() {
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const storedValue = getStorageItem<string>(APP_CONFIG.STORAGE_KEYS.PRIVACY_ACCEPTED);
    setAccepted(!!storedValue);
  }, []);

  const acceptPrivacy = () => {
    setStorageItem(APP_CONFIG.STORAGE_KEYS.PRIVACY_ACCEPTED, true);
    setAccepted(true);
  };

  return { accepted, acceptPrivacy };
}
