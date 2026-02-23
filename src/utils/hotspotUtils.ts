// Hotspot utilities - usa wrapper do SDK/bridge
import { call, callVoid } from './dtunnelBridge';

export function getHotspotStatus(): 'STOPPED' | 'RUNNING' | null {
  try {
    const status = call('DtGetStatusHotSpotService', 'execute');
    if (status == null) return null;
    const normalizedStatus = String(status).toUpperCase().trim();
    if (normalizedStatus === 'RUNNING' || normalizedStatus === 'ACTIVE') {
      return 'RUNNING';
    } else if (normalizedStatus === 'STOPPED' || normalizedStatus === 'INACTIVE') {
      return 'STOPPED';
    }
    return 'STOPPED';
  } catch (error) {
    return null;
  }
}

export function startHotspot(): boolean {
  try {
    callVoid('DtStartHotSpotService', 'execute');
    return true;
  } catch (error) {
    return false;
  }
}

export function stopHotspot(): boolean {
  try {
    callVoid('DtStopHotSpotService', 'execute');
    return true;
  } catch (error) {
    return false;
  }
}