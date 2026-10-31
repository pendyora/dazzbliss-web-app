'use client';

import React, { useState } from 'react';

import YotpoBadge from '@/components/YotpoBadge';

// Same star SVG as YotpoBadge (see the comment there on why: Yotpo's icon
// font doesn't reliably load, so we draw our own instead of depending on it).
const STAR_PATH_D = 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z';

function StarRow() {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" width={13} height={13} fill="#f4b740">
          <path d={STAR_PATH_D} />
        </svg>
      ))}
    </div>
  );
}

// Mobile-only trust strip, sits just below the header and above the hero
// banner — the Yotpo Badges widget (real, live review count + rating) in a
// prominent spot before the fold. Desktop already carries the same badge in
// the header, so this is scoped to `sm:` only. The review count next to the
// badge is read live off the badge itself (via YotpoBadge's onReviewCount),
// not hardcoded, so the two numbers can't drift apart.
export default function MobileReviewsBadgeStrip() {
  const [reviewCount, setReviewCount] = useState<string | null>(null);

  if (!process.env.NEXT_PUBLIC_YOTPO_APP_KEY) {
    return null;
  }

  // The badge has to stay mounted for Yotpo to populate it (and for the mirror
  // sync that feeds `reviewCount`), but until it actually has content it must
  // not occupy any height: YotpoBadge reserves a guessed-height box that is
  // only `visibility: hidden`, so rendering the strip eagerly puts a ~97px
  // blank white block between the header and the hero banner — permanently so
  // if Yotpo never loads. Collapsing to `h-0 overflow-hidden` keeps the badge
  // in layout (so it still measures and populates) while taking no vertical
  // space, and the strip only becomes visible once there's a count to show.
  const isReady = Boolean(reviewCount);

  return (
    <div
      className={
        isReady
          ? 'hidden sm:flex [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:flex items-center justify-center gap-2.5 border-b border-[#e5e5e5] bg-white px-4 py-1.5'
          : 'hidden sm:block [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:block h-0 overflow-hidden'
      }
    >
      {/* Sized off the strip's own line height rather than Yotpo's native
          badge size — the seal is taller than it is wide (120x130 at the
          reference width), so a larger value makes the strip taller than the
          header itself and pushes the 1:1 hero banner below the fold. */}
      <YotpoBadge width={44} onReviewCount={setReviewCount} />
      {/* Two lines — the review count, then the stars and the attribution
          side by side separated by a divider. */}
      {isReady && (
        <div className="flex flex-col items-start gap-0.5">
          <span className="text-[13px] font-semibold leading-tight text-[#3d3d3d]">{reviewCount} Certified Reviews</span>
          <div className="flex items-center gap-1.5">
            <StarRow />
            <span className="text-[10px] leading-none text-[#d0d0d0]">|</span>
            <span className="text-[10px] leading-tight text-[#8a8a8a]">Powered by YOTPO</span>
          </div>
        </div>
      )}
    </div>
  );
}
