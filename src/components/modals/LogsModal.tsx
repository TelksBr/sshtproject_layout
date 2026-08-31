import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Copy,
  Scroll,
  Share2,
  Trash2,
  Bug,
  CheckCircle,
  XCircle,
  Activity,
  Key,
  Terminal,
  Settings,
  RefreshCw,
  Play,
  Zap,
  Smartphone,
  Wifi,
  ShieldCheck,
} from '../../utils/icons';
import { Modal } from './Modal';
import { useDTunnelEvent } from '../../hooks/useDTunnelEvent';
import { useToast } from '../../hooks/useToast';
import {
  checkForUpdates,
  checkUserStatus,
  clearVpnLogs,
  copyToClipboard,
  formatVpnLogEntry,
  getSdkDiagnosticSnapshot,
  getVpnLogs,
  openApnSettings,
  openNetworkSettings,
  sanitizeLogHtml,
  shareText,
  showNativeToast,
  stripLogHtml,
  vibrate,
} from '../../utils/appFunctions';
import {
  getEventDebugLogs,
  clearEventDebugLogs,
  type DebugEventLogEntry,
} from '../../utils/dtunnelEventBridge';

interface LogsModalProps {
  onClose: () => void;
  initialTab?: 'vpn' | 'debug';
  enableDebug?: boolean;
}

type DebugSubTab = 'vpn' | 'diagnostic' | 'configs' | 'events' | 'console';

function loadLogLines(): string[] {
  try {
    return getVpnLogs().map(formatVpnLogEntry).filter(Boolean);
  } catch {
    return [];
  }
}

