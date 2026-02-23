import React, { useEffect, useState } from 'react';
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
  const [isOpening, setIsOpening] = useState(true);

  useEffect(() => {
    setIsOpening(false);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 200);
  };

  return (
    <div 
      className={`
        fixed inset-0 z-[100] flex items-center justify-center
        p-2 sm:p-3 md:p-4
        bg-black/60 backdrop-blur-sm
        transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${isOpening ? 'opacity-0' : 'opacity-100'}
        ${isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
      `}
      onClick={(e) => allowClose && e.target === e.currentTarget && handleClose()}
    >
      <div 
        className={`
          relative w-full z-[101]
          max-w-[95vw] sm:max-w-md md:max-w-2xl lg:max-w-3xl xl:max-w-5xl 2xl:max-w-6xl
          bg-gradient-to-br from-[#26074d]/95 to-[#100322]/95
          rounded-lg sm:rounded-xl
          shadow-2xl shadow-black/20
          border border-[#6205D5]/20
          transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${isOpening ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
          ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
          max-h-[85vh] sm:max-h-[88vh] md:max-h-[90vh]
          landscape:max-h-[85vh]
          flex flex-col backdrop-blur-xl
        `}
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
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              className="p-1.5 sm:p-2 rounded-full hover:bg-[#6205D5]/10 transition-colors group ml-auto flex-shrink-0"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-[#b0a8ff] group-hover:text-white transition-colors" />
            </button>
          )}
        </div>
        
        {/* Conteúdo com scroll */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-6 2xl:p-8">
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