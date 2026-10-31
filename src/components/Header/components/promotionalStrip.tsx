/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import React, { useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

// How fast the strip scrolls on its own, in px/sec -- independent of how much
// content there is, so the speed stays the same whether there is one promo or five.
const MARQUEE_SPEED_PX_PER_SEC = 60;
// A flick keeps gliding after the finger/mouse lifts; this is the time constant
// of its exponential decay back into the normal auto-scroll.
const FLICK_DECAY_TAU_SEC = 0.4;
// Cap on flick speed, so a fast swipe can't blur the strip into nothing.
const MAX_FLICK_PX_PER_SEC = 2400;
// A drag longer than this is a scroll gesture, not a tap on a promo link.
const DRAG_CLICK_THRESHOLD_PX = 6;
// Longest frame delta we integrate. A backgrounded tab hands back a huge delta
// on return; without the clamp the strip would jump instead of resume.
const MAX_FRAME_DELTA_SEC = 0.05;

const PromotionalStrip = ({ data }: any) => {
  // console.log(data);

  // const [data, setData] = useState<any>([]);
  const [remainingTimes, setRemainingTimes] = useState<{ [key: string]: any }>({});
  const routes = useRouter();
  // Fetch API only once
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (data) {
          const promoData = data?.data;
          updateRemainingTime(promoData);
        }
      } catch (error) {
        console.error('Error fetching promotional strip data', error);
      }
    };

    fetchData();
  }, []);

  const formatTime = (num: number) => String(num).padStart(2, '0');
  // Function to calculate remaining time
  const updateRemainingTime = (promoData: any[]) => {
    const updatedTimes = promoData.reduce((acc: any, item: any) => {
      if (item?.endDate) {
        // Convert promo end date to a timestamp (assumed to be in UTC or ISO string)
        const endDate = new Date(item.endDate).getTime();

        // Get current UTC time
        const nowUTC = new Date();

        // Convert to Pacific Time (PST/PDT)
        // PST = UTC - 8 hours; PDT = UTC - 7 hours (handled automatically)
        const nowInPST = new Date(nowUTC.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })).getTime();

        // Calculate difference
        const timeDiff = endDate - nowInPST;

        acc[item.id] =
          timeDiff > 0
            ? {
                days: formatTime(Math.floor(timeDiff / (1000 * 60 * 60 * 24))),
                hours: formatTime(Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))),
                min: formatTime(Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))),
                sec: formatTime(Math.floor((timeDiff % (1000 * 60)) / 1000)),
              }
            : { days: 0, hours: 0, min: 0, sec: 0 };
      }
      return acc;
    }, {});

    setRemainingTimes(updatedTimes);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingTimes((prevTimes) => {
        const newTimes = { ...prevTimes };

        Object.keys(newTimes).forEach((id) => {
          const days = Number(newTimes[id].days);
          const hours = Number(newTimes[id].hours);
          const min = Number(newTimes[id].min);
          const sec = Number(newTimes[id].sec);

          if (days === 0 && hours === 0 && min === 0 && sec === 0) {
            // Remove expired item
            delete newTimes[id];
            // setData((prevData: any) => prevData.filter((item: any) => item.id !== id));
          } else if (sec > 0) {
            newTimes[id].sec = formatTime(sec - 1);
          } else if (min > 0) {
            newTimes[id].min = formatTime(min - 1);
            newTimes[id].sec = '59';
          } else if (hours > 0) {
            newTimes[id].hours = formatTime(hours - 1);
            newTimes[id].min = '59';
            newTimes[id].sec = '59';
          } else if (days > 0) {
            newTimes[id].days = formatTime(days - 1);
            newTimes[id].hours = '23';
            newTimes[id].min = '59';
            newTimes[id].sec = '59';
          }
        });

        return newTimes;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const hasLiveCountdown = (item: any) =>
    Boolean(
      item?.endDate &&
      remainingTimes?.[item?.id] &&
      remainingTimes?.[item?.id]?.days &&
      remainingTimes?.[item?.id]?.hours &&
      remainingTimes?.[item?.id]?.min,
    );

  // Same rule the slider used: a promo shows either while its countdown is still
  // running, or -- when it has no end date at all -- as a plain message. A promo
  // whose countdown has expired drops out of the strip.
  const visibleItems: any[] = (data?.data ?? []).filter((item: any) => hasLiveCountdown(item) || !item?.enableEndDate);

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  // Current scroll position, in px of content that has moved off the left edge.
  // Kept in a ref (not state) because it changes every frame -- React never needs
  // to re-render for it, the rAF loop writes the transform directly.
  const offsetRef = useRef(0);
  const isDraggingRef = useRef(false);
  // Whether the last seen mouse position was inside the strip.
  const isPointerOverRef = useRef(false);
  const pointerXRef = useRef(0);
  const pointerTimeRef = useRef(0);
  // Speed of the in-progress drag, carried over as glide when the pointer lifts.
  const dragVelocityRef = useRef(0);
  const flickVelocityRef = useRef(0);
  const dragDistanceRef = useRef(0);
  // Set when a pointer sequence turned out to be a drag, so the click it fires
  // on release doesn't navigate to the promo's link.
  const suppressClickRef = useRef(false);
  // The track is repeated end-to-end so the loop never shows a gap: one extra
  // copy beyond what it takes to cover the viewport, and never fewer than two.
  // The offset only ever ranges over one copy's width, so that extra copy is
  // always enough to fill the right edge whichever way the strip is moving.
  const [copies, setCopies] = useState(2);
  const [trackWidth, setTrackWidth] = useState(0);

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
    // Re-measure on viewport resize and on late layout shifts (web fonts landing
    // after hydration change the text width, and with it the loop distance).
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (observer && trackRef.current) {
      observer.observe(trackRef.current);
    }
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [visibleItems.length]);

  // The scroll itself: one rAF loop owns the transform, whatever is moving it.
  // Auto-scroll, leftover flick momentum and the live drag all just add into the
  // same offset, which is wrapped by one copy's width -- so the strip reads as a
  // single endless line no matter where the user drags it to.
  useEffect(() => {
    const row = rowRef.current;
    if (!row || !trackWidth) {
      return;
    }

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
    let frame = 0;
    let previous = performance.now();

    // The strip used to scroll via a CSS keyframe animation that paused on
    // hover. A running animation beats an inline transform in the cascade, so
    // if any older stylesheet is still around -- a browser-cached bundle, a
    // server still serving a previous build -- it would drive the strip instead
    // of this loop and bring the hover pause back with it. Killing the
    // animation inline (which outranks any stylesheet) makes that impossible.
    row.style.animation = 'none';

    const step = (now: number) => {
      const delta = Math.min((now - previous) / 1000, MAX_FRAME_DELTA_SEC);
      previous = now;

      // While the pointer is down the offset is driven by pointermove alone;
      // the strip should follow the finger exactly, not drift under it. A mouse
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

      // Wrap into [0, trackWidth) in both directions -- dragging backwards past
      // the start has to loop round just as cleanly as scrolling forwards.
      offsetRef.current = ((offsetRef.current % trackWidth) + trackWidth) % trackWidth;
      row.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [trackWidth]);

  const setDraggingClass = (dragging: boolean) => {
    containerRef.current?.classList.toggle('is-dragging', dragging);
  };

  // A mouse resting on the strip holds the scroll still, so the promo under the
  // cursor can be read. Two signals, because each covers the other's blind spot:
  //
  //   `:hover` alone -- the browser only recomputes it when the mouse moves, so
  //   anything that reshuffles the page under a stationary cursor (a popup
  //   mounting, an image landing) can drop it and let the strip scroll away
  //   under the mouse.
  //   the tracked pointer alone -- nothing is known until the mouse first
  //   moves, so a page that loads with the cursor already over the strip, or a
  //   remount beneath it, would scroll on regardless.
  //
  // Both are mouse-only: `(hover: hover)` keeps a phone out of this entirely,
  // where a tap leaves `:hover` stuck on the tapped element and would freeze
  // the strip for good.
  const isHovered = () => {
    if (!(window.matchMedia?.('(hover: hover)')?.matches ?? false)) {
      return false;
    }
    return isPointerOverRef.current || (containerRef.current?.matches(':hover') ?? false);
  };

  const endDrag = () => {
    if (!isDraggingRef.current) {
      return;
    }
    isDraggingRef.current = false;
    setDraggingClass(false);
    // Whatever speed the pointer was moving at carries on as a glide, and the
    // auto-scroll picks up again from wherever the drag left the strip. Letting
    // go with the mouse still over the strip is different: the hover pause takes
    // hold immediately, so the glide is dropped rather than banked -- otherwise
    // it would sit frozen and then replay in full whenever the mouse left.
    flickVelocityRef.current = isHovered() ? 0 : Math.max(-MAX_FLICK_PX_PER_SEC, Math.min(MAX_FLICK_PX_PER_SEC, dragVelocityRef.current));
    dragVelocityRef.current = 0;
  };

  // The whole gesture is tracked on the window, not on the strip. The strip is
  // only ~30px tall and sits hard against the top of the page, so a real mouse
  // drag wanders out of it constantly -- if it were tracked on the element the
  // strip would stop following the cursor the moment it left, while auto-scroll
  // stayed paused, and a release over the browser chrome would never end the
  // drag at all. Watching the window covers every one of those cases without
  // pointer capture, which cannot be used here: a captured pointer makes the
  // browser retarget the click to the capturing element, swallowing taps on the
  // promo links.
  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      // Every mouse move on the page, dragging or not, refreshes where the
      // cursor is relative to the strip -- that is what keeps the hover pause
      // right when the browser's own `:hover` goes stale.
      if (event.pointerType === 'mouse') {
        const rect = containerRef.current?.getBoundingClientRect();
        isPointerOverRef.current = Boolean(
          rect && event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom,
        );
      }

      if (!isDraggingRef.current) {
        return;
      }
      // A mouse that was released where we could not see it (over browser
      // chrome, another window) comes back with no buttons held. Without this
      // the drag would never end and the strip would sit frozen for good.
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
  }, []);

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

  const renderItem = (item: any) => (
    <div
      key={item.id}
      className={`flex items-center gap-1 whitespace-nowrap ${item?.link ? 'cursor-pointer' : ''}`}
      onClick={() => {
        if (suppressClickRef.current || !item?.link) {
          return;
        }
        routes.push(item.link);
      }}
    >
      {item?.prefixText && <p className="whitespace-nowrap">{item.prefixText}</p>}
      {hasLiveCountdown(item) && (
        <div className="flex items-center gap-1">
          <p className="bg-white py-[1px] px-1 text-[11px] sm:text-[10px] text-center rounded-md text-black">{remainingTimes[item.id]?.days}D</p>
          <p className="bg-white py-[1px] px-1 text-[11px] sm:text-[10px] rounded-md text-center text-black">{remainingTimes?.[item?.id]?.hours}H</p>:
          <p className="bg-white py-[1px] px-1 text-[11px] sm:text-[10px] rounded-md text-center text-black">{remainingTimes?.[item?.id]?.min}M</p>:
          <p className="bg-white py-[1px] px-1 text-[11px] sm:text-[10px] rounded-md text-center text-black">{remainingTimes?.[item?.id]?.sec}S</p>
          <p className="py-[1px] px-1 text-[11px] sm:text-[10px] rounded-md text-center">(PST)</p>
        </div>
      )}
      {item?.title && <p className="whitespace-nowrap">{item.title}</p>}
    </div>
  );

  // One copy of every promo, each followed by a divider so the seam between
  // repeats reads the same as the gap between two promos.
  const renderTrack = (copyIndex: number) => (
    <div key={copyIndex} ref={copyIndex === 0 ? trackRef : undefined} aria-hidden={copyIndex > 0} className="flex shrink-0 items-center">
      {visibleItems.map((item: any) => (
        <React.Fragment key={item.id}>
          {renderItem(item)}
          <span className="mx-16 sm:mx-10 h-[12px] w-px shrink-0 bg-white/50" />
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <>
      {data?.isActive && visibleItems.length > 0 && (
        <div
          ref={containerRef}
          className="promo-marquee bg-primary overflow-hidden p-[9px] md:p-[13px] sm:p-[6px] text-white uppercase tracking-[1px] text-[12px] sm:text-[11px]"
          onPointerDown={handlePointerDown}
          // Native drag would fight the pointer drag over the promo text.
          onDragStart={(event) => event.preventDefault()}
        >
          <div ref={rowRef} className="promo-marquee__row">
            {Array.from({ length: copies }, (_, copyIndex) => renderTrack(copyIndex))}
          </div>
        </div>
      )}
    </>
  );
};

export default PromotionalStrip;
