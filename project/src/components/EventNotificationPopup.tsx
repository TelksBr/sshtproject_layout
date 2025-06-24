import { useEffect } from 'react';

interface EventNotificationPopupProps {
  eventName: string;
  visible: boolean;
  onClose: () => void;
}

export function EventNotificationPopup({ eventName, visible, onClose }: EventNotificationPopupProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 2500);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 bg-[#26074d] border border-[#6205D5]/40 shadow-lg rounded-xl px-6 py-4 text-[#b0a8ff] text-base font-semibold animate-fade-in-up min-w-[220px] max-w-xs pointer-events-auto"
      style={{ boxShadow: '0 4px 24px 0 #00000040' }}
    >
      <span className="block text-center">Evento: <span className="text-[#ff5c8a]">{eventName}</span></span>
    </div>
  );
}

// Animação fade-in-up (adicione ao seu CSS global ou tailwind.config.js)
// @keyframes fade-in-up {
//   from { opacity: 0; transform: translateY(20px); }
//   to { opacity: 1; transform: translateY(0); }
// }
// .animate-fade-in-up { animation: fade-in-up 0.4s cubic-bezier(.4,0,.2,1); }
