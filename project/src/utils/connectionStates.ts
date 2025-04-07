export type ConnectionState = 
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'STOPPING'
  | 'NO_NETWORK'
  | 'AUTH'
  | 'AUTH_FAILED';

export interface ConnectionStateConfig {
  buttonText: string;
  statusText: string;
  color: string;
  icon: 'wifi' | 'wifi-off' | 'loader' | 'alert-circle' | 'shield-alert';
}

export const CONNECTION_STATES: Record<ConnectionState, ConnectionStateConfig> = {
  DISCONNECTED: {
    buttonText: 'LBL_BTN_START',
    statusText: 'LBL_STATE_DISCONNECTED',
    color: 'text-red-500',
    icon: 'wifi-off'
  },
  CONNECTING: {
    buttonText: 'LBL_BTN_STOP',
    statusText: 'LBL_STATE_CONNECTING',
    color: 'text-yellow-500',
    icon: 'loader'
  },
  CONNECTED: {
    buttonText: 'LBL_BTN_STOP',
    statusText: 'LBL_STATE_CONNECTED',
    color: 'text-green-500',
    icon: 'wifi'
  },
  STOPPING: {
    buttonText: 'LBL_BTN_STOPPING',
    statusText: 'LBL_STATE_STOPPING',
    color: 'text-yellow-500',
    icon: 'loader'
  },
  NO_NETWORK: {
    buttonText: 'LBL_BTN_STOP',
    statusText: 'LBL_STATE_NO_NETWORK',
    color: 'text-red-500',
    icon: 'alert-circle'
  },
  AUTH: {
    buttonText: 'LBL_BTN_STOP',
    statusText: 'LBL_STATE_AUTH',
    color: 'text-yellow-500',
    icon: 'shield-alert'
  },
  AUTH_FAILED: {
    buttonText: 'LBL_BTN_START',
    statusText: 'LBL_STATE_AUTH_FAILED',
    color: 'text-red-500',
    icon: 'shield-alert'
  }
};