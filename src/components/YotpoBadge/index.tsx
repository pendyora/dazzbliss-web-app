'use client';
import React, { useEffect, useId, useRef, useState } from 'react';

import { loadYotpoClassicWidgetScript } from '@/utils/yotpoClassic';

const YOTPO_APP_KEY = process.env.NEXT_PUBLIC_YOTPO_APP_KEY;

// Yotpo's badge markup has no real intrinsic size — its image is
// `max-width: 100%` and the text/stars below it are fixed-size, so the whole
// thing renders at whatever width its container happens to resolve to. Left
// unconstrained, that resolution is context-dependent (confirmed empirically:
// the exact same markup measured ~121px wide next to the header's icons vs
// ~63px wide in the footer). Pinning the pre-scale container to this fixed
// reference width makes the image (and therefore the whole badge) resolve to
// the same size everywhere, so scaling down from it is predictable. Matches
// Yotpo's own dashboard-stated native width.
const REFERENCE_WIDTH = 120;

// Yotpo's classic Badges widget.js is built for a SINGLE badge per page: it
// only ever populates the first `.yotpo.yotpo-badge.badge-init` element it
// finds (confirmed empirically — a second real instance on the same page is
// left empty, and injecting the script a second time to "process the next
// one" instead breaks the first). So only the first YotpoBadge to mount
// renders the real Yotpo-tracked element ("primary"); every other instance on
// the page ("mirror") just clones the primary's populated markup once Yotpo
// fills it in, via MutationObserver.
let primaryInstanceId: string | null = null;

// Yotpo renders the star icons via a private-use-area character in their own
// "yotpo-widget-font" icon font. Two problems compound: (1) their widget.css
// declares the pseudo-element's `content` a second time as an empty string
// right after the real glyph, which wins and blanks the star -- confirmed in
// isolation to not reliably yield to a later `!important` override; and (2)
// even after routing around that by setting the glyph as real text instead
// of `::before` content, the icon font itself doesn't reliably load in every
// browser (observed rendering as a filled "notdef" box instead of a star) --
// a third-party font is simply not something we can guarantee will load.
// Drawing our own SVG star removes both failure modes: no dependency on
// Yotpo's `content` cascade or their font file.
const STAR_SVG_NS = 'http://www.w3.org/2000/svg';
const STAR_PATH_D = 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z';
function fixYotpoStarGlyphs(container: Element) {
  container.querySelectorAll('.yotpo-icon-star, .yotpo-icon-default-star').forEach((el) => {
    if (el.querySelector('svg')) {
      return;
    }
    el.textContent = '';
    // Yotpo's icon-font sizing (font-size/line-height: 17.5px, meant for a
    // glyph baseline) leaves a ~17.5px-tall strut around our 11px SVG —
    // taller than the gap the badge's layout reserves before the "CERTIFIED
    // REVIEWS" ribbon below it, so the two visibly overlap. Collapsing the
    // line box to the SVG's own size fixes that without touching the
    // ribbon's own (correct) position.
    (el as HTMLElement).style.lineHeight = '0';
    (el as HTMLElement).style.fontSize = '0';
    const svg = document.createElementNS(STAR_SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '11');
    svg.setAttribute('height', '11');
    svg.setAttribute('fill', 'currentColor');
    svg.style.display = 'block';
    const path = document.createElementNS(STAR_SVG_NS, 'path');
    path.setAttribute('d', STAR_PATH_D);
    svg.appendChild(path);
    el.appendChild(svg);
  });
}

function readYotpoReviewCount(container: Element): string | null {
  const text = container.querySelector('.y-badge-reviews')?.textContent?.trim();
  return text || null;
}

type YotpoBadgeProps = {
  // Target rendered width in px (height follows automatically, preserving
  // Yotpo's own badge proportions at that width) unless overridden via `style`.
  width?: number;
  // Controls how the outer box is positioned — default `relative` keeps it
  // in normal flow (footer, homepage strip). Pass `absolute` (plus a `style`
  // with top/right) for a caller that wants it pinned instead, and make sure
  // that caller's own container is itself positioned, or the offsets will
  // resolve against a much larger, unintended ancestor.
  className?: string;
  // Extra scale applied on top of width/REFERENCE_WIDTH, for a caller that
  // wants the badge smaller than its `width` box without changing that box's
  // own dimensions (e.g. fixed-size absolute placement with inset content).
  scaleMultiplier?: number;
  // Merged into the outer box's inline style after the computed width/height
  // /visibility/contain, so it can override any of those (e.g. a fixed
  // `height` instead of the auto-computed one, or `top`/`right` offsets).
  style?: React.CSSProperties;
  // Fires once with the live review count text (e.g. "6,174") as soon as
  // Yotpo populates the badge, for callers that want to show the same
  // number elsewhere on the page without hardcoding it.
  onReviewCount?: (count: string) => void;
};

