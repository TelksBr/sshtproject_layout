import { useDTunnelEvent } from './useDTunnelEvent';

/**
 * Hook que integra eventos de erro genérico do SDK nativo com a aplicação.
 * Útil para componentes que precisam de um sistema centralizado de error tracking.
 * 
 * Uso:
 * ```tsx
 * const error = useSdkErrorListener((errorPayload) => {
 *   console.error('SDK Error:', errorPayload);
 *   logToErrorTracker(errorPayload);
 * });
 * ```
 */
export function useSdkErrorListener(onError?: (error: any) => void) {
  useDTunnelEvent('messageError', (errorPayload: any) => {
    onError?.(errorPayload);
  });
}
