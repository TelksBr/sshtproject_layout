import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { Loader, RefreshCw, Server } from '../../utils/icons';
import { vibrate } from '../../utils/appFunctions';

interface ServerConfig {
  name: string;
  host: string;
  port: number;
  order?: number;
}

interface SystemResources {
  memory: {
    total: number;
    available: number;
    used: number;
    free: number;
    usage_percent: number;
  };
  cpu: {
    usage_percent: number;
    user: number;
    nice: number;
    system: number;
    idle: number;
    iowait: number;
    irq: number;
    softirq: number;
    steal: number;
  };
}

interface ServerStatus {
  name: string;
  host: string;
  v2rayUsers: number;
  vtProxyUsers: number;
  totalUsers: number;
  isOnline: boolean;
  order: number;
  resources?: SystemResources;
}

interface ServerTotals {
  v2ray: number;
  vtProxy: number;
  total: number;
}

interface ServersModalProps {
  onClose: () => void;
}

export function ServersModal({ onClose }: ServersModalProps) {
  const [serverConfigs, setServerConfigs] = useState<ServerConfig[]>([]);
  const [servers, setServers] = useState<ServerStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState<ServerTotals>({ v2ray: 0, vtProxy: 0, total: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [failedServers, setFailedServers] = useState<Set<string>>(new Set());
  const [configError, setConfigError] = useState<string | null>(null);

  // Configuração da URL do GitHub Gist
  const CONFIG_API_URL = 'https://gist.githubusercontent.com/TelksBr/d640030312bb682ac1ef6891f4bdf2ba/raw/8930bd8e57f80fd5a0d02d1450e4514a0affa4ff/servers.json';
  const CACHE_KEY = 'servers_config_cache';
  const CACHE_TIMESTAMP_KEY = 'servers_config_timestamp';
  
  // Função para salvar configuração no cache
  const saveConfigToCache = (config: ServerConfig[]) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(config));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      // Falha silenciosa ao salvar cache
    }
  };

  // Função para carregar configuração do cache
  const loadConfigFromCache = (): ServerConfig[] | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      // Falha silenciosa ao carregar cache
    }
    return null;
  };

  // Função para buscar configuração dos servidores
  const fetchServerConfig = async (): Promise<ServerConfig[]> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(CONFIG_API_URL, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar configuração: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.servers || !Array.isArray(data.servers)) {
        throw new Error('Formato de configuração inválido');
      }
      
      // Adiciona ordem hierárquica baseada na posição no JSON
      const serversWithOrder = data.servers.map((server: ServerConfig, index: number) => ({
        ...server,
        order: index
      }));
      
      // Salva no cache após sucesso
      saveConfigToCache(serversWithOrder);
      
      return serversWithOrder;
    } catch (error) {
      setConfigError(error instanceof Error ? error.message : 'Erro desconhecido');
      
      // Tenta usar o cache em caso de erro
      const cached = loadConfigFromCache();
      if (cached && cached.length > 0) {
        return cached;
      }
      
      return [];
    }
  };

  // Função para atualizar totais baseada na lista de servidores
  const updateTotals = (serverList: ServerStatus[]) => {
    const newTotals = { v2ray: 0, vtProxy: 0, total: 0 };
    serverList.forEach(server => {
      if (server.isOnline) {
        newTotals.v2ray += server.v2rayUsers;
        newTotals.vtProxy += server.vtProxyUsers;
        newTotals.total += server.totalUsers;
      }
    });
    setTotals(newTotals);
  };

  // Função para adicionar ou atualizar um servidor na lista
  const upsertServer = (newServer: ServerStatus) => {
    setServers(prevServers => {
      const filtered = prevServers.filter(s => s.host !== newServer.host);
      const updated = [...filtered, newServer].sort((a, b) => a.order - b.order);
      updateTotals(updated);
      return updated;
    });
  };

  // Função para buscar dados de um servidor específico
  const fetchServer = async (config: ServerConfig) => {
    const urlOnlines = `http://${config.host}:${config.port}/onlines`;
    const urlResources = `http://${config.host}:${config.port}/system/resources`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      // Busca dados de usuários online
      const responseOnlines = await fetch(urlOnlines, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!responseOnlines.ok) {
        throw new Error(`HTTP ${responseOnlines.status}`);
      }
      
      const dataOnlines = await responseOnlines.json();
      
      // Busca recursos do sistema (não bloqueia se falhar)
      let resources: SystemResources | undefined;
      try {
        const controllerResources = new AbortController();
        const timeoutIdResources = setTimeout(() => controllerResources.abort(), 5000);
        
        const responseResources = await fetch(urlResources, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          signal: controllerResources.signal
        });
        
        clearTimeout(timeoutIdResources);
        
        if (responseResources.ok) {
          resources = await responseResources.json();
        }
      } catch (error) {
        // Falha silenciosa ao buscar recursos
      }
      
      const v2rayCount = typeof dataOnlines.total_v2ray === 'number'
        ? dataOnlines.total_v2ray
        : typeof dataOnlines.v2ray_users === 'number'
          ? dataOnlines.v2ray_users
          : Array.isArray(dataOnlines.v2ray_users)
            ? dataOnlines.v2ray_users.length
            : 0;

      const vtProxyCount = typeof dataOnlines.total_vtproxy === 'number'
        ? dataOnlines.total_vtproxy
        : typeof dataOnlines.VTproxy === 'number'
          ? dataOnlines.VTproxy
          : typeof dataOnlines.vtproxy_users === 'number'
            ? dataOnlines.vtproxy_users
            : Array.isArray(dataOnlines.VTproxy)
              ? dataOnlines.VTproxy.length
              : Array.isArray(dataOnlines.vtproxy_users)
                ? dataOnlines.vtproxy_users.length
                : typeof dataOnlines.total_dt_proto === 'number'
                  ? dataOnlines.total_dt_proto
                  : typeof dataOnlines.dt_proto_users === 'number'
                    ? dataOnlines.dt_proto_users
                    : Array.isArray(dataOnlines.dt_proto_users)
                      ? dataOnlines.dt_proto_users.length
                      : 0;

      const totalCount = typeof dataOnlines.total_users === 'number'
        ? dataOnlines.total_users
        : (v2rayCount + vtProxyCount);

      const serverStatus: ServerStatus = {
        name: config.name,
        host: config.host,
        v2rayUsers: v2rayCount,
        vtProxyUsers: vtProxyCount,
        totalUsers: totalCount,
        isOnline: true,
        order: config.order ?? 999,
        resources
      };
      
      setFailedServers(prev => {
        const next = new Set(prev);
        next.delete(config.host);
        return next;
      });
      
      upsertServer(serverStatus);
    } catch (error) {
      setFailedServers(prev => new Set(prev).add(config.host));
      
      // Mantém o servidor na lista, mas marcado como offline
      upsertServer({
        name: config.name,
        host: config.host,
        v2rayUsers: 0,
        vtProxyUsers: 0,
        totalUsers: 0,
        isOnline: false,
        order: config.order ?? 999
      });
    }
  };

  // Função para buscar todos os servidores
  const fetchServerData = async (configs: ServerConfig[]) => {
    if (configs.length === 0) return;
    
    setLoading(true);
    const fetchPromises = configs.map((config, index) => {
      // Garante que cada config tenha a ordem correta
      const configWithOrder = { ...config, order: config.order ?? index };
      return fetchServer(configWithOrder);
    });
    await Promise.all(fetchPromises);
    setLoading(false);
  };

  // Função para tentar novamente servidores que falharam
  const retryFailedServers = async () => {
    const currentFailed = Array.from(failedServers);
    if (currentFailed.length === 0) return;
    
    const failedConfigs = serverConfigs.filter(config => 
      currentFailed.includes(config.host)
    );
    
    for (const config of failedConfigs) {
      await fetchServer(config);
    }
  };

  // Inicializa: busca configuração e dados dos servidores
  useEffect(() => {
    const initialize = async () => {
      // Primeiro tenta carregar do cache para exibição rápida
      const cachedConfig = loadConfigFromCache();
      if (cachedConfig && cachedConfig.length > 0) {
        setServerConfigs(cachedConfig);
        // Busca dados dos servidores em cache
        await fetchServerData(cachedConfig);
      }
      
      // Em paralelo, busca atualização da configuração
      const configs = await fetchServerConfig();
      
      // Se obteve nova configuração e é diferente do cache, atualiza
      if (configs.length > 0) {
        const configChanged = JSON.stringify(configs) !== JSON.stringify(cachedConfig);
        
        if (configChanged) {
          setServerConfigs(configs);
          await fetchServerData(configs);
        }
      } else if (!cachedConfig || cachedConfig.length === 0) {
        // Sem cache e sem sucesso ao buscar
        setLoading(false);
      }
    };
    
    initialize();
  }, []);

  // Tenta reconectar servidores falhos a cada 10 segundos
  useEffect(() => {
    if (failedServers.size === 0) return;
    const retryInterval = setInterval(retryFailedServers, 10000);
    return () => clearInterval(retryInterval);
  }, [failedServers, serverConfigs]);

  const handleRefresh = async () => {
    if (refreshing || serverConfigs.length === 0) return;
    try {
      vibrate(25);
    } catch {
      /* ignore */
    }
    setRefreshing(true);
    
    // Atualiza configuração do GitHub Gist
    const newConfigs = await fetchServerConfig();
    
    if (newConfigs.length > 0) {
      setServerConfigs(newConfigs);
      await fetchServerData(newConfigs);
    } else {
      // Se falhar, usa a configuração atual
      await fetchServerData(serverConfigs);
    }
    
    setRefreshing(false);
  };

  return (
    <Modal onClose={onClose} title="Status dos Servidores" icon={Server}>
      <div className="flex flex-col h-[80vh] max-h-[90vh] w-full p-2 md:p-6 lg:p-8 2xl:p-10">
        {/* Erro de configuração */}
        {configError && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-sm text-red-200">
              <strong>Erro ao carregar configuração:</strong> {configError}
            </p>
            <p className="text-xs text-red-300 mt-1">
              Verifique a URL do GitHub Gist em CONFIG_API_URL
            </p>
          </div>
        )}

        {/* Barra de resumo com estatísticas e botão de refresh */}
        <div
          className="flex items-center justify-between gap-2 p-2.5 sm:p-3 mb-3 sticky top-0 z-10 rounded-xl"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0 flex-1">
            <span className="hidden md:inline font-semibold text-xs sm:text-sm" style={{ color: 'var(--text)' }}>
              Conectados:
            </span>
            {!loading && servers.length > 0 && (
              <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-medium flex-wrap">
                <span className="px-2 py-1 rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  V2Ray: <strong className="font-mono font-semibold" style={{ color: 'var(--text)' }}>{totals.v2ray}</strong>
                </span>
                <span className="px-2 py-1 rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  VTProxy: <strong className="font-mono font-semibold" style={{ color: 'var(--text)' }}>{totals.vtProxy}</strong>
                </span>
                <span className="px-2 py-1 rounded-lg text-emerald-400 font-semibold" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                  Total: <strong className="font-mono">{totals.total}</strong>
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing || serverConfigs.length === 0}
            className={`
              w-9 h-9 sm:w-10 sm:h-10 rounded-xl transition-all duration-200 flex-shrink-0 flex items-center justify-center touch-manipulation
              ${refreshing || serverConfigs.length === 0
                ? 'opacity-40 cursor-not-allowed' 
                : 'active:scale-95 hover:opacity-85'
              }
            `}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            aria-label="Atualizar lista de servidores"
            title="Atualizar lista de servidores"
          >
            <RefreshCw 
              className={`
                w-4 h-4 sm:w-5 sm:h-5
                ${refreshing ? 'animate-spin text-[var(--accent)]' : 'transition-colors'}
              `}
              style={{ color: 'var(--text-muted)' }}
            />
          </button>
        </div>

        {/* Lista de servidores com scroll e feedback visual */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
          {loading && servers.length === 0 ? (
            <div className="flex items-center justify-center p-4">
              <Loader className="w-7 h-7 animate-spin" style={{ color: 'var(--text-muted)' }} />
            </div>
          ) : servers.length === 0 ? (
            <div className="flex items-center justify-center p-8" style={{ color: 'var(--text-muted)' }}>
              <p>Nenhum servidor configurado</p>
            </div>
          ) : (
            <div className="space-y-2 animate-fadeIn">
              {servers.map((server) => (
                <div
                  key={server.host}
                  className={`
                    px-3 py-3 md:px-4 md:py-4 lg:px-5 lg:py-5 2xl:px-6 2xl:py-6 rounded-xl 2xl:rounded-2xl
                    transition-all duration-200 hover:scale-[1.01] active:scale-95
                    ${server.isOnline ? '' : 'opacity-60'}
                    shadow-sm hover:shadow-md cursor-pointer select-none
                  `}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                  }}
                  tabIndex={0}
                  aria-label={`Servidor ${server.name} com ${server.totalUsers} usuários online`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-sm md:text-base lg:text-lg 2xl:text-xl truncate max-w-[60vw] md:max-w-[250px] lg:max-w-[400px]" style={{ color: 'var(--text)' }}>
                      {server.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`
                        text-xs lg:text-sm font-bold px-2 py-1 lg:px-3 lg:py-1.5 rounded-lg border
                        ${server.isOnline ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border-rose-500/30'}
                      `}>
                        {server.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                  
                  {server.isOnline && (
                    <>
                      <div className="grid grid-cols-3 gap-2 lg:gap-3 2xl:gap-4 text-xs md:text-sm lg:text-base mb-2">
                        <div className="p-2 lg:p-3 2xl:p-4 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                          <span className="block text-[10px] sm:text-xs" style={{ color: 'var(--text-muted)' }}>V2Ray</span>
                          <span className="font-mono font-semibold" style={{ color: 'var(--text)' }}>{server.v2rayUsers}</span>
                        </div>
                        <div className="p-2 lg:p-3 2xl:p-4 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                          <span className="block text-[10px] sm:text-xs" style={{ color: 'var(--text-muted)' }}>VTProxy</span>
                          <span className="font-mono font-semibold" style={{ color: 'var(--text)' }}>{server.vtProxyUsers}</span>
                        </div>
                        <div className="p-2 lg:p-3 2xl:p-4 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                          <span className="block text-[10px] sm:text-xs" style={{ color: 'var(--text-muted)' }}>Total</span>
                          <span className="font-mono font-semibold" style={{ color: 'var(--accent)' }}>{server.totalUsers}</span>
                        </div>
                      </div>
                      
                      {/* Recursos do Sistema */}
                      {server.resources && (
                        <div className="grid grid-cols-2 gap-2 lg:gap-3 2xl:gap-4 text-xs md:text-sm lg:text-base pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                          <div className="p-2 lg:p-3 2xl:p-4 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                            <span className="block mb-1 font-medium" style={{ color: 'var(--text-muted)' }}>💾 Memória</span>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 rounded-full h-2 lg:h-2.5 2xl:h-3 overflow-hidden bg-black/20">
                                <div 
                                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 lg:h-2.5 2xl:h-3 rounded-full transition-all duration-300"
                                  style={{ width: `${server.resources.memory.usage_percent}%` }}
                                />
                              </div>
                              <span className="font-mono font-semibold text-xs" style={{ color: 'var(--text)' }}>
                                {server.resources.memory.usage_percent.toFixed(1)}%
                              </span>
                            </div>
                            <span className="text-[10px] lg:text-xs block mt-1" style={{ color: 'var(--text-muted)' }}>
                              {(server.resources.memory.used / 1024).toFixed(0)}MB / {(server.resources.memory.total / 1024).toFixed(0)}MB
                            </span>
                          </div>
                          <div className="p-2 lg:p-3 2xl:p-4 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                            <span className="block mb-1 font-medium" style={{ color: 'var(--text-muted)' }}>⚡ CPU</span>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 rounded-full h-2 lg:h-2.5 2xl:h-3 overflow-hidden bg-black/20">
                                <div 
                                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 lg:h-2.5 2xl:h-3 rounded-full transition-all duration-300"
                                  style={{ width: `${server.resources.cpu.usage_percent}%` }}
                                />
                              </div>
                              <span className="font-mono font-semibold text-xs" style={{ color: 'var(--text)' }}>
                                {server.resources.cpu.usage_percent.toFixed(1)}%
                              </span>
                            </div>
                            <span className="text-[#b7abc9]/50 text-[10px] block mt-1">
                              Uso do processador
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
