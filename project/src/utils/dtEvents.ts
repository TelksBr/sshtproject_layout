// dtEvents.ts
// Arquivo para capturar e tipar eventos globais do DTunnel

// Tipos de eventos disponíveis
export type DtunnelEvent =
  | 'DtCheckUserStartedEvent'
  | 'DtCheckUserModelEvent'
  | 'DtNewDefaultConfigEvent'
  | 'DtMessageErrorEvent'
  | 'DtNewLogEvent'
  | 'DtErrorToastEvent'
  | 'DtSuccessToastEvent'
  | 'DtVpnStartedSuccessEvent'
  | 'DtVpnStateEvent'
  | 'DtVpnStoppedSuccessEvent'
  | 'DtConfigSelectedEvent'; // NOVO

// Interface para cada evento (exemplo, pode ser expandida conforme necessário)
export interface DtVpnStateEvent {
  state: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'STOPPING' | 'NO_NETWORK' | 'AUTH' | 'AUTH_FAILED';
}

// Função utilitária para registrar listeners tipados
export function onDtunnelEvent<T = any>(event: DtunnelEvent, handler: (payload: T) => void) {
  (window as any)[event] = handler;
}

// Função utilitária para disparar eventos globais
export function emitDtunnelEvent<T = any>(event: DtunnelEvent, payload: T) {
  if (typeof (window as any)[event] === 'function') {
    (window as any)[event](payload);
  }
}

// Exemplo de uso:
// onDtunnelEvent<DtVpnStateEvent>('DtVpnStateEvent', (payload) => {
//   console.log('Novo estado da VPN:', payload.state);
// });
