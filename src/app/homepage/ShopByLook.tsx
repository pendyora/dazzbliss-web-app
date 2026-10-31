'use client';

import React, { useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

interface JewelryDot {
  id: string;
  x: number;
  y: number;
  label: string;
  price: string;
  category: string;
  href: string;
}

interface LookItem {
  image: string;
  alt: string;
  dots: JewelryDot[];
}

const looks: LookItem[] = [
  {
    image: '/images/Model/marcin-sajur-Q44fOUMn-p0-unsplash (1).jpg',
    alt: 'Model wearing Pendyora jewelry',
    dots: [
      {
        id: 'look1-earring',
        x: 25,
        y: 46,
        label: 'Diamond Drop Earrings',
        price: '$1,250',
        category: 'Earrings',
        href: '/earrings',
      },
      {
        id: 'look1-ring',
        x: 44,
        y: 68,
        label: 'Solitaire Ring',
        price: '$2,400',
        category: 'Rings',
        href: '/rings',
      },
    ],
  },
  {
    image: '/images/Model/annahita-salamat-tLfrkAggpGY-unsplash (1).jpg',
    alt: 'Model wearing Pendyora statement jewelry',
    dots: [
      {
        id: 'look2-necklace',
        x: 56,
        y: 40,
        label: 'Layered Gold Necklace',
        price: '$1,100',
        category: 'Necklaces',
        href: '/necklaces',
      },
      {
        id: 'look2-bracelet',
        x: 66,
        y: 69,
        label: 'Tennis Bracelet',
        price: '$1,800',
        category: 'Bracelets',
        href: '/bracelets',
      },
    ],
  },
];

function DotTooltip({ dot, side }: { dot: JewelryDot; side: 'left' | 'right' }) {
  return (
    <div
      className={`
        absolute z-20 w-[200px] bg-ivory border border-luxury/30 shadow-lg
        pointer-events-none
        ${side === 'right' ? 'right-[calc(100%+14px)]' : 'left-[calc(100%+14px)]'}
        top-1/2 -translate-y-1/2
      `}
    >
      <div className="px-4 py-3 flex flex-col gap-1">
        <span className="font-libre text-[10px] uppercase tracking-[1.5px] text-luxury">{dot.category}</span>
        <span className="font-cormorant text-[15px] text-primary leading-tight">{dot.label}</span>
        <span className="font-libre text-[13px] text-mocha">{dot.price}</span>
        <Link
          href={dot.href}
          className="pointer-events-auto mt-1 inline-block font-libre text-[10px] uppercase tracking-[1.5px] text-primary border-b border-primary pb-[1px] hover:text-luxury hover:border-luxury transition-colors"
        >
          Shop Now
        </Link>
      </div>
      <div
        className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-ivory border-luxury/30 rotate-45
          ${side === 'right' ? '-right-[7px] border-t border-r' : '-left-[7px] border-b border-l'}
        `}
      />
    </div>
  );
}

function LookImage({ look, index }: { look: LookItem; index: number }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <div className="relative w-full h-full overflow-visible">
      <div className="relative w-full h-full">
        <Image src={look.image} alt={look.alt} fill className="object-cover object-top" sizes="(max-width: 769px) 100vw, 50vw" />
      </div>

      {look.dots.map((dot) => {
        const isActive = activeId === dot.id;
        const tooltipSide = dot.x > 50 ? 'right' : 'left';

        return (
          <button
            key={dot.id}
            className="absolute z-10 group"
            style={{ left: `${dot.x}%`, top: `${dot.y}%`, transform: 'translate(-50%, -50%)' }}
            onMouseEnter={() => setActiveId(dot.id)}
            onMouseLeave={() => setActiveId(null)}
            onClick={() => setActiveId(isActive ? null : dot.id)}
            aria-label={dot.label}
          >
            <span
              className={`
                relative flex items-center justify-center
                w-5 h-5 rounded-full border-2 border-ivory bg-ivory/30 backdrop-blur-sm
                transition-all duration-300
                ${isActive ? 'scale-125 bg-luxury/60 border-luxury' : 'hover:scale-110 hover:bg-luxury/40 hover:border-luxury'}
              `}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-ivory" />
              <span
                className={`
                  absolute inset-0 rounded-full border-2 border-ivory/70
                  animate-ping opacity-0
                  ${!isActive ? 'opacity-60' : ''}
                `}
              />
            </span>

            {isActive && <DotTooltip dot={dot} side={tooltipSide} />}
          </button>
        );
      })}
    </div>
  );
}

export default function ShopByLook() {
  return (
    <section className="w-full py-[60px] lg:py-12 md:py-8 sm:py-6 bg-ivory">
      <div className="px-3">
        {/* <div className="flex flex-col items-start gap-2 mb-8 sm:mb-5">
          <p className="font-libre text-[11px] uppercase tracking-[2.5px] text-mocha">Curated Looks</p>
          <h2 className="font-cormorant text-[38px] lg:text-[32px] md:text-[28px] sm:text-[24px] uppercase tracking-[2px] text-primary leading-none">
            Shop The Look
          </h2>
        </div> */}

        <div className="flex gap-2 sm:flex-col sm:gap-3">
          {looks.map((look, index) => (
            <div key={index} className="relative w-1/2 sm:w-full aspect-[3/4] sm:aspect-[3/4]">
              <LookImage look={look} index={index} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
