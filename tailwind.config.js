/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Vazirmatn', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#fff9e8',
          100: '#fef2d1',
          200: '#fde4a3',
          300: '#fdd774',
          400: '#fccb46',
          500: '#FCA311',
          600: '#e3930f',
          700: '#bb790c',
          800: '#96610a',
          900: '#784e08'
        }
      },
      animation: {
        in: 'animate-in .5s ease-out',
      },
      keyframes: {
        'animate-in': {
            '0%': { opacity: '0', transform: 'translateY(10px)' },
            '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      }
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}
