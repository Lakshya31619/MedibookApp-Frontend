/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#eef2fb',
          100: '#d5dff5',
          200: '#aabfeb',
          300: '#7a9add',
          400: '#4f74cc',
          500: '#2f54b8',
          600: '#1e3e96',
          700: '#162d5c',
          800: '#0f1f40',
          900: '#080f20',
        },
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        }
      },
      fontFamily: {
        serif: ['"DM Serif Display"', 'serif'],
        sans: ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
