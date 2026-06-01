/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans SC"', '"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Noto Sans SC"', '"Inter"', 'system-ui', 'sans-serif'],
      },
      colors: {
        'engine': {
          50: '#eef5ff',
          100: '#d9e8ff',
          200: '#bbd5ff',
          300: '#8cb9ff',
          400: '#5593ff',
          500: '#2e6bff',
          600: '#1649f5',
          700: '#0f36e1',
          800: '#122db6',
          900: '#152b8f',
          950: '#0e1a4a',
        },
        'neon': {
          cyan: '#00d4ff',
          purple: '#8b5cf6',
          gold: '#f59e0b',
          pink: '#ec4899',
        },
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'gradient': 'gradient 8s ease infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 212, 255, 0.3), 0 0 10px rgba(0, 212, 255, 0.1)' },
          '100%': { boxShadow: '0 0 15px rgba(0, 212, 255, 0.5), 0 0 30px rgba(0, 212, 255, 0.2)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
}
