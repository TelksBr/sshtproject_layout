import { memo, useMemo, useRef } from 'react';
import { Logs, EthernetPort, Sun, Moon, SunMoon } from '../utils/icons';
import { VpnState } from '../types/vpn';
import { vibrate } from '../utils/appFunctions';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/useToast';
import { useTranslation } from '../i18n';

interface HeaderProps {
  onMenuClick: () => void;
  localIP: string;
  vpnState: VpnState;
  onOpenDebug?: () => void;
}

const Header = memo(function Header({ onMenuClick, localIP, vpnState, onOpenDebug }: HeaderProps) {
  const tapCountRef = useRef(0);
  const lastTapRef = useRef(0);
  const { mode, cycleMode } = useTheme();
  const { showToast } = useToast();
  const { t } = useTranslation();

  const handleIpClick = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 600) {
      tapCountRef.current += 1;
    } else {
      tapCountRef.current = 1;
    }
    lastTapRef.current = now;

    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      try {
        vibrate(50);
      } catch {
        /* ignore */
      }
      if (onOpenDebug) onOpenDebug();
    }
  };

  const handleThemeToggle = () => {
    try {
      vibrate(30);
    } catch {
      /* ignore */
    }
    const next = cycleMode();
    const labels = {
      auto: t('header.themeAutoToast'),
      dark: t('header.themeDarkToast'),
      light: t('header.themeLightToast'),
    };
    showToast(labels[next], 'info');
  };

  const statusColor = useMemo(() => {
    switch (vpnState) {
      case "CONNECTED":
        return "bg-[var(--ok)]";
      case "CONNECTING":
      case "AUTH":
        return "bg-amber-400";
      default:
        return "bg-[var(--danger)]";
    }
  }, [vpnState]);

  const statusMessage = useMemo(() => {
    switch (vpnState) {
      case "CONNECTED": return t('header.connected');
      case "CONNECTING": return t('header.connecting');
      case "STOPPING": return t('header.stopping');
      case "NO_NETWORK": return t('header.noNetwork');
      case "AUTH": return t('header.auth');
      case "AUTH_FAILED": return t('header.authFailed');
      case "DISCONNECTED":
      default: return t('header.disconnected');
    }
  }, [vpnState, t]);

  const ThemeIcon = mode === 'auto' ? SunMoon : mode === 'dark' ? Moon : Sun;
  const themeLabel = mode === 'auto' ? t('header.themeAuto') : mode === 'dark' ? t('header.themeDark') : t('header.themeLight');

  return (
    <section className="flex items-center gap-2 py-1">
      <button
        onClick={onMenuClick}
        className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl flex-shrink-0 touch-manipulation"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        aria-label={t('header.openMenu')}
      >
        <Logs className="w-5 h-5" style={{ color: 'var(--text-muted)' }} id="open-menu" />
      </button>

      <div
        className="flex items-center gap-2 px-3 min-h-[44px] rounded-xl flex-1 min-w-0"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className={`w-2 h-2 rounded-full ${statusColor} flex-shrink-0`} />
        <span className="text-sm font-medium truncate" id="vpn-status" style={{ color: 'var(--text)' }}>
          {statusMessage}
        </span>
      </div>

      <button
        type="button"
        onClick={handleIpClick}
        className="flex items-center gap-1.5 px-2.5 min-h-[44px] rounded-xl min-w-0 max-w-[40%] md:max-w-none touch-manipulation active:opacity-70 transition-opacity cursor-pointer text-left"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        title="Toque 5 vezes para abrir o Suíte de Debug SDK"
      >
        <EthernetPort className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
        <span className="text-xs font-mono truncate" id="ip-status" style={{ color: 'var(--text-muted)' }}>
          {localIP}
        </span>
      </button>

      <button
        type="button"
        onClick={handleThemeToggle}
        className="flex items-center gap-1.5 px-2.5 min-h-[44px] rounded-xl flex-shrink-0 touch-manipulation active:opacity-70 transition-all cursor-pointer select-none"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        title={`Tema: ${mode === 'auto' ? 'Automático (SDK)' : mode === 'dark' ? 'Escuro' : 'Claro'} (Clique para alternar)`}
        aria-label="Alternar Tema"
      >
        <ThemeIcon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--accent)' }} />
        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          {themeLabel}
        </span>
      </button>
    </section>
  );
});

export { Header };
export default Header;
