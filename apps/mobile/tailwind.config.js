/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#FAFAFA',
        surface: '#FFFFFF',
        'surface-alt': '#F5F0ED',
        foreground: '#1A1A1A',
        muted: '#8C8C8C',
        accent: '#C9A99A',
        'accent-dark': '#A07B6F',
        border: '#E8E2DE',
        success: '#4CAF82',
        warning: '#E8A838',
        error: '#E05C5C',
      },
      fontFamily: {
        display: ['PlayfairDisplay_700Bold'],
        body: ['Inter_400Regular'],
        'body-medium': ['Inter_500Medium'],
        'body-bold': ['Inter_700Bold'],
      },
    },
  },
  plugins: [],
};
