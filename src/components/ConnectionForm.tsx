import { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { Eye, EyeOff, Scroll, HelpCircle, Zap } from '../utils/icons';
import {
  setUsername as setUsernameApp,
  setPassword as setPasswordApp,
  setUUID as setUUIDApp,
  getUsername,
  getPassword,
  getUUID,
  getActiveConfig,
  getAllConfigs,
  startConnection,
  stopConnection,
  buildHysteriaPassword,
  parseHysteriaPassword
} from '../utils/appFunctions';
import { useDTunnelEvent } from '../hooks/useDTunnelEvent';
import type { ConfigItem } from '../types/config';
import { VpnState } from '../types/vpn';
import { useAutoConnectContext } from '../context/AutoConnectContext';
import { useActiveConfig } from '../context/ActiveConfigContext';
import { getVisibleCredentialFields, getAutoConnectCredentialFields, mergeCredentialHints } from '../utils/configCredentials';
import { LogsModal } from './modals/LogsModal';
import { useTranslation } from '../i18n';

interface ConnectionFormProps {
  vpnState: VpnState;
}

export function ConnectionForm({ vpnState }: ConnectionFormProps) {
  const { t } = useTranslation();
  const autoConnect = useAutoConnectContext();
  const { activeConfig } = useActiveConfig();
  const [showPassword, setShowPassword] = useState(false);
  const [showUUID, setShowUUID] = useState(false);
  const [showUuidHelp, setShowUuidHelp] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<ConfigItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);

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

  const applyConfig = useCallback((config: ConfigItem | null) => {
    if (!config) return;
    setSelectedConfig(mergeCredentialHints(config, getAllConfigs()));
    setFormError(null);

    const modeLower = (config.mode || '').toLowerCase();
    const loadedUsername = getUsername() || '';
    const loadedPassword = getPassword() || '';
    if (modeLower.startsWith('hysteria') && loadedPassword.includes(':')) {
      const parsed = parseHysteriaPassword(loadedPassword);
      setUsername(parsed.username || '');
      setPassword(parsed.password || '');
    } else {
      setUsername(loadedUsername);
      setPassword(loadedPassword);
    }
    setUuid(getUUID() || '');
  }, []);

  useEffect(() => {
    applyConfig(getActiveConfig());
  }, [applyConfig]);

  useEffect(() => {
    if (activeConfig) applyConfig(activeConfig);
  }, [activeConfig, applyConfig]);

  const handleConfigChanged = useCallback(() => {
    applyConfig(getActiveConfig());
  }, [applyConfig]);

  useDTunnelEvent('newDefaultConfig', handleConfigChanged);

  // Escuta eventos para atualização de erros baseados no estado VPN
  useEffect(() => {
    // Não limpa o erro automaticamente, só seta mensagem se necessário
    if (vpnState === 'AUTH_FAILED') {
      setFormError(t('connectionForm.authFailedError'));
      // Mantém isTryingToConnect true, pois usuário pode querer cancelar
      setIsTryingToConnect(true);
    } else if (vpnState === 'NO_NETWORK') {
      setFormError(t('connectionForm.noNetworkError'));
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
  }, [vpnState, t]);

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

  const { isHysteria, isSSH } = useMemo(() => {
    const modeLower = (selectedConfig?.mode || '').toLowerCase();
    return {
      isHysteria: modeLower.startsWith('hysteria'),
      isSSH: modeLower.startsWith('ssh'),
    };
  }, [selectedConfig]);

  const { username: showUsernameInput, password: showPasswordInput, uuid: showUUIDInput } = useMemo(() => {
    if (autoConnect.homeEnabled) {
      const allConfigs = getAllConfigs().flatMap((category) => category.items);
      return getAutoConnectCredentialFields(allConfigs);
    }
    return getVisibleCredentialFields(selectedConfig);
  }, [autoConnect.homeEnabled, selectedConfig]);

  const hasVisibleCredentialFields = showUsernameInput || showPasswordInput || showUUIDInput;

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

  const validateForm = () => {
    if (showUsernameInput && !username.trim()) return 'Usuário obrigatório';
    if (showPasswordInput && !password.trim()) return 'Senha obrigatória';
    if (showUUIDInput && !uuid.trim()) return 'UUID obrigatório para V2Ray';
    return null;
  };

  const prepareCredentials = () => {
    if (showUUIDInput && uuid.trim()) {
      setUUIDApp(uuid.trim());
    }
    if (isHysteria && showUsernameInput && showPasswordInput) {
      if (!password.includes(':')) {
        setPasswordApp(buildHysteriaPassword(username, password));
      } else {
        setPasswordApp(password);
      }
    }
    if (isSSH && showPasswordInput && password.includes(':')) {
      const parsed = parseHysteriaPassword(password);
      setUsernameApp(parsed.username);
      setPasswordApp(parsed.password);
    }
  };

  const connect = () => {
    try {
      setFormError(null);
      setIsTryingToConnect(true);
      const originalPassword = password;
      const originalUsername = username;
      prepareCredentials();
      startConnection();
      if (showUsernameInput || showPasswordInput) {
        setTimeout(() => {
          setPasswordApp(originalPassword);
          setUsernameApp(originalUsername);
        }, 1000);
      }
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

  const handleConnection = () => {
    setFormError(null);

    if (autoConnect.running) {
      autoConnect.cancelTest();
      disconnect();
      return;
    }

    if (isTryingToConnect) {
      disconnect();
      return;
    }

    switch (vpnState) {
      case 'DISCONNECTED':
      case 'AUTH_FAILED':
      case 'NO_NETWORK': {
        const validation = validateForm();
        if (validation) {
          setFormError(validation);
          return;
        }
        if (autoConnect.homeEnabled) {
          try {
            prepareCredentials();
            autoConnect.startHomeAutoConnect();
          } catch (e) {
            setFormError(e instanceof Error ? e.message : 'Falha ao iniciar Auto Conect');
          }
          return;
        }
        connect();
        break;
      }
      case 'CONNECTED':
        disconnect();
        break;
      default:
        break;
    }
  };

  // Texto e estilo do botão baseado no estado
  const getButtonText = () => {
    if (autoConnect.running) {
      return t('connectionForm.cancel');
    }
    if (isTryingToConnect) {
      return t('connectionForm.cancel');
    }
    switch (vpnState) {
      case 'STOPPING':
        return t('connectionForm.stopping');
      case 'CONNECTED':
        return t('connectionForm.connected');
      default:
        return t('connectionForm.disconnected');
    }
  };

  const getButtonStyle = () => {
    if (autoConnect.running || isTryingToConnect) {
      return 'bg-amber-500';
    }
    switch (vpnState) {
      case 'CONNECTED':
        return 'bg-red-500';
      case 'STOPPING':
        return 'bg-orange-500';
      default:
        return 'bg-[var(--accent)]';
    }
  };

  return (
    <>
    <section className="card p-3 md:p-6 xl:p-8 2xl:p-10">
      <div className="space-y-3 md:space-y-4">
        {!hasVisibleCredentialFields && (
          <p className="text-xs lg:text-sm text-center" style={{ color: 'var(--text-muted)' }}>
            {t('connectionForm.credentialsAlreadySet')}
          </p>
        )}
        {showUsernameInput && (
          <div className="relative">
            <input
              className="w-full min-h-[44px] xl:h-12 2xl:h-14 px-3 xl:px-4 rounded-xl input-field outline-none text-sm xl:text-base 2xl:text-lg allow-select"
              type="text"
              autoCapitalize="none"
              placeholder={t('connectionForm.usernamePlaceholder')}
              value={usernameValue}
              onChange={handleUsernameChange}
            />
          </div>
        )}

        {showPasswordInput && (
          <div className="relative">
            <input
              className="w-full min-h-[44px] xl:h-12 2xl:h-14 px-3 xl:px-4 pr-11 rounded-xl input-field outline-none text-sm xl:text-base 2xl:text-lg allow-select"
              type={showPassword ? 'text' : 'password'}
              placeholder={t('connectionForm.passwordPlaceholder')}
              value={passwordValue}
              onChange={handlePasswordChange}
            />
            <button
              className="absolute inset-y-0 right-0 min-w-[44px] flex items-center justify-center touch-manipulation"
              style={{ color: 'var(--text-muted)' }}
              onClick={togglePasswordVisibility}
              type="button"
              aria-label={showPassword ? t('connectionForm.hidePassword') : t('connectionForm.showPassword')}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        )}

        {showUUIDInput && (
          <div className="relative">
            <input
              className="w-full min-h-[44px] xl:h-12 2xl:h-14 px-3 xl:px-4 pr-[5.5rem] rounded-xl input-field outline-none text-sm xl:text-base 2xl:text-lg allow-select"
              type={showUUID ? 'text' : 'password'}
              placeholder={t('connectionForm.uuidPlaceholder')}
              value={uuidValue}
              onChange={handleUUIDChange}
            />
            <button
              className="absolute inset-y-0 right-11 min-w-[44px] flex items-center justify-center touch-manipulation"
              style={{ color: 'var(--text-muted)' }}
              onClick={toggleUUIDVisibility}
              type="button"
              aria-label={showUUID ? t('connectionForm.hideUuid') : t('connectionForm.showUuid')}
            >
              {showUUID ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              className="absolute inset-y-0 right-0 min-w-[44px] flex items-center justify-center touch-manipulation"
              style={{ color: 'var(--text-muted)' }}
              onClick={() => setShowUuidHelp((prev) => !prev)}
              type="button"
              aria-label={t('connectionForm.uuidHelpTitle')}
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            {showUuidHelp && (
              <div
                className="absolute bottom-full right-0 mb-2 w-[min(18rem,calc(100vw-2rem))] text-sm p-3 rounded-xl z-50"
                style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
              >
                <div className="font-bold mb-1" style={{ color: 'var(--text)' }}>{t('connectionForm.uuidHelpTitle')}</div>
                <div className="mb-1">{t('connectionForm.uuidHelpDesc1')}</div>
                <div className="mb-1">{t('connectionForm.uuidHelpDesc2')}</div>
                <div className="mb-1">
                  <span className="font-semibold" style={{ color: 'var(--text)' }}>{t('connectionForm.uuidHelpExample')}</span>
                  <br />
                  <span className="font-mono select-all break-all">
                    {crypto.randomUUID ? crypto.randomUUID() : 'e.g. 123e4567-e89b-12d3-a456-426614174000'}
                  </span>
                </div>
                <div className="font-semibold" style={{ color: 'var(--danger)' }}>{t('connectionForm.uuidHelpWarning')}</div>
              </div>
            )}
          </div>
        )}

        {/* Botão de conexão */}
        <button
          className={`w-full min-h-[44px] xl:h-12 2xl:h-14 text-sm lg:text-base xl:text-lg 2xl:text-xl font-semibold rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center touch-manipulation ${getButtonStyle()}`}
          onClick={handleConnection}
          disabled={vpnState === 'STOPPING'}
          title={`Estado atual: ${vpnState}`}
        >
          {getButtonText()}
        </button>

        {/* Exibição de erro */}
        {formError && (
          <p className="text-red-400 text-xs text-center">{formError}</p>
        )}

        {/* Botões lado a lado: Registros e Auto Conect */}
        <div className="flex gap-2">
          <button
            className="w-1/2 min-h-[44px] xl:h-12 2xl:h-14 flex items-center justify-center gap-1 xl:gap-2 text-xs lg:text-sm xl:text-base 2xl:text-lg font-medium rounded-xl btn-secondary touch-manipulation"
            onClick={() => setShowLogs(true)}
          >
            <Scroll className="w-4 h-4" />
            <span className="font-medium">{t('connectionForm.recordsButton')}</span>
          </button>
          <button
            className="w-1/2 min-h-[44px] xl:h-12 2xl:h-14 flex items-center justify-center gap-1 xl:gap-2 text-xs lg:text-sm xl:text-base 2xl:text-lg font-medium rounded-xl btn-secondary touch-manipulation"
            onClick={autoConnect.openModal}
            type="button"
          >
            <Zap className="w-4 h-4" />
            <span className="font-medium">{t('connectionForm.autoConnectButton')}</span>
          </button>
        </div>
      </div>
    </section>
    {showLogs && <LogsModal onClose={() => setShowLogs(false)} />}
    </>
  );
}

export default memo(ConnectionForm);
