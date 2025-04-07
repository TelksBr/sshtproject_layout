import React, { useState, useEffect } from 'react';
import { Download, Upload, RefreshCw, Server, ChevronDown } from 'lucide-react';
import { Modal } from './Modal';
import { getSpeedTestServers, runSpeedTest, TestServer } from '../../utils/speedTestUtils';

interface SpeedTestProps {
  onClose: () => void;
}

export function SpeedTest({ onClose }: SpeedTestProps) {
  const [testing, setTesting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showServers, setShowServers] = useState(false);
  const [servers, setServers] = useState<TestServer[]>([]);
  const [selectedServer, setSelectedServer] = useState<TestServer | null>(null);
  const [currentPhase, setCurrentPhase] = useState<'ping' | 'download' | 'upload' | null>(null);
  const [results, setResults] = useState({
    download: '0',
    upload: '0',
    ping: '0'
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    setLoading(true);
    setError(null);
    try {
      const availableServers = await getSpeedTestServers();
      setServers(availableServers);
      setSelectedServer(availableServers[0]); // Select best server by default
    } catch (err) {
      setError('Falha ao carregar servidores de teste');
      console.error('Error loading servers:', err);
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
    
    try {
      await runSpeedTest(selectedServer, (phase, value) => {
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
      });
    } catch (err) {
      setError('Falha ao realizar o teste de velocidade. Por favor, tente novamente.');
      console.error('Speed test error:', err);
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
    <Modal onClose={onClose}>
      <div className="flex-1 p-4">
        <header className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-[#26074d] flex items-center justify-center">
            <Download className="w-6 h-6 text-[#b0a8ff]" />
          </div>
          <h1 className="text-xl font-medium text-[#b0a8ff]">Speed Test</h1>
        </header>

        <div className="grid gap-4">
          {/* Server Selection */}
          <div className="relative">
            <button
              onClick={() => setShowServers(!showServers)}
              disabled={loading || testing}
              className="w-full p-4 rounded-lg bg-[#26074d]/30 border border-[#6205D5]/20 backdrop-blur-sm text-left hover:bg-[#26074d]/40 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Server className="w-5 h-5 text-[#6205D5]" />
                <div>
                  <span className="block text-sm font-medium text-[#b0a8ff]">
                    {loading ? 'Carregando servidores...' : selectedServer?.location.city || 'Selecione um servidor'}
                  </span>
                  {selectedServer && (
                    <span className="block text-xs text-[#b0a8ff]/70">
                      Ping: {selectedServer.ping}ms
                    </span>
                  )}
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-[#6205D5] transition-transform ${showServers ? 'rotate-180' : ''}`} />
            </button>

            {/* Server List */}
            {showServers && (
              <div className="absolute inset-x-0 top-full mt-2 p-2 rounded-lg bg-[#26074d]/95 border border-[#6205D5]/20 backdrop-blur-lg z-10 max-h-48 overflow-y-auto">
                {servers.map((server, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedServer(server);
                      setShowServers(false);
                    }}
                    className="w-full p-3 rounded-lg hover:bg-[#6205D5]/10 transition-colors text-left flex items-center justify-between"
                  >
                    <div>
                      <span className="block text-sm font-medium text-[#b0a8ff]">
                        {server.location.city}
                      </span>
                      <span className="block text-xs text-[#b0a8ff]/70">
                        {server.location.country}
                      </span>
                    </div>
                    <span className="text-sm text-[#6205D5]">
                      {server.ping}ms
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Speed Test Display */}
          <div className="p-6 rounded-lg bg-[#26074d]/30 border border-[#6205D5]/20 backdrop-blur-sm text-center">
            <div className="w-48 h-48 mx-auto relative mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-[#6205D5]/20" />
              <div 
                className="absolute inset-0 rounded-full border-4 border-[#6205D5] transition-all duration-500"
                style={{
                  animation: testing ? 'spin 1s linear infinite' : 'none',
                  borderTopColor: testing ? 'transparent' : '#6205D5'
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="block text-3xl font-bold text-[#b0a8ff]">
                    {currentPhase === 'ping' ? results.ping : results.download}
                  </span>
                  <span className="text-sm text-[#b0a8ff]/70">
                    {currentPhase === 'ping' ? 'ms' : 'Mbps'}
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={startTest}
              disabled={testing || loading || !selectedServer}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-lg bg-[#6205D5] text-[#b0a8ff] font-medium hover:bg-[#6205D5]/90 transition-colors disabled:opacity-50"
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

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-[#26074d]/30 border border-[#6205D5]/20 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <Upload className="w-4 h-4 text-[#6205D5]" />
                <span className="text-[#b0a8ff] text-sm">Upload</span>
              </div>
              <span className="text-xl font-bold text-[#b0a8ff]">{results.upload} Mbps</span>
            </div>

            <div className="p-4 rounded-lg bg-[#26074d]/30 border border-[#6205D5]/20 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="w-4 h-4 text-[#6205D5]" />
                <span className="text-[#b0a8ff] text-sm">Ping</span>
              </div>
              <span className="text-xl font-bold text-[#b0a8ff]">{results.ping} ms</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}