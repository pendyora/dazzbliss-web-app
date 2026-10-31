// Client-care contact details used across Contact, Terms, Privacy and Shipping (design-mockups/info-pages).
// Email and phone come from the brand config (src/config/brand.ts). See docs/info-pages-api-changes.md before launch.

import { BRAND } from '@/config/brand';

export const CARE = {
  // An empty `phone` in the brand config hides it everywhere.
  email: BRAND.supportEmail as string,
  phone: BRAND.phone as string,
  phoneHref: BRAND.phoneHref as string,
  hours: [
    // DAZZBLISS TODO: confirm opening hours and time zone
    { days: 'Monday – Friday', time: '9am – 5pm PST' },
    { days: 'Saturday – Sunday', time: 'Closed' },
  ],
  replyTime: 'within 48 hours',
};

export const CARE_PAGES = [
  { href: '/returns-shipping', label: 'Shipping & returns' },
  { href: '/faqs', label: 'FAQs' },
  { href: '/contactpage', label: 'Contact us' },
  { href: '/terms-and-conditions', label: 'Terms & conditions' },
  { href: '/privacy-policy', label: 'Privacy policy' },
  { href: '/jewelry-care', label: 'Jewelry care' },
];

export const GUTTER = 'px-[clamp(16px,3.2vw,48px)]';
export const SHELL = `mx-auto w-full max-w-[1440px] ${GUTTER}`;
