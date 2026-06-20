import type { Config } from 'tailwindcss';
export default { content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'], theme: { extend: { colors: { navy: '#0f172a', orange: '#f97316', purple: '#7c3aed' } } }, plugins: [] } satisfies Config;
