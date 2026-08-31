import type { ConfigCategory, ConfigItem } from '../types/config';
import type { VpnState } from '../types/vpn';
import { configRequiresField } from './configCredentials';
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
export function safeStringifyConfigValue(val: unknown): string | null {
  if (val == null) return null;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object') {
          const inner = parsed.value ?? parsed.version ?? parsed.config_version ?? parsed.v_config ?? parsed.v;
          if (inner != null) return String(inner).trim();
        }
      } catch {
        /* se não for JSON válido, usa a string original */
      }
    }
    return trimmed;
  }
  if (typeof val === 'number' || typeof val === 'boolean') {
    return String(val).trim();
  }
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    const inner = obj.value ?? obj.version ?? obj.config_version ?? obj.v_config ?? obj.v ?? obj.data;
    if (inner != null && inner !== val) {
      return safeStringifyConfigValue(inner);
    }
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }
  return String(val).trim() || null;
}

export function getConfigLabel(label: string): string | null {
  const sdk = getSdk();
  if (sdk?.app) {
    const cfg = sdk.app.getAppConfig(label);
    if (cfg != null) {
      const val = typeof cfg === 'object' && 'value' in cfg ? (cfg as { value?: unknown }).value : cfg;
      return safeStringifyConfigValue(val ?? cfg);
    }
  }
  const v = call('DtGetAppConfig', 'execute', [label]);
  return safeStringifyConfigValue(v);
}

export interface SdkConfigVersionDetails {
  localConfigVersion: string | null;
  appConfigVersion: string | null;
  selectedConfigId: number | string | null;
  configCount: number | string | null;
  effectiveVersion: string;
}

/**
  * Obtém os detalhes de versão da configuração expostos pelo SDK.
  * Lê os 2 valores principais que o SDK DTunnel expõe:
  * 1. getLocalConfigVersion (DtGetLocalConfigVersion)
  * 2. getAppConfig("config_version" | "v_config" | "version") (DtGetAppConfig)
  * Converte e formata o resultado com segurança para QUALQUER tipo de dado (texto, número, objeto).
  */
export function getSdkConfigDetails(): SdkConfigVersionDetails {
  const sdk = getSdk();

  // Valor 1: getLocalConfigVersion (via sdk.config.getLocalConfigVersion ou DtGetLocalConfigVersion)
  let localConfigVersion: string | null = null;
  try {
    if (sdk?.config) {
      const v = sdk.config.getLocalConfigVersion();
      localConfigVersion = safeStringifyConfigValue(v);
    } else {
      const v = call('DtGetLocalConfigVersion', 'execute');
      localConfigVersion = safeStringifyConfigValue(v);
    }
  } catch {
    localConfigVersion = null;
  }

  // Valor 2: getAppConfig (testa chaves candidatas: config_version, v_config, version, config_v, app_version, v, config_num)
  let appConfigVersion: string | null = null;
  try {
    const candidateKeys = ['config_version', 'v_config', 'version', 'config_v', 'app_version', 'v', 'config_num'];
    for (const key of candidateKeys) {
      const raw = getConfigLabel(key);
      if (raw != null) {
        appConfigVersion = raw;
        break;
      }
    }
  } catch {
    appConfigVersion = null;
  }

  // Valores auxiliares
  let selectedConfigId: number | string | null = null;
  try {
    if (sdk?.config) {
      const id = sdk.config.getSelectedConfigId();
      if (id != null) selectedConfigId = safeStringifyConfigValue(id) ?? id;
    } else {
      const id = call('DtGetSelectedConfigId', 'execute');
      if (id != null) selectedConfigId = safeStringifyConfigValue(id) ?? (id as number | string);
    }
  } catch {
    selectedConfigId = null;
  }

  let configCount: number | string | null = null;
  try {
    if (sdk?.config) {
      const count = sdk.config.getConfigCount();
      if (count != null) configCount = safeStringifyConfigValue(count) ?? count;
    } else {
      const count = call('DtGetConfigCount', 'execute');
      if (count != null) configCount = safeStringifyConfigValue(count) ?? (count as number | string);
    }
  } catch {
    configCount = null;
  }

  const effectiveVersion = localConfigVersion || appConfigVersion || '1.0';

  return {
    localConfigVersion,
    appConfigVersion,
    selectedConfigId,
    configCount,
    effectiveVersion,
  };
}

