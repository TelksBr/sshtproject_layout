import React, { useState, useEffect } from 'react';
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

export type ModalType = 'buy' | 'tutorials' | 'support' | 'speedtest' | 'terms' | 'privacy' | 'checkuser' | 'cleandata' | 'autherror' | 'hotspot' | 'services' | 'ipfinder' | 'faq' | null;

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

  // Monitor connection state for auth errors
  useEffect(() => {
    const checkAuthStatus = () => {
      const state = getConnectionState();
      if (state === 'LBL_STATE_AUTH_FAILED') {
        setCurrentModal('autherror');
      }
    };

    const interval = setInterval(checkAuthStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
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
            className="w-28 h-28 sm:w-32 sm:h-32 object-contain hover-glow" 
            id="app-logo" 
            src={appLogo}
            alt="SSH T PROJECT"
          />
        </section>

        <div className="flex-1 flex flex-col gap-1.5 mt-2">
          <ServerSelector />
          <ConnectionForm />
          <NetworkStats />
        </div>
      </section>

      {/* Modals */}
      {currentModal === 'buy' && (
        <BuyLogin onClose={() => setCurrentModal(null)} />
      )}
      {currentModal === 'tutorials' && (
        <Tutorials onClose={() => setCurrentModal(null)} />
      )}
      {currentModal === 'support' && (
        <Support onClose={() => setCurrentModal(null)} />
      )}
      {currentModal === 'speedtest' && (
        <SpeedTest onClose={() => setCurrentModal(null)} />
      )}
      {currentModal === 'terms' && (
        <Terms 
          onClose={() => setCurrentModal(null)}
          onAccept={() => setCurrentModal('privacy')}
        />
      )}
      {currentModal === 'privacy' && (
        <Privacy 
          onClose={() => setCurrentModal(null)}
          onAccept={() => setCurrentModal(null)}
        />
      )}
      {currentModal === 'checkuser' && (
        <CheckUser onClose={() => setCurrentModal(null)} />
      )}
      {currentModal === 'cleandata' && (
        <CleanDataConfirm onClose={() => setCurrentModal(null)} />
      )}
      {currentModal === 'autherror' && (
        <AuthError onClose={() => setCurrentModal(null)} />
      )}
      {currentModal === 'hotspot' && (
        <Hotspot onClose={() => setCurrentModal(null)} />
      )}
      {currentModal === 'services' && (
        <ServicesModal onClose={() => setCurrentModal(null)} />
      )}
      {currentModal === 'ipfinder' && (
        <IpFinder onClose={() => setCurrentModal(null)} />
      )}
      {currentModal === 'faq' && (
        <Faq onClose={() => setCurrentModal(null)} />
      )}
    </main>
  );
}

export default App;