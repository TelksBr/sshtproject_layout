/**
 * Cria um container DIV isolado para renderizar modais via Portal
 * Garante que o modal não seja afetado por overflow:hidden ou stacking contexts do DOM principal
 * 
 * Uso com React.createPortal:
 * ```tsx
 * import { createPortal } from 'react-dom';
 * import { ensureModalRoot } from '../utils/createPortal';
 * 
 * export function MyModal() {
 *   return createPortal(
 *     <div className="modal">...</div>,
 *     ensureModalRoot()
 *   );
 * }
 * ```
 */

export function ensureModalRoot(): HTMLElement {
  // Verificar se já existe um modal root
  let modalRoot = document.getElementById('modal-root-container');
  
  if (modalRoot) {
    return modalRoot;
  }

  // Criar novo elemento para modais
  modalRoot = document.createElement('div');
  modalRoot.id = 'modal-root-container';
  
  // Estilos inline para garantir que funciona mesmo antes do CSS carregar
  modalRoot.style.position = 'fixed';
  modalRoot.style.top = '0';
  modalRoot.style.left = '0';
  modalRoot.style.width = '100%';
  modalRoot.style.height = '100%';
  modalRoot.style.padding = 'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
  modalRoot.style.zIndex = '9999';
  modalRoot.style.pointerEvents = 'none'; // Permite cliques passarem (cada modal controla isso)
  
  // Inserir antes do fechamento da body
  document.body.appendChild(modalRoot);

  return modalRoot;
}

/**
 * Verifica se o navegador suporta createPortal (React)
 */
export function isPortalSupported(): boolean {
  try {
    const React = require('react-dom');
    return typeof React.createPortal === 'function';
  } catch {
    return false;
  }
}

/**
 * Função helper para criar div com estilos sanitizados
 * Útil para debug em navegadores antigos
 */
export function createStyledDiv(className: string, initialStyles?: Record<string, string>): HTMLDivElement {
  const div = document.createElement('div');
  
  if (className) {
    div.className = className;
  }

  if (initialStyles) {
    Object.entries(initialStyles).forEach(([key, value]) => {
      // Usar setProperty para evitar problemas com camelCase vs kebab-case
      div.style.setProperty(
        key.replace(/([A-Z])/g, '-$1').toLowerCase(),
        value
      );
    });
  }

  return div;
}

/**
 * Remove o modal root quando não há mais modais
 * Útil para limpeza
 */
export function cleanupModalRoot(): void {
  const modalRoot = document.getElementById('modal-root-container');
  if (modalRoot && modalRoot.children.length === 0) {
    modalRoot.remove();
  }
}
