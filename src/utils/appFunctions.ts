import type { ConfigCategory, ConfigItem } from '../types/config';
import type { VpnState } from '../types/vpn';
import { getSdk } from './sdkInstance';
import { call, callJson, callVoid } from './dtunnelBridge';

// Utilitários para modo Hysteria
export function buildHysteriaPassword(username: string, password: string): string {
  return `${username}:${password}`;
}

export function parseHysteriaPassword(hysteriaPassword: string): { username: string; password: string } {
  const [username, ...rest] = hysteriaPassword.split(':');
  return { username, password: rest.join(':') };
}

// App Status Functions (via sdk.android)
export function getStatusbarHeight(): number {
  const sdk = getSdk();
  if (sdk?.android) {
    const v = sdk.android.getStatusBarHeight();
    return Number(v ?? 0);
  }
  const v = call('DtGetStatusBarHeight', 'execute');
  return Number(v ?? 0);
}

export function getNavbarHeight(): number {
  const sdk = getSdk();
  if (sdk?.android) {
    const v = sdk.android.getNavigationBarHeight();
    return Number(v ?? 0);
  }
  const v = call('DtGetNavigationBarHeight', 'execute');
  return Number(v ?? 0);
}

// App Config Functions
export function getConfigLabel(label: string): string | null {
  const sdk = getSdk();
  if (sdk?.app) {
    const cfg = sdk.app.getAppConfig(label);
    const val = cfg?.value;
    return val != null ? String(val) : null;
  }
  const v = call('DtGetAppConfig', 'execute', [label]);
  return v == null ? null : String(v);
}

export function getConfigVersion(): string | null {
  const sdk = getSdk();
  if (sdk?.config) {
    const v = sdk.config.getLocalConfigVersion();
    return v == null ? null : String(v);
  }
  const v = call('DtGetLocalConfigVersion', 'execute');
  return v == null ? null : String(v);
}

export function openDialogConfig(): void {
  const sdk = getSdk();
  if (sdk?.config) {
    sdk.config.openConfigDialog();
    return;
  }
  callVoid('DtExecuteDialogConfig', 'execute');
}

export function openDialogLogs(): void {
  const sdk = getSdk();
  if (sdk?.main) {
    sdk.main.showLoggerDialog();
    return;
  }
  callVoid('DtShowLoggerDialog', 'execute');
}

export function getDefaultConfig(): ConfigItem | null {
  const sdk = getSdk();
  if (sdk?.config) {
    return sdk.config.getDefaultConfig() as ConfigItem | null;
  }
  return callJson<ConfigItem>('DtGetDefaultConfig', 'execute');
}

// User Credentials Functions (via sdk.config)
export function getUsername(): string {
  const sdk = getSdk();
  if (sdk?.config) {
    const v = sdk.config.getUsername();
    return v == null ? '' : String(v);
  }
  const v = call('DtUsername', 'get');
  return v == null ? '' : String(v);
}

export function getPassword(): string {
  const sdk = getSdk();
  if (sdk?.config) {
    const v = sdk.config.getPassword();
    return v == null ? '' : String(v);
  }
  const v = call('DtPassword', 'get');
  return v == null ? '' : String(v);
}

export function getUUID(): string {
  const sdk = getSdk();
  if (sdk?.config) {
    const v = sdk.config.getUuid();
    return v == null ? '' : String(v);
  }
  const v = call('DtUuid', 'get');
  return v == null ? '' : String(v);
}

export function setUsername(username: string): void {
  const sdk = getSdk();
  if (sdk?.config) {
    sdk.config.setUsername(username);
    return;
  }
  callVoid('DtUsername', 'set', [username]);
}

export function setPassword(password: string): void {
  const sdk = getSdk();
  if (sdk?.config) {
    sdk.config.setPassword(password);
    return;
  }
  callVoid('DtPassword', 'set', [password]);
}

