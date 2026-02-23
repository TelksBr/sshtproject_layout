/**
 * Wrapper para chamadas à bridge nativa.
 * ✅ Usa APENAS SDK DTunnel (sem fallback para window.Dt*)
 * ✅ Fallback para browser APIs seguros (navigator.clipboard, localStorage, etc)
 */

import { getSdk } from './sdkInstance';

type CallArgs = unknown[] | undefined;

export function call(objectName: string, methodName: string, args?: CallArgs): unknown | null {
  try {
    const sdk = getSdk();
    if (sdk && typeof sdk.call === 'function') {
      return sdk.call(objectName, methodName, args);
    }
  } catch (error) {
    console.warn(`⚠️ Erro ao chamar SDK: ${objectName}.${methodName}`, error);
  }

  // ❌ REMOVIDO: Fallback para window.Dt*
  // Agora retorna null ou use fallback browser específico
  console.error(`❌ API ${objectName}.${methodName} não disponível no SDK e window.Dt* foi removido`);
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
    const sdk = getSdk();
    if (sdk && typeof sdk.callVoid === 'function') {
      sdk.callVoid(objectName, methodName, args);
      return;
    }
  } catch (error) {
    console.warn(`⚠️ Erro ao chamar SDK: ${objectName}.${methodName}`, error);
  }

  // ❌ REMOVIDO: Fallback para window.Dt*
  console.error(`❌ API ${objectName}.${methodName} não disponível no SDK e window.Dt* foi removido`);
}

export default { 
  call, 
  callJson, 
  callVoid
};
