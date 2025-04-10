import React, { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { Loader, RefreshCw } from 'lucide-react';

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
  
  const premiumV2rayServers = 2;
  const premiumServers = 3;
  const freeServers = 5;
  const token = 'KZQ4h03hLSzhefDAwRvjWVl9dp';

  const calculateTotals = (serverList: Server[]) => {
    const newTotals = serverList.reduce((acc, server) => {
      acc[server.type] += server.onlineUsers;
      acc.total += server.onlineUsers;
      return acc;
    }, { v2ray: 0, premium: 0, free: 0, total: 0 });
    
    setTotals(newTotals);
  };

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

  const addServer = (newServer: Server) => {
    setServers(prevServers => {
      const filteredServers = prevServers.filter(s => s.name !== newServer.name);
      const updatedServers = [...filteredServers, newServer].sort((a, b) => {
        const typeOrder = {
          v2ray: 1,
          premium: 2,
          free: 3
        };
        
        if (typeOrder[a.type] !== typeOrder[b.type]) {
          return typeOrder[a.type] - typeOrder[b.type];
        }
        
        return a.order - b.order;
      });

      // Usa a função calculateTotals para atualizar os totais
      calculateTotals(updatedServers);
      return updatedServers;
    });
  };

  const retryFailedServers = async () => {
    const currentFailed = Array.from(failedServers);
    if (currentFailed.length === 0) return;

    for (const serverUrl of currentFailed) {
      try {
        const response = await fetchWithRetry(serverUrl);
        if (response.ok) {
          setFailedServers(prev => {
            const next = new Set(prev);
            next.delete(serverUrl);
            return next;
          });
        }
      } catch (error) {
        console.error(`Retry failed for ${serverUrl}`);
      }
    }
  };

  const fetchServer = async (url: string, name: string, type: Server['type'], order: number) => {
    try {
      const response = await fetchWithRetry(url);
      const data = await response.json();
      
      const users = data.onlineUsers || data.onlineV2rayUsers || 0;
      
      setFailedServers(prev => {
        const next = new Set(prev);
        next.delete(url);
        return next;
      });

      // Adiciona o servidor com os novos dados
      addServer({
        name,
        onlineUsers: users,
        type,
        order
      });

    } catch (error) {
      console.error(`Erro ao conectar com ${name}:`, error);
      setFailedServers(prev => new Set(prev).add(url));
      
      // Se já temos dados deste servidor, mantemos o valor anterior
      if (!servers.some(s => s.name === name)) {
        addServer({
          name,
          onlineUsers: 0,
          type,
          order
        });
      }
    }
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    await fetchServerData();
    setRefreshing(false);
  };

  const fetchServerData = async () => {
    if (!loading) setLoading(true);

    const fetchPromises = [
      // V2Ray servers
      ...Array(premiumV2rayServers).fill(null).map((_, i) => 
        fetchServer(
          `http://v2premium${i+1}.sshtproject.com:2095/onlines/v2ray?token=${token}`,
          `Premium V2Ray ${i+1}`,
          'v2ray',
          i+1
        )
      ),
      // Premium servers  
      ...Array(premiumServers).fill(null).map((_, i) =>
        fetchServer(
          `http://premium${i+1}.sshtproject.com:2095/onlines/ssh?token=${token}`,
          `Premium ${i+1}`,
          'premium',
          i+1
        )
      ),
      // Free servers
      ...Array(freeServers).fill(null).map((_, i) =>
        fetchServer(
          `http://free${i+1}.sshtproject.com:2095/onlines/ssh?token=${token}`,
          `Free ${i+1}`,
          'free',
          i+1
        )
      )
    ];

    await Promise.all(fetchPromises);
    setLoading(false);
  };

  useEffect(() => {
    fetchServerData();
    // Removida a atualização automática
  }, []);

  // Tenta reconectar servidores falhos a cada 10 segundos sem atualizar a UI
  useEffect(() => {
    if (failedServers.size === 0) return;

    const retryInterval = setInterval(retryFailedServers, 10000);
    return () => clearInterval(retryInterval);
  }, [failedServers]);

  return (
    <Modal onClose={onClose}>
      <div className="p-4 md:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-white">Status dos Servidores</h2>
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
            >
              <RefreshCw 
                className={`
                  w-5 h-5 text-[#b0a8ff]
                  ${refreshing ? 'animate-spin' : 'hover:text-white transition-colors'}
                `}
              />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#6205D5]/20 p-3 rounded-lg">
              <span className="text-xs text-[#b0a8ff]/70">Total V2Ray</span>
              <p className="text-lg font-bold text-white">{totals.v2ray}</p>
            </div>
            <div className="bg-[#6205D5]/15 p-3 rounded-lg">
              <span className="text-xs text-[#b0a8ff]/70">Total Premium</span>
              <p className="text-lg font-bold text-white">{totals.premium}</p>
            </div>
            <div className="bg-[#6205D5]/10 p-3 rounded-lg">
              <span className="text-xs text-[#b0a8ff]/70">Total Free</span>
              <p className="text-lg font-bold text-white">{totals.free}</p>
            </div>
            <div className="bg-[#6205D5]/25 p-3 rounded-lg">
              <span className="text-xs text-[#b0a8ff]/70">Total Geral</span>
              <p className="text-lg font-bold text-white">{totals.total}</p>
            </div>
          </div>

          <div className="space-y-2">
            {loading && servers.length === 0 ? (
              <div className="flex items-center justify-center p-4">
                <Loader className="w-6 h-6 text-[#b0a8ff] animate-spin" />
              </div>
            ) : (
              <div className="space-y-2 animate-fadeIn">
                {servers
                  .filter(server => server.onlineUsers > 0)
                  .map((server) => (
                  <div
                    key={`${server.type}-${server.order}`}
                    className={`
                      flex justify-between items-center p-4 rounded-lg
                      transition-all duration-200 hover:scale-[1.02]
                      ${server.type === 'v2ray' ? 'bg-[#6205D5]/20' : ''}
                      ${server.type === 'premium' ? 'bg-[#6205D5]/15' : ''}
                      ${server.type === 'free' ? 'bg-[#6205D5]/10' : ''}
                    `}
                  >
                    <span className="font-medium text-white">{server.name}</span>
                    <span className="text-sm text-[#b0a8ff]">
                      {server.onlineUsers} online
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
