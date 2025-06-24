import { useState, useEffect } from 'react';
import { Eye, EyeOff, Scroll, HelpCircle } from 'lucide-react';
import {
  setUsername as setUsernameApp,
  setPassword as setPasswordApp,
  setUUID as setUUIDApp,
  getUsername,
  getPassword,
  getUUID,
  openDialogLogs,
  getDefaultConfig
} from '../utils/appFunctions';
import { useVpnConnection } from '../hooks/useVpnConnection';
import { useActiveConfig } from '../context/ActiveConfigContext';
import { ConfigAuth } from '../types/config';

export function ConnectionForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showUUID, setShowUUID] = useState(false);
  const [mode, setMode] = useState('');
  const [auth, setAuth] = useState<ConfigAuth>({});
  const [inputUsername, setInputUsername] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [inputUUID, setInputUUID] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const { connectionState, error, connect, disconnect } = useVpnConnection();
  const { activeConfig } = useActiveConfig();

  // Atualiza todos os campos a partir da config ativa do contexto
  useEffect(() => {
    // Busca a config ativa sempre que mudar
    let config = null;
    try {
      config = JSON.parse(getDefaultConfig());
    } catch {
      config = activeConfig;
    }
    if (config) {
      setMode(config.mode?.toLowerCase() || '');
      const authObj = config.auth || {};
      const newAuth: ConfigAuth = {
        username: 'username' in authObj ? (authObj as any).username : undefined,
        password: 'password' in authObj ? (authObj as any).password : undefined,
        v2ray_uuid: 'v2ray_uuid' in authObj ? (authObj as any).v2ray_uuid : undefined,
      };
      setAuth(newAuth);
      setInputUsername(newAuth.username ?? getUsername() ?? '');
      setInputPassword(newAuth.password ?? getPassword() ?? '');
      setInputUUID(newAuth.v2ray_uuid ?? getUUID() ?? '');
    }
  }, [activeConfig]);

  // Monitor connection state changes
  useEffect(() => {
    if (error) {
      disconnect();
    }
  }, [error, disconnect]);

  // Handlers para inputs: já salvam o valor global ao digitar e atualizam o estado local
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsernameApp(e.target.value);
    setInputUsername(e.target.value);
  };
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordApp(e.target.value);
    setInputPassword(e.target.value);
  };
  const handleUUIDChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUUIDApp(e.target.value);
    setInputUUID(e.target.value);
  };

  // Lógica de exibição dos campos baseada no modo da config e se já há valor preenchido
  const isV2Ray = mode.startsWith('v2ray');
  const showUsernameInput = !isV2Ray && !auth.username;
  const showPasswordInput = !isV2Ray && !auth.password;
  const showUUIDInput = isV2Ray && !auth.v2ray_uuid;

  // Validação antes de conectar
  const validateForm = () => {
    if (isV2Ray) {
      if (!auth.v2ray_uuid && !inputUUID) return 'UUID obrigatório para V2Ray';
    } else {
      if (!auth.username && !inputUsername) return 'Usuário obrigatório';
      if (!auth.password && !inputPassword) return 'Senha obrigatória';
    }
    return null;
  };

  // Ao conectar, usa o valor da config se existir, senão o do input (já salvo via setXxxApp)
  const handleConnection = () => {
    setFormError(null);
    if (connectionState !== 'DISCONNECTED') {
      disconnect();
    } else {
      const validation = validateForm();
      if (validation) {
        setFormError(validation);
        return;
      }
      setUsernameApp(inputUsername);
      setPasswordApp(inputPassword);
      setUUIDApp(inputUUID);
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
        {showUsernameInput && (
          <div className="relative">
            <input
              className="w-full h-10 px-3 rounded-lg glass-effect text-white placeholder-gray-400 outline-none focus:border-purple-500 text-sm"
              type="text"
              autoCapitalize="none"
              placeholder="Usuário"
              value={inputUsername}
              onChange={handleUsernameChange}
            />
          </div>
        )}
        {showPasswordInput && (
          <div className="relative">
            <input
              className="w-full h-10 px-3 pr-10 rounded-lg glass-effect text-white placeholder-gray-400 outline-none focus:border-purple-500 text-sm"
              type={showPassword ? 'text' : 'password'}
              placeholder="Senha"
              value={inputPassword}
              onChange={handlePasswordChange}
            />
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-300 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              type="button"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        )}
        {showUUIDInput && (
          <div className="relative">
            <input
              className="w-full h-10 px-3 pr-20 rounded-lg glass-effect text-white placeholder-gray-400 outline-none focus:border-purple-500 text-sm"
              type={showUUID ? 'text' : 'password'}
              placeholder="UUID"
              value={inputUUID}
              onChange={handleUUIDChange}
            />
            <button
              className="absolute right-12 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-300 transition-colors"
              onClick={() => setShowUUID(!showUUID)}
              type="button"
            >
              {showUUID ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 group">
              <button className="text-[#b0a8ff] cursor-pointer flex items-center" type="button" tabIndex={-1}>
                <HelpCircle className="w-4 h-4" />
              </button>
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
        {/* Exibe valores preenchidos, se existirem, como texto apenas leitura */}
        {!showUsernameInput && auth.username && (
          <div className="w-full h-10 flex items-center px-3 rounded-lg glass-effect text-white text-sm bg-[#26074d]/40">
            <span className="font-mono opacity-80">Usuário: {auth.username}</span>
          </div>
        )}
        {!showPasswordInput && auth.password && (
          <div className="w-full h-10 flex items-center px-3 rounded-lg glass-effect text-white text-sm bg-[#26074d]/40">
            <span className="font-mono opacity-80">Senha: ******</span>
          </div>
        )}
        {!showUUIDInput && auth.v2ray_uuid && (
          <div className="w-full h-10 flex items-center px-3 rounded-lg glass-effect text-white text-sm bg-[#26074d]/40">
            <span className="font-mono opacity-80">UUID: {auth.v2ray_uuid}</span>
          </div>
        )}
        <button
          className={`btn-primary w-full h-10 text-sm ${getButtonStyle()}`}
          onClick={handleConnection}
          disabled={connectionState === 'STOPPING'}
        >
          {getButtonText()}
        </button>
        {(formError || error) && <p className="text-red-400 text-xs text-center">{formError || error}</p>}
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