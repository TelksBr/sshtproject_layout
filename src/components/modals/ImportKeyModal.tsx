import { useEffect, useState } from 'react';
import { Copy, FileKey, Loader } from '../../utils/icons';
import { Modal } from './Modal';
import { copyImportPublicKey, copyToClipboard, getImportPublicKey } from '../../utils/appFunctions';
import { useToast } from '../../hooks/useToast';

interface ImportKeyModalProps {
  onClose: () => void;
}

export function ImportKeyModal({ onClose }: ImportKeyModalProps) {
  const { showToast } = useToast();
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    try {
      const value = getImportPublicKey();
      if (!value) {
        setError('Não foi possível obter a chave de importação.');
        setKey('');
      } else {
        setKey(value);
        setError(null);
      }
    } catch {
      setError('Não foi possível obter a chave de importação.');
      setKey('');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCopy = () => {
    if (!key || copying) return;
    setCopying(true);
    try {
      copyImportPublicKey();
      copyToClipboard(key);
      showToast('Chave copiada', 'success');
    } catch {
      showToast('Não foi possível copiar a chave', 'error');
    } finally {
      setCopying(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Chave de importação" icon={FileKey}>
      <div className="p-4 sm:p-6 space-y-4">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Use esta chave para importar configurações offline neste aparelho.
        </p>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8">
            <Loader className="w-5 h-5 animate-spin" style={{ color: 'var(--accent)' }} />
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Carregando chave...
            </span>
          </div>
        ) : error ? (
          <p className="text-sm text-center text-red-400 py-4">{error}</p>
        ) : (
          <div
            className="rounded-xl p-3 break-all font-mono text-sm select-all allow-select"
            style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
          >
            {key}
          </div>
        )}

        <button
          type="button"
          onClick={handleCopy}
          disabled={loading || !key || copying}
          className="w-full min-h-[44px] rounded-xl btn-secondary font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Copy className="w-4 h-4" />
          Copiar chave
        </button>
      </div>
    </Modal>
  );
}
