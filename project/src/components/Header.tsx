import React, { useEffect, useState } from 'react';
import { Logs, EthernetPort, GitFork } from 'lucide-react';
import { useVpnConnection } from '../hooks/useVpnConnection';

interface HeaderProps {
  onMenuClick: () => void;
  version: string;
}

export function Header({ onMenuClick, version }: HeaderProps) {
  const { connectionState, stateMessage } = useVpnConnection();
  const [localIP, setLocalIP] = useState('127.0.0.1');

  useEffect(() => {
    const updateIP = () => {
      const ip = window?.DtGetLocalIP?.execute() ?? '127.0.0.1';
      setLocalIP(ip);
    };

    const intervalId = setInterval(updateIP, 5000);
    updateIP();

    return () => clearInterval(intervalId);
  }, []);

  const getStatusColor = () => {
    switch (connectionState) {
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
            {stateMessage}
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