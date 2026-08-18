import { useState } from 'react';
import { CalendarClock, User, Clock, Calendar, RefreshCw, AlertTriangle, Search } from '../../utils/icons';
import { Modal } from './Modal';
import { fetchUserInfo, UserInfo } from '../../utils/checkUserUtils';
import { purchaseStorage } from '../../utils/purchaseStorageManager';

interface CheckUserProps {
  onClose: () => void;
}

export function CheckUser({ onClose }: CheckUserProps) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const handleCheck = async () => {
    if (!username.trim()) {
      setError('Por favor, insira um nome de usuário');
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
      setError(err instanceof Error ? err.message : 'Erro ao buscar informações do usuário');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <Modal onClose={onClose} title="Erro" icon={AlertTriangle}>
        <div className="flex-1">
          <header className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 lg:w-14 lg:h-14 2xl:w-16 2xl:h-16 rounded-full bg-[#1a1624] flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 text-[#b7abc9]" />
            </div>
          </header>

          <div className="p-4 lg:p-6 2xl:p-8 rounded-lg glass-effect text-center">
            <p className="text-[#b7abc9]/80 text-sm lg:text-base 2xl:text-lg mb-4">{error}</p>
            <button
              onClick={() => setError(null)}
              className="w-full min-h-[44px] lg:min-h-[48px] 2xl:min-h-[56px] rounded-lg font-medium bg-[#8b5cf6] text-[#b7abc9] hover:bg-[#8b5cf6]/90 transition-colors text-sm lg:text-base 2xl:text-lg"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose} title="Consultar Usuário" icon={CalendarClock}>
      <div className="flex-1">

        {!userInfo ? (
          <div className="p-4 lg:p-5 2xl:p-6 rounded-lg glass-effect">
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nome do usuário"
                className="flex-1 min-h-[44px] lg:min-h-[48px] 2xl:min-h-[56px] px-4 rounded-lg glass-effect text-white placeholder-gray-400 outline-none focus:border-purple-500 allow-select text-sm lg:text-base 2xl:text-lg"
              />
              <button
                onClick={handleCheck}
                disabled={loading}
                className="w-[44px] h-[44px] lg:w-[48px] lg:h-[48px] 2xl:w-[56px] 2xl:h-[56px] flex items-center justify-center rounded-lg bg-[#8b5cf6] text-[#b7abc9] hover:bg-[#8b5cf6]/90 transition-colors disabled:opacity-50 flex-shrink-0"
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
          <div className="grid gap-4">
            {/* User Info Card */}
            <div className="p-4 rounded-lg glass-effect">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-[#8b5cf6]" />
                  <span className="text-[#b7abc9] font-medium">
                    {userInfo.username}
                  </span>
                </div>
                <button
                  onClick={() => setUserInfo(null)}
                  className="p-2 rounded-full hover:bg-[#8b5cf6]/10 transition-colors"
                >
                  <RefreshCw className="w-5 h-5 text-[#8b5cf6]" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-[#14111c]/50 border border-[#8b5cf6]/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-[#8b5cf6]" />
                    <span className="text-sm text-[#b7abc9]/70">Dias Restantes</span>
                  </div>
                  <span className="text-xl font-bold text-[#b7abc9]">
                    {userInfo.expiration_days}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#14111c]/50 border border-[#8b5cf6]/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-[#8b5cf6]" />
                    <span className="text-sm text-[#b7abc9]/70">Expira em</span>
                  </div>
                  <span className="text-[#b7abc9]">
                    {userInfo.expiration_date}
                  </span>
                </div>
              </div>
            </div>

            {/* Connection Details */}
            <div className="p-4 rounded-lg glass-effect">
              <h3 className="text-[#b7abc9] font-medium mb-4">Detalhes da Conexão</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-lg bg-[#14111c]/50 border border-[#8b5cf6]/20">
                  <span className="text-[#b7abc9]/70">Limite de Dispositivos</span>
                  <span className="text-[#b7abc9]">
                    {userInfo.limit_connections}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 rounded-lg bg-[#14111c]/50 border border-[#8b5cf6]/20">
                  <span className="text-[#b7abc9]/70">Dispositivos Conectados</span>
                  <span className="text-[#b7abc9]">
                    {userInfo.count_connections}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}