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

  // Verificação inicial do status da VPN
  useEffect(() => {
    const initialState = getConnectionState();
    if (initialState && [
      'CONNECTED', 'DISCONNECTED', 'CONNECTING', 'STOPPING', 'NO_NETWORK', 'AUTH', 'AUTH_FAILED'
    ].includes(initialState)) {
      setVpnState(initialState as VpnState);
    }
  }, []);

  useEffect(() => {
    // Handler para eventos de estado da VPN
    const handleVpnEvent = (payload: { state: VpnState }) => {
      if (payload && payload.state) {
        setVpnState(payload.state);
      }
    };
    onDtunnelEvent('DtVpnStateEvent', handleVpnEvent);
    onDtunnelEvent('DtVpnStartedSuccessEvent', () => setVpnState('CONNECTED'));
    onDtunnelEvent('DtVpnStoppedSuccessEvent', () => setVpnState('DISCONNECTED'));
    // Limpeza
    return () => {
      onDtunnelEvent('DtVpnStateEvent', () => {});
      onDtunnelEvent('DtVpnStartedSuccessEvent', () => {});
      onDtunnelEvent('DtVpnStoppedSuccessEvent', () => {});
    };
  }, []);

  // Atualiza IP local a cada 5s
  useEffect(() => {
    const updateIP = () => {
      const ip = window?.DtGetLocalIP?.execute() ?? '127.0.0.1';
      setLocalIP(ip);
    };
    const intervalId = setInterval(updateIP, 2000);
    updateIP();
    return () => clearInterval(intervalId);
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
    <section className="flex justify-between items-center p-2 rounded-lg border border-[#6205D5]/20 bg-[#26074d]/30 backdrop-blur-sm">
      <button
        onClick={onMenuClick}
        className="p-1.5 rounded-full hover:bg-[#6205D5]/10 transition-colors"
      >
        <Logs   
          className="w-5 h-5 text-[#b0a8ff]"
          id="open-menu" 
        />
      </button>

      <div className="flex flex-col items-start gap-1.5 bg-[#6205D5]/10 px-2.5 py-0.5 rounded-lg">
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor()}`} />
          <span className="text-[#b0a8ff] text-xs text-medium" id="vpn-status">
            {getStateMessage(vpnState)}
          </span>
        </div>
        <div className="w-full h-0.5 bg-[#4B0082]/50 "></div>
        <div className="flex items-center gap-1.5">
          <EthernetPort className="w-4 h-4 text-[#b0a8ff]" />
          <span className="text-[#b0a8ff] text-xs font-mono" id="ip-status">
            {localIP}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 bg-[#6205D5]/10 px-2.5 py-0.5 rounded-full">
        <GitFork className="w-4 h-4 text-[#b0a8ff]" />
        <span className="text-[#b0a8ff] text-sm font-medium" id="version">
          {version}
        </span>
      </div>
    </section>
  );
}