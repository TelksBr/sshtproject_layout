import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface EventNotificationPopupProps {
  eventName: string;
  visible: boolean;
  onClose: () => void;
}

export function EventNotificationPopup({ eventName, visible, onClose }: EventNotificationPopupProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsExiting(false);
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(onClose, 300); // Tempo para animação de saída
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  // Só mostra notificações de erro e sucesso
  if (!visible || (!eventName.includes('Error') && !eventName.includes('Success'))) {
    return null;
  }

  const isError = eventName.includes('Error');
  const isSuccess = eventName.includes('Success');

  const getNotificationConfig = () => {
    if (isError) {
      return {
        icon: <XCircle className="w-5 h-5" />,
        title: 'Erro',
        message: 'Ocorreu um erro na operação',
        bgColor: 'from-red-500/90 to-red-600/90',
        borderColor: 'border-red-400/50',
        iconColor: 'text-red-100',
        textColor: 'text-red-50'
      };
    }
    
    if (isSuccess) {
      return {
        icon: <CheckCircle className="w-5 h-5" />,
        title: 'Sucesso',
        message: 'Operação realizada com sucesso',
        bgColor: 'from-green-500/90 to-green-600/90',
        borderColor: 'border-green-400/50',
        iconColor: 'text-green-100',
        textColor: 'text-green-50'
      };
    }

    return null;
  };

  const config = getNotificationConfig();
  if (!config) return null;

  return (
    <div
      className={`fixed top-6 right-6 z-[100] max-w-sm w-full pointer-events-auto notification-container
        ${visible && !isExiting ? 'notification-enter' : 'notification-exit'}`}
    >
      <div
        className={`
          bg-gradient-to-r ${config.bgColor} backdrop-blur-md
          border ${config.borderColor} rounded-xl shadow-2xl
          p-4 flex items-start gap-3 relative overflow-hidden
          transform transition-all duration-200 hover:scale-[1.02]
        `}
      >
        {/* Ícone */}
        <div className={`flex-shrink-0 ${config.iconColor}`}>
          {config.icon}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold text-sm ${config.textColor}`}>
            {config.title}
          </h4>
          <p className={`text-sm ${config.textColor}/90 mt-1`}>
            {config.message}
          </p>
        </div>

        {/* Botão fechar */}
        <button
          onClick={() => {
            setIsExiting(true);
            setTimeout(onClose, 300);
          }}
          className={`flex-shrink-0 ${config.textColor}/70 hover:${config.textColor} 
            transition-colors duration-200 p-1 rounded-md hover:bg-white/10`}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Barra de progresso */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
          <div 
            className="h-full bg-white/50 transition-all duration-[4000ms] ease-linear"
            style={{
              width: visible && !isExiting ? '0%' : '100%'
            }}
          />
        </div>
      </div>
    </div>
  );
}
