import { useEffect, useRef, useState } from 'react';
import { VpnState } from '../types/vpn';
import { useAutoConnectContext } from '../context/AutoConnectContext';
import {
  markPlayStoreReviewCompleted,
  markPlayStoreReviewDeclined,
  openPlayStoreListing,
  shouldShowPlayStoreReview,
} from '../utils/playStoreReview';

const SHOW_DELAY_MS = 2500;

export function usePlayStoreReviewPrompt(vpnState: VpnState, blockingModal: string | null) {
  const { open: autoConnectOpen, running: autoConnectRunning } = useAutoConnectContext();
  const [open, setOpen] = useState(false);
  const prevStateRef = useRef<VpnState>(vpnState);
  const pendingRef = useRef(false);
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const busy = Boolean(blockingModal) || autoConnectOpen || autoConnectRunning;

  useEffect(() => {
    const justConnected = prevStateRef.current !== 'CONNECTED' && vpnState === 'CONNECTED';
    prevStateRef.current = vpnState;

    if (justConnected && shouldShowPlayStoreReview()) {
      pendingRef.current = true;
    }

    if (vpnState !== 'CONNECTED') {
      pendingRef.current = false;
      if (open) setOpen(false);
    }

    if (delayRef.current) {
      clearTimeout(delayRef.current);
      delayRef.current = null;
    }

    if (!pendingRef.current || open || busy || vpnState !== 'CONNECTED') {
      return;
    }

    delayRef.current = setTimeout(() => {
      delayRef.current = null;
      if (!pendingRef.current || vpnState !== 'CONNECTED' || !shouldShowPlayStoreReview()) {
        return;
      }
      pendingRef.current = false;
      setOpen(true);
    }, SHOW_DELAY_MS);

    return () => {
      if (delayRef.current) {
        clearTimeout(delayRef.current);
        delayRef.current = null;
      }
    };
  }, [vpnState, busy, open]);

  const handleAccept = () => {
    pendingRef.current = false;
    markPlayStoreReviewCompleted();
    setOpen(false);
    openPlayStoreListing();
  };

  const handleDecline = () => {
    pendingRef.current = false;
    markPlayStoreReviewDeclined();
    setOpen(false);
  };

  return { open, handleAccept, handleDecline };
}
