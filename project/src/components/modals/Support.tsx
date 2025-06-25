import { Modal } from './Modal';
import { Phone, Users } from 'lucide-react';
import { openExternalUrl } from '../../utils/externalUtils';

interface SupportProps {
  onClose: () => void;
}

export function Support({ onClose }: SupportProps) {
  return (
    <Modal onClose={onClose}>
      <div className="max-w-md mx-auto p-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Suporte</h1>
          <p className="text-lg text-gray-300">
            Precisa de ajuda? Entre em contato com nosso suporte ou junte-se ao nosso grupo de suporte.
          </p>
        </div>

        <div className="grid gap-4 mb-8">
          <div className="card">
            <Phone className="w-6 h-6 text-purple-400 mb-2" />
            <h3 className="text-lg font-semibold mb-1">Contato Direto</h3>
            <p className="text-gray-400 text-sm">Fale diretamente com nossa equipe de suporte.</p>
            <div className="flex flex-col gap-2 mt-4">
              <a
                onClick={() => openExternalUrl("https://wa.me/5513997280020")}
                className="btn-primary flex items-center justify-center gap-2"
              >
                WhatsApp
              </a>
              <a
                onClick={() => openExternalUrl("https://t.me/telks13")}
                className="btn-outline flex items-center justify-center gap-2"
              >
                Telegram
              </a>
            </div>
          </div>

          <div className="card">
            <Users className="w-6 h-6 text-purple-400 mb-2" />
            <h3 className="text-lg font-semibold mb-1">Grupo de Suporte</h3>
            <p className="text-gray-400 text-sm">Junte-se ao nosso grupo de suporte para obter ajuda da comunidade.</p>
            <div className="flex flex-col gap-2 mt-4">
              <a
                onClick={() => openExternalUrl("https://t.me/ssh_t_project_grupo")}
                className="btn-primary flex items-center justify-center gap-2"
              >
                Grupo no Telegram
              </a>
              <a
                onClick={() => openExternalUrl("https://chat.whatsapp.com/KOs4IT5FsC1FVOyysOC17f")}
                className="btn-outline flex items-center justify-center gap-2"
              >
                Grupo no WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}