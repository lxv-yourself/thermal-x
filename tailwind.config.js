/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Thermal-X warm palette — amber / bronze / burnt orange
        surface: {
          950: '#0a0702',
          900: '#0f0a06',
          850: '#160e07',
          800: '#1a1108',
          750: '#221709',
          700: '#2a1e0c',
          600: '#3d2c14',
          500: '#5a3f1e',
          400: '#7a5530',
        },
        thermal: {
          50:  '#fffbf0',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        ember: {
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        },
        danger: {
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
        },
        success: {
          400: '#86efac',
          500: '#4ade80',
          600: '#22c55e',
        },
        warning: {
          400: '#fde047',
          500: '#facc15',
        },
        gold: {
          400: '#fde68a',
          500: '#fcd34d',
          600: '#fbbf24',
        },
        muted: '#6b4f38',
        border: '#3d2c14',
        'border-subtle': '#261a0a',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      backgroundImage: {
        'thermal-gradient': 'linear-gradient(135deg, #0f0a06 0%, #1a1108 50%, #0a0702 100%)',
        'amber-glow': 'radial-gradient(ellipse at top, rgba(245,158,11,0.12) 0%, transparent 70%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-up': 'slideInUp 0.25s ease-out',
        'glow-amber': 'glowAmber 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(24px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glowAmber: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(245,158,11,0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(245,158,11,0.6)' },
        },
      },
      spacing: {
        '4.5': '1.125rem',
        '5.5': '1.375rem',
        '13': '3.25rem',
        '18': '4.5rem',
      },
      borderRadius: {
        'xl2': '1rem',
      },
    },
  },
  plugins: [],
};
