import React from 'react';

import Link from 'next/link';

import { Text } from '../../components';

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
    <div className="mt-20 flex flex-col items-center lg:mt-10 2xl:mt-14 xl:mt-14 sm:mt-[20px]">
      <div className="container-xs flex flex-col items-center gap-[54px] 2xl:gap-9 xl:gap-9 lg:gap-7 sm:gap-3 2xl:px-[100px] xl:px-24 lg:px-20 md:px-5 sm:px-3 sm:py-3">
        <div className="flex flex-col items-center gap-4 text-center">
          <Text size="text9xl" as="p" className="!font-semibold tracking-tight text-primary sm:w-full sm:text-center sm:!text-[28px]">
            {section.title}
          </Text>
          {section.subtitle ? (
            <Text
              as="p"
              size="textxl"
              className="!font-normal leading-[30px] tracking-[0.2px] text-[#5c5c5c] max-w-[680px] sm:text-center sm:leading-[24px]"
            >
              {section.subtitle}
            </Text>
          ) : null}
        </div>

        <div className="grid w-full gap-6 sm:gap-3" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(140px, 1fr))` }}>
          {cards.map((card, index) => {
            const normalizedLink = normalizeLink(card.link);
            // Tablets (551-1024px): older iPad Safari (seen on an iPad 6th gen) fails to repaint gradient-clipped
            // text inside these rounded, overflow-hidden cards once the hover transition promotes them to their
            // own layer — the numbers vanish and ghost copies paint over the sections around them. There the
            // number is solid brand green and the hover lift (meaningless on touch) is switched off.
            const cardBody = (
              <div className="group relative flex h-full w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-solid border-[#ececec] bg-white px-6 py-10 text-center shadow-[0_1px_4px_rgba(0,0,0,0.04)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-[0_16px_32px_-8px_rgba(24,56,29,0.18)] [@media(min-width:551px)_and_(max-width:1024px)]:transition-none [@media(min-width:551px)_and_(max-width:1024px)]:hover:transform-none sm:gap-1.5 sm:rounded-xl sm:px-3 sm:py-6">
                <Text
                  as="p"
                  size="text8xl"
                  className="!font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent sm:!text-[28px] [@media(min-width:551px)_and_(max-width:1024px)]:bg-none [@media(min-width:551px)_and_(max-width:1024px)]:text-primary"
                >
                  {card.title}
                </Text>
                {card.description ? (
                  <Text as="p" size="textxs" className="uppercase tracking-[1.5px] text-[#666]">
                    {card.description}
                  </Text>
                ) : null}
              </div>
            );

            return normalizedLink ? (
              <Link href={normalizedLink} key={card.id ?? index} className="h-full w-full cursor-pointer">
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
    </div>
  );
}
