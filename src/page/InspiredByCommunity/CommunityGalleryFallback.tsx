import React from 'react';

import { BRAND } from '@/config/brand';

import { COMMUNITY_SUBHEADING, INSTAGRAM_HANDLE } from './instagram';

/**
 * Curated gallery of bundled images, shown whenever the live Instagram feed cannot be (backend down, token
 * missing or expired, feed switched off, or no posts).
 *
 * Layout: each image once. Desktop is an editorial grid on 12 columns: a large feature image over two rows,
 * then two rows of two tiles with alternating widths (4+3, 3+4). Tablet and phone: the feature image full width,
 * then a 2×2 grid. Breakpoints in this project are max-width (`md:` = 769px and below).
 */
const FEATURE = { src: '/images/img_image_2.png', alt: 'Woman wearing diamond earrings and ring' };

const TILES = [
  { src: '/images/img_jewelry_created.png', alt: 'Woman wearing chunky gold rings', span: 'col-span-4' },
  { src: '/images/img_jewelry_an_e.png', alt: 'Hand with a thin silver ring', span: 'col-span-3' },
  { src: '/images/img_jewelry_arif_khan_15684184.png', alt: 'Silver ring with blue gemstones on display', span: 'col-span-3' },
  { src: '/images/img_jewelry_polinach_11007534_306x308.png', alt: 'Woman wearing gold necklace and earrings', span: 'col-span-4' },
];

function Tile({ src, alt, className }: { src: string; alt: string; className: string }) {
  return (
    <figure className={`group relative m-0 overflow-hidden bg-stone ${className}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-luxe group-hover:scale-[1.04]"
      />
    </figure>
  );
}

export default function CommunityGalleryFallback({
  borderColorClass = 'border-line',
  showTopBorder = true,
}: {
  borderColorClass?: string;
  showTopBorder?: boolean;
}) {
  return (
    <section
      aria-labelledby="community-gallery-heading"
      className={`w-full bg-paper font-libre ${showTopBorder ? `border-t border-solid ${borderColorClass}` : ''} py-[clamp(56px,7vw,96px)]`}
    >
      <div className="mx-auto w-full max-w-[1440px] px-[clamp(16px,3.2vw,56px)]">
        <div className="flex items-end justify-between gap-8 md:flex-col md:items-start md:gap-4">
          <div className="max-w-[640px]">
            <span className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-gilt">{INSTAGRAM_HANDLE || BRAND.name}</span>
            <h2
              id="community-gallery-heading"
              className="m-0 mt-3 text-balance font-cormorant text-[clamp(30px,3.2vw,48px)] font-medium leading-none text-ink"
            >
              Be inspired by our <em className="text-gilt">community</em>
            </h2>
          </div>
          <p className="m-0 max-w-[440px] text-[14px] leading-[1.65] text-ink-soft">{COMMUNITY_SUBHEADING}</p>
        </div>

        <div className="mt-10 grid auto-rows-[clamp(200px,19vw,290px)] grid-cols-12 gap-3 md:mt-8 md:auto-rows-auto md:grid-cols-2 md:gap-2 sm:mt-6">
          <Tile {...FEATURE} className="col-span-5 row-span-2 md:col-span-2 md:row-span-1 md:aspect-[4/3]" />
          {TILES.map((t) => (
            <Tile key={t.src} src={t.src} alt={t.alt} className={`${t.span} md:col-span-1 md:aspect-square`} />
          ))}
        </div>
      </div>
    </section>
  );
}
