import React from 'react';

// The promises the site already makes (formerly the "Why us" band). Edit here to change them everywhere on the PDP.
const ASSURANCES = [
  { label: 'Finest diamonds & gemstones', text: 'Chosen and checked by our jewelers.', icon: 'M6.5 4h11l3.5 5-9 11L3 9zM3 9h18' },
  { label: '90-day warranty', text: 'On every piece we make.', icon: 'M12 3l7.5 3v5.5c0 4.6-3.2 8-7.5 9.5-4.3-1.5-7.5-4.9-7.5-9.5V6z' },
  {
    label: 'Expert support',
    text: 'Talk to a jeweler over video.',
    icon: 'M12 8.5a3.8 3.8 0 100-7.6 3.8 3.8 0 000 7.6zM4.5 20.5c1.2-3.8 4-5.6 7.5-5.6s6.3 1.8 7.5 5.6',
  },
  { label: 'Shop now, pay later', text: 'Pay in full or in instalments.', icon: 'M3 6.5h18v11H3zM3 10h18M7 14.5h4' },
];

/** Navy promise band at the foot of the product page (design-mockups/product-page-v4). */
export default function PdpAssurance() {
  return (
    <section aria-label="Our promise" className="bg-navy text-noir-on">
      <ul className="mx-auto my-0 grid w-full max-w-[1440px] list-none grid-cols-4 gap-6 px-[clamp(16px,3.2vw,56px)] py-9 lg:grid-cols-2 sm:grid-cols-1">
        {ASSURANCES.map((a) => (
          <li key={a.label} className="flex items-start gap-3.5">
            <svg viewBox="0 0 24 24" aria-hidden className="mt-0.5 h-[22px] w-[22px] flex-none fill-none stroke-teal-soft stroke-[1.3]">
              <path d={a.icon} />
            </svg>
            <span className="grid">
              <b className="font-cormorant text-[19px] font-medium text-paper">{a.label}</b>
              <span className="text-[13px] text-noir-on/80">{a.text}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
