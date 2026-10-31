/* eslint-disable import/no-unresolved */
'use client';
import React, { useEffect, useRef, useState } from 'react';

import { useSearchParams } from 'next/navigation';
import { createPortal } from 'react-dom';

import { useAppSelector } from '@/store';
import themeColors from '@/styles/theme-colors';

// Yotpo's REST host — set per environment via NEXT_PUBLIC_YOTPO_API_URL.
const YOTPO_API_URL = process.env.NEXT_PUBLIC_YOTPO_API_URL;
const YOTPO_APP_KEY = process.env.NEXT_PUBLIC_YOTPO_APP_KEY;

interface YotpoReviewImage {
  id?: number;
  thumb_url?: string;
  original_url?: string;
}

interface YotpoApiReview {
  id: number;
  score: number;
  title?: string;
  content?: string;
  created_at?: string;
  verified_buyer?: boolean;
  votes_up?: number;
  votes_down?: number;
  user?: { display_name?: string };
  // Yotpo's internal numeric product id — used to tell reviews apart by product.
  product_id?: number;
  // Photos the reviewer uploaded (Yotpo returns these in `images_data`).
  images_data?: YotpoReviewImage[];
}

// Stars in ink, as in the product-page design.
const STAR_COLOR = themeColors.ink.DEFAULT;
const VERIFIED_COLOR = themeColors.ok;

// The Yotpo API returns HTML-encoded entities (e.g. &#x27; &amp;). Decode them for display.
const decodeHtml = (value = ''): string => {
  if (typeof document === 'undefined') {
    return value;
  }
  const el = document.createElement('textarea');
  el.innerHTML = value;
  return el.value;
};

// Formats an ISO date string as DD/MM/YY (e.g. 12/06/26).
const formatReviewDate = (iso?: string): string => {
  if (!iso) {
    return '';
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
};

const Stars = ({ score, size = 14 }: { score: number; size?: number }) => {
  const rounded = Math.round(score || 0);
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rounded} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width={size} height={size} viewBox="0 0 20 20" fill={n <= rounded ? STAR_COLOR : 'none'} stroke={STAR_COLOR} strokeWidth="1.5">
          <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.79L10 14.77l-5.2 2.73.99-5.79-4.21-4.1 5.82-.85z" />
        </svg>
      ))}
    </div>
  );
};

const VerifiedIcon = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill={VERIFIED_COLOR} aria-hidden="true">
    <circle cx="10" cy="10" r="10" />
    <path d="M6 10.5l2.5 2.5L14 7.5" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ThumbUpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 10v11H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3zm0 0l4-7a2 2 0 0 1 2 2v3h5a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 18.8 21H7" />
  </svg>
);

const ThumbDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 14V3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-3zm0 0l-4 7a2 2 0 0 1-2-2v-3H6a2 2 0 0 1-2-2.3l1.2-7A2 2 0 0 1 7.2 3H17" />
  </svg>
);

const REVIEWS_PER_PAGE = 6;
// On mobile the grid is a single column, so reveal fewer per step.
const MOBILE_PER_VIEW = 3;
// Store reviews are fetched a page at a time and accumulated; a page comfortably
// covers many "See more" clicks so we rarely need to hit the API again.
const STORE_REVIEWS_PER_PAGE = 60;

// How many reviews to reveal per "See more" step: 3 on mobile, 6 on larger
// screens (updates live on breakpoint change). Shared by both review sections.
const useReviewsPerView = (): number => {
  const [perView, setPerView] = useState<number>(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches ? MOBILE_PER_VIEW : REVIEWS_PER_PAGE,
  );
  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const mq = window.matchMedia('(max-width: 640px)');
    const update = () => setPerView(mq.matches ? MOBILE_PER_VIEW : REVIEWS_PER_PAGE);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return perView;
};

// Both the review title and the review body are clamped at a fixed CHARACTER
// count, with an inline "Read More" toggle revealing the rest — so a card with a
// long review stays the same height as its neighbours. The card is narrower on
// mobile, so each limit is lower there (same 640px breakpoint the card grid
// collapses to a single column at).
const TITLE_CLAMP_CHARS = 60;
const MOBILE_TITLE_CLAMP_CHARS = 40;
const CONTENT_CLAMP_CHARS = 200;
const MOBILE_CONTENT_CLAMP_CHARS = 150;

// Cut `text` at `limit` characters, backing up to the last word boundary so a
// word is never sliced in half.
const truncateAtChars = (text: string, limit: number): string => {
  const sliced = text.slice(0, limit);
  const lastSpace = sliced.lastIndexOf(' ');
  return (lastSpace > 0 ? sliced.slice(0, lastSpace) : sliced).trimEnd();
};

// The active character limit: the mobile one under 640px, the desktop one above
// (updates live on breakpoint change).
const useClampChars = (mobileLimit: number, desktopLimit: number): number => {
  const [limit, setLimit] = useState<number>(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches ? mobileLimit : desktopLimit,
  );
  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const mq = window.matchMedia('(max-width: 640px)');
    const update = () => setLimit(mq.matches ? mobileLimit : desktopLimit);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [mobileLimit, desktopLimit]);
  return limit;
};

// Text clamped to `limit` characters with a "Read More" / "Read Less" toggle.
// The expanded flag is this component's own state and every title/body renders
// its own instance, so expanding one never touches any other review.
const ClampedText = ({ text, limit, toggleClassName = '' }: { text: string; limit: number; toggleClassName?: string }) => {
  const [expanded, setExpanded] = useState(false);

  if (text.length <= limit) {
    return <>{text}</>;
  }

  return (
    <>
      {expanded ? `${text} ` : `${truncateAtChars(text, limit)}… `}
      <button
        type="button"
        onClick={(e) => {
          // The whole card is clickable (it opens the media modal) — keep the
          // toggle from opening it too.
          e.stopPropagation();
          setExpanded((v) => !v);
        }}
        className={`font-normal text-ink underline underline-offset-[3px] hover:text-ink-soft ${toggleClassName}`}
      >
        {expanded ? 'Read Less' : 'Read More'}
      </button>
    </>
  );
};

