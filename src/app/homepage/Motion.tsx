'use client';

import { useEffect, useRef, useState } from 'react';

const stages = [
  { t: 'Rough', d: 'A stone is born.', img: '/images/img_ashclair_diam.png' },
  { t: 'Cut', d: 'Geometry of light.', img: '/images/img_polished_diamond.png' },
  { t: 'Set', d: 'Held by hand.', img: '/images/img_aliceconti_ring_430x430.png' },
  { t: 'Worn', d: 'Becoming yours.', img: '/images/img_ashclair_ring.png' },
];

export default function Motion() {
  const ref = useRef<HTMLElement | null>(null);
  const [p, setP] = useState(0);

  useEffect(() => {
    const onS = () => {
      const el = ref.current;
      if (!el) {
        return;
      }
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = el.offsetHeight - vh;
      const scrolled = Math.min(Math.max(-r.top, 0), Math.max(total, 1));
      setP(scrolled / Math.max(total, 1));
    };
    onS();
    window.addEventListener('scroll', onS, { passive: true });
    return () => window.removeEventListener('scroll', onS);
  }, []);

  const idx = Math.min(stages.length - 1, Math.floor(p * stages.length * 0.999));
  const localP = p * stages.length - idx;
  const zoom = 1 + p * 1.6;
  const rotate = p * 540;

  return (
    <section ref={ref} className="relative bg-ivory" style={{ height: '320vh' }} aria-label="Jewelry in motion">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Background diamond zoom */}
        <div className="absolute inset-0 grid place-items-center pointer-events-none" style={{ transform: `scale(${zoom})`, opacity: 1 - p * 0.4 }}>
          <svg viewBox="0 0 200 200" className="w-[40vw] max-w-[600px]" style={{ color: 'rgba(201,174,138,0.2)' }}>
            <polygon points="100,10 180,80 100,190 20,80" fill="none" stroke="currentColor" strokeWidth="0.6" />
            <polygon points="100,10 60,80 140,80" fill="none" stroke="currentColor" strokeWidth="0.6" />
            <polygon points="20,80 60,80 100,190" fill="none" stroke="currentColor" strokeWidth="0.6" />
            <polygon points="180,80 140,80 100,190" fill="none" stroke="currentColor" strokeWidth="0.6" />
            <line x1="60" y1="80" x2="100" y2="190" stroke="currentColor" strokeWidth="0.4" />
            <line x1="140" y1="80" x2="100" y2="190" stroke="currentColor" strokeWidth="0.4" />
          </svg>
        </div>

        {/* Sweeping label */}
        <div className="absolute top-10 left-0 right-0 px-12 lg:px-8 md:px-5 sm:px-3 flex items-center justify-between text-[10px] uppercase tracking-[0.15em] text-primary/60 z-20">
          <span>Jewelry in motion — Vol. I</span>
          <span className="tabular-nums">{Math.round(p * 100)}%</span>
        </div>

        {/* Stage container */}
        <div className="absolute inset-0 grid grid-cols-2 sm:grid-cols-1 items-center container-xs 2xl:px-[160px] xl:px-24 lg:px-20 md:px-5 sm:px-3">
          {/* Rotating image */}
          <div className="relative aspect-square max-h-[70vh] mx-auto w-[70%] sm:w-[85%]">
            {stages.map((s, i) => (
              <img
                key={s.t}
                src={s.img}
                alt={s.t}
                className="absolute inset-0 h-full w-full object-cover rounded-full will-change-transform"
                style={{
                  opacity: i === idx ? 1 : 0,
                  transform: `rotate(${rotate + i * 90}deg) scale(${i === idx ? 1 : 0.92})`,
                  transition: 'opacity 700ms ease, transform 900ms ease',
                  boxShadow: '0 0 0 1px rgba(17,17,17,0.1)',
                }}
              />
            ))}
            {/* orbit rings */}
            <span className="absolute -inset-8 rounded-full border border-luxury/30" />
            <span className="absolute -inset-16 rounded-full border border-primary/10 block sm:hidden" />
          </div>

          {/* Text + stage labels */}
          <div className="relative pl-16 md:pl-0 mt-0 md:mt-8 sm:mt-6">
            <p className="text-[11px] uppercase tracking-[0.2em] text-luxury mb-6">Stage {String(idx + 1).padStart(2, '0')} / 04</p>
            <h2
              className="font-cormorant text-[clamp(3rem,8vw,8rem)] leading-[0.9] text-primary"
              style={{
                transform: `translateY(${(1 - localP) * 20}px)`,
                opacity: 0.6 + localP * 0.4,
              }}
            >
              {stages[idx].t}.
            </h2>
            <p className="font-cormorant italic text-3xl md:text-2xl sm:text-xl mt-4 text-primary/80">{stages[idx].d}</p>

            <div className="mt-12 flex items-center gap-4">
              {stages.map((s, i) => (
                <div key={s.t} className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${i === idx ? 'bg-luxury' : 'bg-primary/20'}`} />
                  <span className={`text-[10px] uppercase tracking-[0.15em] ${i === idx ? 'text-primary' : 'text-primary/40'}`}>{s.t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-primary/10">
          <div className="h-full bg-luxury transition-all duration-75" style={{ width: `${p * 100}%` }} />
        </div>
      </div>
    </section>
  );
}
