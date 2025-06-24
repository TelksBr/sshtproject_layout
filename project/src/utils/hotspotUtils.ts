import { getHotspotNativeStatus, startHotspotNative, stopHotspotNative } from './appFunctions';

export interface HotspotDebugInfo {
  nativeStatus: string | null;
  nativeFunction: boolean;
  nativeError: string | null;
  lastAttempt: string | null;
  lastError: string | null;
  rawResponse: string | null;
}

export function getHotspotStatus(): 'STOPPED' | 'RUNNING' | null {
  try {
    const nativeStatus = getHotspotNativeStatus();
    if (!nativeStatus) return null;
    const normalizedStatus = String(nativeStatus).toUpperCase();
    return normalizedStatus === 'RUNNING' ? 'RUNNING' : 'STOPPED';
  } catch {
    return null;
  }
}

export function startHotspot(): void {
  try {
    startHotspotNative();
  } catch {
    // Error will be captured in debug info on next status check
  }
}

export function stopHotspot(): void {
  try {
    stopHotspotNative();
  } catch {
    // Error will be captured in debug info on next status check
  }
}