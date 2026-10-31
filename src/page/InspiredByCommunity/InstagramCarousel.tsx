'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { FaInstagram } from 'react-icons/fa';

export type Tile = {
  /** Poster frame: bare filename for a bundled image, absolute URL for an Instagram one. */
  src: string;
  /** Set for Reels/VIDEO posts — the .mp4 that plays in place of the poster. */
  videoUrl?: string;
  alt: string;
  caption?: string | null;
  href?: string;
};

// Motion model copied from the promotional strip in the header, so the two
// scroll and drag identically. See promotionalStrip.tsx for the reasoning
// behind each of these.

// How fast the row scrolls on its own, in px/sec — independent of how many
// posts there are, so the speed is the same whether the feed returns 6 or 30.
const MARQUEE_SPEED_PX_PER_SEC = 45;
// A flick keeps gliding after the finger/mouse lifts; this is the time constant
// of its exponential decay back into the normal auto-scroll.
const FLICK_DECAY_TAU_SEC = 0.4;
// Cap on flick speed, so a fast swipe can't blur the row into nothing.
const MAX_FLICK_PX_PER_SEC = 2400;
// A drag longer than this is a scroll gesture, not a click on a post.
const DRAG_CLICK_THRESHOLD_PX = 6;
// Longest frame delta we integrate. A backgrounded tab hands back a huge delta
// on return; without the clamp the row would jump instead of resume.
const MAX_FRAME_DELTA_SEC = 0.05;

/**
 * Tile width per breakpoint. Breakpoints in this project are MAX-width
 * (see tailwind.config.js), so these read widest-first.
 */
const TILE_WIDTH = 'w-[330px] xl:w-[300px] lg:w-[260px] md:w-[220px] sm:w-[180px]';

/** Marks a Reel, so a paused or still-loading video still reads as video. */
function PlayBadge() {
  return (
    <span className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center bg-ink/55" aria-hidden="true">
      <svg viewBox="0 0 24 24" className="h-3 w-3 translate-x-[1px] fill-paper">
        <path d="M8 5v14l11-7z" />
      </svg>
    </span>
  );
}

/**
 * One post.
 *
 * `isClone` marks the repeated copies of the row, which exist only so the loop
 * never shows a gap: they are hidden from assistive tech and taken out of the
 * tab order so the feed isn't announced several times over.
 */
function CarouselTile({
  tile,
  isClone,
  registerVideo,
  shouldSuppressClick,
}: {
  tile: Tile;
  isClone: boolean;
  registerVideo: (el: HTMLVideoElement | null) => void;
  shouldSuppressClick: () => boolean;
}) {
  const label = isClone ? '' : tile.alt;

  let media: React.ReactNode;

  if (tile.videoUrl) {
    media = (
      <video
        ref={registerVideo}
        src={tile.videoUrl}
        poster={tile.src}
        muted
        loop
        playsInline
        // Nothing is fetched until the tile is actually on screen — most of the
        // row is off-screen at any moment, and the poster covers the gap.
        preload="none"
        aria-label={label || undefined}
        draggable={false}
        className="pointer-events-none block h-full w-full object-cover transition-transform duration-700 ease-out group-hover/tile:scale-[1.04]"
      />
    );
  } else {
    media = (
      <img
        src={tile.src}
        alt={label}
        loading="lazy"
        draggable={false}
        className="pointer-events-none block h-full w-full object-cover transition-transform duration-700 ease-out group-hover/tile:scale-[1.04]"
      />
    );
  }

  const body = (
    <>
      {media}
      {tile.videoUrl ? <PlayBadge /> : null}

      {/* Hover state: scrim + "View post" + caption. Pointer-events stay off so
          the anchor underneath keeps the whole tile clickable and draggable. */}
      <span
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/20 to-transparent opacity-0 transition-opacity duration-300 group-hover/tile:opacity-100 group-focus-within/tile:opacity-100"
        aria-hidden="true"
      />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 p-4 opacity-0 transition-all duration-300 group-hover/tile:translate-y-0 group-hover/tile:opacity-100 group-focus-within/tile:translate-y-0 group-focus-within/tile:opacity-100">
        <span className="flex items-center gap-2 text-[10.5px] font-medium uppercase tracking-[0.18em] text-paper">
          <FaInstagram aria-hidden="true" /> View post
        </span>
        {tile.caption ? <span className="mt-1.5 line-clamp-2 text-[12.5px] leading-snug text-paper/85">{tile.caption}</span> : null}
      </span>
    </>
  );

  return (
    <div className={`group/tile relative shrink-0 overflow-hidden bg-stone ${TILE_WIDTH} aspect-[5/6]`} aria-hidden={isClone ? 'true' : undefined}>
      {tile.href ? (
        <a
          href={tile.href}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={isClone ? -1 : undefined}
          draggable={false}
          // A drag that happens to end on a tile must not open the post.
          onClick={(event) => {
            if (shouldSuppressClick()) {
              event.preventDefault();
            }
          }}
          className="block h-full w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-paper"
        >
          {body}
        </a>
      ) : (
        body
      )}
    </div>
  );
}

