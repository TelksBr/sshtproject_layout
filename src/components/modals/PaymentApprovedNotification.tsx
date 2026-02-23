import React, { useState, useEffect } from 'react';
import { CheckCircle, X } from '../../utils/icons';
import { useNotificationPosition } from '../../hooks/useNotificationPosition';

interface PaymentApprovedNotificationProps {
  amount: number;
  planName?: string;
  orderId: string;
  onDismiss: (orderId: string) => void;
  autoClose?: number; // ms antes de fechar automaticamente
}

export function PaymentApprovedNotification({
  amount,
  planName,
  orderId,
  onDismiss,
  autoClose = 5000
}: PaymentApprovedNotificationProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [progress, setProgress] = useState(100);
  const { position } = useNotificationPosition();

  // Auto-close com progress bar
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => Math.max(0, prev - (100 / (autoClose / 100))));
    }, 100);

    const timer = setTimeout(() => {
      setIsClosing(true);
      setTimeout(() => {
        onDismiss(orderId);
      }, 300);
    }, autoClose);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [autoClose, orderId, onDismiss]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onDismiss(orderId);
    }, 300);
  };

  return (
    <div
      className={`
        fixed z-[999]
        max-w-sm sm:max-w-md
        bg-gradient-to-r from-green-900/95 to-green-800/95
        border-2 border-green-500/50
        rounded-xl
        shadow-2xl shadow-green-900/50
        overflow-hidden
        transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${isClosing 
          ? 'opacity-0 translate-y-full scale-95' 
          : 'opacity-100 translate-y-0 scale-100'
        }
      `}
      style={{
        top: `${position.top}px`,
        right: `${position.right}px`
      }}
    >
      {/* Barra de progresso */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-green-900/30">
        <div
          className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Conteúdo */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Ícone de sucesso com animação */}
          <div className="flex-shrink-0 pt-0.5">
            <div className="relative w-6 h-6 sm:w-8 sm:h-8">
              <div className="absolute inset-0 bg-green-400/20 rounded-full animate-ping" />
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-300 relative" />
            </div>
          </div>

          {/* Mensagem */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-green-100 text-sm sm:text-base">
              🎉 Pagamento Aprovado!
            </h3>
            <p className="text-green-200/90 text-xs sm:text-sm mt-1">
              {planName ? `${planName} - ` : ''}
              <span className="font-semibold">R$ {amount.toFixed(2)}</span>
            </p>
            <p className="text-green-200/70 text-[10px] sm:text-xs mt-1.5">
              ✅ Credenciais armazenadas com sucesso
            </p>
          </div>

          {/* Botão fechar */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1.5 hover:bg-green-700/50 rounded-lg transition-colors group"
            aria-label="Fechar notificação"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-green-300 group-hover:text-green-100" />
          </button>
        </div>

        {/* Ação rápida */}
        <div className="mt-3 sm:mt-4 text-center">
          <button
            onClick={handleClose}
            className="
              text-xs sm:text-sm
              px-3 sm:px-4 py-1.5 sm:py-2
              bg-green-500 hover:bg-green-400
              text-white font-medium
              rounded-lg transition-colors
              active:scale-95
            "
          >
            Acessar Credenciais
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentApprovedNotification;
