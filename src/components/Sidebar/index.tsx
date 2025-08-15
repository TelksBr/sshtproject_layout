import React, { useEffect, useState } from 'react';
import {
  Settings, Download,
  Wifi, Battery, Network, Book,
  RefreshCw, DollarSign, Share2, CalendarClock, BriefcaseBusiness, Search, Zap
} from 'lucide-react';
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
  const [menuStyle, setMenuStyle] = useState({});
  const [showServersModal, setShowServersModal] = useState(false);
  
  // Hook para AutoConnect
  const autoConnect = useAutoConnect();

  useEffect(() => {
    const statusBarHeight = getStatusbarHeight();
    const navBarHeight = getNavbarHeight();

    setMenuStyle({
      padding: `${statusBarHeight + 10}px 0px ${navBarHeight + 10}px 0px`
    });
  }, []);

  const menuCategories: MenuCategory[] = [
    {
      title: "Ações Rápidas",
      items: [
        { icon: <DollarSign className="w-5 h-5" />, label: "Comprar Login", onClick: () => onNavigate('buy'), highlight: true },
        { icon: <BriefcaseBusiness className="w-5 h-5" />, label: "Gerar Teste (Email)", onClick: () => onNavigate('testgenerate') },
        { icon: <RefreshCw className="w-5 h-5" />, label: "Renovar Login", onClick: () => onNavigate('renewal') },
        { icon: <Search className="w-5 h-5" />, label: "Recuperar Login", onClick: () => onNavigate('recovery') },
      ]
    },
    {
      title: "Principais",
      items: [
        { icon: <Book className="w-5 h-5" />, label: "Tutoriais", onClick: () => onNavigate('tutorials') },
        { icon: <Network className="w-5 h-5" />, label: "Servidores", onClick: () => setShowServersModal(true) },
        { icon: <CalendarClock className="w-5 h-5" />, label: "Check User", onClick: () => onNavigate('checkuser') }
      ]
    },
    {
      title: "Ferramentas",
      items: [
        { icon: <Zap className="w-5 h-5" />, label: "Teste Automático", onClick: () => autoConnect.openModal(), highlight: true },
        { icon: <Download className="w-5 h-5" />, label: "Speed Test", onClick: () => onNavigate('speedtest') },
        { icon: <Share2 className="w-5 h-5" />, label: "Hotspot", onClick: () => onNavigate('hotspot') },
        { icon: <Search className="w-5 h-5" />, label: "Buscador de IP", onClick: () => onNavigate('ipfinder') },
        { icon: <BriefcaseBusiness className="w-5 h-5" />, label: "Serviços", onClick: () => onNavigate('services') }
      ]
    },
    {
      title: "Configurações",
      items: [
        { icon: <Battery className="w-5 h-5" />, label: "Bateria", onClick: checkBatteryOptimization },
        { icon: <Wifi className="w-5 h-5" />, label: "Ajustes de APN", onClick: openApnSettings },
        { icon: <Network className="w-5 h-5" />, label: "Ajustes de Rede", onClick: openNetworkSettings },
        { icon: <RefreshCw className="w-5 h-5" />, label: "Verificar Atualizações", onClick: checkForUpdates }
      ]
    }
  ];

  return (
    <>
      <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300
        ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />

      <aside className={`
        fixed inset-y-0 left-0 w-[300px] max-w-[85vw]
        sidebar-mobile-landscape bg-[#26074d]/95 backdrop-blur-lg
        transform transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        border-r border-[#6205D5]/20 shadow-2xl shadow-black/20 z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `} style={menuStyle}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-4 border-b border-[#6205D5]/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6205D5] to-[#4B0082] flex items-center justify-center shadow-lg shadow-[#6205D5]/20">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-white font-medium">SSH T PROJECT</span>
                <span className="text-[#b0a8ff]/70 text-sm block">Configurações</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#6205D5]/10 transition-colors"
            >
              <svg className="w-5 h-5 text-[#b0a8ff]" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                />
              </svg>
            </button>
          </div>

          {/* Menu Items com novas categorias */}
          <div className="flex-1 overflow-y-auto py-4">
            {menuCategories.map((category, idx) => (
              <div key={category.title} className={`px-3 ${idx > 0 ? 'mt-6' : ''}`}>
                <h3 className="text-xs font-semibold text-[#b0a8ff]/50 uppercase tracking-wider mb-2 px-3">
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

          {/* Footer com botões */}
          <div className="px-4 py-4 border-t border-[#6205D5]/20 bg-[#26074d]/95 backdrop-blur-lg space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onNavigate('terms')}
                className="px-4 py-2 rounded-lg bg-[#6205D5]/10 hover:bg-[#6205D5]/20 
                  transition-all duration-200 text-[#b0a8ff] text-sm font-medium"
              >
                Termos de Uso
              </button>
              <button
                onClick={() => onNavigate('privacy')}
                className="px-4 py-2 rounded-lg bg-[#6205D5]/10 hover:bg-[#6205D5]/20 
                  transition-all duration-200 text-[#b0a8ff] text-sm font-medium"
              >
                Privacidade
              </button>
            </div>
            <button
              onClick={() => onNavigate('cleandata')}
              className="w-full px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 
                transition-all duration-200 text-red-400 text-sm font-medium"
            >
              Limpar Dados
            </button>
          </div>
        </div>
      </aside>

      {/* Modals */}
      {showServersModal && (
        <ServersModal onClose={() => setShowServersModal(false)} />
      )}

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
      />
    </>
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
        w-full flex items-center gap-3 px-4 h-12 rounded-lg text-[#b0a8ff] 
        hover:bg-[#6205D5]/10 transition-all duration-200
        active:scale-[0.98] hover:shadow-lg hover:shadow-[#6205D5]/5
        ${className}
      `}
    >
      <div className={`text-[#6205D5] ${iconClassName}`}>
        {icon}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}