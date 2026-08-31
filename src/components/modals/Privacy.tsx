import { Shield, Check, ShieldCheck } from '../../utils/icons';
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
    <Modal onClose={onClose} allowClose={accepted} title="Política de Privacidade" icon={Shield}>
      <div className="relative flex-1 p-4">
        <header className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <Shield className="w-6 h-6" style={{ color: 'var(--accent)' }} />
          </div>
        </header>
        {accepted && (
          <div className="flex justify-center mb-4">
            <span className="flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-4 h-4" /> Política Aceita
            </span>
          </div>
        )}
        <div className="p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="max-w-none space-y-4">
            <p style={{ color: 'var(--text-muted)' }}>
              A sua privacidade é importante para nós. Esta Política de Privacidade explica como coletamos, usamos e protegemos suas informações ao utilizar o aplicativo SSH T Project.
            </p>

            <section className="space-y-2">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>1. Informações Coletadas</h2>
              <p style={{ color: 'var(--text-muted)' }}>
                O SSH T Project coleta apenas o Device ID do seu dispositivo. Esse identificador é armazenado junto ao seu usuário em nossa base de dados para a finalidade exclusiva de limitar o número de conexões simultâneas.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>2. Uso dos Dados</h2>
              <ul className="list-disc list-inside space-y-1" style={{ color: 'var(--text-muted)' }}>
                <li>Controle de conexões simultâneas por usuário</li>
                <li>Garantia do funcionamento adequado do serviço</li>
              </ul>
              <p style={{ color: 'var(--text-muted)' }}>
                Não utilizamos os dados para rastreamento, publicidade ou qualquer outra finalidade além da citada acima.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>3. Armazenamento e Segurança</h2>
              <ul className="list-disc list-inside space-y-1" style={{ color: 'var(--text-muted)' }}>
                <li>O Device ID é armazenado em nossa base de dados sem criptografia</li>
                <li>Os Device IDs são automaticamente apagados diariamente</li>
                <li>Nenhuma outra informação do usuário é armazenada</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>4. Compartilhamento de Dados</h2>
              <p style={{ color: 'var(--text-muted)' }}>
                O SSH T Project não compartilha suas informações com terceiros, parceiros ou serviços externos.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>5. Direitos do Usuário</h2>
              <p style={{ color: 'var(--text-muted)' }}>
                Como usuário, você tem o direito de:
              </p>
              <ul className="list-disc list-inside space-y-1" style={{ color: 'var(--text-muted)' }}>
                <li>Solicitar informações sobre os dados armazenados</li>
                <li>Solicitar a exclusão dos seus dados</li>
              </ul>
              <p style={{ color: 'var(--text-muted)' }}>
                Para entrar em contato, envie um e-mail para <a href="mailto:talkera@sshtproject.com" className="underline font-semibold" style={{ color: 'var(--accent)' }}>talkera@sshtproject.com</a>
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>6. Base Legal e Responsabilidade</h2>
              <p style={{ color: 'var(--text-muted)' }}>
                O SSH T Project não pertence a uma empresa registrada legalmente. O tratamento de dados é feito de forma automatizada, sem intervenção humana.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>7. Alterações na Política de Privacidade</h2>
              <p style={{ color: 'var(--text-muted)' }}>
                Podemos atualizar esta política de tempos em tempos. Quaisquer alterações serão publicadas nesta página, e o uso continuado do serviço implica na aceitação da política revisada.
              </p>
              <p style={{ color: 'var(--text-muted)' }}>
                Caso tenha dúvidas, entre em contato pelo e-mail <a href="mailto:talkera@sshtproject.com" className="underline font-semibold" style={{ color: 'var(--accent)' }}>talkera@sshtproject.com</a>
              </p>
            </section>

            <footer className="mt-6 pt-4 text-center" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Última atualização: 23/03/2025 - SSH T Project
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
              Aceitar Política de Privacidade
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}