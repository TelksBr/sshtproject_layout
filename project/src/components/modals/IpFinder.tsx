import React, { useState, useEffect, useRef } from 'react';
import { Modal } from './Modal';
import { Search, Save, Play, Trash2 } from 'lucide-react';
import { getStorageItem, setStorageItem } from '../../utils/storageUtils';

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
    const keys = Object.keys(localStorage).filter(key => key.startsWith('@sshproject:list-'));
    const lists = keys.map(key => ({
      name: key.replace('@sshproject:', ''),
      value: getStorageItem<string>(key.replace('@sshproject:', '')) || ''
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
          const newIP = window?.DtGetLocalIP?.execute();
          if (newIP && newIP !== '127.0.0.1' && isValidLocalIp(newIP)) {
            clearInterval(interval);
            resolve(newIP);
          }
        }, 1000);
      });
    };

    for (let i = 0; i < 256; i++) {
      if (stopSearchRef.current) break;

      window?.DtAirplaneActivate?.execute();
      await new Promise(resolve => setTimeout(resolve, 3000));
      window?.DtAirplaneDeactivate?.execute();

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
    setStorageItem(listName, ipRange);
    setSavedLists(prevLists => [...prevLists, { name: listName, value: ipRange }]);
    setLogs(prevLogs => [...prevLogs, `Lista salva como ${listName}`]);
  };

  const handleSearchFromList = (list: { name: string, value: string }) => {
    const ipList = list.value.split(',').map(ip => ip.trim()).filter(isValidLocalIp);
    searchIPs(ipList);
  };

  const deleteIpList = (listName: string) => {
    localStorage.removeItem(`@sshproject:${listName}`);
    setSavedLists(prevLists => prevLists.filter(list => list.name !== listName));
    setLogs(prevLogs => [...prevLogs, `Lista ${listName} apagada.`]);
  };

  return (
    <Modal onClose={handleClose}>
      <div className="max-w-md mx-auto p-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Buscador de IP</h1>
          <p className="text-lg text-gray-300">
            Insira intervalos de endereços IP separados por vírgula para buscar.
          </p>
          <p className="text-sm text-red-400 mt-2">
            Nota: Para usar esta função, é preciso ter ativo a permissão de assistente para uso do modo avião.
          </p>
        </div>

        <div className="mb-8">
          <input
            type="text"
            value={ipRange}
            onChange={(e) => setIpRange(e.target.value)}
            className="w-full p-3 rounded-lg bg-[#2A0A3E] border border-[#6205D5]/20 text-white"
            placeholder="Digite os intervalos de IP, ex: 192.168.0, 10.0.0"
          />
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSearchClick}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {isSearching ? 'Parar' : <><Search className="w-5 h-5" /> Buscar</>}
            </button>
            <button
              onClick={saveIpList}
              className="btn-outline flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" /> Salvar
            </button>
          </div>
        </div>

        <div className="card p-4 max-h-64 overflow-y-auto">
          <h3 className="text-xl font-bold mb-2">Logs</h3>
          {logs.map((log, index) => (
            <p key={index} className="text-gray-300 text-sm">{log}</p>
          ))}
        </div>

        <div className="card p-4 max-h-64 overflow-y-auto mt-4">
          <h3 className="text-xl font-bold mb-2">Listas Salvas</h3>
          {savedLists.map((list, index) => (
            <div key={index} className="mb-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-sm">{list.name}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSearchFromList(list)}
                    className="btn-outline flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5" /> Buscar
                  </button>
                  <button
                    onClick={() => deleteIpList(list.name)}
                    className="btn-outline flex items-center justify-center gap-2 text-red-400 border-red-400"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <p className="text-gray-400 text-xs">{list.value}</p>
            </div>
          ))}
        </div>

        {showConfirmClose && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#2A0A3E] rounded-2xl max-w-sm w-full p-6">
              <h2 className="text-xl font-bold mb-4">Parar Busca</h2>
              <p className="text-gray-300 mb-4">A busca de IP está em andamento. Deseja parar a busca e fechar?</p>
              <div className="flex gap-4">
                <button
                  onClick={confirmClose}
                  className="btn-primary flex-1"
                >
                  Sim
                </button>
                <button
                  onClick={cancelClose}
                  className="btn-outline flex-1"
                >
                  Não
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}