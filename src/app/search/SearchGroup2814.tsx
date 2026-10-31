'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LuSearch, LuVideo } from 'react-icons/lu';

import { POPULAR_SEARCHES } from '@/components/Header/mega/headerContent';
import ProductProfile from '@/components/ProductProfile';
import { getJewelrySearch } from '@/services/productService';
import { useAppDispatch } from '@/store';
import { setSearchList, setSearchQuery } from '@/store/slices/SearchProduct/searchProductSlice';
import { trackSearch } from '@/utils/metaPixel';

// Search results (design-mockups/search): editable query, category tabs + sort worked out from the results, the PLP
// product card, and a "no results" state that keeps people moving (the API's suggestions, popular searches, a jeweler).

const SHELL = 'mx-auto w-full max-w-[1440px] px-[clamp(16px,3.2vw,48px)]';
const SORTS = [
  { value: 'best', label: 'Best match' },
  { value: 'low', label: 'Price, low to high' },
  { value: 'high', label: 'Price, high to low' },
];

const typeLabel = (code?: string) =>
  code
    ? code
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/^\w/, (c) => c.toUpperCase())
    : 'Other';

function toCard(item: any) {
  const images = item?.jewelryDetails?.[0]?.carat_images || [];
  const jewelryType = item?.jewelrySubType?.parent_code?.toLowerCase()?.replace('_', '-');
  const d = item?.jewelryDetails?.[0];
  return {
    estimated_delivery_days: item?.estimated_delivery_days,
    productImage: images[0] || '/images/no_images.svg',
    productHoverImage: images[1] || '/images/no_images.svg',
    is_customizable: item?.is_customizable,
    variation_to_show: item?.variation_to_show,
    variation_details: item?.variation_details,
    jewelryDetails: d,
    jewelryTypeData: jewelryType,
    productName: item?.fullTitle,
    // Yotpo keys reviews by this product-level code — the card's star rating needs it.
    code: item?.code,
    productPrice: Math.ceil(d?.selling_price),
    slug: item?.is_customizable ? d?.sku_slug : `${jewelryType}/premade?slug=${d?.sku_slug}`,
    sku_master_id: d?.id,
    jewelry_id: d?.jewelry_id,
    jewelry_type: item?.jewelrySubType?.parent_code,
    isWishlist: d?.wishlist_id,
    discount_type: d?.discount_type,
    discount_value: d?.discount_value == 0 ? null : d?.discount_value,
    discounted_price: d?.discounted_price,
    specialProductTitles: item?.specialProductTitles || [],
  };
}

const priceOf = (p: any) => Number(p?.discount_value ? p?.discounted_price : p?.productPrice) || 0;

// Wait this long after the user stops typing before searching, so we don't fire a
// request/navigation on every keystroke. Pressing Enter or the search icon still
// searches immediately.
const SEARCH_DEBOUNCE_MS = 500;
// Results are rendered in pages of this size as the user scrolls.
const PAGE_SIZE = 24;

