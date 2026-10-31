// Client-care contact details used across Contact, Terms, Privacy and Shipping (design-mockups/info-pages).
// Change them here once and every page follows. See docs/info-pages-api-changes.md before launch.

export const CARE = {
  // TODO(launch): confirm the real Pendyora mailbox and phone line. Leave `phone` empty to hide it everywhere.
  email: 'care@pendyora.com',
  phone: '',
  phoneHref: '',
  hours: [
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
