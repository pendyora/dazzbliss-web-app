'use client';

import React, { useEffect, useState } from 'react';

import YotpoBadge from '@/components/YotpoBadge';

// Yotpo's REST host — set per environment via NEXT_PUBLIC_YOTPO_API_URL.
const YOTPO_API_URL = process.env.NEXT_PUBLIC_YOTPO_API_URL;
const YOTPO_APP_KEY = process.env.NEXT_PUBLIC_YOTPO_APP_KEY;

// Same star SVG as YotpoBadge (see the comment there on why: Yotpo's icon
// font doesn't reliably load, so we draw our own instead of depending on it).
const STAR_PATH_D = 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z';

function StarRow({ size }: { size: number }) {
  return (
    <div className="flex items-center gap-0.5 text-ink">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
          <path d={STAR_PATH_D} />
        </svg>
      ))}
    </div>
  );
}

type Props = {
  className?: string;
};

// A hairline trust strip — stars + "Rated x/5 | n Certified Reviews" centred
// between two rules — for high-intent pages (checkout).
//
// Both numbers are live, never hardcoded, so they can't drift from what the
// site's other Yotpo surfaces show:
//   * the count comes off the Yotpo Badges widget itself (via YotpoBadge's
//     onReviewCount), i.e. the exact number the header/footer badge displays;
//   * the average score isn't exposed in the badge markup, so it comes from
//     Yotpo's public site-reviews bottomline endpoint, with that call's own
//     total_reviews kept only as a fallback for the count if the badge never
//     populates (ad blockers, script failure).
// If neither source yields a count the strip renders nothing at all rather
// than showing a half-filled claim.
const ReviewRatingStrip = ({ className = '' }: Props) => {
  const [badgeCount, setBadgeCount] = useState<string | null>(null);
  const [score, setScore] = useState<string | null>(null);
  const [fallbackCount, setFallbackCount] = useState<string | null>(null);

  useEffect(() => {
    if (!YOTPO_APP_KEY) {
      return undefined;
    }
    let cancelled = false;
    fetch(`${YOTPO_API_URL}/products/${YOTPO_APP_KEY}/yotpo_site_reviews/bottomline`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) {
          return;
        }
        const bottomline = data?.response?.bottomline;
        const average = Number(bottomline?.average_score);
        const total = Number(bottomline?.total_reviews);
        if (Number.isFinite(average) && average > 0) {
          setScore((Math.round(average * 10) / 10).toFixed(1));
        }
        if (Number.isFinite(total) && total > 0) {
          setFallbackCount(total.toLocaleString('en-US'));
        }
      })
      .catch(() => {
        // Trust signal only — a failed fetch just leaves the strip hidden.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!YOTPO_APP_KEY) {
    return null;
  }

  const reviewCount = badgeCount ?? fallbackCount;

  return (
    <>
      {/* The badge has to stay mounted for Yotpo to populate it (and for the
          mirror sync that feeds `badgeCount`), but it is not shown here — the
          strip is text-only. YotpoBadge reserves a guessed-height box that is
          only `visibility: hidden`, so it has to be collapsed to `h-0` or it
          leaves a blank block above the checkout steps. */}
      <div className="h-0 overflow-hidden" aria-hidden="true">
        <YotpoBadge width={44} onReviewCount={setBadgeCount} />
      </div>
      {reviewCount ? (
        <div className={`flex w-full items-center gap-4 sm:gap-2.5 ${className}`}>
          <div className="h-px flex-1 bg-line" />
          <div className="flex shrink-0 items-center gap-2.5 sm:gap-1.5">
            <StarRow size={13} />
            <span className="font-libre text-[12.5px] font-normal leading-none text-ink-soft tabular-nums sm:text-[11.5px]">
              {score ? `Rated ${score}/5 | ` : ''}
              {reviewCount} Certified Reviews
            </span>
          </div>
          <div className="h-px flex-1 bg-line" />
        </div>
      ) : null}
    </>
  );
};

export default ReviewRatingStrip;
