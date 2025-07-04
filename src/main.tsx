import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Desabilitar comportamentos de WebView Android
document.addEventListener('DOMContentLoaded', function() {
  // Desabilitar menu de contexto (clique longo)
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
  });

  // Desabilitar seleção de texto com duplo clique
  document.addEventListener('selectstart', function(e) {
    e.preventDefault();
    return false;
  });

  // Desabilitar drag and drop
  document.addEventListener('dragstart', function(e) {
    e.preventDefault();
    return false;
  });

  // Desabilitar zoom com duplo toque (específico para WebView)
  let lastTouchEnd = 0;
  document.addEventListener('touchend', function(e) {
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
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
