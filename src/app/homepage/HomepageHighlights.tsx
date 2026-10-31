import React from 'react';

import Link from 'next/link';

type HomepageHighlightCard = {
  id?: string | number;
  title?: string;
  description?: string;
  link?: string;
  button_text?: string;
  is_active?: boolean;
};

type HomepageHighlightSection = {
  title?: string;
  subtitle?: string;
  status?: number;
};

type Props = {
  data?: {
    section?: HomepageHighlightSection | null;
    cards?: HomepageHighlightCard[];
  } | null;
};

const normalizeLink = (link?: string) => {
  if (!link) {
    return undefined;
  }
  const trimmed = link.trim();
  if (
    /^(https?:)?\/\//i.test(trimmed) ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:')
  ) {
    return trimmed;
  }
  return `/${trimmed}`;
};

export default function HomepageHighlights({ data }: Props) {
  const section = data?.section;
  const cards = (data?.cards || []).filter((card) => card.is_active !== false);

  if (!section || section.status !== 1 || cards.length === 0) {
    return null;
  }

  return (
    <section className="bg-paper font-libre text-ink">
      <div className="mx-auto grid w-full max-w-[1440px] gap-[clamp(28px,3.5vw,48px)] px-[clamp(16px,3.2vw,48px)] py-[clamp(56px,7vw,104px)]">
        <div className="grid justify-items-center gap-3.5 text-center">
          <h2 className="m-0 font-cormorant text-[clamp(30px,3.2vw,48px)] font-medium leading-none tracking-[-0.01em] text-ink">{section.title}</h2>
          {section.subtitle ? <p className="m-0 max-w-[60ch] text-[15px] leading-[1.65] text-ink-soft sm:text-[14px]">{section.subtitle}</p> : null}
        </div>

        <div className="grid w-full border-l border-t border-line" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(160px, 1fr))` }}>
          {cards.map((card, index) => {
            const normalizedLink = normalizeLink(card.link);
            // Plain solid text, no gradient clip or transform on hover: older iPad Safari (seen on an iPad 6th gen)
            // failed to repaint gradient-clipped numbers once a hover transition promoted the card to its own layer.
            const cardBody = (
              <div className="group flex h-full w-full flex-col items-center justify-center gap-2.5 border-b border-r border-line bg-paper px-6 py-[clamp(28px,3.5vw,48px)] text-center transition-colors duration-300 hover:bg-haze sm:gap-1.5 sm:px-3">
                <p className="m-0 font-cormorant text-[clamp(34px,3.6vw,52px)] font-medium leading-none text-navy">{card.title}</p>
                {card.description ? <p className="m-0 text-[10.5px] uppercase tracking-[0.16em] text-ink-soft">{card.description}</p> : null}
              </div>
            );

            return normalizedLink ? (
              <Link href={normalizedLink} key={card.id ?? index} className="h-full w-full cursor-pointer text-ink hover:text-ink">
                {cardBody}
              </Link>
            ) : (
              <div key={card.id ?? index} className="h-full w-full">
                {cardBody}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
