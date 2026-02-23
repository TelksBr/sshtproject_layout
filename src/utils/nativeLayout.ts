import { getSdk } from './sdkInstance';

/**
 * Abstração para layout e orientação via SDK DTunnel
 * ✅ Usa: SDK DTunnel (sdk.android)
 * ❌ Removido: window.Dt* (DtGetStatusBarHeight, DtGetNavigationBarHeight)
 */

export interface LayoutDimensions {
  statusBarHeight: number;
  navBarHeight: number;
  screenWidth: number;
  screenHeight: number;
}

/**
 * Obtém altura da status bar (via SDK)
 * ✅ Usa: SDK DTunnel (sdk.android.getStatusBarHeight)
 * ❌ Removido: window.DtGetStatusBarHeight
 */
export function getStatusBarHeight(): number {
  try {
    const sdk = getSdk();
    if (sdk?.android) {
      const v = sdk.android.getStatusBarHeight();
      return Number(v ?? 0);
    }
  } catch (error) {
    console.warn('SDK getStatusBarHeight não disponível:', error);
  }

  // Fallback padrão
  return 24;
}

/**
 * Obtém altura da navigation bar (via SDK)
 * ✅ Usa: SDK DTunnel (sdk.android.getNavigationBarHeight)
 * ❌ Removido: window.DtGetNavigationBarHeight
 */
export function getNavBarHeight(): number {
  try {
    const sdk = getSdk();
    if (sdk?.android) {
      const v = sdk.android.getNavigationBarHeight();
      return Number(v ?? 0);
    }
  } catch (error) {
    console.warn('SDK getNavigationBarHeight não disponível:', error);
  }

  // Fallback padrão
  return 48;
}

/**
 * Obtém dimensões completas do layout via SDK
 */
export function getLayoutDimensions(): LayoutDimensions {
  return {
    statusBarHeight: getStatusBarHeight(),
    navBarHeight: getNavBarHeight(),
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
  };
}

/**
 * Calcula padding necessário para app usar full screen com notches/insets
 */
export function getAppPadding(): {
  top: number;
  bottom: number;
  left: number;
  right: number;
} {
  const statusBar = getStatusBarHeight();
  const navBar = getNavBarHeight();
  
  return {
    top: statusBar + 8,
    bottom: navBar + 8,
    left: 8,
    right: 8,
  };
}

/**
 * Listener para mudanças de orientação (via eventos padrão do browser)
 * O SDK já notifica via eventos nativos, mas também monitoramos browser events
 */
export function onOrientationChange(callback: () => void): () => void {
  const handleOrientationChange = () => {
    callback();
  };

  window.addEventListener('orientationchange', handleOrientationChange);
  window.addEventListener('resize', handleOrientationChange);

  return () => {
    window.removeEventListener('orientationchange', handleOrientationChange);
    window.removeEventListener('resize', handleOrientationChange);
  };
}

/**
 * Obtém orientação atual
 */
export function getOrientation(): 'portrait' | 'landscape' {
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
}
