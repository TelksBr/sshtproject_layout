import { useState, useEffect } from 'react';
import { Eye, EyeOff, Scroll } from 'lucide-react';
import {
  getUsername,
  getPassword,
  getUUID,
  setUsername as setUsernameApp,
  setPassword as setPasswordApp,
  setUUID as setUUIDApp,
  openDialogLogs,
  getDefaultConfig
} from '../utils/appFunctions';
import { useVpnConnection } from '../hooks/useVpnConnection';
import { useActiveConfig } from '../context/ActiveConfigContext';

export function ConnectionForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showUUID, setShowUUID] = useState(false);
  const [username, setUsernameState] = useState('');
  const [password, setPasswordState] = useState('');
  const [uuid, setUUIDState] = useState('');
  const [inputType, setInputType] = useState<'ssh' | 'uuid' | null>(null);

  const { connectionState, error, connect, disconnect } = useVpnConnection();
  const { activeConfig } = useActiveConfig();

  // Atualiza campos sempre que a configuração ativa mudar
  useEffect(() => {
    if (!activeConfig) return;
    const mode = (activeConfig.mode || '').toLowerCase();
    if (mode.startsWith('v2ray')) {
      if (activeConfig.auth?.v2ray_uuid) {
        setInputType(null);
        setUUIDState(activeConfig.auth.v2ray_uuid);
        setUUIDApp(activeConfig.auth.v2ray_uuid);
      } else {
        setInputType('uuid');
        setUUIDState('');
      }
      setUsernameState('');
      setPasswordState('');
    } else {
      if (activeConfig.auth?.username && activeConfig.auth?.password) {
        setInputType(null);
        setUsernameState(activeConfig.auth.username);
        setPasswordState(activeConfig.auth.password);
        setUsernameApp(activeConfig.auth.username);
        setPasswordApp(activeConfig.auth.password);
      } else {
        setInputType('ssh');
        setUsernameState(getUsername());
        setPasswordState(getPassword());
      }
      setUUIDState('');
    }
  }, [activeConfig]);

  useEffect(() => {
    if (error) {
      disconnect();
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
    if (connectionState !== 'DISCONNECTED') {
      disconnect();
    } else {
      connect();
    }
  };

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
        {inputType === 'ssh' && (
          <>
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
          </>
        )}
        {inputType === 'uuid' && (
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
        {/* Se inputType for null, não exibe nenhum campo de input */}
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