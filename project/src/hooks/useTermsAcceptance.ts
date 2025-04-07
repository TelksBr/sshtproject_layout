import { useState, useEffect } from 'react';
import { getStorageItem, setStorageItem } from '../utils/storageUtils';

export function useTermsAcceptance() {
  const [accepted, setAccepted] = useState(() => {
    return !!getStorageItem<string>('terms-accepted-23-03-2025');
  });

  const acceptTerms = () => {
    setAccepted(true);
    setStorageItem('terms-accepted-23-03-2025', true);
  };

  return {
    accepted,
    acceptTerms
  };
}