const ReviewTitle = ({ text }: { text: string }) => {
  const limit = useClampChars(MOBILE_TITLE_CLAMP_CHARS, TITLE_CLAMP_CHARS);
  return (
    <h4 className="m-0 font-cormorant text-[21px] font-medium leading-[1.2] text-ink">
      {/* The toggle keeps the body text size so it doesn't read as part of the bold title. */}
      <ClampedText text={text} limit={limit} toggleClassName="font-libre text-[13px]" />
    </h4>
  );
};

const ReviewContent = ({ text }: { text: string }) => {
  const limit = useClampChars(MOBILE_CONTENT_CLAMP_CHARS, CONTENT_CLAMP_CHARS);
  return (
    <p className="m-0 text-[14px] leading-[1.65] text-ink-soft">
      <ClampedText text={text} limit={limit} />
    </p>
  );
};

// A single review card — shared by the current-product and other-products grids
// so both sections use the exact same theme. Clicking the card opens the same
// media-gallery modal that Yotpo's native "Customer Reviews" section uses.
const ReviewCard = ({ review, onOpen }: { review: YotpoApiReview; onOpen?: (review: YotpoApiReview) => void }) => {
  const reviewImage = review.images_data?.find((img) => img?.original_url || img?.thumb_url);
  const reviewImageUrl = reviewImage?.original_url || reviewImage?.thumb_url;
  return (
    <div
      onClick={() => onOpen?.(review)}
      className={`flex h-full flex-col gap-3.5 border border-line bg-paper p-6 transition-colors sm:p-5 ${onOpen ? 'cursor-pointer hover:border-ink' : ''}`}
    >
      {reviewImageUrl && (
        <img src={reviewImageUrl} alt={review.title || 'Customer review'} loading="lazy" className="aspect-[16/9] w-full bg-stone object-cover" />
      )}
      <div className="flex items-center justify-between">
        <Stars score={review.score} />
        <span className="text-[11px] tabular-nums tracking-[0.12em] text-ink-faint">{formatReviewDate(review.created_at)}</span>
      </div>
      {review.title && <ReviewTitle text={decodeHtml(review.title)} />}
      {review.content && <ReviewContent text={decodeHtml(review.content)} />}
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-2 text-[12.5px]">
        <span className="font-medium text-ink">{review.user?.display_name || 'Anonymous'}</span>
        <span className="text-line-strong">|</span>
        <span className="inline-flex items-center gap-1.5 text-ok">
          <VerifiedIcon />
          Verified Reviewer
        </span>
      </div>
      <div className="flex items-center justify-end gap-4 border-t border-line pt-3 text-[12.5px] text-ink-soft">
        <span>Was this review helpful?</span>
        <span className="inline-flex items-center gap-1">
          <ThumbUpIcon />
          {review.votes_up ?? 0}
        </span>
        <span className="inline-flex items-center gap-1">
          <ThumbDownIcon />
          {review.votes_down ?? 0}
        </span>
      </div>
    </div>
  );
};

// The responsive card grid used by both review sections.
const ReviewsGrid = ({ reviews, onOpen }: { reviews: YotpoApiReview[]; onOpen?: (review: YotpoApiReview) => void }) => (
  <div className="grid grid-cols-3 gap-5 lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1">
    {reviews.map((review) => (
      <ReviewCard key={review.id} review={review} onOpen={onOpen} />
    ))}
  </div>
);

// The media-gallery modal — a pixel-for-pixel match of Yotpo's native
// "Customer Reviews" review modal (image carousel on the left, review details
// on the right), reused here so both sections open the identical modal.
const ModalCloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
    <path d="M14 1.41L12.59 0L7 5.59L1.41 0L0 1.41L5.59 7L0 12.59L1.41 14L7 8.41L12.59 14L14 12.59L8.41 7L14 1.41Z" />
  </svg>
);

const ModalArrowLeft = () => (
  <svg width="14" height="24" viewBox="0 0 14 24" fill="none" aria-hidden="true">
    <path
      d="M0.102089 12.6314C0.135431 12.8365 0.217636 13.0307 0.341784 13.1984L0.479658 13.3567L10.9003 23.5326C11.4184 24.0386 12.2523 24.0386 12.7704 23.5326C13.2381 23.0759 13.2901 22.3625 12.9263 21.8488L12.7704 21.6664L3.30687 12.4241L12.7705 3.17989C13.2381 2.72317 13.2901 2.00986 12.9263 1.49611L12.7705 1.31371C12.3099 0.863886 11.5998 0.813905 11.0838 1.16376L10.9003 1.3137L0.478875 11.4908C0.277712 11.6879 0.146515 11.942 0.102083 12.2153L0.0852891 12.4234L0.102089 12.6314Z"
      fill="#FFFFFF"
    />
  </svg>
);

const ModalArrowRight = () => (
  <svg width="14" height="24" viewBox="0 0 14 24" fill="none" aria-hidden="true">
    <path
      d="M13.1284 11.3686C13.095 11.1635 13.0128 10.9693 12.8887 10.8016L12.7508 10.6433L2.33019 0.467426C1.81202 -0.0386212 0.978192 -0.0386212 0.460021 0.467426C-0.00764275 0.924147 -0.0596054 1.63746 0.30414 2.15121L0.460031 2.33362L9.9236 11.5759L0.460021 20.8201C-0.00764275 21.2768 -0.0596053 21.9901 0.304133 22.5039L0.460021 22.6863C0.920618 23.1361 1.63062 23.1861 2.14664 22.8362L2.33018 22.6863L12.7516 12.5092C12.9528 12.312 13.084 12.058 13.1284 11.7847L13.1452 11.5766L13.1284 11.3686Z"
      fill="white"
    />
  </svg>
);

