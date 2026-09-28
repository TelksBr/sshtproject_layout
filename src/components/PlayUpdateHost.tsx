import { useSdkPlayUpdate } from '../hooks/useSdkPlayUpdate';
import { Download } from '../utils/icons';
import { PlayUpdateModal } from './modals/PlayUpdateModal';

interface PlayUpdateHostProps {
  blockingModal: string | null;
}

export function PlayUpdateHost({ blockingModal }: PlayUpdateHostProps) {
  const { prompt, downloading, progress, restart, update, dismiss } = useSdkPlayUpdate(blockingModal);

  return (
    <>
      {downloading && (
        <div className="fixed left-3 right-3 bottom-3 z-[70] pointer-events-none flex justify-center">
          <div
            className="w-full max-w-sm p-3 rounded-xl glass-effect flex items-center gap-3"
            style={{ border: '1px solid var(--border)' }}
          >
            <Download className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                <span>Baixando atualização</span>
                {progress !== null && <span>{progress}%</span>}
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface)' }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress ?? 5}%`, background: 'var(--accent)' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      {prompt && (
        <PlayUpdateModal
          variant={prompt}
          onConfirm={prompt === 'ready' ? restart : update}
          onDismiss={dismiss}
        />
      )}
    </>
  );
}
