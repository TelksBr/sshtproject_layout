import React, { useState } from 'react';
import { generateTestCredentials } from '../../utils/salesUtils';
import { Modal } from './Modal';
import { Mail, Timer } from '../../utils/icons';

interface TestGenerateModalProps {
  onClose: () => void;
}

type SuccessData = {
  email: string;
  expires_in_hours: number;
  expiration_date: string;
  sent_at: string;
  credentials_type: string[];
};

type CooldownData = {
  hours_remaining: number;
  retry_after: number;
};

export const TestGenerateModal: React.FC<TestGenerateModalProps> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<SuccessData | null>(null);
  const [cooldown, setCooldown] = useState<CooldownData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setCooldown(null);
    try {
      const result = await generateTestCredentials(email);
      // Tenta extrair dados detalhados se houver
      if (result.success && result.data) {
        setSuccess(result.data as SuccessData);
      } else if (!result.success && result.code === 'TEST_COOLDOWN' && result.data) {
        setCooldown(result.data as CooldownData);
      } else if (result.success) {
        setSuccess({
          email,
          expires_in_hours: 1,
          expiration_date: '',
          sent_at: '',
          credentials_type: [],
        });
      } else {
        setError(result.message || 'Erro ao solicitar credenciais de teste.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao solicitar credenciais de teste.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Gerar Credenciais de Teste" icon={Mail}>
      {!success && !cooldown && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-4 animate-fade-in">
          <div className="flex flex-col gap-2">
            <label htmlFor="test-email" className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Mail className="w-4 h-4 text-[var(--accent)]" /> Email para receber as credenciais:
            </label>
            <input
              id="test-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="seu@email.com"
              className="rounded-xl px-4 py-2.5 text-sm outline-none shadow-sm transition-all allow-select"
              style={{ width: '100%', background: 'var(--bg-elevated)', color: 'var(--text)', border: '1px solid var(--border)' }}
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading || !email}
            className="flex items-center justify-center gap-2 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
            style={{ background: 'var(--accent)' }}
          >
            {loading && <span className="loader mr-2"></span>}
            {loading ? 'Enviando...' : 'Gerar e Enviar'}
          </button>
          {error && <div className="text-rose-400 text-sm mt-2 text-center animate-shake font-medium">{error}</div>}
        </form>
      )}

      {success && (
        <div className="flex flex-col items-center gap-5 p-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="w-8 h-8 text-[var(--accent)] animate-bounce" />
            <span className="text-xl font-bold drop-shadow" style={{ color: 'var(--text)' }}>Credenciais enviadas!</span>
          </div>
          <div className="rounded-xl p-4 shadow-inner w-full max-w-md space-y-2" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="text-base" style={{ color: 'var(--text)' }}><b>Email:</b> <span style={{ color: 'var(--text-muted)' }}>{success.email}</span></div>
            {success.credentials_type?.length > 0 && (
              <div className="text-base" style={{ color: 'var(--text)' }}><b>Tipos:</b> <span style={{ color: 'var(--text-muted)' }}>{success.credentials_type.join(', ')}</span></div>
            )}
            {success.expires_in_hours && (
              <div className="text-base" style={{ color: 'var(--text)' }}><b>Expira em:</b> <span style={{ color: 'var(--text-muted)' }}>{success.expires_in_hours} hora(s)</span></div>
            )}
            {success.expiration_date && (
              <div className="text-base" style={{ color: 'var(--text)' }}><b>Validade:</b> <span style={{ color: 'var(--text-muted)' }}>{new Date(success.expiration_date).toLocaleString()}</span></div>
            )}
            {success.sent_at && (
              <div className="text-base" style={{ color: 'var(--text)' }}><b>Enviado em:</b> <span style={{ color: 'var(--text-muted)' }}>{new Date(success.sent_at).toLocaleString()}</span></div>
            )}
          </div>
          <button
            onClick={onClose}
            className="mt-2 text-white font-bold py-2.5 px-8 rounded-xl shadow-lg transition-all duration-200 active:scale-95"
            style={{ background: 'var(--accent)' }}
          >Fechar</button>
        </div>
      )}

      {cooldown && (
        <div className="flex flex-col items-center gap-5 p-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <Timer className="w-8 h-8 text-amber-500 animate-pulse" />
            <span className="text-xl font-bold drop-shadow" style={{ color: 'var(--text)' }}>Aguarde para novo teste</span>
          </div>
          <div className="rounded-xl p-4 shadow-inner w-full max-w-md" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="text-base text-center" style={{ color: 'var(--text)' }}>
              Você deve aguardar <b>{cooldown.hours_remaining} hora(s)</b> para gerar um novo teste gratuito.<br />
              Tente novamente após <b>{Math.ceil(cooldown.retry_after / 60)} minutos</b>.
            </div>
          </div>
          <button
            onClick={onClose}
            className="mt-2 text-white font-bold py-2.5 px-8 rounded-xl shadow-lg transition-all duration-200 active:scale-95"
            style={{ background: 'var(--accent)' }}
          >Fechar</button>
        </div>
      )}

      {/* Animations and loader */}
      <style>{`
        .animate-fade-in { animation: fadeIn 0.5s; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(16px);} to { opacity: 1; transform: none; } }
        .animate-shake { animation: shake 0.3s; }
        @keyframes shake { 10%, 90% { transform: translateX(-2px); } 20%, 80% { transform: translateX(4px); } 30%, 50%, 70% { transform: translateX(-8px); } 40%, 60% { transform: translateX(8px); } }
        .loader { border: 3px solid #b7abc9; border-top: 3px solid #8b5cf6; border-radius: 50%; width: 18px; height: 18px; animation: spin 0.7s linear infinite; display: inline-block; }
        @keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }
      `}</style>
    </Modal>
  );
};

export default TestGenerateModal;
