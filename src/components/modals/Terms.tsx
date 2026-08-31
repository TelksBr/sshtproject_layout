import { FileText, Check, ShieldCheck } from '../../utils/icons';
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
        <header className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <FileText className="w-6 h-6" style={{ color: 'var(--accent)' }} />
          </div>
        </header>
        {accepted && (
          <div className="flex justify-center mb-4">
            <span className="flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-4 h-4" /> Termos Aceitos
            </span>
          </div>
        )}
        <div className="p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="max-w-none space-y-4">
            <p style={{ color: 'var(--text-muted)' }}>
              Bem-vindo ao SSH T Project. Ao utilizar nossos serviços, você concorda com os seguintes Termos de Uso. Leia atentamente antes de utilizar o aplicativo.
            </p>

            <section className="space-y-2">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>1. Definição do Serviço</h2>
              <p style={{ color: 'var(--text-muted)' }}>
                O SSH T Project oferece um serviço de conexão à internet através de um sistema de proxy, permitindo que os usuários acessem a rede mesmo sem crédito com a operadora. Esse processo é possível ao utilizar URLs permitidas pelas operadoras para redirecionar o tráfego.
              </p>
              <p style={{ color: 'var(--text-muted)' }}>Nosso serviço foca em:</p>
              <ul className="list-disc list-inside space-y-1" style={{ color: 'var(--text-muted)' }}>
                <li>Desenvolvimento de métodos de conexão por proxy</li>
                <li>Disponibilização de servidores intermediários para conexões</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>2. Uso do Serviço</h2>
              <p style={{ color: 'var(--text-muted)' }}>O usuário deve utilizar o SSH T Project de forma responsável e de acordo com as leis locais. Estão proibidos:</p>
              <ul className="list-disc list-inside space-y-1" style={{ color: 'var(--text-muted)' }}>
                <li>O uso do serviço para atividades ilegais</li>
                <li>Qualquer tentativa de modificar, invadir ou explorar falhas do aplicativo</li>
                <li>Compartilhamento indevido do acesso para terceiros</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>3. Responsabilidade do Usuário</h2>
              <p style={{ color: 'var(--text-muted)' }}>
                O usuário é o único responsável pelo uso que faz do SSH T Project. Não nos responsabilizamos por qualquer uso indevido do serviço, incluindo eventuais violações de políticas das operadoras ou de legislações locais.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>4. Limitação de Uso</h2>
              <p style={{ color: 'var(--text-muted)' }}>
                Para garantir o funcionamento adequado do serviço, estabelecemos limites de conexões simultâneas por usuário. Esse controle é realizado através do Device ID, que é armazenado temporariamente em nossa base de dados e removido diariamente.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>5. Disponibilidade e Garantias</h2>
              <p style={{ color: 'var(--text-muted)' }}>
                Nosso serviço depende de fatores externos, como a estabilidade das operadoras e bloqueios de conexão. Não garantimos que o SSH T Project funcionará de maneira ininterrupta ou que sempre haverá um método de conexão disponível.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>6. Modificações no Serviço</h2>
              <p style={{ color: 'var(--text-muted)' }}>
                Podemos alterar ou interromper parte ou a totalidade do serviço a qualquer momento, sem aviso prévio, devido a mudanças técnicas, bloqueios das operadoras ou outros fatores.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>7. Reembolso e Compra de Logins</h2>
              <p style={{ color: 'var(--text-muted)' }}>
                Caso um usuário compre um login para acessar o serviço, ele terá direito ao reembolso somente se for comprovado que o problema está relacionado aos nossos servidores e não a bloqueios das operadoras. Para solicitar o reembolso, o usuário deve fornecer provas do problema e aguardar a análise da nossa equipe.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>8. Alterações nos Termos de Uso</h2>
              <p style={{ color: 'var(--text-muted)' }}>
                Estes Termos de Uso podem ser modificados a qualquer momento. Os usuários serão notificados por meio do aplicativo ou de nossas plataformas oficiais.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>9. Contato</h2>
              <p style={{ color: 'var(--text-muted)' }}>
                Para dúvidas ou suporte, entre em contato pelo e-mail <a href="mailto:talkera@sshtproject.com" className="underline font-semibold" style={{ color: 'var(--accent)' }}>talkera@sshtproject.com</a>
              </p>
            </section>

            <footer className="mt-6 pt-4 text-center" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Última atualização: {new Date().toLocaleDateString('pt-BR')} - SSH T Project
              </p>
            </footer>
          </div>
        </div>

        <div className="mt-4 sticky bottom-0 left-0 right-0 p-3 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
          {!accepted && (
            <button
              onClick={handleAccept}
              className="w-full min-h-[48px] rounded-xl font-bold flex items-center justify-center gap-2 text-white touch-manipulation transition-all active:scale-[0.98]"
              style={{ background: 'var(--accent)' }}
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