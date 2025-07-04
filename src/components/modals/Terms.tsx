import { FileText, Check, ShieldCheck } from 'lucide-react';
import { Modal } from './Modal';
import { useTermsAcceptance } from '../../hooks/useTermsAcceptance';

interface TermsProps {
  onClose: () => void;
  onAccept?: () => void;
}

export function Terms({ onClose, onAccept }: TermsProps) {
  const { accepted, acceptTerms } = useTermsAcceptance();

  const handleAccept = () => {
    acceptTerms();
    if (onAccept) onAccept();
  };

  return (
    <Modal onClose={onClose} allowClose={accepted} title="Termos de Uso" icon={FileText}>
      <div className="relative flex-1 p-4">
        <header className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-[#26074d] flex items-center justify-center">
            <FileText className="w-6 h-6 text-[#b0a8ff]" />
          </div>
        </header>
        {accepted && (
          <div className="flex justify-center mb-6">
            <span className="flex items-center gap-2 text-sm text-green-300">
              <ShieldCheck className="w-4 h-4" /> Termos Aceitos
            </span>
          </div>
        )}
        <div className="p-4 rounded-lg bg-[#26074d]/30 border border-[#6205D5]/20 backdrop-blur-sm">
          <div className="prose prose-invert max-w-none">
            <p className="text-[#b0a8ff]/80 mb-4">
              Bem-vindo ao T Project. Ao utilizar nossos serviços, você concorda com os seguintes Termos de Uso. Leia atentamente antes de utilizar o aplicativo.
            </p>

            <section className="mb-6">
              <h2 className="text-lg font-medium text-[#b0a8ff] mb-4">1. Definição do Serviço</h2>
              <p className="text-[#b0a8ff]/80 mb-4">
                O T Project oferece um serviço de conexão à internet através de um sistema de proxy, permitindo que os usuários acessem a rede mesmo sem crédito com a operadora. Esse processo é possível ao utilizar URLs permitidas pelas operadoras para redirecionar o tráfego.
              </p>
              <p className="text-[#b0a8ff]/80 mb-4">Nosso serviço foca em:</p>
              <ul className="list-disc list-inside text-[#b0a8ff]/80 space-y-2">
                <li>Desenvolvimento de métodos de conexão por proxy</li>
                <li>Disponibilização de servidores intermediários para conexões</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-medium text-[#b0a8ff] mb-4">2. Uso do Serviço</h2>
              <p className="text-[#b0a8ff]/80 mb-4">O usuário deve utilizar o T Project de forma responsável e de acordo com as leis locais. Estão proibidos:</p>
              <ul className="list-disc list-inside text-[#b0a8ff]/80 space-y-2">
                <li>O uso do serviço para atividades ilegais</li>
                <li>Qualquer tentativa de modificar, invadir ou explorar falhas do aplicativo</li>
                <li>Compartilhamento indevido do acesso para terceiros</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-medium text-[#b0a8ff] mb-4">3. Responsabilidade do Usuário</h2>
              <p className="text-[#b0a8ff]/80 mb-4">
                O usuário é o único responsável pelo uso que faz do T Project. Não nos responsabilizamos por qualquer uso indevido do serviço, incluindo eventuais violações de políticas das operadoras ou de legislações locais.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-medium text-[#b0a8ff] mb-4">4. Limitação de Uso</h2>
              <p className="text-[#b0a8ff]/80 mb-4">
                Para garantir o funcionamento adequado do serviço, estabelecemos limites de conexões simultâneas por usuário. Esse controle é realizado através do Device ID, que é armazenado temporariamente em nossa base de dados e removido diariamente.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-medium text-[#b0a8ff] mb-4">5. Disponibilidade e Garantias</h2>
              <p className="text-[#b0a8ff]/80 mb-4">
                Nosso serviço depende de fatores externos, como a estabilidade das operadoras e bloqueios de conexão. Não garantimos que o T Project funcionará de maneira ininterrupta ou que sempre haverá um método de conexão disponível.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-medium text-[#b0a8ff] mb-4">6. Modificações no Serviço</h2>
              <p className="text-[#b0a8ff]/80 mb-4">
                Podemos alterar ou interromper parte ou a totalidade do serviço a qualquer momento, sem aviso prévio, devido a mudanças técnicas, bloqueios das operadoras ou outros fatores.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-medium text-[#b0a8ff] mb-4">7. Reembolso e Compra de Logins</h2>
              <p className="text-[#b0a8ff]/80 mb-4">
                Caso um usuário compre um login para acessar o serviço, ele terá direito ao reembolso somente se for comprovado que o problema está relacionado aos nossos servidores e não a bloqueios das operadoras. Para solicitar o reembolso, o usuário deve fornecer provas do problema e aguardar a análise da nossa equipe.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-medium text-[#b0a8ff] mb-4">8. Alterações nos Termos de Uso</h2>
              <p className="text-[#b0a8ff]/80 mb-4">
                Estes Termos de Uso podem ser modificados a qualquer momento. Os usuários serão notificados por meio do aplicativo ou de nossas plataformas oficiais.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-medium text-[#b0a8ff] mb-4">9. Contato</h2>
              <p className="text-[#b0a8ff]/80 mb-4">
                Para dúvidas ou suporte, entre em contato pelo e-mail <a href="mailto:talkera@sshtproject.com" className="underline">talkera@sshtproject.com</a>
              </p>
            </section>

            <footer className="mt-8 pt-4 border-t border-[#6205D5]/20">
              <p className="text-sm text-[#b0a8ff]/60 text-center">
                Última atualização: {new Date().toLocaleDateString('pt-BR')} - SSH T PROJECT
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
              Aceitar Termos
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}