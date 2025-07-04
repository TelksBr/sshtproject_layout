import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Desabilitar comportamentos de WebView Android
document.addEventListener('DOMContentLoaded', function() {
  // Desabilitar menu de contexto (clique longo)
  document.addEventListener('contextmenu', function(e) {
    // Permitir menu de contexto em inputs e textareas
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }
    e.preventDefault();
    return false;
  });

  // Desabilitar seleção de texto com duplo clique
  document.addEventListener('selectstart', function(e) {
    // Permitir seleção em inputs e textareas
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }
    e.preventDefault();
    return false;
  });

  // Desabilitar drag and drop
  document.addEventListener('dragstart', function(e) {
    // Permitir drag em inputs e textareas para funcionalidade de seleção
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }
    e.preventDefault();
    return false;
  });

  // Desabilitar zoom com duplo toque (específico para WebView)
  let lastTouchEnd = 0;
  document.addEventListener('touchend', function(e) {
    // Não prevenir em inputs e textareas
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }
    
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, false);

  // Desabilitar highlight de toque
  document.addEventListener('touchstart', function(e) {
    // Não prevenir em inputs e textareas
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }
  });

  // Garantir que eventos de teclado para copiar/colar funcionem em inputs
  document.addEventListener('keydown', function(e) {
    // Permitir Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X em inputs e textareas
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      if (e.ctrlKey && (e.key === 'a' || e.key === 'c' || e.key === 'v' || e.key === 'x')) {
        return; // Permitir essas combinações
      }
    }
  });

  // Garantir que eventos de clipboard funcionem em inputs
  document.addEventListener('paste', function(e) {
    // Permitir colar em inputs e textareas
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }
  });

  document.addEventListener('copy', function(e) {
    // Permitir copiar em inputs e textareas
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }
  });

  document.addEventListener('cut', function(e) {
    // Permitir recortar em inputs e textareas
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }
  });
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
