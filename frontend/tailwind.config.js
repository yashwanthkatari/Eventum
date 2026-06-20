/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        black: '#0a0a0a',
        white: '#f5f5f5',
        gray: {
          900: '#171717',
          800: '#262626',
          400: '#a3a3a3',
          100: '#f5f5f5'
        }
      }
    },
  },
  plugins: [],
}