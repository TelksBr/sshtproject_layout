import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),

    // Gera relatório de peso visual
    visualizer({
      filename: './dist/report.html',
      open: true, // Abre no navegador automaticamente
      gzipSize: true,
      brotliSize: true,
      template: 'treemap',
    }),
  ],

  build: {
    target: 'es2015', // Compatível com Android 6+ e webviews modernas
    minify: 'esbuild', // Mais rápido e eficiente que terser
    cssCodeSplit: true, // Evita CSS gigantesco num arquivo só
    sourcemap: false, // Remove mapa de código no build final (mais leve)
    chunkSizeWarningLimit: 500, // Te avisa se algum arquivo ficar gigante
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },

  optimizeDeps: {
    exclude: ['lucide-react'], // Evita pré-bundle desnecessário
  },
});
