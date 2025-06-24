import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Scroll } from 'lucide-react';
import { 
  getUsername, 
  getPassword, 
  getUUID, 
  setUsername as setUsernameApp, 
  setPassword as setPasswordApp, 
  setUUID as setUUIDApp, 
  openDialogLogs 
} from '../utils/appFunctions';
import { useVpnConnection } from '../hooks/useVpnConnection';
import { getActiveConfig, shouldShowInput } from '../utils/configUtils';
import { configManager } from '../utils/configManager';
import { onDtunnelEvent } from '../utils/dtEvents';

export function ConnectionForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showUUID, setShowUUID] = useState(false);
  const [username, setUsernameState] = useState(getUsername());
  const [password, setPasswordState] = useState(getPassword());
  const [uuid, setUUIDState] = useState(getUUID());
  const [isV2Ray, setIsV2Ray] = useState(false);

  const { connectionState, isConnected, isConnecting, error, connect, disconnect } = useVpnConnection();

  // Monitor active config changes
  useEffect(() => {
    const checkConfig = () => {
      const activeConfig = getActiveConfig();
      
      // Update V2Ray status
      setIsV2Ray(activeConfig?.mode?.toLowerCase().startsWith("v2ray") ?? false);

      // Update credentials if provided by config
      if (activeConfig?.auth) {
        if (activeConfig.auth.username) {
          setUsernameState(activeConfig.auth.username);
          setUsernameApp(activeConfig.auth.username);
        }
        if (activeConfig.auth.password) {
          setPasswordState(activeConfig.auth.password);
          setPasswordApp(activeConfig.auth.password);
        }
        if (activeConfig.auth.v2ray_uuid) {
          setUUIDState(activeConfig.auth.v2ray_uuid);
          setUUIDApp(activeConfig.auth.v2ray_uuid);
        }
      }
    };

    // Executa verificação inicial
    checkConfig();
    
    // Adiciona listener para mudanças de configuração
    const unsubscribe = configManager.addListener('config', checkConfig);
    
    // Cleanup ao desmontar
    return () => unsubscribe();
  }, []);

  // Atualiza campos ao receber evento global de seleção de config
  useEffect(() => {
    const handleConfigSelected = (config: any) => {
      const mode = (config?.mode || '').toLowerCase();
      setIsV2Ray(mode.includes('v2ray'));
      setUsernameState(config?.auth?.username ?? getUsername());
      setPasswordState(config?.auth?.password ?? getPassword());
      setUUIDState(config?.auth?.v2ray_uuid ?? getUUID());
    };
    onDtunnelEvent('DtConfigSelectedEvent', handleConfigSelected);
    return () => {
      if (window && (window as any).DtConfigSelectedEvent) {
        (window as any).DtConfigSelectedEvent = undefined;
      }
    };
  }, []);

  // Monitor connection state changes
  useEffect(() => {
    if (error) {
      disconnect(); // Ensure connection is stopped when error occurs
    }
  }, [error, disconnect]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsernameState(value);
    setUsernameApp(value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPasswordState(value);
    setPasswordApp(value);
  };

  const handleUUIDChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUUIDState(value);
    setUUIDApp(value);
  };

  const handleConnection = () => {
    // Permitir desconectar em qualquer estado que não seja DISCONNECTED
    if (connectionState !== 'DISCONNECTED') {
      disconnect();
    } else {
      connect();
    }
  };

  const showUsernameInput = shouldShowInput('username') && !isV2Ray;
  const showPasswordInput = shouldShowInput('password') && !isV2Ray;
  const showUUIDInput = shouldShowInput('uuid') && isV2Ray;

  const getButtonText = () => {
    switch (connectionState) {
      case 'CONNECTING':
      case 'AUTH':
        return 'Cancelar';
      case 'STOPPING':
        return 'Parando...';
      case 'CONNECTED':
        return 'Desconectar';
      default:
        return 'Conectar';
    }
  };

  const getButtonStyle = () => {
    if (connectionState === 'CONNECTED' || connectionState === 'CONNECTING' || connectionState === 'AUTH') {
      return 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700';
    }
    return '';
  };

  return (
    <section className="card">
      <h1 className="text-gradient text-base font-medium text-center mb-3">
        Dados de Acesso
      </h1>

      <div className="space-y-3">
        {showUsernameInput && (
          <div className="relative">
            <input 
              className="w-full h-10 px-3 rounded-lg glass-effect text-white placeholder-gray-400 outline-none focus:border-purple-500 text-sm"
              type="text"
              autoCapitalize="none"
              placeholder="Usuário"
              value={username}
              onChange={handleUsernameChange}
            />
          </div>
        )}

        {showPasswordInput && (
          <div className="relative">
            <input 
              className="w-full h-10 px-3 pr-10 rounded-lg glass-effect text-white placeholder-gray-400 outline-none focus:border-purple-500 text-sm"
              type={showPassword ? "text" : "password"}
              placeholder="Senha"
              value={password}
              onChange={handlePasswordChange}
            />
            <button 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-300 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        )}

        {showUUIDInput && (
          <div className="relative">
            <input 
              className="w-full h-10 px-3 pr-20 rounded-lg glass-effect text-white placeholder-gray-400 outline-none focus:border-purple-500 text-sm"
              type={showUUID ? "text" : "password"}
              placeholder="UUID"
              value={uuid}
              onChange={handleUUIDChange}
            />
            <button 
              className="absolute right-12 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-300 transition-colors"
              onClick={() => setShowUUID(!showUUID)}
              type="button"
            >
              {showUUID ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 group">
              <button className="text-[#b0a8ff] cursor-pointer flex items-center" type="button" tabIndex={-1}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              </button>
              {/* Tooltip visível ao hover */}
              <div className="absolute bottom-full right-0 mb-2 w-64 text-sm bg-[#26074d] text-[#b0a8ff] p-3 rounded-lg shadow-lg z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none border border-[#6205D5]/30">
                <div className="font-bold mb-1 text-[#b0a8ff]">O que é o UUID?</div>
                <div className="mb-1">É a chave única de login do seu V2Ray.</div>
                <div className="mb-1">Recebida no bot após a compra.</div>
                <div className="mb-1">
                  <span className="font-semibold text-[#b0a8ff]">Exemplo:</span>
                  <br />
                  <span className="font-mono select-all break-all text-[#b0a8ff]/90">
                    {crypto.randomUUID ? crypto.randomUUID() : 'e.g. 123e4567-e89b-12d3-a456-426614174000'}
                  </span>
                </div>
                <div className="text-[#ff5c8a] font-semibold">⚠️ Copie sem espaços extras!</div>
              </div>
            </div>
          </div>
        )}

        <button 
          className={`
            btn-primary w-full h-10 text-sm
            ${getButtonStyle()}
          `}
          onClick={handleConnection}
          disabled={connectionState === 'STOPPING'}
        >
          {getButtonText()}
        </button>

        {error && (
          <p className="text-red-400 text-xs text-center">{error}</p>
        )}

        <button 
          className="btn-outline w-full h-10 flex items-center justify-center gap-1.5 text-sm"
          onClick={openDialogLogs}
        >
          <Scroll className="w-4 h-4" />
          <span className="font-medium">Registros</span>
        </button>
      </div>
    </section>
  );
}