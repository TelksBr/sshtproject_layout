/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
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
