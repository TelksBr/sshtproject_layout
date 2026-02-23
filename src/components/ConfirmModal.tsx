import { AlertTriangle } from '../utils/icons';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  type = 'warning'
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getColors = () => {
    switch (type) {
      case 'danger':
        return {
          border: 'border-red-600/50',
          iconBg: 'bg-red-600/20',
          iconColor: 'text-red-400',
          confirmBg: 'bg-red-600 hover:bg-red-700'
        };
      case 'warning':
        return {
          border: 'border-yellow-600/50',
          iconBg: 'bg-yellow-600/20',
          iconColor: 'text-yellow-400',
          confirmBg: 'bg-yellow-600 hover:bg-yellow-700'
        };
      default:
        return {
          border: 'border-[#6205D5]/50',
          iconBg: 'bg-[#6205D5]/20',
          iconColor: 'text-[#6205D5]',
          confirmBg: 'bg-[#6205D5] hover:bg-[#4B0082]'
        };
    }
  };

  const colors = getColors();

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70] p-4">
      <div 
        className={`bg-gradient-to-br from-[#1a0628] to-[#2a1038] rounded-lg border-2 ${colors.border} p-6 max-w-md w-full animate-in zoom-in-95 duration-200`}
      >
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`${colors.iconBg} p-3 rounded-lg flex-shrink-0`}>
            <AlertTriangle className={`w-6 h-6 ${colors.iconColor}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-gray-300 text-sm leading-relaxed">{message}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors text-white"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 px-4 ${colors.confirmBg} rounded-lg font-semibold transition-colors text-white`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
