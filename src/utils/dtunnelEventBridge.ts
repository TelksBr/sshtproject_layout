// Ponte de eventos: registra listeners no SDK e reemite para o app

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

export function once(eventName: string, listener: Listener): () => void {
  const wrapper = (payload?: unknown) => {
    try { listener(payload); } finally { off(eventName, wrapper); }
  };
  return on(eventName, wrapper);
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
    try { l(payload); } catch (e) { /* swallow */ }
  }
}

// Lista de eventos semanticos conforme docs
const SDK_EVENTS = [
  'vpnState', 'vpnStartedSuccess', 'vpnStoppedSuccess', 'newLog', 'newDefaultConfig',
  'checkUserStarted', 'checkUserResult', 'checkUserError', 'messageError',
  'showSuccessToast', 'showErrorToast', 'notification'
];

export function registerSdkForEvents(sdk: any) {
  if (!sdk || typeof sdk.on !== 'function') return;

  // Registrar eventos semanticos
  for (const ev of SDK_EVENTS) {
    try {
      sdk.on(ev, (payload: unknown) => {
        emit(ev, payload);
      });
    } catch (e) {
      // ignore
    }
  }

  // Eventos genericos
  try {
    sdk.on('nativeEvent', (event: any) => {
      // reemit nativeEvent under same name and also under specific callback if provided
      emit('nativeEvent', event);
      if (event && event.callbackName) {
        emit(`native:${event.callbackName}`, event.payload);
      }
    });
  } catch (e) {}

  try {
    sdk.on('error', (err: any) => {
      emit('error', err);
    });
  } catch (e) {}
}

export default {
  on, off, once, emit, registerSdkForEvents
};
