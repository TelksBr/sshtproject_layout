import { useEffect, useState } from 'react';
import { Logs, EthernetPort, GitFork } from 'lucide-react';
import { onDtunnelEvent } from '../utils/dtEvents';
import { getConnectionState } from '../utils/appFunctions';

interface HeaderProps {
  onMenuClick: () => void;
  version: string;
}

type VpnState = 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'STOPPING' | 'NO_NETWORK' | 'AUTH' | 'AUTH_FAILED';

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

export function Header({ onMenuClick, version }: HeaderProps) {
  const [vpnState, setVpnState] = useState<VpnState>('DISCONNECTED');
  const [localIP, setLocalIP] = useState('127.0.0.1');

  // Encapsula todos os eventos de status da VPN
  useEffect(() => {
    // Atualiza status inicial (caso app já esteja conectado)
    const initialState = getConnectionState();
    if (initialState && [
      'CONNECTED', 'DISCONNECTED', 'CONNECTING', 'STOPPING', 'NO_NETWORK', 'AUTH', 'AUTH_FAILED'
    ].includes(initialState)) {
      setVpnState(initialState as VpnState);
    }

    // Handler único para todos os eventos relevantes
    const handleVpnStatus = (payload: any) => {
      if (typeof payload === 'object' && payload.state) {
        setVpnState(payload.state);
      } else if (typeof payload === 'string') {
        // Para eventos que só enviam string
        setVpnState(payload as VpnState);
      }
    };
    onDtunnelEvent('DtVpnStateEvent', handleVpnStatus);
    onDtunnelEvent('DtVpnStartedSuccessEvent', () => setVpnState('CONNECTED'));
    onDtunnelEvent('DtVpnStoppedSuccessEvent', () => setVpnState('DISCONNECTED'));
    return () => {
      onDtunnelEvent('DtVpnStateEvent', () => {});
      onDtunnelEvent('DtVpnStartedSuccessEvent', () => {});
      onDtunnelEvent('DtVpnStoppedSuccessEvent', () => {});
    };
  }, []);

  // Atualiza IP local a cada 1.5s em qualquer estado
  useEffect(() => {
    const updateIP = () => {
      const ip = window?.DtGetLocalIP?.execute?.() ?? '127.0.0.1';
      setLocalIP(ip);
    };
    updateIP();
    const interval = setInterval(updateIP, 1500);
    return () => clearInterval(interval);
  }, []);

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