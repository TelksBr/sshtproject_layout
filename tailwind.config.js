/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        '3xl': '1920px',
      },
      colors: {
        // Paleta principal do app — usar ao invés de [#hex] inline
        app: {
          bg: '#1A0628',        // Background raiz do app
          surface: '#26074d',   // Cards, painéis, inputs
          deep: '#100322',      // Áreas mais profundas (gradiente modal)
          accent: '#6205D5',    // Botões, bordas, ícones — COR PRINCIPAL
          'accent-light': '#7c4dff', // Hover/accent claro
          text: '#b0a8ff',      // Texto secundário / labels
          muted: '#4B0082',     // Bordas sutis, hover states
        },
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.no-select': {
          '-webkit-user-select': 'none !important',
          '-moz-user-select': 'none !important',
          '-ms-user-select': 'none !important',
          'user-select': 'none !important',
          '-webkit-touch-callout': 'none !important',
          '-webkit-tap-highlight-color': 'transparent !important',
        },
        '.allow-select': {
          '-webkit-user-select': 'text !important',
          '-moz-user-select': 'text !important',
          '-ms-user-select': 'text !important',
          'user-select': 'text !important',
          '-webkit-touch-callout': 'default !important',
        },
        '.no-drag': {
          '-webkit-user-drag': 'none !important',
          '-khtml-user-drag': 'none !important',
          '-moz-user-drag': 'none !important',
          '-o-user-drag': 'none !important',
          'user-drag': 'none !important',
        },
      }
      addUtilities(newUtilities)
    }
  ],
};
