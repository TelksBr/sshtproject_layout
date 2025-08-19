import { useState, useEffect } from 'react';
import { getStorageItem, setStorageItem } from '../utils/storageUtils';

export function usePrivacyAcceptance() {
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const storedValue = getStorageItem<string>('privacy-accepted-23-03-2025');
    setAccepted(!!storedValue);
  }, []);

  const acceptPrivacy = () => {
    setStorageItem('privacy-accepted-23-03-2025', true);
    setAccepted(true);
  };

  return { accepted, acceptPrivacy };
}
