import { Star } from '../../utils/icons';
import { Modal } from './Modal';

interface PlayStoreReviewModalProps {
  onAccept: () => void;
  onDecline: () => void;
}

export function PlayStoreReviewModal({ onAccept, onDecline }: PlayStoreReviewModalProps) {
  return (
    <Modal onClose={onDecline} title="Avalie o app" icon={Star}>
      <div className="flex-1 p-4">
        <div className="p-5 rounded-xl glass-effect text-center">
          <div
            className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ background: 'var(--accent-dim)' }}
          >
            <Star className="w-7 h-7" style={{ color: 'var(--accent)' }} />
          </div>

          <h3 className="text-base font-medium mb-2" style={{ color: 'var(--text)' }}>
            Está gostando da conexão?
          </h3>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Se o app está te ajudando, deixe uma avaliação na Play Store. Leva só alguns segundos e nos ajuda bastante.
          </p>

          <div className="grid gap-2">
            <button
              type="button"
              onClick={onAccept}
              className="w-full min-h-[44px] rounded-xl font-semibold text-white touch-manipulation"
              style={{ background: 'var(--accent)' }}
            >
              Avaliar na Play Store
            </button>
            <button
              type="button"
              onClick={onDecline}
              className="w-full min-h-[44px] rounded-xl font-medium touch-manipulation"
              style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            >
              Agora não
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
