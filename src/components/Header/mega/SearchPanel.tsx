'use client';

import React, { useEffect, useRef } from 'react';

import { LoadingOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

import { formatCurrency } from '@/utils/common';

import { POPULAR_SEARCHES } from './headerContent';
import { SearchIcon } from '../components/HeaderIcons';

interface Props {
  value: string;
  results: any[];
  loading: boolean;
  onSearch: (value: string) => void;
  /** Navigates to a result (existing Header handler: pushes the route and clears product state). */
  onPick: (href: string) => void;
  onClose: () => void;
}

const resultHref = (d: any) => {
  const slug = d?.jewelryDetails?.[0]?.sku_slug;
  const type = d?.jewelrySubType?.parent_code?.toLowerCase()?.replace('_', '-');
  return d?.is_customizable ? `/custom-jewelry?type=2&state=s&id=${slug}` : `/${type}/premade?slug=${slug}`;
};

/** Search panel opened from the header: a large serif field, popular searches, and live results. */
export default function SearchPanel({ value, results, loading, onSearch, onPick, onClose }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);

  const goToResults = (q: string) => {
    if (!q.trim()) {
      return;
    }
    onClose();
    router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const query = value.trim();
  const titleClass = 'm-0 mb-4 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-ink';

  return (
    <div className="mx-auto max-w-[1440px] animate-rise px-[clamp(16px,3.2vw,56px)] pb-10 pt-[34px]">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          goToResults(value);
        }}
        className="flex items-center gap-4 border-b border-ink pb-3"
      >
        <SearchIcon className="h-6 w-6 flex-none" />
        <label htmlFor="header-search" className="sr-only">
          Search
        </label>
        <input
          ref={inputRef}
          id="header-search"
          value={value}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search rings, diamonds, gifts"
          autoComplete="off"
          className="min-w-0 flex-1 border-0 bg-transparent p-0 font-cormorant text-[clamp(24px,3vw,36px)] text-ink outline-none placeholder:text-ink-soft/70 focus:ring-0"
        />
        {loading && query && <LoadingOutlined className="text-[16px] !text-ink-soft" spin />}
        <button type="button" onClick={onClose} className="text-[11px] uppercase tracking-[0.16em] text-ink-soft hover:text-ink">
          Close
        </button>
      </form>
      <p className="m-0 mt-2.5 min-h-[1.5em] text-[13px] text-ink-soft" aria-live="polite">
        {query && !loading && (results.length > 0 ? `Press Enter to see all results for “${query}”.` : `No pieces found for “${query}”.`)}
      </p>

      <div className="grid grid-cols-[minmax(0,260px)_minmax(0,1fr)] gap-[clamp(28px,4vw,64px)] pt-7 md:grid-cols-1">
        <div>
          <h3 className={titleClass}>Popular searches</h3>
          <div className="flex flex-wrap gap-2">
            {POPULAR_SEARCHES.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => goToResults(term)}
                className="inline-flex h-[34px] items-center border border-line px-3.5 text-[13px] text-ink-soft transition-colors hover:border-ink hover:text-ink"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
        {query && results.length > 0 && (
          <div>
            <h3 className={titleClass}>Pieces</h3>
            <div className="grid grid-cols-4 gap-3.5 md:grid-cols-2">
              {results.slice(0, 4).map((d: any) => {
                const href = resultHref(d);
                return (
                  <a
                    key={href}
                    href={href}
                    onClick={(e) => {
                      e.preventDefault();
                      onPick(href);
                    }}
                    className="group/res grid gap-2.5"
                  >
                    <span className="block overflow-hidden bg-stone">
                      <img
                        src={d?.jewelryDetails?.[0]?.carat_images?.[0] || '/images/no_images.svg'}
                        alt=""
                        loading="lazy"
                        className="aspect-square w-full object-cover mix-blend-multiply transition-transform duration-700 ease-luxe group-hover/res:scale-[1.04]"
                      />
                    </span>
                    <b className="line-clamp-2 text-[11.5px] font-medium uppercase leading-snug tracking-[0.12em]">{d?.fullTitle}</b>
                    <span className="text-[13px] tabular-nums text-ink-soft">{formatCurrency(d?.jewelryDetails?.[0]?.selling_price)}</span>
                  </a>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => goToResults(value)}
              className="mt-5 border-b border-ink pb-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-ink"
            >
              See all results
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
