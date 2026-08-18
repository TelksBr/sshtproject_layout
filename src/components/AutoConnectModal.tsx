import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from './modals/Modal';
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  ChevronLeft,
} from '../utils/icons';
import { useAutoConnectContext } from '../context/AutoConnectContext';
import {
  AutoConnectConfig,
  AutoConnectPhase,
  filterConfigsForAutoConnect,
} from '../utils/autoConnectUtils';
import { getAllConfigs } from '../utils/appFunctions';
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

  const allCategories = useMemo(() => getAllConfigs(), [open]);

  const filteredCount = useMemo(() => {
    const flat = allCategories.flatMap((cat) =>
      cat.items.map((item) => ({ ...item, category_id: cat.id }))
    );
    return filterConfigsForAutoConnect(flat, autoConnectConfig).length;
  }, [allCategories, autoConnectConfig]);

  useEffect(() => {
    if (!open) return;
    setStep(running ? 'run' : 'setup');
  }, [open]);

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
    setAutoConnectConfig({ ...autoConnectConfig, ...updates });
  };

  const toggleCategory = (categoryId: number) => {
    if (running) return;
    const current = autoConnectConfig.selectedCategories;
    const updated = current.includes(categoryId)
      ? current.filter((id) => id !== categoryId)
      : [...current, categoryId];
    updateConfig({ selectedCategories: updated });
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
      ? 'Filtros'
      : step === 'confirm'
        ? 'Confirmar'
        : step === 'run'
          ? `Testando ${tested}/${total}`
          : success
            ? 'Pronto'
            : 'Resultado';

  const handleStart = () => {
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
            onContinue={() => setStep('confirm')}
          />
        )}

        {step === 'confirm' && (
          <ConfirmStep
            typeLabel={TYPE_LABEL[autoConnectConfig.configType]}
            categoriesLabel={selectedCategoryNames}
            connectionTimeout={autoConnectConfig.connectionTimeout}
            fetchTimeout={autoConnectConfig.fetchTimeout}
            filteredCount={filteredCount}
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

function SetupStep({
  autoConnectConfig,
  updateConfig,
  toggleCategory,
  categories,
  filteredCount,
  showAdvanced,
  setShowAdvanced,
  onContinue,
}: {
  autoConnectConfig: AutoConnectConfig;
  updateConfig: (u: Partial<AutoConnectConfig>) => void;
  toggleCategory: (id: number) => void;
  categories: ReturnType<typeof getAllConfigs>;
  filteredCount: number;
  showAdvanced: boolean;
  setShowAdvanced: (v: boolean) => void;
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 flex-1">
      <div>
        <p className="text-xs text-[#b7abc9]/70 mb-2">Tipo de configuração</p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { value: 'all', label: 'Todas' },
              { value: 'ssh', label: 'SSH' },
              { value: 'v2ray', label: 'V2Ray' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => updateConfig({ configType: opt.value })}
              className={`min-h-[44px] px-4 rounded-full text-sm font-medium touch-manipulation ${
                autoConnectConfig.configType === opt.value
                  ? 'bg-[#8b5cf6] text-white'
                  : 'bg-[#1a1624]/60 text-[#b7abc9] border border-[#8b5cf6]/20'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs text-[#b7abc9]/70 mb-2">Categorias</p>
        <button
          type="button"
          onClick={() => updateConfig({ selectedCategories: [] })}
          className={`w-full min-h-[44px] mb-2 px-3 rounded-lg text-left text-sm touch-manipulation ${
            autoConnectConfig.selectedCategories.length === 0
              ? 'bg-[#8b5cf6] text-white'
              : 'bg-[#1a1624]/40 text-[#b7abc9]'
          }`}
        >
          Todas as categorias
        </button>
        <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
          {categories.map((category) => {
            const selected = autoConnectConfig.selectedCategories.includes(category.id);
            const count = category.items.length;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => toggleCategory(category.id)}
                className={`w-full min-h-[44px] px-3 rounded-lg text-left text-sm flex items-center gap-2 touch-manipulation ${
                  selected ? 'bg-[#8b5cf6] text-white' : 'bg-[#1a1624]/40 text-[#b7abc9]'
                }`}
              >
                <span
                  className={`flex-shrink-0 w-4 h-4 rounded border ${
                    selected ? 'bg-white border-white' : 'border-[#b7abc9]/50'
                  }`}
                />
                <span className="flex-1 truncate">{category.name}</span>
                <span className="text-xs opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-[#b7abc9]/80 underline touch-manipulation min-h-[32px]"
        >
          {showAdvanced ? 'Ocultar tempos' : 'Ajustar tempos (avançado)'}
        </button>
        {showAdvanced && (
          <div className="mt-3 space-y-4">
            <label className="block">
              <div className="flex justify-between text-xs text-[#b7abc9] mb-1">
                <span>Timeout de conexão</span>
                <span>{(autoConnectConfig.connectionTimeout / 1000).toFixed(0)}s</span>
              </div>
              <input
                type="range"
                min="3000"
                max="15000"
                step="1000"
                value={autoConnectConfig.connectionTimeout}
                onChange={(e) => updateConfig({ connectionTimeout: parseInt(e.target.value, 10) })}
                className="w-full"
              />
            </label>
            <label className="block">
              <div className="flex justify-between text-xs text-[#b7abc9] mb-1">
                <span>Timeout de internet</span>
                <span>{(autoConnectConfig.fetchTimeout / 1000).toFixed(0)}s</span>
              </div>
              <input
                type="range"
                min="2000"
                max="10000"
                step="1000"
                value={autoConnectConfig.fetchTimeout}
                onChange={(e) => updateConfig({ fetchTimeout: parseInt(e.target.value, 10) })}
                className="w-full"
              />
            </label>
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
  onBack,
  onStart,
}: {
  typeLabel: string;
  categoriesLabel: string;
  connectionTimeout: number;
  fetchTimeout: number;
  filteredCount: number;
  onBack: () => void;
  onStart: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 flex-1">
      <p className="text-sm text-[#b7abc9]">Confira antes de iniciar:</p>
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

      <div className="flex-1 min-h-[160px] max-h-56 overflow-y-auto rounded-lg bg-black/40 p-2 font-mono text-[11px] custom-scrollbar">
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
  return (
    <div className="flex gap-1.5 py-0.5 text-[#b7abc9]/90 leading-snug">
      <span className="text-[#b7abc9]/40 shrink-0">{formatTime(log.timestamp)}</span>
      <span
        className={`shrink-0 px-1 rounded ${
          log.source === 'sdk' ? 'bg-[#8b5cf6]/40 text-white' : 'bg-white/10'
        }`}
      >
        {log.source === 'sdk' ? 'SDK' : 'Teste'}
      </span>
      <span className="break-all">
        {log.configName ? `${log.configName}: ` : ''}
        {log.message}
      </span>
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
        <div className="max-h-32 overflow-y-auto rounded-lg bg-black/40 p-2 font-mono text-[11px] custom-scrollbar">
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
