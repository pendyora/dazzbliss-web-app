'use client';
import React from 'react';

import YotpoReview from '../yotpoReiew';

/** Client reviews (Yotpo widget), placed straight after the product details. */
export default function PdpReviews() {
  return (
    <section id="pdp-reviews" className="mx-auto w-full max-w-[1440px] px-[clamp(16px,3.2vw,56px)]">
      <div className="border-t border-line py-[clamp(56px,7vw,96px)]">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-teal">Client reviews</span>
        <h2 className="m-0 mb-8 mt-2.5 text-balance font-cormorant text-[clamp(30px,3vw,40px)] font-medium leading-[1.05] text-ink">
          Worn &amp; <em className="italic">loved</em>
        </h2>
        <YotpoReview />
      </div>
    </section>
  );
}
