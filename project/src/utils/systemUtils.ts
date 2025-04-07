// System utility functions
export function cleanAppData(): boolean {
  if (window?.DtCleanApp?.execute && typeof window.DtCleanApp.execute === "function") {
    try {
      return window.DtCleanApp.execute();
    } catch (e) {
      console.error('Error cleaning app data:', e);
      return false;
    }
  }
  return false;
}

export function checkBatteryOptimization(): boolean {
  if (window?.DtIgnoreBatteryOptimizations?.execute && 
      typeof window.DtIgnoreBatteryOptimizations.execute === "function") {
    return window.DtIgnoreBatteryOptimizations.execute();
  }
  return false;
}

export function openApnSettings(): void {
  if (window?.DtStartApnActivity?.execute && 
      typeof window.DtStartApnActivity.execute === "function") {
    window.DtStartApnActivity.execute();
  }
}

export function openNetworkSettings(): void {
  if (window?.DtStartRadioInfoActivity?.execute && 
      typeof window.DtStartRadioInfoActivity.execute === "function") {
    window.DtStartRadioInfoActivity.execute();
  }
}

export function checkForUpdates(): void {
  if (window?.DtStartAppUpdate?.execute && 
      typeof window.DtStartAppUpdate.execute === "function") {
    window.DtStartAppUpdate.execute();
  }
}

export function openWebView(url: string): void {
  if (window?.DtStartWebViewActivity?.execute && 
      typeof window.DtStartWebViewActivity.execute === "function") {
    window.DtStartWebViewActivity.execute(url);
  } else {
    window.open(url, '_blank');
  }
}

export function checkUserStatus(): void {
  if (window?.DtStartCheckUser?.execute && 
      typeof window.DtStartCheckUser.execute === "function") {
    window.DtStartCheckUser.execute();
  }
}