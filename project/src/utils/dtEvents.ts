// dtEvents.ts
// Arquivo para capturar e tipar eventos globais do DTunnel

// Tipos de eventos disponíveis e seus payloads
export interface DtCheckUserModelEventPayload {
  expiration_days: string;
  limit_connections: string;
  expiration_date: string;
  username: string;
  count_connections: string;
}

export interface DtConfigSelectedEventPayload {
  id: number;
  name: string;
  description: string;
  mode: string;
  sorter?: number;
  icon?: string;
  // Campos opcionais comuns
  auth?: { v2ray_uuid?: string };
  category_id?: number;
  config_openvpn?: string;
  config_payload?: { payload?: string; sni?: string };
  config_v2ray?: string;
  dns_server?: { dns1?: string; dns2?: string };
  dnstt_key?: string;
  dnstt_name_server?: string;
  dnstt_server?: string;
  proxy?: { host?: string; port?: number };
  server?: { host?: string; port?: number };
  tls_version?: string;
  udp_ports?: number[];
  url_check_user?: string;
  // Permite extensibilidade
  [key: string]: any;
}

export type DtVpnStateEventPayload =
  | 'STOPPING'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'AUTH'
  | 'AUTH_FAILED'
  | 'DISCONNECTED';

// Novos payloads para eventos expandidos
export interface DtHotspotStateEventPayload {
  state: 'RUNNING' | 'STOPPED';
}

export interface DtNetworkStatsEventPayload {
  downloadBytes: number;
  uploadBytes: number;
  downloadSpeed: string;
  uploadSpeed: string;
}

export interface DtLocalIPEventPayload {
  ip: string;
}

export interface DtAirplaneModeEventPayload {
  enabled: boolean;
}

export type DtunnelEventMap = {
  DtCheckUserStartedEvent: undefined;
  DtCheckUserModelEvent: DtCheckUserModelEventPayload;
  DtNewDefaultConfigEvent: undefined;
  DtMessageErrorEvent: undefined;
  DtNewLogEvent: undefined;
  DtErrorToastEvent: undefined;
  DtSuccessToastEvent: undefined;
  DtVpnStartedSuccessEvent: undefined;
  DtVpnStateEvent: DtVpnStateEventPayload;
  DtVpnStoppedSuccessEvent: undefined;
  DtConfigSelectedEvent: DtConfigSelectedEventPayload;
  // Novos eventos para sistema centralizado
  DtHotspotStateEvent: DtHotspotStateEventPayload;
  DtNetworkStatsEvent: DtNetworkStatsEventPayload;  
  DtLocalIPEvent: DtLocalIPEventPayload;
  DtAirplaneModeEvent: DtAirplaneModeEventPayload;
};

export type DtunnelEvent = keyof DtunnelEventMap;

// Função utilitária para registrar listeners tipados
export function onDtunnelEvent<K extends DtunnelEvent>(event: K, handler: (payload: DtunnelEventMap[K]) => void) {
  (window as any)[event] = handler;
}

// Função utilitária para disparar eventos globais
export function emitDtunnelEvent<K extends DtunnelEvent>(event: K, payload: DtunnelEventMap[K]) {
  if (typeof (window as any)[event] === 'function') {
    (window as any)[event](payload);
  }
}
