import { useCallback } from 'react';
import { modalComponents, ModalComponentProps } from '../components/modals/modalComponents';
import type { ModalType } from '../App';

export function useModalRenderer() {
  const getModal = useCallback(
    (currentModal: ModalType, setCurrentModal: (m: ModalType) => void): JSX.Element | null => {
      if (!currentModal) return null;
      const ModalComponent = modalComponents[currentModal] as React.ComponentType<ModalComponentProps>;
      if (!ModalComponent) return null;
      if (currentModal === 'terms') {
        return <ModalComponent onClose={() => setCurrentModal(null)} onAccept={() => setCurrentModal('privacy')} />;
      }
      if (currentModal === 'privacy') {
        return <ModalComponent onClose={() => setCurrentModal(null)} onAccept={() => setCurrentModal(null)} />;
      }
      return <ModalComponent onClose={() => setCurrentModal(null)} />;
    },
    []
  );
  return { getModal };
}
