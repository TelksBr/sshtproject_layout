import { AlertTriangle, Wifi, Trash2 } from '../../utils/icons';
import { Modal } from './Modal';
import { cleanAppData } from '../../utils/appFunctions';
import { clearIconCache } from '../../utils/iconCache';

interface CleanDataConfirmProps {
  onClose: () => void;
}

export function CleanDataConfirm({ onClose }: CleanDataConfirmProps) {
  const handleCleanData = () => {
    clearIconCache();
    cleanAppData();
    onClose();
  };

  return (
    <Modal onClose={onClose} title="Limpar Dados" icon={Trash2}>
      <div className="flex-1 p-4">
        <div className="p-6 rounded-lg glass-effect text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>

          <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text)' }}>
            Atenção!
          </h3>

          <div className="space-y-4 mb-6" style={{ color: 'var(--text-muted)' }}>
            <p className="text-sm font-medium">
              Ao limpar os dados do aplicativo, todas as configurações serão removidas, incluindo:
            </p>
            <ul className="list-disc list-inside text-left space-y-1.5 text-xs font-medium">
              <li>Configurações de conexão</li>
              <li>Dados de usuário</li>
              <li>Preferências do aplicativo</li>
            </ul>
            <div className="flex items-center justify-center gap-3 p-4 rounded-xl text-xs leading-relaxed" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              <Wifi className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
              <p>
                É necessário ter uma conexão estável com a internet para baixar as configurações novamente.
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            <button
              onClick={handleCleanData}
              className="w-full h-12 rounded-xl font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 transition-all flex items-center justify-center gap-2 touch-manipulation active:scale-[0.98]"
            >
              <Trash2 className="w-5 h-5" />
              Limpar Dados
            </button>
            <button
              onClick={onClose}
              className="w-full h-12 rounded-xl font-semibold transition-all touch-manipulation active:scale-[0.98]"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text)', border: '1px solid var(--border)' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}