import { useState, useRef, useCallback } from 'react';
import { getAllConfigs, setActiveConfig } from '../utils/appFunctions';
import { autoConnectTest, AutoConnectConfig, DEFAULT_AUTO_CONNECT_CONFIG } from '../utils/autoConnectUtils';
import { ConfigItem } from '../types/config';

export interface TestLog {
  id: number;
  configName: string;
  status: 'testing' | 'success' | 'failed' | 'connecting' | 'timeout';
  duration?: number;
  message?: string;
  timestamp: Date;
}

export function useAutoConnect() {
  const [open, setOpen] = useState(false);
  const [currentName, setCurrentName] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [tested, setTested] = useState(0);
  const [success, setSuccess] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<TestLog[]>([]);
  const [currentTestDuration, setCurrentTestDuration] = useState(0);
  const [autoConnectConfig, setAutoConnectConfig] = useState<AutoConnectConfig>(DEFAULT_AUTO_CONNECT_CONFIG);
  const [showSettings, setShowSettings] = useState(false);
  
  const cancelRef = useRef<{ cancelled: boolean }>({ cancelled: false });
  const logIdRef = useRef(0);
  const testStartTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = useCallback((configName: string, status: TestLog['status'], message?: string, duration?: number) => {
    const newLog: TestLog = {
      id: ++logIdRef.current,
      configName,
      status,
      message,
      duration,
      timestamp: new Date(),
    };
    setLogs(prev => [...prev, newLog]);
  }, []);

  const updateLastLog = useCallback((status: TestLog['status'], message?: string, duration?: number) => {
    setLogs(prev => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      const lastLog = updated[updated.length - 1];
      updated[updated.length - 1] = {
        ...lastLog,
        status,
        message: message || lastLog.message,
        duration: duration ?? lastLog.duration,
      };
      return updated;
    });
  }, []);

  const startDurationTimer = useCallback(() => {
    testStartTimeRef.current = Date.now();
    setCurrentTestDuration(0);
    
    durationIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - testStartTimeRef.current;
      setCurrentTestDuration(elapsed);
    }, 100);
  }, []);

  const stopDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    setCurrentTestDuration(0);
  }, []);

  const openModal = () => {
    setOpen(true);
    setSuccess(null);
    setError(null);
    setRunning(false);
    setLogs([]);
    setCurrentTestDuration(0);
    cancelRef.current.cancelled = false;
  };

  const closeModal = () => {
    cancelRef.current.cancelled = true;
    stopDurationTimer();
    setOpen(false);
    setRunning(false);
  };

  const cancelTest = () => {
    cancelRef.current.cancelled = true;
    stopDurationTimer();
    setRunning(false);
    addLog(currentName || 'Teste', 'failed', 'Cancelado pelo usuário');
  };

  const startAutoConnect = async () => {
    setRunning(true);
    setSuccess(null);
    setError(null);
    setLogs([]);
    cancelRef.current.cancelled = false;
    
    const allConfigCategories = getAllConfigs();
    const allConfigs: ConfigItem[] = allConfigCategories.flatMap(category => 
      category.items.map(item => ({
        ...item,
        category_id: category.id,
        categoryName: category.name,
        categoryColor: category.color
      }))
    );
    setTotal(allConfigs.length);
    
    // Aplica filtros das configurações
    let filteredConfigs = allConfigs;
    
    // Filtro por categoria
    if (autoConnectConfig.selectedCategories.length > 0) {
      filteredConfigs = filteredConfigs.filter(config => 
        autoConnectConfig.selectedCategories.includes(config.category_id)
      );
    }
    
    // Filtro por tipo de configuração
    if (autoConnectConfig.configType !== 'all') {
      filteredConfigs = filteredConfigs.filter(config => {
        const mode = config.mode?.toLowerCase() || '';
        if (autoConnectConfig.configType === 'ssh') {
          return mode.includes('ssh') || mode.includes('proxy') || mode.includes('socks');
        } else if (autoConnectConfig.configType === 'v2ray') {
          return mode.includes('v2ray') || mode.includes('vmess') || mode.includes('vless');
        }
        return true;
      });
    }
    
    setTotal(filteredConfigs.length);
    setTested(0);
    
    const filterMessage = [];
    if (autoConnectConfig.selectedCategories.length > 0) {
      filterMessage.push(`${autoConnectConfig.selectedCategories.length} categoria(s)`);
    }
    if (autoConnectConfig.configType !== 'all') {
      filterMessage.push(`tipo: ${autoConnectConfig.configType.toUpperCase()}`);
    }
    
    const message = filterMessage.length > 0 
      ? `Iniciando teste com ${filteredConfigs.length} configurações filtradas (${filterMessage.join(', ')})`
      : `Iniciando teste com ${filteredConfigs.length} configurações`;
    
    addLog('Sistema', 'testing', message);
    
    try {
      const result = await autoConnectTest({
        configs: filteredConfigs,
        setCurrentName: (name: string) => {
          setCurrentName(name);
          addLog(name, 'connecting', 'Iniciando conexão...');
          startDurationTimer();
        },
        setTested: (n: number) => {
          setTested(n);
        },
        setActiveConfig: (configId: number) => {
          setActiveConfig(configId);
        },
        setActiveConfigState: () => {},
        setSelectedCategory: () => {},
        setSuccess: (configName: string | null) => {
          if (configName) {
            const duration = Date.now() - testStartTimeRef.current;
            updateLastLog('success', 'Conexão bem-sucedida!', duration);
            setSuccess(configName);
          }
        },
        cancelRef,
        onTestResult: (_, success: boolean, message?: string) => {
          const duration = Date.now() - testStartTimeRef.current;
          stopDurationTimer();
          if (success) {
            updateLastLog('success', message || 'Teste bem-sucedido', duration);
          } else {
            updateLastLog('failed', message || 'Teste falhou', duration);
          }
        },
        autoConnectConfig,
      });
      
      setRunning(false);
      stopDurationTimer();
      
      if (!result && !cancelRef.current.cancelled) {
        addLog('Sistema', 'failed', 'Teste concluído - Nenhuma configuração funcionou');
        setSuccess(null);
      } else if (result) {
        addLog('Sistema', 'success', 'Teste concluído com sucesso!');
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Erro na conexão automática';
      setError(errorMsg);
      addLog('Sistema', 'failed', errorMsg);
      setRunning(false);
      stopDurationTimer();
    }
  };

  return {
    open,
    openModal,
    closeModal,
    currentName,
    total,
    tested,
    success,
    running,
    error,
    logs,
    currentTestDuration,
    startAutoConnect,
    cancelTest,
    // Configurações
    autoConnectConfig,
    setAutoConnectConfig,
    showSettings,
    setShowSettings,
  };
}
