/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          500: '#06b6d4',
          600: '#0284c7',
          700: '#0369a1',
          900: '#020617'
        }
      }
    },
  },
  plugins: [],
}
