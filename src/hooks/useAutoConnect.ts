import { useState, useRef, useCallback, useEffect } from 'react';
import { getAllConfigs, setActiveConfig, getVpnLogs } from '../utils/appFunctions';
import {
  autoConnectTest,
  AutoConnectConfig,
  AutoConnectPhase,
  CONNECTION_TIMEOUT_MAX,
  CONNECTION_TIMEOUT_MIN,
  DEFAULT_AUTO_CONNECT_CONFIG,
  FETCH_TIMEOUT_MAX,
  FETCH_TIMEOUT_MIN,
  clampTimeout,
  filterConfigsForAutoConnect,
} from '../utils/autoConnectUtils';
import { ConfigItem } from '../types/config';
import { getStorageItem, setStorageItem } from '../utils/storageUtils';
import { on } from '../utils/dtunnelEventBridge';

const CONFIG_STORAGE_KEY = 'autoconnect-config';
const HOME_ENABLED_KEY = 'autoconnect-home-enabled';
const LOG_BUFFER_MAX = 200;

export type TestLogSource = 'test' | 'sdk';
export type TestLogStatus = 'testing' | 'success' | 'failed' | 'connecting' | 'timeout';

export interface TestLog {
  id: number;
  source: TestLogSource;
  configName?: string;
  status?: TestLogStatus;
  duration?: number;
  message: string;
  timestamp: Date;
}

export type AutoConnectPhaseLabel = AutoConnectPhase | null;

const PHASE_MESSAGES: Record<AutoConnectPhase, string> = {
  select: 'Selecionando configuração',
  connecting: 'Iniciando conexão',
  wait_vpn: 'Aguardando VPN',
  check_internet: 'Testando internet',
  next: 'Falhou, indo para a próxima',
};

function loadSavedConfig(): AutoConnectConfig {
  const saved = getStorageItem<AutoConnectConfig>(CONFIG_STORAGE_KEY);
  if (!saved) return DEFAULT_AUTO_CONNECT_CONFIG;
  return {
    ...DEFAULT_AUTO_CONNECT_CONFIG,
    ...saved,
    selectedCategories: Array.isArray(saved.selectedCategories) ? saved.selectedCategories : [],
    connectionTimeout: clampTimeout(
      saved.connectionTimeout ?? DEFAULT_AUTO_CONNECT_CONFIG.connectionTimeout,
      CONNECTION_TIMEOUT_MIN,
      CONNECTION_TIMEOUT_MAX
    ),
    fetchTimeout: clampTimeout(
      saved.fetchTimeout ?? DEFAULT_AUTO_CONNECT_CONFIG.fetchTimeout,
      FETCH_TIMEOUT_MIN,
      FETCH_TIMEOUT_MAX
    ),
  };
}

function normalizeSdkLog(payload: unknown): string | null {
  if (payload == null) return null;
  if (typeof payload === 'string') {
    const t = payload.trim();
    return t || null;
  }
  if (typeof payload === 'object') {
    const p = payload as Record<string, unknown>;
    const raw = p.message ?? p.log ?? p.text ?? p.data;
    if (typeof raw === 'string' && raw.trim()) return raw.trim();
    try {
      return JSON.stringify(payload);
    } catch {
      return String(payload);
    }
  }
  return String(payload);
}

