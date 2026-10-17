import type { VTunnelAdsState } from 'vtunnel-sdk';

export type AdsNotice = 'warning' | 'expired' | null;

export function formatAdsTime(seconds: number): string {
  const value = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return [Math.floor(value / 3600), Math.floor(value / 60) % 60, value % 60]
    .map(part => String(part).padStart(2, '0')).join(':');
}

export function visibleAdsNotice(notice: AdsNotice, state: VTunnelAdsState | null): AdsNotice {
  if (!state?.enabled) return null;
  if (notice === 'warning') {
    return !state.nativeUi.warningPrompt && state.timerRunning &&
      state.remainingSeconds <= state.warningSeconds ? 'warning' : null;
  }
  if (notice === 'expired') {
    return !state.nativeUi.expiredPrompt && state.remainingSeconds <= 0 ? 'expired' : null;
  }
  return null;
}

export function canCancelAd(state: VTunnelAdsState): boolean {
  return state.rewarded.busy && ['LOADING', 'READY'].includes(state.rewarded.state);
}
