import { VpnState, ConfigItem, ConfigCategory } from '../types';

// =============================
// CONFIGURAÇÃO E VERSÃO
// =============================

export function getConfigVersion(): string | null {
  try {
    return window.DtGetLocalConfigVersion?.execute() || null;
  } catch {
    return null;
  }
}

export function getAppConfig(label: string): string | null {
  try {
    return window.DtGetAppConfig?.execute(label) || null;
  } catch {
    return null;
  }
}

// =============================
// LAYOUT E INTERFACE
// =============================

export function getStatusbarHeight(): number {
  try {
    return window.DtGetStatusBarHeight?.execute() || 0;
  } catch {
    return 0;
  }
}

export function getNavbarHeight(): number {
  try {
    return window.DtGetNavigationBarHeight?.execute() || 0;
  } catch {
    return 0;
  }
}

// =============================
// CONFIGURAÇÕES VPN
// =============================

export function getAllConfigs(): ConfigCategory[] {
  try {
    const configsJson = window.DtGetConfigs?.execute();
    if (configsJson && typeof configsJson === 'string') {
      return JSON.parse(configsJson);
    }
    return [];
  } catch {
    return [];
  }
}

export function getActiveConfig(): ConfigItem | null {
  try {
    return window.DtGetDefaultConfig?.execute() || null;
  } catch {
    return null;
  }
}

export function setActiveConfig(id: number): void {
  try {
    window.DtSetConfig?.execute(id);
  } catch {
    // Silently fail
  }
}

// =============================
// ESTADO DA VPN
// =============================

export function getConnectionState(): VpnState | null {
  try {
    const state = window.DtGetVpnState?.execute();
    return state as VpnState || null;
  } catch {
    return null;
  }
}

export function startConnection(): void {
  try {
    window.DtExecuteVpnStart?.execute();
  } catch {
    // Silently fail
  }
}

export function stopConnection(): void {
  try {
    window.DtExecuteVpnStop?.execute();
  } catch {
    // Silently fail
  }
}

// =============================
// CREDENCIAIS DE USUÁRIO
// =============================

export function getUsername(): string {
  try {
    return window.DtUsername?.get() || '';
  } catch {
    return '';
  }
}

export function setUsername(username: string): void {
  try {
    window.DtUsername?.set(username);
  } catch {
    // Silently fail
  }
}

export function getPassword(): string {
  try {
    return window.DtPassword?.get() || '';
  } catch {
    return '';
  }
}

export function setPassword(password: string): void {
  try {
    window.DtPassword?.set(password);
  } catch {
    // Silently fail
  }
}

export function getUUID(): string {
  try {
    return window.DtUuid?.get() || '';
  } catch {
    return '';
  }
}

export function setUUID(uuid: string): void {
  try {
    window.DtUuid?.set(uuid);
  } catch {
    // Silently fail
  }
}

// =============================
// REDE E ESTATÍSTICAS
// =============================

export function getLocalIP(): string | null {
  try {
    return window.DtGetLocalIP?.execute() || null;
  } catch {
    return null;
  }
}

export function getDownloadBytes(): number {
  try {
    return window.DtGetNetworkDownloadBytes?.execute() || 0;
  } catch {
    return 0;
  }
}

export function getUploadBytes(): number {
  try {
    return window.DtGetNetworkUploadBytes?.execute() || 0;
  } catch {
    return 0;
  }
}

// =============================
// MODO AVIÃO
// =============================

export function getAirplaneState(): boolean {
  try {
    const state = window.DtAirplaneState?.execute();
    return state === 'ACTIVE';
  } catch {
    return false;
  }
}

export async function toggleAirplaneMode(enable: boolean): Promise<boolean> {
  try {
    if (enable) {
      window.DtAirplaneActivate?.execute();
    } else {
      window.DtAirplaneDeactivate?.execute();
    }
    
    // Aguarda um pouco para a mudança ser aplicada
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return getAirplaneState();
  } catch {
    return getAirplaneState();
  }
}

// =============================
// HOTSPOT
// =============================

export function getHotspotNativeStatus(): string | null {
  try {
    return window.DtGetStatusHotSpotService?.execute() || null;
  } catch {
    return null;
  }
}

export function startHotspotNative(): void {
  try {
    window.DtStartHotSpotService?.execute();
  } catch {
    // Silently fail
  }
}

export function stopHotspotNative(): void {
  try {
    window.DtStopHotSpotService?.execute();
  } catch {
    // Silently fail
  }
}

// =============================
// DIÁLOGOS E INTERFACE NATIVA
// =============================

export function openDialogConfig(): void {
  try {
    window.DtExecuteDialogConfig?.execute();
  } catch {
    // Silently fail
  }
}

export function openDialogLogs(): void {
  try {
    window.DtShowLoggerDialog?.execute();
  } catch {
    // Silently fail
  }
}

export function checkUserStatus(): void {
  try {
    window.DtStartCheckUser?.execute();
  } catch {
    // Silently fail
  }
}

// =============================
// CONFIGURAÇÕES DO SISTEMA
// =============================

export function cleanAppData(): boolean {
  try {
    return window.DtCleanApp?.execute() || false;
  } catch {
    return false;
  }
}

export function checkBatteryOptimization(): boolean {
  try {
    return window.DtIgnoreBatteryOptimizations?.execute() || false;
  } catch {
    return false;
  }
}

export function openApnSettings(): void {
  try {
    window.DtStartApnActivity?.execute();
  } catch {
    // Silently fail
  }
}

export function openNetworkSettings(): void {
  try {
    window.DtStartRadioInfoActivity?.execute();
  } catch {
    // Silently fail
  }
}

export function checkForUpdates(): void {
  try {
    window.DtStartAppUpdate?.execute();
  } catch {
    // Silently fail
  }
}

export function openExternalUrl(url: string): void {
  try {
    window.DtStartWebViewActivity?.execute(url);
  } catch {
    // Fallback para window.open
    window.open(url, '_blank');
  }
}