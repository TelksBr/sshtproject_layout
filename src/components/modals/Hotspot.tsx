import { Wifi, WifiOff, Settings, Bell } from '../../utils/icons';
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
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <Wifi className="w-6 h-6 text-[var(--accent)]" />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Compartilhe sua conexão VPN</p>
            </div>
          </div>
        </header>

        <div className="grid gap-4">
          <div className="p-4 rounded-xl glass-effect space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isEnabled ? (
                  <Wifi className="w-5 h-5 text-emerald-400" />
                ) : (
                  <WifiOff className="w-5 h-5 text-[var(--text-muted)]" />
                )}
                <div className="flex flex-col">
                  <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                    {loading ? 
                      (isEnabled ? 'Parando Hotspot...' : 'Iniciando Hotspot...') :
                      (isEnabled ? 'Hotspot Ativo' : 'Hotspot Inativo')
                    }
                  </span>
                  {!loading && (
                    <span className={`text-xs font-medium ${isEnabled ? 'text-emerald-500' : ''}`} style={{ color: isEnabled ? undefined : 'var(--text-muted)' }}>
                      {isEnabled ? 'Compartilhamento ativo' : 'Clique para ativar'}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={toggleHotspot}
                disabled={loading}
                className={`
                  px-4 min-h-[44px] rounded-full font-semibold text-sm transition-all duration-200 touch-manipulation active:scale-95
                  ${isEnabled 
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                    : 'text-white'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                style={{ background: isEnabled ? undefined : 'var(--accent)' }}
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

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <Settings className="w-5 h-5 text-[var(--accent)] mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text)' }}>Configuração</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    O hotspot é configurado automaticamente pelo sistema. Ao ativar, ele compartilhará sua conexão VPN através do proxy. Certifique-se de ter configurado o proxy no dispositivo que irá se conectar!
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <Bell className="w-5 h-5 text-[var(--accent)] mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text)' }}>Informações de Conexão</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
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