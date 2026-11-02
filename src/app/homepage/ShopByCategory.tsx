import React from 'react';

import { Image } from 'antd';
import Link from 'next/link';

import { BRAND } from '@/config/brand';

import { Text } from '../../components';

// Fallback page per jewelry type code, for banners saved without a link.
const CATEGORY_LINKS: Record<string, string> = {
  RINGS: '/rings',
  ENGAGEMENT_RINGS: '/engagement-rings',
  WEDDING_BANDS: '/wedding-bands',
  EARRINGS: '/earrings',
  NECKLACE: '/necklaces',
  BRACELET: '/bracelets',
};
// Not shown in Shop by Category, even if an older banner saved an image for it.
const EXCLUDED_CODES = ['CUSTOM_ENGAGEMENT_RINGS'];

const hrefFor = (item: any) =>
  item?.link || CATEGORY_LINKS[item?.code] || (item?.code ? `/${String(item.code).toLowerCase().replace(/_/g, '-')}` : '/all');

// Shop by Category: every category given an image in Admin → CMS → Banner (in the admin's order), two per
// full-screen card; an odd last one fills its card.
export default function ShopByCategory({ bannerData }: any) {
  const items: any[] = (Array.isArray(bannerData) ? bannerData : []).filter((e: any) => e?.image && !EXCLUDED_CODES.includes(e?.code));
  if (items.length === 0) {
    return null;
  }

  const cards: any[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    cards.push(items.slice(i, i + 2));
  }

  return (
    <div>
      {cards.map((card, cardIndex) => (
        <div
          key={cardIndex}
          className="w-full flex"
          style={{
            position: cardIndex < cards.length - 1 ? 'sticky' : 'relative',
            top: 0,
            zIndex: cardIndex + 1,
            height: '100vh',
          }}
        >
          {card.map((item, i) => (
            <Link
              key={item?.code || item?.id || i}
              href={hrefFor(item)}
              className={`group relative ${card.length === 1 ? 'w-full' : 'w-1/2'} h-full overflow-hidden block`}
            >
              <Image
                src={item?.image}
                preview={false}
                alt={item?.title || ''}
                loading="lazy"
                fallback={BRAND.logo.monogram}
                wrapperStyle={{ width: '100%', height: '100%', display: 'block' }}
                wrapperClassName="transition-transform duration-500 ease-in-out scale-105 group-hover:scale-100"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(0deg,rgba(0,0,0,0.45),transparent)] px-8 pb-10 pt-24">
                <Text size="text5xl" as="p" className="uppercase tracking-[1.50px] text-white">
                  {item?.title}
                </Text>
              </div>
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}
