/**
 * Ponte de eventos: registra listeners no SDK e reemite para o app.
 * Usa o envelope 2.0 `{ name, callbackName, payload, rawPayload, args, timestamp }`
 * e publica só o `payload` (que pode ser undefined — ex.: newLog).
 */

import DTunnelSDK from 'dtunnel-sdk';

type Listener = (payload?: unknown) => void;

const listeners = new Map<string, Set<Listener>>();

const FALLBACK_EVENTS = [
  'vpnState',
  'vpnStartedSuccess',
  'vpnStoppedSuccess',
  'newLog',
  'newDefaultConfig',
  'checkUserStarted',
  'checkUserResult',
  'checkUserError',
  'messageError',
  'showSuccessToast',
  'showErrorToast',
  'notification',
  'localIp',
  'networkName',
  'pingResult',
  'checkingAppUpdate',
  'airplaneState',
  'hotSpotState',
  'reloadRequest',
];

function sdkEventNames(): string[] {
  const defs = DTunnelSDK?.EVENT_DEFINITIONS;
  if (defs && typeof defs === 'object') {
    const names = Object.keys(defs);
    if (names.length > 0) return names;
  }
  return FALLBACK_EVENTS;
}

function isSdkEnvelope(event: unknown): event is { payload?: unknown; callbackName?: string } {
  return Boolean(
    event &&
      typeof event === 'object' &&
      'callbackName' in event &&
      'payload' in event
  );
}

function payloadKey(payload: unknown): string {
  if (payload == null) return '';
  if (typeof payload === 'string' || typeof payload === 'number' || typeof payload === 'boolean') {
    return String(payload);
  }
  try {
    return JSON.stringify(payload);
  } catch {
    return String(payload);
  }
}

const recentSemantic = new Map<string, { key: string; at: number }>();
const SEMANTIC_DEDUPE_MS = 400;

function emitSemantic(eventName: string, payload?: unknown): void {
  const now = Date.now();
  const key = payloadKey(payload);
  const prev = recentSemantic.get(eventName);
  if (prev && prev.key === key && now - prev.at < SEMANTIC_DEDUPE_MS) {
    return;
  }
  recentSemantic.set(eventName, { key, at: now });
  emit(eventName, payload);
}

export function on(eventName: string, listener: Listener): () => void {
  let set = listeners.get(eventName);
  if (!set) {
    set = new Set();
    listeners.set(eventName, set);
  }
  set.add(listener);
  return () => off(eventName, listener);
}

export function off(eventName: string, listener?: Listener): void {
  if (!listener) {
    listeners.delete(eventName);
    return;
  }
  const set = listeners.get(eventName);
  if (!set) return;
  set.delete(listener);
  if (set.size === 0) listeners.delete(eventName);
}

export function emit(eventName: string, payload?: unknown): void {
  const set = listeners.get(eventName);
  if (!set) return;
  for (const l of Array.from(set)) {
    try {
      l(payload);
    } catch {
      /* swallow */
    }
  }
}

export function registerSdkForEvents(sdk: { on?: (ev: string, fn: (e: unknown) => void) => (() => void) | void }): void {
  if (!sdk || typeof sdk.on !== 'function') return;

  for (const ev of sdkEventNames()) {
    try {
      sdk.on(ev, (event: unknown) => {
        emitSemantic(ev, isSdkEnvelope(event) ? event.payload : event);
      });
    } catch {
      /* ignore */
    }
  }

  try {
    sdk.on('nativeEvent', (event: { callbackName?: string; payload?: unknown }) => {
      emit('nativeEvent', event);
      if (event?.callbackName) {
        emit(`native:${event.callbackName}`, event.payload);
      }
    });
  } catch {
    /* ignore */
  }

  try {
    sdk.on('error', (event: { error?: unknown }) => {
      emit('error', isSdkEnvelope(event) ? event.payload : ((event as { error?: unknown })?.error ?? event));
    });
  } catch {
    /* ignore */
  }
}
