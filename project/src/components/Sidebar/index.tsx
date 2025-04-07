import React, { useEffect, useState } from 'react';
import {
  Settings, Download, FileText, HelpCircle,
  Wifi, Battery, Network, Trash2, Book,
  RefreshCw, DollarSign, Share2, Shield, CalendarClock, BriefcaseBusiness, Search
} from 'lucide-react';
import { checkForUpdates, openApnSettings, openNetworkSettings, checkBatteryOptimization } from '../../utils/systemUtils';
import { getStatusbarHeight, getNavbarHeight } from '../../utils/appFunctions';
import { ModalType } from '../../App';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (modal: ModalType) => void;
}

export function Sidebar({ isOpen, onClose, onNavigate }: SidebarProps) {
  const [menuStyle, setMenuStyle] = useState({});

  useEffect(() => {
    const statusBarHeight = getStatusbarHeight();
    const navBarHeight = getNavbarHeight();

    setMenuStyle({
      padding: `${statusBarHeight + 10}px 0px ${navBarHeight + 10}px 0px`
    });
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 bg-black/50 backdrop-blur-sm z-40
          transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 w-[280px] bg-[#26074d]/95 backdrop-blur-lg
          transform transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          border-r border-[#6205D5]/20 shadow-2xl shadow-black/20 z-50
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={menuStyle}
      >
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

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto py-4 px-2">
            <nav className="space-y-1">
              <MenuItem
                icon={<Book className="w-5 h-5" />}
                label="Tutoriais"
                onClick={() => onNavigate('tutorials')}
              />
              <MenuItem
                icon={<RefreshCw className="w-5 h-5" />}
                label="Verificar Atualizações"
                onClick={checkForUpdates}
              />
              <MenuItem
                icon={<DollarSign className="w-5 h-5" />}
                label="Comprar Login"
                onClick={() => onNavigate('buy')}
              />
              <MenuItem
                icon={<CalendarClock className="w-5 h-5" />}
                label="Check User"
                onClick={() => onNavigate('checkuser')}
              />
              <MenuItem
                icon={<Download className="w-5 h-5" />}
                label="Speed Test"
                onClick={() => onNavigate('speedtest')}
              />
              <MenuItem
                icon={<Share2 className="w-5 h-5" />}
                label="Hotspot"
                onClick={() => onNavigate('hotspot')}
              />
              <MenuItem
                icon={<Battery className="w-5 h-5" />}
                label="Bateria"
                onClick={checkBatteryOptimization}
              />
              <MenuItem
                icon={<Wifi className="w-5 h-5" />}
                label="Ajustes de APN"
                onClick={openApnSettings}
              />
              <MenuItem
                icon={<Network className="w-5 h-5" />}
                label="Ajustes de Rede"
                onClick={openNetworkSettings}
              />
              <MenuItem
                icon={<BriefcaseBusiness className="w-5 h-5" />}
                label="Serviços"
                onClick={() => onNavigate('services')}
              />
              <MenuItem
                icon={<Search className="w-5 h-5" />}
                label="Buscador de IP"
                onClick={() => onNavigate('ipfinder')}
              />
              <MenuItem
                icon={<HelpCircle className="w-5 h-5" />}
                label="Suporte"
                onClick={() => onNavigate('support')}
              />

            </nav>
          </div>

          {/* Footer */}
          <div className="px-4 pb-4 border-t border-[#6205D5]/20 pt-4 bg-[#26074d]/95 backdrop-blur-lg">
            <div className="grid gap-2">
              <button
                className="w-full h-10 rounded-lg bg-[#6205D5]/10 text-[#b0a8ff] text-sm font-medium hover:bg-[#6205D5]/20 transition-colors flex items-center justify-center gap-2"
                onClick={() => onNavigate('terms')}
              >
                <FileText className="w-4 h-4" />
                Termos de Uso
              </button>
              <button
                className="w-full h-10 rounded-lg bg-[#6205D5]/10 text-[#b0a8ff] text-sm font-medium hover:bg-[#6205D5]/20 transition-colors flex items-center justify-center gap-2"
                onClick={() => onNavigate('privacy')}
              >
                <Shield className="w-4 h-4" />
                Política de Privacidade
              </button>
              <button
                className="w-full h-10 rounded-lg bg-[#6205D5]/10 text-[#b0a8ff] text-sm font-medium hover:bg-[#6205D5]/20 transition-colors flex items-center justify-center gap-2"
                onClick={() => onNavigate('faq')}
              >
                <HelpCircle className="w-4 h-4" />
                FAQ
              </button>
              <button
                className="w-full h-10 rounded-lg bg-[#6205D5]/10 text-red-400 text-sm font-medium hover:bg-[#6205D5]/20 transition-colors flex items-center justify-center gap-2"
                onClick={() => onNavigate('cleandata')}
              >
                <Trash2 className="w-4 h-4" />
                Limpar Dados
              </button>
            </div>
          </div>
        </div>
      </aside>
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