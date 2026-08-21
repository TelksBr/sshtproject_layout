import { Modal } from './Modal';
import { Phone, Users, Send } from '../../utils/icons';
import { openExternalUrl } from '../../utils/appFunctions';

interface SupportProps {
  onClose: () => void;
}

export function Support({ onClose }: SupportProps) {
  return (
    <Modal onClose={onClose} title="Suporte" icon={Phone}>
      <div className="max-w-md mx-auto p-2 md:p-6 w-full">
        <div className="text-center mb-6 md:mb-8">
          <p className="text-base md:text-lg text-[#b7abc9]">
            Precisa de ajuda? Entre no grupo de suporte da comunidade.
          </p>
        </div>

        <div className="grid gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="card p-4 md:p-6 flex flex-col items-center text-center bg-[#1a1624]/80 border border-[#8b5cf6]/20 rounded-2xl shadow-lg">
            <Users className="w-7 h-7 md:w-8 md:h-8 text-purple-400 mb-2" />
            <h3 className="text-base md:text-lg font-semibold mb-1 text-white">Grupo de Suporte</h3>
            <p className="text-[#b7abc9]/80 text-xs md:text-sm">Junte-se ao nosso grupo de suporte para obter ajuda da comunidade.</p>
            <div className="flex flex-col gap-2 mt-4 w-full">
              <button
                onClick={() => openExternalUrl("https://t.me/ssh_t_project_grupo")}
                className="btn-primary flex items-center justify-center gap-2 w-full py-2 rounded-lg text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md"
              >
                <Send className="w-4 h-4" /> Grupo no Telegram
              </button>
              <button
                onClick={() => openExternalUrl("https://chat.whatsapp.com/KOs4IT5FsC1FVOyysOC17f")}
                className="btn-outline flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-[#8b5cf6]/40 text-[#b7abc9] hover:bg-[#8b5cf6]/10 shadow"
              >
                <Phone className="w-4 h-4" /> Grupo no WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}