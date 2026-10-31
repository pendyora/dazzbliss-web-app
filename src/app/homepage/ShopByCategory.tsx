import React from 'react';

import { Image } from 'antd';
import Link from 'next/link';

import { Text } from '../../components';

const CATEGORY_HREFS = ['/engagement-rings', '/earrings', '/necklaces', '/bracelets'];

export default function ShopByCategory({ bannerData }: any) {
  // First 4 categories grouped into 2 cards of 2 images each
  const cardPairs: [number, number][] = [
    [0, 1],
    [2, 3],
  ];

  return (
    <div>
      {cardPairs.map(([a, b], cardIndex) => (
        <div
          key={cardIndex}
          className="w-full flex"
          style={{
            position: cardIndex === 0 ? 'sticky' : 'relative',
            top: 0,
            zIndex: cardIndex + 1,
            height: '100vh',
          }}
        >
          {[a, b].map((dataIndex, i) => (
            <Link
              key={i}
              href={bannerData?.[dataIndex]?.link || CATEGORY_HREFS[dataIndex]}
              className="group relative w-1/2 h-full overflow-hidden block"
            >
              <Image
                src={bannerData?.[dataIndex]?.image}
                preview={false}
                alt={bannerData?.[dataIndex]?.title || ''}
                loading="lazy"
                fallback="/images/ashclair_pdp_logo_image.svg"
                wrapperStyle={{ width: '100%', height: '100%', display: 'block' }}
                wrapperClassName="transition-transform duration-500 ease-in-out scale-105 group-hover:scale-100"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(0deg,rgba(0,0,0,0.45),transparent)] px-8 pb-10 pt-24">
                <Text size="text5xl" as="p" className="uppercase tracking-[1.50px] text-white">
                  {bannerData?.[dataIndex]?.title}
                </Text>
              </div>
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}