const ReviewMediaModal = ({ review, onClose }: { review: YotpoApiReview; onClose: () => void }) => {
  const images = (review.images_data ?? []).map((img) => img?.original_url || img?.thumb_url).filter((url): url is string => Boolean(url));
  const hasImages = images.length > 0;
  const [index, setIndex] = useState(0);

  // Lock body scroll while open; close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div onClick={onClose} role="dialog" aria-modal="true" className="fixed inset-0 z-[999999] flex items-center justify-center bg-ink/70 p-4">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[92vh] w-[1057px] max-w-[calc(100vw-32px)] overflow-y-auto bg-paper px-10 pb-10 pt-[56px] font-libre xls:w-[500px] xls:flex-col xls:px-5 xls:pb-6 xls:pt-14"
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center border border-line bg-paper text-ink transition-colors hover:border-ink"
        >
          <ModalCloseIcon />
        </button>

        {/* Left: media viewer (502x502 square, grey letterbox) */}
        <div className="relative flex h-[502px] w-[502px] shrink-0 items-center justify-center overflow-hidden bg-stone xls:h-auto xls:aspect-square xls:w-full">
          {hasImages && <img src={images[index]} alt={review.title || 'Customer review'} className="max-h-full max-w-full object-contain" />}
          {hasImages && (
            <>
              <button
                type="button"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                aria-label="Previous review media slide"
                className="absolute left-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-ink/60 transition-colors hover:bg-ink"
              >
                <ModalArrowLeft />
              </button>
              <button
                type="button"
                onClick={() => setIndex((i) => Math.min(images.length - 1, i + 1))}
                aria-label="Next review media slide"
                className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-ink/60 transition-colors hover:bg-ink"
              >
                <ModalArrowRight />
              </button>
            </>
          )}
        </div>

        {/* Right: review details (435px) */}
        <div className="ml-10 flex w-[435px] flex-col xls:ml-0 xls:mt-5 xls:w-full">
          <div className="flex items-start justify-between gap-4">
            <span className="text-[14px] font-medium text-ink">{review.user?.display_name || 'Anonymous'}</span>
            <span className="text-[11px] tabular-nums tracking-[0.12em] text-ink-faint">{formatReviewDate(review.created_at)}</span>
          </div>
          <div className="mt-5">
            <Stars score={review.score} size={16} />
          </div>
          {review.title && <h3 className="m-0 mt-3 font-cormorant text-[26px] font-medium leading-[1.15] text-ink">{decodeHtml(review.title)}</h3>}
          {hasImages && (
            <div className="mt-[18px] ml-0.5 flex flex-wrap gap-2">
              {images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Review image ${i + 1}`}
                  aria-pressed={i === index}
                  style={{ backgroundImage: `url(${src})` }}
                  className={`h-[82px] w-[82px] bg-stone bg-cover bg-center ${i === index ? 'outline outline-1 outline-offset-2 outline-ink' : ''}`}
                />
              ))}
            </div>
          )}
          {review.content && <p className="m-0 mt-[18px] text-[14px] leading-[1.65] text-ink-soft">{decodeHtml(review.content)}</p>}
        </div>
      </div>
    </div>,
    document.body,
  );
};

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </svg>
);

const ChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12l5 5L20 7" />
  </svg>
);

// Sliders icon for the mobile "Filters" button (matches the Yotpo mobile bar).
const FiltersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="8" x2="20" y2="8" />
    <line x1="4" y1="16" x2="20" y2="16" />
    <circle cx="9" cy="8" r="2.4" fill="currentColor" stroke="none" />
    <circle cx="15" cy="16" r="2.4" fill="currentColor" stroke="none" />
  </svg>
);

type SortKey = 'recent' | 'highest' | 'lowest' | 'helpful';

const SORT_LABELS: Record<SortKey, string> = {
  recent: 'Most recent',
  highest: 'Highest rating',
  lowest: 'Lowest rating',
  helpful: 'Most helpful',
};

interface ReviewFilterState {
  search: string;
  ratingFilter: number;
  withMedia: boolean;
  sortBy: SortKey;
}

// Apply the active search / rating / media filters, then sort — shared by both sections.
const applyReviewFilters = (reviews: YotpoApiReview[], { search, ratingFilter, withMedia, sortBy }: ReviewFilterState): YotpoApiReview[] =>
  reviews
    .filter((r) => {
      if (search.trim()) {
        const hay = `${r.title ?? ''} ${r.content ?? ''}`.toLowerCase();
        if (!hay.includes(search.trim().toLowerCase())) {
          return false;
        }
      }
      if (ratingFilter && Math.round(r.score || 0) !== ratingFilter) {
        return false;
      }
      if (withMedia && !(r.images_data && r.images_data.length > 0)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'highest') {
        return (b.score || 0) - (a.score || 0);
      }
      if (sortBy === 'lowest') {
        return (a.score || 0) - (b.score || 0);
      }
      if (sortBy === 'helpful') {
        return (b.votes_up ?? 0) - (a.votes_up ?? 0);
      }
      return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
    });

interface ReviewFiltersProps extends ReviewFilterState {
  setSearch: (v: string) => void;
  setRatingFilter: (v: number) => void;
  setWithMedia: (v: boolean) => void;
  setSortBy: (v: SortKey) => void;
}

// The Search / Rating / With media / Sort by control bar, shared by both sections.
const ReviewFilters = ({ search, setSearch, ratingFilter, setRatingFilter, withMedia, setWithMedia, sortBy, setSortBy }: ReviewFiltersProps) => {
  const [ratingOpen, setRatingOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  // Mobile only: Rating + With media collapse into a single "Filters" dropdown.
  const [filtersOpen, setFiltersOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close any open dropdown when clicking outside the filter bar.
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setRatingOpen(false);
        setSortOpen(false);
        setFiltersOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <div ref={containerRef} className="mb-6 flex flex-wrap items-center justify-between gap-3 font-libre">
      <div className="flex items-center gap-3 flex-wrap sm:w-full">
        {/* Search reviews — pill with a dark-green circular search button.
            On mobile it shrinks (flex-1, no min-width) so Search + Filters share one row. */}
        <div className="inline-flex h-[42px] min-w-[260px] items-center gap-2 border border-line-strong bg-paper pl-4 pr-1 focus-within:border-ink sm:min-w-0 sm:flex-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reviews"
            style={{ outline: 'none', boxShadow: 'none' }}
            className="w-full border-0 bg-transparent text-[13px] text-ink outline-none ring-0 placeholder:text-ink-faint focus:border-0 focus:outline-none focus:ring-0"
          />
          <span className="flex h-8 w-8 shrink-0 items-center justify-center text-ink-soft">
            <SearchIcon />
          </span>
        </div>
        {/* Filters — MOBILE ONLY: collapses Rating + With media into one dropdown,
            mirroring Yotpo's mobile "Customer Reviews" bar. Hidden on desktop. */}
        <div className="relative hidden sm:block">
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className="inline-flex h-[42px] items-center gap-2 border border-line-strong bg-paper px-4 text-[11px] uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink"
          >
            <FiltersIcon />
            Filters
          </button>
          {filtersOpen && (
            <div className="absolute left-0 z-20 mt-2 w-56 border border-line bg-paper p-2">
              <div className="px-3 pb-1 pt-1 text-[10.5px] uppercase tracking-[0.16em] text-ink-soft">Rating</div>
              {[0, 5, 4, 3, 2, 1].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRatingFilter(s)}
                  className={`block w-full px-3 py-2 text-left text-[13px] hover:bg-stone ${s === ratingFilter ? 'font-medium text-ink' : 'text-ink-soft'}`}
                >
                  {s === 0 ? 'All ratings' : `${s} star${s === 1 ? '' : 's'}`}
                </button>
              ))}
              <div className="mt-1 border-t border-line pt-1">
                <button
                  type="button"
                  onClick={() => setWithMedia(!withMedia)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-[13px] text-ink-soft hover:bg-stone"
                >
                  With media
                  <span
                    className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center border ${withMedia ? 'border-ink bg-ink' : 'border-line-strong bg-paper'}`}
                  >
                    {withMedia && <CheckIcon />}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
        {/* Rating — custom dropdown pill (no native <select>, so only one chevron shows). Desktop only. */}
        <div className="relative sm:hidden">
          <button
            type="button"
            onClick={() => setRatingOpen((v) => !v)}
            className="inline-flex h-[42px] items-center gap-2 border border-line-strong bg-paper pl-4 pr-3 text-[11px] uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink"
          >
            {ratingFilter ? `${ratingFilter} star${ratingFilter === 1 ? '' : 's'}` : 'Rating'}
            <ChevronDown />
          </button>
          {ratingOpen && (
            <div className="absolute left-0 z-10 mt-2 w-44 border border-line bg-paper py-1">
              {[0, 5, 4, 3, 2, 1].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setRatingFilter(s);
                    setRatingOpen(false);
                  }}
                  className={`block w-full px-4 py-2 text-left text-[13px] hover:bg-stone ${s === ratingFilter ? 'font-medium text-ink' : 'text-ink-soft'}`}
                >
                  {s === 0 ? 'All ratings' : `${s} star${s === 1 ? '' : 's'}`}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* With media — toggle pill with a green checkmark when active. Desktop only. */}
        <button
          type="button"
          onClick={() => setWithMedia(!withMedia)}
          className="inline-flex h-[42px] items-center gap-2.5 border border-line-strong bg-paper pl-4 pr-3 text-[11px] uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink sm:hidden"
        >
          With media
          <span
            className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center border ${withMedia ? 'border-ink bg-ink' : 'border-line-strong bg-paper'}`}
          >
            {withMedia && <CheckIcon />}
          </span>
        </button>
      </div>

      {/* Sort by — on mobile it wraps to its own line; ml-auto keeps it right-aligned. */}
      <div className="relative sm:ml-auto">
        <button
          type="button"
          onClick={() => setSortOpen((v) => !v)}
          className="inline-flex items-center gap-2 text-[13px] text-ink-soft hover:text-ink"
        >
          Sort by: <span className="font-medium text-ink">{SORT_LABELS[sortBy]}</span>
          <ChevronDown />
        </button>
        {sortOpen && (
          <div className="absolute right-0 z-10 mt-2 w-48 border border-line bg-paper py-1">
            {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setSortBy(key);
                  setSortOpen(false);
                }}
                className={`block w-full px-4 py-2 text-left text-[13px] hover:bg-stone ${key === sortBy ? 'font-medium text-ink' : 'text-ink-soft'}`}
              >
                {SORT_LABELS[key]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Fetch ALL of a product's reviews from the Yotpo API. Yotpo's widget itself
// only renders a capped page (~5) with no pagination control, and both the
// bottomline and pagination.total are unreliable/stale — so we page with a big
// per_page until a short page comes back (the real last page).
const fetchAllProductReviews = async (productCode: string): Promise<YotpoApiReview[]> => {
  const perPage = 100;
  const maxPages = 30; // safety cap (~3000 reviews)
  const all: YotpoApiReview[] = [];
  for (let page = 1; page <= maxPages; page += 1) {
    // eslint-disable-next-line no-await-in-loop
    const res = await fetch(
      `${YOTPO_API_URL}/v1/widget/${YOTPO_APP_KEY}/products/${encodeURIComponent(productCode)}/reviews.json?per_page=${perPage}&page=${page}`,
    );
    // eslint-disable-next-line no-await-in-loop
    const data = await res.json();
    const pageReviews: YotpoApiReview[] = data?.response?.reviews ?? [];
    all.push(...pageReviews);
    if (pageReviews.length < perPage) {
      break; // last page reached
    }
  }
  return all;
};

type ReviewTabKey = 'product' | 'all';

const REVIEW_TABS: { key: ReviewTabKey; label: string }[] = [
  { key: 'product', label: 'Product Reviews' },
  { key: 'all', label: 'All Product Reviews' },
];

interface ReviewTabsProps {
  activeTab: ReviewTabKey;
  onTabChange: (tab: ReviewTabKey) => void;
  // Total review count per tab, shown next to each label. Counts arrive after
  // their fetches resolve, so a 0 means "not loaded yet" and stays hidden.
  counts: Record<ReviewTabKey, number>;
}

// Tab switcher between this product's reviews and the whole store's — same
// presentation as Yotpo's SEO widget ("Site Reviews / Product Reviews"): plain
// labels, the active one underlined, sitting on a full-width hairline. Rendered
// by BOTH sections (directly above their card grid), so it appears once — in
// whichever section is currently visible.
const ReviewTabs = ({ activeTab, onTabChange, counts }: ReviewTabsProps) => (
  <div role="tablist" className="mb-6 flex items-center gap-8 border-b border-line sm:mb-4 sm:gap-6">
    {REVIEW_TABS.map((tab) => (
      <button
        key={tab.key}
        type="button"
        role="tab"
        onClick={() => onTabChange(tab.key)}
        aria-selected={activeTab === tab.key}
        className={`-mb-px border-b pb-3.5 font-libre text-[11px] uppercase leading-none tracking-[0.16em] transition-colors ${
          activeTab === tab.key ? 'border-ink font-medium text-ink' : 'border-transparent font-normal text-ink-soft hover:text-ink'
        }`}
      >
        {tab.label}
        {counts[tab.key] > 0 && ` (${counts[tab.key].toLocaleString()})`}
      </button>
    ))}
  </div>
);

// Fetch ALL of the current product's reviews once. Both the summary header and
// the "Product Reviews" grid read from this single call (they used to each page
// through the same API).
const useAllProductReviews = (productCode?: string) => {
  const [reviews, setReviews] = useState<YotpoApiReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!YOTPO_APP_KEY || !productCode) {
      setReviews([]);
      setLoading(false);
      return undefined;
    }
    let active = true;
    setLoading(true);
    setReviews([]);
    fetchAllProductReviews(productCode)
      .then((all) => {
        if (active) {
          setReviews(all);
        }
      })
      .catch(() => {
        /* keep whatever loaded */
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [productCode]);

  return { reviews, loading };
};

/**
 * "Customer Reviews" — the native Yotpo widget. When the product has reviews we
 * keep its summary header (breakdown, average, "Write A Review") and hide its
 * own filter/card list. When it has none, Yotpo's empty state STAYS in the
 * widget (native layout/styles). ReviewTabs are portaled in above that empty
 * block (see ReviewTabsInYotpoWidget).
 */
const ProductSummaryHeader = ({
  productCode,
  productName,
  total,
  hideEmptyContent,
}: {
  productCode?: string;
  productName?: string;
  total: number;
  hideEmptyContent?: boolean;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // The native header's "Based on N reviews" bottomline is often stale (reports a
  // page count, not the real total). Correct it to our real fetched count — only
  // ever increasing, so a correct native count is never reduced.
  useEffect(() => {
    const root = containerRef.current;
    if (!root || !total) {
      return undefined;
    }
    let raf = 0;
    const apply = () => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node: Node | null = walker.nextNode();
      while (node) {
        const text = node.nodeValue ?? '';
        const match = text.match(/Based on\s+(\d[\d,]*)\s+reviews?/i);
        if (match && total > parseInt(match[1].replace(/,/g, ''), 10)) {
          const label = `Based on ${total} review${total === 1 ? '' : 's'}`;
          const next = text.replace(/Based on\s+\d[\d,]*\s+reviews?/i, label);
          if (next !== text) {
            node.nodeValue = next;
          }
        }
        node = walker.nextNode();
      }
    };
    apply();
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(apply);
    });
    observer.observe(root, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [total, productCode]);

  return (
    <div className="product-reviews-section w-full">
      {/* Native widget — empty state stays here so Yotpo's own design applies.
          Tabs are portaled in above .yotpo-empty-state when the product tab is open. */}
      <div ref={containerRef} className={`product-reviews-native${hideEmptyContent ? ' product-reviews-native--hide-empty' : ''}`}>
        <div
          // Remount per product so Yotpo re-initializes (ratings API re-fires) on navigation.
          key={productCode}
          className="yotpo-widget-instance"
          data-yotpo-instance-id={process.env.NEXT_PUBLIC_YOTPO_APP_INSTANCE_ID}
          data-yotpo-product-id={productCode}
          data-yotpo-name={productName}
          data-yotpo-url={typeof window !== 'undefined' ? window.location.href : ''}
        ></div>
      </div>
    </div>
  );
};

const TABS_MOUNT_CLASS = 'product-reviews-tabs-mount';

// Inserts Product Reviews / All Product Reviews tabs inside the native Yotpo
// widget, immediately above `.yotpo-empty-state`. The empty UI is never moved,
// so Yotpo keeps its centered layout and white button text.
const ReviewTabsInYotpoWidget = ({ children }: { children: React.ReactNode }) => {
  const [mountNode, setMountNode] = useState<Element | null>(null);

  useEffect(() => {
    let cancelled = false;

    const place = () => {
      const widget = document.querySelector('.product-reviews-native .yotpo-widget-instance');
      const empty = widget?.querySelector('.yotpo-empty-state');
      if (!widget || !empty?.parentNode) {
        return;
      }

      let mount = widget.querySelector(`.${TABS_MOUNT_CLASS}`);
      if (!mount) {
        mount = document.createElement('div');
        mount.className = TABS_MOUNT_CLASS;
      }
      if (mount.nextElementSibling !== empty) {
        empty.parentNode.insertBefore(mount, empty);
      }
      if (!cancelled) {
        setMountNode((prev) => (prev === mount ? prev : mount));
      }
    };

    place();
    const section = document.querySelector('.product-reviews-section');
    const observer = new MutationObserver(place);
    if (section) {
      observer.observe(section, { childList: true, subtree: true });
    }

    return () => {
      cancelled = true;
      observer.disconnect();
      document.querySelector(`.${TABS_MOUNT_CLASS}`)?.remove();
    };
  }, []);

  if (!mountNode) {
    return null;
  }
  return createPortal(children, mountNode);
};

/**
 * "Product Reviews" tab — ALL of the CURRENT product's reviews, in our own cards
 * with 6-at-a-time paging (the native widget shows only ~5 with no pagination).
 * The reviews are fetched by the parent and shared with the summary header above.
 */
const ProductReviews = ({
  productCode,
  reviews,
  loading,
  activeTab,
  onTabChange,
  counts,
}: { productCode?: string; reviews: YotpoApiReview[]; loading: boolean } & ReviewTabsProps) => {
  const perView = useReviewsPerView();
  const [visibleCount, setVisibleCount] = useState(perView);

  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState(0);
  const [withMedia, setWithMedia] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('recent');
  const [activeReview, setActiveReview] = useState<YotpoApiReview | null>(null);

  // Reset to the first page on product change or when the per-step size changes
  // (mobile/desktop breakpoint).
  useEffect(() => {
    setVisibleCount(perView);
  }, [productCode, perView]);

  const filtered = applyReviewFilters(reviews, { search, ratingFilter, withMedia, sortBy });
  const visibleReviews = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;
  const hasReviews = reviews.length > 0;

  if (!hasReviews) {
    if (loading || activeTab !== 'product') {
      return null;
    }
    return (
      <ReviewTabsInYotpoWidget>
        <ReviewTabs activeTab={activeTab} onTabChange={onTabChange} counts={counts} />
      </ReviewTabsInYotpoWidget>
    );
  }

  return (
    <div className="mt-8 w-full sm:mt-6">
      <ReviewFilters
        search={search}
        setSearch={setSearch}
        ratingFilter={ratingFilter}
        setRatingFilter={setRatingFilter}
        withMedia={withMedia}
        setWithMedia={setWithMedia}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />
      {/* Tabs sit under the summary + filter bar, directly above the cards. */}
      <ReviewTabs activeTab={activeTab} onTabChange={onTabChange} counts={counts} />
      {visibleReviews.length > 0 ? (
        <ReviewsGrid reviews={visibleReviews} onOpen={setActiveReview} />
      ) : (
        <p className="m-0 py-10 text-center text-[14px] text-ink-soft">No reviews match your filters.</p>
      )}

      {activeReview && <ReviewMediaModal review={activeReview} onClose={() => setActiveReview(null)} />}

      {hasMore && (
        <div className="mt-10 flex justify-center sm:mt-6">
          <button
            type="button"
            onClick={() => setVisibleCount((c) => c + perView)}
            disabled={loading}
            className="inline-flex h-12 items-center gap-2 border border-ink bg-paper px-8 text-[11px] font-medium uppercase tracking-[0.18em] text-ink transition-colors hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:opacity-50"
          >
            See more reviews
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * "More reviews from our customers" — reviews from OTHER products (the current
 * product is filtered out, since it has its own section above).
 */
const OtherProductsReviews = ({
  productCode,
  activeTab,
  onTabChange,
  counts,
  onTotalChange,
}: { productCode?: string; onTotalChange: (total: number) => void } & ReviewTabsProps) => {
  // The current product's own reviews — fetched only so we can exclude them here
  // (the native Yotpo widget above already shows them).
  const [productReviews, setProductReviews] = useState<YotpoApiReview[]>([]);
  // Pool of store reviews fetched so far (accumulated across pages).
  const [reviews, setReviews] = useState<YotpoApiReview[]>([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false); // subsequent "See more" pages (button only)
  // Reveal 3 reviews at a time on mobile, 6 on larger screens (initial + per
  // "See more"), matching the "Customer Reviews" section above.
  const perView = useReviewsPerView();
  const [visibleCount, setVisibleCount] = useState(perView);

  // Filter + sort controls.
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState(0);
  const [withMedia, setWithMedia] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('recent');

  // The review whose media-gallery modal is currently open (null = closed).
  const [activeReview, setActiveReview] = useState<YotpoApiReview | null>(null);

  // Reset the visible count when the per-step size changes (breakpoint).
  useEffect(() => {
    setVisibleCount(perView);
  }, [perView]);

  // Fetch the CURRENT product's reviews so we can exclude them from this grid.
  useEffect(() => {
    setProductReviews([]);
    if (!YOTPO_APP_KEY || !productCode) {
      return;
    }
    let active = true;
    const fetchProductReviews = async () => {
      try {
        const res = await fetch(
          `${YOTPO_API_URL}/v1/widget/${YOTPO_APP_KEY}/products/${encodeURIComponent(productCode)}/reviews.json?per_page=50&page=1`,
        );
        const data = await res.json();
        const pageReviews: YotpoApiReview[] = data?.response?.reviews ?? [];
        const filtered = pageReviews.filter((r) => (r?.content ?? '').trim().length > 0);
        if (active) {
          setProductReviews(filtered);
        }
      } catch {
        // Non-fatal: the product's reviews simply won't be excluded.
      }
    };
    fetchProductReviews();
    return () => {
      active = false;
    };
  }, [productCode]);

  // Fetch ONLY the first page of store reviews, once per product. "See more"
  // reveals already-loaded reviews without re-fetching; the next page is fetched
  // lazily (via loadMore) only when the loaded set runs out — and that shows a
  // loader on the button only, so the section never re-enters a loading state.
  useEffect(() => {
    if (!YOTPO_APP_KEY) {
      return undefined;
    }
    let active = true;
    setReviews([]);
    setPage(1);
    const fetchFirstPage = async () => {
      try {
        const res = await fetch(`${YOTPO_API_URL}/v1/widget/${YOTPO_APP_KEY}/reviews?page=1&per_page=${STORE_REVIEWS_PER_PAGE}`);
        const data = await res.json();
        const pageReviews: YotpoApiReview[] = (data?.response?.reviews ?? []).filter((r: YotpoApiReview) => (r?.content ?? '').trim().length > 0);
        if (active) {
          const total = data?.response?.pagination?.total ?? 0;
          setReviews(pageReviews);
          setTotalReviews(total);
          // Lift the store-wide total so the tab bar (rendered by both
          // sections) can label this tab with it.
          onTotalChange(total);
        }
      } catch {
        // Keep whatever is already loaded on error.
      }
    };
    fetchFirstPage();
    return () => {
      active = false;
    };
  }, [productCode, onTotalChange]);

  // Fetch the NEXT page of store reviews and append it (used by "See more" only
  // when the currently-loaded set is exhausted). Shows a loader on the button.
  const loadMore = () => {
    if (loadingMore || !YOTPO_APP_KEY || reviews.length >= totalReviews) {
      return;
    }
    const nextPage = page + 1;
    setLoadingMore(true);
    fetch(`${YOTPO_API_URL}/v1/widget/${YOTPO_APP_KEY}/reviews?page=${nextPage}&per_page=${STORE_REVIEWS_PER_PAGE}`)
      .then((res) => res.json())
      .then((data) => {
        const more: YotpoApiReview[] = (data?.response?.reviews ?? []).filter((r: YotpoApiReview) => (r?.content ?? '').trim().length > 0);
        setReviews((prev) => [...prev, ...more]);
        setPage(nextPage);
      })
      .catch(() => {
        /* keep loaded */
      })
      .finally(() => setLoadingMore(false));
  };

  // Exclude the CURRENT product's reviews (the native widget already shows them).
  // Match both by the current product's numeric id and by the fetched review ids.
  const currentProductId = productReviews.find((r) => r.product_id != null)?.product_id;
  const productReviewIds = new Set(productReviews.map((r) => r.id));
  const otherReviews = reviews.filter((r) => (currentProductId == null || r.product_id !== currentProductId) && !productReviewIds.has(r.id));

  // No other-product reviews (or still loading): drop the filters/cards but keep
  // the tab bar, so this tab never renders as a dead end.
  if (otherReviews.length === 0) {
    return (
      <div className="mt-8 w-full sm:mt-6">
        <ReviewTabs activeTab={activeTab} onTabChange={onTabChange} counts={counts} />
      </div>
    );
  }

  // Apply the active filters, then show a full-row count. More remain if the
  // filtered set exceeds what we show or the store still has un-fetched reviews.
  const filteredOther = applyReviewFilters(otherReviews, { search, ratingFilter, withMedia, sortBy });
  const visibleReviews = filteredOther.slice(0, visibleCount);
  const hasMore = filteredOther.length > visibleCount || reviews.length < totalReviews;

  // "See more": reveal the next `perView` from already-loaded reviews (instant,
  // no fetch/loader). Only fetch the next page when we've revealed everything
  // loaded and the store still has more.
  const handleSeeMore = () => {
    const next = visibleCount + perView;
    setVisibleCount(next);
    if (next >= filteredOther.length && reviews.length < totalReviews) {
      loadMore();
    }
  };

  return (
    <div className="mt-8 w-full sm:mt-6">
      {/* No section heading here — the "All Product Reviews" tab above names this section. */}
      <ReviewFilters
        search={search}
        setSearch={setSearch}
        ratingFilter={ratingFilter}
        setRatingFilter={setRatingFilter}
        withMedia={withMedia}
        setWithMedia={setWithMedia}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />
      {/* Tabs sit under the filter bar, directly above the cards. */}
      <ReviewTabs activeTab={activeTab} onTabChange={onTabChange} counts={counts} />
      {visibleReviews.length > 0 ? (
        <ReviewsGrid reviews={visibleReviews} onOpen={setActiveReview} />
      ) : (
        <p className="m-0 py-10 text-center text-[14px] text-ink-soft">No reviews match your filters.</p>
      )}

      {activeReview && <ReviewMediaModal review={activeReview} onClose={() => setActiveReview(null)} />}

      {hasMore && (
        <div className="mt-10 flex justify-center sm:mt-6">
          <button
            type="button"
            onClick={handleSeeMore}
            disabled={loadingMore}
            className="inline-flex h-12 items-center gap-2 border border-ink bg-paper px-8 text-[11px] font-medium uppercase tracking-[0.18em] text-ink transition-colors hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingMore ? 'Loading…' : 'See more reviews'}
            {!loadingMore && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

// Yotpo's "SEO Page" widget (Site Reviews / Product Reviews tabs). Kept here,
// commented out, as an alternative to the two custom sections above — the PDP
// currently renders the custom "Customer Reviews" + "What our customers say"
// sections instead. To switch back: uncomment this component (and the
// `useYotpoReviewReadMore` import below) and render it from <YotpoReview />.
//
// import useYotpoReviewReadMore from '@/hook/useYotpoReviewReadMore';
//
// const YotpoSeoPageWidget = ({ productCode, productName }: { productCode?: string; productName?: string }) => {
//   const instanceId = process.env.NEXT_PUBLIC_YOTPO_SEO_PAGE_INSTANCE_ID;
//   const sectionRef = useRef<HTMLDivElement>(null);
//
//   // Clamp long reviews (both tabs) to 100 words behind a "Read More" toggle.
//   useYotpoReviewReadMore(sectionRef);
//
//   if (!instanceId) {
//     return null;
//   }
//
//   return (
//     <div ref={sectionRef} className="yotpo-seo-page-section container-xs 2xl:px-[30px] xl:px-20 lg:px-20 md:px-5 sm:px-3">
//       <div
//         key={productCode}
//         className="yotpo-widget-instance"
//         data-yotpo-instance-id={instanceId}
//         data-yotpo-product-id={productCode}
//         data-yotpo-name={productName}
//         data-yotpo-url={typeof window !== 'undefined' ? window.location.href : ''}
//       ></div>
//     </div>
//   );
// };

const YotpoReview = () => {
  const selectedProduct = useAppSelector((state) => state.products?.selectedProduct?.product_details);
  // Which review list is showing. Both stay mounted (the inactive one is only
  // hidden) so switching tabs never re-fetches or resets filters/paging. Each
  // section renders the tab bar itself, under its summary + filter bar.
  const [activeTab, setActiveTab] = useState<ReviewTabKey>('product');
  // Store-wide review total, reported up by the "All Product Reviews" section
  // (it's the one that fetches the store feed) so the tab bar can label it.
  const [storeTotal, setStoreTotal] = useState(0);

  // Yotpo stores/keys reviews by the product-level `code` (its domain_key), not the per-variant sku_slug.
  const productId = selectedProduct?.code;
  // Fetched here (not in ProductReviews) so the summary header can use the count
  // for its "Based on N reviews" correction without fetching the same pages twice.
  const { reviews: productReviews, loading } = useAllProductReviews(productId);

  // Counts shown next to each tab label: this product's real review count and
  // the store-wide total.
  const tabCounts: Record<ReviewTabKey, number> = { product: productReviews.length, all: storeTotal };

  if (!selectedProduct) {
    return null;
  }

  return (
    <div className="flex w-full flex-col font-libre">
      {/* "Customer Reviews" summary — outside the tabs, so the breakdown, average
          and "Write A Review" stay visible on BOTH tabs. */}
      <ProductSummaryHeader
        productCode={productId}
        productName={selectedProduct.fullTitle}
        total={productReviews.length}
        hideEmptyContent={productReviews.length === 0 && activeTab !== 'product'}
      />

      {/* Current product's reviews — custom cards + filters. */}
      <div className={activeTab === 'product' ? '' : 'hidden'}>
        <ProductReviews
          productCode={productId}
          reviews={productReviews}
          loading={loading}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={tabCounts}
        />
      </div>

      {/* Reviews from OTHER products — same custom card theme. */}
      <div className={activeTab === 'all' ? '' : 'hidden'}>
        <OtherProductsReviews
          productCode={productId}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={tabCounts}
          onTotalChange={setStoreTotal}
        />
      </div>
    </div>
  );
};

export default YotpoReview;

export const YotpoStarReview = ({ selectedProduct }: any) => {
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  // Real review count from the API — Yotpo's star widget shows a stale count
  // (e.g. "(4)" when the product actually has 59); we correct it to this.
  // `null` = not loaded yet, so the star line stays hidden until we know whether
  // the product has any reviews at all (Yotpo would otherwise render an empty
  // 5-star row with "(0)" on a product nobody has reviewed).
  const [realCount, setRealCount] = useState<number | null>(null);
  // Count Yotpo's own widget rendered, read back off the DOM. Only used as a
  // fallback when our count fetch fails, so a REST hiccup can't hide the stars
  // on a product that genuinely has reviews.
  const [widgetCount, setWidgetCount] = useState(0);
  const [countFailed, setCountFailed] = useState(false);
  let slug = searchParams?.get('slug');
  const decodedSlug = slug ?? searchParams?.get('id');
  slug = decodeURIComponent(decodedSlug ?? '');

  // Fetch the true review count for this product (same source the reviews
  // section uses), so the star line matches the "Based on N reviews" total.
  useEffect(() => {
    const code = selectedProduct?.code;
    setRealCount(null);
    setWidgetCount(0);
    setCountFailed(false);
    if (!YOTPO_APP_KEY || !code) {
      // Nothing to check against — fall back to whatever the widget itself shows.
      setCountFailed(true);
      return undefined;
    }
    let active = true;
    fetchAllProductReviews(code)
      .then((all) => {
        if (active) {
          setRealCount(all.length);
        }
      })
      .catch(() => {
        /* leave the widget's own count */
        if (active) {
          setCountFailed(true);
        }
      });
    return () => {
      active = false;
    };
  }, [selectedProduct?.code]);

  // Yotpo renders the star bottom line as "X Reviews". We show only the count in
  // brackets, e.g. "(59)", correcting Yotpo's stale number to the real count.
  // The widget is injected/refreshed by Yotpo's script, so watch for DOM changes
  // and rewrite (re-runs when realCount loads).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return undefined;
    }
    const format = () => {
      const c = realCount ?? 0;
      // Highest count the widget rendered itself — the fallback for deciding
      // whether this product has reviews when our own fetch didn't answer.
      let own = 0;
      const noteOwn = (num: string) => {
        own = Math.max(own, parseInt(num.replace(/,/g, ''), 10) || 0);
      };
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let node: Node | null = walker.nextNode();
      while (node) {
        const text = node.nodeValue ?? '';
        // "N reviews" -> "(realCount)" (only ever increasing the shown number).
        let next = text.replace(/(\d[\d,]*)\s*reviews?/gi, (_match, num) => {
          const shown = parseInt(num.replace(/,/g, ''), 10);
          noteOwn(num);
          return `(${c && c > shown ? c : shown})`;
        });
        next = next.replace(/\((\d[\d,]*)\)/g, (match, num) => {
          const shown = parseInt(num.replace(/,/g, ''), 10);
          noteOwn(num);
          // Also bump an already-bracketed count once realCount has loaded.
          return c > shown ? `(${c})` : match;
        });
        if (next !== text) {
          node.nodeValue = next;
        }
        node = walker.nextNode();
      }
      setWidgetCount((prev) => (own > prev ? own : prev));
    };
    format();
    const observer = new MutationObserver(format);
    observer.observe(el, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [selectedProduct, realCount]);

  if (!selectedProduct) {
    return null;
  }

  // A product with no reviews gets no star line at all. The widget still has to
  // stay mounted (hidden) rather than be conditionally rendered: Yotpo only
  // renders into containers that exist when its loader initialises widgets, and
  // it's the widget's own markup we read the fallback count from.
  const hasReviews = realCount !== null ? realCount > 0 : countFailed && widgetCount > 0;

  return (
    <div ref={containerRef} className="yotpo-star-line" style={hasReviews ? undefined : { display: 'none' }}>
      <div
        // Remount per product so Yotpo re-initializes and re-fetches the rating.
        key={selectedProduct.code}
        className="yotpo-widget-instance"
        data-yotpo-instance-id={process.env.NEXT_PUBLIC_YOTPO_APP_INSTANCE_STAR_ID}
        data-yotpo-product-id={selectedProduct.code}
      ></div>
    </div>
  );
};
