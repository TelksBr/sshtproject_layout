import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Modal } from './modals/Modal';
import type { ConfigItem } from '../types/config';
import {
  Globe,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  ChevronLeft,
  Eye,
  EyeOff,
  HelpCircle,
  Copy,
  Key,
} from '../utils/icons';
import { useAutoConnectContext } from '../context/AutoConnectContext';
import {
  AutoConnectConfig,
  AutoConnectPhase,
  CONNECTION_TIMEOUT_MAX,
  CONNECTION_TIMEOUT_MIN,
  DEFAULT_AUTO_CONNECT_CONFIG,
  FETCH_TIMEOUT_MAX,
  FETCH_TIMEOUT_MIN,
  TIMEOUT_STEP,
  clampTimeout,
  filterConfigsForAutoConnect,
} from '../utils/autoConnectUtils';
import {
  getAllConfigs,
  getUUID,
  setUUID as setUUIDApp,
  getUsername,
  setUsername as setUsernameApp,
  getPassword,
  setPassword as setPasswordApp,
  sanitizeLogHtml,
  vibrate,
} from '../utils/appFunctions';
import {
  getAvailableCountries,
  extractCountryFromText,
  determineInitialCountry,
  AvailableCountry,
} from '../utils/countryUtils';
import { getAutoConnectCredentialFields } from '../utils/configCredentials';
import { readFromClipboard } from '../utils/nativeClipboard';
import { TestLog } from '../hooks/useAutoConnect';
import { useTranslation } from '../i18n';

type WizardStep = 'setup' | 'confirm' | 'run' | 'result';

const PHASE_LABEL: Record<AutoConnectPhase, string> = {
  select: 'Selecionando',
  connecting: 'Conectando',
  wait_vpn: 'Aguardando VPN',
  check_internet: 'Testando internet',
  next: 'Falhou, próxima',
};

const TYPE_LABEL: Record<AutoConnectConfig['configType'], string> = {
  all: 'Todas (SSH + V2Ray)',
  ssh: 'SSH / Proxy',
  v2ray: 'V2Ray',
};

function formatDuration(ms: unknown) {
  const num = Number(ms);
  if (!Number.isFinite(num) || num < 0) return '0.0s';
  return `${(num / 1000).toFixed(1)}s`;
}

function formatTime(date: unknown) {
  try {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date as any);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '';
  }
}

