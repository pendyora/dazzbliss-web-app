const REVIEWS = [
  {
    name: 'Camille Auberge',
    role: 'Collector, Paris',
    rating: 5,
    text: 'The solitaire arrived with a hand-signed dossier. It feels like inheriting something rather than buying it.',
  },
  {
    name: 'Idris Walker',
    role: 'Architect, NYC',
    rating: 5,
    text: 'The cut tolerance is real. Light moves through the stone like it was engineered, not grown.',
  },
  {
    name: 'Yuki Tanaka',
    role: 'Editor, Tokyo',
    rating: 5,
    text: 'I rarely wear jewelry. I wear the Ashclair curb chain every day. It has weight in every sense.',
  },
  {
    name: 'Sofia Reyes',
    role: 'Curator, Madrid',
    rating: 5,
    text: "Ashclair doesn't perform luxury. It practices it. Quietly, precisely, and without theatre.",
  },
  { name: 'Mark Bellini', role: 'Investor, Milan', rating: 5, text: 'Better resale than my watch collection. And infinitely more pleasant to wear.' },
  { name: 'Anya Petrova', role: 'Photographer, Berlin', rating: 5, text: 'The packaging alone made me cry. The ring made me cry harder.' },
];

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);
  return <div className="w-11 h-11 rounded-full bg-primary text-text_w grid place-items-center font-cormorant text-sm flex-shrink-0">{initials}</div>;
}

function Card({ r }: { r: (typeof REVIEWS)[number] }) {
  return (
    <div className="w-[360px] shrink-0 bg-ivory border border-primary/10 p-7 transition-transform duration-500 hover:-translate-y-2 hover:shadow-[0_30px_60px_-30px_rgba(0,0,0,0.4)] lg:w-[300px] sm:w-[260px] sm:p-5">
      <div className="flex items-center gap-3">
        <Avatar name={r.name} />
        <div>
          <div className="font-cormorant text-lg leading-tight text-primary">{r.name}</div>
          <div className="text-[10px] uppercase tracking-[0.15em] text-primary/50 mt-1">{r.role}</div>
        </div>
      </div>
      <div className="mt-5 flex gap-0.5 text-primary">
        {Array.from({ length: r.rating }).map((_, i) => (
          <span key={i}>★</span>
        ))}
      </div>
      <p className="mt-4 text-sm leading-relaxed text-primary/75">"{r.text}"</p>
    </div>
  );
}

export default function Testimonials() {
  const loop = [...REVIEWS, ...REVIEWS];
  return (
    <section className="relative py-36 lg:py-28 md:py-20 sm:py-14 bg-cream overflow-hidden">
      <div className="mx-auto max-w-[1600px] px-10 lg:px-8 md:px-5 sm:px-3 flex items-end justify-between mb-14 lg:mb-10 md:mb-8 sm:mb-6">
        <div>
          <h2 className="font-cormorant text-7xl lg:text-5xl md:text-4xl sm:text-3xl mt-4 leading-[0.95] text-primary">
            Worn by the
            <br />
            <span className="italic font-light">discerning few.</span>
          </h2>
        </div>
        <div className="block sm:hidden text-[10px] uppercase tracking-[0.15em] text-primary/50">4.97 / 5 — verified collectors</div>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-section to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-section to-transparent z-10 pointer-events-none" />
        <div className="flex gap-6 w-max px-6" style={{ animation: 'marquee 30s linear infinite' }}>
          {loop.map((r, i) => (
            <Card key={i} r={r} />
          ))}
        </div>
      </div>
    </section>
  );
}
