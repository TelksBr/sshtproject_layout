import { localizeMessage, message as tr, useMessages } from '../../i18n/messages';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Download, Upload, RefreshCw, Server, ChevronDown } from '../../utils/icons';
import { Modal } from './Modal';
import { getSpeedTestServers, runSpeedTest, measureLatency } from '../../utils/speedTestUtils';

interface SpeedTestProps {
  onClose: () => void;
}

export function SpeedTest({ onClose }: SpeedTestProps) {
  useMessages();
  const [testing, setTesting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showServers, setShowServers] = useState(false);
  const [servers, setServers] = useState<any[]>([]); // TestServer
  const [selectedServer, setSelectedServer] = useState<any | null>(null); // TestServer | null
  const [currentPhase, setCurrentPhase] = useState<'ping' | 'download' | 'upload' | null>(null);
  const [results, setResults] = useState({
    download: '0',
    upload: '0',
    ping: '0'
  });
  const [error, setError] = useState<string | null>(null);
  
  // Use ref para evitar re-renderizações excessivas
  const updateThrottleRef = useRef<number>(0);
  
  // Callback otimizado com throttling
  const updateResult = useCallback((phase: 'ping' | 'download' | 'upload', value: any) => {
    const now = Date.now();
    // Throttle: atualiza no máximo a cada 500ms
    if (now - updateThrottleRef.current < 500 && phase !== 'ping') {
      return;
    }
    updateThrottleRef.current = now;
    
    setCurrentPhase(phase);
    switch (phase) {
      case 'ping':
        setResults(prev => ({ ...prev, ping: value.toString() }));
        break;
      case 'download':
        setResults(prev => ({ ...prev, download: value.toFixed(1) }));
        break;
      case 'upload':
        setResults(prev => ({ ...prev, upload: value.toFixed(1) }));
        break;
    }
  }, []);

  useEffect(() => {
    loadServers();
  }, []);

  // Lazy ping measurement após carregar servidores
  useEffect(() => {
    if (servers.length > 0) {
      servers.forEach((server, idx) => {
        if (server.ping === undefined) {
          measureLatency(server.url, true).then((ping: number) => {
            setServers(prevServers => {
              const updated = [...prevServers];
              updated[idx] = { ...updated[idx], ping };
              return updated;
            });
            setSelectedServer((prev: typeof server | null) => prev && prev.url === server.url ? { ...prev, ping } : prev);
          });
        }
      });
    }
  }, [servers]);

  const loadServers = async () => {
    setLoading(true);
    setError(null);
    try {
      const availableServers = await getSpeedTestServers(true); // lazy: initial=true
      setServers(availableServers);
      setSelectedServer(availableServers[0]);
    } catch (err) {
      setError(tr("m72f14b9704"));
    } finally {
      setLoading(false);
    }
  };

  const startTest = async () => {
    if (!selectedServer) {
      setError(tr("m2c6d1e456a"));
      return;
    }

    setTesting(true);
    setError(null);
    updateThrottleRef.current = 0; // Reset throttle
    
    try {
      await runSpeedTest(selectedServer, updateResult);
    } catch (err) {
      setError(tr("ma6b0689ec7"));
    } finally {
      setTesting(false);
      setCurrentPhase(null);
    }
  };

  const getPhaseLabel = () => {
    switch (currentPhase) {
      case 'ping':
        return tr("m8acb829323");
      case 'download':
        return tr("m49af968202");
      case 'upload':
        return tr("m7a8e3accc4");
      default:
        return tr("m6def21ec72");
    }
  };

  return (
    <Modal onClose={onClose} title={tr("md23ced7772")} icon={Download}>
      <div className="flex-1 p-4">
        <div className="grid gap-4">
          {/* Server Selection */}
          <div className="relative">
            <button
              onClick={() => setShowServers(!showServers)}
              disabled={loading || testing}
              className="w-full p-4 rounded-xl text-start transition-colors flex items-center justify-between touch-manipulation disabled:opacity-50"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-3">
                <Server className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                <div>
                  <span className="block text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                    {loading ? tr("me5f91f0a19") : selectedServer?.location.city || tr("m5e57dbaf6d")}
                  </span>
                  {selectedServer && (
                    <span className="block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                      {tr("m3175cc0386") + " "}{selectedServer?.ping === undefined ? 'Medindo...' : `${selectedServer.ping}ms`}
                    </span>
                  )}
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 transition-transform ${showServers ? 'rotate-180' : ''}`} style={{ color: 'var(--accent)' }} />
            </button>

            {/* Server List */}
            {showServers && (
              <div className="absolute inset-x-0 top-full mt-2 p-2 rounded-xl border z-20 max-h-48 overflow-y-auto shadow-xl custom-scrollbar" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                {servers.map((server, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedServer(server);
                      setShowServers(false);
                    }}
                    className="w-full p-3 rounded-lg hover:bg-[var(--accent-dim)] transition-colors text-start flex items-center justify-between touch-manipulation"
                  >
                    <div>
                      <span className="block text-sm font-semibold" style={{ color: 'var(--text)' }}>
                        {server.location.city}
                      </span>
                      <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>
                        {server.location.country}
                      </span>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                      {server.ping === undefined ? (
                        <span className="inline-flex items-center gap-1">
                          <svg className="animate-spin w-3 h-3 mr-1 text-[var(--accent)]" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                          {tr("mb0c7e849e4")}</span>
                      ) : `${server.ping}ms`}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Speed Test Display */}
          <div className="p-6 rounded-xl text-center space-y-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="w-48 h-48 mx-auto relative">
              <div className="absolute inset-0 rounded-full border-4 opacity-20" style={{ borderColor: 'var(--accent)' }} />
              <div 
                className="absolute inset-0 rounded-full border-4 transition-all duration-500"
                style={{
                  animation: testing ? 'spin 2s linear infinite' : 'none',
                  borderColor: 'var(--accent)',
                  borderTopColor: testing ? 'transparent' : 'var(--accent)'
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="block text-3xl font-bold font-mono" style={{ color: 'var(--text)' }}>
                    {currentPhase === 'ping' ? results.ping : results.download}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                    {currentPhase === 'ping' ? 'ms' : 'Mbps'}
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30">
                <p className="text-rose-400 text-sm font-medium">{localizeMessage(error || "")}</p>
              </div>
            )}

            <button
              onClick={startTest}
              disabled={testing || loading || !selectedServer}
              className="w-full min-h-[48px] flex items-center justify-center gap-2 text-white font-bold py-2 px-6 rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:scale-[0.99]"
              style={{ background: 'var(--accent)' }}
            >
              {testing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  {getPhaseLabel()}
                </>
              ) : (
                tr("m6def21ec72")
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-1">
                <Upload className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{tr("m865e89de78")}</span>
              </div>
              <span className="text-xl font-bold font-mono" style={{ color: 'var(--text)' }}>{results.upload} Mbps</span>
            </div>

            <div className="p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-1">
                <RefreshCw className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{tr("m6a4c3a4483")}</span>
              </div>
              <span className="text-xl font-bold font-mono" style={{ color: 'var(--text)' }}>{results.ping} ms</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}