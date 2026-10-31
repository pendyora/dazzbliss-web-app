'use client';
import React from 'react';

// Presentational card for the product listing page (design reference: design-mockups/plp-v3/index.html).
// All data and variant logic stays in ProductProfile; this component only renders.

export type PlpMetalTone = 'yellow' | 'white' | 'rose' | 'black';

export interface PlpSwatch {
  key: string;
  label: string;
  tone: PlpMetalTone;
  active: boolean;
  onSelect: () => void;
  onPreview: () => void;
  onPreviewEnd: () => void;
}

export interface PlpBadge {
  label: string;
  tone?: 'gilt' | 'muted' | 'sale';
}

interface PlpCardProps {
  href: string;
  onOpen: () => void;
  name: string;
  /** Optional star rating shown under the name (renders nothing when the product has no reviews). */
  rating?: React.ReactNode;
  mainImage: string;
  hoverImage?: string | null;
  spec?: string;
  price: React.ReactNode;
  comparePrice?: React.ReactNode;
  offLabel?: string | null;
  badges?: PlpBadge[];
  swatches?: PlpSwatch[];
  isWishlisted: boolean;
  onToggleWishlist: () => void;
}

const FALLBACK_IMAGE = '/images/no_images.svg';

// Full class strings so Tailwind's JIT can see them.
export const METAL_SWATCH: Record<PlpMetalTone, string> = {
  yellow: 'bg-gradient-to-br from-metal-yellow-light via-metal-yellow-mid to-metal-yellow-deep',
  white: 'bg-gradient-to-br from-metal-white-light via-metal-white-mid to-metal-white-deep',
  rose: 'bg-gradient-to-br from-metal-rose-light via-metal-rose-mid to-metal-rose-deep',
  black: 'bg-gradient-to-br from-metal-black-light via-metal-black-mid to-metal-black-deep',
};

const BADGE_TONE = {
  gilt: 'text-ink',
  muted: 'text-ink-soft',
  sale: 'text-teal',
};
const MAX_SWATCHES = 4;

export default function PlpCard({
  href,
  onOpen,
  name,
  rating,
  mainImage,
  hoverImage,
  spec,
  price,
  comparePrice,
  offLabel,
  badges = [],
  swatches = [],
  isWishlisted,
  onToggleWishlist,
}: PlpCardProps) {
  const hasAlt = !!hoverImage && hoverImage !== FALLBACK_IMAGE && hoverImage !== mainImage;
  const open = (e: React.MouseEvent) => {
    // Modified clicks (new tab / window) behave like a normal link.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) {
      return;
    }
    e.preventDefault();
    onOpen();
  };

  const badge = badges[0];
  const shown = swatches.slice(0, MAX_SWATCHES);

  return (
    <article className="flex min-w-0 flex-col">
      {/* Hover is scoped to the image so previewing a metal swatch shows that metal's main image. */}
      <div className="group relative">
        <a href={href} onClick={open} aria-label={name} className="relative block aspect-[4/5] overflow-hidden bg-stone">
          <img
            src={mainImage || FALLBACK_IMAGE}
            alt={name}
            loading="lazy"
            onError={(e) => {
              if (!e.currentTarget.src.endsWith(FALLBACK_IMAGE)) {
                e.currentTarget.src = FALLBACK_IMAGE;
              }
            }}
            className={`absolute inset-0 h-full w-full object-contain mix-blend-multiply transition duration-700 ease-luxe group-hover:scale-[1.025] ${
              hasAlt ? 'group-hover:opacity-0' : ''
            }`}
          />
          {hasAlt && (
            <img
              src={hoverImage as string}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-contain opacity-0 mix-blend-multiply transition-opacity duration-700 ease-luxe group-hover:opacity-100"
            />
          )}
        </a>
        {badge && (
          <span
            className={`pointer-events-none absolute left-3 top-3 z-[2] text-[10.5px] font-semibold uppercase leading-[1.3] tracking-[0.14em] ${BADGE_TONE[badge.tone ?? 'gilt']}`}
          >
            {badge.label}
          </span>
        )}
        <button
          type="button"
          aria-pressed={isWishlisted}
          aria-label={isWishlisted ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist();
          }}
          className="absolute right-1.5 top-1.5 z-[2] grid h-9 w-9 place-items-center text-ink"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden
            className={`h-[19px] w-[19px] stroke-current stroke-[1.3] transition-colors ${isWishlisted ? 'fill-teal stroke-teal' : 'fill-none'}`}
          >
            <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" />
          </svg>
        </button>
      </div>

      <div className="grid gap-[3px] pt-3">
        <h3 title={name} className="m-0 line-clamp-2 font-libre text-[15px] font-medium leading-[1.35] text-ink sm:text-[14px]">
          <a href={href} onClick={open} className="text-inherit hover:text-inherit">
            {name}
          </a>
        </h3>
        {rating}
        {spec && <div className="text-[13px] leading-[1.45] text-ink-soft sm:text-[12px]">{spec}</div>}
        <div className="mt-0.5 flex flex-wrap items-baseline gap-2 text-[14px] tabular-nums text-ink">
          <span>{price}</span>
          {comparePrice && <s className="text-[13px] text-ink-faint">{comparePrice}</s>}
          {comparePrice && offLabel && <span className="text-[12px] font-medium text-teal">{offLabel}</span>}
        </div>
        {swatches.length > 1 && (
          <div className="mt-1.5 flex items-center gap-2" role="group" aria-label="Metal">
            {shown.map((s) => (
              <button
                key={s.key}
                type="button"
                aria-pressed={s.active}
                aria-label={s.label}
                title={s.label}
                onClick={s.onSelect}
                onMouseEnter={s.onPreview}
                onMouseLeave={s.onPreviewEnd}
                className={`h-[18px] w-[18px] rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] outline-offset-2 hover:outline hover:outline-1 hover:outline-line-strong aria-pressed:outline aria-pressed:outline-1 aria-pressed:outline-ink ${METAL_SWATCH[s.tone]}`}
              />
            ))}
            {swatches.length > MAX_SWATCHES && (
              <a href={href} onClick={open} className="text-[12px] text-ink-soft hover:text-ink">
                +{swatches.length - MAX_SWATCHES}
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
