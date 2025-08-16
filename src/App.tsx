import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ServerSelector } from './components/ServerSelector';
import { ConnectionForm } from './components/ConnectionForm';
import { NetworkStats } from './components/NetworkStats';
import { Sidebar } from './components/Sidebar';
import { getConfigVersion, getLocalIP, getConnectionState, getStorageItem } from './utils';
import { appLogo, APP_CONFIG } from './constants';
import { ActiveConfigProvider } from './context/ActiveConfigContext';
import { useAppLayout, useModalRenderer } from './hooks';
import { onDtunnelEvent } from './utils';
import { VpnState } from './types';

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
    const ipInterval = setInterval(updateLocalIP, APP_CONFIG.POLLING_INTERVALS.IP_UPDATE);
    
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
    const termsAccepted = getStorageItem<boolean>(APP_CONFIG.STORAGE_KEYS.TERMS_ACCEPTED);
    const privacyAccepted = getStorageItem<boolean>(APP_CONFIG.STORAGE_KEYS.PRIVACY_ACCEPTED);
    
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
              <img 
                className="w-30 h-30 sm:w-28 sm:h-28 md:w-40 md:h-40 lg:w-28 lg:h-28 object-contain" 
                id="app-logo" 
                src={appLogo}
                alt="SSH T PROJECT"
              />
            </section>

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