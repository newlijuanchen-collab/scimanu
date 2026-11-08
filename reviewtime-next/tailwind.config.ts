import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5294ff',
          50: '#f1f5fb',
          100: '#e9f0fc',
          200: '#c8d8ee',
          300: '#9ec5ff',
          400: '#78acff',
          500: '#5294ff',
          600: '#3d7fe8',
          700: '#2c528c',
          800: '#214273',
          900: '#151515',
        },
        orange: {
          50: '#fff8e2',
          100: '#f4d77c',
          200: '#f0c866',
          300: '#ffc79a',
          400: '#fb923c',
          500: '#f18731',
          600: '#e87620',
          700: '#bd5a12',
          800: '#8e4310',
          900: '#60300e',
          950: '#151515',
        },
        speed: {
          vfast: '#10b981',
          fast: '#22c55e',
          good: '#84cc16',
          normal: '#f59e0b',
          slow: '#f97316',
          vslow: '#ef4444',
        },
        neutral: '#64748b',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'sans-serif'],
      },
      borderRadius: {
        lg: '8px',
        xl: '10px',
        '2xl': '10px',
      },
      boxShadow: {
        sm: '2px 3px 0 rgba(21,21,21,.10)',
        md: '3px 4px 0 rgba(21,21,21,.12)',
        lg: '4px 5px 0 rgba(21,21,21,.14)',
        xl: '5px 6px 0 rgba(21,21,21,.16)',
        card: '2px 3px 0 rgba(21,21,21,.10)',
        'card-hover': '3px 4px 0 rgba(21,21,21,.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'count-up': 'countUp 0.6s ease-out',
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
export default config
