// Wrapper leve para acessar o DTunnel SDK quando disponível
// e fazer fallback para a bridge via `window.Dt...` quando necessario.

type CallArgs = unknown[] | undefined;

let sdkInstance: any = null;

export function registerSdkInstance(instance: any) {
  sdkInstance = instance;
}

export function call(objectName: string, methodName: string, args?: CallArgs): unknown | null {
  try {
    if (sdkInstance && typeof sdkInstance.call === 'function') {
      return sdkInstance.call(objectName, methodName, args);
    }
  } catch {
    // ignore and fallback
  }

  const target = (window as any)[objectName];
  if (!target) return null;
  const fn = target[methodName];
  if (typeof fn === 'function') {
    try {
      return fn.apply(target, args || []);
    } catch {
      return null;
    }
  }
  return null;
}

export function callJson<T = unknown>(objectName: string, methodName: string, args?: CallArgs): T | null {
  const raw = call(objectName, methodName, args);
  if (raw == null) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  }
  return raw as T;
}

export function callVoid(objectName: string, methodName: string, args?: CallArgs): void {
  try {
    if (sdkInstance && typeof sdkInstance.callVoid === 'function') {
      sdkInstance.callVoid(objectName, methodName, args);
      return;
    }
  } catch {
    // ignore
  }
  // best-effort fallback
  call(objectName, methodName, args);
}

export default {
  registerSdkInstance,
  call,
  callJson,
  callVoid,
};
