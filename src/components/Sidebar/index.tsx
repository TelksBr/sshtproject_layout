import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Settings, Download, Wifi, Battery, Network, Book,
  RefreshCw, DollarSign, Share2, CalendarClock, BriefcaseBusiness, Search, Zap, Phone, Key, X
} from '../../utils/icons';
import {
  checkForUpdates,
  openApnSettings,
  openNetworkSettings,
  checkBatteryOptimization,
  getStatusbarHeight,
  getNavbarHeight
} from '../../utils/appFunctions';
import { ModalType } from '../../App';
import { ServersModal } from '../modals/ServersModal';
import { useAutoConnect } from '../../hooks/useAutoConnect';
import { AutoConnectModal } from '../AutoConnectModal';
import { Sheet } from '../ui/Sheet';

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
  }[];
}

export function Sidebar({ isOpen, onClose, onNavigate }: SidebarProps) {
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const [showServersModal, setShowServersModal] = useState(false);
  const autoConnect = useAutoConnect();

  useEffect(() => {
    const statusBarHeight = getStatusbarHeight();
    const navBarHeight = getNavbarHeight();
    setMenuStyle({
      padding: `${statusBarHeight + 10}px 0px ${navBarHeight + 10}px 0px`
    });
  }, []);

  const renderPanel = useCallback(({ close }: { close: () => void }) => {
    const menuCategories: MenuCategory[] = [
      {
        title: "Ações Rápidas",
        items: [
          { icon: <Key className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8" />, label: "Minhas Credenciais", onClick: () => onNavigate('credentials'), highlight: true },
          { icon: <DollarSign className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8" />, label: "Comprar Login", onClick: () => onNavigate('buy'), highlight: true },
          { icon: <BriefcaseBusiness className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8" />, label: "Gerar Teste (Email)", onClick: () => onNavigate('testgenerate') },
          { icon: <RefreshCw className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8" />, label: "Renovar Login", onClick: () => onNavigate('renewal') },
          { icon: <Search className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8" />, label: "Recuperar Login", onClick: () => onNavigate('recovery') },
        ]
      },
      {
        title: "Principais",
        items: [
          { icon: <Book className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8" />, label: "Tutoriais", onClick: () => onNavigate('tutorials') },
          { icon: <Network className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8" />, label: "Servidores", onClick: () => { setShowServersModal(true); close(); } },
          { icon: <CalendarClock className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8" />, label: "Check User", onClick: () => onNavigate('checkuser') }
        ]
      },
      {
        title: "Ferramentas",
        items: [
          { icon: <Zap className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8" />, label: "Teste Automático", onClick: () => { autoConnect.openModal(); close(); }, highlight: true },
          { icon: <Download className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8" />, label: "Speed Test", onClick: () => onNavigate('speedtest') },
          { icon: <Share2 className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8" />, label: "Hotspot", onClick: () => onNavigate('hotspot') },
          { icon: <Search className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8" />, label: "Buscador de IP", onClick: () => onNavigate('ipfinder') },
          { icon: <BriefcaseBusiness className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8" />, label: "Serviços", onClick: () => onNavigate('services') },
          { icon: <Phone className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8" />, label: "Suporte", onClick: () => onNavigate('support'), highlight: true }
        ]
      },
      {
        title: "Configurações",
        items: [
          { icon: <Battery className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8" />, label: "Bateria", onClick: checkBatteryOptimization },
          { icon: <Wifi className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8" />, label: "Ajustes de APN", onClick: openApnSettings },
          { icon: <Network className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8" />, label: "Ajustes de Rede", onClick: openNetworkSettings },
          { icon: <RefreshCw className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8" />, label: "Verificar Atualizações", onClick: checkForUpdates }
        ]
      }
    ];

    return (
    <div
      className="sidebar-mobile-landscape bg-[#26074d]/95 backdrop-blur-lg h-full flex flex-col border-r border-[#6205D5]/20 shadow-2xl shadow-black/20"
      style={menuStyle}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 lg:p-6 border-b border-[#6205D5]/20 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 lg:w-12 lg:h-12 2xl:w-14 2xl:h-14 rounded-full bg-gradient-to-br from-[#6205D5] to-[#4B0082] flex items-center justify-center shadow-lg shadow-[#6205D5]/20 flex-shrink-0">
            <Settings className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 text-white" />
          </div>
          <div className="min-w-0">
            <span className="text-white font-medium text-sm lg:text-base 2xl:text-lg block truncate">SSH T PROJECT</span>
            <span className="text-[#b0a8ff]/70 text-sm lg:text-base block truncate">Configurações</span>
          </div>
        </div>
        <button
          onClick={close}
          onPointerDown={(e) => {
            e.preventDefault();
            close();
          }}
          type="button"
          className="min-w-[44px] min-h-[44px] lg:min-w-[48px] lg:min-h-[48px] 2xl:min-w-[56px] 2xl:min-h-[56px] flex items-center justify-center rounded-lg bg-[#6205D5]/20 hover:bg-[#6205D5]/30 active:bg-[#6205D5]/40 transition-colors flex-shrink-0 touch-manipulation"
          aria-label="Fechar menu"
        >
          <X className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 text-white" strokeWidth={2.5} />
        </button>
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto py-4 lg:py-6">
        {menuCategories.map((category, idx) => (
          <div key={category.title} className={`px-4 lg:px-6 ${idx > 0 ? 'mt-6 lg:mt-8' : ''}`}>
            <h3 className="text-xs lg:text-sm 2xl:text-base font-semibold text-[#b0a8ff]/50 uppercase tracking-wider mb-2 lg:mb-3">
              {category.title}
            </h3>
            <div className="space-y-1">
              {category.items.map((item) => (
                <MenuItem
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  onClick={item.onClick}
                  className={item.highlight ? 'bg-[#6205D5]/10 hover:bg-[#6205D5]/20' : ''}
                  iconClassName={item.highlight ? 'text-[#b0a8ff]' : ''}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 lg:p-6 border-t border-[#6205D5]/20 bg-[#26074d]/95 backdrop-blur-lg space-y-3 flex-shrink-0">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onNavigate('terms')}
            className="px-4 lg:px-6 min-h-[44px] lg:min-h-[48px] 2xl:min-h-[56px] rounded-lg bg-[#6205D5]/10 hover:bg-[#6205D5]/20 transition-all duration-200 text-[#b0a8ff] text-sm lg:text-base 2xl:text-lg font-medium"
          >
            Termos
          </button>
          <button
            onClick={() => onNavigate('privacy')}
            className="px-4 lg:px-6 min-h-[44px] lg:min-h-[48px] 2xl:min-h-[56px] rounded-lg bg-[#6205D5]/10 hover:bg-[#6205D5]/20 transition-all duration-200 text-[#b0a8ff] text-sm lg:text-base 2xl:text-lg font-medium"
          >
            Privacidade
          </button>
        </div>
        <button
          onClick={() => onNavigate('cleandata')}
          className="w-full px-4 lg:px-6 min-h-[44px] lg:min-h-[48px] 2xl:min-h-[56px] rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-all duration-200 text-red-400 text-sm lg:text-base 2xl:text-lg font-medium"
        >
          Limpar Dados
        </button>
      </div>
    </div>
    );
  }, [onNavigate, autoConnect, menuStyle]);

  return (
    <Sheet open={isOpen} onClose={onClose} side="left" render={renderPanel}>
      {showServersModal && typeof window !== 'undefined' && createPortal(
        <ServersModal onClose={() => setShowServersModal(false)} />,
        document.body
      )}

      {typeof window !== 'undefined' && createPortal(
        <AutoConnectModal
          open={autoConnect.open}
          onClose={autoConnect.closeModal}
          currentConfigName={autoConnect.currentName}
          totalConfigs={autoConnect.total}
          testedConfigs={autoConnect.tested}
          successConfigName={autoConnect.success}
          running={autoConnect.running}
          onStart={autoConnect.startAutoConnect}
          onCancel={autoConnect.cancelTest}
          error={autoConnect.error}
          logs={autoConnect.logs}
          currentTestDuration={autoConnect.currentTestDuration}
          autoConnectConfig={autoConnect.autoConnectConfig}
          setAutoConnectConfig={autoConnect.setAutoConnectConfig}
          showSettings={autoConnect.showSettings}
          setShowSettings={autoConnect.setShowSettings}
        />,
        document.body
      )}
    </Sheet>
  );
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
  iconClassName?: string;
}

function MenuItem({ icon, label, onClick, className = '', iconClassName = '' }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 lg:gap-4 px-4 lg:px-6 min-h-[44px] lg:min-h-[48px] 2xl:min-h-[56px] rounded-lg text-[#b0a8ff] 
        hover:bg-[#6205D5]/10 transition-all duration-200
        active:scale-[0.98] hover:shadow-lg hover:shadow-[#6205D5]/5
        touch-manipulation
        ${className}
      `}
    >
      <div className={`text-[#6205D5] flex-shrink-0 ${iconClassName}`}>
        {icon}
      </div>
      <span className="text-sm lg:text-base 2xl:text-lg font-medium truncate">{label}</span>
    </button>
  );
}
