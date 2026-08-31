import DTunnelSDK from 'dtunnel-sdk';

export interface DebugEventLogEntry {
  id: string;
  source: string;
  name: string;
  payload: unknown;
  time: number;
}

declare global {
  interface Window {
    __DT_EVENT_LOGS__?: DebugEventLogEntry[];
  }
}

type Listener = (payload?: unknown) => void;

const listeners = new Map<string, Set<Listener>>();

const SDK_EVENTS = [
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

export function recordDebugLog(source: string, name: string, payload: unknown): void {
  if (typeof window === 'undefined') return;
  window.__DT_EVENT_LOGS__ = window.__DT_EVENT_LOGS__ || [];
  const entry: DebugEventLogEntry = {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    source,
    name,
    payload,
    time: Date.now(),
  };
  window.__DT_EVENT_LOGS__.push(entry);
  if (window.__DT_EVENT_LOGS__.length > 200) {
    window.__DT_EVENT_LOGS__.shift();
  }
}

export function getEventDebugLogs(): DebugEventLogEntry[] {
  if (typeof window === 'undefined') return [];
  return [...(window.__DT_EVENT_LOGS__ || [])];
}

export function clearEventDebugLogs(): void {
  if (typeof window === 'undefined') return;
  window.__DT_EVENT_LOGS__ = [];
}

function sdkEventNames(): string[] {
  const defs = DTunnelSDK?.EVENT_DEFINITIONS;
  if (defs && typeof defs === 'object') {
    const names = Object.keys(defs);
    if (names.length > 0) return names;
  }
  return SDK_EVENTS;
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
const SEMANTIC_DEDUPE_MS = 300;

function emitSemantic(eventName: string, payload?: unknown): void {
  const now = Date.now();
  const key = payloadKey(payload);
  const prev = recentSemantic.get(eventName);
  if (prev && prev.key === key && now - prev.at < SEMANTIC_DEDUPE_MS) {
    return;
  }
  recentSemantic.set(eventName, { key, at: now });
  recordDebugLog('sdk', eventName, payload);
  emit(eventName, payload);
}

const pendingEarlyEvents = new Map<string, unknown[]>();

export function on(eventName: string, listener: Listener): () => void {
  let set = listeners.get(eventName);
  if (!set) {
    set = new Set();
    listeners.set(eventName, set);
  }
  set.add(listener);

  // Se houver eventos recebidos antes deste listener se registrar, entrega imediatamente
  const pending = pendingEarlyEvents.get(eventName);
  if (pending && pending.length > 0) {
    const queue = [...pending];
    pendingEarlyEvents.delete(eventName);
    setTimeout(() => {
      for (const payload of queue) {
        try {
          listener(payload);
        } catch {
          /* swallow */
        }
      }
    }, 0);
  }

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
  if (!set || set.size === 0) {
    let queue = pendingEarlyEvents.get(eventName);
    if (!queue) {
      queue = [];
      pendingEarlyEvents.set(eventName, queue);
    }
    queue.push(payload);
    return;
  }
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
    sdk.on('error', (rawEvent: unknown) => {
      const event = rawEvent as { error?: unknown; payload?: unknown } | undefined;
      const errorPayload = isSdkEnvelope(event) ? event.payload : (event?.error ?? event);
      recordDebugLog('sdk_error', 'error', errorPayload);
      emit('error', errorPayload);
    });
  } catch {
    /* ignore */
  }
}

