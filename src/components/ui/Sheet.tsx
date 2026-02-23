/**
 * Sheet/Drawer component - padrão moderno para overlays laterais.
 * Usa Portal, bloqueia interação durante animação e evita reabertura acidental.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const CLOSE_GUARD_MS = 350; // Overlay permanece até animação (300ms) + buffer

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  side?: 'left' | 'right';
  overlayClassName?: string;
  panelClassName?: string;
  /** Conteúdo do painel (header, body, footer) */
  render: (props: { close: () => void }) => React.ReactNode;
}

export function Sheet({
  open,
  onClose,
  children,
  side = 'left',
  overlayClassName = '',
  panelClassName = '',
  render,
}: SheetProps) {
  const [isClosing, setIsClosing] = useState(false);
  const closeGuardRef = useRef(false);
  const isClosingRef = useRef(false); // Ref síncrono: evita desmontar painel antes da animação

  const handleClose = useCallback(() => {
    if (closeGuardRef.current) return;
    closeGuardRef.current = true;
    isClosingRef.current = true; // Síncrono - garante que painel permaneça no próximo render
    setIsClosing(true);
    onClose();
    setTimeout(() => {
      closeGuardRef.current = false;
      isClosingRef.current = false;
      setIsClosing(false);
    }, CLOSE_GUARD_MS);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, handleClose]);

  const showOverlay = open || isClosing || isClosingRef.current;
  const showPanel = open || isClosing || isClosingRef.current;
  const translateClass = side === 'left' ? '-translate-x-full' : 'translate-x-full';
  const openTranslateClass = side === 'left' ? 'translate-x-0' : 'translate-x-0';

  if (typeof document === 'undefined') return null;

  const overlay = showOverlay && createPortal(
    <div
      role="button"
      tabIndex={0}
      aria-label="Fechar"
      className={`fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm cursor-pointer touch-manipulation ${overlayClassName}`}
      style={{ pointerEvents: 'auto' }}
      onClick={(e) => {
        e.stopPropagation();
        handleClose();
      }}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
      }}
      onKeyDown={(e) => e.key === 'Escape' && handleClose()}
    />,
    document.body
  );

  const panel = showPanel && createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menu lateral"
      className={`
        fixed inset-y-0 z-[9999]
        ${side === 'left' ? 'left-0' : 'right-0'}
        w-[280px] xs:w-[300px] sm:w-[320px] max-w-[90vw] sm:max-w-[85vw]
        transform transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${open ? openTranslateClass : translateClass}
        ${panelClassName}
      `}
      onClick={(e) => e.stopPropagation()}
    >
      {render({ close: handleClose })}
    </div>,
    document.body
  );

  return (
    <>
      {overlay}
      {panel}
      {children}
    </>
  );
}

