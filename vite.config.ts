import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
  ],

  build: {
    target: 'es2015', // Compatível com Android 6+ e webviews modernas
    minify: 'esbuild', // Mais rápido e eficiente que terser
    cssCodeSplit: false, // WebView inline: tudo num arquivo só
    sourcemap: false, // Remove mapa de código no build final (mais leve)
    chunkSizeWarningLimit: 600, // Ajustado para bundle WebView
    
    rollupOptions: {
      output: {
        // Sem code splitting — WebView usa HTML inline
        inlineDynamicImports: true,
      },
    },
  },
  
  esbuild: {
    drop: ['console', 'debugger'],
    legalComments: 'none',
  },

  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react', 'qrcode'],
  },
});
