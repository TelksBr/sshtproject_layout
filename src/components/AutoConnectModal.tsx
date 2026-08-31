import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Modal } from './modals/Modal';
import {
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
} from '../utils/appFunctions';
import { getAutoConnectCredentialFields } from '../utils/configCredentials';
import { readFromClipboard } from '../utils/nativeClipboard';
import { TestLog } from '../hooks/useAutoConnect';

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

function formatDuration(ms: number) {
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function AutoConnectModal() {
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
  const [username, setUsername] = useState(() => getUsername() || '');
  const [password, setPassword] = useState(() => getPassword() || '');
  const [uuid, setUuid] = useState(() => getUUID() || '');
  const [validationError, setValidationError] = useState<string | null>(null);

  const allCategories = useMemo(() => getAllConfigs(), [open]);

  const filteredConfigs = useMemo(() => {
    const flat = allCategories.flatMap((cat) =>
      cat.items.map((item) => ({ ...item, category_id: cat.id }))
    );
    return filterConfigsForAutoConnect(flat, autoConnectConfig);
  }, [allCategories, autoConnectConfig]);

  const filteredCount = filteredConfigs.length;

  const requiredCredentials = useMemo(() => {
    return getAutoConnectCredentialFields(filteredConfigs);
  }, [filteredConfigs]);

  // Recarrega credenciais do SDK quando o modal é aberto
  useEffect(() => {
    if (open) {
      setUsername(getUsername() || '');
      setPassword(getPassword() || '');
      setUuid(getUUID() || '');
      setValidationError(null);
      setStep(running ? 'run' : 'setup');
    }
  }, [open, running]);

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
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, step]);

  if (!open) return null;

  const updateConfig = (updates: Partial<AutoConnectConfig>) => {
    if (running) return;
    setValidationError(null);
    setAutoConnectConfig({ ...autoConnectConfig, ...updates });
  };

  const toggleCategory = (categoryId: number) => {
    if (running) return;
    setValidationError(null);
    const current = autoConnectConfig.selectedCategories;
    const updated = current.includes(categoryId)
      ? current.filter((id) => id !== categoryId)
      : [...current, categoryId];
    updateConfig({ selectedCategories: updated });
  };

  const handleUsernameChange = (val: string) => {
    setUsername(val);
    setUsernameApp(val);
    setValidationError(null);
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    setPasswordApp(val);
    setValidationError(null);
  };

  const handleUuidChange = (val: string) => {
    setUuid(val);
    setUUIDApp(val);
    setValidationError(null);
  };

  const validateCredentials = (): boolean => {
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
  };

  const handleContinue = () => {
    if (filteredCount === 0) return;
    if (!validateCredentials()) return;
    setStep('confirm');
  };

  const selectedCategoryNames =
    autoConnectConfig.selectedCategories.length === 0
      ? 'Todas'
      : allCategories
          .filter((c) => autoConnectConfig.selectedCategories.includes(c.id))
          .map((c) => c.name)
          .join(', ') || 'Todas';

  const title =
    step === 'setup'
      ? 'Filtros e Acesso'
      : step === 'confirm'
        ? 'Confirmar Teste'
        : step === 'run'
          ? `Testando ${tested}/${total}`
          : success
            ? 'Pronto'
            : 'Resultado';

  const handleStart = () => {
    if (!validateCredentials()) {
      setStep('setup');
      return;
    }
    if (requiredCredentials.uuid && uuid.trim()) setUUIDApp(uuid.trim());
    if (requiredCredentials.username && username.trim()) setUsernameApp(username.trim());
    if (requiredCredentials.password && password.trim()) setPasswordApp(password.trim());
    startAutoConnect();
  };

  return (
    <Modal onClose={closeModal} title={title} icon={Zap}>
      <div className="flex flex-col min-h-[320px] p-3 sm:p-4">
        {step === 'setup' && (
          <SetupStep
            autoConnectConfig={autoConnectConfig}
            updateConfig={updateConfig}
            toggleCategory={toggleCategory}
            categories={allCategories}
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
              startAutoConnect();
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
  categories,
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
  categories: ReturnType<typeof getAllConfigs>;
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
      <div>
        <p className="text-xs text-[#b7abc9]/70 mb-2 font-medium">Tipo de configuração</p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { value: 'all', label: 'Todas' },
              { value: 'ssh', label: 'SSH' },
              { value: 'v2ray', label: 'V2Ray' },
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

      <div>
        <p className="text-xs mb-2 font-medium" style={{ color: 'var(--text-muted)' }}>Categorias</p>
        <button
          type="button"
          onClick={() => updateConfig({ selectedCategories: [] })}
          className={`w-full min-h-[44px] mb-2 px-3 rounded-xl text-left text-sm font-semibold touch-manipulation transition-all`}
          style={{
            background: autoConnectConfig.selectedCategories.length === 0 ? 'var(--accent)' : 'var(--bg-elevated)',
            color: autoConnectConfig.selectedCategories.length === 0 ? '#ffffff' : 'var(--text)',
            border: '1px solid var(--border)',
          }}
        >
          Todas as categorias
        </button>
        <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
          {categories.map((category) => {
            const selected = autoConnectConfig.selectedCategories.includes(category.id);
            const count = category.items.length;
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
        <div className="p-2.5 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2 text-xs text-green-300">
          <CheckCircle className="w-4 h-4 flex-shrink-0 text-green-400" />
          <span>As configurações selecionadas já possuem credenciais pré-configuradas.</span>
        </div>
      ) : null}

      {validationError && (
        <p className="text-xs text-red-400 text-center font-medium bg-red-500/10 p-2 rounded-lg border border-red-500/20">
          {validationError}
        </p>
      )}

      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-[#b7abc9]/80 underline touch-manipulation min-h-[32px]"
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
        <p className="text-sm text-[#b7abc9]/80 mb-2 text-center">
          {filteredCount} configuração(ões) serão testadas
        </p>
        <button
          type="button"
          disabled={filteredCount === 0}
          onClick={onContinue}
          className="w-full min-h-[44px] rounded-xl bg-[#8b5cf6] text-white font-semibold disabled:opacity-40 touch-manipulation"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}

function ConfirmStep({
  typeLabel,
  categoriesLabel,
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
  return (
    <div className="flex flex-col gap-4 flex-1">
      <p className="text-sm text-[#b7abc9] font-medium">Confira antes de iniciar:</p>
      <ul className="space-y-2 text-sm text-white bg-[#1a1624]/50 rounded-lg p-3">
        <li>
          <span className="text-[#b7abc9]/70">Tipo: </span>
          {typeLabel}
        </li>
        <li>
          <span className="text-[#b7abc9]/70">Categorias: </span>
          {categoriesLabel}
        </li>
        <li>
          <span className="text-[#b7abc9]/70">Timeout VPN: </span>
          {connectionTimeout / 1000}s
        </li>
        <li>
          <span className="text-[#b7abc9]/70">Timeout internet: </span>
          {fetchTimeout / 1000}s
        </li>
        <li>
          <span className="text-[#b7abc9]/70">Total: </span>
          {filteredCount} configs
        </li>
        {requiredCredentials.username && (
          <li>
            <span className="text-[#b7abc9]/70">Usuário SSH: </span>
            <span className="text-white font-mono">{username || 'Não informado'}</span>
          </li>
        )}
        {requiredCredentials.password && (
          <li>
            <span className="text-[#b7abc9]/70">Senha SSH: </span>
            <span className="text-white">{password ? '••••••••' : 'Não informada'}</span>
          </li>
        )}
        {requiredCredentials.uuid && (
          <li>
            <span className="text-[#b7abc9]/70">UUID V2Ray: </span>
            <span className="text-white font-mono">{uuid ? `${uuid.substring(0, 8)}...` : 'Não informado'}</span>
          </li>
        )}
        {!requiredCredentials.username && !requiredCredentials.password && !requiredCredentials.uuid && (
          <li>
            <span className="text-[#b7abc9]/70">Credenciais: </span>
            <span className="text-green-400 font-medium">Pré-configuradas na config</span>
          </li>
        )}
      </ul>

      <div className="mt-auto flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] px-4 rounded-lg border border-[#8b5cf6]/30 text-[#b7abc9] flex items-center gap-1 touch-manipulation"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar
        </button>
        <button
          type="button"
          onClick={onStart}
          className="flex-1 min-h-[44px] rounded-xl bg-[#8b5cf6] text-white font-semibold touch-manipulation"
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
      <div className="bg-[#1a1624]/50 rounded-lg p-3 border border-[#8b5cf6]/20">
        <p className="text-white text-sm font-medium truncate">{currentName || 'Preparando…'}</p>
        <p className="text-xs text-[#b7abc9]/80 mt-0.5">
          {phase ? PHASE_LABEL[phase] : 'Iniciando'} · {formatDuration(duration)}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-1.5 rounded-full bg-[#14111c] overflow-hidden">
            <div
              className="h-full bg-[#8b5cf6] transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-white font-mono">
            {tested}/{total}
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-[240px] max-h-[380px] sm:max-h-[460px] overflow-y-auto rounded-xl bg-black/50 p-3 font-mono text-[11px] custom-scrollbar border border-white/5 space-y-1">
        {logs.map((log) => (
          <LogLine key={log.id} log={log} />
        ))}
        <div ref={logsEndRef} />
      </div>

      <button
        type="button"
        onClick={onCancel}
        className="w-full min-h-[44px] rounded-lg bg-red-600/80 text-white font-bold flex items-center justify-center gap-2 touch-manipulation"
      >
        <XCircle className="w-4 h-4" />
        Parar
      </button>
    </div>
  );
}

function LogLine({ log }: { log: TestLog }) {
  const sanitizedMessage = sanitizeLogHtml(log.message);
  const prefix = log.configName ? `<strong class="text-white font-semibold">${log.configName}: </strong>` : '';

  return (
    <div className="flex items-start gap-2 py-0.5 text-[#b7abc9]/90 leading-snug">
      <span className="text-[#b7abc9]/40 shrink-0 font-mono select-none">{formatTime(log.timestamp)}</span>
      <span
        className="break-words whitespace-pre-wrap flex-1 allow-select font-mono text-[11px]"
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
        <div className="rounded-lg border border-green-400/40 bg-green-500/10 p-4">
          <div className="flex items-center gap-2 text-green-400 font-bold mb-1">
            <CheckCircle className="w-5 h-5" />
            Conexão ativa
          </div>
          <p className="text-white font-mono text-sm break-all">{success}</p>
        </div>
      ) : (
        <div className="rounded-lg border border-red-400/40 bg-red-500/10 p-4">
          <div className="flex items-center gap-2 text-red-400 font-bold mb-1">
            <AlertCircle className="w-5 h-5" />
            {cancelled ? 'Teste cancelado' : error || 'Nenhuma configuração funcionou'}
          </div>
          {failedNames.length > 0 && (
            <ul className="mt-2 text-xs text-[#b7abc9] space-y-1 max-h-24 overflow-y-auto">
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
        <div className="max-h-56 sm:max-h-72 overflow-y-auto rounded-xl bg-black/50 p-3 font-mono text-[11px] custom-scrollbar border border-white/5 space-y-1">
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
            className="w-full min-h-[44px] rounded-xl bg-[#8b5cf6] text-white font-semibold touch-manipulation"
          >
            Fechar
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onRetry}
              className="w-full min-h-[44px] rounded-xl bg-[#8b5cf6] text-white font-semibold flex items-center justify-center gap-2 touch-manipulation"
            >
              <RefreshCw className="w-4 h-4" />
              Testar de novo
            </button>
            <button
              type="button"
              onClick={onAdjust}
              className="w-full min-h-[44px] rounded-lg border border-[#8b5cf6]/30 text-[#b7abc9] touch-manipulation"
            >
              Ajustar filtros
            </button>
          </>
        )}
      </div>
    </div>
  );
}
