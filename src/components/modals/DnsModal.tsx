import { useState, useMemo, useRef } from 'react';
import {
  Globe,
  Check,
  Save,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Loader,
} from '../../utils/icons';
import { Modal } from './Modal';
import {
  DEFAULT_DNS_PRESETS,
  getCustomDnsConfig,
  isValidIpAddress,
  setCustomDnsConfig,
  type DnsPreset,
} from '../../utils/dnsUtils';
import { useToast } from '../../hooks/useToast';
import { showNativeToast, vibrate } from '../../utils/appFunctions';

interface DnsModalProps {
  onClose: () => void;
}

export function DnsModal({ onClose }: DnsModalProps) {
  const { showSuccess, showError } = useToast();

  const initialConfig = useMemo(() => getCustomDnsConfig(), []);

  const [enabled, setEnabled] = useState<boolean>(initialConfig.enabled);
  const [primary, setPrimary] = useState<string>(initialConfig.primary);
  const [secondary, setSecondary] = useState<string>(initialConfig.secondary);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(() => {
    const match = DEFAULT_DNS_PRESETS.find(
      (p) => p.primary === initialConfig.primary && p.secondary === initialConfig.secondary
    );
    return match ? match.id : 'custom';
  });

  const handleToggle = (newVal: boolean) => {
    try {
      vibrate(25);
    } catch {
      /* ignore */
    }
    setEnabled(newVal);
  };

  const handleSelectPreset = (preset: DnsPreset) => {
    try {
      vibrate(20);
    } catch {
      /* ignore */
    }
    setSelectedPresetId(preset.id);
    setPrimary(preset.primary);
    setSecondary(preset.secondary);
  };

  const handleCustomInput = (field: 'primary' | 'secondary', value: string) => {
    setSelectedPresetId('custom');
    if (field === 'primary') setPrimary(value);
    else setSecondary(value);
  };

  const isPrimaryValid = useMemo(() => !primary.trim() || isValidIpAddress(primary), [primary]);
  const isSecondaryValid = useMemo(
    () => !secondary.trim() || isValidIpAddress(secondary),
    [secondary]
  );

  const canSave = useMemo(() => {
    if (saveStatus !== 'idle') return false;
    if (!enabled) return true;
    if (!primary.trim()) return false;
    return isPrimaryValid && isSecondaryValid;
  }, [enabled, primary, isPrimaryValid, isSecondaryValid, saveStatus]);

  const handleSave = () => {
    if (saveStatus !== 'idle') return;

    if (enabled) {
      if (!primary.trim()) {
        try {
          vibrate(80);
        } catch {
          /* ignore */
        }
        showError('Informe ao menos o servidor DNS primário.');
        showNativeToast('Informe ao menos o servidor DNS primário.');
        return;
      }
      if (!isValidIpAddress(primary)) {
        try {
          vibrate(80);
        } catch {
          /* ignore */
        }
        showError('O servidor DNS primário informado é inválido.');
        showNativeToast('O servidor DNS primário informado é inválido.');
        return;
      }
      if (secondary.trim() && !isValidIpAddress(secondary)) {
        try {
          vibrate(80);
        } catch {
          /* ignore */
        }
        showError('O servidor DNS secundário informado é inválido.');
        showNativeToast('O servidor DNS secundário informado é inválido.');
        return;
      }
    }

    setSaveStatus('saving');

    try {
      // Salva no storage e no SDK VTunnel
      setCustomDnsConfig({
        enabled,
        primary: primary.trim(),
        secondary: secondary.trim(),
      });

      // Feedback tátil no dispositivo
      vibrate(40);

      const msg = enabled
        ? 'DNS personalizado ativado com sucesso!'
        : 'DNS personalizado desativado (usando padrão).';

      // Feedback visual duplo: web e nativo Android
      showSuccess(msg);
      showNativeToast(msg);

      setSaveStatus('saved');

      // Aguarda 650ms para que o usuário veja a confirmação no próprio botão
      closeTimeoutRef.current = setTimeout(() => {
        onClose();
      }, 650);
    } catch (err) {
      setSaveStatus('idle');
      console.error('Erro ao salvar DNS:', err);
      showError('Erro ao salvar configuração de DNS.');
      showNativeToast('Erro ao salvar configuração de DNS.');
    }
  };

  const currentPresetName = useMemo(() => {
    if (!enabled) return 'Desativado (Padrão)';
    const found = DEFAULT_DNS_PRESETS.find((p) => p.id === selectedPresetId);
    if (found) return found.name;
    return 'Personalizado';
  }, [enabled, selectedPresetId]);

  return (
    <Modal onClose={onClose} title="DNS Customizado" icon={Globe}>
      <div className="flex-1 p-3.5 sm:p-5 overflow-y-auto space-y-4">
        {/* Card de Status e Chave Principal */}
        <div
          className="p-4 rounded-2xl flex items-center justify-between gap-4 transition-all"
          style={{
            background: enabled ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-elevated)',
            border: enabled ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--border)',
          }}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
              style={{
                background: enabled ? 'rgba(16, 185, 129, 0.2)' : 'var(--border)',
                color: enabled ? '#34d399' : 'var(--text-muted)',
              }}
            >
              <Globe className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold" style={{ color: 'var(--text)' }}>
                  DNS Personalizado
                </h3>
                {enabled && (
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#34d399',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    ATIVO
                  </span>
                )}
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {enabled ? `Provedor: ${currentPresetName}` : 'Desativado (usando DNS padrão da rede/VPN)'}
              </p>
            </div>
          </div>

          <div
            role="switch"
            aria-checked={enabled}
            onClick={() => handleToggle(!enabled)}
            className="cursor-pointer select-none flex-shrink-0 touch-manipulation active:scale-95"
            style={{
              width: '50px',
              minWidth: '50px',
              maxWidth: '50px',
              height: '28px',
              minHeight: '28px',
              maxHeight: '28px',
              backgroundColor: enabled ? '#10b981' : 'rgba(255, 255, 255, 0.18)',
              borderRadius: '9999px',
              padding: '2px',
              transition: 'background-color 0.22s ease',
              display: 'flex',
              alignItems: 'center',
              boxSizing: 'border-box',
              border: enabled ? '1px solid #059669' : '1px solid rgba(255, 255, 255, 0.12)',
            }}
            aria-label="Ativar ou desativar DNS personalizado"
          >
            <div
              style={{
                width: '22px',
                minWidth: '22px',
                maxWidth: '22px',
                height: '22px',
                minHeight: '22px',
                maxHeight: '22px',
                backgroundColor: '#ffffff',
                borderRadius: '9999px',
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.35)',
                transform: enabled ? 'translateX(22px)' : 'translateX(0px)',
                transition: 'transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                flexShrink: 0,
              }}
            />
          </div>
        </div>

        {/* Provedores Rápidos (Presets) */}
        <div>
          <div className="flex items-center mb-2">
            <span
              className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
              style={{ color: 'var(--text-muted)' }}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Provedores Rápidos
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DEFAULT_DNS_PRESETS.map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="p-2.5 sm:p-3 rounded-xl text-left transition-all relative border touch-manipulation active:scale-[0.98]"
                  style={{
                    background: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-elevated)',
                    borderColor: isSelected ? 'rgba(59, 130, 246, 0.5)' : 'var(--border)',
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-xs font-bold truncate"
                      style={{ color: isSelected ? '#60a5fa' : 'var(--text)' }}
                    >
                      {preset.name}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
                  </div>
                  <p className="text-[10px] font-mono truncate" style={{ color: 'var(--text-muted)' }}>
                    {preset.primary}
                  </p>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => {
                try {
                  vibrate(20);
                } catch {
                  /* ignore */
                }
                setSelectedPresetId('custom');
              }}
              className="p-2.5 sm:p-3 rounded-xl text-left transition-all border touch-manipulation active:scale-[0.98]"
              style={{
                background: selectedPresetId === 'custom' ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-elevated)',
                borderColor: selectedPresetId === 'custom' ? 'rgba(59, 130, 246, 0.5)' : 'var(--border)',
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className="text-xs font-bold truncate"
                  style={{ color: selectedPresetId === 'custom' ? '#60a5fa' : 'var(--text)' }}
                >
                  Personalizado
                </span>
                {selectedPresetId === 'custom' && (
                  <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                )}
              </div>
              <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                Manual
              </p>
            </button>
          </div>
        </div>

        {/* Inputs de Endereços IP */}
        <div
          className="p-4 rounded-2xl space-y-3.5 transition-all"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
        >
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Servidor DNS Primário (IPv4 / IPv6) *
            </label>
            <div className="relative">
              <input
                type="text"
                value={primary}
                onChange={(e) => handleCustomInput('primary', e.target.value)}
                placeholder="ex: 1.1.1.1 ou 8.8.8.8"
                className="w-full h-11 px-3.5 rounded-xl font-mono text-xs sm:text-sm transition-colors border focus:outline-none focus:ring-1 focus:ring-blue-500"
                style={{
                  background: 'var(--bg)',
                  borderColor: !isPrimaryValid ? '#ef4444' : 'var(--border)',
                  color: 'var(--text)',
                }}
              />
            </div>
            {!isPrimaryValid && (
              <span className="text-[11px] text-red-400 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" /> Endereço IP inválido
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Servidor DNS Secundário (Opcional)
            </label>
            <div className="relative">
              <input
                type="text"
                value={secondary}
                onChange={(e) => handleCustomInput('secondary', e.target.value)}
                placeholder="ex: 1.0.0.1 ou 8.8.4.4"
                className="w-full h-11 px-3.5 rounded-xl font-mono text-xs sm:text-sm transition-colors border focus:outline-none focus:ring-1 focus:ring-blue-500"
                style={{
                  background: 'var(--bg)',
                  borderColor: !isSecondaryValid ? '#ef4444' : 'var(--border)',
                  color: 'var(--text)',
                }}
              />
            </div>
            {!isSecondaryValid && (
              <span className="text-[11px] text-red-400 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" /> Endereço IP inválido
              </span>
            )}
          </div>

          <div
            className="flex items-start gap-2.5 p-3 rounded-xl text-xs leading-relaxed"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
            <p>
              O DNS customizado garante que suas consultas de domínio passem com segurança pelos
              servidores configurados quando a VPN estiver conectada.
            </p>
          </div>
        </div>

        {/* Botões de Ação com Feedback de Estado */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saveStatus !== 'idle'}
            className="w-full h-11 rounded-xl text-xs sm:text-sm font-semibold transition-all border touch-manipulation active:scale-[0.98] disabled:opacity-50"
            style={{
              background: 'var(--bg-elevated)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className={`w-full h-11 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 touch-manipulation active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-md ${
              saveStatus === 'saved'
                ? 'bg-emerald-600 border border-emerald-500'
                : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            {saveStatus === 'saving' ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Salvo com Sucesso!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
export default DnsModal;
