// App Status Functions
export function getStatusbarHeight(): number {
  if (window?.DtGetStatusBarHeight?.execute && typeof window?.DtGetStatusBarHeight.execute === "function") {
    return DtGetStatusBarHeight.execute();
  }
  return 0;
}

export function getNavbarHeight(): number {
  if (window?.DtGetNavigationBarHeight?.execute && typeof window?.DtGetNavigationBarHeight.execute === "function") {
    return DtGetNavigationBarHeight.execute();
  }
  return 0;
}

// App Config Functions
export function getConfigLabel(label: string): string | null {
  if (window?.DtGetAppConfig?.execute && typeof window?.DtGetAppConfig?.execute === "function") {
    return DtGetAppConfig.execute(label);
  }
  return null;
}

export function getConfigVersion(): string | null {
  if (window?.DtGetLocalConfigVersion?.execute && typeof window?.DtGetLocalConfigVersion?.execute === "function") {
    return DtGetLocalConfigVersion.execute();
  }
  return null;
}

export function openDialogConfig(): void {
  if (window?.DtExecuteDialogConfig?.execute && typeof window?.DtExecuteDialogConfig?.execute === "function") {
    DtExecuteDialogConfig.execute();
  }
}

export function openDialogLogs(): void {
  if (window?.DtShowLoggerDialog?.execute && typeof window?.DtShowLoggerDialog?.execute === "function") {
    DtShowLoggerDialog.execute();
  }
}

export function getDefaultConfig(): any {
  if (window?.DtGetDefaultConfig?.execute && typeof window?.DtGetDefaultConfig?.execute) {
    return DtGetDefaultConfig.execute();
  }
  return null;
}

// User Credentials Functions
export function getUsername(): string {
  if (window?.DtUsername && typeof window?.DtUsername.get === "function") {
    return DtUsername.get();
  }
  return '';
}

export function getPassword(): string {
  if (window?.DtPassword && typeof window?.DtPassword?.get === "function") {
    return DtPassword.get();
  }
  return '';
}

export function getUUID(): string {
  if (window?.DtUuid?.get && typeof window?.DtUuid.get === "function") {
    return DtUuid.get();
  }
  return '';
}

export function setUsername(username: string): void {
  if (window?.DtUsername?.set && typeof window?.DtUsername?.set === "function") {
    window.DtUsername.set(username);
  }
}

export function setPassword(password: string): void {
  if (window?.DtPassword?.set && typeof window?.DtPassword?.set === "function") {
    window.DtPassword.set(password);
  }
}

export function setUUID(uuid: string): void {
  if (window?.DtUuid.set && typeof window?.DtUuid?.set === "function") {
    window.DtUuid.set(uuid);
  }
}

// Connection Functions
export function getConnectionState(): string | null {
  if (window?.DtGetVpnState?.execute && typeof window?.DtGetVpnState?.execute === "function") {
    return DtGetVpnState.execute();
  }
  return null;
}

export function startConnection(): void {
  if (window?.DtExecuteVpnStart?.execute && typeof window?.DtExecuteVpnStart?.execute === "function") {
    DtExecuteVpnStart.execute();
  }
}

export function stopConnection(): void {
  if (window?.DtExecuteVpnStop?.execute && typeof window?.DtExecuteVpnStop?.execute === "function") {
    DtExecuteVpnStop.execute();
  }
}

// Network Stats Functions
export function getDownloadBytes(): number {
  if (window?.DtGetNetworkDownloadBytes?.execute && typeof window?.DtGetNetworkDownloadBytes?.execute === "function") {
    return Number(window?.DtGetNetworkDownloadBytes?.execute());
  }
  return 0;
}

export function getUploadBytes(): number {
  if (window?.DtGetNetworkUploadBytes?.execute && typeof window?.DtGetNetworkUploadBytes?.execute === "function") {
    return Number(window?.DtGetNetworkUploadBytes?.execute());
  }
  return 0;
}

// Checkuser Functions
export function checkUserStatus(): void {
  if (window?.DtStartCheckUser?.execute && typeof window?.DtStartCheckUser?.execute === "function") {
    window.DtStartCheckUser.execute();
  }
}

// System Functions
export function cleanAppData(): boolean {
  if (window?.DtCleanApp?.execute && typeof window.DtCleanApp.execute === "function") {
    return DtCleanApp.execute();
  }
  return false;
}

export function openApnSettings(): void {
  if (window?.DtStartApnActivity?.execute && typeof window?.DtStartApnActivity.execute === "function") {
    window.DtStartApnActivity.execute();
  }
}

export function openNetworkSettings(): void {
  if (window?.DtStartRadioInfoActivity?.execute && typeof window?.DtStartRadioInfoActivity.execute === "function") {
    window.DtStartRadioInfoActivity.execute();
  }
}

export function AppUpdate(): void {
  if (window?.DtStartAppUpdate?.execute && typeof window?.DtStartAppUpdate.execute === "function") {
    window.DtStartAppUpdate.execute();
  }
}

// Airplane Mode Functions
export function getAirplaneState(): boolean {
  if (window?.DtAirplaneState?.execute && typeof window.DtAirplaneState.execute === "function") {
    return window.DtAirplaneState.execute() === 'on';
  }
  return false;
}

export function setAirplaneMode(enable: boolean): void {
  if (enable) {
    if (window?.DtAirplaneActivate?.execute && typeof window.DtAirplaneActivate.execute === "function") {
      window.DtAirplaneActivate.execute();
    }
  } else {
    if (window?.DtAirplaneDeactivate?.execute && typeof window.DtAirplaneDeactivate.execute === "function") {
      window.DtAirplaneDeactivate.execute();
    }
  }
}