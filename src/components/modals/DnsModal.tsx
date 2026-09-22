import { useState, useMemo } from 'react';
import {
  Globe,
  Check,
  Smartphone,
  Save,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from '../../utils/icons';
import { Modal } from './Modal';
import {
  DEFAULT_DNS_PRESETS,
  getCustomDnsConfig,
  isValidIpAddress,
  openNativeDnsDialog,
  setCustomDnsConfig,
  type DnsPreset,
} from '../../utils/dnsUtils';
import { useToast } from '../../hooks/useToast';

interface DnsModalProps {
  onClose: () => void;
}

export function DnsModal({ onClose }: DnsModalProps) {
  const { showSuccess, showError, showInfo } = useToast();

  const initialConfig = useMemo(() => getCustomDnsConfig(), []);

  const [enabled, setEnabled] = useState<boolean>(initialConfig.enabled);
  const [primary, setPrimary] = useState<string>(initialConfig.primary);
  const [secondary, setSecondary] = useState<string>(initialConfig.secondary);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(() => {
    const match = DEFAULT_DNS_PRESETS.find(
      (p) => p.primary === initialConfig.primary && p.secondary === initialConfig.secondary
    );
    return match ? match.id : 'custom';
  });

  const handleSelectPreset = (preset: DnsPreset) => {
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
    if (!enabled) return true;
    if (!primary.trim()) return false;
    return isPrimaryValid && isSecondaryValid;
  }, [enabled, primary, isPrimaryValid, isSecondaryValid]);

  const handleSave = () => {
    if (enabled) {
      if (!primary.trim()) {
        showError('Informe ao menos o servidor DNS primário.');
        return;
      }
      if (!isValidIpAddress(primary)) {
        showError('O servidor DNS primário informado é inválido.');
        return;
      }
      if (secondary.trim() && !isValidIpAddress(secondary)) {
        showError('O servidor DNS secundário informado é inválido.');
        return;
      }
    }

    setCustomDnsConfig({
      enabled,
      primary: primary.trim(),
      secondary: secondary.trim(),
    });

    showSuccess(
      enabled
        ? 'DNS personalizado ativado com sucesso!'
        : 'DNS personalizado desativado (usando padrão).'
    );
    onClose();
  };

  const handleOpenNativeDialog = () => {
    const opened = openNativeDnsDialog();
    if (opened) {
      showInfo('Abrindo diálogo nativo de DNS do Android...');
    } else {
      showInfo('Diálogo nativo disponível apenas no aplicativo Android.');
    }
  };

  return (
    <Modal onClose={onClose} title="DNS Customizado" icon={Globe}>
      <div className="flex-1 p-3.5 sm:p-5 overflow-y-auto space-y-4">
        {/* Card de Status e Chave Principal */}
        <div
          className="p-4 rounded-2xl flex items-center justify-between gap-4 transition-all"
          style={{
            background: enabled ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-elevated)',
            border: enabled ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid var(--border)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
              style={{
                background: enabled ? 'rgba(59, 130, 246, 0.2)' : 'var(--border)',
                color: enabled ? '#60a5fa' : 'var(--text-muted)',
              }}
            >
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold" style={{ color: 'var(--text)' }}>
                DNS Personalizado
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {enabled ? 'Ativo na conexão VPN' : 'Desativado (usando padrão)'}
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-12 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Provedores Rápidos (Presets) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
              style={{ color: 'var(--text-muted)' }}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Provedores Rápidos
            </span>
            <button
              type="button"
              onClick={handleOpenNativeDialog}
              className="text-xs flex items-center gap-1 font-medium hover:underline transition-all"
              style={{ color: 'var(--accent)' }}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Diálogo Nativo
            </button>
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
              onClick={() => setSelectedPresetId('custom')}
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

        {/* Botões de Ação */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-11 rounded-xl text-xs sm:text-sm font-semibold transition-all border touch-manipulation active:scale-[0.98]"
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
            className="w-full h-11 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 touch-manipulation active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white"
            style={{
              background: 'var(--accent, #3b82f6)',
            }}
          >
            <Save className="w-4 h-4" />
            Salvar
          </button>
        </div>
      </div>
    </Modal>
  );
}
export default DnsModal;
