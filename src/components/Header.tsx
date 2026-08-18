import { memo, useMemo } from 'react';
import { Logs, EthernetPort, GitFork } from '../utils/icons';
import { VpnState } from '../types/vpn';

interface HeaderProps {
  onMenuClick: () => void;
  version: string;
  localIP: string;
  vpnState: VpnState;
}

function getStateMessage(state: VpnState) {
  switch (state) {
    case "CONNECTED": return "Conectado";
    case "CONNECTING": return "Conectando...";
    case "STOPPING": return "Parando conexão...";
    case "NO_NETWORK": return "Sem rede";
    case "AUTH": return "Autenticando...";
    case "AUTH_FAILED": return "Falha de autenticação";
    case "DISCONNECTED":
    default: return "Desconectado";
  }
}

const Header = memo(function Header({ onMenuClick, version, localIP, vpnState }: HeaderProps) {
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

  const statusMessage = useMemo(() => getStateMessage(vpnState), [vpnState]);

  return (
    <section className="flex items-center gap-2 py-1">
      <button
        onClick={onMenuClick}
        className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl flex-shrink-0 touch-manipulation"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        aria-label="Abrir menu"
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

      <div
        className="flex items-center gap-1.5 px-2.5 min-h-[44px] rounded-xl min-w-0 max-w-[40%] md:max-w-none"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <EthernetPort className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
        <span className="text-xs font-mono truncate" id="ip-status" style={{ color: 'var(--text-muted)' }}>
          {localIP}
        </span>
      </div>

      <div
        className="flex items-center gap-1.5 px-2.5 min-h-[44px] rounded-xl flex-shrink-0"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <GitFork className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
        <span className="text-xs font-medium" id="version" style={{ color: 'var(--text-muted)' }}>
          {version}
        </span>
      </div>
    </section>
  );
});

export { Header };
export default Header;
