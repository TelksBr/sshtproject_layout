import { message as tr, useMessages } from '../../i18n/messages';
import { Shield, Check, ShieldCheck } from '../../utils/icons';
import { Modal } from './Modal';
import { usePrivacyAcceptance } from '../../hooks/usePrivacyAcceptance';

interface PrivacyProps {
  onClose: () => void;
  onAccept?: () => void;
}

export function Privacy({ onClose, onAccept }: PrivacyProps) {
  useMessages();
  const { accepted, acceptPrivacy } = usePrivacyAcceptance();

  const handleAccept = () => {
    acceptPrivacy();
    if (onAccept) onAccept();
  };

  return (
    <Modal onClose={onClose} allowClose={accepted} title={tr("mc51dea4194")} icon={Shield}>
      <div className="relative flex-1 p-4">
        <header className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <Shield className="w-6 h-6" style={{ color: 'var(--accent)' }} />
          </div>
        </header>
        {accepted && (
          <div className="flex justify-center mb-4">
            <span className="flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-4 h-4" /> {" " + tr("m85c91ab9dc")}</span>
          </div>
        )}
        <div className="p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="max-w-none space-y-4">
            <p style={{ color: 'var(--text-muted)' }}>
              {tr("m16ef327e7f")}</p>

            <section className="space-y-2">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>{tr("mc7cf72e42d")}</h2>
              <p style={{ color: 'var(--text-muted)' }}>
                {tr("mc5d9a750c3")}</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>{tr("mdf8a6fa9b4")}</h2>
              <ul className="list-disc list-inside space-y-1" style={{ color: 'var(--text-muted)' }}>
                <li>{tr("m4d521daa7b")}</li>
                <li>{tr("m03f0d06e5a")}</li>
              </ul>
              <p style={{ color: 'var(--text-muted)' }}>
                {tr("me8d9dcbbed")}</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>{tr("m66d4283013")}</h2>
              <ul className="list-disc list-inside space-y-1" style={{ color: 'var(--text-muted)' }}>
                <li>{tr("m61e14ae620")}</li>
                <li>{tr("m20b2b3b51d")}</li>
                <li>{tr("meb9e1db76f")}</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>{tr("m8871437d57")}</h2>
              <p style={{ color: 'var(--text-muted)' }}>
                {tr("mb2a64a7206")}</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>{tr("m33c9bc549d")}</h2>
              <p style={{ color: 'var(--text-muted)' }}>
                {tr("mab776b7514")}</p>
              <ul className="list-disc list-inside space-y-1" style={{ color: 'var(--text-muted)' }}>
                <li>{tr("m01dd970256")}</li>
                <li>{tr("m1476e12bff")}</li>
              </ul>
              <p style={{ color: 'var(--text-muted)' }}>
                {tr("m7ec1f1fc85") + " "}<a href="mailto:talkera@sshtproject.com" className="underline font-semibold" style={{ color: 'var(--accent)' }}>talkera@sshtproject.com</a>
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>{tr("mabc175e3ea")}</h2>
              <p style={{ color: 'var(--text-muted)' }}>
                {tr("m4931a6e1f2")}</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>{tr("m07f2c9da07")}</h2>
              <p style={{ color: 'var(--text-muted)' }}>
                {tr("m66d628e4ec")}</p>
              <p style={{ color: 'var(--text-muted)' }}>
                {tr("m009cf6700a") + " "}<a href="mailto:talkera@sshtproject.com" className="underline font-semibold" style={{ color: 'var(--accent)' }}>talkera@sshtproject.com</a>
              </p>
            </section>

            <footer className="mt-6 pt-4 text-center" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                {tr("me04b8abd0e")}</p>
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
              {tr("md097c3e6c7")}</button>
          )}
        </div>
      </div>
    </Modal>
  );
}