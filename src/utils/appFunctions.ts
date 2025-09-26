import type { ConfigCategory, ConfigItem } from '../types/config';
import type { VpnState, } from '../types/vpn';

// Utilitários para modo Hysteria
export function buildHysteriaPassword(username: string, password: string): string {
  return `${username}:${password}`;
}

export function parseHysteriaPassword(hysteriaPassword: string): { username: string, password: string } {
  const [username, ...rest] = hysteriaPassword.split(':');
  return { username, password: rest.join(':') };
}

// App Status Functions
export function getStatusbarHeight(): number {
  if (window?.DtGetStatusBarHeight?.execute && typeof window.DtGetStatusBarHeight.execute === "function") {
    return window.DtGetStatusBarHeight.execute();
  }
  return 0;
}

export function getNavbarHeight(): number {
  if (window?.DtGetNavigationBarHeight?.execute && typeof window.DtGetNavigationBarHeight.execute === "function") {
    return window.DtGetNavigationBarHeight.execute();
  }
  return 0;
}

// App Config Functions
export function getConfigLabel(label: string): string | null {
  if (window?.DtGetAppConfig?.execute && typeof window.DtGetAppConfig.execute === "function") {
    return window.DtGetAppConfig.execute(label);
  }
  return null;
}

export function getConfigVersion(): string | null {
  if (window?.DtGetLocalConfigVersion?.execute && typeof window.DtGetLocalConfigVersion.execute === "function") {
    return window.DtGetLocalConfigVersion.execute();
  }
  return null;
}

export function openDialogConfig(): void {
  if (window?.DtExecuteDialogConfig?.execute && typeof window.DtExecuteDialogConfig.execute === "function") {
    window.DtExecuteDialogConfig.execute();
  }
}

export function openDialogLogs(): void {
  if (window?.DtShowLoggerDialog?.execute && typeof window.DtShowLoggerDialog.execute === "function") {
    window.DtShowLoggerDialog.execute();
  }
}

export function getDefaultConfig(): any {
  if (window?.DtGetDefaultConfig?.execute && typeof window.DtGetDefaultConfig.execute === "function") {
    return window.DtGetDefaultConfig.execute();
  }
  return null;
}

// User Credentials Functions
export function getUsername(): string {
  if (window?.DtUsername && typeof window.DtUsername.get === "function") {
    return window.DtUsername.get();
  }
  return '';
}

export function getPassword(): string {
  if (window?.DtPassword && typeof window.DtPassword.get === "function") {
    return window.DtPassword.get();
  }
  return '';
}

export function getUUID(): string {
  if (window?.DtUuid?.get && typeof window.DtUuid.get === "function") {
    return window.DtUuid.get();
  }
  return '';
}

export function setUsername(username: string): void {
  if (window?.DtUsername?.set && typeof window.DtUsername.set === "function") {
    window.DtUsername.set(username);
  }
}

export function setPassword(password: string): void {
  if (window?.DtPassword?.set && typeof window.DtPassword.set === "function") {
    window.DtPassword.set(password);
  }
}

export function setUUID(uuid: string): void {
  if (window?.DtUuid?.set && typeof window.DtUuid.set === "function") {
    window.DtUuid.set(uuid);
  }
}

// Connection Functions
export function getConnectionState(): VpnState | null {
  if (window?.DtGetVpnState?.execute && typeof window.DtGetVpnState.execute === "function") {
    const state = window.DtGetVpnState.execute();
    const validStates: VpnState[] = [
      'CONNECTED', 'DISCONNECTED', 'CONNECTING', 'STOPPING', 'NO_NETWORK', 'AUTH', 'AUTH_FAILED'
    ];
    if (typeof state === 'string' && validStates.includes(state as VpnState)) {
      return state as VpnState;
    }
    return null;
  }
  return null;
}

export function startConnection(): void {
  if (window?.DtExecuteVpnStart?.execute && typeof window.DtExecuteVpnStart.execute === "function") {
    window.DtExecuteVpnStart.execute();
  }
}

