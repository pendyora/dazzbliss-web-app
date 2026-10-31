'use client';
import React from 'react';

import Link from 'next/link';

import { useAppSelector } from '@/store';

// Collections, product-first (design-mockups/collections): a quiet centred title and a 3-column grid of large tiles.
// Every 7th collection is a wide navy tile, so each one sits above two full rows of three.
// Data: header `collections` → name, description, desktop_image / mobile_image, jewelryCollectionDetails (pieces).

const SHELL = 'mx-auto w-full max-w-[1440px] px-[clamp(16px,3.2vw,48px)]';
const WIDE_EVERY = 7;

interface Collection {
  id: number | string;
  name: string;
  description?: string | null;
  desktop_image?: string | null;
  mobile_image?: string | null;
  jewelryCollectionDetails?: { id: string }[];
}

const hrefOf = (c: Collection) => `/all?collections=${c.name.toLowerCase().split(' ').join('-')}`;
const countOf = (c: Collection) => c.jewelryCollectionDetails?.length ?? 0;
const pieces = (n: number) => `${n} ${n === 1 ? 'piece' : 'pieces'}`;

/** The collection image, or — while none is uploaded — its name set large in serif so the tile still looks deliberate. */
function Stage({ c, dark, className = '' }: { c: Collection; dark?: boolean; className?: string }) {
  if (c.desktop_image || c.mobile_image) {
    return (
      <picture className="contents">
        {c.mobile_image && <source media="(max-width: 550px)" srcSet={c.mobile_image} />}
        <img
          src={c.desktop_image || c.mobile_image || ''}
          alt={c.name}
          loading="lazy"
          className={`h-full w-full object-cover transition-transform duration-[1400ms] ease-luxe group-hover:scale-[1.04] ${className}`}
        />
      </picture>
    );
  }
  return (
    <span
      aria-hidden
      className={`grid h-full w-full place-items-center p-[12%] text-center font-cormorant text-[clamp(28px,3vw,44px)] italic leading-[1.05] transition-transform duration-[1400ms] ease-luxe group-hover:scale-[1.03] ${
        dark ? 'text-noir-on/90' : 'text-navy/70'
      }`}
    >
      {c.name}
    </span>
  );
}

export default function CollectionsPage() {
  const { headerData } = useAppSelector((state) => state.master);
  const collections: Collection[] = (headerData?.collections ?? []).filter((c: Collection) => c?.name);

  let wideCount = 0;

  return (
    <div className="bg-paper font-libre text-[14px] leading-[1.55] text-ink antialiased">
      <div className={SHELL}>
        <div className="grid justify-items-center gap-3 pb-[clamp(28px,3vw,44px)] pt-[clamp(40px,5vw,72px)] text-center">
          <nav aria-label="Breadcrumb" className="flex gap-2 text-[12px] text-ink-soft">
            <Link href="/" className="text-ink-soft hover:text-ink">
              Home
            </Link>
            <span aria-hidden className="text-line-strong">
              /
            </span>
            <span aria-current="page">Collections</span>
          </nav>
          <h1 className="m-0 font-cormorant text-[clamp(42px,5vw,68px)] font-normal leading-none">Collections</h1>
          <p className="m-0 max-w-[52ch] text-[15px] leading-[1.7] text-ink-soft">
            Each collection begins with a single piece. Choose the one that speaks to you and discover the rest of its family.
          </p>
        </div>

        {!headerData ? (
          <div
            className="grid grid-cols-3 gap-x-[clamp(12px,1.6vw,24px)] gap-y-12 pb-24 lg:grid-cols-2"
            aria-busy="true"
            aria-label="Loading collections"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="grid gap-4">
                <div className="aspect-square animate-pulse bg-stone" />
                <div className="mx-auto h-6 w-1/2 animate-pulse bg-stone" />
              </div>
            ))}
          </div>
        ) : collections.length === 0 ? (
          <p className="pb-24 text-center text-ink-soft">
            New collections are on their way.{' '}
            <Link href="/all" className="text-teal underline underline-offset-[3px]">
              Browse all jewelry
            </Link>
            .
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-x-[clamp(12px,1.6vw,24px)] gap-y-[clamp(36px,4vw,56px)] pb-[clamp(64px,7vw,104px)] lg:grid-cols-2 md:gap-x-2.5 md:gap-y-8">
            {collections.map((c, i) => {
              const count = countOf(c);
              if (i % WIDE_EVERY === 0) {
                const flip = wideCount++ % 2 === 1;
                const [first, ...rest] = c.name.split(' ');
                return (
                  <Link
                    key={c.id}
                    href={hrefOf(c)}
                    className="group col-span-full grid grid-cols-2 overflow-hidden bg-[radial-gradient(120%_90%_at_30%_50%,theme(colors.teal.DEFAULT)_-40%,theme(colors.navy.DEFAULT)_45%,theme(colors.navy.deep)_100%)] text-noir-on hover:text-noir-on md:grid-cols-1"
                  >
                    <span className={`relative block aspect-[16/10] overflow-hidden ${flip ? 'order-2 md:order-none' : ''}`}>
                      <Stage c={c} dark />
                    </span>
                    <span className="grid content-center justify-items-center gap-3 p-[clamp(28px,4vw,64px)] text-center">
                      <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-teal-soft">
                        {count > 0 ? pieces(count) : 'Signature collection'}
                      </span>
                      <h2 className="m-0 font-cormorant text-[clamp(34px,3.4vw,52px)] font-normal leading-[1.05] text-paper">
                        {rest.length ? (
                          <>
                            {first} <em className="italic">{rest.join(' ')}</em>
                          </>
                        ) : (
                          <em className="italic">{c.name}</em>
                        )}
                      </h2>
                      {c.description && <p className="m-0 line-clamp-3 max-w-[38ch] text-[15px] leading-[1.7] text-noir-on/80">{c.description}</p>}
                      <ExploreLink light>Explore the collection</ExploreLink>
                    </span>
                  </Link>
                );
              }
              return (
                <Link key={c.id} href={hrefOf(c)} className="group grid content-start gap-[18px] text-center text-ink hover:text-ink">
                  <span className="relative block aspect-square overflow-hidden bg-stone">
                    <Stage c={c} className="mix-blend-multiply" />
                  </span>
                  <span className="grid justify-items-center gap-1.5">
                    <h2 className="m-0 font-cormorant text-[clamp(22px,1.8vw,27px)] font-medium leading-[1.15] md:text-[20px]">{c.name}</h2>
                    {c.description && <p className="m-0 line-clamp-1 max-w-[40ch] text-[13px] text-ink-soft md:hidden">{c.description}</p>}
                    <ExploreLink>Explore{count > 0 ? ` ${pieces(count)}` : ''}</ExploreLink>
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ExploreLink({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return (
    <span
      className={`relative mt-1 pb-1 text-[11px] font-semibold uppercase tracking-[0.18em] after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-[400ms] after:ease-luxe after:content-[''] group-hover:after:scale-x-100 ${
        light ? 'mt-2 text-paper' : 'text-teal'
      }`}
    >
      {children}
    </span>
  );
}
