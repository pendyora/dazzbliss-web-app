'use client';

import React, { useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { LuArrowRight, LuCheck } from 'react-icons/lu';

import type { Poster, PosterBanner, PosterLink } from './authPosters';

const EYEBROW = 'm-0 flex items-center gap-3 text-[10.5px] font-medium uppercase tracking-[0.24em] before:h-px before:w-7 before:bg-current';
const CTA = 'group/cta inline-flex items-center gap-3 border-b pb-1.5 text-[11px] font-medium uppercase tracking-[0.2em]';

function Cta({ link, dark }: { link: PosterLink; dark?: boolean }) {
  return (
    <Link href={link.href} className={`${CTA} ${dark ? 'border-ink text-ink' : 'border-gilt-soft text-noir-on'}`}>
      {link.label}
      <LuArrowRight className="h-3.5 w-3.5 transition-transform duration-300 ease-luxe group-hover/cta:translate-x-1" />
    </Link>
  );
}

/** Campaign half of an auth screen: image carousel, welcome-offer card, or a still life on stone. Hidden at ≤1024px. */
export default function AuthPoster({ poster }: { poster: Poster }) {
  const [active, setActive] = useState(0);

  if (poster.kind === 'still') {
    return (
      <aside aria-label="Featured" className="grid min-h-[620px] place-items-center bg-stone px-[clamp(24px,4vw,64px)] py-14 text-ink lg:hidden">
        <div className="grid max-w-[440px] justify-items-center gap-7 text-center">
          <figure className="relative m-0 aspect-[4/5] w-[min(320px,70%)] overflow-hidden bg-stone-deep">
            <Image src={poster.image} alt={poster.alt} fill sizes="320px" className="object-cover mix-blend-multiply" priority />
          </figure>
          <div>
            <p className={`${EYEBROW} mb-[18px] justify-center text-gilt after:h-px after:w-7 after:bg-current`}>{poster.eyebrow}</p>
            <h2 className="m-0 mb-3 font-cormorant text-[clamp(34px,3.4vw,50px)] font-normal leading-none [&_em]:italic [&_em]:text-gilt">
              {poster.title}
            </h2>
            <p className="m-0 mb-5 text-[13.5px] text-ink-soft">{poster.body}</p>
            <Cta link={poster.cta} dark />
          </div>
        </div>
      </aside>
    );
  }

  const slides =
    poster.kind === 'image'
      ? poster.slides
      : [{ image: poster.image, alt: poster.alt, eyebrow: '', title: null, body: '', cta: { label: '', href: '' } }];
  const isCarousel = slides.length > 1;

  return (
    <aside aria-label="Featured campaign" className="group relative min-h-[620px] overflow-hidden bg-noir text-noir-on lg:hidden">
      <span className="absolute left-[clamp(24px,4vw,64px)] top-6 z-[3] text-[10px] uppercase tracking-[0.22em] text-noir-on/75">{poster.tag}</span>

      {slides.map((slide, i) => (
        <div
          key={slide.image}
          aria-hidden={i !== active}
          className={`absolute inset-0 transition-opacity duration-[1100ms] ease-luxe ${i === active ? 'opacity-100' : 'opacity-0'}`}
        >
          <Image
            src={slide.image}
            alt={slide.alt}
            fill
            sizes="(max-width: 1024px) 0px, 55vw"
            priority={i === 0}
            className={`object-cover transition-transform duration-[7000ms] ease-linear ${i === active ? 'scale-100' : 'scale-[1.04]'}`}
          />
          <div
            className={`absolute inset-0 bg-gradient-to-b ${
              poster.kind === 'offer' ? 'from-transparent from-40% to-noir/55' : 'from-noir/5 from-35% to-noir/80'
            }`}
          />
          {slide.title && (
            <div className="absolute bottom-[clamp(64px,8vh,96px)] left-[clamp(24px,4vw,64px)] right-[clamp(24px,4vw,64px)] z-[2] max-w-[520px]">
              <p className={`${EYEBROW} mb-[18px] text-gilt-soft`}>{slide.eyebrow}</p>
              <h2 className="m-0 mb-4 font-cormorant text-[clamp(40px,4.4vw,68px)] font-normal leading-[0.98] tracking-[-0.01em] [&_em]:italic [&_em]:text-gilt-soft">
                {slide.title}
              </h2>
              <p className="m-0 mb-[26px] max-w-[400px] text-[14px] leading-[1.65] text-noir-on/80">{slide.body}</p>
              <Cta link={slide.cta} />
            </div>
          )}
        </div>
      ))}

      {poster.kind === 'offer' && (
        <div className="absolute bottom-[clamp(24px,4vw,56px)] left-[clamp(24px,4vw,64px)] z-[2] w-[min(400px,calc(100%-48px))] bg-paper px-8 pb-7 pt-[30px] text-ink">
          <p className={`${EYEBROW} text-gilt`}>{poster.offer.eyebrow}</p>
          <div className="my-3 flex items-start gap-1.5 font-cormorant text-[88px] font-normal leading-[0.8] [font-variant-numeric:lining-nums]">
            {poster.offer.value}
            <sup className="mt-1.5 text-[34px] leading-none">{poster.offer.unit}</sup>
            <span className="mb-2 ml-2 self-end text-[22px] italic text-ink-soft">{poster.offer.caption}</span>
          </div>
          <p className="m-0 mb-[18px] text-[13px] text-ink-soft">{poster.offer.body}</p>
          <ul className="m-0 grid list-none grid-cols-2 gap-x-4 gap-y-2.5 border-t border-line p-0 pt-4 text-[12px]">
            {poster.offer.perks.map((perk) => (
              <li key={perk} className="flex items-start gap-2">
                <LuCheck className="mt-0.5 h-3.5 w-3.5 flex-none text-gilt" />
                {perk}
              </li>
            ))}
          </ul>
        </div>
      )}

      {isCarousel && (
        <>
          <div role="tablist" aria-label="Choose slide" className="absolute bottom-8 left-[clamp(24px,4vw,64px)] z-[3] flex gap-2.5">
            {slides.map((slide, i) => (
              <button
                key={slide.image}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={`Slide ${i + 1}`}
                onClick={() => setActive(i)}
                className="relative h-3.5 w-11"
              >
                <span className="absolute left-0 top-1.5 h-[1.5px] w-full bg-noir-on/30" />
                {i === active && (
                  <span
                    key={active}
                    onAnimationEnd={() => setActive((active + 1) % slides.length)}
                    className="absolute left-0 top-1.5 h-[1.5px] animate-progress bg-noir-on group-hover:[animation-play-state:paused] motion-reduce:hidden"
                  />
                )}
              </button>
            ))}
          </div>
          <span className="absolute bottom-7 right-[clamp(24px,4vw,64px)] z-[3] font-cormorant text-[16px] italic text-noir-on/70">
            {String(active + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
          </span>
        </>
      )}
    </aside>
  );
}

/** The poster collapsed into a banner above the form, so the promotion survives on tablet and phone. */
export function AuthBanner({ banner }: { banner: PosterBanner }) {
  return (
    <Link
      href={banner.cta.href}
      className={`relative hidden overflow-hidden bg-noir text-noir-on lg:flex lg:items-end ${banner.slim ? '' : 'lg:min-h-[200px]'}`}
    >
      <Image src={banner.image} alt="" fill sizes="100vw" className="object-cover" />
      <div className={`absolute inset-0 ${banner.slim ? 'bg-noir/90' : 'bg-gradient-to-r from-noir/80 to-noir/10'}`} />
      {banner.slim ? (
        <div className="relative z-[1] flex w-full items-center justify-between gap-3.5 px-[clamp(16px,3.2vw,56px)] py-3.5">
          <b className="font-cormorant text-[19px] font-normal leading-tight">{banner.title}</b>
          <span className="shrink-0 border-b border-gilt-soft pb-1 text-[10.5px] uppercase tracking-[0.2em]">{banner.cta.label}</span>
        </div>
      ) : (
        <div className="relative z-[1] max-w-[420px] px-[clamp(16px,3.2vw,56px)] py-6">
          {banner.eyebrow && <p className={`${EYEBROW} mb-2.5 text-gilt-soft`}>{banner.eyebrow}</p>}
          <b className="mb-2.5 block font-cormorant text-[30px] font-normal leading-[1.05] [&_em]:italic [&_em]:text-gilt-soft">{banner.title}</b>
          <span className="border-b border-gilt-soft pb-1 text-[10.5px] uppercase tracking-[0.2em]">{banner.cta.label}</span>
        </div>
      )}
    </Link>
  );
}
