import { message as tr, useMessages } from '../../i18n/messages';
import { Download, Sparkles } from '../../utils/icons';
import { Modal } from './Modal';

interface PlayUpdateModalProps {
  variant: 'ready' | 'available';
  onConfirm: () => void;
  onDismiss: () => void;
}

const COPY = {
  ready: {
    get title() { return tr("m01c9ef8685"); },
    get heading() { return tr("m306afe4615"); },
    get message() { return tr("m60b1b17e46"); },
    get confirm() { return tr("mbe51e8b085"); },
  },
  available: {
    get title() { return tr("m9c73bac4f9"); },
    get heading() { return tr("m395a3139b0"); },
    get message() { return tr("m0209ba2897"); },
    get confirm() { return tr("mdafb59613e"); },
  },
} as const;

export function PlayUpdateModal({ variant, onConfirm, onDismiss }: PlayUpdateModalProps) {
  useMessages();
  const copy = COPY[variant];
  const Icon = variant === 'ready' ? Sparkles : Download;

  return (
    <Modal onClose={onDismiss} title={copy.title} icon={Icon}>
      <div className="flex-1 p-4">
        <div className="p-5 rounded-xl glass-effect text-center">
          <div
            className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ background: 'var(--accent-dim)' }}
          >
            <Icon className="w-7 h-7" style={{ color: 'var(--accent)' }} />
          </div>

          <h3 className="text-base font-medium mb-2" style={{ color: 'var(--text)' }}>
            {copy.heading}
          </h3>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {copy.message}
          </p>

          <div className="grid gap-2">
            <button
              type="button"
              onClick={onConfirm}
              className="w-full min-h-[44px] rounded-xl font-semibold text-white touch-manipulation"
              style={{ background: 'var(--accent)' }}
            >
              {copy.confirm}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="w-full min-h-[44px] rounded-xl font-medium touch-manipulation"
              style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            >
              {tr("mb8db71c3cc")}</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
