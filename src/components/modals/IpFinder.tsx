import { useState, useEffect, useRef } from 'react';
import { Modal } from './Modal';
import { Search, Save, Play, Trash2 } from '../../utils/icons';
import { loadData, getStorageKeys, saveData, removeData } from '../../utils/nativeStorage';
import { toggleAirplaneMode, getLocalIP } from '../../utils/appFunctions';

interface IpFinderProps {
  onClose: () => void;
}

export function IpFinder({ onClose }: IpFinderProps) {
  const [ipRange, setIpRange] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [savedLists, setSavedLists] = useState<{ name: string, value: string }[]>([]);
  const stopSearchRef = useRef(false);

  useEffect(() => {
    const keys = getStorageKeys().filter(key => key.startsWith('list-'));
    const lists = keys.map(key => ({
      name: key.replace('list-', ''),
      value: loadData<string>(key) || ''
    }));
    setSavedLists(lists);
  }, []);

  const isValidLocalIp = (ip: string) => {
    const localIpRanges = [
      /^10(\.\d{1,3}){0,3}$/, // Classe A: 10.x.x.x
      /^172\.(1[6-9]|2\d|3[0-1])(\.\d{1,3}){0,2}$/, // Classe B: 172.16.x.x - 172.31.x.x
      /^192\.168(\.\d{1,3}){0,2}$/, // Classe C: 192.168.x.x
      /^100\.(6[4-9]|[7-9]\d|1[0-1]\d|12[0-7])(\.\d{1,3}){0,2}$/ // CGNAT: 100.64.x.x - 100.127.x.x
    ];
    return localIpRanges.some(range => range.test(ip));
  };

  const isIpInRange = (ip: string, range: string) => {
    const ipParts = ip.split('.');
    const rangeParts = range.split('.');
    return rangeParts.every((part, index) => part === ipParts[index]);
  };

  const searchIPs = async (ipList: string[]) => {
    setLogs([]);
    setIsSearching(true);
    stopSearchRef.current = false;

    if (ipList.length === 0) {
      setLogs(prevLogs => [...prevLogs, 'Erro: Nenhum IP válido para buscar.']);
      setIsSearching(false);
      return;
    }

    // Printar os valores que farão parte da busca
    setLogs(prevLogs => [...prevLogs, `Valores para busca: ${ipList.join(', ')}`]);

    const waitForNewIP = () => {
      return new Promise<string>((resolve) => {
        const interval = setInterval(() => {
          const newIP = getLocalIP();
          if (newIP && newIP !== '127.0.0.1' && isValidLocalIp(newIP)) {
            clearInterval(interval);
            resolve(newIP);
          }
        }, 1000);
      });
    };

    for (let i = 0; i < 256; i++) {
      if (stopSearchRef.current) break;

      await toggleAirplaneMode(true);
      await new Promise(resolve => setTimeout(resolve, 3000));
      await toggleAirplaneMode(false);

      const newIP = await waitForNewIP();
      const isInRange = ipList.some(range => isIpInRange(newIP, range));

      const now = new Date();
      const formattedTime = now.toLocaleTimeString();
      const logMessage = `${formattedTime} - IP: ${newIP} - ${isInRange ? 'dentro' : 'fora'} do intervalo`;

      setLogs(prevLogs => [...prevLogs, logMessage]);

      if (isInRange) {
        stopSearchRef.current = true;
        break;
      }
    }

    setIsSearching(false);
  };

  const handleSearchClick = () => {
    if (isSearching) {
      stopSearchRef.current = true;
      setIsSearching(false);
    } else {
      const ipList = ipRange.split(',').map(ip => ip.trim()).filter(isValidLocalIp);
      searchIPs(ipList);
    }
  };

  const handleClose = () => {
    if (isSearching) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  const confirmClose = () => {
    stopSearchRef.current = true;
    setIsSearching(false);
    setShowConfirmClose(false);
    onClose();
  };

  const cancelClose = () => {
    setShowConfirmClose(false);
  };

  const saveIpList = () => {
    const listName = `list-${new Date().getTime()}`;
    saveData(listName, ipRange);
    setSavedLists(prevLists => [...prevLists, { name: listName, value: ipRange }]);
    setLogs(prevLogs => [...prevLogs, `Lista salva como ${listName}`]);
  };

  const handleSearchFromList = (list: { name: string, value: string }) => {
    const ipList = list.value.split(',').map(ip => ip.trim()).filter(isValidLocalIp);
    searchIPs(ipList);
  };

  const deleteIpList = (listName: string) => {
    removeData(listName);
    setSavedLists(prevLists => prevLists.filter(list => list.name !== listName));
    setLogs(prevLogs => [...prevLogs, `Lista ${listName} apagada.`]);
  };

  return (
    <Modal onClose={handleClose} title="Buscador de IP" icon={Search}>
      <div className="w-full p-3 md:p-5 lg:p-6 2xl:p-8 space-y-4 lg:space-y-5">
        
        {/* Banner informativo */}
        <div className="bg-[#6205D5]/10 border border-[#6205D5]/20 rounded-xl lg:rounded-2xl p-3 md:p-4 lg:p-5">
          <p className="text-sm md:text-base lg:text-lg text-[#b0a8ff] leading-relaxed">
            Insira intervalos de endereços IP separados por vírgula para buscar automaticamente via modo avião.
          </p>
          <div className="flex items-start gap-2 mt-2 lg:mt-3">
            <span className="text-amber-400 text-base lg:text-lg flex-shrink-0">⚠️</span>
            <p className="text-xs md:text-sm lg:text-base text-amber-400/80">
              É preciso ter ativa a permissão de assistente para uso do modo avião.
            </p>
          </div>
        </div>

        {/* Input + Botões */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-[#b0a8ff]/40 pointer-events-none" />
            <input
              type="text"
              value={ipRange}
              onChange={(e) => setIpRange(e.target.value)}
              className="w-full pl-10 lg:pl-12 pr-4 py-3 lg:py-4 rounded-xl lg:rounded-2xl bg-[#26074d]/80 border border-[#6205D5]/30 text-white text-sm lg:text-base 2xl:text-lg placeholder-[#b0a8ff]/30 focus:border-[#6205D5]/60 focus:ring-1 focus:ring-[#6205D5]/30 outline-none transition-all duration-200 allow-select"
              placeholder="Ex: 192.168.0, 10.0.0, 100.64"
            />
          </div>
          <div className="flex gap-2 lg:gap-3">
            <button
              onClick={handleSearchClick}
              className={`
                flex-1 flex items-center justify-center gap-2 lg:gap-3 
                font-semibold py-3 lg:py-4 px-5 rounded-xl lg:rounded-2xl 
                shadow-lg transition-all duration-200 active:scale-[0.98]
                text-sm lg:text-base 2xl:text-lg
                ${isSearching 
                  ? 'bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30' 
                  : 'bg-gradient-to-r from-[#6205D5] to-[#4B0082] hover:from-[#7c4dff] hover:to-[#6205D5] text-white shadow-[#6205D5]/20'
                }
              `}
            >
              {isSearching ? (
                <>
                  <div className="w-4 h-4 lg:w-5 lg:h-5 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
                  Parar Busca
                </>
              ) : (
                <><Search className="w-4 h-4 lg:w-5 lg:h-5" /> Iniciar Busca</>
              )}
            </button>
            <button
              onClick={saveIpList}
              disabled={!ipRange.trim()}
              className="flex items-center justify-center gap-2 border border-[#6205D5]/40 text-[#b0a8ff] font-semibold py-3 lg:py-4 px-4 lg:px-5 rounded-xl lg:rounded-2xl bg-[#6205D5]/5 hover:bg-[#6205D5]/15 transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-sm lg:text-base"
            >
              <Save className="w-4 h-4 lg:w-5 lg:h-5" />
              <span className="hidden sm:inline">Salvar</span>
            </button>
          </div>
        </div>

        {/* Logs */}
        <div className="bg-[#100322] border border-[#6205D5]/15 rounded-xl lg:rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 lg:px-5 py-2.5 lg:py-3 border-b border-[#6205D5]/15 bg-[#6205D5]/5">
            <h3 className="text-sm lg:text-base 2xl:text-lg font-semibold text-white flex items-center gap-2">
              <span className="text-[#b0a8ff]/60">📋</span> Logs
            </h3>
            {isSearching && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs lg:text-sm text-green-400/80">Buscando...</span>
              </div>
            )}
          </div>
          <div className="max-h-48 lg:max-h-64 overflow-y-auto custom-scrollbar p-3 lg:p-4 space-y-1.5">
            {logs.length === 0 ? (
              <p className="text-[#b0a8ff]/30 text-xs lg:text-sm text-center py-6 lg:py-8">
                Nenhum log ainda. Inicie uma busca para ver os resultados.
              </p>
            ) : (
              logs.map((log, index) => {
                const isDentro = log.includes('dentro');
                const isFora = log.includes('fora');
                const isValores = log.includes('Valores para busca');
                return (
                  <div 
                    key={index} 
                    className={`
                      flex items-start gap-2 px-2.5 lg:px-3 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-mono
                      ${isDentro ? 'bg-green-500/10 text-green-300' : ''}
                      ${isFora ? 'bg-[#6205D5]/5 text-[#b0a8ff]/70' : ''}
                      ${isValores ? 'bg-[#6205D5]/10 text-[#b0a8ff]' : ''}
                      ${!isDentro && !isFora && !isValores ? 'text-[#b0a8ff]/60' : ''}
                    `}
                  >
                    <span className="flex-shrink-0 mt-0.5">
                      {isDentro ? '✅' : isFora ? '❌' : isValores ? '🔍' : '•'}
                    </span>
                    <span className="break-all">{log}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Listas Salvas */}
        {savedLists.length > 0 && (
          <div className="bg-[#100322] border border-[#6205D5]/15 rounded-xl lg:rounded-2xl overflow-hidden">
            <div className="px-4 lg:px-5 py-2.5 lg:py-3 border-b border-[#6205D5]/15 bg-[#6205D5]/5">
              <h3 className="text-sm lg:text-base 2xl:text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-[#b0a8ff]/60">💾</span> Listas Salvas
                <span className="ml-auto text-xs lg:text-sm text-[#b0a8ff]/40 font-normal">{savedLists.length}</span>
              </h3>
            </div>
            <div className="max-h-48 lg:max-h-64 overflow-y-auto custom-scrollbar p-3 lg:p-4 space-y-2 lg:space-y-3">
              {savedLists.map((list, index) => (
                <div 
                  key={index} 
                  className="bg-[#26074d]/50 border border-[#6205D5]/10 rounded-xl p-3 lg:p-4 hover:border-[#6205D5]/25 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs lg:text-sm text-[#b0a8ff]/50 truncate">
                        {list.name.replace('list-', '#')}
                      </p>
                      <p className="text-sm lg:text-base text-white font-mono mt-0.5 truncate">
                        {list.value}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleSearchFromList(list)}
                        className="flex items-center justify-center gap-1.5 bg-[#6205D5]/15 hover:bg-[#6205D5]/25 text-[#b0a8ff] font-medium py-2 px-3 lg:px-4 rounded-lg lg:rounded-xl transition-all duration-200 active:scale-[0.96] text-xs lg:text-sm"
                      >
                        <Play className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                        <span className="hidden sm:inline">Buscar</span>
                      </button>
                      <button
                        onClick={() => deleteIpList(list.name)}
                        className="flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 px-2.5 lg:px-3 rounded-lg lg:rounded-xl transition-all duration-200 active:scale-[0.96]"
                        aria-label="Excluir lista"
                      >
                        <Trash2 className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal de confirmação */}
        {showConfirmClose && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-[#1A0628] border border-[#6205D5]/20 rounded-2xl max-w-sm w-full p-5 lg:p-6 shadow-2xl shadow-black/40">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">⚠️</span>
                </div>
                <h2 className="text-lg lg:text-xl font-bold text-white">Parar Busca?</h2>
              </div>
              <p className="text-sm lg:text-base text-[#b0a8ff]/70 mb-5 leading-relaxed">
                A busca de IP está em andamento. Deseja parar e fechar?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelClose}
                  className="flex-1 border border-[#6205D5]/30 text-[#b0a8ff] font-semibold py-3 rounded-xl bg-[#6205D5]/5 hover:bg-[#6205D5]/15 transition-all duration-200 active:scale-[0.98] text-sm lg:text-base"
                >
                  Continuar
                </button>
                <button
                  onClick={confirmClose}
                  className="flex-1 bg-red-500/20 border border-red-500/30 text-red-300 font-semibold py-3 rounded-xl hover:bg-red-500/30 transition-all duration-200 active:scale-[0.98] text-sm lg:text-base"
                >
                  Parar e Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}