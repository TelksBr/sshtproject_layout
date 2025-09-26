import { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { Eye, EyeOff, Scroll, HelpCircle, Zap } from 'lucide-react';
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
  stopConnection,
  buildHysteriaPassword,
  parseHysteriaPassword
} from '../utils/appFunctions';
import { onDtunnelEvent } from '../utils/dtEvents';
import { ConfigAuth } from '../types/config';
import { VpnState } from '../types/vpn';
import { AutoConnectModal } from './AutoConnectModal';
import { createPortal } from 'react-dom';
import { useAutoConnect } from '../hooks/useAutoConnect';

interface ConnectionFormProps {
  vpnState: VpnState;
}

export function ConnectionForm({ vpnState }: ConnectionFormProps) {
  // Estado do AutoConnectModal
  const autoConnect = useAutoConnect();
  const [showPassword, setShowPassword] = useState(false);
  const [showUUID, setShowUUID] = useState(false);
  const [mode, setMode] = useState('');
  const [auth, setAuth] = useState<ConfigAuth>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Estado local para controlar tentativa de conexão
  const [isTryingToConnect, setIsTryingToConnect] = useState(() => {
    // Detecta se o status inicial já é de tentativa de conexão
    // AUTH, CONNECTING, STOPPING são estados "em andamento"
    return [
      'AUTH',
      'CONNECTING',
      'STOPPING'
    ].includes(vpnState);
  });

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
        let loadedUsername = getUsername() || '';
        let loadedPassword = getPassword() || '';
        // Se for Hysteria e senha está concatenada, separar
        if ((config.mode || '').toLowerCase().startsWith('hysteria') && loadedPassword.includes(':')) {
          const [user, pass] = loadedPassword.split(':');
          setUsername(user || '');
          setPassword(pass || '');
        } else {
          setUsername(loadedUsername);
          setPassword(loadedPassword);
        }
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
        let loadedUsername = getUsername() || '';
        let loadedPassword = getPassword() || '';
        if ((config.mode || '').toLowerCase().startsWith('hysteria') && loadedPassword.includes(':')) {
          const [user, pass] = loadedPassword.split(':');
          setUsername(user || '');
          setPassword(pass || '');
        } else {
          setUsername(loadedUsername);
          setPassword(loadedPassword);
        }
        setUuid(getUUID() || '');
      }
    };

    onDtunnelEvent('DtNewDefaultConfigEvent', handleConfigChanged);
    return () => onDtunnelEvent('DtNewDefaultConfigEvent', () => {});
  }, []);

  // Escuta eventos para atualização de erros baseados no estado VPN
  useEffect(() => {
    // Não limpa o erro automaticamente, só seta mensagem se necessário
    if (vpnState === 'AUTH_FAILED') {
      setFormError('Falha na autenticação');
      // Mantém isTryingToConnect true, pois usuário pode querer cancelar
      setIsTryingToConnect(true);
    } else if (vpnState === 'NO_NETWORK') {
      setFormError('Sem conexão com a internet');
      setIsTryingToConnect(true);
    } else if (vpnState === 'DISCONNECTED' || vpnState === 'CONNECTED') {
      // Só limpa o estado de tentativa quando realmente desconectar ou conectar
      setIsTryingToConnect(false);
    } else if ([
      'AUTH',
      'CONNECTING',
      'STOPPING'
    ].includes(vpnState)) {
      // Se o status mudou para um desses, garante que o botão fique em modo "cancelar"
      setIsTryingToConnect(true);
    }
    // Se for outros estados, mantém o estado
  }, [vpnState]);

  // Handlers para inputs: atualizam estado local e salvam usando as funções nativas
  const handleUsernameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    setUsernameApp(value);
  }, []);
  
  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordApp(value);
  }, []);
  
  const handleUUIDChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUuid(value);
    setUUIDApp(value);
  }, []);

  // Lógica de exibição dos campos baseada no modo da config
  const { isV2Ray, isHysteria } = useMemo(() => {
    const modeLower = mode.toLowerCase();
    return {
      isV2Ray: modeLower.startsWith('v2ray'),
      isHysteria: modeLower.startsWith('hysteria')
    };
  }, [mode]);
  const isSSH = mode.toLowerCase().startsWith('ssh');
  // Para hysteria, mostrar os mesmos campos que SSH
  const showUsernameInput = (!isV2Ray && !auth.username) || isHysteria;
  const showPasswordInput = (!isV2Ray && !auth.password) || isHysteria;
  const showUUIDInput = isV2Ray && !auth.v2ray_uuid;

  // Valores dos inputs: só mostram quando o input está visível
  const usernameValue = showUsernameInput ? username : '';
  const passwordValue = showPasswordInput ? password : '';
  const uuidValue = showUUIDInput ? uuid : '';

  // Handlers para toggle de visibilidade
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const toggleUUIDVisibility = useCallback(() => {
    setShowUUID(prev => !prev);
  }, []);

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
      setIsTryingToConnect(true);
      let originalPassword = password;
      let originalUsername = username;
      // Se for hysteria, só concatena se ainda não estiver concatenado
      if (isHysteria) {
        if (!password.includes(':')) {
          setPasswordApp(buildHysteriaPassword(username, password));
        } else {
          setPasswordApp(password); // já está concatenado
        }
      }
      // Se for SSH e senha está no formato user:pass, faz o reverso
      if (isSSH && password.includes(':')) {
        const parsed = parseHysteriaPassword(password);
        setUsernameApp(parsed.username);
        setPasswordApp(parsed.password);
      }
      startConnection();
      // Restaura valores originais após conectar
      setTimeout(() => {
        setPasswordApp(originalPassword);
        setUsernameApp(originalUsername);
      }, 1000);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Falha ao conectar');
      setIsTryingToConnect(false);
    }
  };

  const disconnect = () => {
    try {
      setFormError(null);
      setIsTryingToConnect(false);
      stopConnection();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Falha ao desconectar');
      setIsTryingToConnect(false);
    }
  };

  // Manipula clique do botão de conexão
  const handleConnection = () => {
    setFormError(null);
    if (!isTryingToConnect) {
      // Só tenta conectar se não estiver tentando
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
        case 'CONNECTED':
          // Estado conectado - desconectar
          disconnect();
          break;
        default:
          break;
      }
    } else {
      // Se está tentando conectar, permite cancelar
      disconnect();
    }
  };

  // Texto e estilo do botão baseado no estado
  const getButtonText = () => {
    if (isTryingToConnect) {
      return 'Cancelar Conexão';
    }
    switch (vpnState) {
      case 'STOPPING':
        return 'Parando...';
      case 'CONNECTED':
        return 'Desconectar';
      default:
        return 'Conectar';
    }
  };

  const getButtonStyle = () => {
    if (isTryingToConnect) {
      return 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700';
    }
    switch (vpnState) {
      case 'CONNECTED':
        return 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700';
      case 'STOPPING':
        return 'from-orange-500 to-orange-600';
      default:
        // Roxo padrão sugerido para o botão "Conectar"
        return 'from-[#6205D5] to-[#4B0082] hover:from-[#4B0082] hover:to-[#6205D5]';
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
              onClick={togglePasswordVisibility}
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
              onClick={toggleUUIDVisibility}
              type="button"
            >
              {showUUID ? <EyeOff className="w-4 h-4 md:w-5 md:h-5 lg:w-4 lg:h-4" /> : <Eye className="w-4  h-4 md:w-5 md:h-5 lg:w-4 lg:h-4" />}
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
          className={`w-full h-10 md:h-12 lg:h-11 text-sm md:text-base lg:text-sm font-bold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center bg-gradient-to-r ${getButtonStyle()}`}
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

        {/* Botões lado a lado: Registros e Auto Conect */}
        <div className="flex gap-2">
          <button
            className="w-1/2 h-10 md:h-12 lg:h-11 flex items-center justify-center gap-1 text-xs md:text-sm lg:text-xs font-medium rounded-lg border border-[#6205D5]/30 bg-[#26074d]/40 text-[#b0a8ff] hover:bg-[#6205D5]/20 hover:border-[#6205D5]/60 hover:text-white transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
            onClick={openDialogLogs}
          >
            <Scroll className="w-4 h-4 md:w-5 md:h-5 lg:w-4 lg:h-4" />
            <span className="font-medium">Registros</span>
          </button>
          <button
            className="w-1/2 h-10 md:h-12 lg:h-11 flex items-center justify-center gap-1 text-xs md:text-sm lg:text-xs font-medium rounded-lg border border-[#6205D5]/30 bg-[#26074d]/40 text-[#b0a8ff] hover:bg-[#6205D5]/20 hover:border-[#6205D5]/60 hover:text-white transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
            onClick={autoConnect.openModal}
            type="button"
          >
            <Zap className="w-4 h-4 md:w-5 md:h-5 lg:w-4 lg:h-4" />
            <span className="font-medium">Auto Conect</span>
          </button>
        </div>
      </div>
      {/* Modal de AutoConnect sempre no topo da árvore (portal) */}
      {typeof window !== 'undefined' && createPortal(
        <AutoConnectModal
          open={autoConnect.open}
          onClose={autoConnect.closeModal}
          currentConfigName={autoConnect.currentName}
          totalConfigs={autoConnect.total}
          testedConfigs={autoConnect.tested}
          successConfigName={autoConnect.success}
          running={autoConnect.running}
          onStart={autoConnect.startAutoConnect}
          onCancel={autoConnect.cancelTest}
          error={autoConnect.error}
          logs={autoConnect.logs}
          currentTestDuration={autoConnect.currentTestDuration}
          autoConnectConfig={autoConnect.autoConnectConfig}
          setAutoConnectConfig={autoConnect.setAutoConnectConfig}
          showSettings={autoConnect.showSettings}
          setShowSettings={autoConnect.setShowSettings}
        />,
        document.body
      )}
    </section>
  );
}

export default memo(ConnectionForm);