export default function SearchGroup2814() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const q = useSearchParams()?.get('q')?.trim() ?? '';
  const [value, setValue] = useState(q);
  const [results, setResults] = useState<any[]>([]);
  const [suggested, setSuggested] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState('');
  const [sort, setSort] = useState('best');
  // The API returns the whole result set. Rendering all of it at once meant hundreds of
  // ProductProfile cards (each with its own swipers and images) before anything was usable,
  // so the grid grows as the user scrolls instead.
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Search as the user types, debounced. Skipped when the box is empty or already shows the
  // current query's results (e.g. on load, where the box is seeded from the URL).
  useEffect(() => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === q) {
      return undefined;
    }
    const timer = setTimeout(() => {
      router.replace(`/search?q=${encodeURIComponent(trimmed)}`);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value, q, router]);

  useEffect(() => {
    setValue(q);
    setType('');
    if (!q) {
      setResults([]);
      return;
    }
    let live = true;
    setLoading(true);
    getJewelrySearch(q)
      .then((res: any) => {
        if (!live) {
          return;
        }
        const data = res?.data?.data;
        const list = (data?.rows ?? []).map(toCard);
        setSuggested(!!data?.isSuggested);
        setResults(list);
        dispatch(setSearchList(list));
        dispatch(setSearchQuery(q));
        trackSearch({ search_string: q });
      })
      .catch(() => live && setResults([]))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [q, dispatch]);

  const go = (term: string) => {
    if (term.trim()) {
      router.push(`/search?q=${encodeURIComponent(term.trim())}`);
    }
  };

  const types = useMemo(() => {
    const m = new Map<string, number>();
    results.forEach((r) => m.set(r.jewelry_type ?? '', (m.get(r.jewelry_type ?? '') ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [results]);

  const shown = useMemo(() => {
    const list = type ? results.filter((r) => (r.jewelry_type ?? '') === type) : [...results];
    if (sort === 'low') {
      list.sort((a, b) => priceOf(a) - priceOf(b));
    }
    if (sort === 'high') {
      list.sort((a, b) => priceOf(b) - priceOf(a));
    }
    return list;
  }, [results, type, sort]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [q, type, sort]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel) {
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((current) => Math.min(current + PAGE_SIZE, shown.length));
        }
      },
      // Start loading before the sentinel is on screen so scrolling stays smooth.
      { rootMargin: '600px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
    // Deliberately not keyed on visibleCount: re-creating the observer on every growth made it
    // re-fire immediately and batch every increment into a single render. One observer stays
    // attached and fires again when the sentinel re-enters view.
  }, [shown.length, loading]);

  const noMatch = !!q && !loading && (suggested || results.length === 0);
  const chip =
    'inline-flex h-8 items-center border border-line-strong px-3 text-[13px] text-ink-soft transition-colors hover:border-ink hover:text-ink';

  const grid = (list: any[]) => (
    <div className="grid grid-cols-4 gap-x-4 gap-y-10 lg:grid-cols-3 md:grid-cols-2 md:gap-x-2.5 md:gap-y-7">
      {list.map((p, i) => (
        <ProductProfile key={`${p?.sku_master_id ?? p?.jewelry_id}-${i}`} {...p} isStatic layout="plp" />
      ))}
    </div>
  );

  return (
    <div className="bg-paper font-libre text-[14px] leading-[1.55] text-ink antialiased">
      <section className={`${SHELL} pb-5 pt-[clamp(28px,3.5vw,48px)]`}>
        <nav aria-label="Breadcrumb" className="mb-4 flex gap-2 text-[12px] text-ink-soft">
          <Link href="/" className="text-ink-soft hover:text-ink">
            Home
          </Link>
          <span aria-hidden className="text-line-strong">
            /
          </span>
          <span aria-current="page">Search</span>
        </nav>
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            go(value);
          }}
          className="flex max-w-[900px] items-center gap-4 border-b-[1.5px] border-ink pb-2.5"
        >
          <LuSearch className="h-[26px] w-[26px] flex-none" strokeWidth={1.3} />
          <label htmlFor="search-q" className="sr-only">
            Search
          </label>
          <input
            id="search-q"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Search rings, diamonds, gifts"
            autoComplete="off"
            className="min-w-0 flex-1 border-0 bg-transparent p-0 font-cormorant text-[clamp(32px,3.6vw,52px)] leading-[1.1] outline-none placeholder:text-ink-faint focus:ring-0"
          />
          {value && (
            <button type="button" onClick={() => setValue('')} className="text-[12px] uppercase tracking-[0.12em] text-ink-soft hover:text-ink">
              Clear
            </button>
          )}
        </form>

        {q && !loading && !noMatch && (
          <p className="m-0 mt-3.5 text-[14px] text-ink-soft">
            <b className="font-semibold text-ink">
              {results.length} {results.length === 1 ? 'piece' : 'pieces'}
            </b>{' '}
            for “{q}”
          </p>
        )}
        {(!q || noMatch === false) && (
          <div className="mt-[18px] flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[12.5px] text-ink-faint">{q ? 'Try also:' : 'Popular:'}</span>
            {POPULAR_SEARCHES.filter((t) => t.toLowerCase() !== q.toLowerCase()).map((t) => (
              <button key={t} type="button" onClick={() => go(t)} className={chip}>
                {t}
              </button>
            ))}
          </div>
        )}
      </section>

      {q && !noMatch && (
        <div className="sticky top-[var(--header-height,108px)] z-20 border-y border-line bg-paper">
          <div className={`${SHELL} flex min-h-14 items-center gap-6`}>
            <div role="toolbar" aria-label="Category" className="flex flex-1 gap-6 overflow-x-auto [scrollbar-width:none]">
              {[['', results.length] as [string, number], ...types].map(([t, n]) => (
                <button
                  key={t || 'all'}
                  type="button"
                  aria-pressed={type === t}
                  onClick={() => setType(t)}
                  className={`flex-none border-b-[1.5px] pb-[15px] pt-[17px] text-[13.5px] ${
                    type === t ? 'border-ink font-semibold text-ink' : 'border-transparent text-ink-soft hover:text-ink'
                  }`}
                >
                  {t ? typeLabel(t) : 'All'} <span className="text-[12.5px] font-normal text-ink-faint">{n}</span>
                </button>
              ))}
            </div>
            <label className="flex flex-none items-center gap-1.5 text-[13px] text-ink-soft">
              Sort:
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="cursor-pointer border-0 bg-transparent py-0 pl-0 pr-7 text-[13px] font-medium text-ink focus:ring-0"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}

      <div className={`${SHELL} pb-20`}>
        {loading ? (
          <div className="grid grid-cols-4 gap-x-4 gap-y-10 pt-7 lg:grid-cols-3 md:grid-cols-2" aria-busy="true" aria-label="Searching">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="grid gap-2.5">
                <div className="aspect-[4/5] animate-pulse bg-stone" />
                <div className="h-3 w-3/4 animate-pulse bg-stone" />
                <div className="h-3 w-1/3 animate-pulse bg-stone" />
              </div>
            ))}
          </div>
        ) : noMatch ? (
          <>
            <div className="grid grid-cols-2 gap-[clamp(28px,4vw,64px)] border-b border-line pb-12 pt-4 md:grid-cols-1">
              <div>
                <h2 className="m-0 mb-2.5 font-cormorant text-[34px] font-medium leading-[1.05]">No pieces match “{q}”</h2>
                <ul className="m-0 mt-3.5 grid gap-1.5 pl-[18px] text-ink-soft">
                  <li>Check the spelling, or try fewer words</li>
                  <li>Search by type: “studs”, “tennis bracelet”, “solitaire”</li>
                  <li>Try a metal or stone: “rose gold”, “sapphire”</li>
                </ul>
                <div className="mt-[22px] flex flex-wrap items-center gap-2">
                  <span className="mr-1 text-[12.5px] text-ink-faint">Popular:</span>
                  {POPULAR_SEARCHES.map((t) => (
                    <button key={t} type="button" onClick={() => go(t)} className={chip}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid content-start gap-2.5 bg-navy p-7 text-noir-on">
                <b className="font-cormorant text-[26px] font-medium text-paper">Can&apos;t find it?</b>
                <span className="text-noir-on/85">Describe what you&apos;re looking for and a jeweler will find it, or design it for you.</span>
                <Link
                  href="/contactpage"
                  className="mt-1.5 inline-flex h-[46px] items-center gap-2 justify-self-start bg-noir-on px-5 text-[12px] font-semibold uppercase tracking-[0.12em] text-navy hover:text-navy"
                >
                  <LuVideo className="h-4 w-4" strokeWidth={1.3} />
                  Ask a jeweler
                </Link>
              </div>
            </div>
            {results.length > 0 && (
              <>
                <h3 className="m-0 mb-4 mt-10 font-cormorant text-[28px] font-medium">You might like</h3>
                {grid(results.slice(0, 8))}
              </>
            )}
          </>
        ) : q ? (
          <div className="pt-7">
            {grid(shown.slice(0, visibleCount))}
            {visibleCount < shown.length && <div ref={loadMoreRef} className="h-8 w-full" />}
          </div>
        ) : null}
      </div>
    </div>
  );
}