export function useAutoConnect() {
  const [open, setOpen] = useState(false);
  const [currentName, setCurrentName] = useState<string | null>(null);
  const [phase, setPhase] = useState<AutoConnectPhaseLabel>(null);
  const [total, setTotal] = useState(0);
  const [tested, setTested] = useState(0);
  const [success, setSuccess] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<TestLog[]>([]);
  const [failedNames, setFailedNames] = useState<string[]>([]);
  const [currentTestDuration, setCurrentTestDuration] = useState(0);
  const [autoConnectConfig, setAutoConnectConfigState] = useState<AutoConnectConfig>(loadSavedConfig);
  const [homeEnabled, setHomeEnabledState] = useState(() => {
    try {
      return getStorageItem<boolean>(HOME_ENABLED_KEY) === true;
    } catch {
      return false;
    }
  });

  const cancelRef = useRef<{ cancelled: boolean }>({ cancelled: false });
  const logIdRef = useRef(0);
  const testStartTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const runningRef = useRef(false);
  const currentNameRef = useRef<string | null>(null);

  runningRef.current = running;
  currentNameRef.current = currentName;

  const pushLog = useCallback((entry: Omit<TestLog, 'id' | 'timestamp'>) => {
    setLogs((prev) => {
      const next: TestLog[] = [
        ...prev,
        {
          ...entry,
          id: ++logIdRef.current,
          timestamp: new Date(),
        },
      ];
      return next.length > LOG_BUFFER_MAX ? next.slice(next.length - LOG_BUFFER_MAX) : next;
    });
  }, []);

  const setAutoConnectConfig = useCallback((config: AutoConnectConfig) => {
    setAutoConnectConfigState(config);
    try {
      setStorageItem(CONFIG_STORAGE_KEY, config);
    } catch {
      /* ignore */
    }
  }, []);

  const setHomeEnabled = useCallback((enabled: boolean) => {
    setHomeEnabledState(enabled);
    try {
      setStorageItem(HOME_ENABLED_KEY, enabled);
    } catch {
      /* ignore */
    }
  }, []);

  const startDurationTimer = useCallback(() => {
    testStartTimeRef.current = Date.now();
    setCurrentTestDuration(0);
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    durationIntervalRef.current = setInterval(() => {
      setCurrentTestDuration(Date.now() - testStartTimeRef.current);
    }, 100);
  }, []);

  const stopDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  const logCountRef = useRef(0);

  useEffect(() => {
    const unsubLog = on('newLog', () => {
      if (!runningRef.current) return;
      const logs = getVpnLogs();
      const fresh = logs.slice(logCountRef.current);
      logCountRef.current = logs.length;
      for (const entry of fresh) {
        const message = normalizeSdkLog(entry);
        if (!message) continue;
        pushLog({
          source: 'sdk',
          configName: currentNameRef.current || undefined,
          message,
        });
      }
    });

    const unsubVpn = on('vpnState', (payload) => {
      if (!runningRef.current) return;
      const state =
        typeof payload === 'string'
          ? payload
          : (payload as { state?: string })?.state || String(payload ?? '');
      if (!state) return;
      pushLog({
        source: 'sdk',
        configName: currentNameRef.current || undefined,
        message: `VPN: ${state}`,
        status:
          state === 'CONNECTED'
            ? 'success'
            : state === 'AUTH_FAILED' || state === 'NO_NETWORK'
              ? 'failed'
              : 'connecting',
      });
    });

    return () => {
      unsubLog();
      unsubVpn();
    };
  }, [pushLog]);

  const openModal = useCallback(() => {
    setOpen(true);
    setSuccess(null);
    setError(null);
    setRunning(false);
    setCancelled(false);
    setPhase(null);
    setFailedNames([]);
    setLogs([]);
    setCurrentTestDuration(0);
    setTested(0);
    cancelRef.current.cancelled = false;
  }, []);

  const closeModal = useCallback(() => {
    cancelRef.current.cancelled = true;
    stopDurationTimer();
    setOpen(false);
    setRunning(false);
    setPhase(null);
  }, [stopDurationTimer]);

  const cancelTest = useCallback(() => {
    cancelRef.current.cancelled = true;
    setCancelled(true);
    stopDurationTimer();
    setRunning(false);
    setPhase(null);
    pushLog({
      source: 'test',
      configName: currentNameRef.current || 'Teste',
      status: 'failed',
      message: 'Cancelado pelo usuário',
    });
  }, [pushLog, stopDurationTimer]);

  const startAutoConnect = useCallback(async (overrides?: Partial<AutoConnectConfig>) => {
    const runConfig: AutoConnectConfig = {
      ...autoConnectConfig,
      ...overrides,
    };

    setRunning(true);
    setCancelled(false);
    setSuccess(null);
    setError(null);
    setLogs([]);
    setFailedNames([]);
    setPhase(null);
    cancelRef.current.cancelled = false;
    logCountRef.current = getVpnLogs().length;

    const allConfigCategories = getAllConfigs();
    const allConfigs: ConfigItem[] = allConfigCategories.flatMap((category) =>
      category.items.map((item) => ({
        ...item,
        category_id: category.id,
        categoryName: category.name,
        categoryColor: category.color,
      }))
    );

    const filteredConfigs = filterConfigsForAutoConnect(allConfigs, runConfig);
    setTotal(filteredConfigs.length);
    setTested(0);

    pushLog({
      source: 'test',
      configName: 'Sistema',
      status: 'testing',
      message: `Iniciando teste com ${filteredConfigs.length} configuração(ões)`,
    });

    try {
      const result = await autoConnectTest({
        configs: filteredConfigs,
        setCurrentName: (name: string) => {
          setCurrentName(name);
          startDurationTimer();
        },
        setTested: (n: number) => setTested(n),
        setActiveConfig: (configId: number) => setActiveConfig(configId),
        setActiveConfigState: () => {},
        setSelectedCategory: () => {},
        setSuccess: (configName: string | null) => {
          if (configName) setSuccess(configName);
        },
        cancelRef,
        onPhase: (nextPhase, configName) => {
          setPhase(nextPhase);
          pushLog({
            source: 'test',
            configName,
            status: nextPhase === 'next' ? 'failed' : 'connecting',
            message: PHASE_MESSAGES[nextPhase],
          });
        },
        onTestResult: (configName: string, ok: boolean, message?: string) => {
          const duration = Date.now() - testStartTimeRef.current;
          stopDurationTimer();
          if (!ok) {
            setFailedNames((prev) => (prev.includes(configName) ? prev : [...prev, configName]));
          }
          pushLog({
            source: 'test',
            configName,
            status: ok ? 'success' : 'failed',
            message: message || (ok ? 'Teste bem-sucedido' : 'Teste falhou'),
            duration,
          });
        },
        autoConnectConfig: runConfig,
      });

      setRunning(false);
      setPhase(null);
      stopDurationTimer();

      if (cancelRef.current.cancelled) {
        setCancelled(true);
        return;
      }

      if (!result) {
        pushLog({
          source: 'test',
          configName: 'Sistema',
          status: 'failed',
          message: 'Nenhuma configuração funcionou',
        });
        setSuccess(null);
      } else {
        pushLog({
          source: 'test',
          configName: 'Sistema',
          status: 'success',
          message: 'Teste concluído com sucesso',
        });
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Erro na conexão automática';
      setError(errorMsg);
      pushLog({ source: 'test', configName: 'Sistema', status: 'failed', message: errorMsg });
      setRunning(false);
      setPhase(null);
      stopDurationTimer();
    }
  }, [autoConnectConfig, pushLog, startDurationTimer, stopDurationTimer]);

  const startHomeAutoConnect = useCallback(() => {
    setOpen(true);
    void startAutoConnect({ selectedCategories: [], configType: 'all' });
  }, [startAutoConnect]);

  return {
    open,
    openModal,
    closeModal,
    currentName,
    phase,
    total,
    tested,
    success,
    running,
    cancelled,
    error,
    logs,
    failedNames,
    currentTestDuration,
    startAutoConnect,
    startHomeAutoConnect,
    cancelTest,
    autoConnectConfig,
    setAutoConnectConfig,
    homeEnabled,
    setHomeEnabled,
  };
}
