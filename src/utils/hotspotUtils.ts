// Hotspot utilities - interface direta com as APIs nativas

export function getHotspotStatus(): 'STOPPED' | 'RUNNING' | null {
  try {
    if (window?.DtGetStatusHotSpotService?.execute && 
        typeof window.DtGetStatusHotSpotService.execute === "function") {
      const status = window.DtGetStatusHotSpotService.execute();
      
      const normalizedStatus = String(status).toUpperCase().trim();
      if (normalizedStatus === 'RUNNING' || normalizedStatus === 'ACTIVE') {
        return 'RUNNING';
      } else if (normalizedStatus === 'STOPPED' || normalizedStatus === 'INACTIVE') {
        return 'STOPPED';
      }
      
      return 'STOPPED';
    }
    return null;
  } catch (error) {
    return null;
  }
}

export function startHotspot(): boolean {
  try {
    if (window?.DtStartHotSpotService?.execute && 
        typeof window.DtStartHotSpotService.execute === "function") {
      window.DtStartHotSpotService.execute();
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

export function stopHotspot(): boolean {
  try {
    if (window?.DtStopHotSpotService?.execute && 
        typeof window.DtStopHotSpotService.execute === "function") {
      window.DtStopHotSpotService.execute();
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}