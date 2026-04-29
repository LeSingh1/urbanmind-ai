/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-app': 'var(--color-bg-app)',
        'bg-sidebar': 'var(--color-bg-sidebar)',
        'bg-panel': 'var(--color-bg-panel)',
        'bg-card': 'var(--color-bg-card)',
        'border-subtle': 'var(--color-border-subtle)',
        'border-active': 'var(--color-border-active)',
        'brand-primary': 'var(--color-brand-primary)',
        'brand-secondary': 'var(--color-brand-secondary)',
        'brand-accent': 'var(--color-brand-accent)',
        'brand-warning': 'var(--color-brand-warning)',
        'brand-danger': 'var(--color-brand-danger)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        zone: {
          res_low: 'var(--zone-res-low)',
          res_med: 'var(--zone-res-med)',
          res_high: 'var(--zone-res-high)',
          commercial: 'var(--zone-commercial)',
          industrial: 'var(--zone-industrial)',
          mixed_use: 'var(--zone-mixed-use)',
          green: 'var(--zone-green)',
          transit: 'var(--zone-transit)',
          health: 'var(--zone-health)',
          education: 'var(--zone-education)',
          utility: 'var(--zone-utility)',
          smart: 'var(--zone-smart)',
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
