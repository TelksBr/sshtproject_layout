import { localizeMessage, message as tr, useMessages } from '../../i18n/messages';
import { useEffect, useState } from 'react';
import { Copy, FileKey, Loader } from '../../utils/icons';
import { Modal } from './Modal';
import { copyImportPublicKey, copyToClipboard, getImportPublicKey } from '../../utils/appFunctions';
import { useToast } from '../../hooks/useToast';

interface ImportKeyModalProps {
  onClose: () => void;
}

export function ImportKeyModal({ onClose }: ImportKeyModalProps) {
  useMessages();
  const { showToast } = useToast();
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    try {
      const value = getImportPublicKey();
      if (!value) {
        setError(tr("m44cb0a338c"));
        setKey('');
      } else {
        setKey(value);
        setError(null);
      }
    } catch {
      setError(tr("m44cb0a338c"));
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
      showToast(tr("mcf02e23160"), 'success');
    } catch {
      showToast(tr("m096dfbb5b8"), 'error');
    } finally {
      setCopying(false);
    }
  };

  return (
    <Modal onClose={onClose} title={tr("m27c22276c2")} icon={FileKey}>
      <div className="p-4 sm:p-6 space-y-4">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {tr("m2862afd833")}</p>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8">
            <Loader className="w-5 h-5 animate-spin" style={{ color: 'var(--accent)' }} />
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {tr("m0c8d6a6a49")}</span>
          </div>
        ) : error ? (
          <p className="text-sm text-center text-red-400 py-4">{localizeMessage(error || "")}</p>
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
          {tr("m7cd76ef5b6")}</button>
      </div>
    </Modal>
  );
}
