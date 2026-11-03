import { getMessageLocale, message as tr, useMessages } from '../../i18n/messages';
import { FileText, Check, ShieldCheck } from '../../utils/icons';
import { Modal } from './Modal';
import { useTermsAcceptance } from '../../hooks/useTermsAcceptance';

interface TermsProps {
  onClose: () => void;
  onAccept?: () => void;
}

export function Terms({ onClose, onAccept }: TermsProps) {
  useMessages();
  const { accepted, acceptTerms } = useTermsAcceptance();

  const handleAccept = () => {
    acceptTerms();
    if (onAccept) onAccept();
  };

  return (
    <Modal onClose={onClose} allowClose={accepted} title={tr("me259be7652")} icon={FileText}>
      <div className="relative flex-1 p-4">
        <header className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <FileText className="w-6 h-6" style={{ color: 'var(--accent)' }} />
          </div>
        </header>
        {accepted && (
          <div className="flex justify-center mb-4">
            <span className="flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-4 h-4" /> {" " + tr("m96156fd932")}</span>
          </div>
        )}
        <div className="p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="max-w-none space-y-4">
            <p style={{ color: 'var(--text-muted)' }}>
              {tr("mcfeabc51da")}</p>

            <section className="space-y-2">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>{tr("ma4b01eb72d")}</h2>
              <p style={{ color: 'var(--text-muted)' }}>
                {tr("mee53bef59c")}</p>
              <p style={{ color: 'var(--text-muted)' }}>{tr("me3670b9245")}</p>
              <ul className="list-disc list-inside space-y-1" style={{ color: 'var(--text-muted)' }}>
                <li>{tr("m4075da5554")}</li>
                <li>{tr("md8aed0955e")}</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>{tr("m4102ef3b92")}</h2>
              <p style={{ color: 'var(--text-muted)' }}>{tr("m67af495440")}</p>
              <ul className="list-disc list-inside space-y-1" style={{ color: 'var(--text-muted)' }}>
                <li>{tr("m871d1b721f")}</li>
                <li>{tr("ma73868ae51")}</li>
                <li>{tr("m843d00eff3")}</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>{tr("md49c3d7541")}</h2>
              <p style={{ color: 'var(--text-muted)' }}>
                {tr("mbc15a76524")}</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>{tr("m5bbd1e180d")}</h2>
              <p style={{ color: 'var(--text-muted)' }}>
                {tr("mb0b12f1d51")}</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>{tr("me11cf20a29")}</h2>
              <p style={{ color: 'var(--text-muted)' }}>
                {tr("mfdc35141ad")}</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>{tr("m98717385d7")}</h2>
              <p style={{ color: 'var(--text-muted)' }}>
                {tr("m4a99f83c2b")}</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>{tr("m47ca704eec")}</h2>
              <p style={{ color: 'var(--text-muted)' }}>
                {tr("m43fd7fcd55")}</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>{tr("m48136f7cf4")}</h2>
              <p style={{ color: 'var(--text-muted)' }}>
                {tr("ma8148dbf58")}</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>{tr("ma75a17e45c")}</h2>
              <p style={{ color: 'var(--text-muted)' }}>
                {tr("m5ffb0f25fe") + " "}<a href="mailto:talkera@sshtproject.com" className="underline font-semibold" style={{ color: 'var(--accent)' }}>talkera@sshtproject.com</a>
              </p>
            </section>

            <footer className="mt-6 pt-4 text-center" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                {tr("m3a9018dc66") + " "}{new Date().toLocaleDateString(getMessageLocale())} - SSH T Project
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
              {tr("m28b66da0e4")}</button>
          )}
        </div>
      </div>
    </Modal>
  );
}