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
  const { showToast } = useToast();

  // Escuta eventos de sucesso do SDK
  useDTunnelEvent('showSuccessToast', (payload: any) => {
    const message = typeof payload === 'string' ? payload : payload?.message || 'Operação realizada com sucesso!';
    showToast(message, 'success');
  });

  // Escuta eventos de erro do SDK
  useDTunnelEvent('showErrorToast', (payload: any) => {
    const message = typeof payload === 'string' ? payload : payload?.message || 'Erro desconhecido!';
    showToast(message, 'error');
  });

  // Escuta eventos de notificação genérica do SDK
  useDTunnelEvent('notification', (payload: any) => {
    if (typeof payload === 'string') {
      showToast(payload, 'info');
      return;
    }
    const title = payload?.title ? String(payload.title) : '';
    const body = payload?.message ? String(payload.message) : '';
    const message = [title, body].filter(Boolean).join(' — ') || 'Notificação';
    showToast(message, 'info');
  });

  useDTunnelEvent('messageError', (payload: any) => {
    const message =
      typeof payload === 'string'
        ? payload
        : payload?.content || payload?.message || payload?.title || 'Erro no aplicativo';
    showToast(message, 'error');
  });
}
