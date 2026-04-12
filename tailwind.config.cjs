/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      fontFamily: {
        script: ["'Dancing Script'", 'cursive'],
      },
    },
  },
  plugins: [],
};
