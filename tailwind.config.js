/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: { primary: 'var(--color-brand-primary)', secondary: 'var(--color-brand-secondary)' },
        surface: { bg: 'var(--color-bg)', card: 'var(--color-card)', border: 'var(--color-border)' },
        txt: { primary: 'var(--color-text-primary)', secondary: 'var(--color-text-secondary)' },
        status: { success: 'var(--color-success)', warning: 'var(--color-warning)', danger: 'var(--color-danger)', info: 'var(--color-info)' },
        agent: 'var(--color-agent)',
        sl: { energy: '#E67E22', climate: '#27AE60', investment: '#2980B9', digital: '#8E44AD', programme: '#E74C3C' },
        stage: { lead: '#3498DB', contact: '#2980B9', discovery: '#8E44AD', propdev: '#E67E22', propsub: '#F39C12', negotiation: '#E74C3C', won: '#27AE60', lost: '#7F8C8D', hold: '#95A5A6' },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
