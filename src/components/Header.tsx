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
  // Memoizar cálculo de cor do status
  const statusColor = useMemo(() => {
    switch (vpnState) {
      case "CONNECTED":
        return "bg-green-500";
      case "CONNECTING":
      case "AUTH":
        return "bg-yellow-500";
      case "AUTH_FAILED":
      case "NO_NETWORK":
        return "bg-red-500";
      default:
        return "bg-red-500";
    }
  }, [vpnState]);

  // Memoizar mensagem de status
  const statusMessage = useMemo(() => getStateMessage(vpnState), [vpnState]);

  return (
    <section className="
      p-3 md:p-4
      rounded-xl
      border border-[#6205D5]/30 bg-[#26074d]/40 backdrop-blur-md shadow-lg
    ">
      {/* Layout Mobile: Vertical (2 linhas) | Desktop: Horizontal (1 linha) */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        
        {/* Linha 1 Mobile / Esquerda Desktop: Menu + Status */}
        <div className="flex items-center gap-3 flex-1">
          {/* Menu Button */}
          <button
            onClick={onMenuClick}
            className="
              p-2 rounded-lg hover:bg-[#6205D5]/20 active:bg-[#6205D5]/30
              transition-all duration-200 flex-shrink-0
            "
            aria-label="Abrir menu"
          >
            <Logs className="w-6 h-6 text-[#b0a8ff] opacity-90" id="open-menu" />
          </button>

          {/* Status */}
          <div className="
            flex items-center gap-2
            bg-[#6205D5]/15 px-3 py-2 rounded-lg flex-1 min-w-0 shadow-inner
          ">
            <div className={`w-2.5 h-2.5 rounded-full ${statusColor} shadow-md animate-pulse flex-shrink-0`} />
            <span className="text-[#b0a8ff] text-sm font-medium truncate" id="vpn-status">
              {statusMessage}
            </span>
          </div>
        </div>

        {/* Linha 2 Mobile / Direita Desktop: IP + Version */}
        <div className="flex items-center gap-3">
          {/* IP */}
          <div className="
            flex items-center gap-2 bg-[#6205D5]/15 px-3 py-2 rounded-lg shadow-inner flex-1 md:flex-initial min-w-0
          ">
            <EthernetPort className="w-4 h-4 text-[#b0a8ff] opacity-75 flex-shrink-0" />
            <span className="text-[#b0a8ff] text-sm font-mono opacity-90 truncate" id="ip-status">
              {localIP}
            </span>
          </div>

          {/* Version */}
          <div className="
            flex items-center gap-2 bg-[#6205D5]/15 px-3 py-2 rounded-lg shadow-inner flex-shrink-0
          ">
            <GitFork className="w-4 h-4 text-[#b0a8ff] opacity-75" />
            <span className="text-[#b0a8ff] text-sm font-medium opacity-90" id="version">
              {version}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
});

export { Header };
export default Header;