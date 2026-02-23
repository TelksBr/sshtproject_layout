import { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import Header from './components/Header';
import ServerSelector from './components/ServerSelector';
import ConnectionForm from './components/ConnectionForm';
import { Sidebar } from './components/Sidebar';
import { AnimatedLogo } from './components/AnimatedLogo';
import { ToastContainer } from './components/Toast';
import { ToastProvider } from './hooks/useToast';
import { useSdkToastListener } from './hooks/useSdkToastListener';
import { getConfigVersion } from './utils/appFunctions';
import { getStorageItem } from './utils/storageUtils';
import { getAppLogo, setAppLogo } from './utils/storageUtils';
import { ActiveConfigProvider } from './context/ActiveConfigContext';
import { useAppLayout } from './hooks/useAppLayout';
import { useModalRenderer } from './hooks/useModalRenderer';
import { useGlobalPolling } from './hooks/useGlobalPolling';
import { useBackgroundMonitor } from './hooks/useBackgroundMonitor';
import { usePurchaseNotifications } from './hooks/usePurchaseNotifications';
import PaymentApprovedNotification from './components/modals/PaymentApprovedNotification';

export type ModalType = 'buy' | 'recovery' | 'tutorials' | 'support' | 'speedtest' | 'terms' | 'privacy' | 'checkuser' | 'cleandata' | 'hotspot' | 'services' | 'ipfinder' | 'faq' | 'testgenerate' | 'renewal' | 'credentials' | null;

function App() {
  const [showMenu, setShowMenu] = useState(false);
  const [currentModal, setCurrentModal] = useState<ModalType>(null);
  
  // 🚀 OTIMIZAÇÃO: Hook global que substitui todos os pollings
  const { vpnState, localIP } = useGlobalPolling();
  
  // 🔔 NOTIFICAÇÕES: Hook para notificações de pagamento
  const { notifications, dismissNotification } = usePurchaseNotifications();
  
  // 💾 MONITOR: Hook para monitorar compras pendentes em background
  useBackgroundMonitor({
    onPurchaseCompleted: (purchase, credentials) => {
      // Opcional: Abrir modal de credenciais automaticamente
      // setCurrentModal('credentials');
    }
  });

  // 📢 EVENTOS SDK: Hook que escuta eventos de toast nativos do SDK
  useSdkToastListener();
  
  // Memoizar valores que não mudam frequentemente
  const version = useMemo(() => getConfigVersion() || '1.0', []);
  const { containerStyle } = useAppLayout();
  const containerStyleMemo = useMemo(() => containerStyle, [containerStyle]);
  const { getModal } = useModalRenderer();

  // Estado para logo dinâmica
  const [logo, setLogo] = useState<string | null>(null);

  // Cooldown para evitar reabertura acidental ao fechar no WebView (clique no X)
  const menuCloseTimeRef = useRef(0);
  const MENU_CLOSE_COOLDOWN_MS = 500;

  const handleMenuClick = useCallback(() => {
    if (Date.now() - menuCloseTimeRef.current < MENU_CLOSE_COOLDOWN_MS) return;
    setShowMenu(true);
  }, []);

  const handleMenuClose = useCallback(() => {
    menuCloseTimeRef.current = Date.now();
    setShowMenu(false);
  }, []);
  const handleNavigate = useCallback((modal: ModalType) => {
    setCurrentModal(modal);
    setShowMenu(false);
  }, []);

  // Logo dinâmica: carregamento otimizado com verificação de atualização
  useEffect(() => {
    let cancelled = false;

    const syncLogo = async () => {
      // 1) Carrega logo armazenado para não atrasar o render inicial
      const storedLogo = getAppLogo();
      if (storedLogo && !cancelled) {
        setLogo(storedLogo);
      }

      // 2) Busca a versão mais recente online e compara
      try {
        const res = await fetch(
          'https://raw.githubusercontent.com/TelksBr/logo-base64/refs/heads/main/sshtproject/app_logo'
        );
        if (!res.ok) return;

        const remoteBase64 = (await res.text()).trim();
        if (!remoteBase64) return;

        const currentStored = getAppLogo();

        // Se não há nada salvo, ou se mudou, atualiza storage e estado
        if (!currentStored || currentStored !== remoteBase64) {
          setAppLogo(remoteBase64);
          if (!cancelled) {
            setLogo(remoteBase64);
          }
        } else if (!storedLogo && !cancelled) {
          // Caso não tivesse nada em memória mas o storage já tenha algo válido
          setLogo(currentStored);
        }
      } catch {
        // Em caso de erro de rede, mantemos o que já temos (offline-safe)
      }
    };

    syncLogo();

    return () => {
      cancelled = true;
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
      <main className="w-full h-screen flex flex-col md:flex-row bg-gradient-to-br from-[#1A0628] via-[#2A0A3E] to-[#1A0628] relative overflow-hidden">
        <Sidebar 
          isOpen={showMenu}
          onClose={handleMenuClose}
          onNavigate={handleNavigate}
        />

        <section 
          className="flex-1 w-full h-full flex overflow-y-auto overflow-x-hidden p-4 md:p-6" 
          id="container-home"
          style={containerStyleMemo}
        >
          {/* Container centralizado para desktop */}
          <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row lg:gap-6">
            
            {/* Coluna principal - Conteúdo */}
            <div className="flex-1 flex flex-col gap-4 lg:max-w-3xl">
              <Header 
                onMenuClick={handleMenuClick}
                version={version}
                localIP={localIP}
                vpnState={vpnState}
              />

              {logo && <AnimatedLogo logo={logo} />}

              <ServerSelector />
              <ConnectionForm vpnState={vpnState} />
            </div>
          </div>
        </section>

        {getModal(currentModal, setCurrentModal)}
        <ToastContainer />
        
        {/* Notificações de pagamento aprovado */}
        <div className="fixed top-0 right-0 left-0 pointer-events-none z-[999]">
          {notifications.map((notification) => (
            <div key={notification.order_id} className="pointer-events-auto">
              <PaymentApprovedNotification
                amount={notification.amount}
                planName={notification.plan_name}
                orderId={notification.order_id}
                onDismiss={dismissNotification}
                autoClose={5000}
              />
            </div>
          ))}
        </div>
      </main>
    </ActiveConfigProvider>
  );
}

export default App;