import { message as tr, useMessages } from '../../i18n/messages';
import { useState } from 'react';
import { CalendarClock, RefreshCw, AlertTriangle } from '../../utils/icons';
import { Modal } from './Modal';
import { CheckUserDetails } from './CheckUserDetails';
import { useSdkCheckUserListener } from '../../hooks/useSdkCheckUserListener';
import { parseSdkCheckUserPayload, UserInfo } from '../../utils/checkUserUtils';
import { purchaseStorage } from '../../utils/purchaseStorageManager';
import { sanitizeLogHtml } from '../../utils/appFunctions';

export function SdkCheckUserModal() {
  useMessages();
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
        setError(tr("m50c5cad54f"));
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
          : (payload as { message?: string })?.message || tr("ma5a1aad105");
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
      <Modal onClose={handleClose} title={tr("m638e8bd0c4")} icon={CalendarClock}>
        <div className="flex flex-col items-center justify-center gap-3 p-8">
          <RefreshCw className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {tr("me59c897524")}</p>
        </div>
      </Modal>
    );
  }

  if (error) {
    return (
      <Modal onClose={handleClose} title={tr("m638e8bd0c4")} icon={AlertTriangle}>
        <div className="p-4 rounded-lg glass-effect text-center">
          <p
            className="text-sm mb-4"
            style={{ color: 'var(--text-muted)' }}
            dangerouslySetInnerHTML={{ __html: sanitizeLogHtml(error) }}
          />
          <button
            type="button"
            onClick={handleClose}
            className="w-full min-h-[44px] rounded-lg font-medium text-white"
            style={{ background: 'var(--accent)' }}
          >
            {tr("m0f2bd88ef0")}</button>
        </div>
      </Modal>
    );
  }

  if (!userInfo) return null;

  return (
    <Modal onClose={handleClose} title={tr("m638e8bd0c4")} icon={CalendarClock}>
      <div className="p-1">
        <CheckUserDetails userInfo={userInfo} />
      </div>
    </Modal>
  );
}