export function AutoConnectModal() {
  const { t, country: currentI18nCountry } = useTranslation();
  const {
    open,
    closeModal,
    currentName,
    phase,
    total,
    tested,
    success,
    running,
    cancelled,
    error,
    logs,
    failedNames,
    currentTestDuration,
    startAutoConnect,
    cancelTest,
    autoConnectConfig,
    setAutoConnectConfig,
  } = useAutoConnectContext();

  const [step, setStep] = useState<WizardStep>('setup');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const logsEndRef = useRef<HTMLDivElement | null>(null);
  const wasRunningRef = useRef(false);

  // Estados locais para credenciais
  const [username, setUsername] = useState(() => {
    try {
      return getUsername() || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState(() => {
    try {
      return getPassword() || '';
    } catch {
      return '';
    }
  });
  const [uuid, setUuid] = useState(() => {
    try {
      return getUUID() || '';
    } catch {
      return '';
    }
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  const allCategories = useMemo(() => {
    try {
      const res = getAllConfigs();
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  }, [open]);

  const {
    countries: availableCountries,
    hasOtherWithoutFlag,
    totalConfigs: totalConfigsCount,
  } = useMemo(() => {
    try {
      return getAvailableCountries(allCategories);
    } catch {
      return { countries: [], hasOtherWithoutFlag: false, totalCategories: 0, totalConfigs: 0 };
    }
  }, [allCategories]);

  // Região ativa (auto-detectada com base no país do app/WebView ou salva)
  const activeCountry = useMemo(() => {
    try {
      if (autoConnectConfig?.selectedCountry) {
        return autoConnectConfig.selectedCountry;
      }
      if (currentI18nCountry && availableCountries.some((c) => c?.code === currentI18nCountry)) {
        return currentI18nCountry;
      }
      const initial = determineInitialCountry(availableCountries, hasOtherWithoutFlag);
      return initial || 'all';
    } catch {
      return 'all';
    }
  }, [autoConnectConfig?.selectedCountry, currentI18nCountry, availableCountries, hasOtherWithoutFlag]);

  const activeCountryObj = useMemo(() => {
    if (activeCountry === 'all' || !activeCountry) return null;
    return availableCountries.find((c) => c?.code === activeCountry) || null;
  }, [activeCountry, availableCountries]);

  const activeCountryDisplayName = useMemo(() => {
    if (!activeCountryObj) {
      return activeCountry === 'OTHER' ? (t('countryFilter.other') || 'Outros') : (t('autoConnect.allRegions') || 'Todas as Regiões');
    }
    return `${activeCountryObj.flag || '🌐'} ${activeCountryObj.name || activeCountry}`;
  }, [activeCountryObj, activeCountry, t]);

  const visibleCategories = useMemo(() => {
    if (!Array.isArray(allCategories)) return [];
    if (!activeCountry || activeCountry === 'all') {
      return allCategories;
    }
    return allCategories.filter((cat) => {
      if (!cat) return false;
      const extracted = extractCountryFromText(cat.name);
      if (activeCountry === 'OTHER') {
        return !extracted;
      }
      return extracted?.code === activeCountry;
    });
  }, [allCategories, activeCountry]);

  const filteredConfigs = useMemo(() => {
    try {
      const flat = (allCategories || []).flatMap((cat) =>
        Array.isArray(cat?.items)
          ? cat.items
              .filter((item): item is ConfigItem => Boolean(item && typeof item === 'object'))
              .map((item) => ({ ...item, category_id: cat.id, categoryName: cat.name }))
          : []
      );
      return filterConfigsForAutoConnect(flat, {
        ...(autoConnectConfig || DEFAULT_AUTO_CONNECT_CONFIG),
        selectedCountry: activeCountry,
      }, allCategories);
    } catch (e) {
      console.error('Error filtering configs in modal:', e);
      return [];
    }
  }, [allCategories, autoConnectConfig, activeCountry]);

  const filteredCount = filteredConfigs.length;

  const requiredCredentials = useMemo(() => {
    try {
      return getAutoConnectCredentialFields(filteredConfigs);
    } catch {
      return { username: false, password: false, uuid: false };
    }
  }, [filteredConfigs]);

  const updateConfig = useCallback((updates: Partial<AutoConnectConfig>) => {
    if (running) return;
    setValidationError(null);
    setAutoConnectConfig({ ...(autoConnectConfig || DEFAULT_AUTO_CONNECT_CONFIG), ...updates });
  }, [running, autoConnectConfig, setAutoConnectConfig]);

  const handleCountryChange = useCallback((countryCode: string) => {
    if (running) return;
    try {
      vibrate(20);
    } catch {
      /* ignore */
    }
    updateConfig({
      selectedCountry: countryCode,
      selectedCategories: [], // Limpa filtros manuais de categoria para testar toda a região escolhida
    });
  }, [running, updateConfig]);

  const toggleCategory = useCallback((categoryId: number) => {
    if (running) return;
    setValidationError(null);
    const current = Array.isArray(autoConnectConfig?.selectedCategories)
      ? autoConnectConfig.selectedCategories
      : [];
    const updated = current.includes(categoryId)
      ? current.filter((id) => id !== categoryId)
      : [...current, categoryId];
    updateConfig({ selectedCategories: updated });
  }, [running, autoConnectConfig?.selectedCategories, updateConfig]);

  const handleUsernameChange = useCallback((val: string) => {
    setUsername(val);
    try {
      setUsernameApp(val);
    } catch {
      /* ignore */
    }
    setValidationError(null);
  }, []);

  const handlePasswordChange = useCallback((val: string) => {
    setPassword(val);
    try {
      setPasswordApp(val);
    } catch {
      /* ignore */
    }
    setValidationError(null);
  }, []);

  const handleUuidChange = useCallback((val: string) => {
    setUuid(val);
    try {
      setUUIDApp(val);
    } catch {
      /* ignore */
    }
    setValidationError(null);
  }, []);

  const validateCredentials = useCallback((): boolean => {
    if (requiredCredentials.username && !username.trim()) {
      setValidationError('Informe o Usuário para testar as configurações SSH.');
      return false;
    }
    if (requiredCredentials.password && !password.trim()) {
      setValidationError('Informe a Senha para testar as configurações SSH.');
      return false;
    }
    if (requiredCredentials.uuid && !uuid.trim()) {
      setValidationError('Informe o UUID V2Ray para testar as configurações V2Ray.');
      return false;
    }
    setValidationError(null);
    return true;
  }, [requiredCredentials, username, password, uuid]);

  const handleContinue = useCallback(() => {
    if (filteredCount === 0) return;
    if (!validateCredentials()) return;
    setStep('confirm');
  }, [filteredCount, validateCredentials]);

  const selectedCategoryNames = useMemo(() => {
    const selected = autoConnectConfig?.selectedCategories;
    if (!Array.isArray(selected) || selected.length === 0) {
      return activeCountry !== 'all'
        ? `${t('autoConnect.allCategories')} (${activeCountryDisplayName})`
        : t('autoConnect.allCategories');
    }
    return (
      (allCategories || [])
        .filter((c) => c && selected.includes(c.id))
        .map((c) => c.name)
        .join(', ') || t('autoConnect.allCategories')
    );
  }, [autoConnectConfig?.selectedCategories, allCategories, activeCountry, activeCountryDisplayName, t]);

  const title =
    step === 'setup'
      ? (t('autoConnect.modalTitle') || 'Filtros e Acesso')
      : step === 'confirm'
        ? (t('autoConnect.confirmTitle') || 'Confirmar Teste')
        : step === 'run'
          ? `Testando ${tested}/${total}`
          : success
            ? 'Pronto'
            : 'Resultado';

  const handleStart = useCallback(() => {
    if (!validateCredentials()) {
      setStep('setup');
      return;
    }
    try {
      if (requiredCredentials.uuid && uuid.trim()) setUUIDApp(uuid.trim());
      if (requiredCredentials.username && username.trim()) setUsernameApp(username.trim());
      if (requiredCredentials.password && password.trim()) setPasswordApp(password.trim());
    } catch {
      /* ignore */
    }
    startAutoConnect({ selectedCountry: activeCountry });
  }, [validateCredentials, requiredCredentials, uuid, username, password, startAutoConnect, activeCountry]);

  // Recarrega credenciais e sincroniza país inicial ao abrir o modal
  useEffect(() => {
    if (open) {
      try {
        setUsername(getUsername() || '');
        setPassword(getPassword() || '');
        setUuid(getUUID() || '');
      } catch {
        /* ignore */
      }
      setValidationError(null);
      setStep(running ? 'run' : 'setup');

      if (!autoConnectConfig?.selectedCountry) {
        updateConfig({ selectedCountry: activeCountry });
      }
    }
  }, [open, running, activeCountry, autoConnectConfig?.selectedCountry, updateConfig]);

  useEffect(() => {
    if (running) {
      wasRunningRef.current = true;
      setStep('run');
      return;
    }
    if (wasRunningRef.current && !running) {
      wasRunningRef.current = false;
      setStep('result');
    }
  }, [running]);

  useEffect(() => {
    if (step !== 'run') return;
    try {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch {
      try {
        logsEndRef.current?.scrollIntoView();
      } catch {
        /* ignore */
      }
    }
  }, [logs, step]);

  if (!open) return null;

  return (
    <Modal onClose={closeModal} title={title} icon={Zap}>
      <div className="flex flex-col min-h-[320px] p-3 sm:p-4">
        {step === 'setup' && (
          <SetupStep
            autoConnectConfig={autoConnectConfig}
            updateConfig={updateConfig}
            toggleCategory={toggleCategory}
            visibleCategories={visibleCategories}
            availableCountries={availableCountries}
            activeCountry={activeCountry}
            activeCountryDisplayName={activeCountryDisplayName}
            hasOtherWithoutFlag={hasOtherWithoutFlag}
            totalConfigsCount={totalConfigsCount}
            onCountryChange={handleCountryChange}
            filteredCount={filteredCount}
            showAdvanced={showAdvanced}
            setShowAdvanced={setShowAdvanced}
            username={username}
            password={password}
            uuid={uuid}
            requiredCredentials={requiredCredentials}
            validationError={validationError}
            onUsernameChange={handleUsernameChange}
            onPasswordChange={handlePasswordChange}
            onUuidChange={handleUuidChange}
            onContinue={handleContinue}
          />
        )}

        {step === 'confirm' && (
          <ConfirmStep
            typeLabel={TYPE_LABEL[autoConnectConfig.configType]}
            categoriesLabel={selectedCategoryNames}
            regionLabel={activeCountryDisplayName}
            connectionTimeout={autoConnectConfig.connectionTimeout}
            fetchTimeout={autoConnectConfig.fetchTimeout}
            filteredCount={filteredCount}
            requiredCredentials={requiredCredentials}
            username={username}
            password={password}
            uuid={uuid}
            onBack={() => setStep('setup')}
            onStart={handleStart}
          />
        )}

        {step === 'run' && (
          <RunStep
            currentName={currentName}
            phase={phase}
            tested={tested}
            total={total}
            duration={currentTestDuration}
            logs={logs}
            logsEndRef={logsEndRef}
            onCancel={cancelTest}
          />
        )}

        {step === 'result' && (
          <ResultStep
            success={success}
            cancelled={cancelled}
            error={error}
            failedNames={failedNames}
            logs={logs}
            onClose={closeModal}
            onRetry={() => {
              startAutoConnect({ selectedCountry: activeCountry });
            }}
            onAdjust={() => setStep('setup')}
          />
        )}
      </div>
    </Modal>
  );
}

function TimeoutSlider({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const clamped = clampTimeout(value, min, max);
  const progress = ((clamped - min) / (max - min)) * 100;

  return (
    <div
      className="rounded-xl px-3 py-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-sm text-[var(--text)]">{label}</span>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
          style={{ background: 'var(--accent)' }}
        >
          {(clamped / 1000).toFixed(0)}s
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={TIMEOUT_STEP}
        value={clamped}
        onChange={(e) => onChange(clampTimeout(parseInt(e.target.value, 10), min, max))}
        className="layout-range w-full touch-manipulation"
        style={{ ['--range-progress' as string]: `${progress}%` }}
        aria-label={label}
      />
      <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)] mt-0.5">
        <span>{min / 1000}s</span>
        <span className="opacity-80">{hint}</span>
        <span>{max / 1000}s</span>
      </div>
    </div>
  );
}

function SetupStep({
  autoConnectConfig,
  updateConfig,
  toggleCategory,
  visibleCategories,
  availableCountries,
  activeCountry,
  activeCountryDisplayName,
  hasOtherWithoutFlag,
  totalConfigsCount,
  onCountryChange,
  filteredCount,
  showAdvanced,
  setShowAdvanced,
  username,
  password,
  uuid,
  requiredCredentials,
  validationError,
  onUsernameChange,
  onPasswordChange,
  onUuidChange,
  onContinue,
}: {
  autoConnectConfig: AutoConnectConfig;
  updateConfig: (u: Partial<AutoConnectConfig>) => void;
  toggleCategory: (id: number) => void;
  visibleCategories: ReturnType<typeof getAllConfigs>;
  availableCountries: AvailableCountry[];
  activeCountry: string;
  activeCountryDisplayName: string;
  hasOtherWithoutFlag: boolean;
  totalConfigsCount: number;
  onCountryChange: (code: string) => void;
  filteredCount: number;
  showAdvanced: boolean;
  setShowAdvanced: (v: boolean) => void;
  username: string;
  password: string;
  uuid: string;
  requiredCredentials: { username: boolean; password: boolean; uuid: boolean };
  validationError: string | null;
  onUsernameChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onUuidChange: (v: string) => void;
  onContinue: () => void;
}) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [showUuid, setShowUuid] = useState(false);
  const [showUuidHelp, setShowUuidHelp] = useState(false);

  const handlePasteUuid = async () => {
    try {
      const text = await readFromClipboard();
      if (text && text.trim()) {
        onUuidChange(text.trim());
      }
    } catch {
      /* silent fallback */
    }
  };

  const hasAnyRequired = requiredCredentials.username || requiredCredentials.password || requiredCredentials.uuid;

  return (
    <div className="flex flex-col gap-4 flex-1">
      {/* 1. Filtro de Região / País com auto-aplicação */}
      {availableCountries.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <Globe className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
              <span>{t('autoConnect.regionFilter')}</span>
              {activeCountry !== 'all' && (
                <span className="text-[10px] lowercase font-normal opacity-75">
                  ({t('countryFilter.filtered')})
                </span>
              )}
            </p>
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {activeCountryDisplayName}
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar touch-manipulation">
            {/* Botão "Todas as Regiões" */}
            <button
              type="button"
              onClick={() => onCountryChange('all')}
              className="flex-shrink-0 min-h-[38px] px-3 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all touch-manipulation"
              style={{
                background: activeCountry === 'all' ? 'var(--accent)' : 'var(--bg-elevated)',
                color: activeCountry === 'all' ? '#ffffff' : 'var(--text-muted)',
                border: activeCountry === 'all' ? '1px solid var(--accent)' : '1px solid var(--border)',
              }}
            >
              <span className="text-sm">🌐</span>
              <span>{t('autoConnect.allRegions')}</span>
              <span className="text-[10px] opacity-75">({totalConfigsCount})</span>
            </button>

            {/* Países disponíveis */}
            {availableCountries.map((c) => {
              const isSelected = activeCountry === c.code;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => onCountryChange(c.code)}
                  className="flex-shrink-0 min-h-[38px] px-3 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all touch-manipulation"
                  style={{
                    background: isSelected ? 'var(--accent)' : 'var(--bg-elevated)',
                    color: isSelected ? '#ffffff' : 'var(--text)',
                    border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                  }}
                >
                  <span className="text-base leading-none">{c.flag}</span>
                  <span>{c.name}</span>
                  <span className="text-[10px] opacity-75">({c.configCount})</span>
                </button>
              );
            })}

            {hasOtherWithoutFlag && (
              <button
                type="button"
                onClick={() => onCountryChange('OTHER')}
                className="flex-shrink-0 min-h-[38px] px-3 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all touch-manipulation"
                style={{
                  background: activeCountry === 'OTHER' ? 'var(--accent)' : 'var(--bg-elevated)',
                  color: activeCountry === 'OTHER' ? '#ffffff' : 'var(--text-muted)',
                  border: activeCountry === 'OTHER' ? '1px solid var(--accent)' : '1px solid var(--border)',
                }}
              >
                <span>🏳️</span>
                <span>{t('countryFilter.other')}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Tipo de configuração (SSH / V2Ray / Todas) */}
      <div>
        <p className="text-xs mb-2 font-medium" style={{ color: 'var(--text-muted)' }}>{t('autoConnect.configTypeLabel')}</p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { value: 'all', label: t('autoConnect.typeAll') },
              { value: 'ssh', label: t('autoConnect.typeSsh') },
              { value: 'v2ray', label: t('autoConnect.typeV2ray') },
            ] as const
          ).map((opt) => {
            const isSelected = autoConnectConfig.configType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateConfig({ configType: opt.value })}
                className={`min-h-[44px] px-4 rounded-full text-sm font-semibold touch-manipulation transition-all`}
                style={{
                  background: isSelected ? 'var(--accent)' : 'var(--bg-elevated)',
                  color: isSelected ? '#ffffff' : 'var(--text-muted)',
                  border: '1px solid var(--border)',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Categorias da Região */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{t('autoConnect.categoriesFilter')}</p>
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {visibleCategories.length} {visibleCategories.length === 1 ? 'categoria' : 'categorias'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => updateConfig({ selectedCategories: [] })}
          className={`w-full min-h-[44px] mb-2 px-3 rounded-xl text-left text-sm font-semibold touch-manipulation transition-all flex items-center justify-between`}
          style={{
            background: (autoConnectConfig?.selectedCategories || []).length === 0 ? 'var(--accent)' : 'var(--bg-elevated)',
            color: (autoConnectConfig?.selectedCategories || []).length === 0 ? '#ffffff' : 'var(--text)',
            border: '1px solid var(--border)',
          }}
        >
          <span>
            {activeCountry !== 'all'
              ? t('autoConnect.allCategoriesInRegion', { region: activeCountryDisplayName })
              : t('autoConnect.allCategories')}
          </span>
          <span className="text-xs opacity-80">
            {visibleCategories.reduce((acc, cat) => acc + (Array.isArray(cat?.items) ? cat.items.length : 0), 0)} configs
          </span>
        </button>

        {visibleCategories.length === 0 ? (
          <div className="py-4 text-center text-xs opacity-75" style={{ color: 'var(--text-muted)' }}>
            {t('autoConnect.noConfigsFound')}
          </div>
        ) : (
          <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
            {visibleCategories.map((category) => {
              if (!category) return null;
              const selected = Array.isArray(autoConnectConfig?.selectedCategories) && autoConnectConfig.selectedCategories.includes(category.id);
              const count = Array.isArray(category?.items) ? category.items.length : 0;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className={`w-full min-h-[44px] px-3 rounded-xl text-left text-sm flex items-center gap-2 touch-manipulation transition-all`}
                  style={{
                    background: selected ? 'var(--accent)' : 'var(--bg-elevated)',
                    color: selected ? '#ffffff' : 'var(--text)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <span
                    className={`flex-shrink-0 w-4 h-4 rounded border ${
                      selected ? 'bg-white border-white' : 'border-[var(--text-muted)]'
                    }`}
                  />
                  <span className="flex-1 truncate">{category.name}</span>
                  <span className="text-xs opacity-75">{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Seção de Credenciais de Acesso */}
      {hasAnyRequired ? (
        <div className="p-3 rounded-xl space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text)' }}>
              Credenciais de Acesso
            </span>
          </div>

          {requiredCredentials.username && (
            <div>
              <label className="text-[11px] mb-1 block font-medium" style={{ color: 'var(--text-muted)' }}>Usuário SSH</label>
              <input
                type="text"
                value={username}
                onChange={(e) => onUsernameChange(e.target.value)}
                placeholder="Digite seu usuário..."
                className="w-full min-h-[44px] px-3 rounded-xl text-sm outline-none allow-select"
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                }}
                autoCapitalize="none"
              />
            </div>
          )}

          {requiredCredentials.password && (
            <div>
              <label className="text-[11px] mb-1 block font-medium" style={{ color: 'var(--text-muted)' }}>Senha SSH</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  placeholder="Digite sua senha..."
                  className="w-full min-h-[44px] px-3 pr-11 rounded-xl text-sm outline-none allow-select"
                  style={{
                    background: 'var(--bg-elevated)',
                    color: 'var(--text)',
                    border: '1px solid var(--border)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 min-w-[44px] flex items-center justify-center touch-manipulation"
                  style={{ color: 'var(--text-muted)' }}
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {requiredCredentials.uuid && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>UUID V2Ray</label>
                <button
                  type="button"
                  onClick={() => setShowUuidHelp(!showUuidHelp)}
                  className="text-[11px] hover:underline flex items-center gap-1 touch-manipulation font-semibold"
                  style={{ color: 'var(--accent)' }}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Ajuda
                </button>
              </div>

              {showUuidHelp && (
                <div className="mb-2 p-2.5 rounded-xl text-xs space-y-1" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <p className="font-semibold" style={{ color: 'var(--text)' }}>Chave de acesso V2Ray</p>
                  <p>É o código identificador gerado na compra para conectar em servidores V2Ray/VMess/VLess.</p>
                </div>
              )}

              <div className="relative">
                <input
                  type={showUuid ? 'text' : 'password'}
                  value={uuid}
                  onChange={(e) => onUuidChange(e.target.value)}
                  placeholder="Cole seu UUID V2Ray..."
                  className="w-full min-h-[44px] px-3 pr-20 rounded-xl text-sm outline-none font-mono allow-select"
                  style={{
                    background: 'var(--bg-elevated)',
                    color: 'var(--text)',
                    border: '1px solid var(--border)',
                  }}
                  autoCapitalize="none"
                />
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <button
                    type="button"
                    onClick={handlePasteUuid}
                    title="Colar UUID"
                    className="min-w-[36px] h-full flex items-center justify-center touch-manipulation"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUuid(!showUuid)}
                    className="min-w-[36px] h-full flex items-center justify-center touch-manipulation"
                    style={{ color: 'var(--text-muted)' }}
                    aria-label={showUuid ? 'Ocultar UUID' : 'Exibir UUID'}
                  >
                    {showUuid ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : filteredCount > 0 ? (
        <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-400 font-medium">
          <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>As configurações selecionadas já possuem credenciais pré-configuradas.</span>
        </div>
      ) : null}

      {validationError && (
        <p className="text-xs text-rose-400 text-center font-medium bg-rose-500/15 p-2.5 rounded-xl border border-rose-500/30">
          {validationError}
        </p>
      )}

      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs underline touch-manipulation min-h-[32px] font-medium"
          style={{ color: 'var(--text-muted)' }}
        >
          {showAdvanced ? 'Ocultar tempos' : 'Ajustar tempos (avançado)'}
        </button>
        {showAdvanced && (
          <div className="mt-3 space-y-3">
            <TimeoutSlider
              label="Timeout de conexão"
              hint="Tempo para a VPN conectar"
              value={autoConnectConfig.connectionTimeout}
              min={CONNECTION_TIMEOUT_MIN}
              max={CONNECTION_TIMEOUT_MAX}
              onChange={(v) => updateConfig({ connectionTimeout: v })}
            />
            <TimeoutSlider
              label="Timeout de internet"
              hint="Tempo para testar a internet"
              value={autoConnectConfig.fetchTimeout}
              min={FETCH_TIMEOUT_MIN}
              max={FETCH_TIMEOUT_MAX}
              onChange={(v) => updateConfig({ fetchTimeout: v })}
            />
          </div>
        )}
      </div>

      <div className="mt-auto pt-2">
        <p className="text-sm mb-2 text-center font-medium" style={{ color: 'var(--text-muted)' }}>
          {t('autoConnect.configsToTest', { count: filteredCount })}
        </p>
        <button
          type="button"
          disabled={filteredCount === 0}
          onClick={onContinue}
          className="w-full min-h-[48px] rounded-xl text-white font-bold text-sm disabled:opacity-40 touch-manipulation transition-all active:scale-[0.98]"
          style={{ background: 'var(--accent)' }}
        >
          {t('common.confirm') || 'Continuar'}
        </button>
      </div>
    </div>
  );
}

function ConfirmStep({
  typeLabel,
  categoriesLabel,
  regionLabel,
  connectionTimeout,
  fetchTimeout,
  filteredCount,
  requiredCredentials,
  username,
  password,
  uuid,
  onBack,
  onStart,
}: {
  typeLabel: string;
  categoriesLabel: string;
  regionLabel: string;
  connectionTimeout: number;
  fetchTimeout: number;
  filteredCount: number;
  requiredCredentials: { username: boolean; password: boolean; uuid: boolean };
  username: string;
  password: string;
  uuid: string;
  onBack: () => void;
  onStart: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4 flex-1">
      <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Confira antes de iniciar:</p>
      <ul className="space-y-2 text-sm rounded-xl p-3.5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
        <li>
          <span style={{ color: 'var(--text-muted)' }}>{t('autoConnect.regionLabel')} </span>
          <strong>{regionLabel}</strong>
        </li>
        <li>
          <span style={{ color: 'var(--text-muted)' }}>Tipo: </span>
          <strong>{typeLabel}</strong>
        </li>
        <li>
          <span style={{ color: 'var(--text-muted)' }}>Categorias: </span>
          <strong>{categoriesLabel}</strong>
        </li>
        <li>
          <span style={{ color: 'var(--text-muted)' }}>Timeout VPN: </span>
          <strong>{connectionTimeout / 1000}s</strong>
        </li>
        <li>
          <span style={{ color: 'var(--text-muted)' }}>Timeout internet: </span>
          <strong>{fetchTimeout / 1000}s</strong>
        </li>
        <li>
          <span style={{ color: 'var(--text-muted)' }}>Total: </span>
          <strong>{filteredCount} configs</strong>
        </li>
        {requiredCredentials.username && (
          <li>
            <span style={{ color: 'var(--text-muted)' }}>Usuário SSH: </span>
            <span className="font-mono font-bold" style={{ color: 'var(--text)' }}>{username || 'Não informado'}</span>
          </li>
        )}
        {requiredCredentials.password && (
          <li>
            <span style={{ color: 'var(--text-muted)' }}>Senha SSH: </span>
            <span className="font-bold" style={{ color: 'var(--text)' }}>{password ? '••••••••' : 'Não informada'}</span>
          </li>
        )}
        {requiredCredentials.uuid && (
          <li>
            <span style={{ color: 'var(--text-muted)' }}>UUID V2Ray: </span>
            <span className="font-mono font-bold" style={{ color: 'var(--text)' }}>{uuid ? `${uuid.substring(0, 8)}...` : 'Não informado'}</span>
          </li>
        )}
        {!requiredCredentials.username && !requiredCredentials.password && !requiredCredentials.uuid && (
          <li>
            <span style={{ color: 'var(--text-muted)' }}>Credenciais: </span>
            <span className="text-emerald-400 font-bold">Pré-configuradas na config</span>
          </li>
        )}
      </ul>

      <div className="mt-auto flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[48px] px-4 rounded-xl font-semibold text-sm flex items-center gap-1 touch-manipulation transition-all active:scale-[0.98]"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text)', border: '1px solid var(--border)' }}
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar
        </button>
        <button
          type="button"
          onClick={onStart}
          className="flex-1 min-h-[48px] rounded-xl text-white font-bold text-sm touch-manipulation transition-all active:scale-[0.98]"
          style={{ background: 'var(--accent)' }}
        >
          Iniciar teste
        </button>
      </div>
    </div>
  );
}

function RunStep({
  currentName,
  phase,
  tested,
  total,
  duration,
  logs,
  logsEndRef,
  onCancel,
}: {
  currentName: string | null;
  phase: AutoConnectPhase | null;
  tested: number;
  total: number;
  duration: number;
  logs: TestLog[];
  logsEndRef: React.RefObject<HTMLDivElement | null>;
  onCancel: () => void;
}) {
  const pct = total > 0 ? Math.min(100, (tested / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-3 flex-1 min-h-0">
      <div className="rounded-xl p-3.5 space-y-2" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{currentName || 'Preparando…'}</p>
        <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--text-muted)' }}>
          {phase ? PHASE_LABEL[phase] : 'Iniciando'} · {formatDuration(duration)}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <div
              className="h-full transition-all rounded-full"
              style={{ width: `${pct}%`, background: 'var(--accent)' }}
            />
          </div>
          <span className="text-xs font-mono font-bold" style={{ color: 'var(--text)' }}>
            {tested}/{total}
          </span>
        </div>
      </div>

      <div
        className="flex-1 min-h-[240px] max-h-[380px] sm:max-h-[460px] overflow-y-auto rounded-xl p-3 font-mono text-[11px] custom-scrollbar space-y-1"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
      >
        {logs.map((log) => (
          <LogLine key={log.id} log={log} />
        ))}
        <div ref={logsEndRef} />
      </div>

      <button
        type="button"
        onClick={onCancel}
        className="w-full min-h-[48px] rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm flex items-center justify-center gap-2 touch-manipulation transition-all active:scale-[0.98]"
      >
        <XCircle className="w-4 h-4" />
        Parar
      </button>
    </div>
  );
}

function LogLine({ log }: { log: TestLog }) {
  if (!log) return null;
  const sanitizedMessage = sanitizeLogHtml(log.message || '');
  const prefix = log.configName ? `<strong style="color: var(--text)" class="font-semibold">${log.configName}: </strong>` : '';

  return (
    <div className="flex items-start gap-2 py-0.5 leading-snug" style={{ color: 'var(--text-muted)' }}>
      <span className="shrink-0 font-mono select-none text-[10px] opacity-70" style={{ color: 'var(--text-muted)' }}>{formatTime(log.timestamp)}</span>
      <span
        className="break-words whitespace-pre-wrap flex-1 allow-select font-mono text-[11px]"
        style={{ color: 'var(--text)' }}
        dangerouslySetInnerHTML={{ __html: prefix + sanitizedMessage }}
      />
    </div>
  );
}

function ResultStep({
  success,
  cancelled,
  error,
  failedNames,
  logs,
  onClose,
  onRetry,
  onAdjust,
}: {
  success: string | null;
  cancelled: boolean;
  error: string | null;
  failedNames: string[];
  logs: TestLog[];
  onClose: () => void;
  onRetry: () => void;
  onAdjust: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 flex-1">
      {success ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 p-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1 text-sm">
            <CheckCircle className="w-5 h-5" />
            Conexão ativa
          </div>
          <p className="font-mono text-xs break-all font-semibold" style={{ color: 'var(--text)' }}>{success}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/15 p-4">
          <div className="flex items-center gap-2 text-rose-400 font-bold mb-1 text-sm">
            <AlertCircle className="w-5 h-5" />
            {cancelled ? 'Teste cancelado' : error || 'Nenhuma configuração funcionou'}
          </div>
          {failedNames.length > 0 && (
            <ul className="mt-2 text-xs space-y-1 max-h-24 overflow-y-auto custom-scrollbar" style={{ color: 'var(--text-muted)' }}>
              {failedNames.slice(0, 8).map((name) => (
                <li key={name} className="truncate">
                  {name}
                </li>
              ))}
              {failedNames.length > 8 && <li>+{failedNames.length - 8} outras</li>}
            </ul>
          )}
        </div>
      )}

      {logs.length > 0 && (
        <div
          className="max-h-56 sm:max-h-72 overflow-y-auto rounded-xl p-3 font-mono text-[11px] custom-scrollbar space-y-1"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
        >
          {logs.slice(-40).map((log) => (
            <LogLine key={log.id} log={log} />
          ))}
        </div>
      )}

      <div className="mt-auto flex flex-col gap-2">
        {success ? (
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[48px] rounded-xl text-white font-bold text-sm touch-manipulation transition-all active:scale-[0.98]"
            style={{ background: 'var(--accent)' }}
          >
            Fechar
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onRetry}
              className="w-full min-h-[48px] rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 touch-manipulation transition-all active:scale-[0.98]"
              style={{ background: 'var(--accent)' }}
            >
              <RefreshCw className="w-4 h-4" />
              Testar de novo
            </button>
            <button
              type="button"
              onClick={onAdjust}
              className="w-full min-h-[48px] rounded-xl font-semibold text-sm touch-manipulation transition-all active:scale-[0.98]"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text)', border: '1px solid var(--border)' }}
            >
              Ajustar filtros
            </button>
          </>
        )}
      </div>
    </div>
  );
}
