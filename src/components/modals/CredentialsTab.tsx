import React, { useState } from 'react';
import { Modal } from './Modal';
import RenewalModal from './RenewalModal';
import { ConfirmModal } from '../ConfirmModal';
import { useCredentialsManager } from '../../hooks/useCredentialsManager';
import { useToast } from '../../hooks/useToast';
import { SavedCredential, purchaseStorage } from '../../utils/purchaseStorageManager';
import { callVoid } from '../../utils/dtunnelBridge';
import { copyToClipboard } from '../../utils/nativeClipboard';
import { 
  Key, 
  Star, 
  Trash2, 
  Edit2, 
  Plus, 
  RefreshCw, 
  Clock, 
  Check,
  AlertTriangle,
  Copy,
  CheckCircle,
  Shield
} from '../../utils/icons';

interface CredentialsTabProps {
  onClose: () => void;
}

export function CredentialsTab({ onClose }: CredentialsTabProps) {
  const {
    credentials,
    loading,
    error,
    refreshCredentials,
    validateCredentials,
    setDefault,
    updateLabel,
    removeCredential,
    addManualCredential
  } = useCredentialsManager();

  const { showToast } = useToast();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [renewalUsername, setRenewalUsername] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [validating, setValidating] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ show: boolean; id: string; label: string }>({ show: false, id: '', label: '' });

  // Filtrar credenciais
  const filteredCredentials = React.useMemo(() => {
    if (filter === 'active') {
      return credentials.filter(c => c.is_active && !purchaseStorage.isCredentialExpired(c));
    }
    if (filter === 'expired') {
      return credentials.filter(c => purchaseStorage.isCredentialExpired(c));
    }
    return credentials;
  }, [credentials, filter]);

  // Formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handler para validar credencial
  const handleValidate = async (id: string) => {
    setValidating(id);
    const success = await validateCredentials(id);
    setValidating(null);
    if (success) {
      showToast('Credenciais validadas com sucesso!', 'success');
    } else {
      showToast('Falha na validação. Verifique as credenciais.', 'error');
    }
  };

  // Handler para editar label
  const handleStartEdit = (credential: SavedCredential) => {
    setEditingId(credential.id);
    setEditLabel(credential.label || '');
  };

  const handleSaveEdit = (id: string) => {
    if (editLabel.trim()) {
      updateLabel(id, editLabel.trim());
    }
    setEditingId(null);
    setEditLabel('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditLabel('');
  };

  // Handler para definir como padrão
  const handleSetDefault = (id: string) => {
    setDefault(id);
  };

  // Handler para remover
  const handleRemove = (credential: SavedCredential) => {
    setConfirmDelete({
      show: true,
      id: credential.id,
      label: credential.label || 'esta credencial'
    });
  };

  // Confirmar remoção
  const confirmRemove = () => {
    removeCredential(confirmDelete.id);
    setConfirmDelete({ show: false, id: '', label: '' });
    showToast('Credencial removida com sucesso', 'success');
  };

  // Cancelar remoção
  const cancelRemove = () => {
    setConfirmDelete({ show: false, id: '', label: '' });
  };

  // Copiar para clipboard via SDK/browser nativo
  const handleCopyToClipboard = async (text: string, type: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      showToast(`${type} copiado!`, 'success', 2000);
    } else {
      showToast('Erro ao copiar para área de transferência', 'error');
    }
  };

  // Obter dias até expiração do cache de validação
  const getDaysFromValidation = (credential: SavedCredential): number | null => {
    if (!credential.validation?.expiration_date) return null;
    return purchaseStorage.getDaysUntilExpiration(credential);
  };

  // Aplicar credenciais na aplicação
  const handleApplyCredentials = (credential: SavedCredential) => {
    try {
      // Aplicar SSH
      if (credential.ssh) {
        callVoid('DtUsername', 'set', [credential.ssh.username]);
        callVoid('DtPassword', 'set', [credential.ssh.password]);
      }

      // Aplicar V2Ray UUID
      if (credential.v2ray) {
        callVoid('DtUuid', 'set', [credential.v2ray.uuid]);
      }

      showToast('Credenciais aplicadas com sucesso!', 'success');
      
      // Definir como padrão automaticamente
      if (!credential.is_default) {
        setDefault(credential.id);
      }
    } catch (error) {
      showToast('Erro ao aplicar credenciais', 'error');
    }
  };

  // Abrir modal de renovação
  const handleRenewCredential = (credential: SavedCredential) => {
    if (credential.ssh?.username) {
      setRenewalUsername(credential.ssh.username);
      setShowRenewalModal(true);
    } else {
      showToast('Credencial sem usuário SSH para renovar', 'error');
    }
  };

  // Fechar modal de renovação e atualizar lista
  const handleRenewalClose = () => {
    setShowRenewalModal(false);
    setRenewalUsername('');
    refreshCredentials();
  };

  return (
    <Modal onClose={onClose}>
      <div className="flex flex-col h-full max-h-[85vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 md:p-4 border-b border-[#6205D5]/30">
          <div className="flex items-center gap-2 md:gap-3">
            <Key className="w-5 h-5 md:w-6 md:h-6 text-[#6205D5]" />
            <h2 className="text-base md:text-xl font-bold text-white">Credenciais</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-[#6205D5] hover:bg-[#4B0082] rounded-lg transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden md:inline">Adicionar</span>
            </button>
            <button
              onClick={refreshCredentials}
              disabled={loading}
              className="p-2 rounded-lg bg-[#6205D5]/20 hover:bg-[#6205D5]/30 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-white ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-3 gap-2 p-3 md:p-4 border-b border-[#6205D5]/20">
          <button
            onClick={() => setFilter('all')}
            className={`px-2 md:px-4 py-2 rounded-lg font-semibold transition-colors text-xs md:text-sm ${
              filter === 'all'
                ? 'bg-[#6205D5] text-white'
                : 'bg-[#1a0628] text-gray-400 hover:bg-[#6205D5]/20'
            }`}
          >
            <span className="hidden md:inline">Todas </span>({credentials.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-2 md:px-4 py-2 rounded-lg font-semibold transition-colors text-xs md:text-sm ${
              filter === 'active'
                ? 'bg-green-600 text-white'
                : 'bg-[#1a0628] text-gray-400 hover:bg-green-600/20'
            }`}
          >
            <span className="hidden md:inline">Ativas </span>({credentials.filter(c => c.is_active && !purchaseStorage.isCredentialExpired(c)).length})
          </button>
          <button
            onClick={() => setFilter('expired')}
            className={`px-2 md:px-4 py-2 rounded-lg font-semibold transition-colors text-xs md:text-sm ${
              filter === 'expired'
                ? 'bg-red-600 text-white'
                : 'bg-[#1a0628] text-gray-400 hover:bg-red-600/20'
            }`}
          >
            <span className="hidden md:inline">Expiradas </span>({credentials.filter(c => purchaseStorage.isCredentialExpired(c)).length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3">
          {error && (
            <div className="bg-red-900/30 border border-red-600 p-4 rounded-lg text-red-300">
              {error}
            </div>
          )}

          {filteredCredentials.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Key className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Nenhuma credencial encontrada</p>
              <p className="text-sm mt-2">Compre um plano ou adicione manualmente</p>
            </div>
          )}

          {filteredCredentials.map((credential) => {
            const daysRemaining = getDaysFromValidation(credential);
            const expired = credential.validation ? purchaseStorage.isCredentialExpired(credential) : false;
            const isEditing = editingId === credential.id;
            const isValidating = validating === credential.id;
            const hasSSH = !!credential.ssh;
            const hasV2Ray = !!credential.v2ray;

            return (
              <div
                key={credential.id}
                className={`bg-gradient-to-br p-3 md:p-4 rounded-lg border-2 transition-all ${
                  credential.is_default
                    ? 'from-[#6205D5]/20 to-[#4B0082]/20 border-[#6205D5]'
                    : expired
                    ? 'from-red-900/10 to-red-800/10 border-red-600/30'
                    : 'from-[#1a0628] to-[#2a1038] border-[#6205D5]/20'
                }`}
              >
                <div className="flex items-start justify-between mb-2 md:mb-3 gap-2">
                  <div className="flex-1">
                    {/* Label */}
                    {isEditing ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          className="flex-1 px-3 py-1 bg-[#1a0628] border border-[#6205D5] rounded text-white"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(credential.id)}
                          className="p-2 bg-green-600 hover:bg-green-700 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-2 bg-gray-600 hover:bg-gray-700 rounded"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base md:text-lg font-bold text-white break-all">
                          {credential.label}
                        </h3>
                        {credential.is_default && (
                          <Star className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                        )}
                        <button
                          onClick={() => handleStartEdit(credential)}
                          className="p-1 hover:bg-[#6205D5]/30 rounded flex-shrink-0"
                        >
                          <Edit2 className="w-3 h-3 md:w-4 md:h-4 text-gray-400" />
                        </button>
                      </div>
                    )}

                    {/* Type Badges */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {hasSSH && (
                        <span className="px-2 py-0.5 md:py-1 rounded text-xs font-semibold bg-blue-600/30 text-blue-300">
                          SSH
                        </span>
                      )}
                      {hasV2Ray && (
                        <span className="px-2 py-0.5 md:py-1 rounded text-xs font-semibold bg-purple-600/30 text-purple-300">
                          V2RAY
                        </span>
                      )}
                      
                      {expired ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 md:py-1 bg-red-600/30 text-red-300 rounded text-xs font-semibold">
                          <AlertTriangle className="w-3 h-3" />
                          Expirada
                        </span>
                      ) : daysRemaining !== null && (
                        <span className="flex items-center gap-1 px-2 py-0.5 md:py-1 bg-green-600/30 text-green-300 rounded text-xs font-semibold">
                          <Clock className="w-3 h-3" />
                          {daysRemaining}d
                        </span>
                      )}
                      
                      {credential.validation && (
                        <span className="text-[10px] md:text-xs text-gray-500 truncate">
                          Atualizado: {formatDate(credential.validation.last_checked!)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 md:gap-2 flex-shrink-0">
                    {/* Botão Renovar - apenas se expirada e tem SSH */}
                    {expired && hasSSH && (
                      <button
                        onClick={() => handleRenewCredential(credential)}
                        className="p-2 bg-yellow-600/30 hover:bg-yellow-600/50 rounded transition-colors"
                        title="Renovar credencial"
                      >
                        <RefreshCw className="w-4 h-4 text-yellow-400" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleApplyCredentials(credential)}
                      className="p-2 bg-[#6205D5]/30 hover:bg-[#6205D5]/50 rounded transition-colors"
                      title="Aplicar credenciais"
                    >
                      <Check className="w-4 h-4 text-[#6205D5]" />
                    </button>
                    <button
                      onClick={() => handleValidate(credential.id)}
                      disabled={isValidating}
                      className="p-2 bg-green-600/20 hover:bg-green-600/40 rounded transition-colors disabled:opacity-50"
                      title="Validar via CheckUser"
                    >
                      {isValidating ? (
                        <RefreshCw className="w-4 h-4 text-green-400 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      )}
                    </button>
                    {!credential.is_default && (
                      <button
                        onClick={() => handleSetDefault(credential.id)}
                        className="p-2 bg-[#6205D5]/20 hover:bg-[#6205D5]/40 rounded transition-colors"
                        title="Definir como padrão"
                      >
                        <Star className="w-4 h-4 text-gray-400" />
                      </button>
                    )}
                    <button
                      onClick={() => handleRemove(credential)}
                      className="p-2 bg-red-600/20 hover:bg-red-600/40 rounded transition-colors"
                      title="Remover"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Credentials Info */}
                <div className="space-y-2 bg-black/30 p-2 md:p-3 rounded text-sm">
                  {/* SSH Credentials */}
                  {hasSSH && (
                    <div className="space-y-2 pb-2 border-b border-[#6205D5]/20">
                      <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
                        <Shield className="w-4 h-4" />
                        <span>SSH</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Usuário:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-mono text-sm">{credential.ssh!.username}</span>
                          <button
                            onClick={() => handleCopyToClipboard(credential.ssh!.username, 'Usuário SSH')}
                            className="p-1 hover:bg-[#6205D5]/30 rounded"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Senha:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-mono text-sm">••••••••</span>
                          <button
                            onClick={() => handleCopyToClipboard(credential.ssh!.password, 'Senha SSH')}
                            className="p-1 hover:bg-[#6205D5]/30 rounded"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* V2Ray Credentials */}
                  {hasV2Ray && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
                        <Shield className="w-4 h-4" />
                        <span>V2Ray</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">UUID:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-mono text-xs">{credential.v2ray!.uuid.substring(0, 20)}...</span>
                          <button
                            onClick={() => handleCopyToClipboard(credential.v2ray!.uuid, 'UUID V2Ray')}
                            className="p-1 hover:bg-[#6205D5]/30 rounded"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Validation Data (cache) */}
                  {credential.validation && (
                    <div className="mt-3 pt-3 border-t border-[#6205D5]/20 space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Limite:</span>
                        <span className="text-white">{credential.validation.limit || 'N/A'}</span>
                      </div>
                      {credential.validation.count_connections !== undefined && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Conexões:</span>
                          <span className="text-white">{credential.validation.count_connections}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Expira em:</span>
                        <span className="text-white">{formatDate(credential.validation.expiration_date!)}</span>
                      </div>
                    </div>
                  )}

                  {/* Servers */}
                  {credential.servers && credential.servers.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#6205D5]/20">
                      <div className="text-gray-400 text-sm mb-2">Servidores ({credential.servers.length}):</div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {credential.servers.map((server, idx) => (
                          <div key={idx} className="text-xs text-gray-300 font-mono">
                            {server.name} - {server.host}:{server.port}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#6205D5]/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#6205D5] hover:bg-[#4B0082] rounded-lg font-semibold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Add Credential Modal */}
      {showAddModal && (
        <AddCredentialModal
          onClose={() => setShowAddModal(false)}
          onAdd={(cred) => {
            addManualCredential(cred);
            setShowAddModal(false);
          }}
        />
      )}

      {/* Renewal Modal */}
      {showRenewalModal && (
        <RenewalModal
          onClose={handleRenewalClose}
          initialUsername={renewalUsername}
        />
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmDelete.show}
        title="Remover Credencial"
        message={`Tem certeza que deseja remover "${confirmDelete.label}"? Esta ação não pode ser desfeita.`}
        confirmText="Remover"
        cancelText="Cancelar"
        type="danger"
        onConfirm={confirmRemove}
        onCancel={cancelRemove}
      />
    </Modal>
  );
}

// Modal para adicionar credencial manualmente
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
      is_active: true
    };

    if (useSSH) {
      credential.ssh = {
        username: sshUsername,
        password: sshPassword
      };
    }

    if (useV2Ray) {
      credential.v2ray = {
        uuid: v2rayUuid
      };
    }

    onAdd(credential);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-[#26074d]/98 to-[#100322]/98 rounded-xl sm:rounded-2xl border-2 border-[#6205D5]/30 p-4 sm:p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-[#6205D5]/20">
        {/* Cabeçalho */}
        <div className="mb-5 sm:mb-6">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-1">
            ➕ Adicionar Credencial
          </h2>
          <p className="text-xs sm:text-sm text-gray-400">
            Adicione manualmente suas credenciais SSH ou V2Ray
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* Label/Nome */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2">
              📝 Nome/Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: VPN Principal"
              className="
                w-full px-3 sm:px-4 py-2.5 sm:py-3
                bg-[#1a0533]/50 border-2 border-[#6205D5]/30
                rounded-lg sm:rounded-xl
                text-white text-sm sm:text-base
                placeholder-gray-500/70
                focus:outline-none focus:border-[#6205D5]/70 focus:bg-[#1a0533]/70
                transition-all
              "
            />
          </div>

          {/* SSH Card */}
          <div className={`
            p-3 sm:p-4 rounded-lg sm:rounded-xl
            border-2 transition-all duration-200
            ${useSSH 
              ? 'bg-blue-900/20 border-blue-600/40' 
              : 'bg-[#1a0533]/30 border-gray-700/30 opacity-60'
            }
          `}>
            <div className="flex items-center gap-3 mb-3 sm:mb-4 cursor-pointer" onClick={() => setUseSSH(!useSSH)}>
              <input
                type="checkbox"
                id="useSSH"
                checked={useSSH}
                onChange={(e) => setUseSSH(e.target.checked)}
                className="w-5 h-5 accent-blue-500 cursor-pointer"
              />
              <label htmlFor="useSSH" className="flex items-center gap-2 cursor-pointer flex-1">
                <span className="text-lg">🔐</span>
                <span className="font-semibold text-white text-sm sm:text-base">SSH</span>
                {useSSH && <span className="text-[10px] sm:text-xs bg-blue-600/50 px-2 py-0.5 rounded-full text-blue-200">ATIVO</span>}
              </label>
            </div>

            {useSSH && (
              <div className="space-y-3 sm:space-y-3.5">
                <div>
                  <label className="block text-xs sm:text-sm text-gray-400 mb-1.5">
                    Usuário:
                  </label>
                  <input
                    type="text"
                    value={sshUsername}
                    onChange={(e) => setSshUsername(e.target.value)}
                    placeholder="seu_usuario"
                    className="
                      w-full px-3 sm:px-3.5 py-2 sm:py-2.5
                      bg-[#1a0533] border-2 border-[#6205D5]/30
                      rounded-lg text-white text-sm sm:text-base
                      focus:outline-none focus:border-[#6205D5]/70
                      transition-all
                    "
                    required={useSSH}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm text-gray-400 mb-1.5">
                    Senha:
                  </label>
                  <input
                    type="password"
                    value={sshPassword}
                    onChange={(e) => setSshPassword(e.target.value)}
                    placeholder="••••••••"
                    className="
                      w-full px-3 sm:px-3.5 py-2 sm:py-2.5
                      bg-[#1a0533] border-2 border-[#6205D5]/30
                      rounded-lg text-white text-sm sm:text-base
                      focus:outline-none focus:border-[#6205D5]/70
                      transition-all
                    "
                    required={useSSH}
                  />
                </div>
              </div>
            )}
          </div>

          {/* V2Ray Card */}
          <div className={`
            p-3 sm:p-4 rounded-lg sm:rounded-xl
            border-2 transition-all duration-200
            ${useV2Ray 
              ? 'bg-purple-900/20 border-purple-600/40' 
              : 'bg-[#1a0533]/30 border-gray-700/30 opacity-60'
            }
          `}>
            <div className="flex items-center gap-3 mb-3 sm:mb-4 cursor-pointer" onClick={() => setUseV2Ray(!useV2Ray)}>
              <input
                type="checkbox"
                id="useV2Ray"
                checked={useV2Ray}
                onChange={(e) => setUseV2Ray(e.target.checked)}
                className="w-5 h-5 accent-purple-500 cursor-pointer"
              />
              <label htmlFor="useV2Ray" className="flex items-center gap-2 cursor-pointer flex-1">
                <span className="text-lg">🌐</span>
                <span className="font-semibold text-white text-sm sm:text-base">V2Ray</span>
                {useV2Ray && <span className="text-[10px] sm:text-xs bg-purple-600/50 px-2 py-0.5 rounded-full text-purple-200">ATIVO</span>}
              </label>
            </div>

            {useV2Ray && (
              <div>
                <label className="block text-xs sm:text-sm text-gray-400 mb-1.5">
                  UUID:
                </label>
                <input
                  type="text"
                  value={v2rayUuid}
                  onChange={(e) => setV2rayUuid(e.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="
                    w-full px-3 sm:px-3.5 py-2 sm:py-2.5
                    bg-[#1a0533] border-2 border-[#6205D5]/30
                    rounded-lg text-white text-[11px] sm:text-xs font-mono
                    focus:outline-none focus:border-[#6205D5]/70
                    transition-all
                  "
                  required={useV2Ray}
                />
              </div>
            )}
          </div>

          {/* Aviso */}
          {!useSSH && !useV2Ray && (
            <div className="p-2.5 sm:p-3 bg-yellow-900/30 border-2 border-yellow-600/40 rounded-lg">
              <p className="text-[11px] sm:text-xs text-yellow-300/90">
                ⚠️ Selecione ao menos SSH ou V2Ray para continuar
              </p>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-2.5 sm:gap-3 pt-2 sm:pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="
                flex-1 min-h-[44px] sm:min-h-[48px]
                px-3 sm:px-4
                bg-[#26074d]/80 hover:bg-[#26074d] border-2 border-[#6205D5]/30 hover:border-[#6205D5]/60
                text-white text-sm sm:text-base font-semibold
                rounded-lg sm:rounded-xl transition-all active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              ✕ Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!useSSH && !useV2Ray)}
              className="
                flex-1 min-h-[44px] sm:min-h-[48px]
                px-3 sm:px-4
                bg-gradient-to-r from-[#6205D5] to-[#7a19eb] hover:from-[#7a19eb] hover:to-[#6205D5]
                text-white text-sm sm:text-base font-semibold
                rounded-lg sm:rounded-xl transition-all active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
              "
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="hidden sm:inline">Adicionando...</span>
                </>
              ) : (
                <>
                  <span>✅</span>
                  <span>Adicionar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
