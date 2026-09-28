import { useCallback, useEffect, useRef, useState } from 'react';
import type { VTunnelPlayUpdateState } from 'vtunnel-sdk';
import { useDTunnelEvent } from './useDTunnelEvent';
import { useToast } from './useToast';
import { getSdk } from '../utils/sdkInstance';

function parseState(payload: unknown): VTunnelPlayUpdateState | null {
  let value = payload;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (value && typeof value === 'object' && 'status' in value) {
    return value as VTunnelPlayUpdateState;
  }
  return null;
}

function readState(): VTunnelPlayUpdateState | null {
  try {
    return parseState(getSdk()?.playUpdate?.getState() ?? null);
  } catch {
    return null;
  }
}

/**
 * Google Play in-app update driven by the layout.
 * The prompts only open when the panel disabled the native dialog (nativePrompt=false);
 * the download progress banner is layout-only and shows in both cases.
 * The app re-sends "downloaded" on every resume, so "Depois" only hides it until then.
 */
export function useSdkPlayUpdate(blockingModal: string | null) {
  const [state, setState] = useState<VTunnelPlayUpdateState | null>(null);
  const [readyOpen, setReadyOpen] = useState(false);
  const [availableOpen, setAvailableOpen] = useState(false);
  const offeredRef = useRef(false);
  const { showError } = useToast();

  const apply = useCallback(
    (next: VTunnelPlayUpdateState) => {
      setState(next);
      const layoutPrompt = next.nativePrompt === false;
      setReadyOpen(layoutPrompt && next.status === 'downloaded');
      if (next.status !== 'available') {
        setAvailableOpen(false);
      } else if (layoutPrompt && next.mode === 'OFF' && !offeredRef.current) {
        offeredRef.current = true;
        setAvailableOpen(true);
      }
      if (next.status === 'failed') {
        showError('Não foi possível concluir a atualização. Tente novamente mais tarde.');
      }
    },
    [showError]
  );

  useEffect(() => {
    const initial = readState();
    if (initial) apply(initial);
  }, [apply]);

  useDTunnelEvent('playUpdateState', (payload) => {
    const next = parseState(payload);
    if (next) apply(next);
  });

  const restart = useCallback(() => {
    setReadyOpen(false);
    getSdk()?.playUpdate?.complete();
  }, []);

  const update = useCallback(() => {
    setAvailableOpen(false);
    getSdk()?.playUpdate?.start('FLEXIBLE');
  }, []);

  const dismiss = useCallback(() => {
    setReadyOpen(false);
    setAvailableOpen(false);
  }, []);

  const busy = blockingModal === 'terms' || blockingModal === 'privacy';
  const prompt: 'ready' | 'available' | null = busy
    ? null
    : readyOpen
      ? 'ready'
      : availableOpen
        ? 'available'
        : null;

  const progress =
    state?.status === 'downloading' && state.totalBytesToDownload > 0
      ? Math.min(100, Math.round((state.bytesDownloaded / state.totalBytesToDownload) * 100))
      : null;

  return {
    prompt,
    downloading: state?.status === 'downloading',
    progress,
    restart,
    update,
    dismiss,
  };
}
