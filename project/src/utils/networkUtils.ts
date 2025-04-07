export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B/s';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function calculateSpeed(currentBytes: number, previousBytes: number, interval: number): number {
  return (currentBytes - previousBytes) / (interval / 1000);
}

export function getNetworkType(): string {
  if (window?.DtGetNetworkType?.execute && typeof window.DtGetNetworkType.execute === "function") {
    return window.DtGetNetworkType.execute();
  }
  return 'unknown';
}

export function checkNetworkConnectivity(): boolean {
  if (window?.DtCheckNetworkConnectivity?.execute && 
      typeof window.DtCheckNetworkConnectivity.execute === "function") {
    return window.DtCheckNetworkConnectivity.execute() === true;
  }
  return false;
}

export function getNetworkStatus(): string {
  if (window?.DtGetNetworkStatus?.execute && 
      typeof window.DtGetNetworkStatus.execute === "function") {
    return window.DtGetNetworkStatus.execute();
  }
  return 'NO_NETWORK';
}