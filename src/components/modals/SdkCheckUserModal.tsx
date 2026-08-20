import { useState } from 'react';
import { CalendarClock, RefreshCw, AlertTriangle } from '../../utils/icons';
import { Modal } from './Modal';
import { CheckUserDetails } from './CheckUserDetails';
import { useSdkCheckUserListener } from '../../hooks/useSdkCheckUserListener';
import { parseSdkCheckUserPayload, UserInfo } from '../../utils/checkUserUtils';
import { purchaseStorage } from '../../utils/purchaseStorageManager';

export function SdkCheckUserModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useSdkCheckUserListener({
    onStarted: () => {
      setOpen(true);
      setLoading(true);
      setError(null);
      setUserInfo(null);
    },
    onResult: (payload) => {
      const info = parseSdkCheckUserPayload(payload);
      setLoading(false);
      if (!info) {
        setError('Não foi possível ler o resultado da verificação.');
        setOpen(true);
        return;
      }
      setUserInfo(info);
      setError(null);
      setOpen(true);

      const existing = purchaseStorage.findCredentialByIdentity(info.username);
      if (existing) {
        purchaseStorage.updateValidation(existing.id, {
          limit: info.limit || info.limit_connections,
          expiration_date: info.expiration_date,
          count_connections: info.count_connections,
          expiration_days: info.expiration_days,
          source: 'checkuser',
        });
      }
    },
    onError: (payload) => {
      const message =
        typeof payload === 'string'
          ? payload
          : (payload as { message?: string })?.message || 'Falha ao verificar o usuário.';
      setLoading(false);
      setUserInfo(null);
      setError(message);
      setOpen(true);
    },
  });

  const handleClose = () => {
    setOpen(false);
    setLoading(false);
    setError(null);
    setUserInfo(null);
  };

  if (!open) return null;

  if (loading) {
    return (
      <Modal onClose={handleClose} title="Check User" icon={CalendarClock}>
        <div className="flex flex-col items-center justify-center gap-3 p-8">
          <RefreshCw className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Verificando credenciais...
          </p>
        </div>
      </Modal>
    );
  }

  if (error) {
    return (
      <Modal onClose={handleClose} title="Check User" icon={AlertTriangle}>
        <div className="p-4 rounded-lg glass-effect text-center">
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            {error}
          </p>
          <button
            type="button"
            onClick={handleClose}
            className="w-full min-h-[44px] rounded-lg font-medium text-white"
            style={{ background: 'var(--accent)' }}
          >
            Fechar
          </button>
        </div>
      </Modal>
    );
  }

  if (!userInfo) return null;

  return (
    <Modal onClose={handleClose} title="Check User" icon={CalendarClock}>
      <div className="p-1">
        <CheckUserDetails userInfo={userInfo} />
      </div>
    </Modal>
  );
}
