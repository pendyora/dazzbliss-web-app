'use client';
import React from 'react';

import Link from 'next/link';

import ProductProfile from '@/components/ProductProfile';

export interface PlpBanner {
  desktop_image: string;
  mobile_image?: string;
  name?: string;
  redirect_url?: string;
}

/** 3 columns while the filter rail is open, 4 when it is hidden (design-mockups/plp-v3). */
export type PlpColumns = 3 | 4;

// Products between promo tiles. Tiles are card-sized and pinned to the left or right edge of the grid, so they stay
// on an edge whatever the column count; `grid-flow-row-dense` lets products fill the cells around them.
const BLOCK_SIZE = 8;
const SERVICE_TILE = 'service';

/** Renders "Fine Jewelry" as "Fine <em>Jewelry</em>" — the last word is set in italic. */
export function EditorialTitle({ text, emClassName = '' }: { text?: string | null; emClassName?: string }) {
  const words = (text ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return null;
  }
  const last = words.pop();
  return (
    <>
      {words.length > 0 && `${words.join(' ')} `}
      <em className={`italic ${emClassName}`}>{last}</em>
    </>
  );
}

function BannerTile({ banner, edge }: { banner: PlpBanner; edge: string }) {
  const href = banner.redirect_url || '#';
  return (
    <Link href={href} className={`group grid min-w-0 content-start gap-3 ${edge}`}>
      <span className="relative block aspect-[4/5] overflow-hidden bg-stone">
        <picture className="contents">
          {banner.mobile_image && <source media="(max-width: 550px)" srcSet={banner.mobile_image} />}
          <img
            src={banner.desktop_image}
            alt={banner.name || 'Featured collection'}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-luxe group-hover:scale-[1.03]"
          />
        </picture>
      </span>
      <span className="grid gap-1">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-teal">Featured</span>
        {banner.name && <span className="font-cormorant text-[24px] font-medium leading-[1.1] text-ink md:text-[20px]">{banner.name}</span>}
        <span className="mt-1 justify-self-start border-b border-current text-[12px] font-semibold uppercase tracking-[0.1em] text-ink">
          Shop now
        </span>
      </span>
    </Link>
  );
}

/** Brand tile: navy, framed, pointing to a real service (no offer copy, so nothing to keep in sync). */
function ServiceTile({ edge }: { edge: string }) {
  return (
    <Link
      href="/virtual-appointment"
      className={`group relative grid aspect-[4/5] min-w-0 content-end overflow-hidden bg-navy p-7 text-noir-on before:absolute before:inset-3.5 before:border before:border-teal before:content-[''] md:p-[18px] ${edge}`}
    >
      <span className="relative text-[10.5px] font-semibold uppercase tracking-[0.16em] text-noir-on/80">Book a jeweler</span>
      <span className="relative mb-[18px] mt-2.5 font-cormorant text-[clamp(28px,2.6vw,40px)] leading-[1.05] md:text-[24px]">
        See it before
        <br />
        you <em className="italic">decide.</em>
      </span>
      <span className="relative inline-flex h-[42px] items-center justify-self-start bg-teal px-5 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-paper transition-colors group-hover:bg-noir-on group-hover:text-navy">
        Video appointment
      </span>
    </Link>
  );
}

export function gridClassName(columns: PlpColumns) {
  return `grid grid-flow-row-dense gap-x-4 gap-y-10 pb-5 lg:grid-cols-3 md:grid-cols-2 md:gap-x-2.5 md:gap-y-7 ${
    columns === 4 ? 'grid-cols-4' : 'grid-cols-3'
  }`;
}

interface PlpGridProps {
  products: any[];
  banners: PlpBanner[];
  columns: PlpColumns;
  /** The PLP's own route segment (e.g. "all", "engagement-rings") — distinct from each
   * product's real category, which is what a card's own `jewelryTypeData` holds. Needed so
   * ProductProfile can tell it's being rendered from this grid (for the breadcrumb filter
   * crumb) even on an aggregate listing like `/all`, where per-item categories vary. */
  pageJewelryType?: string;
}

export default function PlpGrid({ products, banners, columns, pageJewelryType }: PlpGridProps) {
  const usable = banners.filter((b) => !!b?.desktop_image);
  // Second tile is always the service tile; the CMS banners fill the rest.
  const tiles: (PlpBanner | typeof SERVICE_TILE)[] = usable.length ? [usable[0], SERVICE_TILE, ...usable.slice(1)] : [SERVICE_TILE];
  const items: React.ReactNode[] = [];

  products.forEach((product, i) => {
    items.push(
      <ProductProfile
        key={`${product?.sku_master_id ?? product?.jewelry_id}-${i}`}
        {...product}
        isStatic
        layout="plp"
        pageJewelryType={pageJewelryType}
      />,
    );
    // Only after a full block, so a short last page never ends with a lone promo.
    if ((i + 1) % BLOCK_SIZE === 0 && i + 1 < products.length) {
      const n = (i + 1) / BLOCK_SIZE - 1;
      const edge = n % 2 === 0 ? 'col-[1/2]' : 'col-[-2/-1]';
      const tile = tiles[n % tiles.length];
      items.push(
        tile === SERVICE_TILE ? <ServiceTile key={`promo-${n}`} edge={edge} /> : <BannerTile key={`promo-${n}`} banner={tile} edge={edge} />,
      );
    }
  });

  return <div className={gridClassName(columns)}>{items}</div>;
}

export function PlpGridSkeleton({ columns, count = 6 }: { columns: PlpColumns; count?: number }) {
  const shimmer =
    "relative overflow-hidden bg-stone after:absolute after:inset-0 after:animate-shimmer after:bg-gradient-to-r after:from-transparent after:via-paper/60 after:to-transparent after:bg-[length:220%_100%] after:content-['']";
  return (
    <div className={gridClassName(columns)} aria-busy="true" aria-label="Loading pieces">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex min-w-0 flex-col">
          <div className={`aspect-[4/5] ${shimmer}`} />
          <div className="grid gap-2 pt-4">
            <span className={`block h-[11px] w-3/4 ${shimmer}`} />
            <span className={`block h-[11px] w-1/2 ${shimmer}`} />
            <span className={`block h-[11px] w-1/4 ${shimmer}`} />
          </div>
        </div>
      ))}
    </div>
  );
}
