import { useState } from 'react';
import { Modal } from './Modal';
import { requestCredentialRecovery } from '../../utils/salesUtils';
import { validateEmail } from '../../utils/emailValidation';
import { Mail, Search } from 'lucide-react';

interface RecoveryModalProps {
  onClose: () => void;
}

export function RecoveryModal({ onClose }: RecoveryModalProps) {
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
      setEmailError(emailValidation.error || 'Email inválido');
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
      <Modal onClose={handleClose} title="Email Enviado" icon={Mail}>
        <div className="p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-white" />
            </div>
            
            <h3 className="text-xl font-semibold text-white">Email Enviado!</h3>
            
            <div className="bg-green-900/30 border border-green-600 p-4 rounded-lg">
              <p className="text-green-300 text-sm text-center">
                {successMessage}
              </p>
            </div>

            <div className="bg-blue-900/30 border border-blue-600 p-4 rounded-lg">
              <div className="text-blue-300 text-sm">
                <div className="font-semibold mb-2">📧 Próximos passos:</div>
                <div className="space-y-1 text-xs text-left">
                  <div>1. 📮 Verifique sua caixa de entrada</div>
                  <div>2. 📄 Procure por um email com suas credenciais</div>
                  <div>3. 🔍 Se não encontrar, verifique o spam/lixo eletrônico</div>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-400">
              💡 O email pode levar alguns minutos para chegar
            </div>

            <button
              onClick={handleClose}
              className="w-full py-3 px-4 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-semibold"
            >
              Entendi
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={handleClose} title="Recuperar Credenciais" icon={Search}>
      <div className="p-6">
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-2">Recuperar Credenciais</h3>
            <p className="text-gray-300">Digite seu email para receber suas credenciais</p>
          </div>

          <div className="bg-blue-900/30 border border-blue-600 p-4 rounded-lg">
            <div className="text-blue-300 text-sm">
              <div className="font-semibold mb-2">ℹ️ Como funciona:</div>
              <div className="space-y-1 text-xs">
                <div>• Digite o email usado na compra</div>
                <div>• Receba um email com suas credenciais</div>
                <div>• Acesse suas credenciais de forma segura</div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email da Compra
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleRecoverySubmit()}
              className="w-full px-3 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="seu@email.com"
              disabled={isLoading}
            />
            {emailError && (
              <p className="text-red-400 text-sm mt-1">{emailError}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleRecoverySubmit}
              disabled={isLoading || !email.trim()}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-[#6205D5] to-[#4B0082] hover:from-[#4B0082] hover:to-[#6205D5] disabled:bg-gray-500 text-white rounded-lg transition-all duration-200 flex items-center justify-center font-semibold shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Enviar Email
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-600 p-3 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <div className="bg-gray-800/50 p-3 rounded-lg">
            <p className="text-gray-400 text-xs text-center">
              🔒 Seus dados estão seguros. Apenas credenciais válidas serão enviadas.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
