/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        forest: {
          DEFAULT: '#0f3d2e',
          light: '#1b5e43',
          dark: '#08251c',
        },
        accent: {
          emerald: '#10b981',
          lime: '#84cc16',
          amber: '#f59e0b',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(22, 163, 74, 0.08), 0 2px 6px -2px rgba(0, 0, 0, 0.04)',
        'card': '0 10px 30px -5px rgba(15, 61, 46, 0.08)',
        'glow': '0 0 25px -5px rgba(34, 197, 94, 0.35)',
      }
    },
  },
  plugins: [],
}
