import { getSdk } from './sdkInstance';
import { call, callVoid } from './dtunnelBridge';

export function getHotspotStatus(): 'STOPPED' | 'RUNNING' | null {
  try {
    const sdk = getSdk();
    let status: string | null = null;
    if (sdk?.android) {
      const v = sdk.android.getHotSpotStatus();
      status = v ? String(v) : null;
    }
    if (status == null) {
      status = call('DtGetStatusHotSpotService', 'execute') as string | null;
    }
    if (status == null) return null;
    const normalizedStatus = String(status).toUpperCase().trim();
    if (normalizedStatus === 'RUNNING' || normalizedStatus === 'ACTIVE') return 'RUNNING';
    if (normalizedStatus === 'STOPPED' || normalizedStatus === 'INACTIVE') return 'STOPPED';
    return 'STOPPED';
  } catch {
    return null;
  }
}

export function startHotspot(): boolean {
  try {
    const sdk = getSdk();
    if (sdk?.android) {
      sdk.android.startHotSpotService();
      return true;
    }
    callVoid('DtStartHotSpotService', 'execute');
    return true;
  } catch {
    return false;
  }
}

export function stopHotspot(): boolean {
  try {
    const sdk = getSdk();
    if (sdk?.android) {
      sdk.android.stopHotSpotService();
      return true;
    }
    callVoid('DtStopHotSpotService', 'execute');
    return true;
  } catch {
    return false;
  }
}