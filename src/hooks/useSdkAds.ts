import { useCallback, useEffect, useState } from 'react';
import type { VTunnelAdsState } from 'vtunnel-sdk';
import { getSdk } from '../utils/sdkInstance';
import { useDTunnelEvent } from './useDTunnelEvent';
import { visibleAdsNotice, type AdsNotice } from '../utils/adsPresentation';

function readAds(): VTunnelAdsState | null {
  try { return getSdk()?.ads.isSupported() ? getSdk()!.ads.getState() : null; }
  catch { return null; }
}

export function useSdkAds() {
  const [state, setState] = useState(readAds);
  const [notice, setNotice] = useState<AdsNotice>(() => visibleAdsNotice('warning', state));
  const [commandFailed, setCommandFailed] = useState(false);
  useEffect(() => {
    if (state?.enabled) {
      try { getSdk()?.ads.preloadRewarded(); } catch { /* Retry when the user requests a video. */ }
    }
  }, [state?.enabled]);
  const refresh = useCallback(() => {
    const next = readAds();
    setState(next);
    setNotice(current => visibleAdsNotice(current, next));
    return next;
  }, []);

  useEffect(() => {
    refresh();
    const resume = () => { if (!document.hidden) refresh(); };
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('focus', resume);
    // Also recovers settings changed while this WebView stays mounted.
    const timer = window.setInterval(resume, 5000);
    return () => {
      document.removeEventListener('visibilitychange', resume);
      window.removeEventListener('focus', resume);
      window.clearInterval(timer);
    };
  }, [refresh]);

  useDTunnelEvent('adsTimerUpdated', refresh);
  useDTunnelEvent('vpnState', refresh);
  useDTunnelEvent('adsRewardedState', () => { setCommandFailed(false); refresh(); });
  useDTunnelEvent('adsTimeWarning', () => {
    const next = refresh();
    setNotice(visibleAdsNotice('warning', next));
  });
  useDTunnelEvent('adsTimeExpired', () => {
    const next = refresh();
    setNotice(visibleAdsNotice('expired', next));
  });

  const showRewarded = useCallback(() => {
    const current = readAds();
    if (!current?.enabled || current.rewarded.busy) return;
    setCommandFailed(false);
    setNotice(null);
    try { getSdk()!.ads.showRewarded(); refresh(); }
    catch { setCommandFailed(true); }
  }, [refresh]);
  const cancelRewarded = useCallback(() => {
    try { getSdk()?.ads.cancelRewarded(); refresh(); }
    catch { setCommandFailed(true); }
  }, [refresh]);

  return { state, notice, commandFailed, showRewarded, cancelRewarded, dismiss: () => setNotice(null) };
}
