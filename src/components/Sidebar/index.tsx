import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Settings, Download,
  Wifi, Battery, Network, Book, Globe, Bug,
  RefreshCw, /* DollarSign, */ Share2, CalendarClock, BriefcaseBusiness, Search, Zap, Phone, Key, Bell, X
} from '../../utils/icons';
import {
  checkForUpdates,
  openApnSettings,
  openNetworkSettings,
  checkBatteryOptimization,
  copyDiagnosticReport,
  vibrate,
} from '../../utils/appFunctions';
import { getCustomDnsConfig } from '../../utils/dnsUtils';
import { ModalType } from '../../App';
import { ServersModal } from '../modals/ServersModal';
import { NotificationsModal } from '../modals/NotificationsModal';
import { useAutoConnectContext } from '../../context/AutoConnectContext';
import { useAppNotifications } from '../../context/AppNotificationsContext';
import { useAppLayout } from '../../hooks/useAppLayout';
import { useTranslation } from '../../i18n';
import type { LocaleType } from '../../i18n/types';

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
    badgeText?: string;
  }[];
}

const LANGUAGE_OPTIONS: {
  locale: LocaleType;
  country: string;
  flag: string;
  name: string;
  sub: string;
}[] = [
  { locale: 'pt-BR', country: 'BR', flag: '🇧🇷', name: 'Brasil', sub: 'Português' },
  { locale: 'es', country: 'AR', flag: '🇦🇷', name: 'Argentina', sub: 'Español' },
  { locale: 'pt-AO', country: 'AO', flag: '🇦🇴', name: 'Angola', sub: 'Português' },
];

