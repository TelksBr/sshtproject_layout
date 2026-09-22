/**
 * Instância centralizada do VTunnel SDK.
 * Usada por funções utilitárias (appFunctions, nativeLayout, etc) que precisam
 * acessar o SDK fora do contexto React.
 */

let sdkInstance: import('vtunnel-sdk').default | null = null;

export function registerSdkInstance(instance: import('vtunnel-sdk').default | null): void {
  sdkInstance = instance;
}

export function getSdk(): import('vtunnel-sdk').default | null {
  return sdkInstance;
}
