import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Settings, Download,
  Wifi, Battery, Network, Book,
  RefreshCw, DollarSign, Share2, CalendarClock, BriefcaseBusiness, Search, Zap, Phone, Key, FileKey, Bell, X
} from '../../utils/icons';
import {
  checkForUpdates,
  openApnSettings,
  openNetworkSettings,
  checkBatteryOptimization,
} from '../../utils/appFunctions';
import { ModalType } from '../../App';
import { ServersModal } from '../modals/ServersModal';
import { ImportKeyModal } from '../modals/ImportKeyModal';
import { NotificationsModal } from '../modals/NotificationsModal';
import { useAutoConnectContext } from '../../context/AutoConnectContext';
import { useAppNotifications } from '../../context/AppNotificationsContext';
import { useAppLayout } from '../../hooks/useAppLayout';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (modal: ModalType) => void;
}

interface MenuCategory {
  title: string;
  items: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    highlight?: boolean;
    badge?: number;
  }[];
}

export function Sidebar({ isOpen, onClose, onNavigate }: SidebarProps) {
  const { insets } = useAppLayout();
  const [showServersModal, setShowServersModal] = useState(false);
  const [showImportKeyModal, setShowImportKeyModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const autoConnect = useAutoConnectContext();
  const { unreadCount, markAllRead } = useAppNotifications();
  const listRef = useRef<HTMLDivElement>(null);
  const asideRef = useRef<HTMLElement>(null);
  const [mobileSettledClosed, setMobileSettledClosed] = useState(!isOpen);

  const resetMenuScroll = useCallback(() => {
    if (listRef.current) listRef.current.scrollTop = 0;
    if (asideRef.current) asideRef.current.scrollTop = 0;
  }, []);

  const closeMenu = useCallback((event?: React.SyntheticEvent) => {
    event?.stopPropagation();
    resetMenuScroll();
    onClose();
  }, [onClose, resetMenuScroll]);

  useEffect(() => {
    if (isOpen) {
      setMobileSettledClosed(false);
      return;
    }
    resetMenuScroll();
    const id = window.setTimeout(() => setMobileSettledClosed(true), 320);
    return () => window.clearTimeout(id);
  }, [isOpen, resetMenuScroll]);

  const menuStyle = {
    paddingTop: insets.paddingTop,
    paddingBottom: insets.paddingBottom,
    height: 'calc(var(--vh, 1vh) * 100)',
  };

  const menuCategories: MenuCategory[] = [
    {
      title: "Ações Rápidas",
      items: [
        {
          icon: <Bell className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />,
          label: "Notificações",
          highlight: unreadCount > 0,
          badge: unreadCount,
          onClick: () => {
            markAllRead();
            closeMenu();
            setShowNotificationsModal(true);
          },
        },
        { icon: <Key className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />, label: "Minhas Credenciais", onClick: () => onNavigate('credentials'), highlight: true },
        { icon: <DollarSign className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />, label: "Comprar Login", onClick: () => onNavigate('buy'), highlight: true },
        { icon: <BriefcaseBusiness className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />, label: "Gerar Teste (Email)", onClick: () => onNavigate('testgenerate') },
        { icon: <RefreshCw className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />, label: "Renovar Login", onClick: () => onNavigate('renewal') },
        { icon: <Search className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />, label: "Recuperar Login", onClick: () => onNavigate('recovery') },
      ]
    },
    {
      title: "Principais",
      items: [
        { icon: <Book className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />, label: "Tutoriais", onClick: () => onNavigate('tutorials') },
        { icon: <Network className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />, label: "Servidores", onClick: () => setShowServersModal(true) },
        { icon: <CalendarClock className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />, label: "Check User", onClick: () => onNavigate('checkuser') }
      ]
    },
    {
      title: "Ferramentas",
      items: [
        { icon: <Zap className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />, label: "Teste Automático", onClick: () => autoConnect.openModal(), highlight: true },
        { icon: <Download className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />, label: "Speed Test", onClick: () => onNavigate('speedtest') },
        { icon: <Share2 className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />, label: "Hotspot", onClick: () => onNavigate('hotspot') },
        { icon: <Search className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />, label: "Buscador de IP", onClick: () => onNavigate('ipfinder') },
        { icon: <BriefcaseBusiness className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />, label: "Serviços", onClick: () => onNavigate('services') },
        { icon: <Phone className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />, label: "Suporte", onClick: () => onNavigate('support'), highlight: true }
      ]
    },
    {
      title: "Configurações",
      items: [
        { icon: <FileKey className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />, label: "Chave de importação", onClick: () => setShowImportKeyModal(true) },
        { icon: <Battery className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />, label: "Bateria", onClick: checkBatteryOptimization },
        { icon: <Wifi className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />, label: "Ajustes de APN", onClick: openApnSettings },
        { icon: <Network className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />, label: "Ajustes de Rede", onClick: openNetworkSettings },
        { icon: <RefreshCw className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />, label: "Verificar Atualizações", onClick: checkForUpdates }
      ]
    }
  ];

  return (
    <>
      {/* Backdrop — só no mobile (< lg) */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={closeMenu}
        />
      )}

      <aside
        ref={asideRef}
        className={`
        sidebar-drawer
        fixed inset-y-0 left-0
        w-[280px] xs:w-[300px] sm:w-[320px] max-w-[90vw] sm:max-w-[85vw]
        lg:w-72 xl:w-80 2xl:w-[340px] 3xl:w-[380px]
        lg:max-w-none lg:relative lg:z-auto lg:shadow-none lg:border-r-0
        sidebar-mobile-landscape
        overflow-hidden
        z-50
        lg:flex-shrink-0
        ${isOpen ? 'is-open' : ''}
        ${!isOpen && mobileSettledClosed ? 'is-closed-settled' : ''}
      `}
        style={{ ...menuStyle, background: 'var(--bg-elevated)', borderRight: '1px solid var(--border)' }}
      >
        <div className="flex flex-col h-full min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4 lg:p-6 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 lg:w-12 lg:h-12 2xl:w-14 2xl:h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent)' }}>
                <Settings className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9 text-white" />
              </div>
              <div className="min-w-0">
                <span className="font-medium text-sm lg:text-base 2xl:text-lg block truncate" style={{ color: 'var(--text)' }}>SSH T PROJECT</span>
                <span className="text-sm lg:text-base block truncate" style={{ color: 'var(--text-muted)' }}>Configurações</span>
              </div>
            </div>
            <button
              onClick={closeMenu}
              type="button"
              className="lg:hidden min-w-[44px] min-h-[44px] lg:min-w-[48px] lg:min-h-[48px] 2xl:min-w-[56px] 2xl:min-h-[56px] flex items-center justify-center rounded-xl flex-shrink-0 touch-manipulation"
              style={{ background: 'var(--surface)' }}
              aria-label="Fechar menu"
            >
              <X className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9 text-white" strokeWidth={2.5} />
            </button>
          </div>

          {/* Menu Items com novas categorias */}
          <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-4 lg:py-6">
            {menuCategories.map((category, idx) => (
              <div key={category.title} className={`px-4 lg:px-6 3xl:px-8 ${idx > 0 ? 'mt-6 lg:mt-8 2xl:mt-10 3xl:mt-12' : ''}`}>
                <h3 className="text-xs lg:text-sm 2xl:text-base 3xl:text-lg font-semibold uppercase tracking-wider mb-2 lg:mb-3" style={{ color: 'var(--text-muted)' }}>
                  {category.title}
                </h3>
                <div className="space-y-1">
                  {category.items.map((item) => (
                    <MenuItem
                      key={item.label}
                      icon={item.icon}
                      label={item.label}
                      onClick={item.onClick}
                      className={item.highlight ? 'bg-[var(--accent-dim)]' : ''}
                      iconClassName={item.highlight ? 'text-[var(--text-muted)]' : ''}
                      badge={item.badge}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer com botões */}
          <div className="p-4 lg:p-6 space-y-3 flex-shrink-0" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onNavigate('terms')}
                className="px-4 lg:px-6 min-h-[44px] lg:min-h-[48px] 2xl:min-h-[56px] 3xl:min-h-[64px] rounded-xl btn-secondary text-sm lg:text-base 2xl:text-lg 3xl:text-xl font-medium"
              >
                Termos
              </button>
              <button
                onClick={() => onNavigate('privacy')}
                className="px-4 lg:px-6 min-h-[44px] lg:min-h-[48px] 2xl:min-h-[56px] 3xl:min-h-[64px] rounded-xl btn-secondary text-sm lg:text-base 2xl:text-lg 3xl:text-xl font-medium"
              >
                Privacidade
              </button>
            </div>
            <button
              onClick={() => onNavigate('cleandata')}
              className="w-full px-4 lg:px-6 min-h-[44px] lg:min-h-[48px] 2xl:min-h-[56px] 3xl:min-h-[64px] rounded-lg bg-red-500/10 hover:bg-red-500/20 
                transition-colors duration-200 text-red-400 text-sm lg:text-base 2xl:text-lg 3xl:text-xl font-medium"
            >
              Limpar Dados
            </button>
          </div>
        </div>
      </aside>

      {/* Modals renderizados fora do aside via Portal */}
      {showServersModal && typeof window !== 'undefined' && createPortal(
        <ServersModal onClose={() => setShowServersModal(false)} />,
        document.body
      )}
      {showImportKeyModal && typeof window !== 'undefined' && createPortal(
        <ImportKeyModal onClose={() => setShowImportKeyModal(false)} />,
        document.body
      )}
      {showNotificationsModal && typeof window !== 'undefined' && createPortal(
        <NotificationsModal onClose={() => setShowNotificationsModal(false)} />,
        document.body
      )}
    </>
  );
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
  iconClassName?: string;
  badge?: number;
}

function MenuItem({ icon, label, onClick, className = '', iconClassName = '', badge }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 lg:gap-4 3xl:gap-5 px-4 lg:px-6 3xl:px-8 min-h-[44px] lg:min-h-[48px] 2xl:min-h-[56px] 3xl:min-h-[64px] rounded-xl
        touch-manipulation
        ${className}
      `}
      style={{ color: 'var(--text-muted)' }}
    >
      <div className={`flex-shrink-0 ${iconClassName}`} style={{ color: 'var(--accent)' }}>
        {icon}
      </div>
      <span className="text-sm lg:text-base 2xl:text-lg 3xl:text-xl font-medium truncate flex-1 text-left">{label}</span>
      {typeof badge === 'number' && badge > 0 && (
        <span
          className="min-w-[20px] h-5 px-1.5 rounded-full text-[10px] lg:text-xs font-bold text-white flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--accent)' }}
        >
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}