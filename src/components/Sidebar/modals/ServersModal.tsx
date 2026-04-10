import { useEffect, useState } from 'react';
import { Modal } from '../../modals/Modal';
import { Loader, RefreshCw, Server } from '../../../utils/icons';

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
  sshUsers: number;
  v2rayUsers: number;
  dtProtoUsers: number;
  totalUsers: number;
  isOnline: boolean;
  order: number;
  resources?: SystemResources;
}

interface ServerTotals {
  ssh: number;
  v2ray: number;
  dtProto: number;
  total: number;
}

interface ServersModalProps {
  onClose: () => void;
}

export function ServersModal({ onClose }: ServersModalProps) {
  const [serverConfigs, setServerConfigs] = useState<ServerConfig[]>([]);
  const [servers, setServers] = useState<ServerStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState<ServerTotals>({ ssh: 0, v2ray: 0, dtProto: 0, total: 0 });
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
    const newTotals = { ssh: 0, v2ray: 0, dtProto: 0, total: 0 };
    serverList.forEach(server => {
      if (server.isOnline) {
        newTotals.ssh += server.sshUsers;
        newTotals.v2ray += server.v2rayUsers;
        newTotals.dtProto += server.dtProtoUsers;
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
      
      const serverStatus: ServerStatus = {
        name: config.name,
        host: config.host,
        sshUsers: dataOnlines.ssh_users ?? 0,
        v2rayUsers: dataOnlines.v2ray_users ?? 0,
        dtProtoUsers: dataOnlines.dt_proto_users ?? 0,
        totalUsers: dataOnlines.total_users ?? 0,
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
        sshUsers: 0,
        v2rayUsers: 0,
        dtProtoUsers: 0,
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

        {/* Cabeçalho fixo com refresh */}
        <div className="flex items-center justify-between mb-2 sticky top-0 z-10 rounded-t-lg p-2 md:p-0" style={{ background: 'linear-gradient(to right, #26074d, #100322)' }}>
          <div className="flex items-center gap-4">
            <span className="font-semibold text-base md:text-lg lg:text-xl 2xl:text-2xl text-white">Status dos Servidores</span>
            {!loading && servers.length > 0 && (
              <div className="text-xs md:text-sm lg:text-base text-[#b0a8ff]/70 flex gap-3 lg:gap-4">
                <span>SSH: <span className="text-white font-semibold">{totals.ssh}</span></span>
                <span>V2Ray: <span className="text-white font-semibold">{totals.v2ray}</span></span>
                <span>DT Proto: <span className="text-white font-semibold">{totals.dtProto}</span></span>
                <span className="text-[#b0a8ff]">Total: <span className="text-emerald-400 font-semibold">{totals.total}</span></span>
              </div>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing || serverConfigs.length === 0}
            className={`
              p-2 rounded-lg transition-colors duration-200
              ${refreshing || serverConfigs.length === 0
                ? 'bg-[#6205D5]/10 cursor-not-allowed' 
                : 'hover:bg-[#6205D5]/20 active:scale-95'
              }
            `}
            aria-label="Atualizar lista de servidores"
          >
            <RefreshCw 
              className={`
                w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 text-[#b0a8ff]
                ${refreshing ? 'animate-spin' : 'hover:text-white transition-colors'}
              `}
            />
          </button>
        </div>

 

        {/* Lista de servidores com scroll e feedback visual */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
          {loading && servers.length === 0 ? (
            <div className="flex items-center justify-center p-4">
              <Loader className="w-7 h-7 text-[#b0a8ff] animate-spin" />
            </div>
          ) : servers.length === 0 ? (
            <div className="flex items-center justify-center p-8 text-[#b0a8ff]/70">
              <p>Nenhum servidor configurado</p>
            </div>
          ) : (
            <div className="space-y-2 animate-fadeIn">
              {servers.map((server) => (
                <div
                  key={server.host}
                  className={`
                    px-3 py-3 md:px-4 md:py-4 lg:px-5 lg:py-5 2xl:px-6 2xl:py-6 rounded-xl 2xl:rounded-2xl
                    transition-all duration-200 active:scale-[0.98]
                    ${server.isOnline 
                      ? 'bg-[#6205D5]/15 hover:bg-[#6205D5]/25 border border-[#6205D5]/10 hover:border-[#6205D5]/30' 
                      : 'bg-red-500/10 border border-red-500/10 opacity-60'
                    }
                    shadow-sm select-none
                  `}
                  tabIndex={0}
                  aria-label={`Servidor ${server.name} com ${server.totalUsers} usuários online`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-white text-sm md:text-base lg:text-lg 2xl:text-xl truncate max-w-[60vw] md:max-w-[250px] lg:max-w-[400px]">
                      {server.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`
                        text-xs lg:text-sm font-semibold px-2 py-1 lg:px-3 lg:py-1.5 rounded
                        ${server.isOnline ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}
                      `}>
                        {server.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                  
                  {server.isOnline && (
                    <>
                      <div className="grid grid-cols-4 gap-2 lg:gap-3 2xl:gap-4 text-xs md:text-sm lg:text-base mb-2">
                        <div className="bg-[#6205D5]/10 p-2 lg:p-3 2xl:p-4 rounded lg:rounded-lg">
                          <span className="text-[#b0a8ff]/70 block">SSH</span>
                          <span className="text-white font-mono font-semibold">{server.sshUsers}</span>
                        </div>
                        <div className="bg-[#6205D5]/10 p-2 lg:p-3 2xl:p-4 rounded lg:rounded-lg">
                          <span className="text-[#b0a8ff]/70 block">V2Ray</span>
                          <span className="text-white font-mono font-semibold">{server.v2rayUsers}</span>
                        </div>
                        <div className="bg-[#6205D5]/10 p-2 lg:p-3 2xl:p-4 rounded lg:rounded-lg">
                          <span className="text-[#b0a8ff]/70 block">DT Proto</span>
                          <span className="text-white font-mono font-semibold">{server.dtProtoUsers}</span>
                        </div>
                        <div className="bg-[#6205D5]/15 p-2 lg:p-3 2xl:p-4 rounded lg:rounded-lg">
                          <span className="text-[#b0a8ff]/70 block">Total</span>
                          <span className="text-white font-mono font-semibold">{server.totalUsers}</span>
                        </div>
                      </div>
                      
                      {/* Recursos do Sistema */}
                      {server.resources && (
                        <div className="grid grid-cols-2 gap-2 lg:gap-3 2xl:gap-4 text-xs md:text-sm lg:text-base pt-2 border-t border-[#6205D5]/20">
                          <div className="bg-[#6205D5]/5 p-2 lg:p-3 2xl:p-4 rounded lg:rounded-lg">
                            <span className="text-[#b0a8ff]/70 block mb-1">💾 Memória</span>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-[#6205D5]/20 rounded-full h-2 lg:h-2.5 2xl:h-3">
                                <div 
                                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 lg:h-2.5 2xl:h-3 rounded-full transition-all duration-300"
                                  style={{ width: `${server.resources.memory.usage_percent}%` }}
                                />
                              </div>
                              <span className="text-white font-mono font-semibold text-xs">
                                {server.resources.memory.usage_percent.toFixed(1)}%
                              </span>
                            </div>
                            <span className="text-[#b0a8ff]/50 text-[10px] lg:text-xs block mt-1">
                              {(server.resources.memory.used / 1024).toFixed(0)}MB / {(server.resources.memory.total / 1024).toFixed(0)}MB
                            </span>
                          </div>
                          <div className="bg-[#6205D5]/5 p-2 lg:p-3 2xl:p-4 rounded lg:rounded-lg">
                            <span className="text-[#b0a8ff]/70 block mb-1">⚡ CPU</span>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-[#6205D5]/20 rounded-full h-2 lg:h-2.5 2xl:h-3">
                                <div 
                                  className="bg-gradient-to-r from-green-500 to-cyan-500 h-2 lg:h-2.5 2xl:h-3 rounded-full transition-all duration-300"
                                  style={{ width: `${server.resources.cpu.usage_percent}%` }}
                                />
                              </div>
                              <span className="text-white font-mono font-semibold text-xs">
                                {server.resources.cpu.usage_percent.toFixed(1)}%
                              </span>
                            </div>
                            <span className="text-[#b0a8ff]/50 text-[10px] block mt-1">
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
