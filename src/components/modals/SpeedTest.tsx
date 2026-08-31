import { useState, useEffect, useCallback, useRef } from 'react';
import { Download, Upload, RefreshCw, Server, ChevronDown } from '../../utils/icons';
import { Modal } from './Modal';
import { getSpeedTestServers, runSpeedTest, measureLatency } from '../../utils/speedTestUtils';

interface SpeedTestProps {
  onClose: () => void;
}

export function SpeedTest({ onClose }: SpeedTestProps) {
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
      setError('Falha ao carregar servidores de teste');
    } finally {
      setLoading(false);
    }
  };

  const startTest = async () => {
    if (!selectedServer) {
      setError('Selecione um servidor para iniciar o teste');
      return;
    }

    setTesting(true);
    setError(null);
    updateThrottleRef.current = 0; // Reset throttle
    
    try {
      await runSpeedTest(selectedServer, updateResult);
    } catch (err) {
      setError('Falha ao realizar o teste de velocidade. Por favor, tente novamente.');
    } finally {
      setTesting(false);
      setCurrentPhase(null);
    }
  };

  const getPhaseLabel = () => {
    switch (currentPhase) {
      case 'ping':
        return 'Medindo latência...';
      case 'download':
        return 'Testando download...';
      case 'upload':
        return 'Testando upload...';
      default:
        return 'Iniciar Teste';
    }
  };

  return (
    <Modal onClose={onClose} title="Speed Test" icon={Download}>
      <div className="flex-1 p-4">
        <div className="grid gap-4">
          {/* Server Selection */}
          <div className="relative">
            <button
              onClick={() => setShowServers(!showServers)}
              disabled={loading || testing}
              className="w-full p-4 rounded-xl text-left transition-colors flex items-center justify-between touch-manipulation disabled:opacity-50"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-3">
                <Server className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                <div>
                  <span className="block text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                    {loading ? 'Carregando servidores...' : selectedServer?.location.city || 'Selecione um servidor'}
                  </span>
                  {selectedServer && (
                    <span className="block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                      Ping: {selectedServer?.ping === undefined ? 'Medindo...' : `${selectedServer.ping}ms`}
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
                    className="w-full p-3 rounded-lg hover:bg-[var(--accent-dim)] transition-colors text-left flex items-center justify-between touch-manipulation"
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
                          Medindo...
                        </span>
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
                <p className="text-rose-400 text-sm font-medium">{error}</p>
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
                'Iniciar Teste'
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-1">
                <Upload className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Upload</span>
              </div>
              <span className="text-xl font-bold font-mono" style={{ color: 'var(--text)' }}>{results.upload} Mbps</span>
            </div>

            <div className="p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-1">
                <RefreshCw className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Ping</span>
              </div>
              <span className="text-xl font-bold font-mono" style={{ color: 'var(--text)' }}>{results.ping} ms</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}