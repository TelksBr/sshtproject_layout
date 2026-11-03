import { message as tr, useMessages } from '../../i18n/messages';
import type { VTunnelConfigImportState } from 'vtunnel-sdk';
import { Server } from '../../utils/icons';
import { Modal } from './Modal';

interface ConfigImportModalProps {
  pending: VTunnelConfigImportState;
  onConfirm: () => void;
  onReject: () => void;
}

export function ConfigImportModal({ pending, onConfirm, onReject }: ConfigImportModalProps) {
  useMessages();
  const fromClipboard = pending.source === 'clipboard';
  const count = pending.count || pending.configs.length;

  return (
    <Modal onClose={onReject} title={tr("m79e7be0dfa")} icon={Server} overlayClassName="z-[80]">
      <div className="flex-1 p-4">
        <div className="p-5 rounded-xl glass-effect">
          <p className="text-sm mb-4 leading-relaxed text-center" style={{ color: 'var(--text-muted)' }}>
            {fromClipboard
              ? tr("m78173f7d5a")
              : tr("m624c3a79c2")}{' '}
            {count === 1 ? tr("m3d431330df") : tr("maf84627af8", { p0: count })}
          </p>

          {pending.configs.length > 0 && (
            <ul className="mb-5 max-h-56 overflow-y-auto space-y-2">
              {pending.configs.map((item, index) => (
                <li
                  key={`${item.name}-${index}`}
                  className="flex items-center gap-3 p-3 rounded-lg"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                      {item.name}
                    </div>
                    {item.description && (
                      <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                        {item.description}
                      </div>
                    )}
                  </div>
                  {item.mode && (
                    <span
                      className="shrink-0 px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase"
                      style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
                    >
                      {item.mode}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="grid gap-2">
            <button
              type="button"
              onClick={onConfirm}
              className="w-full min-h-[44px] rounded-xl font-semibold text-white touch-manipulation"
              style={{ background: 'var(--accent)' }}
            >
              {tr("me7f0e6d956")}</button>
            <button
              type="button"
              onClick={onReject}
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
