import { localizeMessage, message as tr, useMessages } from '../../i18n/messages';
import { useState } from 'react';
import { Modal } from './Modal';
import { requestCredentialRecovery } from '../../utils/salesUtils';
import { validateEmail } from '../../utils/emailValidation';
import { Mail, Search } from '../../utils/icons';

interface RecoveryModalProps {
  onClose: () => void;
}

export function RecoveryModal({ onClose }: RecoveryModalProps) {
  useMessages();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  async function handleRecoverySubmit() {
    // Validar email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error || tr("m833766bf69"));
      return;
    }

    setEmailError('');
    setIsLoading(true);
    setError('');

    try {
      const response = await requestCredentialRecovery(email.trim());
      setSuccess(true);
      setSuccessMessage(response.message);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleClose() {
    setEmail('');
    setEmailError('');
    setError('');
    setSuccess(false);
    setSuccessMessage('');
    onClose();
  }

  if (success) {
    return (
      <Modal onClose={handleClose} title={tr("m5ffd0919ff")} icon={Mail}>
        <div className="p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-white" />
            </div>
            
            <h3 className="text-xl font-semibold text-white">{tr("mc4b2682466")}</h3>
            
            <div className="bg-green-900/30 border border-green-600 p-4 rounded-lg">
              <p className="text-green-300 text-sm text-center">
                {successMessage}
              </p>
            </div>

            <div className="bg-blue-900/30 border border-blue-600 p-4 rounded-lg">
              <div className="text-blue-300 text-sm">
                <div className="font-semibold mb-2">{tr("m86cb74e3ad")}</div>
                <div className="space-y-1 text-xs text-start">
                  <div>{tr("mb1303c0628")}</div>
                  <div>{tr("m12feb5e355")}</div>
                  <div>{tr("m96eaf98572")}</div>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-400">
              {tr("m11806c5d4b")}</div>

            <button
              onClick={handleClose}
              className="w-full py-3 px-4 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-semibold"
            >
              {tr("m9f93738a03")}</button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={handleClose} title={tr("m98d25f38ad")} icon={Search}>
      <div className="p-6">
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text)' }}>{tr("m98d25f38ad")}</h3>
            <p style={{ color: 'var(--text-muted)' }}>{tr("m7368f7845d")}</p>
          </div>

          <div className="p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
              <div className="font-semibold mb-2" style={{ color: 'var(--accent)' }}>{tr("me159127cf0")}</div>
              <div className="space-y-1 text-xs">
                <div>{tr("md255656c4d")}</div>
                <div>{tr("m018e883352")}</div>
                <div>{tr("md2c212a926")}</div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
              {tr("m5439234931")}</label>
            <input dir="ltr"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleRecoverySubmit()}
              className="w-full px-3 py-3 rounded-xl text-sm outline-none allow-select"
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
              }}
              placeholder="seu@email.com"
              disabled={isLoading}
            />
            {emailError && (
              <p className="text-rose-400 text-sm mt-1 font-medium">{localizeMessage(emailError || "")}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleRecoverySubmit}
              disabled={isLoading || !email.trim()}
              className="flex-1 py-3 px-4 text-white rounded-xl transition-all duration-200 flex items-center justify-center font-semibold shadow-lg disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
              style={{ background: 'var(--accent)' }}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  {tr("m07a76f7870")}</>
              )}
            </button>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-600 p-3 rounded-lg">
              <p className="text-red-300 text-sm">{localizeMessage(error || "")}</p>
            </div>
          )}

          <div className="bg-gray-800/50 p-3 rounded-lg">
            <p className="text-gray-400 text-xs text-center">
              {tr("m805b893a5a")}</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