// Yotpo's official "Badges" widget (Reviews > On-Site Widgets > Badges) — a
// Yotpo-hosted, auto-updating image (review count + average score) loaded via
// their classic widget.js bootstrap. This is a different Yotpo product/loader
// than useYotpo.js (which powers the SEO Page / Reviews Carousel / Star
// Ratings widgets elsewhere on the site), so it injects its own script once.
const YotpoBadge = ({ width = REFERENCE_WIDTH, className = 'relative', scaleMultiplier = 1, style, onReviewCount }: YotpoBadgeProps) => {
  const instanceId = useId();
  const [isPrimary] = useState(() => {
    if (primaryInstanceId === null) {
      primaryInstanceId = instanceId;
    }
    return primaryInstanceId === instanceId;
  });
  const contentRef = useRef<HTMLDivElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const [naturalHeight, setNaturalHeight] = useState<number | null>(null);
  const onReviewCountRef = useRef(onReviewCount);
  onReviewCountRef.current = onReviewCount;

  useEffect(() => {
    if (!isPrimary) {
      return;
    }
    // Shared with YotpoWriteReview (the site-reviews widget behind "Write a
    // Review" runs on this same classic bundle) — the helper is what keeps the
    // "inject exactly once" guard in a single place.
    loadYotpoClassicWidgetScript(YOTPO_APP_KEY);
  }, [isPrimary]);

  // Primary instance: once Yotpo populates the badge, patch the star glyphs
  // in place (see fixYotpoStarGlyphs above). Fix once and stop watching —
  // same as the mirror sync below — rather than reacting to every mutation
  // indefinitely, which risks fighting any of Yotpo's own later DOM updates.
  useEffect(() => {
    if (!isPrimary) {
      return undefined;
    }
    const el = document.getElementById(`y-badges-${instanceId}`);
    if (!el) {
      return undefined;
    }
    const tryFix = () => {
      if (el.querySelectorAll('.yotpo-icon-star, .yotpo-icon-default-star').length === 0) {
        return false;
      }
      fixYotpoStarGlyphs(el);
      const count = readYotpoReviewCount(el);
      if (count) {
        onReviewCountRef.current?.(count);
      }
      return true;
    };
    if (tryFix()) {
      return undefined;
    }
    const observer = new MutationObserver(() => {
      if (tryFix()) {
        observer.disconnect();
      }
    });
    observer.observe(el, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [isPrimary, instanceId]);

  // Mirror instances: clone the primary badge's populated markup once Yotpo
  // fills it in (it starts as an empty `&nbsp;`, so watch for real children).
  useEffect(() => {
    if (isPrimary) {
      return undefined;
    }
    const mirrorEl = mirrorRef.current;
    if (!mirrorEl) {
      return undefined;
    }
    let observer: MutationObserver | undefined;
    let cancelled = false;
    const trySync = (source: HTMLElement) => {
      if (source.children.length > 0) {
        mirrorEl.innerHTML = source.innerHTML;
        fixYotpoStarGlyphs(mirrorEl);
        const count = readYotpoReviewCount(mirrorEl);
        if (count) {
          onReviewCountRef.current?.(count);
        }
        return true;
      }
      return false;
    };
    const attach = () => {
      if (cancelled) {
        return;
      }
      const source = document.getElementById(`y-badges-${primaryInstanceId}`);
      if (!source) {
        // The primary instance hasn't mounted yet — retry shortly.
        setTimeout(attach, 200);
        return;
      }
      if (trySync(source)) {
        return;
      }
      observer = new MutationObserver(() => {
        if (trySync(source)) {
          observer?.disconnect();
        }
      });
      observer.observe(source, { childList: true, subtree: true });
    };
    attach();
    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [isPrimary]);

  // Measure the height the badge settles at when pinned to REFERENCE_WIDTH
  // (see comment above) — this is now consistent regardless of where the
  // component is rendered, so the scale-derived outer box matches exactly
  // instead of clipping/misaligning it. offsetHeight is a layout size and
  // ignores the CSS `transform` below, so this reads the true pre-scale height.
  useEffect(() => {
    const el = contentRef.current;
    if (!el) {
      return undefined;
    }
    const measure = () => {
      const { offsetHeight } = el;
      if (offsetHeight > 0) {
        setNaturalHeight((prev) => (prev === offsetHeight ? prev : offsetHeight));
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!YOTPO_APP_KEY) {
    return null;
  }

  const badge = isPrimary ? (
    <div id={`y-badges-${instanceId}`} className="yotpo yotpo-badge badge-init">
      &nbsp;
    </div>
  ) : (
    <div ref={mirrorRef} />
  );

  const scale = (width / REFERENCE_WIDTH) * scaleMultiplier;
  const height = (naturalHeight ?? REFERENCE_WIDTH * 1.3) * scale;

  return (
    <div
      className={`shrink-0 overflow-hidden ${className}`}
      style={{ width, height, visibility: naturalHeight ? 'visible' : 'hidden', contain: 'paint', ...style }}
    >
      <div ref={contentRef} style={{ width: REFERENCE_WIDTH, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        {badge}
      </div>
    </div>
  );
};

export default YotpoBadge;
