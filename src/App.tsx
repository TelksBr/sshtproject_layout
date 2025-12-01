import { useState, useEffect, useCallback, useMemo } from 'react';
import Header from './components/Header';
import ServerSelector from './components/ServerSelector';
import ConnectionForm from './components/ConnectionForm';
import NetworkStats from './components/NetworkStats';
import { Sidebar } from './components/Sidebar';
import { AnimatedLogo } from './components/AnimatedLogo';
import { getConfigVersion } from './utils/appFunctions';
import { getStorageItem } from './utils/storageUtils';
import { getAppLogo, setAppLogo } from './utils/storageUtils';
import { ActiveConfigProvider } from './context/ActiveConfigContext';
import { useAppLayout } from './hooks/useAppLayout';
import { useModalRenderer } from './hooks/useModalRenderer';
import { useGlobalPolling } from './hooks/useGlobalPolling';

export type ModalType = 'buy' | 'recovery' | 'tutorials' | 'support' | 'speedtest' | 'terms' | 'privacy' | 'checkuser' | 'cleandata' | 'hotspot' | 'services' | 'ipfinder' | 'faq' | 'testgenerate' | 'renewal' | null;

function App() {
  const [showMenu, setShowMenu] = useState(false);
  const [currentModal, setCurrentModal] = useState<ModalType>(null);
  
  // 🚀 OTIMIZAÇÃO: Hook global que substitui todos os pollings
  const { vpnState, localIP } = useGlobalPolling();
  
  // Memoizar valores que não mudam frequentemente
  const version = useMemo(() => getConfigVersion() || '1.0', []);
  const { containerStyle } = useAppLayout();
  const { getModal } = useModalRenderer();

  // Estado para logo dinâmica
  const [logo, setLogo] = useState<string | null>(null);

  // Callbacks memoizados para evitar re-renders desnecessários
  const handleMenuClick = useCallback(() => setShowMenu(true), []);
  const handleMenuClose = useCallback(() => setShowMenu(false), []);
  const handleNavigate = useCallback((modal: ModalType) => {
    setCurrentModal(modal);
    setShowMenu(false);
  }, []);

  // Logo dinâmica: carregamento otimizado
  useEffect(() => {
    const tryLoadLogo = async () => {
      let storedLogo = getAppLogo();
      if (storedLogo) {
        setLogo(storedLogo);
      } else {
        try {
          const res = await fetch('https://pastebin.com/raw/JSzP76tH');
          if (res.ok) {
            const base64 = await res.text();
            setAppLogo(base64);
            setLogo(base64);
          }
        } catch {}
      }
    };
    tryLoadLogo();
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
      <main className="w-full min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-[#1A0628] via-[#2A0A3E] to-[#1A0628] relative">
        <Sidebar 
          isOpen={showMenu}
          onClose={handleMenuClose}
          onNavigate={handleNavigate}
        />

        <section 
          className="flex-1 w-full h-full flex flex-col overflow-y-auto md:overflow-visible md:max-w-5xl md:mx-auto md:px-6 md:py-4 lg:max-w-none lg:mx-0 lg:px-4 lg:py-3 lg:flex-row lg:gap-6 lg:items-start" 
          id="container-home"
          style={containerStyle}
        >
          {/* Layout principal - flexível para tablet portrait/landscape */}
          <div className="flex-1 flex flex-col lg:max-w-3xl lg:min-w-0">
            <Header 
              onMenuClick={handleMenuClick}
              version={version}
              localIP={localIP}
              vpnState={vpnState}
            />

            <section className="flex justify-center mt-3 md:mt-6 lg:mt-4">
              {logo && <AnimatedLogo logo={logo} />}
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