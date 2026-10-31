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
      colors: {
        primary: '#18381d',
        secondary: '#818d64',
        text_w: '#ffffff',
      },

      boxShadow: {},
      // fontFamily: { notosans: 'Noto Sans' },
      fontFamily: {
        notosans: ['Noto Sans', 'sans-serif'],
        castoro: ['Castoro', 'serif'],
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
