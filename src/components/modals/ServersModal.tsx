import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { Loader, RefreshCw, Server } from 'lucide-react';

interface Server {
  name: string;
  onlineUsers: number;
  type: 'v2ray' | 'premium' | 'free';
  order: number;
}

interface ServerTotals {
  v2ray: number;
  premium: number;
  free: number;
  total: number;
}

interface ServersModalProps {
  onClose: () => void;
}

export function ServersModal({ onClose }: ServersModalProps) {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState<ServerTotals>({ v2ray: 0, premium: 0, free: 0, total: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [failedServers, setFailedServers] = useState<Set<string>>(new Set());

  const premiumV2rayServers = 3;
  const premiumServers = 4;
  const freeServers = 2;
  const token = 'KZQ4h03hLSzhefDAwRvjWVl9dp';

  // Função para atualizar totais baseada na lista de servidores
  const updateTotals = (serverList: Server[]) => {
    const newTotals = { v2ray: 0, premium: 0, free: 0, total: 0 };
    serverList.forEach(server => {
      newTotals[server.type] += server.onlineUsers;
      newTotals.total += server.onlineUsers;
    });
    setTotals(newTotals);
  };

  // Função para adicionar ou atualizar um servidor na lista
  const upsertServer = (newServer: Server) => {
    setServers(prevServers => {
      const filtered = prevServers.filter(s => s.name !== newServer.name);
      const updated = [...filtered, newServer].sort((a, b) => {
        const typeOrder = { v2ray: 1, premium: 2, free: 3 };
        if (typeOrder[a.type] !== typeOrder[b.type]) {
          return typeOrder[a.type] - typeOrder[b.type];
        }
        return a.order - b.order;
      });
      updateTotals(updated);
      return updated;
    });
  };

  // Função para buscar um servidor com retry
  const fetchWithRetry = async (url: string, retries = 3): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (response.ok) return response;
        if (i === retries - 1) throw new Error(`Failed after ${retries} retries`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      } catch (error) {
        if (i === retries - 1) throw error;
      }
    }
    throw new Error('Fetch failed');
  };

  // Função para buscar dados de um servidor específico
  const fetchServer = async (url: string, name: string, type: Server['type'], order: number) => {
    try {
      const response = await fetchWithRetry(url);
      const data = await response.json();
      const users = data.onlineUsers ?? data.onlineV2rayUsers ?? 0;
      setFailedServers(prev => {
        const next = new Set(prev);
        next.delete(url);
        return next;
      });
      upsertServer({ name, onlineUsers: users, type, order });
    } catch (error) {
      setFailedServers(prev => new Set(prev).add(url));
      // Mantém o servidor na lista, mas com 0 usuários
      upsertServer({ name, onlineUsers: 0, type, order });
    }
  };

  // Função para buscar todos os servidores
  const fetchServerData = async () => {
    setLoading(true);
    const fetchPromises: Promise<void>[] = [];
    // V2Ray
    for (let i = 0; i < premiumV2rayServers; i++) {
      fetchPromises.push(
        fetchServer(
          `http://v2premium-${i + 1}.sshtproject.com:2095/onlines/v2ray?token=${token}`,
          `Premium V2Ray ${i + 1}`,
          'v2ray',
          i + 1
        )
      );
    }
    // Premium
    for (let i = 0; i < premiumServers; i++) {
      fetchPromises.push(
        fetchServer(
          `http://premium${i + 1}.sshtproject.com:2095/onlines/ssh?token=${token}`,
          `Premium ${i + 1}`,
          'premium',
          i + 1
        )
      );
    }
    // Free
    for (let i = 0; i < freeServers; i++) {
      fetchPromises.push(
        fetchServer(
          `http://free${i + 1}.sshtproject.com:2095/onlines/ssh?token=${token}`,
          `Free ${i + 1}`,
          'free',
          i + 1
        )
      );
    }
    await Promise.all(fetchPromises);
    setLoading(false);
  };

  // Função para tentar novamente servidores que falharam
  const retryFailedServers = async () => {
    const currentFailed = Array.from(failedServers);
    if (currentFailed.length === 0) return;
    for (const url of currentFailed) {
      let name = '';
      let type: Server['type'] = 'free';
      let order = 1;
      if (url.includes('v2premium')) {
        type = 'v2ray';
        order = parseInt(url.match(/v2premium(\d+)/)?.[1] || '1', 10);
        name = `Premium V2Ray ${order}`;
      } else if (url.includes('premium')) {
        type = 'premium';
        order = parseInt(url.match(/premium(\d+)/)?.[1] || '1', 10);
        name = `Premium ${order}`;
      } else if (url.includes('free')) {
        type = 'free';
        order = parseInt(url.match(/free(\d+)/)?.[1] || '1', 10);
        name = `Free ${order}`;
      }
      await fetchServer(url, name, type, order);
    }
  };

  // Atualiza servidores ao abrir modal
  useEffect(() => {
    fetchServerData();
  }, []);

  // Tenta reconectar servidores falhos a cada 10 segundos
  useEffect(() => {
    if (failedServers.size === 0) return;
    const retryInterval = setInterval(retryFailedServers, 10000);
    return () => clearInterval(retryInterval);
  }, [failedServers]);

  // Atualiza totais sempre que a lista de servidores mudar
  useEffect(() => {
    updateTotals(servers);
  }, [servers]);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await fetchServerData();
    setRefreshing(false);
  };

  return (
    <Modal onClose={onClose} title="Status dos Servidores" icon={Server}>
      <div className="flex flex-col h-[80vh] max-h-[90dvh] w-full p-2 md:p-6">
        {/* Cabeçalho fixo com refresh */}
        <div className="flex items-center justify-between mb-2 sticky top-0 z-10 bg-[#18122B] rounded-t-lg p-2 md:p-0">
          <span className="font-semibold text-base md:text-lg text-white">Status dos Servidores</span>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`
              p-2 rounded-lg transition-all duration-200
              ${refreshing 
                ? 'bg-[#6205D5]/10 cursor-not-allowed' 
                : 'hover:bg-[#6205D5]/20 active:scale-95'
              }
            `}
            aria-label="Atualizar lista de servidores"
          >
            <RefreshCw 
              className={`
                w-5 h-5 md:w-6 md:h-6 text-[#b0a8ff]
                ${refreshing ? 'animate-spin' : 'hover:text-white transition-colors'}
              `}
            />
          </button>
        </div>

        {/* Totais responsivos */}
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-2">
          <div className="bg-[#6205D5]/20 p-2 md:p-3 rounded-lg flex flex-col items-center">
            <span className="text-[11px] md:text-xs text-[#b0a8ff]/70">Total V2Ray</span>
            <p className="text-base md:text-lg font-bold text-white">{totals.v2ray}</p>
          </div>
          <div className="bg-[#6205D5]/15 p-2 md:p-3 rounded-lg flex flex-col items-center">
            <span className="text-[11px] md:text-xs text-[#b0a8ff]/70">Total SSH</span>
            <p className="text-base md:text-lg font-bold text-white">{totals.premium}</p>
          </div>
          <div className="bg-[#6205D5]/10 p-2 md:p-3 rounded-lg flex flex-col items-center">
            <span className="text-[11px] md:text-xs text-[#b0a8ff]/70">Total Free</span>
            <p className="text-base md:text-lg font-bold text-white">{totals.free}</p>
          </div>
          <div className="bg-[#6205D5]/25 p-2 md:p-3 rounded-lg flex flex-col items-center">
            <span className="text-[11px] md:text-xs text-[#b0a8ff]/70">Total Geral</span>
            <p className="text-base md:text-lg font-bold text-white">{totals.total}</p>
          </div>
        </div>

        {/* Lista de servidores com scroll e feedback visual */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
          {loading && servers.length === 0 ? (
            <div className="flex items-center justify-center p-4">
              <Loader className="w-7 h-7 text-[#b0a8ff] animate-spin" />
            </div>
          ) : (
            <div className="space-y-2 animate-fadeIn">
              {servers.map((server) => (
                <div
                  key={`${server.type}-${server.order}`}
                  className={`
                    flex justify-between items-center px-3 py-2 md:px-4 md:py-3 rounded-lg
                    transition-all duration-200 hover:scale-[1.01] active:scale-95
                    ${server.type === 'v2ray' ? 'bg-[#6205D5]/20' : ''}
                    ${server.type === 'premium' ? 'bg-[#6205D5]/15' : ''}
                    ${server.type === 'free' ? 'bg-[#6205D5]/10' : ''}
                    ${server.onlineUsers > 0 ? '' : 'opacity-60'}
                    shadow-sm hover:shadow-md cursor-pointer select-none
                  `}
                  tabIndex={0}
                  aria-label={`Servidor ${server.name} com ${server.onlineUsers} online`}
                >
                  <span className="font-medium text-white text-sm md:text-base truncate max-w-[60vw] md:max-w-[200px]">{server.name}</span>
                  <span className="text-xs md:text-sm text-[#b0a8ff] font-mono">
                    {server.onlineUsers} online
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
