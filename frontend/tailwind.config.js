/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0a0e1a',
        'bg-secondary': '#0f1628',
        'bg-panel': '#131929',
        'bg-card': '#1a2235',
        'border-subtle': '#1e2d47',
        'border-active': '#2d4a7a',
        'accent-blue': '#3b82f6',
        'accent-cyan': '#06b6d4',
        'accent-green': '#10b981',
        'accent-amber': '#f59e0b',
        'accent-red': '#ef4444',
        'accent-purple': '#8b5cf6',
        'text-primary': '#e2e8f0',
        'text-secondary': '#94a3b8',
        'text-muted': '#64748b',
        zone: {
          res_low: '#22c55e',
          res_med: '#16a34a',
          res_high: '#15803d',
          com_retail: '#3b82f6',
          com_office: '#1d4ed8',
          ind_light: '#f59e0b',
          ind_heavy: '#d97706',
          mix_use: '#8b5cf6',
          green_park: '#4ade80',
          green_forest: '#166534',
          health: '#ec4899',
          edu: '#06b6d4',
          infra: '#94a3b8',
          trans: '#f97316',
          safety: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
