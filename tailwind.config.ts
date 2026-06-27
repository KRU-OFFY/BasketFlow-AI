import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0B1026',
        indigo: '#302B7A',
        orange: '#FF6B4A',
        rose: '#FF4D6D',
        purple: '#5B2EFF',
        mango: '#FFC857',
        mint: '#2ED8A3',
      },
    },
  },
  plugins: [],
} satisfies Config;
