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
    const nativeFunction = !!(window?.DtGetStatusHotSpotService?.execute && 
      typeof window?.DtGetStatusHotSpotService?.execute === "function");

    if (!nativeFunction) {
      return null;
    }

    const rawResponse = window.DtGetStatusHotSpotService.execute();
    const normalizedStatus = String(rawResponse).toUpperCase();

    return normalizedStatus === 'RUNNING' ? 'RUNNING' : 'STOPPED';
  } catch {
    return null;
  }
}

export function startHotspot(): void {
  try {
    if (window?.DtStartHotSpotService?.execute && 
        typeof window?.DtStartHotSpotService?.execute === "function") {
      window.DtStartHotSpotService.execute();
    }
  } catch {
    // Error will be captured in debug info on next status check
  }
}

export function stopHotspot(): void {
  try {
    if (window?.DtStopHotSpotService?.execute && 
        typeof window?.DtStopHotSpotService?.execute === "function") {
      window.DtStopHotSpotService.execute();
    }
  } catch {
    // Error will be captured in debug info on next status check
  }
}