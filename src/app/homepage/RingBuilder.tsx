'use client';
import React, { useState } from 'react';

const metals = [
  {
    id: 'rose',
    label: 'Rose',
    img: '/images/Model/ring-rose.png',
    swatch: 'bg-[oklch(0.78_0.08_40)]',
  },
  {
    id: 'white',
    label: 'White',
    img: '/images/Model/ring-white.png',
    swatch: 'bg-[oklch(0.92_0.01_240)]',
  },
  {
    id: 'yellow',
    label: 'Yellow',
    img: '/images/Model/ring-yellow.png',
    swatch: 'bg-[oklch(0.85_0.12_85)]',
  },
];

const shapes = ['Round', 'Oval', 'Pear', 'Emerald', 'Princess'];
const settings = ['Solitaire', 'Halo', 'Pavé', 'Three-stone', 'Bezel'];

export default function RingBuilder() {
  const [metal, setMetal] = useState('rose');
  const [shape, setShape] = useState('Round');
  const [setting, setSetting] = useState('Solitaire');
  const active = metals.find((m) => m.id === metal)!;

  return (
    <section className="relative bg-ivory py-24 md:py-16 overflow-hidden">
      <div className="relative mx-auto max-w-[1500px] px-6 md:px-5 grid grid-cols-2 md:grid-cols-1 gap-12 items-center">
        {/* Left — controls */}
        <div>
          <span className="text-[10px] tracking-[0.25em] uppercase text-secondary font-sans">The Atelier</span>
          <h2 className="mt-4 font-serif text-6xl md:text-4xl text-primary leading-[0.95]">
            Compose your <span className="italic text-secondary">heirloom.</span>
          </h2>
          <p className="mt-6 text-mocha max-w-md leading-relaxed font-sans text-sm">
            Three choices. Infinite consequence. Begin with the metal — your ring evolves in front of you, in real time.
          </p>

          <div className="mt-10 space-y-8">
            <Group label="Metal">
              {metals.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMetal(m.id)}
                  className={`flex items-center gap-3 border px-4 py-3 transition-all font-sans text-[11px] tracking-[0.25em] uppercase ${
                    metal === m.id ? 'border-primary bg-ivory' : 'border-mocha/30 hover:border-primary'
                  }`}
                >
                  <span className={`h-5 w-5 rounded-full ring-1 ring-primary/10 ${m.swatch}`} />
                  {m.label} Gold
                </button>
              ))}
            </Group>

            <Group label="Diamond Shape">
              {shapes.map((s) => (
                <Chip key={s} active={shape === s} onClick={() => setShape(s)}>
                  {s}
                </Chip>
              ))}
            </Group>

            <Group label="Setting">
              {settings.map((s) => (
                <Chip key={s} active={setting === s} onClick={() => setSetting(s)}>
                  {s}
                </Chip>
              ))}
            </Group>
          </div>

          <div className="mt-12 flex items-center gap-6 flex-wrap">
            <button className="bg-primary text-ivory px-10 py-4 text-[11px] tracking-[0.3em] uppercase hover:bg-mocha transition-colors font-sans">
              Add to bag · From $1,860
            </button>
            <a href="#" className="text-[11px] tracking-[0.3em] uppercase text-mocha border-b border-mocha pb-1 font-sans">
              Save design
            </a>
          </div>
        </div>

        {/* Right — live preview */}
        <div className="relative aspect-square md:max-w-sm md:mx-auto w-full">
          <div className="absolute inset-[10%] rounded-full bg-cream shadow-xl" />
          <div
            className="absolute inset-[18%] rounded-full opacity-60"
            style={{
              background: 'radial-gradient(circle, #C9AE8A44 0%, #C9AE8A00 70%)',
            }}
          />

          {metals.map((m) => (
            <img
              key={m.id}
              src={m.img}
              alt=""
              aria-hidden
              loading="lazy"
              className="absolute inset-0 m-auto h-[80%] w-[80%] object-contain transition-all duration-700"
              style={{
                opacity: metal === m.id ? 1 : 0,
                transform: metal === m.id ? 'scale(1)' : 'scale(0.85)',
                filter: 'drop-shadow(0 40px 50px rgba(80,60,40,0.35))',
              }}
            />
          ))}

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-ivory/90 backdrop-blur-sm px-5 py-3 text-center whitespace-nowrap">
            <p className="text-[10px] tracking-[0.3em] uppercase text-mocha font-sans">
              {active.label} Gold · {shape} · {setting}
            </p>
            <p className="mt-1 font-serif text-lg text-primary">Live preview</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] tracking-[0.25em] uppercase text-secondary font-sans mb-3">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-[11px] tracking-[0.25em] uppercase border transition-colors font-sans ${
        active ? 'bg-primary text-ivory border-primary' : 'bg-transparent text-primary border-mocha/30 hover:border-primary'
      }`}
    >
      {children}
    </button>
  );
}
