import { startConnection, stopConnection, getConnectionState } from './appFunctions';

export interface AutoConnectConfig {
  fetchTimeout: number;
  connectionTimeout: number;
  selectedCategories: number[];
  configType: 'all' | 'ssh' | 'v2ray';
}

export type AutoConnectPhase =
  | 'select'
  | 'connecting'
  | 'wait_vpn'
  | 'check_internet'
  | 'next';

export const CONNECTION_TIMEOUT_MIN = 3000;
export const CONNECTION_TIMEOUT_MAX = 60000;
export const FETCH_TIMEOUT_MIN = 2000;
export const FETCH_TIMEOUT_MAX = 30000;
export const TIMEOUT_STEP = 1000;

export const DEFAULT_AUTO_CONNECT_CONFIG: AutoConnectConfig = {
  fetchTimeout: 7000,
  connectionTimeout: 10000,
  selectedCategories: [],
  configType: 'all',
};

export function clampTimeout(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value / TIMEOUT_STEP) * TIMEOUT_STEP));
}

export function matchesConfigType(mode: string | undefined, configType: AutoConnectConfig['configType']): boolean {
  if (configType === 'all') return true;
  const m = (mode || '').toLowerCase();
  if (configType === 'ssh') {
    return m.includes('ssh') || m.includes('proxy') || m.includes('socks');
  }
  if (configType === 'v2ray') {
    return m.includes('v2ray') || m.includes('vmess') || m.includes('vless');
  }
  return true;
}

export function filterConfigsForAutoConnect<T extends { category_id?: number; categoryId?: number; mode?: string }>(
  configs: T[],
  autoConnectConfig: AutoConnectConfig
): T[] {
  let filtered = configs;

  if (autoConnectConfig.selectedCategories.length > 0) {
    filtered = filtered.filter((config) =>
      autoConnectConfig.selectedCategories.includes(config.category_id ?? config.categoryId ?? -1)
    );
  }

  if (autoConnectConfig.configType !== 'all') {
    filtered = filtered.filter((config) => matchesConfigType(config.mode, autoConnectConfig.configType));
  }

  return filtered;
}

async function testInternet(timeout = 4000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    await fetch('https://www.google.com/generate_204', { signal: controller.signal });
    clearTimeout(id);
    return true;
  } catch {
    return false;
  }
}

async function waitForConnectionState(
  targetState: string,
  timeout: number,
  cancelRef?: React.MutableRefObject<{ cancelled: boolean }>
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (cancelRef?.current?.cancelled) return false;
    const state = getConnectionState();
    if (state === targetState) return true;
    await new Promise((res) => setTimeout(res, 500));
  }
  return false;
}

export async function autoConnectTest({
  configs,
  setCurrentName,
  setTested,
  setActiveConfig,
  setActiveConfigState,
  setSelectedCategory,
  setSuccess,
  cancelRef,
  onTestResult,
  onPhase,
  autoConnectConfig = DEFAULT_AUTO_CONNECT_CONFIG,
}: {
  configs: any[];
  setCurrentName: (name: string) => void;
  setTested: (n: number) => void;
  setActiveConfig: (id: any) => void;
  setActiveConfigState: (cfg: any) => void;
  setSelectedCategory: (cat: any) => void;
  setSuccess: (name: string | null) => void;
  cancelRef: React.MutableRefObject<{ cancelled: boolean }>;
  onTestResult?: (configName: string, success: boolean, message?: string) => void;
  onPhase?: (phase: AutoConnectPhase, configName: string) => void;
  autoConnectConfig?: AutoConnectConfig;
}): Promise<boolean> {
  const filteredConfigs = filterConfigsForAutoConnect(configs, autoConnectConfig);

  for (let i = 0; i < filteredConfigs.length; i++) {
    if (cancelRef.current.cancelled) return false;
    const config = filteredConfigs[i];
    onPhase?.('select', config.name);
    setCurrentName(config.name);
    setTested(i + 1);

    setActiveConfig(config.id);
    setActiveConfigState(config);

    try {
      onPhase?.('connecting', config.name);
      startConnection();

      onPhase?.('wait_vpn', config.name);
      const connected = await waitForConnectionState(
        'CONNECTED',
        autoConnectConfig.connectionTimeout,
        cancelRef
      );

      if (cancelRef.current.cancelled) return false;

      if (connected) {
        onPhase?.('check_internet', config.name);
        const internetOk = await testInternet(autoConnectConfig.fetchTimeout);
        if (cancelRef.current.cancelled) return false;

        if (internetOk) {
          setActiveConfig(config.id);
          setSuccess(config.name);
          setSelectedCategory(null);
          onTestResult?.(config.name, true, 'Conexão bem-sucedida com internet');
          return true;
        } else {
          onTestResult?.(config.name, false, 'VPN conectou, mas sem acesso à internet');
        }
      } else {
        onTestResult?.(config.name, false, 'Timeout aguardando estado CONNECTED');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      onTestResult?.(config.name, false, errorMsg);
    }

    stopConnection();
    if (i < filteredConfigs.length - 1) {
      onPhase?.('next', config.name);
    }
  }

  setSuccess(null);
  return false;
}
