'use client';
import { useEffect, useState } from 'react';

// Yotpo's REST host — set per environment via NEXT_PUBLIC_YOTPO_API_URL.
const YOTPO_API_URL = process.env.NEXT_PUBLIC_YOTPO_API_URL;
const YOTPO_APP_KEY = process.env.NEXT_PUBLIC_YOTPO_APP_KEY;
const STAR_COLOR = '#EE7B2E';

interface Bottomline {
  score: number;
  total: number;
}

// A grid can mount dozens of cards at once and the same product reappears across
// listing/search/wishlist pages, so each product's bottomline is fetched once per
// session and concurrent requests for the same code share a single fetch.
const bottomlineCache = new Map<string, Bottomline>();
const inFlightRequests = new Map<string, Promise<Bottomline>>();

// Yotpo's per-product bottomline (average score + review count) is a public,
// tokenless endpoint — much cheaper here than mounting a star widget per card.
const fetchBottomline = (code: string): Promise<Bottomline> => {
  const cached = bottomlineCache.get(code);
  if (cached) {
    return Promise.resolve(cached);
  }
  const pending = inFlightRequests.get(code);
  if (pending) {
    return pending;
  }
  const request = fetch(`${YOTPO_API_URL}/products/${YOTPO_APP_KEY}/${encodeURIComponent(code)}/bottomline`)
    .then((res) => res.json())
    .then((data) => {
      const bottomline: Bottomline = {
        score: Number(data?.response?.bottomline?.average_score) || 0,
        total: Number(data?.response?.bottomline?.total_reviews) || 0,
      };
      bottomlineCache.set(code, bottomline);
      return bottomline;
    })
    // Failures are deliberately not cached, so a later mount can retry.
    .catch(() => ({ score: 0, total: 0 }))
    .finally(() => inFlightRequests.delete(code));

  inFlightRequests.set(code, request);
  return request;
};

const STAR_GAP = 1;
const STAR_PATH = 'M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.79L10 14.77l-5.2 2.73.99-5.79-4.21-4.1 5.82-.85z';

// Five outlined stars with a filled copy clipped to the average score, so a 4.6
// shows as four and a bit stars rather than being rounded to a whole one.
const Stars = ({ score, size }: { score: number; size: number }) => {
  const rowWidth = size * 5 + STAR_GAP * 4;
  const filledPercent = (Math.max(0, Math.min(5, score)) / 5) * 100;

  const row = (fill: string) => (
    <span className="flex" style={{ width: rowWidth, gap: STAR_GAP }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 20 20" fill={fill} stroke={STAR_COLOR} strokeWidth="1.5">
          <path d={STAR_PATH} />
        </svg>
      ))}
    </span>
  );

  return (
    <span className="relative inline-block shrink-0" style={{ width: rowWidth, height: size }} aria-hidden="true">
      {row('none')}
      <span className="absolute left-0 top-0 overflow-hidden" style={{ width: `${filledPercent}%` }}>
        {row(STAR_COLOR)}
      </span>
    </span>
  );
};

interface Props {
  /** Yotpo keys reviews by the product-level `code` (its domain_key), not the per-variant sku_slug. */
  code?: string;
  size?: number;
  className?: string;
}

/**
 * Compact star rating for a product card. Renders nothing until the product's
 * bottomline loads, and stays hidden for products with no reviews yet.
 */
const ProductRating = ({ code, size = 12, className = '' }: Props) => {
  const [bottomline, setBottomline] = useState<Bottomline | null>(null);

  useEffect(() => {
    if (!YOTPO_APP_KEY || !code) {
      setBottomline(null);
      return undefined;
    }
    let active = true;
    fetchBottomline(code).then((result) => {
      if (active) {
        setBottomline(result);
      }
    });
    return () => {
      active = false;
    };
  }, [code]);

  if (!bottomline?.total) {
    return null;
  }

  const label = `${bottomline.score.toFixed(1)} out of 5 stars, ${bottomline.total} review${bottomline.total === 1 ? '' : 's'}`;

  return (
    <span className={`flex shrink-0 items-center gap-1 leading-none ${className}`} title={label} aria-label={label}>
      <Stars score={bottomline.score} size={size} />
      <span className="text-[11px] text-gray-500 sm:text-[10px]">({bottomline.total})</span>
    </span>
  );
};

export default ProductRating;
