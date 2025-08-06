import { useState, useEffect } from 'react';
import { Eye, EyeOff, Scroll, HelpCircle } from 'lucide-react';
import {
  setUsername as setUsernameApp,
  setPassword as setPasswordApp,
  setUUID as setUUIDApp,
  getUsername,
  getPassword,
  getUUID,
  getActiveConfig,
  openDialogLogs,
  startConnection,
  stopConnection
} from '../utils/appFunctions';
import { onDtunnelEvent } from '../utils/dtEvents';
import { ConfigAuth } from '../types/config';
import { VpnState } from '../types/vpn';

interface ConnectionFormProps {
  vpnState: VpnState;
}

export function ConnectionForm({ vpnState }: ConnectionFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showUUID, setShowUUID] = useState(false);
  const [mode, setMode] = useState('');
  const [auth, setAuth] = useState<ConfigAuth>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Estados dos inputs como estado React local
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [uuid, setUuid] = useState('');

  // Carrega configuração inicial
  useEffect(() => {
    const loadInitialConfig = () => {
      const config = getActiveConfig();
      if (config) {
        setMode(config.mode || '');
        const authObj = config.auth || {};
        // Sempre cria um novo objeto auth para garantir re-render
        const newAuth: ConfigAuth = {
          username: authObj.username || undefined,
          password: authObj.password || undefined,
          v2ray_uuid: authObj.v2ray_uuid || undefined,
        };
        setAuth(newAuth);
        
        // Carrega valores dos inputs das funções nativas
        setUsername(getUsername() || '');
        setPassword(getPassword() || '');
        setUuid(getUUID() || '');
      }
    };

    loadInitialConfig();
  }, []);

  // Escuta eventos de mudança de configuração
  useEffect(() => {
    const handleConfigChanged = () => {
      // Busca a config ativa quando o evento disparar
      const config = getActiveConfig();
      if (config) {
        setMode(config.mode || '');
        const authObj = config.auth || {};
        // Sempre cria um novo objeto auth para garantir re-render
        const newAuth: ConfigAuth = {
          username: authObj.username || undefined,
          password: authObj.password || undefined,
          v2ray_uuid: authObj.v2ray_uuid || undefined,
        };
        setAuth(newAuth);
        setFormError(null); // Limpa erros quando trocar de config
        
        // Carrega valores dos inputs das funções nativas
        setUsername(getUsername() || '');
        setPassword(getPassword() || '');
        setUuid(getUUID() || '');
      }
    };

    onDtunnelEvent('DtNewDefaultConfigEvent', handleConfigChanged);
    return () => onDtunnelEvent('DtNewDefaultConfigEvent', () => {});
  }, []);

  // Escuta eventos para atualização de erros baseados no estado VPN
  useEffect(() => {
    setFormError(null); // Limpa erros quando o estado mudar
    
    if (vpnState === 'AUTH_FAILED') {
      setFormError('Falha na autenticação');
    } else if (vpnState === 'NO_NETWORK') {
      setFormError('Sem conexão com a internet');
    }
  }, [vpnState]);

  // Handlers para inputs: atualizam estado local e salvam usando as funções nativas
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    setUsernameApp(value);
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordApp(value);
  };
  
  const handleUUIDChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUuid(value);
    setUUIDApp(value);
  };

  // Lógica de exibição dos campos baseada no modo da config
  const isV2Ray = mode.toLowerCase().startsWith('v2ray');
  const showUsernameInput = !isV2Ray && !auth.username;
  const showPasswordInput = !isV2Ray && !auth.password;
  const showUUIDInput = isV2Ray && !auth.v2ray_uuid;

  // Valores dos inputs: só mostram quando o input está visível
  const usernameValue = showUsernameInput ? username : '';
  const passwordValue = showPasswordInput ? password : '';
  const uuidValue = showUUIDInput ? uuid : '';

  // Debug: Log para verificar mudanças na lógica de exibição
  useEffect(() => {
    // Este useEffect garante que o componente re-renderize quando auth ou mode mudam
    // e força a re-avaliação das condições de exibição dos inputs
  }, [auth, mode, auth.username, auth.password, auth.v2ray_uuid]);

  // Validação antes de conectar
  const validateForm = () => {
    if (isV2Ray) {
      if (!auth.v2ray_uuid && !uuid) return 'UUID obrigatório para V2Ray';
    } else {
      if (!auth.username && !username) return 'Usuário obrigatório';
      if (!auth.password && !password) return 'Senha obrigatória';
    }
    return null;
  };

  // Funções de conexão
  const connect = () => {
    try {
      setFormError(null);
      startConnection();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Falha ao conectar');
    }
  };

  const disconnect = () => {
    try {
      setFormError(null);
      stopConnection();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Falha ao desconectar');
    }
  };

  // Manipula clique do botão de conexão
  const handleConnection = () => {
    setFormError(null);
    
    switch (vpnState) {
      case 'DISCONNECTED':
      case 'AUTH_FAILED':
      case 'NO_NETWORK':
        // Estados onde podemos iniciar conexão
        const validation = validateForm();
        if (validation) {
          setFormError(validation);
          return;
        }
        
        connect();
        break;
        
      case 'CONNECTING':
      case 'AUTH':
        // Estados onde podemos cancelar/parar
        disconnect();
        break;
        
      case 'CONNECTED':
        // Estado conectado - desconectar
        disconnect();
        break;
        
      case 'STOPPING':
        // Estado parando - não fazer nada (botão desabilitado)
        break;
        
      default:
        break;
    }
  };

  // Texto e estilo do botão baseado no estado
  const getButtonText = () => {
    switch (vpnState) {
      case 'CONNECTING':
        return 'Cancelar Conexão';
      case 'AUTH':
        return 'Cancelar';
      case 'STOPPING':
        return 'Parando...';
      case 'CONNECTED':
        return 'Desconectar';
      case 'AUTH_FAILED':
      case 'NO_NETWORK':
      case 'DISCONNECTED':
      default:
        return 'Conectar';
    }
  };

  const getButtonStyle = () => {
    switch (vpnState) {
      case 'CONNECTED':
        return 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700';
      case 'CONNECTING':
      case 'AUTH':
        return 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700';
      case 'STOPPING':
        return 'from-orange-500 to-orange-600';
      default:
        return 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700';
    }
  };

  return (
    <section className="card md:p-8 md:rounded-2xl lg:p-6">
      <h1 className="text-gradient text-base md:text-lg lg:text-base font-medium text-center mb-3 md:mb-5 lg:mb-4">
        Dados de Acesso
      </h1>
      <div className="space-y-3 md:space-y-5 lg:space-y-4">
        {/* Input de usuário */}
        {showUsernameInput && (
          <div className="relative">
            <input
              className="w-full h-10 md:h-12 lg:h-11 px-3 md:px-4 lg:px-3 rounded-lg glass-effect text-white placeholder-gray-400 outline-hidden focus:border-purple-500 text-sm md:text-base lg:text-sm allow-select"
              type="text"
              autoCapitalize="none"
              placeholder="Usuário"
              value={usernameValue}
              onChange={handleUsernameChange}
            />
          </div>
        )}

        {/* Input de senha */}
        {showPasswordInput && (
          <div className="relative">
            <input
              className="w-full h-10 md:h-12 lg:h-11 px-3 md:px-4 lg:px-3 pr-10 rounded-lg glass-effect text-white placeholder-gray-400 outline-hidden focus:border-purple-500 text-sm md:text-base lg:text-sm allow-select"
              type={showPassword ? 'text' : 'password'}
              placeholder="Senha"
              value={passwordValue}
              onChange={handlePasswordChange}
            />
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-300 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              type="button"
            >
              {showPassword ? <EyeOff className="w-4 h-4 md:w-5 md:h-5 lg:w-4 lg:h-4" /> : <Eye className="w-4 h-4 md:w-5 md:h-5 lg:w-4 lg:h-4" />}
            </button>
          </div>
        )}

        {/* Input de UUID */}
        {showUUIDInput && (
          <div className="relative">
            <input
              className="w-full h-10 md:h-12 lg:h-11 px-3 md:px-4 lg:px-3 pr-16 md:pr-20 lg:pr-18 rounded-lg glass-effect text-white placeholder-gray-400 outline-hidden focus:border-purple-500 text-sm md:text-base lg:text-sm allow-select"
              type={showUUID ? 'text' : 'password'}
              placeholder="UUID"
              value={uuidValue}
              onChange={handleUUIDChange}
            />
            <button
              className="absolute right-8 md:right-10 lg:right-9 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-300 transition-colors"
              onClick={() => setShowUUID(!showUUID)}
              type="button"
            >
              {showUUID ? <EyeOff className="w-4 h-4 md:w-5 md:h-5 lg:w-4 lg:h-4" /> : <Eye className="w-4 h-4 md:w-5 md:h-5 lg:w-4 lg:h-4" />}
            </button>
            <div className="absolute right-1 md:right-2 lg:right-1.5 top-1/2 -translate-y-1/2 group">
              <button className="text-[#b0a8ff] cursor-pointer flex items-center p-1" type="button" tabIndex={-1}>
                <HelpCircle className="w-4 h-4 md:w-5 md:h-5 lg:w-4 lg:h-4" />
              </button>
              <div className="absolute bottom-full right-0 mb-2 w-64 md:w-80 lg:w-72 text-sm md:text-base lg:text-sm bg-[#26074d] text-[#b0a8ff] p-3 rounded-lg shadow-lg z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none border border-[#6205D5]/30">
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

        {/* Botão de conexão */}
        <button
          className={`btn-primary w-full h-10 md:h-12 lg:h-11 text-sm md:text-base lg:text-sm ${getButtonStyle()}`}
          onClick={handleConnection}
          disabled={vpnState === 'STOPPING'}
          title={`Estado atual: ${vpnState}`}
        >
          {getButtonText()}
        </button>

        {/* Exibição de erro */}
        {formError && (
          <p className="text-red-400 text-xs md:text-sm lg:text-xs text-center">{formError}</p>
        )}

        {/* Botão de logs */}
        <button
          className="btn-outline w-full h-10 md:h-12 lg:h-11 flex items-center justify-center gap-1.5 text-sm md:text-base lg:text-sm"
          onClick={openDialogLogs}
        >
          <Scroll className="w-4 h-4 md:w-5 md:h-5 lg:w-4 lg:h-4" />
          <span className="font-medium">Registros</span>
        </button>
      </div>
    </section>
  );
}
