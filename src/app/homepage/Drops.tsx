'use client';

import { useEffect, useState } from 'react';

const drop = {
  code: 'DR-01',
  name: 'Nocturne Chain',
  price: '$ 5,400',
  edition: 'of 24',
  img: '/images/model/editorial.jpg',
};

function useCountdown(target: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s };
}

export default function Drops() {
  const [target] = useState(() => Date.now() + 4 * 86400000 + 7 * 3600000 + 22 * 60000);
  const { d, h, m, s } = useCountdown(target);
  const cells: { v: number; l: string }[] = [
    { v: d, l: 'Days' },
    { v: h, l: 'Hours' },
    { v: m, l: 'Minutes' },
    { v: s, l: 'Seconds' },
  ];

  return (
    <section id="drops" className="relative bg-primary text-text_w overflow-hidden">
      {/* background pulses */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-luxury/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-luxury/15 blur-3xl" />
      </div>

      <div className="relative flex items-center justify-between md:flex-col">
        <div className="flex flex-col justify-center items-center p-4 gap-6 w-[45%] md:w-full text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-luxury flex items-center gap-3">
            <span className="h-2 w-2 bg-luxury rounded-full animate-pulse" /> Limited Drop · {drop.edition}
          </p>
          <h2 className="font-cormorant text-[clamp(2rem,5vw,5rem)] leading-[0.92] text-text_w">
            {drop.name.split(' ').map((w, i) => (
              <span key={i} className="inline-block mr-3">
                {i === 1 ? <span className="italic text-luxury">{w}</span> : w}
              </span>
            ))}
          </h2>
          <p className="max-w-md text-text_w/70 leading-relaxed">
            A single chain. Twenty-four numbered editions. Released at midnight, Florence time. Once gone, never reissued.
          </p>

          {/* countdown */}
          <div className="grid grid-cols-4 gap-2 max-w-md">
            {cells.map((c) => (
              <div key={c.l} className="bg-white/5 border aspect-square border-white/10 px-3 py-4 text-center">
                <p className="font-cormorant text-5xl lg:text-4xl md:text-3xl sm:text-2xl text-luxury tabular-nums leading-none">
                  {c.v.toString().padStart(2, '0')}
                </p>
                <p className="mt-2 text-[9px] uppercase tracking-[0.15em] text-text_w/60">{c.l}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-5">
            <a
              href="/virtual-appointment"
              className="group inline-flex items-center gap-3 bg-text_w text-primary px-8 py-4 text-[11px] uppercase tracking-[0.15em] hover:bg-luxury hover:text-text_w transition-all duration-500"
            >
              Reserve a number <span className="transition-transform group-hover:translate-x-1.5">→</span>
            </a>
            <a
              href="/contact-us"
              className="text-[11px] uppercase tracking-[0.15em] text-text_w/85 underline underline-offset-4 decoration-luxury/50 hover:decoration-luxury transition-all"
            >
              Drop archive
            </a>
          </div>
        </div>

        <div className="w-[55%] flex-shrink-0 md:w-full relative h-[90vh]">
          <div className="relative aspect-[3/4] overflow-hidden">
            <video src="/videos/model.mp4" autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-transparent to-primary/30" />
            <span className="absolute top-5 left-5 text-[10px] uppercase tracking-[0.15em] text-text_w/80">{drop.code}</span>
            <span className="absolute top-5 right-5 text-[10px] uppercase tracking-[0.15em] text-text_w/80">Edition {drop.edition}</span>
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between text-text_w">
              <p className="font-cormorant italic text-3xl md:text-2xl sm:text-xl max-w-xs">"Worn at midnight."</p>
              <p className="font-cormorant text-4xl md:text-3xl sm:text-2xl text-luxury tabular-nums">{drop.price}</p>
            </div>
            {/* corner accents */}
            {[
              'top-3 left-3 border-t border-l',
              'top-3 right-3 border-t border-r',
              'bottom-3 left-3 border-b border-l',
              'bottom-3 right-3 border-b border-r',
            ].map((c, i) => (
              <span key={i} className={`absolute h-5 w-5 border-luxury/60 ${c}`} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
