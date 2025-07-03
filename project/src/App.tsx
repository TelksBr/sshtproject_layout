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
import { EventNotificationPopup } from './components/EventNotificationPopup';
import { onDtunnelEvent, DtunnelEvent } from './utils/dtEvents';
import { VpnState } from './types/vpn';

export type ModalType = 'buy' | 'tutorials' | 'support' | 'speedtest' | 'terms' | 'privacy' | 'checkuser' | 'cleandata' | 'hotspot' | 'services' | 'ipfinder' | 'faq' | null;

function App() {
  const [showMenu, setShowMenu] = useState(false);
  const [currentModal, setCurrentModal] = useState<ModalType>(null);
  const [notification, setNotification] = useState<{ event: string; visible: boolean }>({ event: '', visible: false });
  
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
      // Também dispara a notificação
      setNotification({ event: 'DtVpnStateEvent', visible: true });
    };

    const handleVpnStarted = () => {
      setVpnState('CONNECTED');
      setNotification({ event: 'DtVpnStartedSuccessEvent', visible: true });
    };

    const handleVpnStopped = () => {
      setVpnState('DISCONNECTED');
      setNotification({ event: 'DtVpnStoppedSuccessEvent', visible: true });
    };

    // Handler para mudanças de estado do hotspot removido - não há evento nativo
    
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

  useEffect(() => {
    // Listener genérico apenas para eventos NÃO-VPN (VPN já é tratado acima)
    const relevantEvents: DtunnelEvent[] = [
      'DtCheckUserStartedEvent',
      'DtCheckUserModelEvent', 
      'DtMessageErrorEvent',
      'DtNewLogEvent',
      'DtErrorToastEvent',
      'DtSuccessToastEvent',
      'DtConfigSelectedEvent',
      // Removido DtNewDefaultConfigEvent - será tratado pelo ConnectionForm
      // Removidos os eventos VPN que já são tratados no useEffect anterior
    ];
    const handlers: Array<() => void> = [];
    relevantEvents.forEach(eventName => {
      const handler = () => {
        setNotification({ event: eventName, visible: true });
      };
      onDtunnelEvent(eventName, handler as any);
      handlers.push(() => onDtunnelEvent(eventName, () => {}));
    });
    return () => {
      handlers.forEach(unregister => unregister());
    };
  }, []);

  return (
    <ActiveConfigProvider>
      <main className="w-full h-screen flex flex-col bg-gradient-to-br from-[#1A0628] via-[#2A0A3E] to-[#1A0628] relative">
        <Sidebar 
          isOpen={showMenu}
          onClose={() => setShowMenu(false)}
          onNavigate={(modal: ModalType) => {
            setCurrentModal(modal);
            setShowMenu(false);
          }}
        />

        <section 
          className="w-full h-full flex flex-col overflow-hidden" 
          id="container-home"
          style={containerStyle}
        >
          {/* Header recebe props conforme padrão documentado */}
          <Header 
            onMenuClick={() => setShowMenu(true)}
            version={version}
            localIP={localIP}
            vpnState={vpnState}
          />

          <section className="flex justify-center mt-3">
            <img 
              className="w-30 h-30 sm:w-28 sm:h-28 object-contain" 
              id="app-logo" 
              src={appLogo}
              alt="SSH T PROJECT"
            />
          </section>

          <div className="flex-1 flex flex-col gap-1.5 mt-2">
            <ServerSelector />
            <ConnectionForm vpnState={vpnState} />
          </div>
          <NetworkStats />
        </section>

        {getModal(currentModal, setCurrentModal)}

        <EventNotificationPopup
          eventName={notification.event}
          visible={notification.visible}
          onClose={() => setNotification(n => ({ ...n, visible: false }))}
        />
      </main>
    </ActiveConfigProvider>
  );
}

export default App;