export function Sidebar({ isOpen, onClose, onNavigate }: SidebarProps) {
  const { t, locale, setLocale, setCountry } = useTranslation();
  const { insets } = useAppLayout();
  const [showServersModal, setShowServersModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const autoConnect = useAutoConnectContext();
  const { unreadCount, markAllRead } = useAppNotifications();
  const isDnsActive = isOpen ? getCustomDnsConfig().enabled : false;

  const handleLanguageSelect = useCallback((targetLocale: LocaleType, targetCountry: string) => {
    try {
      vibrate(25);
    } catch {
      /* ignore */
    }
    setLocale(targetLocale);
    setCountry(targetCountry);
  }, [setLocale, setCountry]);

  const handleCopyReport = useCallback(() => {
    copyDiagnosticReport();
  }, []);
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
  };

  const menuCategories: MenuCategory[] = [
    {
      title: t('sidebar.quickActions'),
      items: [
        {
          icon: <Bell className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />,
          label: t('sidebar.notifications'),
          highlight: unreadCount > 0,
          badge: unreadCount,
          onClick: () => {
            markAllRead();
            closeMenu();
            setShowNotificationsModal(true);
          },
        },
        { icon: <Key className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />, label: t('sidebar.myCredentials'), onClick: () => onNavigate('credentials'), highlight: true },
        // Temporariamente removido do menu:
        // { icon: <DollarSign className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />, label: "Comprar Login", onClick: () => onNavigate('buy'), highlight: true },
        { icon: <BriefcaseBusiness className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />, label: t('sidebar.generateTest'), onClick: () => onNavigate('testgenerate') },
        // { icon: <RefreshCw className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />, label: "Renovar Login", onClick: () => onNavigate('renewal') },
        { icon: <Search className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />, label: t('sidebar.recoverLogin'), onClick: () => onNavigate('recovery') },
      ]
    },
    {
      title: t('sidebar.main'),
      items: [
        { icon: <Book className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />, label: t('sidebar.tutorials'), onClick: () => onNavigate('tutorials') },
        { icon: <Network className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />, label: t('sidebar.servers'), onClick: () => setShowServersModal(true) },
        { icon: <CalendarClock className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />, label: t('sidebar.checkUser'), onClick: () => onNavigate('checkuser') }
      ]
    },
    {
      title: t('sidebar.tools'),
      items: [
        { icon: <Zap className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />, label: t('sidebar.autoTest'), onClick: () => autoConnect.openModal(), highlight: true },
        { icon: <Download className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />, label: t('sidebar.speedTest'), onClick: () => onNavigate('speedtest') },
        { icon: <Share2 className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />, label: t('sidebar.hotspot'), onClick: () => onNavigate('hotspot') },
        { icon: <Search className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />, label: t('sidebar.ipFinder'), onClick: () => onNavigate('ipfinder') },
        // { icon: <BriefcaseBusiness className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />, label: "Serviços", onClick: () => onNavigate('services') },
        { icon: <Phone className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />, label: t('sidebar.support'), onClick: () => onNavigate('support'), highlight: true }
      ]
    },
    {
      title: t('sidebar.settings'),
      items: [
        {
          icon: <Globe className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />,
          label: t('sidebar.customDns'),
          onClick: () => onNavigate('dns'),
          highlight: isDnsActive,
          badgeText: isDnsActive ? t('sidebar.activeBadge') : undefined,
        },
        {
          icon: <Bug className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />,
          label: t('sidebar.errorReport'),
          onClick: handleCopyReport,
        },
        { icon: <Battery className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />, label: t('sidebar.battery'), onClick: checkBatteryOptimization },
        { icon: <Wifi className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />, label: t('sidebar.apnSettings'), onClick: openApnSettings },
        { icon: <Network className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />, label: t('sidebar.networkSettings'), onClick: openNetworkSettings },
        { icon: <RefreshCw className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />, label: t('sidebar.checkUpdates'), onClick: checkForUpdates }
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
        style={{ ...menuStyle, height: '100%', maxHeight: '100%', background: 'var(--bg-elevated)', borderRight: '1px solid var(--border)' }}
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
                <span className="text-sm lg:text-base block truncate" style={{ color: 'var(--text-muted)' }}>{t('sidebar.settings')}</span>
              </div>
            </div>
            <button
              onClick={closeMenu}
              type="button"
              className="lg:hidden min-w-[44px] min-h-[44px] lg:min-w-[48px] lg:min-h-[48px] 2xl:min-w-[56px] 2xl:min-h-[56px] flex items-center justify-center rounded-xl flex-shrink-0 touch-manipulation transition-opacity active:opacity-70"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              aria-label={t('common.close')}
            >
              <X className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" style={{ color: 'var(--text)' }} strokeWidth={2.5} />
            </button>
          </div>

          {/* Menu Items com novas categorias */}
          <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-4 lg:py-6">
            {/* Seletor de Idioma */}
            <div className="px-4 lg:px-6 3xl:px-8 mb-5 lg:mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs lg:text-sm 2xl:text-base 3xl:text-lg font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                  <Globe className="w-3.5 h-3.5 lg:w-4 lg:h-4" style={{ color: 'var(--accent)' }} />
                  {t('sidebar.language')}
                </h3>
                <span
                  className="text-[10px] lg:text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
                >
                  {locale === 'pt-BR' ? '🇧🇷 PT-BR' : locale === 'es' ? '🇦🇷 ES' : '🇦🇴 PT-AO'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {LANGUAGE_OPTIONS.map((item) => {
                  const isSelected = locale === item.locale;
                  return (
                    <button
                      key={item.locale}
                      type="button"
                      onClick={() => handleLanguageSelect(item.locale, item.country)}
                      className={`
                        flex flex-col items-center justify-center py-2 px-1.5 rounded-xl border text-center transition-all duration-200 touch-manipulation
                        ${
                          isSelected
                            ? 'border-[var(--accent)] bg-[var(--accent-dim)] shadow-sm'
                            : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] opacity-85 hover:opacity-100'
                        }
                      `}
                      aria-pressed={isSelected}
                      aria-label={item.name}
                    >
                      <span className="text-xl sm:text-2xl mb-1 leading-none drop-shadow-sm">{item.flag}</span>
                      <span
                        className="text-xs font-semibold leading-tight truncate w-full"
                        style={{ color: isSelected ? 'var(--accent)' : 'var(--text)' }}
                      >
                        {item.name}
                      </span>
                      <span
                        className="text-[10px] leading-none mt-0.5 truncate w-full opacity-80"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {item.sub}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
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
                      badgeText={item.badgeText}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer com botões */}
          <div
            className="p-4 lg:p-6 space-y-3 flex-shrink-0"
            style={{
              borderTop: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
              paddingBottom: insets.paddingBottom > 8 ? `${insets.paddingBottom}px` : undefined,
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onNavigate('terms')}
                className="px-4 lg:px-6 min-h-[44px] lg:min-h-[48px] 2xl:min-h-[56px] 3xl:min-h-[64px] rounded-xl btn-secondary text-sm lg:text-base 2xl:text-lg 3xl:text-xl font-medium"
              >
                {t('sidebar.terms')}
              </button>
              <button
                onClick={() => onNavigate('privacy')}
                className="px-4 lg:px-6 min-h-[44px] lg:min-h-[48px] 2xl:min-h-[56px] 3xl:min-h-[64px] rounded-xl btn-secondary text-sm lg:text-base 2xl:text-lg 3xl:text-xl font-medium"
              >
                {t('sidebar.privacy')}
              </button>
            </div>
            <button
              onClick={() => onNavigate('cleandata')}
              className="w-full px-4 lg:px-6 min-h-[44px] lg:min-h-[48px] 2xl:min-h-[56px] 3xl:min-h-[64px] rounded-lg bg-red-500/10 hover:bg-red-500/20 
                transition-colors duration-200 text-red-400 text-sm lg:text-base 2xl:text-lg 3xl:text-xl font-medium"
            >
              {t('sidebar.clearData')}
            </button>
          </div>
        </div>
      </aside>

      {/* Modals renderizados fora do aside via Portal */}
      {showServersModal && typeof window !== 'undefined' && createPortal(
        <ServersModal onClose={() => setShowServersModal(false)} />,
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
  badgeText?: string;
}

function MenuItem({ icon, label, onClick, className = '', iconClassName = '', badge, badgeText }: MenuItemProps) {
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
      {badgeText && (
        <span
          className="px-2 py-0.5 rounded-full text-[10px] lg:text-xs font-bold flex items-center justify-center flex-shrink-0 tracking-wide uppercase"
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#34d399',
            border: '1px solid rgba(16, 185, 129, 0.3)',
          }}
        >
          {badgeText}
        </span>
      )}
    </button>
  );
}