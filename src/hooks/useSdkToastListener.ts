import { message as tr, useMessages } from '../i18n/messages';
import { useToast } from './useToast';
import { useDTunnelEvent } from './useDTunnelEvent';

/**
 * Hook que integra eventos de toast nativos do SDK (showSuccessToast, showErrorToast, notification)
 * com o contexto global de toasts da aplicação.
 * 
 * Uso: Adicionar em um componente pai (como App.tsx) para receber automaticamente
 * notificações do SDK nativo.
 */
export function useSdkToastListener() {
  useMessages();
  const { showToast } = useToast();

  // Escuta eventos de sucesso do SDK
  useDTunnelEvent('showSuccessToast', (payload: any) => {
    const message = typeof payload === 'string' ? payload : payload?.message || tr("mb6d61ca807");
    showToast(message, 'success');
  });

  // Escuta eventos de erro do SDK
  useDTunnelEvent('showErrorToast', (payload: any) => {
    const message = typeof payload === 'string' ? payload : payload?.message || tr("m4a06a0b2ff");
    showToast(message, 'error');
  });

  useDTunnelEvent('messageError', (payload: any) => {
    const message =
      typeof payload === 'string'
        ? payload
        : payload?.content || payload?.message || payload?.title || tr("m302801bb3c");
    showToast(message, 'error');
  });
}
