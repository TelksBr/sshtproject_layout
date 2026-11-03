import { getMessageLocale, message as tr, useMessages } from '../../i18n/messages';
import { useState, useEffect, useRef } from 'react';
import { Modal } from './Modal';
import { Search, Save, Play, Trash2 } from '../../utils/icons';
import { loadData, getStorageKeys, saveData, removeData } from '../../utils/nativeStorage';
import { toggleAirplaneMode, getLocalIP } from '../../utils/appFunctions';

interface IpFinderProps {
  onClose: () => void;
}

export function IpFinder({ onClose }: IpFinderProps) {
  useMessages();
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
      setLogs(prevLogs => [...prevLogs, tr("mf518dcb545")]);
      setIsSearching(false);
      return;
    }

    // Printar os valores que farão parte da busca
    setLogs(prevLogs => [...prevLogs, tr("m65f13e4f0e", { p0: ipList.join(', ') })]);

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
      const formattedTime = now.toLocaleTimeString(getMessageLocale());
      const logMessage = tr("m27b68bbd0c", { p0: formattedTime, p1: newIP, p2: isInRange ? 'dentro' : 'fora' });

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
    setLogs(prevLogs => [...prevLogs, tr("meabe98ebf9", { p0: listName })]);
  };

  const handleSearchFromList = (list: { name: string, value: string }) => {
    const ipList = list.value.split(',').map(ip => ip.trim()).filter(isValidLocalIp);
    searchIPs(ipList);
  };

  const deleteIpList = (listName: string) => {
    removeData(listName);
    setSavedLists(prevLists => prevLists.filter(list => list.name !== listName));
    setLogs(prevLogs => [...prevLogs, tr("m5c7a6fdc56", { p0: listName })]);
  };

  return (
    <Modal onClose={handleClose} title={tr("m6c78b89d79")} icon={Search}>
      <div className="w-full p-3 md:p-5 lg:p-6 2xl:p-8 space-y-4 lg:space-y-5">
        
        {/* Banner informativo */}
        <div className="rounded-xl lg:rounded-2xl p-3 md:p-4 lg:p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-sm md:text-base lg:text-lg leading-relaxed" style={{ color: 'var(--text)' }}>
            {tr("mf6ffbe48e3")}</p>
          <div className="flex items-start gap-2 mt-2 lg:mt-3">
            <span className="text-amber-400 text-base lg:text-lg flex-shrink-0">⚠️</span>
            <p className="text-xs md:text-sm lg:text-base" style={{ color: 'var(--text-muted)' }}>
              {tr("mf3e0298541")}</p>
          </div>
        </div>

        {/* Input + Botões */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            <input dir="auto"
              type="text"
              value={ipRange}
              onChange={(e) => setIpRange(e.target.value)}
              className="w-full pl-10 lg:pl-12 pr-4 py-3 lg:py-4 rounded-xl lg:rounded-2xl text-sm lg:text-base 2xl:text-lg outline-none transition-all duration-200 allow-select"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text)', border: '1px solid var(--border)' }}
              placeholder={tr("m75298ab838")}
            />
          </div>
          <div className="flex gap-2 lg:gap-3">
            <button
              onClick={handleSearchClick}
              className={`
                flex-1 flex items-center justify-center gap-2 lg:gap-3 
                font-semibold py-3 lg:py-4 px-5 rounded-xl lg:rounded-2xl 
                shadow-lg transition-all duration-200 active:scale-[0.98]
                text-sm lg:text-base 2xl:text-lg text-white
              `}
              style={{ background: isSearching ? '#dc2626' : 'var(--accent)' }}
            >
              {isSearching ? (
                <>
                  <div className="w-4 h-4 lg:w-5 lg:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {tr("m46088be774")}</>
              ) : (
                <><Search className="w-4 h-4 lg:w-5 lg:h-5" /> {" " + tr("m21b7c6ad3c")}</>
              )}
            </button>
            <button
              onClick={saveIpList}
              disabled={!ipRange.trim()}
              className="flex items-center justify-center gap-2 font-semibold py-3 lg:py-4 px-4 lg:px-5 rounded-xl lg:rounded-2xl transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-sm lg:text-base"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text)', border: '1px solid var(--border)' }}
            >
              <Save className="w-4 h-4 lg:w-5 lg:h-5 text-[var(--accent)]" />
              <span className="hidden sm:inline">{tr("maef7cd5b20")}</span>
            </button>
          </div>
        </div>

        {/* Logs */}
        <div className="rounded-xl lg:rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between px-4 lg:px-5 py-2.5 lg:py-3 border-b bg-[var(--bg-elevated)]" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-sm lg:text-base 2xl:text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <span>📋</span> {" " + tr("mea2100dc89")}</h3>
            {isSearching && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs lg:text-sm text-emerald-500 font-semibold">{tr("mb496fae27c")}</span>
              </div>
            )}
          </div>
          <div className="max-h-48 lg:max-h-64 overflow-y-auto custom-scrollbar p-3 lg:p-4 space-y-1.5">
            {logs.length === 0 ? (
              <p className="text-xs lg:text-sm text-center py-6 lg:py-8" style={{ color: 'var(--text-muted)' }}>
                {tr("m4bb86441da")}</p>
            ) : (
              logs.map((log, index) => {
                const isDentro = log.includes('dentro');
                const isFora = log.includes('fora');
                const isValores = log.includes('Valores para busca');
                return (
                  <div 
                    key={index} 
                    className="flex items-start gap-2 px-2.5 lg:px-3 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-mono"
                    style={{
                      background: isDentro ? 'rgba(52,211,153,0.15)' : 'var(--bg-elevated)',
                      color: isDentro ? '#34d399' : 'var(--text)',
                      border: '1px solid var(--border)',
                    }}
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
          <div className="rounded-xl lg:rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="px-4 lg:px-5 py-2.5 lg:py-3 border-b bg-[var(--bg-elevated)]" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-sm lg:text-base 2xl:text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <span>💾</span> {" " + tr("md9a6af01a1")}<span className="ml-auto text-xs lg:text-sm font-normal" style={{ color: 'var(--text-muted)' }}>{savedLists.length}</span>
              </h3>
            </div>
            <div className="max-h-48 lg:max-h-64 overflow-y-auto custom-scrollbar p-3 lg:p-4 space-y-2 lg:space-y-3">
              {savedLists.map((list, index) => (
                <div 
                  key={index} 
                  className="rounded-xl p-3 lg:p-4 transition-colors duration-200"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs lg:text-sm truncate" style={{ color: 'var(--text-muted)' }}>
                        {list.name.replace('list-', '#')}
                      </p>
                      <p className="text-sm lg:text-base font-mono mt-0.5 truncate" style={{ color: 'var(--text)' }}>
                        {list.value}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleSearchFromList(list)}
                        className="flex items-center justify-center gap-1.5 font-medium py-2 px-3 lg:px-4 rounded-lg lg:rounded-xl transition-all duration-200 active:scale-[0.96] text-xs lg:text-sm text-white"
                        style={{ background: 'var(--accent)' }}
                      >
                        <Play className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                        <span className="hidden sm:inline">{tr("m5f55edf900")}</span>
                      </button>
                      <button
                        onClick={() => deleteIpList(list.name)}
                        className="flex items-center justify-center bg-rose-500/15 text-rose-400 py-2 px-2.5 lg:px-3 rounded-lg lg:rounded-xl transition-all duration-200 active:scale-[0.96]"
                        aria-label={tr("m4f2607d15f")}
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
          <div
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            style={{
              paddingTop: 'var(--safe-top, 32px)',
              paddingBottom: 'var(--safe-bottom, 48px)',
            }}
          >
            <div className="rounded-2xl max-w-sm w-full p-5 lg:p-6 shadow-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">⚠️</span>
                </div>
                <h2 className="text-lg lg:text-xl font-bold" style={{ color: 'var(--text)' }}>{tr("m3d8a0ec27a")}</h2>
              </div>
              <p className="text-sm lg:text-base mb-5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {tr("m2951c1a2d3")}</p>
              <div className="flex gap-3">
                <button
                  onClick={cancelClose}
                  className="flex-1 font-semibold py-3 rounded-xl transition-all duration-200 active:scale-[0.98] text-sm lg:text-base"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text)', border: '1px solid var(--border)' }}
                >
                  {tr("m63e2bbaf1c")}</button>
                <button
                  onClick={confirmClose}
                  className="flex-1 bg-rose-600 text-white font-semibold py-3 rounded-xl hover:bg-rose-500 transition-all duration-200 active:scale-[0.98] text-sm lg:text-base"
                >
                  {tr("mf5ecbf8266")}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}