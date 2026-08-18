import React, { useEffect, useState, useCallback } from 'react';
import { X, type LucideIcon } from '../../utils/icons';

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  allowClose?: boolean;
  title?: string;
  icon?: LucideIcon;
}

export function Modal({ children, onClose, allowClose = true, title, icon: Icon }: ModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : true
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', update);
      return () => mq.removeEventListener('change', update);
    }
    mq.addListener(update);
    return () => mq.removeListener(update);
  }, []);

  useEffect(() => {
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        setIsVisible(true);
      });
      return () => cancelAnimationFrame(raf2);
    });
    return () => cancelAnimationFrame(raf1);
  }, []);

  const handleClose = useCallback(() => {
    if (!allowClose) return;
    setIsClosing(true);
    setTimeout(onClose, 200);
  }, [allowClose, onClose]);

  const show = isVisible && !isClosing;

  return (
    <div 
      className={`fixed inset-0 z-50 flex ${isDesktop ? 'items-center justify-center p-2 sm:p-3 md:p-4 xl:p-6 2xl:p-8' : 'items-end justify-center p-0'}`}
      style={{
        backgroundColor: show ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0)',
        transition: 'background-color 0.3s ease, opacity 0.3s ease',
        opacity: show ? 1 : 0,
        height: 'calc(var(--vh, 1vh) * 100)',
      }}
      onClick={(e) => allowClose && e.target === e.currentTarget && handleClose()}
    >
      <div 
        className={`relative w-full flex flex-col ${
          isDesktop
            ? 'max-w-[95vw] sm:max-w-md md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl 3xl:max-w-6xl rounded-xl sm:rounded-2xl'
            : 'max-w-none rounded-t-2xl rounded-b-none'
        }`}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          opacity: show ? 1 : 0,
          transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          maxHeight: isDesktop ? 'calc(var(--vh, 1vh) * 85)' : 'calc(var(--vh, 1vh) * 90)',
          willChange: 'opacity',
          minHeight: '200px',
        }}
      >
        {!isDesktop && (
          <div className="flex justify-center pt-2 pb-1" aria-hidden>
            <div className="w-10 h-1 rounded-full bg-white/25" />
          </div>
        )}
        <div className="flex items-center justify-between p-3 sm:p-4 xl:p-5 2xl:p-6" style={{ borderBottom: '1px solid var(--border)' }}>
          {(title || Icon) && (
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {Icon && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 xl:w-10 xl:h-10 2xl:w-12 2xl:h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent-dim)' }}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 xl:w-6 xl:h-6 2xl:w-7 2xl:h-7" style={{ color: 'var(--accent)' }} />
                </div>
              )}
              {title && <h2 className="text-base sm:text-lg xl:text-xl 2xl:text-2xl font-semibold truncate" style={{ color: 'var(--text)' }}>{title}</h2>}
            </div>
          )}
          {allowClose && (
            <button
              onClick={handleClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl ml-auto flex-shrink-0 touch-manipulation"
              style={{ background: 'var(--bg-elevated)' }}
              aria-label="Fechar"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 xl:w-7 xl:h-7" style={{ color: 'var(--text-muted)' }} />
            </button>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
          {children}
        </div>

        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-track {
            background: var(--bg-elevated);
            border-radius: 8px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: var(--accent);
            border-radius: 8px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: var(--accent);
          }
        `}</style>
      </div>
    </div>
  );
}