export default function InstagramCarousel({ tiles }: { tiles: Tile[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const videosRef = useRef<HTMLVideoElement[]>([]);

  // Current scroll position, in px of content that has moved off the left edge.
  // Kept in a ref (not state) because it changes every frame — React never needs
  // to re-render for it, the rAF loop writes the transform directly.
  const offsetRef = useRef(0);
  const isDraggingRef = useRef(false);
  // Whether the last seen mouse position was inside the row.
  const isPointerOverRef = useRef(false);
  const pointerXRef = useRef(0);
  const pointerTimeRef = useRef(0);
  // Speed of the in-progress drag, carried over as glide when the pointer lifts.
  const dragVelocityRef = useRef(0);
  const flickVelocityRef = useRef(0);
  const dragDistanceRef = useRef(0);
  // Set when a pointer sequence turned out to be a drag, so the click it fires
  // on release doesn't open the post.
  const suppressClickRef = useRef(false);

  // The row is repeated end-to-end so the loop never shows a gap: one extra copy
  // beyond what it takes to cover the viewport, and never fewer than two. The
  // offset only ever ranges over one copy's width, so that extra copy is always
  // enough to fill the right edge whichever way the row is moving.
  const [copies, setCopies] = useState(2);
  const [trackWidth, setTrackWidth] = useState(0);

  const registerVideo = useCallback((el: HTMLVideoElement | null) => {
    if (el && !videosRef.current.includes(el)) {
      videosRef.current.push(el);
    }
  }, []);

  const shouldSuppressClick = useCallback(() => suppressClickRef.current, []);

  useEffect(() => {
    const measure = () => {
      const width = trackRef.current?.getBoundingClientRect()?.width ?? 0;
      const containerWidth = containerRef.current?.getBoundingClientRect()?.width ?? 0;
      if (!width) {
        return;
      }
      setTrackWidth(width);
      setCopies(Math.max(2, Math.ceil(containerWidth / width) + 1));
    };

    measure();
    // Re-measure on viewport resize and on late layout shifts — images landing
    // after hydration change the row width, and with it the loop distance.
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (observer && trackRef.current) {
      observer.observe(trackRef.current);
    }
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [tiles.length]);

  // A mouse resting on the row holds it still, so the post under the cursor can
  // be read and clicked. Two signals, because each covers the other's blind spot:
  // `:hover` goes stale when the page shifts under a stationary cursor, and the
  // tracked pointer knows nothing until the mouse first moves. Both are
  // mouse-only — on a phone a tap leaves `:hover` stuck and would freeze the row.
  const isHovered = useCallback(() => {
    if (!(window.matchMedia?.('(hover: hover)')?.matches ?? false)) {
      return false;
    }
    return isPointerOverRef.current || (containerRef.current?.matches(':hover') ?? false);
  }, []);

  // The scroll itself: one rAF loop owns the transform, whatever is moving it.
  // Auto-scroll, leftover flick momentum and the live drag all just add into the
  // same offset, which is wrapped by one copy's width — so the row reads as a
  // single endless line no matter where the user drags it to.
  useEffect(() => {
    const row = rowRef.current;
    if (!row || !trackWidth) {
      return;
    }

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
    let frame = 0;
    let previous = performance.now();

    const step = (now: number) => {
      const delta = Math.min((now - previous) / 1000, MAX_FRAME_DELTA_SEC);
      previous = now;

      // While the pointer is down the offset is driven by pointermove alone; the
      // row should follow the finger exactly, not drift under it. A mouse
      // hovering holds it still in the same way, just without moving it.
      if (!isDraggingRef.current && !isHovered()) {
        if (!prefersReducedMotion) {
          offsetRef.current += MARQUEE_SPEED_PX_PER_SEC * delta;
        }
        if (flickVelocityRef.current) {
          offsetRef.current += flickVelocityRef.current * delta;
          flickVelocityRef.current *= Math.exp(-delta / FLICK_DECAY_TAU_SEC);
          if (Math.abs(flickVelocityRef.current) < 1) {
            flickVelocityRef.current = 0;
          }
        }
      }

      // Wrap into [0, trackWidth) in both directions — dragging backwards past
      // the start has to loop round just as cleanly as scrolling forwards.
      offsetRef.current = ((offsetRef.current % trackWidth) + trackWidth) % trackWidth;
      row.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [trackWidth, isHovered]);

  // Videos play only while actually on screen. IntersectionObserver accounts for
  // the row's own overflow clipping, so a tile scrolled off the side counts as
  // hidden just like one below the fold — which caps concurrent playback at the
  // two or three tiles visible, however many copies of the row exist.
  useEffect(() => {
    if (!videosRef.current.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            void video.play().catch(() => {
              /* autoplay refused (data saver, low power) — the poster still shows */
            });
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.25 },
    );

    videosRef.current.forEach((video) => observer.observe(video));
    return () => observer.disconnect();
  }, [tiles.length, copies]);

  const setDraggingClass = useCallback((dragging: boolean) => {
    containerRef.current?.classList.toggle('is-dragging', dragging);
  }, []);

  const endDrag = useCallback(() => {
    if (!isDraggingRef.current) {
      return;
    }
    isDraggingRef.current = false;
    setDraggingClass(false);
    // Whatever speed the pointer was moving at carries on as a glide, and the
    // auto-scroll picks up again from wherever the drag left the row. Letting go
    // with the mouse still over the row is different: the hover pause takes hold
    // immediately, so the glide is dropped rather than banked — otherwise it
    // would sit frozen and then replay in full whenever the mouse left.
    flickVelocityRef.current = isHovered() ? 0 : Math.max(-MAX_FLICK_PX_PER_SEC, Math.min(MAX_FLICK_PX_PER_SEC, dragVelocityRef.current));
    dragVelocityRef.current = 0;
  }, [isHovered, setDraggingClass]);

  // The whole gesture is tracked on the window, not on the row: a real mouse
  // drag wanders out of the element constantly, and a release over the browser
  // chrome would otherwise never end the drag. Pointer capture can't be used
  // here — a captured pointer makes the browser retarget the click to the
  // capturing element, swallowing clicks on the post links.
  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      // Every mouse move on the page, dragging or not, refreshes where the
      // cursor is relative to the row — that is what keeps the hover pause right
      // when the browser's own `:hover` goes stale.
      if (event.pointerType === 'mouse') {
        const rect = containerRef.current?.getBoundingClientRect();
        isPointerOverRef.current = Boolean(
          rect && event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom,
        );
      }

      if (!isDraggingRef.current) {
        return;
      }
      // A mouse released where we could not see it (over browser chrome, another
      // window) comes back with no buttons held. Without this the drag would
      // never end and the row would sit frozen for good.
      if (event.pointerType === 'mouse' && event.buttons === 0) {
        endDrag();
        return;
      }

      const dx = event.clientX - pointerXRef.current;
      const dt = (event.timeStamp - pointerTimeRef.current) / 1000;
      pointerXRef.current = event.clientX;
      pointerTimeRef.current = event.timeStamp;

      // Dragging right (positive dx) pulls content back, i.e. lowers the offset.
      offsetRef.current -= dx;
      dragDistanceRef.current += Math.abs(dx);
      if (dragDistanceRef.current > DRAG_CLICK_THRESHOLD_PX) {
        suppressClickRef.current = true;
      }
      if (dt > 0) {
        // Smoothed, so one jittery frame at release doesn't decide the throw.
        dragVelocityRef.current = dragVelocityRef.current * 0.7 + (-dx / dt) * 0.3;
      }
    };
    const onRelease = () => endDrag();

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onRelease);
    window.addEventListener('pointercancel', onRelease);
    // Losing the window mid-drag (alt-tab, a context menu) swallows the release.
    window.addEventListener('blur', onRelease);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onRelease);
      window.removeEventListener('pointercancel', onRelease);
      window.removeEventListener('blur', onRelease);
    };
  }, [endDrag]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    // Left button only for a mouse; other buttons belong to the browser.
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }
    isDraggingRef.current = true;
    pointerXRef.current = event.clientX;
    pointerTimeRef.current = event.timeStamp;
    dragVelocityRef.current = 0;
    flickVelocityRef.current = 0;
    dragDistanceRef.current = 0;
    suppressClickRef.current = false;
    setDraggingClass(true);
  };

  const renderTrack = (copyIndex: number) => (
    <div key={copyIndex} ref={copyIndex === 0 ? trackRef : undefined} className="flex shrink-0 gap-1.5 pr-1.5">
      {tiles.map((tile, index) => (
        <CarouselTile
          key={`${copyIndex}-${index}`}
          tile={tile}
          isClone={copyIndex > 0}
          registerVideo={registerVideo}
          shouldSuppressClick={shouldSuppressClick}
        />
      ))}
    </div>
  );

  if (!tiles.length) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="ig-feed overflow-hidden"
      onPointerDown={handlePointerDown}
      // Native image drag would fight the pointer drag over the tiles.
      onDragStart={(event) => event.preventDefault()}
      // Horizontal gestures are ours; vertical ones stay with the browser so the
      // page still scrolls normally when a swipe starts on the row.
      style={{ touchAction: 'pan-y' }}
      role="region"
      aria-label="Instagram posts from @ashclairjewelry"
    >
      <div ref={rowRef} className="ig-feed__row flex will-change-transform">
        {Array.from({ length: copies }, (_, copyIndex) => renderTrack(copyIndex))}
      </div>
    </div>
  );
}
