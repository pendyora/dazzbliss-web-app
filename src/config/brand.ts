/**
 * Company identity, in one place. Page titles, metadata, policy text, emails shown on the site, logo
 * alt text and labels read the brand from here; no company name is written anywhere else in the code.
 * To run this storefront for another company, change this file and the logo files in /public/images.
 */
const address = {
  line1: 'A-802 Pushkar Heights',
  line2: 'Kiran Chowk, Varachha',
  city: 'Surat',
  state: 'Gujarat',
  postalCode: '395006',
  country: 'India',
};

export const BRAND = {
  name: 'Dazzbliss',
  nameUpper: 'DAZZBLISS',
  /** Short line used in page titles, e.g. `Rings | Dazzbliss`. */
  titleSuffix: ' | Dazzbliss',
  tagline: 'Fine jewelry',
  supportEmail: 'support@dazzbliss.com',
  phone: '+91 99783 64430',
  phoneHref: 'tel:+919978364430',
  address: {
    ...address,
    oneLine: `${address.line1}, ${address.line2}, ${address.city}, ${address.state} ${address.postalCode}, ${address.country}`,
  },
  /** Logo files in /public/images. */
  logo: {
    wordmark: '/images/logo.png',
    monogram: '/images/logo-monogram.png',
  },
} as const;

export type Brand = typeof BRAND;