export function setUUID(uuid: string): void {
  const sdk = getSdk();
  if (sdk?.config) {
    sdk.config.setUuid(uuid);
    return;
  }
  callVoid('DtUuid', 'set', [uuid]);
}

// Connection Functions (via sdk.main)
export function getConnectionState(): VpnState | null {
  const sdk = getSdk();
  if (sdk?.main) {
    const state = sdk.main.getVpnState();
    const validStates: VpnState[] = [
      'CONNECTED', 'DISCONNECTED', 'CONNECTING', 'STOPPING', 'NO_NETWORK', 'AUTH', 'AUTH_FAILED'
    ];
    if (state && validStates.includes(state)) return state;
    return null;
  }
  const state = call('DtGetVpnState', 'execute');
  const validStates: VpnState[] = [
    'CONNECTED', 'DISCONNECTED', 'CONNECTING', 'STOPPING', 'NO_NETWORK', 'AUTH', 'AUTH_FAILED'
  ];
  if (typeof state === 'string' && validStates.includes(state as VpnState)) return state as VpnState;
  return null;
}

export function startConnection(): void {
  const sdk = getSdk();
  if (sdk?.main) {
    sdk.main.startVpn();
    return;
  }
  callVoid('DtExecuteVpnStart', 'execute');
}

export function stopConnection(): void {
  const sdk = getSdk();
  if (sdk?.main) {
    sdk.main.stopVpn();
    return;
  }
  callVoid('DtExecuteVpnStop', 'execute');
}

// Network Stats (via sdk.android)
export function getDownloadBytes(): number {
  const sdk = getSdk();
  if (sdk?.android) {
    const v = sdk.android.getNetworkDownloadBytes();
    return Number(v ?? 0);
  }
  const v = call('DtGetNetworkDownloadBytes', 'execute');
  return Number(v ?? 0);
}

export function getUploadBytes(): number {
  const sdk = getSdk();
  if (sdk?.android) {
    const v = sdk.android.getNetworkUploadBytes();
    return Number(v ?? 0);
  }
  const v = call('DtGetNetworkUploadBytes', 'execute');
  return Number(v ?? 0);
}

export function getLocalIP(): string | null {
  const sdk = getSdk();
  if (sdk?.main) {
    const v = sdk.main.getLocalIp();
    return v == null ? null : String(v);
  }
  const v = call('DtGetLocalIP', 'execute');
  return v == null ? null : String(v);
}

export function checkUserStatus(): void {
  const sdk = getSdk();
  if (sdk?.main) {
    sdk.main.startCheckUser();
    return;
  }
  callVoid('DtStartCheckUser', 'execute');
}

// System Functions
export function cleanAppData(): boolean {
  try {
    const sdk = getSdk();
    if (sdk?.app) {
      sdk.app.cleanApp();
      return true;
    }
    const v = call('DtCleanApp', 'execute');
    return Boolean(v);
  } catch {
    return false;
  }
}

export function checkBatteryOptimization(): boolean {
  const sdk = getSdk();
  if (sdk?.app) {
    try {
      sdk.app.ignoreBatteryOptimizations();
      return true;
    } catch {
      return false;
    }
  }
  const v = call('DtIgnoreBatteryOptimizations', 'execute');
  return Boolean(v);
}

export function openApnSettings(): void {
  const sdk = getSdk();
  if (sdk?.app) {
    sdk.app.startApnActivity();
    return;
  }
  callVoid('DtStartApnActivity', 'execute');
}

export function openNetworkSettings(): void {
  const sdk = getSdk();
  if (sdk?.app) {
    sdk.app.startRadioInfoActivity();
    return;
  }
  callVoid('DtStartRadioInfoActivity', 'execute');
}

export function checkForUpdates(): void {
  const sdk = getSdk();
  if (sdk?.main) {
    sdk.main.startAppUpdate();
    return;
  }
  callVoid('DtStartAppUpdate', 'execute');
}

