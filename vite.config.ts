import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),

    // Gera relatório de peso visual
    visualizer({
      filename: './dist/report.html',
      open: false, // Não abre automaticamente
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
    
    // 🆕 Code splitting otimizado para melhor cache
    rollupOptions: {
      output: {
        manualChunks: {
          // Separa React em chunk próprio (raramente muda)
          'vendor-react': ['react', 'react-dom'],
          // Separa ícones em chunk próprio
          'vendor-icons': ['lucide-react'],
          // Utilitários de terceiros
          'vendor-utils': ['qrcode'],
        },
      },
    },
  },
  
  esbuild: {
    drop: ['console', 'debugger'],
    // Minificação mais agressiva
    legalComments: 'none',
  },

  optimizeDeps: {
    // Pré-bundle apenas o essencial
    include: ['react', 'react-dom', 'qrcode'],
    exclude: ['lucide-react'], // Melhor tree-shaking
  },
});
