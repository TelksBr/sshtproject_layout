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
    return (sdk.config.getDefaultConfig() || sdk.config.getSelectedConfig()) as ConfigItem | null;
  }
  return (
    callJson<ConfigItem>('DtGetDefaultConfig', 'execute') ||
    callJson<ConfigItem>('DtGetSelectedConfig', 'execute')
  );
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
  try {
    if (typeof sdk?.main?.startCheckUser === 'function') {
      sdk.main.startCheckUser();
      return;
    }
  } catch {
    /* fallback abaixo */
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
    return getDefaultConfig();
  } catch {
    return null;
  }
}

function fieldRequired(
  requiresFlag: boolean | undefined,
  bakedValue: string | undefined,
  fallback: boolean
): boolean {
  if (typeof requiresFlag === 'boolean') return requiresFlag;
  if (bakedValue) return false;
  return fallback;
}

export function shouldShowInput(type: 'username' | 'password' | 'uuid'): boolean {
  const config = getActiveConfig();
  if (!config) return true;

  const isV2Ray = Boolean(config.mode?.toLowerCase().startsWith('v2ray'));

  switch (type) {
    case 'username':
      return fieldRequired(config.requires_username, config.auth?.username, !isV2Ray);
    case 'password':
      return fieldRequired(config.requires_password, config.auth?.password, !isV2Ray);
    case 'uuid':
      return fieldRequired(config.requires_uuid, config.auth?.v2ray_uuid, isV2Ray);
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
  if (typeof sdk?.android?.openExternalUrl === 'function') {
    sdk.android.openExternalUrl(uri);
    return null;
  }
  return call('DtOpenExternalUrl', 'execute', [uri]);
}

export function getVpnLogs(): Record<string, string>[] {
  const sdk = getSdk();
  if (typeof sdk?.main?.getLogs === 'function') {
    const logs = sdk.main.getLogs();
    return Array.isArray(logs) ? logs : [];
  }
  const parsed = callJson<Record<string, string>[]>('DtGetLogs', 'execute');
  return Array.isArray(parsed) ? parsed : [];
}

// Validação de credenciais setadas
export interface CredentialVerification {
  isValid: boolean;
  username?: boolean;
  password?: boolean;
  uuid?: boolean;
}

/**
 * Valida se as credenciais foram realmente setadas no DTunnel
 */
export function verifyCredentialsSetted(
  expectedUsername?: string,
  expectedPassword?: string,
  expectedUUID?: string
): CredentialVerification {
  const result: CredentialVerification = { isValid: true };

  if (expectedUsername !== undefined && expectedUsername !== '') {
    const actualUsername = getUsername();
    result.username = actualUsername === expectedUsername;
    if (!result.username) result.isValid = false;
  }

  if (expectedPassword !== undefined && expectedPassword !== '') {
    const actualPassword = getPassword();
    result.password = actualPassword === expectedPassword;
    if (!result.password) result.isValid = false;
  }

  if (expectedUUID !== undefined && expectedUUID !== '') {
    const actualUUID = getUUID();
    result.uuid = actualUUID === expectedUUID;
    if (!result.uuid) result.isValid = false;
  }

  return result;
}

export function isVpnRunning(): boolean {
  const sdk = getSdk();
  if (typeof sdk?.main?.isVpnRunning === 'function') {
    return Boolean(sdk.main.isVpnRunning());
  }
  return Boolean(call('DtIsVpnRunning', 'execute'));
}

export function getRemainingConnectionTime(): number | null {
  const sdk = getSdk();
  if (typeof sdk?.main?.getRemainingConnectionTime === 'function') {
    const v = sdk.main.getRemainingConnectionTime();
    return v == null ? null : Number(v);
  }
  const v = call('DtGetRemainingConnectionTime', 'execute');
  return v == null ? null : Number(v);
}

export function getRemainingConnectionTimerText(): string | null {
  const sdk = getSdk();
  if (typeof sdk?.main?.getRemainingConnectionTimerText === 'function') {
    const v = sdk.main.getRemainingConnectionTimerText();
    return v == null ? null : String(v);
  }
  const v = call('DtGetRemainingConnectionTimerText', 'execute');
  return v == null ? null : String(v);
}

export function getLastVpnError(): string | null {
  const sdk = getSdk();
  if (typeof sdk?.main?.getLastVpnError === 'function') {
    const v = sdk.main.getLastVpnError();
    return v == null ? null : String(v);
  }
  const v = call('DtGetLastVpnError', 'execute');
  return v == null ? null : String(v);
}

export function getNetworkName(): string | null {
  const sdk = getSdk();
  if (typeof sdk?.main?.getNetworkName === 'function') {
    const v = sdk.main.getNetworkName();
    return v == null ? null : String(v);
  }
  const v = call('DtGetNetworkName', 'execute');
  return v == null ? null : String(v);
}

export function showAdsRewardedDialog(): void {
  const sdk = getSdk();
  try {
    if (typeof sdk?.main?.showAdsRewardedDialog === 'function') {
      sdk.main.showAdsRewardedDialog();
      return;
    }
  } catch {
    /* fallback */
  }
  callVoid('DtShowDialogAdsRewarded', 'execute');
}

export function isAdsEnabled(): boolean {
  const sdk = getSdk();
  if (typeof sdk?.main?.isAdsEnabled === 'function') {
    return Boolean(sdk.main.isAdsEnabled());
  }
  return Boolean(call('DtIsAdsEnabled', 'execute'));
}

export function copyToClipboard(text: string): void {
  const sdk = getSdk();
  try {
    if (typeof sdk?.android?.copyToClipboard === 'function') {
      sdk.android.copyToClipboard(text);
      return;
    }
  } catch {
    /* fallback */
  }
  callVoid('DtCopyToClipboard', 'execute', [text]);
}

export function getClipboardText(): string | null {
  const sdk = getSdk();
  if (typeof sdk?.android?.getClipboardText === 'function') {
    const v = sdk.android.getClipboardText();
    return v == null ? null : String(v);
  }
  const v = call('DtGetClipboardText', 'execute');
  return v == null ? null : String(v);
}

export function showNativeToast(message: string): void {
  const sdk = getSdk();
  try {
    if (typeof sdk?.android?.showToast === 'function') {
      sdk.android.showToast(message);
      return;
    }
  } catch {
    /* fallback */
  }
  callVoid('DtShowToast', 'execute', [message]);
}

export function vibrate(durationMillis = 50): void {
  const sdk = getSdk();
  try {
    if (typeof sdk?.android?.vibrate === 'function') {
      sdk.android.vibrate(durationMillis);
      return;
    }
  } catch {
    /* fallback */
  }
  callVoid('DtVibrate', 'execute', [durationMillis]);
}

export function getDiagnosticReport(): string | null {
  const sdk = getSdk();
  if (typeof sdk?.android?.getDiagnosticReport === 'function') {
    const v = sdk.android.getDiagnosticReport();
    return v == null ? null : String(v);
  }
  const v = call('DtGetDiagnosticReport', 'execute');
  return v == null ? null : String(v);
}
