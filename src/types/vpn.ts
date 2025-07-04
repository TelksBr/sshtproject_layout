// types/vpn.ts

export type VpnState =
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'STOPPING'
  | 'NO_NETWORK'
  | 'AUTH'
  | 'AUTH_FAILED';

export type NetworkType = 'MOBILE' | 'WIFI';
export type AirplaneState = 'ACTIVE' | 'INACTIVE';

export interface NetworkData {
  type_name: NetworkType;
  type: number | string;
  extra_info: string;
  detailed_state: string;
  reason?: string;
}
