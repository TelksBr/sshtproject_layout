import React from 'react';
import { AlertTriangle, Wifi, Trash2 } from 'lucide-react';
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
    <Modal onClose={onClose}>
      <div className="flex-1 p-4">
        <header className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-[#26074d] flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-[#b0a8ff]" />
          </div>
          <h1 className="text-xl font-medium text-[#b0a8ff]">Limpar Dados</h1>
        </header>

        <div className="p-6 rounded-lg glass-effect text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>

          <h3 className="text-lg font-medium text-[#b0a8ff] mb-4">
            Atenção!
          </h3>

          <div className="space-y-4 text-[#b0a8ff]/80 mb-6">
            <p>
              Ao limpar os dados do aplicativo, todas as configurações serão removidas, incluindo:
            </p>
            <ul className="list-disc list-inside text-left space-y-2">
              <li>Configurações de conexão</li>
              <li>Dados de usuário</li>
              <li>Preferências do aplicativo</li>
            </ul>
            <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-[#100322]/50 border border-[#6205D5]/20 text-[#b0a8ff]/70">
              <Wifi className="w-5 h-5 text-[#6205D5]" />
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
              className="w-full h-12 rounded-lg font-medium bg-[#26074d]/50 text-[#b0a8ff] hover:bg-[#26074d]/70 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}