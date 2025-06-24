import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ServerSelector } from './components/ServerSelector';
import { ConnectionForm } from './components/ConnectionForm';
import { NetworkStats } from './components/NetworkStats';
import { Sidebar } from './components/Sidebar';
import { getConfigVersion } from './utils/appFunctions';
import { getStorageItem } from './utils/storageUtils';
import { appLogo } from './constants/appLogo';
import { ActiveConfigProvider } from './context/ActiveConfigContext';
import { useAppPolling } from './hooks/useAppPolling';
import { useVpnEvents } from './hooks/useVpnEvents';
import { useAppLayout } from './hooks/useAppLayout';
import { useModalRenderer } from './hooks/useModalRenderer';
import { EventNotificationPopup } from './components/EventNotificationPopup';
import { onDtunnelEvent, DtunnelEvent } from './utils/dtEvents';

export type ModalType = 'buy' | 'tutorials' | 'support' | 'speedtest' | 'terms' | 'privacy' | 'checkuser' | 'cleandata' | 'hotspot' | 'services' | 'ipfinder' | 'faq' | null;

function App() {
  const [showMenu, setShowMenu] = useState(false);
  const [currentModal, setCurrentModal] = useState<ModalType>(null);
  const [notification, setNotification] = useState<{ event: string; visible: boolean }>({ event: '', visible: false });
  const version = getConfigVersion() || '1.0';
  const { containerStyle } = useAppLayout();
  const { localIP } = useAppPolling();
  const { vpnState } = useVpnEvents();
  const { getModal } = useModalRenderer();

  useEffect(() => {
    const termsAccepted = getStorageItem<boolean>('terms-accepted-23-03-2025');
    const privacyAccepted = getStorageItem<boolean>('privacy-accepted-23-03-2025');
    
    if (!termsAccepted) {
      setCurrentModal('terms');
    } else if (!privacyAccepted) {
      setCurrentModal('privacy');
    }
  }, []);

  // Usa o hook de eventos VPN para disparar popup
  useVpnEvents((eventName) => {
    setNotification({ event: eventName, visible: true });
  });

  useEffect(() => {
    // Listener genérico para eventos globais NÃO-VPN
    const relevantEvents: DtunnelEvent[] = [
      'DtCheckUserStartedEvent',
      'DtCheckUserModelEvent',
      'DtNewDefaultConfigEvent',
      'DtMessageErrorEvent',
      'DtNewLogEvent',
      'DtErrorToastEvent',
      'DtSuccessToastEvent',
      'DtConfigSelectedEvent',
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
            <ConnectionForm />
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