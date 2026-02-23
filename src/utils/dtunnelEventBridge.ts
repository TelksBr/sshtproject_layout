/**
 * Ponte de eventos: registra listeners no SDK e reemite para o app.
 * Usado para evitar dependência do React Context do dtunnel-sdk/react,
 * que pode falhar quando há múltiplas instâncias do React (bundling).
 */

type Listener = (payload?: unknown) => void;

const listeners = new Map<string, Set<Listener>>();

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

function emit(eventName: string, payload?: unknown): void {
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

const SDK_EVENTS = [
  'vpnState', 'vpnStartedSuccess', 'vpnStoppedSuccess', 'newLog', 'newDefaultConfig',
  'checkUserStarted', 'checkUserResult', 'checkUserError', 'messageError',
  'showSuccessToast', 'showErrorToast', 'notification'
];

export function registerSdkForEvents(sdk: { on?: (ev: string, fn: (e: unknown) => void) => (() => void) | void }): void {
  if (!sdk || typeof sdk.on !== 'function') return;

  for (const ev of SDK_EVENTS) {
    try {
      sdk.on(ev, (event: { payload?: unknown }) => {
        emit(ev, event?.payload ?? event);
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
      emit('error', event?.error ?? event);
    });
  } catch {
    /* ignore */
  }
}
