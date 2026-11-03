import { message as tr, useMessages } from '../i18n/messages';
import { useCallback, useState } from 'react';
import type { VTunnelConfigImportState } from 'vtunnel-sdk';
import { useDTunnelEvent } from './useDTunnelEvent';
import { useToast } from './useToast';
import { useActiveConfig } from '../context/ActiveConfigContext';
import { getSdk } from '../utils/sdkInstance';

function parseState(payload: unknown): VTunnelConfigImportState | null {
  let value = payload;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (value && typeof value === 'object' && 'status' in value) {
    return value as VTunnelConfigImportState;
  }
  return null;
}

/**
 * Offline config import (vt:// links and clipboard) driven by the layout.
 * "pending" only arrives when the panel disabled the native dialog, and the app re-sends it
 * on resume, so there is no getPending() on mount (it would race the native dialog).
 */
export function useSdkConfigImport() {
  useMessages();
  const [pending, setPending] = useState<VTunnelConfigImportState | null>(null);
  const { showSuccess, showError } = useToast();
  const { refreshActiveConfig } = useActiveConfig();

  useDTunnelEvent('configImport', (payload) => {
    const next = parseState(payload);
    if (!next) return;
    if (next.status === 'pending') {
      setPending(next);
      return;
    }
    setPending(null);
    if (next.status === 'imported') {
      const first = next.configs[0]?.name;
      showSuccess(
        next.count === 1 && first
          ? tr("m2ae3e12ed0", { p0: first })
          : tr("m60b6d78652", { p0: next.count })
      );
      refreshActiveConfig();
    } else if (next.status === 'failed') {
      showError(tr("m432fd34dbc"));
    }
  });

  const confirm = useCallback(() => {
    setPending(null);
    getSdk()?.configImport?.confirm();
  }, []);

  const reject = useCallback(() => {
    setPending(null);
    getSdk()?.configImport?.reject();
  }, []);

  return { pending, confirm, reject };
}
