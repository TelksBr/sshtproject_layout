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

  useEffect(() => {
    // Duplo rAF garante que o browser pintou o frame inicial
    // antes de disparar a transição — resolve race condition no Android WebView
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

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 md:p-4"
      style={{
        // Fallback sólido + backdrop-filter com prefixo webkit
        backgroundColor: isVisible && !isClosing ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0)',
        WebkitBackdropFilter: 'blur(4px)',
        backdropFilter: 'blur(4px)',
        transition: 'background-color 0.3s ease, opacity 0.3s ease',
        opacity: isVisible && !isClosing ? 1 : 0,
      }}
      onClick={(e) => allowClose && e.target === e.currentTarget && handleClose()}
    >
      <div 
        className="relative w-full max-w-[95vw] sm:max-w-md md:max-w-2xl lg:max-w-3xl xl:max-w-4xl rounded-lg sm:rounded-xl shadow-2xl shadow-black/20 border border-[#6205D5]/20 flex flex-col"
        style={{
          // ✅ Background SÓLIDO — sem backdrop-blur-xl (causa render bug no Android WebView)
          background: 'linear-gradient(to bottom right, #26074d, #100322)',
          // ✅ Animação só com opacity — sem scale (scale + backdrop-filter = bug conhecido)
          opacity: isVisible && !isClosing ? 1 : 0,
          transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          // ✅ Max height fixo com fallback seguro (vh pode ser instável no Android)
          maxHeight: 'min(85dvh, calc(100% - 32px))',
          // ✅ Força composição GPU isolada
          willChange: 'opacity',
          // ✅ Previne colapso do flex
          minHeight: '200px',
        }}
      >
        {/* Header fixo */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-[#6205D5]/20">
          {(title || Icon) && (
            <div className="flex items-center gap-2 sm:gap-3">
              {Icon && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#6205D5]/20 flex items-center justify-center">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#6205D5]" />
                </div>
              )}
              {title && <h2 className="text-base sm:text-lg font-bold text-white truncate">{title}</h2>}
            </div>
          )}
          {allowClose && (
            <button
              onClick={handleClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-[#6205D5]/10 transition-colors group ml-auto flex-shrink-0 touch-manipulation"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-[#b0a8ff] group-hover:text-white transition-colors" />
            </button>
          )}
        </div>
        
        {/* Conteúdo com scroll */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>

        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #26074d;
            border-radius: 8px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #6205D5;
            border-radius: 8px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #4B0082;
          }
        `}</style>
      </div>
    </div>
  );
}