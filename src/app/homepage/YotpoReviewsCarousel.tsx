'use client';
import React, { useEffect, useRef, useState } from 'react';

import YotpoWriteReview from '@/components/YotpoWriteReview';
import { YotpoInitWidgetsOnce } from '@/hook/useYotpo';

// CSS custom properties published on the section by the measuring effect below
// and consumed by the `.yotpo-reviews-carousel-section` rules in antd.css.
const CARD_INSET_VAR = '--yotpo-carousel-card-inset';
const CTA_RIGHT_VAR = '--yotpo-carousel-cta-right';
const CTA_TOP_VAR = '--yotpo-carousel-cta-top';
// Glide lays the track out asynchronously after Yotpo renders, and remeasures on
// image load, so the first read can land before the slides have their final
// positions. Re-read on this cadence for a short while after mount/resize.
const SETTLE_MS = 200;
const SETTLE_TRIES = 15;
// Widest viewport that gets the tablet alignment rule in the measuring effect —
// covers iPad Pro 12.9 landscape (1366 exclusive) without touching desktop.
const TABLET_ALIGN_MAX = 1365;

// Yotpo "Reviews Carousel" on-site widget — store-wide (no product scope), sits
// right below Our Best Sellers on the homepage. The loader script itself is
// injected once app-wide by useYotpo() in AppProvider.tsx; this only needs to
// mount the widget instance div and ask Yotpo to initialize it.
const YotpoReviewsCarousel = () => {
  const instanceId = process.env.NEXT_PUBLIC_YOTPO_CAROUSEL_INSTANCE_ID;
  const sectionRef = useRef<HTMLDivElement>(null);
  // The "Write a Review" CTA stays hidden until Yotpo has actually rendered the
  // customer reviews — otherwise it shows on its own above an empty section
  // while the widget loads.
  const [reviewsLoaded, setReviewsLoaded] = useState(false);

  useEffect(() => {
    if (instanceId) {
      YotpoInitWidgetsOnce();
    }
  }, [instanceId]);

  // Align the widget's rating row ("★★★★★ 6174 reviews") and our own "Write a
  // Review" CTA with the review cards below them.
  //
  // Yotpo insets the whole widget by a percentage of the section width, then
  // Glide centres a run of fixed-width cards inside that track — so the distance
  // from the widget's edge to the first whole card is not a constant: it depends
  // on how many card-widths happen to fit. That can't be expressed as static
  // CSS, so derive it here and publish the two insets as custom properties for
  // antd.css to apply.
  useEffect(() => {
    const section = sectionRef.current;
    if (!instanceId || !section) {
      return undefined;
    }

    const measure = () => {
      const wrapper = section.querySelector('.yotpo-reviews-carousel-widget-container');
      const row = section.querySelector('.reviews-carousel-reviews-bottomline');
      if (!wrapper || !row) {
        return;
      }
      const sectionRect = section.getBoundingClientRect();
      const wrapperRect = wrapper.getBoundingClientRect();
      const rowRect = row.getBoundingClientRect();

      // Glide keeps the active card centred in the track and steps every other
      // card off it by a whole card-plus-gutter, so the run of whole cards is
      // centred too and its inset follows from the track and card widths alone —
      // no need to read slide positions, which are mid-animation half the time
      // and would make this jitter. Only the widths are read, and a translate
      // doesn't affect those.
      const track = section.querySelector('.glide__track');
      const slides = section.querySelectorAll<HTMLElement>('.glide__slide');
      let cardsLeft = wrapperRect.left;
      let cardsRight = wrapperRect.right;
      if (track && slides.length > 1) {
        const trackRect = track.getBoundingClientRect();
        const cardWidth = slides[0].getBoundingClientRect().width;
        const step = slides[1].offsetLeft - slides[0].offsetLeft;
        const halfSpare = (trackRect.width - cardWidth) / 2;
        if (cardWidth > 0 && step > 0 && halfSpare >= 0) {
          const inset = halfSpare - Math.floor(halfSpare / step) * step;
          // What's left of the track outside the whole cards shows the next card
          // clipped. A thin sliver reads as a peek and the row should line up
          // with the first whole card; but once more than half a card shows it
          // reads as a card in its own right, and the row belongs on the track
          // edge where that card is cut off — which is where it already sat.
          const sliver = inset - (step - cardWidth);
          // That second reading breaks down on tablets. Yotpo hands out a fixed
          // ~400px card, so from roughly 950px up only ONE whole card fits and the
          // leftover is a >200px half-card on each side — the branch fires, and the
          // rating row and CTA snap to the track edge, sitting above a card that is
          // cut in half. Measured at 1024px: stars at 51px, first whole card at
          // 312px. Across tablets the row should always follow the whole card.
          // Bounded at 1365px so desktop keeps its current behaviour; above that the
          // spare width exceeds a full step, the sliver collapses and this branch
          // stops firing on its own anyway.
          const alignToWholeCard = sliver <= cardWidth / 2 || window.innerWidth <= TABLET_ALIGN_MAX;
          if (alignToWholeCard) {
            cardsLeft = trackRect.left + inset;
            cardsRight = trackRect.right - inset;
          } else {
            cardsLeft = trackRect.left;
            cardsRight = trackRect.right;
          }
        }
      }

      // Measured against the widget wrapper, not the row itself: the row's own
      // box is what this padding goes on, so reading it back would feed into the
      // next measurement.
      // Reviews count as loaded once at least one review card has been laid out.
      // Set only after the offsets above are known, so the CTA appears already
      // in place rather than jumping from its fallback position.
      const hasLaidOutCard = Array.from(slides).some((slide) => slide.getBoundingClientRect().width > 0);

      const cardInset = Math.max(0, Math.round(cardsLeft - wrapperRect.left));
      const ctaRight = Math.max(0, Math.round(sectionRect.right - cardsRight));
      // Centre of the rating row, in section-local coordinates. The CTA pulls
      // itself back by half its own height (see `-translate-y-1/2` below), so
      // this stays correct whatever height the button ends up with.
      const ctaTop = Math.round(rowRect.top - sectionRect.top + rowRect.height / 2);

      const write = (name: string, value: string) => {
        if (section.style.getPropertyValue(name) !== value) {
          section.style.setProperty(name, value);
        }
      };
      write(CARD_INSET_VAR, `${cardInset}px`);
      write(CTA_RIGHT_VAR, `${ctaRight}px`);
      write(CTA_TOP_VAR, `${ctaTop}px`);

      if (hasLaidOutCard) {
        setReviewsLoaded(true);
      }
    };

    let settleTimer: ReturnType<typeof setTimeout>;
    let frame: number;
    const settle = () => {
      clearTimeout(settleTimer);
      cancelAnimationFrame(frame);
      let tries = 0;
      const tick = () => {
        measure();
        tries += 1;
        if (tries < SETTLE_TRIES) {
          settleTimer = setTimeout(tick, SETTLE_MS);
        }
      };
      frame = requestAnimationFrame(tick);
    };

    settle();
    window.addEventListener('resize', settle);
    // Yotpo replaces the whole widget subtree when it renders, so watch for that
    // rather than assuming the markup exists by the time this effect runs.
    const observer = new MutationObserver(settle);
    observer.observe(section, { childList: true, subtree: true });

    return () => {
      clearTimeout(settleTimer);
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', settle);
      observer.disconnect();
    };
  }, [instanceId]);

  if (!instanceId) {
    return null;
  }

  return (
    <div className="mt-[74px] flex flex-col items-center lg:mt-10 2xl:mt-14 xl:mt-14 sm:mt-[20px]">
      {/* Yotpo sizes its carousel cards in fixed pixels off the browser viewport
          width, not this container's width, so any side padding here only
          shrinks the visible track and clips cards — at every breakpoint. Kept
          edge-to-edge (container-xs just caps ultra-wide screens) so the track
          gets the full width Yotpo assumed and the neighbouring-card peek has
          room to show on both sides. */}
      <div ref={sectionRef} className="yotpo-reviews-carousel-section container-xs relative w-full">
        {/* The carousel is read-only (Yotpo ships no submission UI with it), so
            the section's own call to action sits at the right-hand end of the
            widget's own rating row ("★★★★★ 6174 reviews"), ending flush with the
            right edge of the review cards. Absolute, to sit in that row without
            disturbing Yotpo's layout; the offsets come from the measuring effect
            above, so they follow the cards at every breakpoint. */}
        {reviewsLoaded && (
          <YotpoWriteReview
            className="absolute z-[2] -translate-y-1/2"
            style={{
              // Fallback is the row centre Yotpo lays out at on desktop; normally
              // the measured value is already set by the time this mounts.
              top: `var(${CTA_TOP_VAR}, 122px)`,
              right: `var(${CTA_RIGHT_VAR}, 0px)`,
            }}
          />
        )}
        <div className="yotpo-widget-instance" data-yotpo-instance-id={instanceId}></div>
      </div>
    </div>
  );
};

export default YotpoReviewsCarousel;
