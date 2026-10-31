import React from 'react';

import { Image } from 'antd';
import Link from 'next/link';

import { BRAND } from '@/config/brand';

import { Button, Text } from '../../components';

export default function BrandStory() {
  return (
    <div className="sm:mt-[5px]">
      <div className="flex justify-center py-20 xl:py-14 lg:py-8 md:py-5 sm:py-3">
        <div className="container-xs flex items-start justify-center 2xl:px-[160px] xl:px-28 lg:px-20  md:px-5 sm:hidden">
          <div className="flex w-full flex-col items-start gap-8 self-start">
            <Text size="text5xl" as="p" className="uppercase leading-[45px] tracking-[2.20px] md:text-[26px] lg:leading-9 sm:text-[22px]">
              <>
                {BRAND.nameUpper}
                <br />
                STORY
              </>
            </Text>
            <div className="w-[90%] h-1">
              <Image
                src="/images/img_jewelry_tima_mir.png"
                width={'100%'}
                preview={false}
                alt={`${BRAND.name} ring`}
                className="mx-auto h-full w-full object-contain"
              />
            </div>
          </div>
          <div className="flex w-full flex-col items-start gap-[94px] xl:gap-[60px] lg:gap-[30px] md:gap-[70px] sm:gap-[47px]">
            <Text size="textlg" as="p" className="w-[94%] !font-light leading-[34px] lg:leading-6 lg:w-full md:w-full">
              Fine diamond and gemstone jewelry, designed with care and made to be worn every day.
            </Text>
            <Image src="/images/img_jewelry_ring.png" preview={false} alt={`${BRAND.name} ring`} className="mx-auto h-full w-full object-contain" />
            <Link href="/about-us">
              <Button
                color="gray_800"
                shape="square"
                className="w-[348px] !h-[45px] tracking-[1.50px] 2xl:text-[16px] md:w-[280px] xl:text-[16px] lg:text-[14px] lg:!h-[37px]"
              >
                MORE ABOUT US
              </Button>
            </Link>
          </div>
        </div>

        {/* mobile design */}
        <div className="container-xs hidden sm:flex sm:flex-col items-center justify-center p-2 sm:px-3 gap-3">
          <div className="flex w-full flex-col justify-center items-center gap-3 sm:gap-2">
            <Text size="text5xl" as="p" className="">
              {BRAND.nameUpper} STORY
            </Text>
            <Text as="p" size="textlg" className=" !font-light leading-[14px] w-full text-center ">
              Fine diamond and gemstone jewelry, designed with care and made to be worn every day.
            </Text>
          </div>
          <div className="flex gap-3 justify-between box-border items-start">
            <Image
              src="/images/img_jewelry_tima_mir.png"
              width={184}
              preview={false}
              alt={`${BRAND.name} ring`}
              className="h-auto w-[49%] object-cover"
            />
            <Image
              src="/images/img_jewelry_ring.png"
              width={184}
              preview={false}
              alt={`${BRAND.name} ring`}
              className="h-auto w-[49%] object-cover"
            />
          </div>
          <Link href="/about-us">
            <Button
              color="gray_800"
              shape="square"
              className="w-[348px] !h-[45px] tracking-[1.50px] 2xl:text-[16px]  md:w-[280px] xl:text-[16px] lg:text-[14px] lg:!h-[37px]"
            >
              MORE ABOUT US
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
