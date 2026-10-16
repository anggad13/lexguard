/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#102a43',
          950: '#0b1b2b',
        },
        risk: {
          low: {
            bg: '#f0fdf4',
            border: '#bbf7d0',
            text: '#166534',
            badge: '#22c55e',
          },
          moderate: {
            bg: '#fffbeb',
            border: '#fde68a',
            text: '#92400e',
            badge: '#f59e0b',
          },
          medium: {
            bg: '#fff7ed',
            border: '#fed7aa',
            text: '#9a3412',
            badge: '#ea580c',
          },
          high: {
            bg: '#fef2f2',
            border: '#fecaca',
            text: '#991b1b',
            badge: '#ef4444',
          },
          veryHigh: {
            bg: '#fff1f2',
            border: '#fecdd3',
            text: '#881337',
            badge: '#e11d48',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
