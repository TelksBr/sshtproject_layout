import { useEffect } from 'react';

/**
 * Sincroniza a CSS custom property --vh com o viewport visual real.
 * No Android WebView, quando o teclado virtual abre, `100vh` continua
 * referenciando a altura total (com teclado escondido). O visualViewport
 * API reporta a altura visível correta.
 *
 * Uso no CSS: height: calc(var(--vh, 1vh) * 100)
 */
export function useViewportHeight() {
  useEffect(() => {
    const vv = window.visualViewport;

    function update() {
      const vh = (vv?.height ?? window.innerHeight) * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    update();

    if (vv) {
      vv.addEventListener('resize', update);
      vv.addEventListener('scroll', update);
    } else {
      window.addEventListener('resize', update);
    }

    return () => {
      if (vv) {
        vv.removeEventListener('resize', update);
        vv.removeEventListener('scroll', update);
      } else {
        window.removeEventListener('resize', update);
      }
    };
  }, []);
}
