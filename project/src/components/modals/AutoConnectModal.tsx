import React from 'react';
import { Zap, Pause, Info } from 'lucide-react';
import { Modal } from './Modal';

interface AutoConnectModalProps {
  open: boolean;
  onClose: () => void;
  currentConfigName: string | null;
  totalConfigs: number;
  testedConfigs: number;
  successConfigName: string | null;
  running: boolean;
  onStart: () => void;
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
}: AutoConnectModalProps) {
  // O botão Start/Stop controla o teste via props.onStart
  const handleStartStop = () => {
    if (running) {
      onClose();
    } else {
      onStart();
    }
  };

  // Exibe progresso e status
  const renderStatus = () => {
    if (successConfigName) {
      return (
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 mb-3 text-center">
          <span className="text-green-400 font-semibold">
            Conexão bem-sucedida: {successConfigName}
          </span>
        </div>
      );
    }
    if (running && currentConfigName) {
      return (
        <div className="p-3 rounded-lg bg-[#26074d]/30 border border-[#6205D5]/20 mb-3 text-center">
          <span className="text-[#b0a8ff]">
            Testando: <span className="font-semibold">{currentConfigName}</span>
          </span>
        </div>
      );
    }
    if (!running && testedConfigs > 0 && !successConfigName) {
      return (
        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 mb-3 text-center">
          <span className="text-yellow-400 font-semibold">
            Nenhuma configuração conectou com sucesso.
          </span>
        </div>
      );
    }
    return null;
  };

  // Instruções para o usuário
  const renderInstructions = () => (
    <div className="mb-4 p-3 rounded-lg bg-[#26074d]/20 border border-[#6205D5]/10 flex items-start gap-2 text-[#b0a8ff]/80 text-sm">
      <Info className="w-5 h-5 mt-0.5 text-[#6205D5]" />
      <div>
        <span className="font-semibold text-[#b0a8ff]">Como funciona:</span>
        <ul className="list-disc ml-5 mt-1 space-y-1">
          <li>O teste automático irá tentar conectar em todas as configurações disponíveis.</li>
          <li>Ao encontrar uma configuração funcional, ela será ativada automaticamente.</li>
          <li>Você pode interromper o teste a qualquer momento usando o botão <b>Parar</b>.</li>
          <li>Recomenda-se estar conectado à internet e aguardar até o final do processo.</li>
        </ul>
      </div>
    </div>
  );

  if (!open) return null;

  return (
    <Modal onClose={onClose}>
      <div className="flex flex-col h-full p-4">
        {/* Header com botões */}
        <div className="flex items-center mb-4">
          <button
            className={`flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition-colors
              ${running ? 'bg-red-600/80 text-white hover:bg-red-700' : 'bg-[#6205D5] text-[#b0a8ff] hover:bg-[#6205D5]/90'}
              disabled:opacity-50`}
            onClick={handleStartStop}
            disabled={running && !!successConfigName}
          >
            {running ? (
              <>
                <Pause className="w-4 h-4" />
                Parar
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Iniciar Teste
              </>
            )}
          </button>
        </div>

        {/* Instruções */}
        {renderInstructions()}

        {/* Status do teste */}
        {renderStatus()}

        {/* Progresso */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[#b0a8ff]/70">Testados</span>
            <span className="text-xs text-[#b0a8ff]/70">
              {testedConfigs} / {totalConfigs}
            </span>
          </div>
          <div className="w-full h-3 bg-[#26074d]/40 rounded-lg overflow-hidden">
            <div
              className="h-full bg-[#6205D5] transition-all"
              style={{
                width: totalConfigs > 0 ? `${(testedConfigs / totalConfigs) * 100}%` : '0%',
              }}
            />
          </div>
        </div>

        {/* Mensagem final */}
        {!running && !successConfigName && (
          <div className="text-center text-[#b0a8ff]/70 text-sm mt-4">
            Clique em <b>Iniciar Teste</b> para começar a busca automática pela melhor configuração.
          </div>
        )}
      </div>
    </Modal>
  );
}
