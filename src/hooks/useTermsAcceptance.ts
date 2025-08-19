import { useState } from 'react';
import { getStorageItem, setStorageItem } from '../utils/storageUtils';
import { APP_CONFIG } from '../constants';

export function useTermsAcceptance() {
  const [accepted, setAccepted] = useState(() => {
    return !!getStorageItem<string>(APP_CONFIG.STORAGE_KEYS.TERMS_ACCEPTED);
  });

  const acceptTerms = () => {
    setAccepted(true);
    setStorageItem(APP_CONFIG.STORAGE_KEYS.TERMS_ACCEPTED, true);
  };

  return {
    accepted,
    acceptTerms
  };
}