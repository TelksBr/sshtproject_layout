import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ServerSelector } from './components/ServerSelector';
import { ConnectionForm } from './components/ConnectionForm';
import { NetworkStats } from './components/NetworkStats';
import { Sidebar } from './components/Sidebar';
import { BuyLogin } from './components/modals/BuyLogin';
import { Tutorials } from './components/modals/Tutorials';
import { Support } from './components/modals/Support';
import { SpeedTest } from './components/modals/SpeedTest';
import { Terms } from './components/modals/Terms';
import { Privacy } from './components/modals/Privacy';
import { CheckUser } from './components/modals/CheckUser';
import { CleanDataConfirm } from './components/modals/CleanDataConfirm';
import { AuthError } from './components/modals/AuthError';
import { Hotspot } from './components/modals/Hotspot';
import { ServicesModal } from './components/modals/ServicesModal';
import { IpFinder } from './components/modals/IpFinder';
import { Faq } from './components/modals/Faq';
import { getConfigVersion, getStatusbarHeight, getNavbarHeight, getConnectionState } from './utils/appFunctions';
import { getStorageItem } from './utils/storageUtils';
import { appLogo } from './constants/appLogo';
import { onDtunnelEvent, DtVpnStateEvent } from './utils/dtEvents';
import { ActiveConfigProvider } from './context/ActiveConfigContext';

export type ModalType = 'buy' | 'tutorials' | 'support' | 'speedtest' | 'terms' | 'privacy' | 'checkuser' | 'cleandata' | 'autherror' | 'hotspot' | 'services' | 'ipfinder' | 'faq' | null;

const modalComponents = {
  buy: BuyLogin,
  tutorials: Tutorials,
  support: Support,
  speedtest: SpeedTest,
  terms: Terms,
  privacy: Privacy,
  checkuser: CheckUser,
  cleandata: CleanDataConfirm,
  autherror: AuthError,
  hotspot: Hotspot,
  services: ServicesModal,
  ipfinder: IpFinder,
  faq: Faq,
};

function App() {
  const [showMenu, setShowMenu] = useState(false);
  const [currentModal, setCurrentModal] = useState<ModalType>(null);
  const version = getConfigVersion() || '1.0';
  const [containerStyle, setContainerStyle] = useState({});

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
    const statusBarHeight = getStatusbarHeight();
    const navBarHeight = getNavbarHeight();
    
    setContainerStyle({
      padding: `${statusBarHeight + 8}px 8px ${navBarHeight + 8}px 8px`
    });
  }, []);

  // Monitor de erro de autenticação via evento global e checagem inicial
  useEffect(() => {
    // Verificação inicial ao montar
    const state = getConnectionState();
    if (state === 'AUTH_FAILED') {
      setCurrentModal('autherror');
    }
    // Handler para evento global
    const handleVpnState = (payload: DtVpnStateEvent) => {
      if (payload && payload.state === 'AUTH_FAILED') {
        setCurrentModal('autherror');
      }
    };
    onDtunnelEvent<DtVpnStateEvent>('DtVpnStateEvent', handleVpnState);
    return () => {
      onDtunnelEvent('DtVpnStateEvent', () => {});
    };
  }, []);

  const renderModal = () => {
    if (!currentModal) return null;
    const ModalComponent = modalComponents[currentModal];
    if (!ModalComponent) return null;
    if (currentModal === 'terms') {
      return <Terms onClose={() => setCurrentModal(null)} onAccept={() => setCurrentModal('privacy')} />;
    }
    if (currentModal === 'privacy') {
      return <Privacy onClose={() => setCurrentModal(null)} onAccept={() => setCurrentModal(null)} />;
    }
    // Cast para evitar erro de tipagem caso algum modal exija props extras
    return <ModalComponent onClose={() => setCurrentModal(null)} />;
  };

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

        {/* Modals */}
        {renderModal()}
      </main>
    </ActiveConfigProvider>
  );
}

export default App;