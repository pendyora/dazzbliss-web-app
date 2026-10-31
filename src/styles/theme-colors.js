// Single source of truth for the brand palette.
// Consumed by tailwind.config.js (as theme colors) and by antd ConfigProvider tokens in components.
// Palette: "Atlantic" (design-mockups/plp-v3, product-page-v4) — white page, cool-grey tiles, near-black type,
// navy as the brand colour and teal as a sparing accent. Token names are kept from the first redesign so every
// page picks the palette up from here.
module.exports = {
  // Legacy names still used by older pages; mapped onto the Atlantic palette.
  primary: '#111111',
  secondary: '#2F4156',
  text_w: '#ffffff',
  text: '#111111',
  ivory: '#FFFFFF',
  cream: '#F3F3F2',
  section: '#EEF3F7',
  luxury: '#4E7486',
  mocha: '#5F6368',

  paper: '#FFFFFF', // page ground
  stone: { DEFAULT: '#F3F3F2', deep: '#EAEAE8' }, // product tiles and soft fills
  ink: { DEFAULT: '#111111', soft: '#5F6368', faint: '#8A8D91', hover: '#2A2A2A' }, // text and dark buttons
  line: { DEFAULT: '#E6E6E6', strong: '#CFCFCF' }, // hairlines and control borders
  gilt: { DEFAULT: '#4E7486', soft: '#B9CCD6' }, // accent (teal); soft = accent on dark navy
  noir: { DEFAULT: '#2F4156', on: '#F5EFEB' }, // brand navy surfaces and text on them
  navy: { DEFAULT: '#2F4156', deep: '#22303F' },
  teal: { DEFAULT: '#4E7486', soft: '#B9CCD6' },
  mist: '#EEF3F7', // soft accent panels
  haze: '#F8F9FA', // light grey page bands (client-care title band, search, account)
  danger: '#A23B2E', // form validation messages
  ok: '#4E6B4A', // success states (password strength, confirmations)
  metal: {
    yellow: { light: '#F6E3A6', mid: '#D8B25A', deep: '#B88E35' },
    white: { light: '#FAFAF8', mid: '#D7D6D2', deep: '#AFAEAA' },
    rose: { light: '#F7D4C2', mid: '#DCA28A', deep: '#BF7E66' },
    black: { light: '#6B6763', mid: '#2C2A27', deep: '#121110' },
    platinum: { light: '#F1F2F3', mid: '#BFC2C6', deep: '#84888D' },
  },
};
