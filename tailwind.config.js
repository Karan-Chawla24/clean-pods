/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./{app,components,libs,pages,hooks}/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
  keyframes: {
    shimmer: {
      '0%': { transform: 'translateX(-150%) skewX(-12deg)' },
      '100%': { transform: 'translateX(150%) skewX(-12deg)' },
    },
  },
  animation: {
    shimmer: 'shimmer 2.5s infinite',
  },
}
,
  },
  plugins: [],
}