export function stopConnection(): void {
  if (window?.DtExecuteVpnStop?.execute && typeof window.DtExecuteVpnStop.execute === "function") {
    window.DtExecuteVpnStop.execute();
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

// Network Functions
export function getLocalIP(): string | null {
  if (window?.DtGetLocalIP?.execute && typeof window?.DtGetLocalIP?.execute === "function") {
    return window.DtGetLocalIP.execute();
  }
  return null;
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
    try {
      return window.DtCleanApp.execute();
    } catch (e) {
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
  if (window?.DtStartApnActivity?.execute && typeof window?.DtStartApnActivity.execute === "function") {
    window.DtStartApnActivity.execute();
  }
}

export function openNetworkSettings(): void {
  if (window?.DtStartRadioInfoActivity?.execute && typeof window?.DtStartRadioInfoActivity.execute === "function") {
    window.DtStartRadioInfoActivity.execute();
  }
}

export function checkForUpdates(): void {
  if (window?.DtStartAppUpdate?.execute && typeof window?.DtStartAppUpdate.execute === "function") {
    window.DtStartAppUpdate.execute();
  }
}

// Airplane Mode Functions
export function getAirplaneState(): boolean {
  if (window?.DtAirplaneState?.execute && typeof window.DtAirplaneState.execute === "function") {
    return window.DtAirplaneState.execute() === 'ACTIVE';
  }
  return false;
}

export async function toggleAirplaneMode(enable: boolean): Promise<boolean> {
  try {
    if (enable) {
      if (window?.DtAirplaneActivate?.execute && typeof window.DtAirplaneActivate.execute === "function") {
        await window.DtAirplaneActivate.execute();
      }
    } else {
      if (window?.DtAirplaneDeactivate?.execute && typeof window.DtAirplaneDeactivate.execute === "function") {
        await window.DtAirplaneDeactivate.execute();
      }
    }

    // Verifica o estado atual após a tentativa de alteração
    return getAirplaneState();
  } catch (error) {
    return !enable; // Retorna o estado anterior em caso de erro
  }
}


// Funções de configuração centralizadas
export function getAllConfigs(): ConfigCategory[] {
  if (window?.DtGetConfigs?.execute && typeof window.DtGetConfigs.execute === "function") {
    try {
      const configsRaw = window.DtGetConfigs.execute();
      const configs = JSON.parse(configsRaw);
      configs.sort((a: ConfigCategory, b: ConfigCategory) => a.sorter - b.sorter);
      configs.forEach((category: ConfigCategory) => {
        category.items.sort((a, b) => a.sorter - b.sorter);
      });
      return configs;
    } catch (e) {
      return [];
    }
  }
  return [];
}

export function setActiveConfig(configId: number): boolean {
  if (window?.DtSetConfig?.execute && typeof window.DtSetConfig.execute === "function") {
    try {
      window.DtSetConfig.execute(configId);
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
}

export function getActiveConfig(): ConfigItem | null {
  if (window?.DtGetDefaultConfig?.execute && typeof window.DtGetDefaultConfig.execute === "function") {
    try {
      const defaultConfig = window.DtGetDefaultConfig.execute();
      if (defaultConfig) {
        return JSON.parse(defaultConfig);
      }
    } catch (e) {
    }
  }
  return null;
}

export function shouldShowInput(type: 'username' | 'password' | 'uuid'): boolean {
  const config = getActiveConfig();
  if (!config) return true;

  if (config.mode?.toLowerCase().startsWith("v2ray")) {
    if (type === 'uuid') {
      return !config.auth?.v2ray_uuid;
    }
    return false;
  }

  switch (type) {
    case 'username':
      return !config.auth?.username;
    case 'password':
      return !config.auth?.password;
    case 'uuid':
      return false;
    default:
      return true;
  }
}

// Função de tradução centralizada
export function translateText(key: string): string {
  if (window?.DtTranslateText?.execute && typeof window.DtTranslateText.execute === "function") {
    return window.DtTranslateText.execute(key) || key;
  }
  return key;
}

// Hotspot Native Functions
export function getHotspotNativeStatus(): string | null {
  if (window?.DtGetStatusHotSpotService?.execute && typeof window.DtGetStatusHotSpotService.execute === "function") {
    return window.DtGetStatusHotSpotService.execute();
  }
  return null;
}

export function startHotspotNative(): void {
  if (window?.DtStartHotSpotService?.execute && typeof window.DtStartHotSpotService.execute === "function") {
    window.DtStartHotSpotService.execute();
  }
}

export function stopHotspotNative(): void {
  if (window?.DtStopHotSpotService?.execute && typeof window.DtStopHotSpotService.execute === "function") {
    window.DtStopHotSpotService.execute();
  }
}

// External URL Functions
export function openUrl(url: string) {
  if (typeof window?.DtStartWebViewActivity?.execute === 'function') {
    return window.DtStartWebViewActivity.execute(url);
  }
}

export function openExternalUrl(uri: string) {
  if (typeof window?.DtStartWebViewActivity?.execute === 'function') {
    return window.DtStartWebViewActivity.execute(uri);
  }
}

// Tipagem global para DtTranslateText e funções de Hotspot
declare global {
  interface Window {
    DtTranslateText?: { execute: (key: string) => string };
    DtGetStatusHotSpotService?: { execute: () => string };
    DtStartHotSpotService?: { execute: () => void };
    DtStopHotSpotService?: { execute: () => void };
  }
}