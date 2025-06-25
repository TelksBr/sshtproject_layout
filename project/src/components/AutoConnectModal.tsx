import { Modal } from './modals/Modal';
import { RefreshCw } from 'lucide-react';

interface AutoConnectModalProps {
  open: boolean;
  onClose: () => void;
  currentConfigName: string | null;
  totalConfigs: number;
  testedConfigs: number;
  successConfigName: string | null;
  running: boolean;
  onStart: () => void;
  error?: string | null;
}

export function AutoConnectModal({
  open,
  onClose,
  currentConfigName,
  totalConfigs,
  testedConfigs,
  successConfigName,
  running,
  onStart,
  error,
}: AutoConnectModalProps) {
  if (!open) return null;
  return (
    <Modal onClose={onClose}>
      <div className="p-6 w-80 max-w-full">
        <h2 className="text-lg font-bold text-[#b0a8ff] mb-2">Teste Automático</h2>
        {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
        {successConfigName ? (
          <div className="text-green-400 text-sm mb-2">Conexão bem-sucedida: {successConfigName}</div>
        ) : running ? (
          <div className="flex flex-col items-center gap-2 mb-2">
            <RefreshCw className="w-6 h-6 text-[#6205D5] animate-spin" />
            <span className="text-[#b0a8ff] text-xs">Testando: {currentConfigName || '---'}</span>
            <span className="text-[#b0a8ff]/70 text-xs">{testedConfigs} de {totalConfigs}</span>
          </div>
        ) : null}
        <div className="flex gap-2 mt-4">
          <button
            className="btn-primary flex-1"
            onClick={onStart}
            disabled={running}
          >
            Iniciar Teste
          </button>
          <button
            className="btn-outline flex-1"
            onClick={onClose}
            disabled={running}
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
}
