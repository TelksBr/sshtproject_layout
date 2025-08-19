import { VpnState, ConfigItem } from '../types';

// Wrapper functions for native Dt* methods
// These functions safely call the corresponding native methods documented in readme_dtunnel_functions.md

export const getVpnState = (): VpnState | null => {
  try {
    if (typeof window !== 'undefined' && window.DtGetVpnState) {
      return window.DtGetVpnState();
    }
    return null;
  } catch (error) {
    console.error('Error getting VPN state:', error);
    return null;
  }
};

export const connectVpn = (config: ConfigItem): boolean => {
  try {
    if (typeof window !== 'undefined' && window.DtConnect) {
      return window.DtConnect(config);
    }
    return false;
  } catch (error) {
    console.error('Error connecting VPN:', error);
    return false;
  }
};

export const disconnectVpn = (): boolean => {
  try {
    if (typeof window !== 'undefined' && window.DtDisconnect) {
      return window.DtDisconnect();
    }
    return false;
  } catch (error) {
    console.error('Error disconnecting VPN:', error);
    return false;
  }
};

export const getNetworkStats = () => {
  try {
    if (typeof window !== 'undefined' && window.DtGetNetworkStats) {
      return window.DtGetNetworkStats();
    }
    return null;
  } catch (error) {
    console.error('Error getting network stats:', error);
    return null;
  }
};

export const checkUserStatus = (credentials: any) => {
  try {
    if (typeof window !== 'undefined' && window.DtCheckUser) {
      return window.DtCheckUser(credentials);
    }
    return null;
  } catch (error) {
    console.error('Error checking user status:', error);
    return null;
  }
};