export function LogsModal({ onClose, initialTab = 'vpn', enableDebug }: LogsModalProps) {
  const { showToast } = useToast();
  const isDebugEnabled = Boolean(enableDebug || initialTab === 'debug');
  const [activeTab, setActiveTab] = useState<DebugSubTab>(isDebugEnabled ? 'diagnostic' : 'vpn');
  const [lines, setLines] = useState<string[]>(() => loadLogLines());
  const [debugLogs, setDebugLogs] = useState<DebugEventLogEntry[]>(() => getEventDebugLogs());
  const [eventFilter, setEventFilter] = useState('');
  const scrollerRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  const refreshVpnLogs = useCallback(() => {
    const next = loadLogLines();
    setLines((prev) => {
      if (prev.length === next.length && prev.every((line, index) => line === next[index])) {
        return prev;
      }
      return next;
    });
  }, []);

  const refreshDebugLogs = useCallback(() => {
    setDebugLogs(getEventDebugLogs());
  }, []);

  useDTunnelEvent('newLog', refreshVpnLogs);
  useDTunnelEvent('vpnState', refreshVpnLogs);

  // Snapshot de diagnóstico do SDK
  const snapshot = useMemo(() => getSdkDiagnosticSnapshot(), [activeTab, debugLogs]);

  // Atualização periódica
  useEffect(() => {
    const id = window.setInterval(() => {
      if (activeTab === 'vpn') {
        refreshVpnLogs();
      } else if (activeTab === 'events' || activeTab === 'diagnostic') {
        refreshDebugLogs();
      }
    }, 800);
    return () => window.clearInterval(id);
  }, [activeTab, refreshVpnLogs, refreshDebugLogs]);

  const handleBodyScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 96;
  }, []);

  useEffect(() => {
    if (!stickToBottomRef.current || activeTab !== 'vpn') return;
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [lines, activeTab]);

  const logsText = useMemo(() => lines.map(stripLogHtml).filter(Boolean).join('\n'), [lines]);

  const handleClear = () => {
    if (activeTab === 'vpn') {
      try {
        clearVpnLogs();
        stickToBottomRef.current = true;
        setLines([]);
        showToast('Registros VPN limpos', 'success');
      } catch {
        showToast('Não foi possível limpar os registros', 'error');
      }
    } else {
      clearEventDebugLogs();
      setDebugLogs([]);
      showToast('Logs de eventos limpos', 'success');
    }
  };

  const handleCopy = () => {
    if (activeTab === 'vpn') {
      if (!logsText) {
        showToast('Nenhum registro para copiar', 'info');
        return;
      }
      try {
        copyToClipboard(logsText);
        showToast('Registros copiados', 'success');
      } catch {
        showToast('Não foi possível copiar os registros', 'error');
      }
    } else {
      const fullSnapshot = {
        ...snapshot,
        eventLogs: debugLogs,
      };
      const text = JSON.stringify(fullSnapshot, null, 2);
      try {
        copyToClipboard(text);
        showToast('Relatório completo de diagnósticos copiado!', 'success');
      } catch {
        showToast('Erro ao copiar relatório', 'error');
      }
    }
  };

  const handleShare = async () => {
    if (!logsText) {
      showToast('Nenhum registro para compartilhar', 'info');
      return;
    }
    const result = await shareText(logsText, 'Registros SSH T PROJECT');
    if (result === 'shared') return;
    if (result === 'copied') {
      showToast('Registros copiados para compartilhar', 'success');
      return;
    }
    if (result === 'failed') {
      showToast('Não foi possível compartilhar os registros', 'error');
    }
  };

  const filteredEvents = useMemo(() => {
    if (!eventFilter.trim()) return debugLogs;
    const query = eventFilter.toLowerCase().trim();
    return debugLogs.filter(
      (e) =>
        e.name.toLowerCase().includes(query) ||
        e.source.toLowerCase().includes(query) ||
        JSON.stringify(e.payload ?? '').toLowerCase().includes(query)
    );
  }, [debugLogs, eventFilter]);

  const actionButtonClass =
    'min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl touch-manipulation transition-opacity active:opacity-70';

  const modal = (
    <Modal
      onClose={onClose}
      title={activeTab === 'vpn' ? 'Registros VPN' : 'Suíte de Debug SDK'}
      icon={activeTab === 'vpn' ? Scroll : Bug}
      bodyRef={scrollerRef}
      onBodyScroll={handleBodyScroll}
      headerActions={
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleClear}
            className={actionButtonClass}
            style={{ background: 'var(--bg-elevated)' }}
            title={activeTab === 'vpn' ? 'Limpar registros VPN' : 'Limpar logs de eventos'}
            aria-label="Limpar"
          >
            <Trash2 className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          </button>
          {activeTab === 'vpn' && (
            <button
              type="button"
              onClick={() => void handleShare()}
              className={actionButtonClass}
              style={{ background: 'var(--bg-elevated)' }}
              title="Compartilhar registros"
              aria-label="Compartilhar registros"
            >
              <Share2 className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className={actionButtonClass}
            style={{ background: 'var(--bg-elevated)' }}
            title={activeTab === 'vpn' ? 'Copiar registros' : 'Copiar relatório completo JSON'}
            aria-label="Copiar"
          >
            <Copy className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>
      }
    >
      <div className="flex flex-col">
        {/* Seletor de Sub-Abas do Suíte de Debug */}
        {isDebugEnabled && (
          <div className="flex items-center p-2 gap-1.5 border-b overflow-x-auto w-full shrink-0 custom-scrollbar scroll-smooth" style={{ borderColor: 'var(--border)' }}>
            {(
              [
                { id: 'vpn', label: 'Logs VPN', icon: Scroll },
                { id: 'diagnostic', label: 'Diagnóstico', icon: Activity },
                { id: 'configs', label: 'Configs', icon: Key },
                { id: 'events', label: `Eventos (${debugLogs.length})`, icon: Bug },
                { id: 'console', label: 'Console', icon: Terminal },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className="shrink-0 flex-shrink-0 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap transition-all touch-manipulation active:scale-95"
                  style={{
                    background: active ? 'var(--accent)' : 'var(--bg-elevated)',
                    color: active ? '#ffffff' : 'var(--text-muted)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* 1. Aba: Logs VPN */}
        {activeTab === 'vpn' && (
          <div className="p-3 sm:p-4">
            {lines.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Nenhum registro de conexão no momento.
                </p>
              </div>
            ) : (
              <div
                className="text-[11px] sm:text-xs leading-5 font-mono break-words allow-select select-text space-y-1"
                style={{ color: 'var(--text)' }}
              >
                {lines.map((line, index) => (
                  <div
                    key={index}
                    dangerouslySetInnerHTML={{ __html: sanitizeLogHtml(line) }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. Aba: Diagnóstico SDK & Sistema */}
        {activeTab === 'diagnostic' && (
          <div className="p-3 sm:p-4 space-y-4">
            {/* Status de Prontidão do SDK */}
            <div className="p-3.5 rounded-xl space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>Status da SDK DTunnel</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                  v{snapshot.sdkVersion}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-[var(--bg-elevated)] flex flex-col gap-0.5" style={{ border: '1px solid var(--border)' }}>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Bridge Ready</span>
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> OK
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-[var(--bg-elevated)] flex flex-col gap-0.5" style={{ border: '1px solid var(--border)' }}>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>VPN State</span>
                  <span className="font-mono font-bold truncate" style={{ color: 'var(--text)' }}>{snapshot.main.vpnState ?? 'N/A'}</span>
                </div>
                <div className="p-2 rounded-lg bg-[var(--bg-elevated)] flex flex-col gap-0.5" style={{ border: '1px solid var(--border)' }}>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Rede Atual</span>
                  <span className="font-mono font-bold truncate" style={{ color: 'var(--text)' }}>{snapshot.main.networkName ?? 'N/A'}</span>
                </div>
                <div className="p-2 rounded-lg bg-[var(--bg-elevated)] flex flex-col gap-0.5" style={{ border: '1px solid var(--border)' }}>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>IP Local</span>
                  <span className="font-mono font-bold truncate" style={{ color: 'var(--text)' }}>{snapshot.main.localIp ?? 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Inspeção da Bridge Nativa (Objetos Expostos no WebView) */}
            <div className="p-3.5 rounded-xl space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                  <Zap className="w-3.5 h-3.5 text-[var(--accent)]" />
                  Bridge Native Objects ({Object.values(snapshot.bridgeAvailability).filter(Boolean).length}/{Object.keys(snapshot.bridgeAvailability).length})
                </span>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Ambiente Android</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px] max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                {Object.entries(snapshot.bridgeAvailability).map(([name, exists]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between p-1.5 rounded-lg"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                  >
                    <span className="font-mono truncate max-w-[70%] text-[10px]" style={{ color: 'var(--text)' }}>
                      {name}
                    </span>
                    {exists ? (
                      <span className="flex items-center gap-0.5 text-[9px] text-emerald-400 font-semibold">
                        <CheckCircle className="w-3 h-3" /> OK
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-[9px] text-rose-400 font-medium">
                        <XCircle className="w-3 h-3" /> Off
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Detalhes do Dispositivo & Insets */}
            <div className="p-3.5 rounded-xl space-y-2 text-xs" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 font-semibold mb-1" style={{ color: 'var(--text)' }}>
                <Smartphone className="w-4 h-4 text-[var(--accent)]" />
                <span>Métricas de Layout Nativo & Sistema</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-[var(--bg-elevated)] space-y-0.5" style={{ border: '1px solid var(--border)' }}>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Device ID</span>
                  <p className="font-mono truncate" style={{ color: 'var(--text)' }}>{snapshot.android.deviceId ?? 'N/A'}</p>
                </div>
                <div className="p-2 rounded-lg bg-[var(--bg-elevated)] space-y-0.5" style={{ border: '1px solid var(--border)' }}>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Status Bars</span>
                  <p className="font-mono" style={{ color: 'var(--text)' }}>Top: {snapshot.android.statusBarHeight}px | Nav: {snapshot.android.navBarHeight}px</p>
                </div>
                <div className="p-2 rounded-lg bg-[var(--bg-elevated)] space-y-0.5" style={{ border: '1px solid var(--border)' }}>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Segurança & Modos</span>
                  <p className="font-mono" style={{ color: 'var(--text)' }}>Safe: {snapshot.android.isSafeMode ? 'Sim' : 'Não'} | Dark: {snapshot.android.isDarkMode ? 'Sim' : 'Não'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Aba: Configs & Credenciais */}
        {activeTab === 'configs' && (
          <div className="p-3 sm:p-4 space-y-4 text-xs">
            <div className="p-3.5 rounded-xl space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 font-bold" style={{ color: 'var(--text)' }}>
                <Key className="w-4 h-4 text-[var(--accent)]" />
                <span>Estado de Configuração Exposto pelo SDK</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-lg bg-[var(--bg-elevated)] space-y-1" style={{ border: '1px solid var(--border)' }}>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Local Config Version</span>
                  <p className="font-mono font-bold text-emerald-400">{snapshot.config.localConfigVersion ?? 'Não retornado'}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--bg-elevated)] space-y-1" style={{ border: '1px solid var(--border)' }}>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>App Config Version</span>
                  <p className="font-mono font-bold text-emerald-400">{snapshot.config.appConfigVersion ?? 'Não retornado'}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--bg-elevated)] space-y-1" style={{ border: '1px solid var(--border)' }}>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>ID Config Selecionada</span>
                  <p className="font-mono font-bold" style={{ color: 'var(--text)' }}>{snapshot.config.selectedConfigId ?? 'N/A'}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--bg-elevated)] space-y-1" style={{ border: '1px solid var(--border)' }}>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Total de Configs / CDNs</span>
                  <p className="font-mono font-bold" style={{ color: 'var(--text)' }}>{snapshot.config.configCount ?? 'N/A'} / {snapshot.config.cdnCount ?? 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <span className="font-bold block" style={{ color: 'var(--text)' }}>Verificação de Credenciais Preenchidas</span>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-between" style={{ border: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Usuário:</span>
                  <span className={`font-bold ${snapshot.config.hasUsername ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {snapshot.config.hasUsername ? 'OK' : 'Ausente'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-between" style={{ border: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Senha:</span>
                  <span className={`font-bold ${snapshot.config.hasPassword ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {snapshot.config.hasPassword ? 'OK' : 'Ausente'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-between" style={{ border: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>UUID:</span>
                  <span className={`font-bold ${snapshot.config.hasUuid ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {snapshot.config.hasUuid ? 'OK' : 'Ausente'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Aba: Stream de Eventos (Bus) */}
        {activeTab === 'events' && (
          <div className="p-3 sm:p-4 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                placeholder="Filtrar eventos por nome ou conteúdo..."
                className="flex-1 min-h-[38px] px-3 rounded-xl text-xs outline-none allow-select"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text)', border: '1px solid var(--border)' }}
              />
              <button
                type="button"
                onClick={refreshDebugLogs}
                className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1"
                style={{ background: 'var(--bg-elevated)', color: 'var(--accent)', border: '1px solid var(--border)' }}
              >
                <RefreshCw className="w-3.5 h-3.5 text-[var(--accent)]" />
                Atualizar
              </button>
            </div>

            {filteredEvents.length === 0 ? (
              <div className="p-6 rounded-xl text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Nenhum evento corresponde ao filtro.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                {[...filteredEvents].reverse().map((entry) => {
                  const d = new Date(entry.time);
                  const timeStr = `${d.toTimeString().slice(0, 8)}.${String(d.getMilliseconds()).padStart(3, '0')}`;
                  const isError = entry.source.includes('error') || entry.name.includes('error');

                  return (
                    <div
                      key={entry.id}
                      className="p-2.5 rounded-xl space-y-1.5 text-xs font-mono"
                      style={{
                        background: isError ? 'rgba(239, 68, 68, 0.1)' : 'var(--surface)',
                        border: `1px solid ${isError ? 'rgba(239, 68, 68, 0.3)' : 'var(--border)'}`,
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                          {entry.source}
                        </span>
                        <span className="font-semibold truncate flex-1" style={{ color: 'var(--text)' }}>{entry.name}</span>
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{timeStr}</span>
                      </div>
                      {entry.payload !== undefined && (
                        <pre className="p-2 rounded-lg text-[10px] leading-relaxed overflow-x-auto max-h-36 font-mono allow-select" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                          {typeof entry.payload === 'object'
                            ? JSON.stringify(entry.payload, null, 2)
                            : String(entry.payload)}
                        </pre>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 5. Aba: Console Interativo (Testes SDK) */}
        {activeTab === 'console' && (
          <div className="p-3 sm:p-4 space-y-4">
            <div className="p-3.5 rounded-xl space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 font-bold text-xs" style={{ color: 'var(--text)' }}>
                <Terminal className="w-4 h-4 text-[var(--accent)]" />
                <span>Console de Disparo Interativo de APIs SDK</span>
              </div>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Execute ações nativas diretamente no dispositivo Android para testar métodos e fallbacks do SDK.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    vibrate(80);
                    showToast('Vibração executada', 'success');
                  }}
                  className="p-2.5 rounded-xl font-medium transition-all flex items-center gap-1.5 touch-manipulation active:scale-95"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text)', border: '1px solid var(--border)' }}
                >
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Vibrar (50ms)</span>
                </button>

                <button
                  type="button"
                  onClick={() => showNativeToast('Toast Nativo DTunnel executado com sucesso!')}
                  className="p-2.5 rounded-xl font-medium transition-all flex items-center gap-1.5 touch-manipulation active:scale-95"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text)', border: '1px solid var(--border)' }}
                >
                  <Play className="w-3.5 h-3.5 text-purple-400" />
                  <span>Toast Nativo</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    checkUserStatus();
                    showToast('CheckUser disparado no SDK', 'info');
                  }}
                  className="p-2.5 rounded-xl font-medium transition-all flex items-center gap-1.5 touch-manipulation active:scale-95"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text)', border: '1px solid var(--border)' }}
                >
                  <Play className="w-3.5 h-3.5 text-amber-400" />
                  <span>CheckUser</span>
                </button>

                <button
                  type="button"
                  onClick={() => openApnSettings()}
                  className="p-2.5 rounded-xl font-medium transition-all flex items-center gap-1.5 touch-manipulation active:scale-95"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text)', border: '1px solid var(--border)' }}
                >
                  <Settings className="w-3.5 h-3.5 text-blue-400" />
                  <span>Abrir APN</span>
                </button>

                <button
                  type="button"
                  onClick={() => openNetworkSettings()}
                  className="p-2.5 rounded-xl font-medium transition-all flex items-center gap-1.5 touch-manipulation active:scale-95"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text)', border: '1px solid var(--border)' }}
                >
                  <Wifi className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Config Redes</span>
                </button>

                <button
                  type="button"
                  onClick={() => checkForUpdates()}
                  className="p-2.5 rounded-xl font-medium transition-all flex items-center gap-1.5 touch-manipulation active:scale-95"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text)', border: '1px solid var(--border)' }}
                >
                  <RefreshCw className="w-3.5 h-3.5 text-pink-400" />
                  <span>Verif. Update</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );

  if (typeof document === 'undefined') return modal;
  return createPortal(modal, document.body);
}
