/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'squid-pink': '#FF007A',
        'squid-green': '#00FF85',
        'squid-dark': '#121212',
        'squid-card': '#1E1E1E',
      }
    },
  },
  plugins: [],
}

