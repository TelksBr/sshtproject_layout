import { AlertTriangle, Wifi, Trash2 } from '../../utils/icons';
import { Modal } from './Modal';
import { cleanAppData } from '../../utils/appFunctions';

interface CleanDataConfirmProps {
  onClose: () => void;
}

export function CleanDataConfirm({ onClose }: CleanDataConfirmProps) {
  const handleCleanData = () => {
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

          <h3 className="text-lg font-medium text-[#b7abc9] mb-4">
            Atenção!
          </h3>

          <div className="space-y-4 text-[#b7abc9]/80 mb-6">
            <p>
              Ao limpar os dados do aplicativo, todas as configurações serão removidas, incluindo:
            </p>
            <ul className="list-disc list-inside text-left space-y-2">
              <li>Configurações de conexão</li>
              <li>Dados de usuário</li>
              <li>Preferências do aplicativo</li>
            </ul>
            <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-[#14111c]/50 border border-[#8b5cf6]/20 text-[#b7abc9]/70">
              <Wifi className="w-5 h-5 text-[#8b5cf6]" />
              <p className="text-sm">
                É necessário ter uma conexão estável com a internet para baixar as configurações novamente.
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            <button
              onClick={handleCleanData}
              className="w-full h-12 rounded-lg font-medium bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Limpar Dados
            </button>
            <button
              onClick={onClose}
              className="w-full h-12 rounded-lg font-medium bg-[#1a1624]/50 text-[#b7abc9] hover:bg-[#1a1624]/70 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}