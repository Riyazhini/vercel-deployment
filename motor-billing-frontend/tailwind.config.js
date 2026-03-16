/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          bg: '#F5F3FF', // Background
          primary: '#4F46E5', // Sidebar/Navbar
          secondary: '#7C3AED', // Buttons
          hover: '#A78BFA', // Hover
        }
      }
    },
  },
  plugins: [],
}
