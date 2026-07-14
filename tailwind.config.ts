import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0D1B3D',
        blue: '#2563EB',
        cyan: '#06B6D4',
        purple: '#8B5CF6',
        pink: '#EC4899',
        orange: '#F59E0B',
        green: '#10B981',
        mint: '#34D399',
      },
    },
  },
  plugins: [],
} satisfies Config;
