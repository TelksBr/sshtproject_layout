import { getSdk } from './sdkInstance';

/**
 * Abstração para navegação nativa via SDK DTunnel
 * ✅ Usa: SDK DTunnel (sdk.app, sdk.android)
 * ❌ Removido: window.Dt* (DtStartWebViewActivity, DtReloadApp, DtCloseApp)
 */

/**
 * Abre uma URL no WebView nativo do aplicativo (via SDK)
 */
export function navigateToUrl(url: string): void {
  try {
    const sdk = getSdk();
    if (sdk?.app) {
      sdk.app.startWebViewActivity(url);
      return;
    }

    // ❌ Removido: window.DtStartWebViewActivity
    console.warn('SDK startWebViewActivity não disponível, usando window.open');
    window.open(url, '_blank');
  } catch (error) {
    console.error('Erro ao navegar:', error);
    window.open(url, '_blank');
  }
}

/**
 * Recarrega o aplicativo.
 * ✅ Usa: window.location.reload() como fallback
 * ❌ Removido: window.DtReloadApp
 */
export function reloadApp(): void {
  try {
    const sdk = getSdk();
    if (sdk?.app) {
      sdk.app.startWebViewActivity('about:blank');
      return;
    }
  } catch (error) {
    console.warn('SDK reloadApp não disponível:', error);
  }

  // Fallback: reload padrão do browser
  window.location.reload();
}

/**
 * Fecha o aplicativo (via sdk.android.closeApp)
 * ✅ Usa: SDK DTunnel (sdk.android.closeApp)
 * ❌ Removido: window.DtCloseApp
 */
export function exitApp(): void {
  try {
    const sdk = getSdk();
    if (sdk?.android) {
      sdk.android.closeApp();
      return;
    }
  } catch (error) {
    console.warn('SDK closeApp não disponível:', error);
  }

  // Fallback: reload como último recurso
  window.location.reload();
}

/**
 * Abre uma URL (alias para navigateToUrl)
 */
export function openUrl(url: string): void {
  navigateToUrl(url);
}

/**
 * Verifica se está sendo executado em um WebView/app nativo
 * ✅ Verifica: SDK DTunnel disponível
 * ❌ Removido: Verificação de window.Dt*
 */
export function isRunningInNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  const sdk = getSdk();
  return !!sdk;
}
