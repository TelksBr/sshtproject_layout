import { Modal } from './Modal';
import { Phone, Users, Send } from 'lucide-react';
import { openExternalUrl } from '../../utils/appFunctions';

interface SupportProps {
  onClose: () => void;
}

export function Support({ onClose }: SupportProps) {
  return (
    <Modal onClose={onClose} title="Suporte" icon={Phone}>
      <div className="max-w-md mx-auto p-2 md:p-6 w-full">
        <div className="text-center mb-6 md:mb-8">
          <p className="text-base md:text-lg text-[#b0a8ff]">
            Precisa de ajuda? Entre em contato com nosso suporte, junte-se ao grupo ou siga nosso canal para novidades.
          </p>
        </div>

        <div className="grid gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Grupo de Suporte */}
          <div className="card p-4 md:p-6 flex flex-col items-center text-center bg-[#26074d]/80 border border-[#6205D5]/20 rounded-2xl shadow-lg">
            <Users className="w-7 h-7 md:w-8 md:h-8 text-purple-400 mb-2" />
            <h3 className="text-base md:text-lg font-semibold mb-1 text-white">Grupo de Suporte</h3>
            <p className="text-[#b0a8ff]/80 text-xs md:text-sm">Junte-se ao nosso grupo de suporte para obter ajuda da comunidade.</p>
            <div className="flex flex-col gap-2 mt-4 w-full">
              <button
                onClick={() => openExternalUrl("https://t.me/ssh_t_project_grupo")}
                className="btn-primary flex items-center justify-center gap-2 w-full py-2 rounded-lg text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md"
              >
                <Send className="w-4 h-4" /> Grupo no Telegram
              </button>
              <button
                onClick={() => openExternalUrl("https://chat.whatsapp.com/KOs4IT5FsC1FVOyysOC17f")}
                className="btn-outline flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-[#6205D5]/40 text-[#b0a8ff] hover:bg-[#6205D5]/10 shadow"
              >
                <Phone className="w-4 h-4" /> Grupo no WhatsApp
              </button>
            </div>
          </div>

          {/* Canal Telegram */}
          <div className="card p-4 md:p-6 flex flex-col items-center text-center bg-[#26074d]/80 border border-[#6205D5]/20 rounded-2xl shadow-lg">
            <Send className="w-7 h-7 md:w-8 md:h-8 text-purple-400 mb-2" />
            <h3 className="text-base md:text-lg font-semibold mb-1 text-white">Canal de Novidades</h3>
            <p className="text-[#b0a8ff]/80 text-xs md:text-sm">Receba novidades, avisos e promoções no nosso canal oficial do Telegram.</p>
            <div className="flex flex-col gap-2 mt-4 w-full">
              <button
                onClick={() => openExternalUrl("https://t.me/ssh_t_project")}
                className="btn-primary flex items-center justify-center gap-2 w-full py-2 rounded-lg text-white bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-md"
              >
                <Send className="w-4 h-4" /> Canal no Telegram
              </button>
            </div>
          </div>

                    {/* Contato Direto */}
          <div className="card p-4 md:p-6 flex flex-col items-center text-center bg-[#26074d]/80 border border-[#6205D5]/20 rounded-2xl shadow-lg">
            <Phone className="w-7 h-7 md:w-8 md:h-8 text-purple-400 mb-2" />
            <h3 className="text-base md:text-lg font-semibold mb-1 text-white">Contato Direto</h3>
            <p className="text-[#b0a8ff]/80 text-xs md:text-sm">Fale diretamente com nossa equipe de suporte.</p>
            <div className="flex flex-col gap-2 mt-4 w-full">
              <button
                onClick={() => openExternalUrl("https://wa.me/5513997280020")}
                className="btn-primary flex items-center justify-center gap-2 w-full py-2 rounded-lg text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-md"
              >
                <Phone className="w-4 h-4" /> WhatsApp
              </button>
              <button
                onClick={() => openExternalUrl("https://t.me/telks13")}
                className="btn-outline flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-[#6205D5]/40 text-[#b0a8ff] hover:bg-[#6205D5]/10 shadow"
              >
                <Send className="w-4 h-4" /> Telegram
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}