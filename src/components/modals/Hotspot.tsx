import { Wifi, WifiOff, Settings, Bell } from 'lucide-react';
import { Modal } from './Modal';
import { useHotspotGlobal } from '../../hooks/useGlobalPolling';
import { memo } from 'react';

interface HotspotProps {
  onClose: () => void;
}

const Hotspot = memo(function Hotspot({ onClose }: HotspotProps) {
  const { isEnabled, loading, toggleHotspot, } = useHotspotGlobal();



  return (

    <Modal onClose={onClose} title="Hotspot" icon={Wifi}>
      <div className="flex-1 p-4">
        <header className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#26074d] flex items-center justify-center">
              <Wifi className="w-6 h-6 text-[#b0a8ff]" />
            </div>
            <div>
              <p className="text-sm text-[#b0a8ff]/70">Compartilhe sua conexão VPN</p>
            </div>
          </div>
        </header>

        <div className="grid gap-4">
          <div className="p-4 rounded-lg glass-effect">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {isEnabled ? (
                  <Wifi className="w-5 h-5 text-[#6205D5]" />
                ) : (
                  <WifiOff className="w-5 h-5 text-[#6205D5]" />
                )}
                <div className="flex flex-col">
                  <span className="text-[#b0a8ff] font-medium">
                    {loading ? 
                      (isEnabled ? 'Parando Hotspot...' : 'Iniciando Hotspot...') :
                      (isEnabled ? 'Hotspot Ativo' : 'Hotspot Inativo')
                    }
                  </span>
                  {!loading && (
                    <span className={`text-xs ${isEnabled ? 'text-green-400' : 'text-gray-400'}`}>
                      {isEnabled ? 'Compartilhamento ativo' : 'Clique para ativar'}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={toggleHotspot}
                disabled={loading}
                className={`
                  px-4 h-8 rounded-full font-medium text-sm transition-all duration-200
                  ${isEnabled 
                    ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30' 
                    : 'bg-[#6205D5] text-[#b0a8ff] hover:bg-[#6205D5]/90 border border-[#6205D5]/50'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${loading ? 'animate-pulse' : ''}
                `}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                    {isEnabled ? 'Parando...' : 'Iniciando...'}
                  </span>
                ) : (
                  isEnabled ? 'Desativar' : 'Ativar'
                )}
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-[#100322]/50 border border-[#6205D5]/20">
                <Settings className="w-5 h-5 text-[#6205D5] mt-1" />
                <div>
                  <h3 className="text-[#b0a8ff] font-medium mb-2">Configuração</h3>
                  <p className="text-sm text-[#b0a8ff]/70">
                    O hotspot é configurado automaticamente pelo sistema. Ao ativar, ele compartilhará sua conexão VPN através do proxy. Certifique-se de ter configurado o proxy no dispositivo que irá se conectar!
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-[#100322]/50 border border-[#6205D5]/20">
                <Bell className="w-5 h-5 text-[#6205D5] mt-1" />
                <div>
                  <h3 className="text-[#b0a8ff] font-medium mb-2">Informações de Conexão</h3>
                  <p className="text-sm text-[#b0a8ff]/70">
                    Após ativar o hotspot, os endereços IP e porta serão gerados automaticamente. Você poderá visualizar essas informações na notificação do sistema.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
});

export { Hotspot };