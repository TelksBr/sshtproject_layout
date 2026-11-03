import { message as tr, useMessages } from '../../i18n/messages';
import { Star } from '../../utils/icons';
import { Modal } from './Modal';

interface PlayStoreReviewModalProps {
  onAccept: () => void;
  onDecline: () => void;
}

export function PlayStoreReviewModal({ onAccept, onDecline }: PlayStoreReviewModalProps) {
  useMessages();
  return (
    <Modal onClose={onDecline} title={tr("m65c83103b2")} icon={Star}>
      <div className="flex-1 p-4">
        <div className="p-5 rounded-xl glass-effect text-center">
          <div
            className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ background: 'var(--accent-dim)' }}
          >
            <Star className="w-7 h-7" style={{ color: 'var(--accent)' }} />
          </div>

          <h3 className="text-base font-medium mb-2" style={{ color: 'var(--text)' }}>
            {tr("m0658bd23ee")}</h3>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {tr("mac872b3279")}</p>

          <div className="grid gap-2">
            <button
              type="button"
              onClick={onAccept}
              className="w-full min-h-[44px] rounded-xl font-semibold text-white touch-manipulation"
              style={{ background: 'var(--accent)' }}
            >
              {tr("m52d88b9b3c")}</button>
            <button
              type="button"
              onClick={onDecline}
              className="w-full min-h-[44px] rounded-xl font-medium touch-manipulation"
              style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            >
              {tr("ma73293ea3f")}</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
