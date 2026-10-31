import React from 'react';

import { Img } from '../../components';

/**
 * Press logos. A logo is shown only when it links to the actual article (`href`); the whole
 * section is hidden while there is none, so the site never shows an unverifiable "Featured in" claim.
 * DAZZBLISS TODO: add real press mentions here (logo file in /public/images, article URL).
 */
interface PressLogo {
  src: string;
  alt: string;
  href?: string;
}

const PRESS: PressLogo[] = [
  // Placeholder from the old site, no article link, so it is not shown.
  { src: 'img_vogue_revista_logo.png', alt: 'Vogue Revista' },
];

export default function FeaturedIn() {
  const logos = PRESS.filter((logo) => !!logo.href);
  if (logos.length === 0) {
    return null;
  }

  return (
    <section className="border-y border-line bg-paper">
      <div className="mx-auto grid max-w-[1440px] grid-cols-[minmax(160px,220px)_1fr] items-center gap-12 px-[clamp(16px,3.2vw,56px)] py-14 md:grid-cols-1 md:gap-6 md:py-10 sm:py-8">
        <div>
          <p className="m-0 mb-2 text-[10.5px] font-medium uppercase tracking-[0.22em] text-gilt">Press</p>
          <h2 className="m-0 font-cormorant text-[clamp(28px,2.6vw,38px)] font-normal leading-none text-ink">
            Featured <em className="italic text-gilt">in</em>
          </h2>
        </div>
        <div className="grid grid-cols-4 gap-x-10 gap-y-8 md:gap-x-6 sm:grid-cols-3 sm:gap-4">
          {logos.map((logo) => (
            <a
              key={logo.href}
              href={logo.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${logo.alt} article`}
              className="block opacity-40 grayscale transition-opacity hover:opacity-80"
            >
              <Img src={logo.src} width={262} height={68} alt={logo.alt} className="h-[44px] w-full object-contain lg:h-auto" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
