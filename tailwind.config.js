/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fire: '#FF4500',
        frost: '#1E90FF',
        poison: '#32CD32',
        void: '#8B008B',
        wind: '#F0E68C',
      },
    },
  },
  plugins: [],
}
