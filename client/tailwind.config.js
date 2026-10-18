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
          50: '#f0fdf5',
          100: '#dcfce8',
          200: '#bbf7cf',
          300: '#86efa6',
          400: '#4ade7c',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        forest: {
          50: '#f2f8f5',
          100: '#e1efe8',
          200: '#c4dfd3',
          300: '#9bc8b7',
          400: '#6da995',
          500: '#478975',
          600: '#356e5d',
          700: '#2a564a',
          800: '#22463c',
          900: '#1b3a32',
          950: '#0e201b',
          DEFAULT: '#0f3d2e',
          light: '#1b5e43',
          dark: '#08251c',
        },
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        surface: {
          50: '#fafbf9',
          100: '#f4f5f1',
          200: '#e7e9e2',
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
