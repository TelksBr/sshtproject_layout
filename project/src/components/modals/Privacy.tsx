import { Shield, Check, ShieldCheck } from 'lucide-react';
import { Modal } from './Modal';
import { usePrivacyAcceptance } from '../../hooks/usePrivacyAcceptance';

interface PrivacyProps {
  onClose: () => void;
  onAccept?: () => void;
}

export function Privacy({ onClose, onAccept }: PrivacyProps) {
  const { accepted, acceptPrivacy } = usePrivacyAcceptance();

  const handleAccept = () => {
    acceptPrivacy();
    if (onAccept) onAccept();
  };

  return (
    <Modal onClose={onClose} allowClose={accepted}>
      <div className="relative flex-1 p-4">
        <header className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-[#26074d] flex items-center justify-center">
            <Shield className="w-6 h-6 text-[#b0a8ff]" />
          </div>
          <h1 className="text-xl font-medium text-[#b0a8ff]">Política de Privacidade</h1>
        </header>
        {accepted && (
          <div className="flex justify-center mb-6">
            <span className="flex items-center gap-2 text-sm text-green-300">
              <ShieldCheck className="w-4 h-4" /> Política Aceita
            </span>
          </div>
        )}
        <div className="p-4 rounded-lg bg-[#26074d]/30 border border-[#6205D5]/20 backdrop-blur-sm">
          <div className="prose prose-invert max-w-none">
            <p className="text-[#b0a8ff]/80 mb-4">
              A sua privacidade é importante para nós. Esta Política de Privacidade explica como coletamos, usamos e protegemos suas informações ao utilizar o aplicativo T Project.
            </p>

            <section className="mb-6">
              <h2 className="text-lg font-medium text-[#b0a8ff] mb-4">1. Informações Coletadas</h2>
              <p className="text-[#b0a8ff]/80 mb-4">
                O T Project coleta apenas o Device ID do seu dispositivo. Esse identificador é armazenado junto ao seu usuário em nossa base de dados para a finalidade exclusiva de limitar o número de conexões simultâneas.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-medium text-[#b0a8ff] mb-4">2. Uso dos Dados</h2>
              <ul className="list-disc list-inside text-[#b0a8ff]/80 space-y-2">
                <li>Controle de conexões simultâneas por usuário</li>
                <li>Garantia do funcionamento adequado do serviço</li>
              </ul>
              <p className="text-[#b0a8ff]/80 mt-4">
                Não utilizamos os dados para rastreamento, publicidade ou qualquer outra finalidade além da citada acima.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-medium text-[#b0a8ff] mb-4">3. Armazenamento e Segurança</h2>
              <ul className="list-disc list-inside text-[#b0a8ff]/80 space-y-2">
                <li>O Device ID é armazenado em nossa base de dados sem criptografia</li>
                <li>Os Device IDs são automaticamente apagados diariamente</li>
                <li>Nenhuma outra informação do usuário é armazenada</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-medium text-[#b0a8ff] mb-4">4. Compartilhamento de Dados</h2>
              <p className="text-[#b0a8ff]/80 mb-4">
                O T Project não compartilha suas informações com terceiros, parceiros ou serviços externos.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-medium text-[#b0a8ff] mb-4">5. Direitos do Usuário</h2>
              <p className="text-[#b0a8ff]/80 mb-4">
                Como usuário, você tem o direito de:
              </p>
              <ul className="list-disc list-inside text-[#b0a8ff]/80 space-y-2">
                <li>Solicitar informações sobre os dados armazenados</li>
                <li>Solicitar a exclusão dos seus dados</li>
              </ul>
              <p className="text-[#b0a8ff]/80">
              Para entrar em contato, envie um e-mail para <a href="mailto:talkera@sshtproject.com" className="underline">talkera@sshtproject.com</a>
                </p>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-medium text-[#b0a8ff] mb-4">6. Base Legal e Responsabilidade</h2>
              <p className="text-[#b0a8ff]/80 mb-4">
                O T Project não pertence a uma empresa registrada legalmente. O tratamento de dados é feito de forma automatizada, sem intervenção humana.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-medium text-[#b0a8ff] mb-4">7. Alterações na Política de Privacidade</h2>
              <p className="text-[#b0a8ff]/80 mb-4">
                Podemos atualizar esta política de tempos em tempos. Quaisquer alterações serão publicadas nesta página, e o uso continuado do serviço implica na aceitação da política revisada.
              </p>
                <p className="text-[#b0a8ff]/80">
                Caso tenha dúvidas, entre em contato pelo e-mail <a href="mailto:talkera@sshtproject.com" className="underline">talkera@sshtproject.com</a>
                </p>
            </section>

            <footer className="mt-8 pt-4 border-t border-[#6205D5]/20">
              <p className="text-sm text-[#b0a8ff]/60 text-center">
                Última atualização: 23/03/2025 - SSH T PROJECT
              </p>
            </footer>
          </div>
        </div>

        <div className="mt-4 sticky bottom-0 left-0 right-0 p-4 backdrop-blur-lg border-t border-[#6205D5]/20">
          {!accepted && (
            <button
              onClick={handleAccept}
              className="w-full h-12 rounded-lg font-medium flex items-center justify-center gap-2 bg-[#6205D5] text-[#b0a8ff] hover:bg-[#6205D5]/90"
            >
              <Check className="w-5 h-5" />
              Aceitar Política de Privacidade
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}