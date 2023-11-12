/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: [
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['RaleWay', ...defaultTheme.fontFamily.sans],
      },
      
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

