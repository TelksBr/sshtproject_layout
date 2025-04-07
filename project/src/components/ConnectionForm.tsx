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

    // Check immediately
    checkConfig();

    // Set up interval to check for changes
    const interval = setInterval(checkConfig, 1000);
    return () => clearInterval(interval);
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
              className="w-full h-10 px-3 pr-10 rounded-lg glass-effect text-white placeholder-gray-400 outline-none focus:border-purple-500 text-sm"
              type={showUUID ? "text" : "password"}
              placeholder="UUID"
              value={uuid}
              onChange={handleUUIDChange}
            />
            <button 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-300 transition-colors"
              onClick={() => setShowUUID(!showUUID)}
            >
              {showUUID ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
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