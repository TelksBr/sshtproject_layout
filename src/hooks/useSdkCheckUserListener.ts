import { useDTunnelEvent } from './useDTunnelEvent';

/**
 * Hook que integra eventos de checkUser do SDK nativo com callbacks.
 * Útil para componentes que precisam reagir a resultados de validação de usuário em tempo real.
 * 
 * Uso:
 * ```tsx
 * useSdkCheckUserListener({
 *   onStarted: () => setLoading(true),
 *   onResult: (userData) => setUserInfo(userData),
 *   onError: (error) => setError(error)
 * });
 * ```
 */
export function useSdkCheckUserListener(callbacks?: {
  onStarted?: () => void;
  onResult?: (data: any) => void;
  onError?: (error: any) => void;
}) {
  // Escuta quando a validação de usuário é iniciada
  useDTunnelEvent('checkUserStarted', () => {
    callbacks?.onStarted?.();
  });

  // Escuta resultado da validação de usuário
  useDTunnelEvent('checkUserResult', (payload: any) => {
    callbacks?.onResult?.(payload);
  });

  // Escuta erros na validação de usuário
  useDTunnelEvent('checkUserError', (payload: any) => {
    callbacks?.onError?.(payload);
  });
}
