import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import type { VTunnelAdsState } from 'vtunnel-sdk';
import { formatAdsTime, visibleAdsNotice, canCancelAd } from '../src/utils/adsPresentation';

function snapshot(patch: Partial<VTunnelAdsState> = {}): VTunnelAdsState {
  return {
    enabled: true, provider: 'APPODEAL', remainingSeconds: 60, timerText: '00:01:00',
    timerRunning: true, vpnConnected: true, graceUsed: true,
    initialSeconds: 600, rewardSeconds: 7200, warningSeconds: 120,
    rewarded: { state: 'IDLE', busy: false, ready: false, requestId: null, rewardEarned: false, error: null, remainingSeconds: 60, rewardSeconds: 7200 },
    nativeUi: { timer: false, warningPrompt: false, expiredPrompt: false, rewardedPrompt: false, rewardedLoading: false, banner: true },
    ...patch,
  };
}

test('formats authoritative seconds without allowing negative or invalid time', () => {
  assert.equal(formatAdsTime(7322), '02:02:02');
  assert.equal(formatAdsTime(-1), '00:00:00');
  assert.equal(formatAdsTime(NaN), '00:00:00');
  assert.equal(formatAdsTime(360000), '100:00:00');
});
test('shows low time warning only for a running timer', () => {
  assert.equal(visibleAdsNotice('warning', snapshot()), 'warning');
  assert.equal(visibleAdsNotice('warning', snapshot({ timerRunning: false })), null);
});
test('clears queued warning after native reward or grace adds time', () => {
  assert.equal(visibleAdsNotice('warning', snapshot({ remainingSeconds: 7200 })), null);
});
test('does not duplicate native warning and expiration dialogs', () => {
  const state = snapshot();
  state.nativeUi.warningPrompt = true;
  state.nativeUi.expiredPrompt = true;
  assert.equal(visibleAdsNotice('warning', state), null);
  assert.equal(visibleAdsNotice('expired', { ...state, remainingSeconds: 0 }), null);
});
test('expiration comes from event and clears when time is restored', () => {
  assert.equal(visibleAdsNotice(null, snapshot({ remainingSeconds: 0 })), null);
  assert.equal(visibleAdsNotice('expired', snapshot({ remainingSeconds: 0 })), 'expired');
  assert.equal(visibleAdsNotice('expired', snapshot({ remainingSeconds: 120 })), null);
});
test('disabled or unsupported ads never show a queued prompt', () => {
  assert.equal(visibleAdsNotice('warning', null), null);
  assert.equal(visibleAdsNotice('warning', snapshot({ enabled: false })), null);
});
test('cancellation is available while waiting but never during video or completion', () => {
  const state = snapshot();
  for (const status of ['LOADING', 'READY', 'OPENING', 'SHOWING', 'REWARDED', 'CLOSED', 'FAILED', 'CANCELLED'] as const) {
    state.rewarded.state = status;
    state.rewarded.busy = true;
    assert.equal(canCancelAd(state), status === 'LOADING' || status === 'READY');
  }
  state.rewarded.state = 'READY';
  state.rewarded.busy = false;
  assert.equal(canCancelAd(state), false);
});
