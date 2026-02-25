import { useState, useEffect } from 'react';

/**
 * Hook para detectar altura real do viewport em Android
 * Resolve bug no Android WebView onde 100vh não é calculado corretamente
 * 
 * No Android:
 * - window.innerHeight pode incluir a soft keyboard
 * - visualViewport.height é mais preciso
 * 
 * Uso: const viewportHeight = useViewportHeight();
 */
export function useViewportHeight(): number {
  const [height, setHeight] = useState(() => {
    // No Android, usar visualViewport quando disponível
    if (typeof window !== 'undefined' && window.visualViewport) {
      return window.visualViewport.height;
    }
    return window.innerHeight;
  });

  useEffect(() => {
    const updateHeight = () => {
      // Preferir visualViewport (mais preciso em Android)
      if (window.visualViewport) {
        setHeight(window.visualViewport.height);
      } else {
        setHeight(window.innerHeight);
      }
    };

    // Atualizar inicial
    updateHeight();

    // Listeners para mudanças de viewport
    window.addEventListener('resize', updateHeight);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateHeight);
    }

    return () => {
      window.removeEventListener('resize', updateHeight);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateHeight);
      }
    };
  }, []);

  return height;
}

/**
 * Hook para detectar se é viewport landscape
 */
export function useIsLandscape(): boolean {
  const [isLandscape, setIsLandscape] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(orientation: landscape)').matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(orientation: landscape)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsLandscape(e.matches);
    };

    // Usar addEventListener se disponível (mais novo)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    
    // Fallback para addListener (antigo)
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  return isLandscape;
}

/**
 * Calcula a altura máxima segura para modais em Android
 * Leva em conta viewport, teclado, notches, etc.
 */
export function useSafeModalHeight(percentageOfViewport: number = 0.85): number {
  const viewportHeight = useViewportHeight();
  const isLandscape = useIsLandscape();

  // Em landscape, usar menos espaço para acomodar teclado
  const percentage = isLandscape ? Math.min(percentageOfViewport, 0.7) : percentageOfViewport;

  // Garantir mínimo de 300px para modal usável
  const calculatedHeight = Math.max(viewportHeight * percentage, 300);

  return calculatedHeight;
}
