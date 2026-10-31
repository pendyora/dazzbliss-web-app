import React from 'react';

import { Image } from 'antd';
import Link from 'next/link';

const TILE = 'group relative block h-[560px] w-1/2 overflow-hidden bg-stone md:h-[450px] sm:h-[350px] sm:w-full';
const IMG = '!h-full !w-full object-cover transition-transform duration-[1400ms] ease-luxe group-hover:scale-[1.03]';
const CTA =
  'absolute inset-x-0 bottom-[7%] z-[2] mx-auto inline-flex h-12 w-max min-w-[300px] items-center justify-center bg-paper px-8 text-[11.5px] font-medium uppercase tracking-[0.2em] text-ink transition-colors group-hover:bg-ink group-hover:text-paper sm:min-w-[80%]';

const CustomJewelryBanner = ({ data }: any) => {
  return (
    <div className="flex w-full items-start gap-0 sm:flex-col">
      <Link href={'/custom-jewelry?type=2&state=s'} className={TILE}>
        <Image
          src={`${data?.banner_image?.[0]?.image ? data?.banner_image?.[0]?.image : '/images/img_mask_group_33.png'} `}
          alt="Mask Group 33"
          preview={false}
          width={'100%'}
          height={'100%'}
          fallback="/images/img_mask_group_33.png"
          rootClassName="!block !h-full !w-full"
          className={IMG}
        />
        <span className={CTA}>START WITH A SETTING</span>
      </Link>
      <Link href={'/custom-jewelry?type=1&state=d'} className={TILE}>
        <Image
          src={`${data?.banner_image?.[1]?.image ? data?.banner_image?.[1]?.image : '/images/img_mask_group_39.png'}`}
          fallback="/images/img_mask_group_39.png"
          alt="Mask Group 33"
          preview={false}
          width={'100%'}
          height={'100%'}
          rootClassName="!block !h-full !w-full"
          className={IMG}
        />
        <span className={CTA}>START WITH A DIAMOND</span>
      </Link>
    </div>
  );
};

export default CustomJewelryBanner;
