import { Download, Sparkles } from '../../utils/icons';
import { Modal } from './Modal';

interface PlayUpdateModalProps {
  variant: 'ready' | 'available';
  onConfirm: () => void;
  onDismiss: () => void;
}

const COPY = {
  ready: {
    title: 'Atualização pronta',
    heading: 'A nova versão já foi baixada',
    message: 'Reinicie o app para concluir a atualização. Se estiver conectado, a conexão cai por alguns segundos.',
    confirm: 'Reiniciar agora',
  },
  available: {
    title: 'Nova versão disponível',
    heading: 'Tem uma atualização na Play Store',
    message: 'O download acontece em segundo plano enquanto você continua usando o app.',
    confirm: 'Atualizar',
  },
} as const;

export function PlayUpdateModal({ variant, onConfirm, onDismiss }: PlayUpdateModalProps) {
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
              Depois
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
