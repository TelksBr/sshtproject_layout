/**
 * Instância centralizada do DTunnel SDK.
 * Usada por funções utilitárias (appFunctions, nativeLayout, etc) que precisam
 * acessar o SDK fora do contexto React.
 */

let sdkInstance: import('dtunnel-sdk').default | null = null;

export function registerSdkInstance(instance: import('dtunnel-sdk').default | null): void {
  sdkInstance = instance;
}

export function getSdk(): import('dtunnel-sdk').default | null {
  return sdkInstance;
}
