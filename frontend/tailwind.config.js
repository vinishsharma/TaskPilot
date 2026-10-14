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
          dark: '#1e1e24',
          accent: '#8b3a3a', // dark brick/burgundy accent seen on buttons in PDF
          accentHover: '#722f2f',
        }
      }
    },
  },
  plugins: [],
}
