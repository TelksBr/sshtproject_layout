import { useToast } from '../hooks/useToast';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from '../utils/icons';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <XCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-600/90 border-green-500 text-white';
      case 'error':
        return 'bg-red-600/90 border-red-500 text-white';
      case 'warning':
        return 'bg-yellow-600/90 border-yellow-500 text-white';
      case 'info':
      default:
        return 'bg-[#6205D5]/90 border-[#6205D5] text-white';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            ${getStyles(toast.type)}
            border-2 rounded-lg shadow-2xl p-4 pr-12
            flex items-center gap-3 min-w-[300px] max-w-[400px]
            pointer-events-auto
            animate-in slide-in-from-top-2 fade-in duration-300
          `}
        >
          <div className="flex-shrink-0">
            {getIcon(toast.type)}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