export function getConfigVersion(): string | null {
  const details = getSdkConfigDetails();
  return details.localConfigVersion || details.appConfigVersion || null;
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

export function getImportPublicKey(): string | null {
  const sdk = getSdk();
  try {
    if (typeof sdk?.config?.getImportPublicKey === 'function') {
      const value = sdk.config.getImportPublicKey();
      if (value == null) return null;
      const text = String(value).trim();
      return text || null;
    }
  } catch {
    /* fallback */
  }
  const value = call('DtGetImportPublicKey', 'execute');
  if (value == null) return null;
  const text = String(value).trim();
  return text || null;
}

export function copyImportPublicKey(): boolean {
  const sdk = getSdk();
  try {
    if (typeof sdk?.config?.copyImportPublicKey === 'function') {
      sdk.config.copyImportPublicKey();
      return true;
    }
  } catch {
    /* fallback */
  }
  try {
    callVoid('DtCopyImportPublicKey', 'execute');
    return true;
  } catch {
    return false;
  }
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

export function shouldShowInput(type: 'username' | 'password' | 'uuid'): boolean {
  return configRequiresField(getActiveConfig(), type);
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

export function getVpnLogs(): Array<Record<string, string> | string> {
  const sdk = getSdk();
  if (typeof sdk?.main?.getLogs === 'function') {
    const logs = sdk.main.getLogs();
    return Array.isArray(logs) ? logs : [];
  }
  const parsed = callJson<Array<Record<string, string> | string>>('DtGetLogs', 'execute');
  return Array.isArray(parsed) ? parsed : [];
}

export function clearVpnLogs(): void {
  const sdk = getSdk();
  try {
    if (typeof sdk?.main?.clearLogs === 'function') {
      sdk.main.clearLogs();
      return;
    }
  } catch {
    /* fallback */
  }
  callVoid('DtClearLogs', 'execute');
}

const vpnLogTimestampMap = new Map<string, string>();

function getOrAssignVpnLogTimestamp(key: string): string {
  let ts = vpnLogTimestampMap.get(key);
  if (!ts) {
    const now = new Date();
    ts = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    vpnLogTimestampMap.set(key, ts);
    if (vpnLogTimestampMap.size > 1000) {
      const firstKey = vpnLogTimestampMap.keys().next().value;
      if (firstKey) vpnLogTimestampMap.delete(firstKey);
    }
  }
  return ts;
}

function parseVpnTimeField(rawTime: unknown): string | null {
  if (rawTime == null) return null;
  const str = String(rawTime).trim();
  if (!str) return null;

  const match = str.match(/(\d{2}:\d{2}:\d{2})/);
  if (match) return match[1];

  if (/^\d{10,13}$/.test(str)) {
    const num = Number(str);
    const date = new Date(num < 1e11 ? num * 1000 : num);
    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
  }

  const date = new Date(str);
  if (!isNaN(date.getTime())) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  return null;
}

export function formatVpnLogEntry(entry: unknown): string {
  if (entry == null) return '';

  let rawText = '';
  let timeStr: string | null = null;

  if (typeof entry === 'string') {
    rawText = entry.trim();
  } else if (typeof entry === 'object') {
    const rec = entry as Record<string, unknown>;
    const time = rec.time ?? rec.timestamp ?? rec.date ?? rec.hora;
    const message = rec.message ?? rec.log ?? rec.text ?? rec.data ?? rec.msg ?? rec.content;

    timeStr = parseVpnTimeField(time);

    if (message != null && String(message).trim()) {
      rawText = String(message).trim();
    } else {
      const values = Object.values(rec)
        .filter((value) => value != null && String(value).trim())
        .map((value) => String(value).trim());
      rawText = values.join(' - ');
    }
  } else {
    rawText = String(entry).trim();
  }

  if (!rawText) return '';

  // Se o próprio texto já possui um timestamp HH:mm:ss no início
  const existingTimeMatch = rawText.match(/^\[?(\d{2}:\d{2}:\d{2})\]?\s*[-:]?\s*(.*)$/);
  if (existingTimeMatch) {
    timeStr = existingTimeMatch[1];
    rawText = existingTimeMatch[2].trim();
  }

  if (!timeStr) {
    timeStr = getOrAssignVpnLogTimestamp(rawText);
  }

  if (!rawText) return timeStr;

  return `${timeStr}  ${rawText}`;
}

const LOG_HTML_ALLOWED = /^(br|b|i|em|strong|u|small)$/i;
const NOTIFICATION_HTML_TAGS = new Set([
  'br',
  'b',
  'i',
  'em',
  'strong',
  'u',
  's',
  'strike',
  'del',
  'ins',
  'mark',
  'small',
  'sub',
  'sup',
  'code',
  'p',
  'span',
  'div',
  'h1',
  'h2',
  'h3',
  'h4',
  'hr',
  'blockquote',
  'pre',
  'ul',
  'ol',
  'li',
  'a',
  'img',
]);

function restoreAllowedHtmlTags(escaped: string, allowed: RegExp): string {
  return escaped.replace(/&lt;(\/?)([a-z0-9]+)([^&]*?)\/?&gt;/gi, (_match, slash: string, tag: string) => {
    if (!allowed.test(tag)) return '';
    const name = tag.toLowerCase();
    if (name === 'br') return '<br>';
    return slash ? `</${name}>` : `<${name}>`;
  });
}

export function isSafeHttpUrl(url: string): boolean {
  const value = String(url || '').trim();
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/** URL de mídia do campo Imagem do painel (PNG, JPG, GIF, WebP). */
export function normalizeNotificationMediaUrl(raw: string | undefined | null): string | undefined {
  const value = String(raw || '').trim();
  if (!value) return undefined;
  if (isSafeHttpUrl(value)) return value;
  if (/^data:image\/(png|jpe?g|gif|webp)[;,]/i.test(value)) return value;
  if (value.startsWith('//') && isSafeHttpUrl(`https:${value}`)) return `https:${value}`;
  return undefined;
}

function sanitizeNotificationTree(root: ParentNode): void {
  for (const node of Array.from(root.childNodes)) {
    if (node.nodeType === Node.COMMENT_NODE) {
      node.parentNode?.removeChild(node);
      continue;
    }
    if (node.nodeType === Node.TEXT_NODE) continue;
    if (node.nodeType !== Node.ELEMENT_NODE) {
      node.parentNode?.removeChild(node);
      continue;
    }

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const href = el.getAttribute('href');
    const src = el.getAttribute('src');
    const alt = el.getAttribute('alt');

    if (!NOTIFICATION_HTML_TAGS.has(tag)) {
      sanitizeNotificationTree(el);
      const parent = el.parentNode;
      if (!parent) continue;
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      parent.removeChild(el);
      continue;
    }

    while (el.attributes.length > 0) {
      el.removeAttribute(el.attributes[0].name);
    }

    if (tag === 'a') {
      if (href && isSafeHttpUrl(href)) {
        el.setAttribute('href', href);
        el.setAttribute('rel', 'noopener noreferrer');
        el.setAttribute('target', '_blank');
      }
    } else if (tag === 'img') {
      if (src && isSafeHttpUrl(src)) {
        el.setAttribute('src', src);
        el.setAttribute('alt', alt || '');
      } else {
        el.parentNode?.removeChild(el);
        continue;
      }
    }

    sanitizeNotificationTree(el);
  }
}

export function handleNotificationHtmlClick(event: {
  target: EventTarget | null;
  preventDefault: () => void;
  stopPropagation: () => void;
}): boolean {
  const target = event.target as HTMLElement | null;
  const anchor = target?.closest?.('a');
  if (!anchor) return false;
  const href = anchor.getAttribute('href') || '';
  if (!isSafeHttpUrl(href)) return false;
  event.preventDefault();
  event.stopPropagation();
  openExternalUrl(href);
  return true;
}

export function stripLogHtml(html: string): string {
  return String(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Escapa o HTML e devolve só tags simples de log (`b`, `br`, `i`...). */
export function sanitizeLogHtml(html: string): string {
  const raw = String(html || '');
  if (!raw) return '';
  return restoreAllowedHtmlTags(escapeHtml(raw), LOG_HTML_ALLOWED);
}

/** HTML básico de notificação do painel (texto, listas, links, imagens/GIF). */
export function sanitizeNotificationHtml(html: string): string {
  const raw = String(html || '');
  if (!raw) return '';

  if (typeof document === 'undefined') {
    return restoreAllowedHtmlTags(escapeHtml(raw), /^(br|b|i|em|strong|u|s|small|p|span|h1|h2|h3|h4|ul|ol|li|blockquote|code|pre|hr)$/i);
  }

  const template = document.createElement('template');
  template.innerHTML = raw;
  sanitizeNotificationTree(template.content);
  return template.innerHTML;
}

export function formatVpnLogsText(logs?: Array<Record<string, string> | string>): string {
  const entries = logs ?? getVpnLogs();
  return entries.map(formatVpnLogEntry).map(stripLogHtml).filter(Boolean).join('\n');
}

export type ShareTextResult = 'shared' | 'copied' | 'aborted' | 'failed';

export async function shareText(text: string, title = 'SSH T PROJECT'): Promise<ShareTextResult> {
  const content = String(text || '').trim();
  if (!content) return 'failed';

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      await navigator.share({ title, text: content });
      return 'shared';
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') return 'aborted';
  }

  try {
    copyToClipboard(content);
    return 'copied';
  } catch {
    return 'failed';
  }
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

export function isNativeDarkMode(): boolean {
  const sdk = getSdk();
  try {
    if (typeof sdk?.android?.isDarkMode === 'function') {
      return Boolean(sdk.android.isDarkMode());
    }
  } catch {
    /* fallback */
  }
  const nativeVal = call('DtIsDarkMode', 'execute');
  if (nativeVal != null) return Boolean(nativeVal);

  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  return true;
}

export interface SdkDiagnosticSnapshot {
  timestamp: string;
  sdkReady: boolean;
  sdkVersion: string;
  main: {
    vpnState: string | null;
    isVpnRunning: boolean;
    airplaneState: string | null;
    assistantState: string | null;
    remainingTimeText: string | null;
    lastVpnError: string | null;
    networkName: string | null;
    localIp: string | null;
  };
  config: {
    selectedConfigId: number | string | null;
    configCount: number | string | null;
    cdnCount: number | string | null;
    localConfigVersion: string | null;
    appConfigVersion: string | null;
    hasUsername: boolean;
    hasPassword: boolean;
    hasUuid: boolean;
    hasPendingImport: boolean;
  };
  android: {
    deviceId: string | null;
    appVersion: string | null;
    isSafeMode: boolean;
    isDarkMode: boolean;
    statusBarHeight: number;
    navBarHeight: number;
    downloadBytes: number;
    uploadBytes: number;
    hotspotStatus: string | null;
  };
  bridgeAvailability: Record<string, boolean>;
}

export function getSdkDiagnosticSnapshot(): SdkDiagnosticSnapshot {
  const sdk = getSdk();
  const bridgeObjects = [
    'DtSetConfig', 'DtGetConfigs', 'DtGetCategories', 'DtGetSelectedCategory', 'DtGetSelectedCategoryId',
    'DtGetConfigsByCategory', 'DtGetSelectedConfig', 'DtGetSelectedConfigId', 'DtGetConfigCount', 'DtGetDefaultConfig',
    'DtExecuteDialogConfig', 'DtGetImportPublicKey', 'DtCopyImportPublicKey', 'DtImportConfig', 'DtHasPendingConfigImport',
    'DtGetPendingConfigImportDetails', 'DtUsername', 'DtPassword', 'DtGetLocalConfigVersion', 'DtCDNCount',
    'DtEndpointCount', 'DtUuid', 'DtGetUser', 'DtGetLogs', 'DtClearLogs', 'DtExecuteVpnStart', 'DtExecuteVpnStop',
    'DtGetVpnState', 'DtIsVpnRunning', 'DtStartAppUpdate', 'DtStartCheckUser', 'DtShowLoggerDialog', 'DtGetLocalIP',
    'DtAirplaneActivate', 'DtAirplaneDeactivate', 'DtAirplaneState', 'DtAppIsCurrentAssistant', 'DtShowMenuDialog',
    'DtShowDialogAdsRewarded', 'DtIsAdsEnabled', 'DtGetRemainingConnectionTime', 'DtGetRemainingConnectionTimerText',
    'DtGetLastVpnError', 'DtGetNetworkName'
  ];

  const bridgeAvailability: Record<string, boolean> = {};
  if (sdk && typeof sdk.getBridgeAvailability === 'function') {
    Object.assign(bridgeAvailability, sdk.getBridgeAvailability());
  } else {
    for (const name of bridgeObjects) {
      bridgeAvailability[name] = typeof window !== 'undefined' && Boolean((window as unknown as Record<string, unknown>)[name]);
    }
  }

  const details = getSdkConfigDetails();

  return {
    timestamp: new Date().toISOString(),
    sdkReady: Boolean(sdk && (typeof sdk.isReady === 'function' ? sdk.isReady() : true)),
    sdkVersion: sdk?.version ?? '2.0.0',
    main: {
      vpnState: getConnectionState(),
      isVpnRunning: isVpnRunning(),
      airplaneState: sdk?.main?.getAirplaneState?.() ?? null,
      assistantState: sdk?.main?.getAssistantState?.() ?? null,
      remainingTimeText: getRemainingConnectionTimerText(),
      lastVpnError: getLastVpnError(),
      networkName: getNetworkName(),
      localIp: getLocalIP(),
    },
    config: {
      selectedConfigId: details.selectedConfigId,
      configCount: details.configCount,
      cdnCount: sdk?.config?.getCdnCount?.() ?? null,
      localConfigVersion: details.localConfigVersion,
      appConfigVersion: details.appConfigVersion,
      hasUsername: Boolean(getUsername()),
      hasPassword: Boolean(getPassword()),
      hasUuid: Boolean(getUUID()),
      hasPendingImport: sdk?.config?.hasPendingConfigImport?.() ?? false,
    },
    android: {
      deviceId: sdk?.android?.getDeviceId?.() ?? null,
      appVersion: sdk?.android?.getAppVersion?.() ?? null,
      isSafeMode: sdk?.android?.isSafeMode?.() ?? false,
      isDarkMode: sdk?.android?.isDarkMode?.() ?? false,
      statusBarHeight: getStatusbarHeight(),
      navBarHeight: getNavbarHeight(),
      downloadBytes: getDownloadBytes(),
      uploadBytes: getUploadBytes(),
      hotspotStatus: getHotspotNativeStatus(),
    },
    bridgeAvailability,
  };
}
