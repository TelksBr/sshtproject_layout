import { localizeMessage, message as tr, useMessages } from '../../i18n/messages';
import { useState } from 'react';
import { CalendarClock, RefreshCw, AlertTriangle, Search } from '../../utils/icons';
import { Modal } from './Modal';
import { CheckUserDetails } from './CheckUserDetails';
import { fetchUserInfo, UserInfo } from '../../utils/checkUserUtils';
import { purchaseStorage } from '../../utils/purchaseStorageManager';

interface CheckUserProps {
  onClose: () => void;
}

export function CheckUser({ onClose }: CheckUserProps) {
  useMessages();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const handleCheck = async () => {
    if (!username.trim()) {
      setError(tr("m2469ab9124"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const info = await fetchUserInfo(username.trim());
      setUserInfo(info);

      const existing = purchaseStorage.findCredentialByIdentity(info.username, username.trim());
      if (existing) {
        purchaseStorage.updateValidation(existing.id, {
          limit: info.limit || info.limit_connections,
          expiration_date: info.expiration_date,
          count_connections: info.count_connections,
          expiration_days: info.expiration_days,
          source: 'checkuser',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : tr("meb71224d8c"));
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <Modal onClose={onClose} title={tr("m6dba8ec268")} icon={AlertTriangle}>
        <div className="flex-1">
          <header className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 lg:w-14 lg:h-14 2xl:w-16 2xl:h-16 rounded-full bg-[#1a1624] flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 text-[#b7abc9]" />
            </div>
          </header>

          <div className="p-4 lg:p-6 2xl:p-8 rounded-lg glass-effect text-center">
            <p className="text-[#b7abc9]/80 text-sm lg:text-base 2xl:text-lg mb-4">{localizeMessage(error || "")}</p>
            <button
              onClick={() => setError(null)}
              className="w-full min-h-[44px] lg:min-h-[48px] 2xl:min-h-[56px] rounded-lg font-medium bg-[#8b5cf6] text-[#b7abc9] hover:bg-[#8b5cf6]/90 transition-colors text-sm lg:text-base 2xl:text-lg"
            >
              {tr("mfe3fe85b0c")}</button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose} title={tr("m4b29727380")} icon={CalendarClock}>
      <div className="flex-1">
        {!userInfo ? (
          <div className="p-4 lg:p-5 2xl:p-6 rounded-lg glass-effect">
            <div className="flex gap-2 mb-4">
              <input dir="auto"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={tr("mf1fcdc3a60")}
                className="flex-1 min-h-[44px] lg:min-h-[48px] 2xl:min-h-[56px] px-4 rounded-xl outline-none allow-select text-sm lg:text-base 2xl:text-lg"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text)', border: '1px solid var(--border)' }}
              />
              <button
                onClick={handleCheck}
                disabled={loading}
                className="w-[44px] h-[44px] lg:w-[48px] lg:h-[48px] 2xl:w-[56px] 2xl:h-[56px] flex items-center justify-center rounded-xl text-white transition-all disabled:opacity-50 flex-shrink-0 active:scale-95"
                style={{ background: 'var(--accent)' }}
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 lg:w-6 lg:h-6 animate-spin" />
                ) : (
                  <Search className="w-5 h-5 lg:w-6 lg:h-6" />
                )}
              </button>
            </div>
          </div>
        ) : (
          <CheckUserDetails
            userInfo={userInfo}
            headerAction={
              <button
                type="button"
                onClick={() => setUserInfo(null)}
                className="p-2 rounded-full hover:bg-[#8b5cf6]/10 transition-colors"
                aria-label={tr("m80beb3cf08")}
              >
                <RefreshCw className="w-5 h-5 text-[#8b5cf6]" />
              </button>
            }
          />
        )}
      </div>
    </Modal>
  );
}
