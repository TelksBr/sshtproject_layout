import type { ConfigCategory, ConfigItem } from '../types/config';
import type { VpnState, } from '../types/vpn';
import { call, callJson, callVoid } from './dtunnelBridge';

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
  const v = call('DtGetStatusBarHeight', 'execute');
  return Number(v ?? 0);
}

export function getNavbarHeight(): number {
  const v = call('DtGetNavigationBarHeight', 'execute');
  return Number(v ?? 0);
}

// App Config Functions
export function getConfigLabel(label: string): string | null {
  const v = call('DtGetAppConfig', 'execute', [label]);
  return v == null ? null : String(v);
}

export function getConfigVersion(): string | null {
  const v = call('DtGetLocalConfigVersion', 'execute');
  return v == null ? null : String(v);
}

export function openDialogConfig(): void {
  callVoid('DtExecuteDialogConfig', 'execute');
}

export function openDialogLogs(): void {
  callVoid('DtShowLoggerDialog', 'execute');
}

export function getDefaultConfig(): any {
  return callJson('DtGetDefaultConfig', 'execute');
}

// User Credentials Functions
export function getUsername(): string {
  const v = call('DtUsername', 'get');
  return v == null ? '' : String(v);
}

export function getPassword(): string {
  const v = call('DtPassword', 'get');
  return v == null ? '' : String(v);
}

export function getUUID(): string {
  const v = call('DtUuid', 'get');
  return v == null ? '' : String(v);
}

export function setUsername(username: string): void {
  callVoid('DtUsername', 'set', [username]);
}

export function setPassword(password: string): void {
  callVoid('DtPassword', 'set', [password]);
}

export function setUUID(uuid: string): void {
  callVoid('DtUuid', 'set', [uuid]);
}

// Connection Functions
export function getConnectionState(): VpnState | null {
  const state = call('DtGetVpnState', 'execute');
  const validStates: VpnState[] = [
    'CONNECTED', 'DISCONNECTED', 'CONNECTING', 'STOPPING', 'NO_NETWORK', 'AUTH', 'AUTH_FAILED'
  ];
  if (typeof state === 'string' && validStates.includes(state as VpnState)) {
    return state as VpnState;
  }
  return null;
}

export function startConnection(): void {
  callVoid('DtExecuteVpnStart', 'execute');
}

export function stopConnection(): void {
  callVoid('DtExecuteVpnStop', 'execute');
}

// Network Stats Functions
export function getDownloadBytes(): number {
  const v = call('DtGetNetworkDownloadBytes', 'execute');
  return Number(v ?? 0);
}

export function getUploadBytes(): number {
  const v = call('DtGetNetworkUploadBytes', 'execute');
  return Number(v ?? 0);
}

// Network Functions
export function getLocalIP(): string | null {
  const v = call('DtGetLocalIP', 'execute');
  return v == null ? null : String(v);
}

// Checkuser Functions
export function checkUserStatus(): void {
  callVoid('DtStartCheckUser', 'execute');
}

// System Functions
export function cleanAppData(): boolean {
  try {
    const v = call('DtCleanApp', 'execute');
    return Boolean(v);
  } catch (e) {
    return false;
  }
}

export function checkBatteryOptimization(): boolean {
  const v = call('DtIgnoreBatteryOptimizations', 'execute');
  return Boolean(v);
}

export function openApnSettings(): void {
  callVoid('DtStartApnActivity', 'execute');
}

export function openNetworkSettings(): void {
  callVoid('DtStartRadioInfoActivity', 'execute');
}

export function checkForUpdates(): void {
  callVoid('DtStartAppUpdate', 'execute');
}

// Airplane Mode Functions
export function getAirplaneState(): boolean {
  const v = call('DtAirplaneState', 'execute');
  return String(v) === 'ACTIVE';
}

export async function toggleAirplaneMode(enable: boolean): Promise<boolean> {
  try {
    if (enable) {
      await call('DtAirplaneActivate', 'execute');
    } else {
      await call('DtAirplaneDeactivate', 'execute');
    }

    // Verifica o estado atual após a tentativa de alteração
    return getAirplaneState();
  } catch (error) {
    return !enable; // Retorna o estado anterior em caso de erro
  }
}


// Funções de configuração centralizadas
export function getAllConfigs(): ConfigCategory[] {
  try {
    const configs = callJson<ConfigCategory[]>('DtGetConfigs', 'execute');
    if (!configs) return [];
    configs.sort((a: ConfigCategory, b: ConfigCategory) => a.sorter - b.sorter);
    configs.forEach((category: ConfigCategory) => {
      category.items.sort((a, b) => a.sorter - b.sorter);
    });
    return configs;
  } catch (e) {
    return [];
  }
}

export function setActiveConfig(configId: number): boolean {
  try {
    callVoid('DtSetConfig', 'execute', [configId]);
    return true;
  } catch (e) {
    return false;
  }
}

export function getActiveConfig(): ConfigItem | null {
  try {
    return callJson<ConfigItem>('DtGetDefaultConfig', 'execute');
  } catch (e) {
    return null;
  }
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
  const v = call('DtTranslateText', 'execute', [key]);
  return v == null ? key : String(v);
}

// Hotspot Native Functions
export function getHotspotNativeStatus(): string | null {
  const v = call('DtGetStatusHotSpotService', 'execute');
  return v == null ? null : String(v);
}

export function startHotspotNative(): void {
  callVoid('DtStartHotSpotService', 'execute');
}

export function stopHotspotNative(): void {
  callVoid('DtStopHotSpotService', 'execute');
}

// External URL Functions
export function openUrl(url: string) {
  return call('DtStartWebViewActivity', 'execute', [url]);
}

export function openExternalUrl(uri: string) {
  return call('DtStartWebViewActivity', 'execute', [uri]);
}

// Tipagem global mantida via wrapper - não é mais necessario declarar aqui