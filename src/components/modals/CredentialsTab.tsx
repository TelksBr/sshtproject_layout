import React, { useMemo, useState } from 'react';
import { Modal } from './Modal';
import RenewalModal from './RenewalModal';
import { ConfirmModal } from '../ConfirmModal';
import { useCredentialsManager } from '../../hooks/useCredentialsManager';
import { useToast } from '../../hooks/useToast';
import {
  getCredentialIdentifier,
  parseExpiration,
  purchaseStorage,
  SavedCredential,
} from '../../utils/purchaseStorageManager';
import { copyToClipboard } from '../../utils/nativeClipboard';
import { setUsername, setPassword, setUUID, verifyCredentialsSetted } from '../../utils/appFunctions';
import { emit } from '../../utils/dtunnelEventBridge';
import {
  Key,
  Star,
  Trash2,
  Plus,
  RefreshCw,
  Clock,
  AlertTriangle,
  Copy,
  CheckCircle,
  Shield,
} from '../../utils/icons';

interface CredentialsTabProps {
  onClose: () => void;
}

function formatDate(dateString?: string) {
  const parsed = parseExpiration(dateString);
  if (!parsed) return dateString || '—';
  return parsed.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatCheckedAgo(iso?: string): string | null {
  if (!iso) return null;
  const timestamp = new Date(iso).getTime();
  if (Number.isNaN(timestamp)) return null;
  const minutes = Math.floor((Date.now() - timestamp) / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  return `há ${Math.floor(hours / 24)}d`;
}

function getStatus(credential: SavedCredential) {
  const expired = purchaseStorage.isCredentialExpired(credential);
  const days = purchaseStorage.getDaysUntilExpiration(credential);
  const checked = formatCheckedAgo(credential.validation?.last_checked);

  if (expired) {
    return { label: 'Expirada', detail: checked, tone: 'expired' as const };
  }
  if (credential.validation?.expiration_date || typeof credential.validation?.expiration_days === 'number') {
    return {
      label: days <= 0 ? 'Expirada' : `Expira em ${days}d`,
      detail: checked,
      tone: days <= 3 ? 'warn' as const : 'ok' as const,
    };
  }
  return { label: 'Não verificada', detail: checked, tone: 'muted' as const };
}

export function CredentialsTab({ onClose }: CredentialsTabProps) {
  const {
    credentials,
    validatingAll,
    error,
    refreshCredentials,
    validateCredentials,
    validateAll,
    setDefault,
    removeCredential,
    addManualCredential,
  } = useCredentialsManager();

  const { showToast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [renewalIdentifier, setRenewalIdentifier] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [validating, setValidating] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: '', label: '' });

  const activeCount = useMemo(
    () => credentials.filter((c) => !purchaseStorage.isCredentialExpired(c)).length,
    [credentials]
  );
  const expiredCount = useMemo(
    () => credentials.filter((c) => purchaseStorage.isCredentialExpired(c)).length,
    [credentials]
  );

  const filteredCredentials = useMemo(() => {
    if (filter === 'active') return credentials.filter((c) => !purchaseStorage.isCredentialExpired(c));
    if (filter === 'expired') return credentials.filter((c) => purchaseStorage.isCredentialExpired(c));
    return credentials;
  }, [credentials, filter]);

  const handleValidate = async (id: string) => {
    setValidating(id);
    const success = await validateCredentials(id);
    setValidating(null);
    showToast(
      success ? 'Credencial atualizada pelo CheckUser' : 'Falha na validação. Verifique as credenciais.',
      success ? 'success' : 'error'
    );
  };

  const handleRefresh = () => {
    refreshCredentials();
    validateAll(true);
  };

  const handleSetDefault = (id: string) => {
    try {
      const credential = credentials.find((c) => c.id === id);
      if (!credential) return;

      if (credential.ssh) {
        setUsername(credential.ssh.username);
        setPassword(credential.ssh.password);
      }
      if (credential.v2ray) {
        setUUID(credential.v2ray.uuid);
      }

      const verification = verifyCredentialsSetted(
        credential.ssh?.username,
        credential.ssh?.password,
        credential.v2ray?.uuid
      );
      if (!verification.isValid) {
        showToast('Erro: credencial não foi setada no DTunnel.', 'error');
        return;
      }

      if (!setDefault(id)) {
        showToast('Erro ao definir credencial como padrão', 'error');
        return;
      }

      emit('newDefaultConfig', {});
      showToast(`"${credential.label}" carregada`, 'success');
    } catch {
      showToast('Erro ao processar credencial', 'error');
    }
  };

  const handleCopy = async (text: string, type: string) => {
    const success = await copyToClipboard(text);
    showToast(success ? `${type} copiado` : 'Erro ao copiar', success ? 'success' : 'error', 2000);
  };

  const handleRenewCredential = (credential: SavedCredential) => {
    const identifier = getCredentialIdentifier(credential);
    if (!identifier) {
      showToast('Credencial sem usuário ou UUID para renovar', 'error');
      return;
    }
    setRenewalIdentifier(identifier);
    setShowRenewalModal(true);
  };

  const handleRenewalClose = () => {
    setShowRenewalModal(false);
    setRenewalIdentifier('');
    refreshCredentials();
    validateAll(true);
  };

  return (
    <Modal onClose={onClose} title="Credenciais" icon={Key}>
      <div className="flex flex-col h-full max-h-[85vh] sm:max-h-[90vh]" style={{ background: 'var(--bg)' }}>
        <div className="flex items-center justify-between gap-2 p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
            SSH e V2Ray salvos neste aparelho
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-2 px-4 min-h-[44px] rounded-xl font-semibold text-sm text-white touch-manipulation"
              style={{ background: 'var(--accent)' }}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Adicionar</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={validatingAll}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl touch-manipulation disabled:opacity-50"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              title="Atualizar e validar"
            >
              <RefreshCw className={`w-4 h-4 ${validatingAll ? 'animate-spin' : ''}`} style={{ color: 'var(--text)' }} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          {[
            { id: 'all' as const, label: 'Todas', count: credentials.length },
            { id: 'active' as const, label: 'Ativas', count: activeCount },
            { id: 'expired' as const, label: 'Expiradas', count: expiredCount },
          ].map((item) => {
            const selected = filter === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setFilter(item.id)}
                className="px-3 py-2.5 min-h-[44px] rounded-xl font-semibold text-xs sm:text-sm touch-manipulation"
                style={{
                  background: selected ? 'var(--accent)' : 'var(--surface)',
                  color: selected ? '#fff' : 'var(--text-muted)',
                  border: '1px solid var(--border)',
                }}
              >
                <div>{item.label}</div>
                <div className="text-[10px] mt-0.5 opacity-80">({item.count})</div>
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
          {error && (
            <div className="p-3 rounded-xl text-sm text-red-300" style={{ background: 'rgba(248,113,113,0.12)' }}>
              {error}
            </div>
          )}

          {filteredCredentials.length === 0 && (
            <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
              <Key className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma credencial encontrada</p>
              <p className="text-sm mt-1">Compre um plano ou adicione manualmente</p>
            </div>
          )}

          {filteredCredentials.map((credential) => {
            const status = getStatus(credential);
            const isValidating = validating === credential.id;
            const hasSSH = !!credential.ssh;
            const hasV2Ray = !!credential.v2ray;
            const canRenew = Boolean(getCredentialIdentifier(credential));
            const expired = status.tone === 'expired';

            return (
              <div
                key={credential.id}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: 'var(--surface)',
                  border: `1px solid ${expired ? 'rgba(248,113,113,0.35)' : 'var(--border)'}`,
                }}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold truncate" style={{ color: 'var(--text)' }}>
                          {credential.label}
                        </h3>
                        {credential.is_default && (
                          <Star className="w-4 h-4 flex-shrink-0 fill-yellow-400 text-yellow-400" />
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {hasSSH && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'var(--accent-dim)', color: 'var(--text-muted)' }}>
                            SSH
                          </span>
                        )}
                        {hasV2Ray && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'var(--accent-dim)', color: 'var(--text-muted)' }}>
                            V2Ray
                          </span>
                        )}
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{
                            background: expired ? 'rgba(248,113,113,0.16)' : status.tone === 'warn' ? 'rgba(251,191,36,0.16)' : 'rgba(52,211,153,0.16)',
                            color: expired ? '#fca5a5' : status.tone === 'warn' ? '#fcd34d' : '#6ee7b7',
                          }}
                        >
                          {expired ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {status.label}
                        </span>
                      </div>
                      {status.detail && (
                        <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                          verificado {status.detail}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => (credential.is_default ? null : handleSetDefault(credential.id))}
                      disabled={credential.is_default}
                      className="min-h-[40px] rounded-xl text-xs font-semibold touch-manipulation disabled:opacity-60"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text)', border: '1px solid var(--border)' }}
                    >
                      {credential.is_default ? 'Em uso' : 'Usar'}
                    </button>
                    <button
                      onClick={() => handleValidate(credential.id)}
                      disabled={isValidating}
                      className="min-h-[40px] rounded-xl text-xs font-semibold flex items-center justify-center gap-1 touch-manipulation disabled:opacity-50"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text)', border: '1px solid var(--border)' }}
                    >
                      {isValidating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      Validar
                    </button>
                    {canRenew && (
                      <button
                        onClick={() => handleRenewCredential(credential)}
                        className="min-h-[40px] rounded-xl text-xs font-semibold touch-manipulation"
                        style={{ background: 'var(--accent-dim)', color: 'var(--text)' }}
                      >
                        Renovar
                      </button>
                    )}
                    <button
                      onClick={() =>
                        setConfirmDelete({
                          show: true,
                          id: credential.id,
                          label: credential.label || 'esta credencial',
                        })
                      }
                      className="min-h-[40px] rounded-xl text-xs font-semibold flex items-center justify-center touch-manipulation"
                      style={{ background: 'rgba(248,113,113,0.12)', color: '#fca5a5' }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="px-4 pb-4 space-y-3 text-sm">
                  {hasSSH && (
                    <div className="p-3 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                      <h4 className="flex items-center gap-2 text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                        <Shield className="w-3.5 h-3.5" /> SSH
                      </h4>
                      <CopyRow label="Usuário" value={credential.ssh!.username} onCopy={() => handleCopy(credential.ssh!.username, 'Usuário SSH')} />
                      <CopyRow label="Senha" value="••••••••" onCopy={() => handleCopy(credential.ssh!.password, 'Senha SSH')} />
                    </div>
                  )}

                  {hasV2Ray && (
                    <div className="p-3 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                      <h4 className="flex items-center gap-2 text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                        <Shield className="w-3.5 h-3.5" /> V2Ray
                      </h4>
                      <CopyRow label="UUID" value={credential.v2ray!.uuid} onCopy={() => handleCopy(credential.v2ray!.uuid, 'UUID V2Ray')} />
                    </div>
                  )}

                  {credential.validation?.expiration_date && (
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Validade: {formatDate(credential.validation.expiration_date)}
                      {credential.validation.limit != null ? ` · limite ${credential.validation.limit}` : ''}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showAddModal && (
        <AddCredentialModal
          onClose={() => setShowAddModal(false)}
          onAdd={(cred) => {
            const id = addManualCredential(cred);
            showToast(id ? 'Credencial adicionada' : 'Erro ao salvar credencial', id ? 'success' : 'error');
            setShowAddModal(false);
          }}
        />
      )}

      {showRenewalModal && (
        <RenewalModal onClose={handleRenewalClose} initialUsername={renewalIdentifier} />
      )}

      <ConfirmModal
        isOpen={confirmDelete.show}
        title="Remover Credencial"
        message={`Tem certeza que deseja remover "${confirmDelete.label}"? Esta ação não pode ser desfeita.`}
        confirmText="Remover"
        cancelText="Cancelar"
        type="danger"
        onConfirm={() => {
          removeCredential(confirmDelete.id);
          setConfirmDelete({ show: false, id: '', label: '' });
          showToast('Credencial removida', 'success');
        }}
        onCancel={() => setConfirmDelete({ show: false, id: '', label: '' })}
      />
    </Modal>
  );
}

function CopyRow({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <div className="min-w-0">
        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{label}</div>
        <div className="font-mono text-xs truncate" style={{ color: 'var(--text)' }}>{value}</div>
      </div>
      <button
        onClick={onCopy}
        className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg touch-manipulation"
        style={{ color: 'var(--text-muted)' }}
      >
        <Copy className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

interface AddCredentialModalProps {
  onClose: () => void;
  onAdd: (credential: Omit<SavedCredential, 'id' | 'created_at'>) => void;
}

function AddCredentialModal({ onClose, onAdd }: AddCredentialModalProps) {
  const { showToast } = useToast();
  const [label, setLabel] = useState('');
  const [sshUsername, setSshUsername] = useState('');
  const [sshPassword, setSshPassword] = useState('');
  const [v2rayUuid, setV2rayUuid] = useState('');
  const [useSSH, setUseSSH] = useState(true);
  const [useV2Ray, setUseV2Ray] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!useSSH && !useV2Ray) {
      showToast('Selecione ao menos SSH ou V2Ray', 'warning');
      return;
    }
    if (useSSH && (!sshUsername || !sshPassword)) {
      showToast('Preencha usuário e senha SSH', 'warning');
      return;
    }
    if (useV2Ray && !v2rayUuid) {
      showToast('Preencha o UUID V2Ray', 'warning');
      return;
    }

    setIsSubmitting(true);
    const credential: Omit<SavedCredential, 'id' | 'created_at'> = {
      label: label || 'Credencial Manual',
      is_default: false,
      is_active: true,
    };
    if (useSSH) credential.ssh = { username: sshUsername, password: sshPassword };
    if (useV2Ray) credential.v2ray = { uuid: v2rayUuid };
    onAdd(credential);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className="rounded-2xl p-4 sm:p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text)' }}>Adicionar credencial</h2>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>SSH e/ou V2Ray</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Nome"
            className="w-full px-3 py-2.5 rounded-xl input-field outline-none text-sm allow-select"
          />
          <ProtocolToggle
            label="SSH"
            checked={useSSH}
            onChange={setUseSSH}
          />
          {useSSH && (
            <div className="space-y-2">
              <input type="text" value={sshUsername} onChange={(e) => setSshUsername(e.target.value)} placeholder="Usuário" className="w-full px-3 py-2.5 rounded-xl input-field outline-none text-sm allow-select" />
              <input type="password" value={sshPassword} onChange={(e) => setSshPassword(e.target.value)} placeholder="Senha" className="w-full px-3 py-2.5 rounded-xl input-field outline-none text-sm allow-select" />
            </div>
          )}
          <ProtocolToggle
            label="V2Ray"
            checked={useV2Ray}
            onChange={setUseV2Ray}
          />
          {useV2Ray && (
            <input type="text" value={v2rayUuid} onChange={(e) => setV2rayUuid(e.target.value)} placeholder="UUID" className="w-full px-3 py-2.5 rounded-xl input-field outline-none text-sm font-mono allow-select" />
          )}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 min-h-[44px] rounded-xl btn-secondary text-sm">Cancelar</button>
            <button type="submit" disabled={isSubmitting || (!useSSH && !useV2Ray)} className="flex-1 min-h-[44px] rounded-xl text-white text-sm font-semibold disabled:opacity-50" style={{ background: 'var(--accent)' }}>
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProtocolToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 w-full min-h-[44px] px-3 rounded-xl text-sm text-left touch-manipulation"
      style={{
        background: checked ? 'var(--accent-dim)' : 'var(--bg-elevated)',
        border: `1px solid ${checked ? 'var(--accent)' : 'var(--border)'}`,
        color: 'var(--text)',
      }}
      aria-pressed={checked}
    >
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
        style={{
          background: checked ? 'var(--accent)' : 'transparent',
          border: checked ? 'none' : '1.5px solid var(--text-muted)',
        }}
      >
        {checked && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path d="M2.5 6.2L5 8.7L9.5 3.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {label}
    </button>
  );
}
