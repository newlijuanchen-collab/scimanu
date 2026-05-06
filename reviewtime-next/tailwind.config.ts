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
          DEFAULT: '#206bc4',
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#206bc4',
          600: '#1a5aa3',
          700: '#154882',
        },
        speed: {
          vfast: '#2b8a3e',
          fast: '#2fb344',
          good: '#94d82d',
          normal: '#f59f00',
          slow: '#f76707',
          vslow: '#d63939',
        },
        neutral: '#626976',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,.07), 0 0 0 1px rgba(0,0,0,.04)',
        'card-hover': '0 4px 20px rgba(32,107,196,.15)',
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
