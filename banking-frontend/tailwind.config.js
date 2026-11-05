/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8'
        }
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(148, 163, 184, 0.15), 0 18px 38px rgba(15, 23, 42, 0.35)'
      }
    }
  },
  plugins: []
}
