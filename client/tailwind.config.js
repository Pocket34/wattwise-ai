/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        charcoal: {
          950: '#060709',
          900: '#0c0e14',
          850: '#11141c',
          800: '#171b26',
          750: '#1e2330',
          700: '#262d3e',
          600: '#343d52',
        },
        amber: {
          glow: '#ff9800',
          warm: '#f59e0b',
          deep: '#d97706',
        },
        copper: {
          light: '#fb923c',
          DEFAULT: '#c2410c',
          dark: '#9a3412',
          metallic: '#b45309',
        },
        lime: {
          electric: '#84cc16',
          bright: '#a3e635',
        },
        ivory: {
          DEFAULT: '#fdfbf7',
          muted: '#e2dfd8',
          dark: '#c5c2ba',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        hindi: ['Noto Sans Devanagari', 'sans-serif'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glow 2.5s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 15px rgba(245, 158, 11, 0.15)' },
          '100%': { boxShadow: '0 0 30px rgba(245, 158, 11, 0.4)' },
        }
      }
    },
  },
  plugins: [],
}
