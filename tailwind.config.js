const themeColors = require('./src/styles/theme-colors');

module.exports = {
  mode: 'jit',
  content: ['./src/**/**/*.{js,ts,jsx,tsx,html,mdx}', './src/**/*.{js,ts,jsx,tsx,html,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            p: {
              marginTop: '0',
              marginBottom: '0',
            },
          },
        },
      },
      colors: themeColors,
      transitionTimingFunction: {
        luxe: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
      },
      keyframes: {
        shimmer: {
          from: { backgroundPosition: '120% 0' },
          to: { backgroundPosition: '-120% 0' },
        },
        rise: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'none' },
        },
        progress: {
          from: { width: '0%' },
          to: { width: '100%' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.2s linear infinite',
        progress: 'progress 6s linear forwards',
        rise: 'rise 0.45s cubic-bezier(0.2, 0.7, 0.2, 1) both',
      },

      boxShadow: {},
      fontFamily: {
        sans: ['Libre Franklin', 'sans-serif'],
        serif: ['Cormorant Garamond', 'serif'],
        notosans: ['Libre Franklin', 'sans-serif'],
        castoro: ['Cormorant Garamond', 'serif'],
        libre: ['Libre Franklin', 'sans-serif'],
        cormorant: ['Cormorant Garamond', 'serif'],
      },
    },
    screens: {
      // "2xl": { max: "1680px" }, // Add breakpoint for screens larger than 1920px
      '2xl': { max: '1710px' }, // Add breakpoint for screens larger than 1920px
      '1xl': { max: '1600px' },
      xl: { max: '1553px' },
      xls: { max: '1280px' },
      lg: { max: '1024px' },
      md: { max: '769px' },
      sm: { max: '550px' },
      // "sm-min": { min: "320px" }, // Example min-width for mobile screens
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
