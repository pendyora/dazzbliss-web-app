'use client';
import React, { useState } from 'react';

import { Tabs } from 'antd';
import { A11y } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import ProductProfile from '@/components/ProductProfile';
import { useAppSelector } from '@/store';

import { PlpGridSkeleton } from '../../PlpGrid';

import type { RecentlyViewedCard } from './useRecentlyViewed';
import type { Swiper as SwiperClass } from 'swiper';

import 'swiper/css';

const Arrow = ({ dir }: { dir: 'left' | 'right' }) => (
  <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 fill-none stroke-current stroke-[1.2]">
    <path d={dir === 'left' ? 'M14.5 6l-6 6 6 6' : 'M9.5 6l6 6-6 6'} />
  </svg>
);

function Rail({ products, onSwiper }: { products: any[]; onSwiper: (s: SwiperClass) => void }) {
  return (
    <Swiper
      modules={[A11y]}
      onSwiper={onSwiper}
      // Room for the swatch outline, which the rail's overflow would otherwise clip.
      className="!-mx-1 !px-1 !pb-1"
      spaceBetween={12}
      slidesPerView={1.6}
      breakpoints={{ 551: { slidesPerView: 2.4 }, 770: { slidesPerView: 3, spaceBetween: 14 }, 1025: { slidesPerView: 4, spaceBetween: 16 } }}
    >
      {products.map((p, i) => (
        <SwiperSlide key={`${p?.sku_master_id ?? p?.jewelry_id}-${i}`} className="!h-auto">
          <ProductProfile {...p} isStatic layout="plp" />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}

/** "Complete it, or compare it": suggested pieces and recently viewed, on the shared PLP card. */
export default function PdpSuggestions({ recentlyViewed }: { recentlyViewed: RecentlyViewedCard[] }) {
  const { suggestion, loading } = useAppSelector((state) => state?.products);
  const [swiper, setSwiper] = useState<SwiperClass | null>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const bind = (s: SwiperClass) => {
    setSwiper(s);
    const sync = () => setEdges({ start: s.isBeginning, end: s.isEnd });
    sync();
    s.on('slideChange', sync);
    s.on('resize', sync);
    s.on('reachEnd', sync);
  };

  const items = [];
  if (suggestion?.length > 0) {
    items.push({ key: 'suggested', label: 'You may also like', children: <Rail products={suggestion} onSwiper={bind} /> });
  } else if (loading) {
    items.push({ key: 'suggested', label: 'You may also like', children: <PlpGridSkeleton columns={4} count={4} /> });
  }
  if (recentlyViewed.length > 0) {
    items.push({ key: 'recent', label: 'Recently viewed', children: <Rail products={recentlyViewed} onSwiper={bind} /> });
  }
  if (items.length === 0) {
    return null;
  }

  return (
    <section id="pdp-suggestions" className="mx-auto w-full max-w-[1440px] px-[clamp(16px,3.2vw,56px)] py-[clamp(56px,7vw,96px)]">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-5">
        <div>
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-teal">Curated for you</span>
          <h2 className="m-0 mt-2.5 text-balance font-cormorant text-[clamp(30px,3vw,40px)] font-medium leading-[1.05] text-ink">
            Pairs <em className="italic">beautifully</em> with
          </h2>
        </div>
        <div className="flex gap-2 sm:hidden">
          {(['left', 'right'] as const).map((dir) => (
            <button
              key={dir}
              type="button"
              aria-label={dir === 'left' ? 'Previous pieces' : 'Next pieces'}
              disabled={dir === 'left' ? edges.start : edges.end}
              onClick={() => (dir === 'left' ? swiper?.slidePrev() : swiper?.slideNext())}
              className="grid h-11 w-11 place-items-center border border-line text-ink transition-colors hover:border-ink disabled:cursor-default disabled:opacity-35 disabled:hover:border-line"
            >
              <Arrow dir={dir} />
            </button>
          ))}
        </div>
      </div>
      <Tabs items={items} destroyInactiveTabPane className="[&_.ant-tabs-tab-btn]:text-[13px] [&_.ant-tabs-tab-btn]:font-medium" />
    </section>
  );
}
