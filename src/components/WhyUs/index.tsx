import React from 'react';

import { BRAND } from '@/config/brand';

import { Img } from '../';

/**
 * The five brand promises, shared so the checkout rail can lay them out its own way (dividers,
 * flanking rules) without a second copy of the list drifting out of step with the PDP's.
 */
export const whyUsBadges = [
  { src: 'img_close.svg', label: 'Finest Diamond & Gemstone' },
  { src: 'img_user.svg', label: 'Expert Support' },
  { src: 'img_calculator.svg', label: 'Insured Shipping & Returns' },
  { src: 'img_home.svg', label: 'Shop Now Pay Later' },
  { src: 'img_signal.svg', label: '90 Days Warranty' },
];

// The compact card's default vertical pull, which tucks it under the PDP's action buttons.
// Callers that place the card inside their own padded panel (the cart / checkout summary rail)
// pass an empty string instead, so the card sits on that panel's own spacing.
const COMPACT_PDP_SPACING = '-mt-4 md:-mt-2 -mb-4 md:-mb-2';

// Labels for the full-width band (kept as they were; the band sets them on two lines where they wrap).
const BAND_BADGES = [
  { src: 'img_close.svg', label: 'Finest Diamond & Gemstone' },
  { src: 'img_user.svg', label: 'Expert Support' },
  { src: 'img_calculator.svg', label: 'Insured Shipping and Returns' },
  { src: 'img_home.svg', label: 'Shop Now Pay Later' },
  { src: 'img_signal.svg', label: '90 Days Warranty' },
];

export default function WhyUs({ compact = false, className = COMPACT_PDP_SPACING }: { compact?: boolean; className?: string }) {
  // Compact card variant — sized to fit inside the PDP options column (narrow on
  // desktop, full-width on mobile) directly under the action buttons.
  if (compact) {
    return (
      <div className={`w-full border border-line bg-paper px-4 py-6 font-libre sm:px-3 ${className}`}>
        <p className="m-0 mb-5 text-center text-[10.5px] font-medium uppercase tracking-[0.22em] text-gilt">Why {BRAND.name}?</p>
        <div className="grid grid-cols-5 gap-x-2 gap-y-3">
          {whyUsBadges.map((badge, i) => (
            <div key={i} className="flex flex-col items-center gap-2 text-center">
              {/* The icons are light SVGs drawn for a dark band; brightness-0 turns them ink on white. */}
              <Img
                src={badge.src}
                width={40}
                height={40}
                alt={badge.label}
                className="h-7 w-7 object-contain opacity-80 brightness-0 sm:h-5 sm:w-5"
              />
              <p className="m-0 text-[10px] uppercase leading-[1.3] tracking-[0.08em] text-ink-soft sm:text-[8px]">{badge.label}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Full-width navy promise band, matching the product page's assurance strip.
  return (
    <section aria-label={`Why ${BRAND.name}`} className="bg-navy font-libre text-noir-on">
      <div className="mx-auto w-full max-w-[1440px] px-[clamp(16px,3.2vw,56px)] py-[clamp(48px,6vw,80px)]">
        <span className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-teal-soft">Our promise</span>
        <h2 className="m-0 mt-3 font-cormorant text-[clamp(30px,3.2vw,48px)] font-medium leading-none text-paper">
          Why <em className="text-teal-soft">{BRAND.name}?</em>
        </h2>
        <ul className="m-0 mt-10 grid list-none grid-cols-5 gap-6 p-0 lg:grid-cols-3 md:mt-8 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-6">
          {BAND_BADGES.map((badge) => (
            <li key={badge.src} className="flex flex-col items-start gap-4 border-t border-noir-on/20 pt-5 sm:gap-3 sm:pt-4">
              <Img src={badge.src} width={52} height={52} alt="" className="h-9 w-9 object-contain opacity-90 sm:h-7 sm:w-7" />
              <span className="font-cormorant text-[20px] font-medium leading-[1.2] text-paper sm:text-[17px]">{badge.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
