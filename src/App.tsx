import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ServerSelector } from './components/ServerSelector';
import { ConnectionForm } from './components/ConnectionForm';
import { NetworkStats } from './components/NetworkStats';
import { Sidebar } from './components/Sidebar';
import { getConfigVersion, getLocalIP, getConnectionState } from './utils/appFunctions';
import { getStorageItem } from './utils/storageUtils';
import { appLogo } from './constants/appLogo';
import { ActiveConfigProvider } from './context/ActiveConfigContext';
import { useAppLayout } from './hooks/useAppLayout';
import { useModalRenderer } from './hooks/useModalRenderer';
import { onDtunnelEvent } from './utils/dtEvents';
import { VpnState } from './types/vpn';

export type ModalType = 'buy' | 'recovery' | 'tutorials' | 'support' | 'speedtest' | 'terms' | 'privacy' | 'checkuser' | 'cleandata' | 'hotspot' | 'services' | 'ipfinder' | 'faq' | 'testgenerate' | 'renewal' | null;

function App() {
  const [showMenu, setShowMenu] = useState(false);
  const [currentModal, setCurrentModal] = useState<ModalType>(null);
  
  // Estados gerenciados pelo App conforme padrão documentado
  const [vpnState, setVpnState] = useState<VpnState>('DISCONNECTED');
  const [localIP, setLocalIP] = useState<string>('127.0.0.1');
  
  const version = getConfigVersion() || '1.0';
  const { containerStyle } = useAppLayout();
  const { getModal } = useModalRenderer();

  // Inicialização dos estados conforme padrão documentado
  useEffect(() => {
    // Busca estados iniciais das funções nativas
    const initialVpnState = getConnectionState();
    const initialLocalIP = getLocalIP() || '127.0.0.1';
    
    if (initialVpnState) {
      setVpnState(initialVpnState);
    }
    setLocalIP(initialLocalIP);
    
    // Polling adicional para garantir sincronização inicial do estado VPN
    let attempts = 0;
    const maxAttempts = 5;
    const syncInterval = setInterval(() => {
      const currentState = getConnectionState();
      if (currentState) {
        setVpnState(prevState => {
          if (currentState !== prevState) {
            clearInterval(syncInterval);
            return currentState;
          }
          return prevState;
        });
      }
      attempts++;
      if (attempts >= maxAttempts) {
        clearInterval(syncInterval);
      }
    }, 1000);
    
    return () => clearInterval(syncInterval);
  }, []);

  // Polling para IP local conforme padrão documentado
  useEffect(() => {
    const updateLocalIP = () => {
      const currentIP = getLocalIP() || '127.0.0.1';
      setLocalIP(currentIP);
    };

    // Atualiza IP a cada 5 segundos conforme padrão documentado
    const ipInterval = setInterval(updateLocalIP, 5000);
    
    return () => clearInterval(ipInterval);
  }, []);

  // Gerenciamento de eventos VPN conforme padrão documentado
  useEffect(() => {
    // Handler para mudanças de estado da VPN
    const handleVpnStateEvent = (state: VpnState) => {
      setVpnState(state);
    };

    const handleVpnStarted = () => {
      setVpnState('CONNECTED');
    };

    const handleVpnStopped = () => {
      setVpnState('DISCONNECTED');
    };

    // Registra eventos VPN conforme padrão documentado
    onDtunnelEvent('DtVpnStateEvent', handleVpnStateEvent);
    onDtunnelEvent('DtVpnStartedSuccessEvent', handleVpnStarted);
    onDtunnelEvent('DtVpnStoppedSuccessEvent', handleVpnStopped);

    // Cleanup dos eventos
    return () => {
      onDtunnelEvent('DtVpnStateEvent', () => {});
      onDtunnelEvent('DtVpnStartedSuccessEvent', () => {});
      onDtunnelEvent('DtVpnStoppedSuccessEvent', () => {});
    };
  }, []);

  useEffect(() => {
    const termsAccepted = getStorageItem<boolean>('terms-accepted-23-03-2025');
    const privacyAccepted = getStorageItem<boolean>('privacy-accepted-23-03-2025');
    
    if (!termsAccepted) {
      setCurrentModal('terms');
    } else if (!privacyAccepted) {
      setCurrentModal('privacy');
    }
  }, []);

  return (
    <ActiveConfigProvider>
      <main className="w-full h-screen flex flex-col md:flex-row bg-gradient-to-br from-[#1A0628] via-[#2A0A3E] to-[#1A0628] relative">
        <Sidebar 
          isOpen={showMenu}
          onClose={() => setShowMenu(false)}
          onNavigate={(modal: ModalType) => {
            setCurrentModal(modal);
            setShowMenu(false);
          }}
        />

        <section 
          className="flex-1 w-full h-full flex flex-col overflow-hidden md:max-w-5xl md:mx-auto md:px-6 md:py-4 lg:max-w-none lg:mx-0 lg:px-4 lg:py-3 lg:flex-row lg:gap-6 lg:items-start" 
          id="container-home"
          style={containerStyle}
        >
          {/* Layout principal - flexível para tablet portrait/landscape */}
          <div className="flex-1 flex flex-col lg:max-w-3xl lg:min-w-0">
            <Header 
              onMenuClick={() => setShowMenu(true)}
              version={version}
              localIP={localIP}
              vpnState={vpnState}
            />

            <section className="flex justify-center mt-3 md:mt-6 lg:mt-4">
              <div className="relative rounded-full overflow-visible group">
              <img
              className="w-28 h-28 md:w-40 md:h-40 lg:w-28 lg:h-28 object-contain animate-logo rounded-full group-hover:animate-logoPulse"
              id="app-logo"
              src={appLogo}
              alt="SSH T PROJECT"
              style={{
              filter:
                'drop-shadow(0 4px 16px rgba(80,0,120,0.18)) drop-shadow(0 1px 4px rgba(0,0,0,0.12))',
              }}
              />
              {/* Fade shadow overlays */}
              <div
              className="pointer-events-none absolute inset-0 rounded-full animate-shadowPulse"
              style={{
              boxShadow:
                '0 0 16px 6px rgba(80,0,120,0.12), 0 0 0 2px rgba(255,255,255,0.06) inset',
              borderRadius: '50%',
              }}
              />
              {/* Extra animated glow ring */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-full">
              <span className="animate-glowRing block w-full h-full rounded-full border-2 border-violet-400/30" />
              </div>
              {/* Pulse ring */}
              <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="pulse-ring" />
              </span>
              </div>
            </section>
            <style>
              {`
              @keyframes logoSimple {
                0% {
                  transform: scale(0.97) rotate(-6deg);
                  filter: drop-shadow(0 2px 8px rgba(120,0,180,0.13));
                }
                50% {
                  transform: scale(1.06) rotate(7deg);
                  filter: drop-shadow(0 0 24px #a78bfa88) brightness(1.13);
                }
                100% {
                  transform: scale(0.97) rotate(-6deg);
                  filter: drop-shadow(0 2px 8px rgba(120,0,180,0.13));
                }
              }
              .animate-logo {
                animation: logoSimple 3.2s cubic-bezier(0.45,0,0.2,1) infinite;
                will-change: opacity, transform, filter, box-shadow;
                border-radius: 50%;
                background: transparent;
                box-shadow:
                  0 0 8px 2px rgba(255, 255, 255, 0.10),
                  0 0 20px 5px rgba(180, 0, 220, 0.13),
                  0 4px 16px 0 rgba(0, 0, 0, 0.13);
                transition: filter 0.3s, box-shadow 0.3s, transform 0.3s;
              }
              .animate-logo:hover {
                filter: drop-shadow(0 0 0 rgba(255,255,255,0.5)) drop-shadow(0 0 16px #fff8) brightness(1.18) blur(0.5px);
                opacity: 1;
                transform: scale(1.12) rotate(8deg);
                box-shadow: 0 0 32px 12px rgba(180,0,220,0.13);
                transition: filter 0.3s, transform 0.3s, opacity 0.3s, box-shadow 0.3s;
              }
              @media (prefers-reduced-motion: reduce) {
                .animate-logo {
                  animation: none;
                }
              }
              `}
            </style>

          

            <div className="flex-1 flex flex-col gap-1.5 mt-2 md:max-w-2xl md:mx-auto md:gap-4 md:mt-6 lg:max-w-none lg:mx-0 lg:gap-3 lg:mt-4">
              <ServerSelector />
              <ConnectionForm vpnState={vpnState} />
            </div>
          </div>

          {/* NetworkStats - posicionamento adaptativo */}
          <div className="md:max-w-2xl md:mx-auto md:mb-4 lg:max-w-none lg:w-72 lg:mx-0 lg:flex-shrink-0 lg:mb-0">
            <NetworkStats />
          </div>
        </section>

        {getModal(currentModal, setCurrentModal)}
      </main>
    </ActiveConfigProvider>
  );
}

export default App;