// Airplane Mode (via sdk.main)
export function getAirplaneState(): boolean {
  const sdk = getSdk();
  if (sdk?.main) {
    const state = sdk.main.getAirplaneState();
    return state === 'ACTIVE';
  }
  const v = call('DtAirplaneState', 'execute');
  return String(v) === 'ACTIVE';
}

export async function toggleAirplaneMode(enable: boolean): Promise<boolean> {
  try {
    const sdk = getSdk();
    if (sdk?.main) {
      if (enable) sdk.main.activateAirplaneMode();
      else sdk.main.deactivateAirplaneMode();
      return getAirplaneState();
    }
    if (enable) {
      await call('DtAirplaneActivate', 'execute');
    } else {
      await call('DtAirplaneDeactivate', 'execute');
    }
    return getAirplaneState();
  } catch {
    return !enable;
  }
}

// Config centralizada
export function getAllConfigs(): ConfigCategory[] {
  try {
    const sdk = getSdk();
    let configs: ConfigCategory[] | null = null;
    if (sdk?.config) {
      configs = sdk.config.getConfigs();
    }
    if (!configs) {
      configs = callJson<ConfigCategory[]>('DtGetConfigs', 'execute');
    }
    if (!configs) return [];
    configs.sort((a, b) => a.sorter - b.sorter);
    configs.forEach((cat) => {
      cat.items.sort((a, b) => a.sorter - b.sorter);
    });
    return configs;
  } catch {
    return [];
  }
}

export function setActiveConfig(configId: number): boolean {
  try {
    const sdk = getSdk();
    if (sdk?.config) {
      sdk.config.setConfig(configId);
      return true;
    }
    callVoid('DtSetConfig', 'execute', [configId]);
    return true;
  } catch {
    return false;
  }
}

export function getActiveConfig(): ConfigItem | null {
  try {
    const sdk = getSdk();
    if (sdk?.config) {
      return sdk.config.getDefaultConfig() as ConfigItem | null;
    }
    return callJson<ConfigItem>('DtGetDefaultConfig', 'execute');
  } catch {
    return null;
  }
}

export function shouldShowInput(type: 'username' | 'password' | 'uuid'): boolean {
  const config = getActiveConfig();
  if (!config) return true;

  if (config.mode?.toLowerCase().startsWith('v2ray')) {
    if (type === 'uuid') return !config.auth?.v2ray_uuid;
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

// Tradução (via sdk.text)
export function translateText(key: string): string {
  const sdk = getSdk();
  if (sdk?.text) {
    const v = sdk.text.translate(key);
    return v == null ? key : String(v);
  }
  const v = call('DtTranslateText', 'execute', [key]);
  return v == null ? key : String(v);
}

// Hotspot (via sdk.android)
export function getHotspotNativeStatus(): string | null {
  const sdk = getSdk();
  if (sdk?.android) {
    const v = sdk.android.getHotSpotStatus();
    return v == null ? null : String(v);
  }
  const v = call('DtGetStatusHotSpotService', 'execute');
  return v == null ? null : String(v);
}

export function startHotspotNative(): void {
  const sdk = getSdk();
  if (sdk?.android) {
    sdk.android.startHotSpotService();
    return;
  }
  callVoid('DtStartHotSpotService', 'execute');
}

export function stopHotspotNative(): void {
  const sdk = getSdk();
  if (sdk?.android) {
    sdk.android.stopHotSpotService();
    return;
  }
  callVoid('DtStopHotSpotService', 'execute');
}

// URLs: WebView interno e browser externo
export function openUrl(url: string): unknown {
  const sdk = getSdk();
  if (sdk?.app) {
    sdk.app.startWebViewActivity(url);
    return null;
  }
  return call('DtStartWebViewActivity', 'execute', [url]);
}

export function openExternalUrl(uri: string): unknown {
  const sdk = getSdk();
  if (sdk?.android) {
    sdk.android.openExternalUrl(uri);
    return null;
  }
  return call('DtStartWebViewActivity', 'execute', [uri]);
}
