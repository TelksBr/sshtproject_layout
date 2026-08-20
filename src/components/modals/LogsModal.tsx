import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Scroll, Share2, Trash2 } from '../../utils/icons';
import { Modal } from './Modal';
import { useDTunnelEvent } from '../../hooks/useDTunnelEvent';
import { useToast } from '../../hooks/useToast';
import {
  clearVpnLogs,
  copyToClipboard,
  formatVpnLogEntry,
  getVpnLogs,
  sanitizeLogHtml,
  shareText,
  stripLogHtml,
} from '../../utils/appFunctions';

interface LogsModalProps {
  onClose: () => void;
}

function loadLogLines(): string[] {
  try {
    return getVpnLogs().map(formatVpnLogEntry).filter(Boolean);
  } catch {
    return [];
  }
}

export function LogsModal({ onClose }: LogsModalProps) {
  const { showToast } = useToast();
  const [lines, setLines] = useState<string[]>(() => loadLogLines());
  const scrollerRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  const refresh = useCallback(() => {
    const next = loadLogLines();
    setLines((prev) => {
      if (prev.length === next.length && prev.every((line, index) => line === next[index])) {
        return prev;
      }
      return next;
    });
  }, []);

  useDTunnelEvent('newLog', refresh);
  useDTunnelEvent('vpnState', refresh);

  useEffect(() => {
    const id = window.setInterval(refresh, 500);
    return () => window.clearInterval(id);
  }, [refresh]);

  const handleBodyScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 96;
  }, []);

  useEffect(() => {
    if (!stickToBottomRef.current) return;
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [lines]);

  const logsText = lines.map(stripLogHtml).filter(Boolean).join('\n');

  const handleClear = () => {
    try {
      clearVpnLogs();
      stickToBottomRef.current = true;
      setLines([]);
      showToast('Registros limpos', 'success');
    } catch {
      showToast('Não foi possível limpar os registros', 'error');
    }
  };

  const handleCopy = () => {
    if (!logsText) {
      showToast('Nenhum registro para copiar', 'info');
      return;
    }
    try {
      copyToClipboard(logsText);
      showToast('Registros copiados', 'success');
    } catch {
      showToast('Não foi possível copiar os registros', 'error');
    }
  };

  const handleShare = async () => {
    if (!logsText) {
      showToast('Nenhum registro para compartilhar', 'info');
      return;
    }
    const result = await shareText(logsText, 'Registros SSH T PROJECT');
    if (result === 'shared') return;
    if (result === 'copied') {
      showToast('Registros copiados para compartilhar', 'success');
      return;
    }
    if (result === 'failed') {
      showToast('Não foi possível compartilhar os registros', 'error');
    }
  };

  const actionButtonClass =
    'min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl touch-manipulation';

  const modal = (
    <Modal
      onClose={onClose}
      title="Registros"
      icon={Scroll}
      bodyRef={scrollerRef}
      onBodyScroll={handleBodyScroll}
      headerActions={
        <>
          <button
            type="button"
            onClick={handleClear}
            className={actionButtonClass}
            style={{ background: 'var(--bg-elevated)' }}
            aria-label="Limpar registros"
          >
            <Trash2 className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
          </button>
          <button
            type="button"
            onClick={() => void handleShare()}
            className={actionButtonClass}
            style={{ background: 'var(--bg-elevated)' }}
            aria-label="Compartilhar registros"
          >
            <Share2 className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className={actionButtonClass}
            style={{ background: 'var(--bg-elevated)' }}
            aria-label="Copiar registros"
          >
            <Copy className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
          </button>
        </>
      }
    >
      <div className="p-3 sm:p-4">
        {lines.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Nenhum registro no momento.
            </p>
          </div>
        ) : (
          <div
            className="text-[11px] sm:text-xs leading-5 font-mono break-words allow-select select-text space-y-1"
            style={{ color: 'var(--text)' }}
          >
            {lines.map((line, index) => (
              <div
                key={index}
                dangerouslySetInnerHTML={{ __html: sanitizeLogHtml(line) }}
              />
            ))}
          </div>
        )}
      </div>
    </Modal>
  );

  if (typeof document === 'undefined') return modal;
  return createPortal(modal, document.body);
}
