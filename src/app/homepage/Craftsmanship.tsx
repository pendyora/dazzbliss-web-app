import React from 'react';

const pillars = [
  { n: '01', t: 'Hand-set', d: 'Every stone is placed by a single artisan, from setting to polish.' },
  { n: '02', t: 'Recycled gold', d: 'Solid 18k metal, refined from reclaimed sources only.' },
  { n: '03', t: 'Traceable diamonds', d: 'Lab-grown and ethically mined, certified at origin.' },
];

export default function Craftsmanship() {
  return (
    <section id="story" className="relative bg-primary text-ivory overflow-hidden">
      <div className="absolute inset-0">
        <video autoPlay muted loop playsInline className="h-full w-full object-cover">
          <source src="/videos/craftman.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/70 to-primary/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-transparent to-primary/60" />
      </div>

      <div className="relative mx-auto max-w-[1500px] px-6 md:px-5 py-32 md:py-20 grid md:grid-cols-1 grid-cols-12 gap-12">
        <div className="col-span-7 md:col-span-full">
          <span className="text-[10px] tracking-[0.25em] uppercase text-secondary font-sans">Craftsmanship · Est. Antwerp</span>
          <h2 className="mt-6 font-serif text-7xl md:text-4xl leading-[0.95] text-ivory">
            Hours, not <span className="italic text-secondary">minutes.</span>
          </h2>
          <p className="mt-8 max-w-xl text-ivory/75 text-lg leading-relaxed font-sans">
            A Pendyora piece passes through fourteen pairs of hands before it leaves the atelier. We measure quality in milligrams of gold and
            millimeters of patience — never in trends.
          </p>
          <a
            href="/about-us"
            className="mt-10 inline-flex items-center gap-3 border border-secondary text-secondary px-8 py-4 text-[11px] tracking-[0.3em] uppercase hover:bg-secondary hover:text-primary transition-colors font-sans"
          >
            Learn more
            <span>▷</span>
          </a>
        </div>

        <div className="col-span-5 md:col-span-full md:pl-0 pl-10 flex flex-col gap-8 justify-end">
          {pillars.map((p, i) => (
            <div key={p.n} className="border-t border-ivory/15 pt-6">
              <div className="flex items-baseline gap-6">
                <span className="font-serif text-3xl text-secondary">{p.n}</span>
                <div>
                  <h3 className="font-serif text-2xl text-ivory">{p.t}</h3>
                  <p className="mt-2 text-ivory/65 text-sm leading-relaxed font-sans">{p.d}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
