import { Logs, EthernetPort, GitFork } from 'lucide-react';
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

export function Header({ onMenuClick, version, localIP, vpnState }: HeaderProps) {
  const getStatusColor = () => {
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
  };

  return (
    <section className="flex justify-between items-center p-3 rounded-xl border border-[#6205D5]/30 bg-[#26074d]/40 backdrop-blur-md shadow-lg">
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg hover:bg-[#6205D5]/20 active:bg-[#6205D5]/30 transition-all duration-200"
        aria-label="Abrir menu"
      >
        <Logs   
          className="w-5 h-5 text-[#b0a8ff] opacity-90"
          id="open-menu" 
        />
      </button>

      <div className="flex flex-col items-start gap-2 bg-[#6205D5]/15 px-3 py-1.5 rounded-xl min-w-[140px] shadow-inner">
        <div className="flex items-center gap-2 w-full">
          <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor()} shadow-md transition-colors duration-300 animate-pulse`} />
          <span className="text-[#b0a8ff] text-xs font-medium tracking-wide" id="vpn-status">
            {getStateMessage(vpnState)}
          </span>
        </div>
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#6205D5]/30 to-transparent"></div>
        <div className="flex items-center gap-2">
          <EthernetPort className="w-4 h-4 text-[#b0a8ff] opacity-75" />
          <span className="text-[#b0a8ff] text-xs font-mono tracking-wide opacity-90" id="ip-status">
            {localIP}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-[#6205D5]/15 px-3 py-1.5 rounded-xl shadow-inner">
        <GitFork className="w-4 h-4 text-[#b0a8ff] opacity-75" />
        <span className="text-[#b0a8ff] text-xs font-medium tracking-wide opacity-90" id="version">
          {version}
        </span>
      </div>
    </section>
  );
}