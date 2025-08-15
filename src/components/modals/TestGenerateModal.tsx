import React, { useState } from 'react';
import { generateTestCredentials } from '../../utils/salesUtils';
import { Modal } from './Modal';
import { Mail, Timer } from 'lucide-react';

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
            <label htmlFor="test-email" className="text-white font-semibold text-base flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#b0a8ff]" /> Email para receber as credenciais:
            </label>
            <input
              id="test-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="seu@email.com"
              className="rounded-lg px-4 py-2 bg-[#1a0628] border-2 border-[#6205D5]/40 text-white focus:outline-none focus:ring-2 focus:ring-[#6205D5] shadow-sm transition-all"
              style={{ width: '100%' }}
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading || !email}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#6205D5] to-[#4B0082] hover:from-[#4B0082] hover:to-[#6205D5] text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading && <span className="loader mr-2"></span>}
            {loading ? 'Enviando...' : 'Gerar e Enviar'}
          </button>
          {error && <div className="text-red-400 text-sm mt-2 text-center animate-shake">{error}</div>}
        </form>
      )}

      {success && (
        <div className="flex flex-col items-center gap-5 p-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="w-8 h-8 text-[#7c4dff] animate-bounce" />
            <span className="text-xl font-bold text-white drop-shadow">Credenciais enviadas!</span>
          </div>
          <div className="bg-[#1a0628]/80 rounded-lg p-4 border border-[#6205D5]/30 shadow-inner w-full max-w-md">
            <div className="text-white text-base mb-2"><b>Email:</b> <span className="text-[#b0a8ff]">{success.email}</span></div>
            {success.credentials_type?.length > 0 && (
              <div className="text-white text-base mb-2"><b>Tipos:</b> <span className="text-[#b0a8ff]">{success.credentials_type.join(', ')}</span></div>
            )}
            {success.expires_in_hours && (
              <div className="text-white text-base mb-2"><b>Expira em:</b> <span className="text-[#b0a8ff]">{success.expires_in_hours} hora(s)</span></div>
            )}
            {success.expiration_date && (
              <div className="text-white text-base mb-2"><b>Validade:</b> <span className="text-[#b0a8ff]">{new Date(success.expiration_date).toLocaleString()}</span></div>
            )}
            {success.sent_at && (
              <div className="text-white text-base mb-2"><b>Enviado em:</b> <span className="text-[#b0a8ff]">{new Date(success.sent_at).toLocaleString()}</span></div>
            )}
          </div>
          <button
            onClick={onClose}
            className="mt-2 bg-gradient-to-r from-[#6205D5] to-[#4B0082] hover:from-[#4B0082] hover:to-[#6205D5] text-white font-bold py-2 px-8 rounded-lg shadow-lg transition-all duration-200"
          >Fechar</button>
        </div>
      )}

      {cooldown && (
        <div className="flex flex-col items-center gap-5 p-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <Timer className="w-8 h-8 text-yellow-400 animate-pulse" />
            <span className="text-xl font-bold text-yellow-300 drop-shadow">Aguarde para novo teste</span>
          </div>
          <div className="bg-[#1a0628]/80 rounded-lg p-4 border border-yellow-400/30 shadow-inner w-full max-w-md">
            <div className="text-yellow-200 text-base text-center">
              Você deve aguardar <b>{cooldown.hours_remaining} hora(s)</b> para gerar um novo teste gratuito.<br />
              Tente novamente após <b>{Math.ceil(cooldown.retry_after / 60)} minutos</b>.
            </div>
          </div>
          <button
            onClick={onClose}
            className="mt-2 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-600 hover:to-yellow-400 text-white font-bold py-2 px-8 rounded-lg shadow-lg transition-all duration-200"
          >Fechar</button>
        </div>
      )}

      {/* Animations and loader */}
      <style>{`
        .animate-fade-in { animation: fadeIn 0.5s; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(16px);} to { opacity: 1; transform: none; } }
        .animate-shake { animation: shake 0.3s; }
        @keyframes shake { 10%, 90% { transform: translateX(-2px); } 20%, 80% { transform: translateX(4px); } 30%, 50%, 70% { transform: translateX(-8px); } 40%, 60% { transform: translateX(8px); } }
        .loader { border: 3px solid #b0a8ff; border-top: 3px solid #6205D5; border-radius: 50%; width: 18px; height: 18px; animation: spin 0.7s linear infinite; display: inline-block; }
        @keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }
      `}</style>
    </Modal>
  );
};

export default TestGenerateModal;
