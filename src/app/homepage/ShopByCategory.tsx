import React from 'react';

import { Col, Image, Row } from 'antd';
import Link from 'next/link';

import { Text } from '../../components';

export default function ShopByCategory({ bannerData }: any) {
  return (
    <div className="flex flex-col items-center justify-center py-[74px] lg:py-8 md:py-5 sm:py-4 sm:pb-2">
      <div className="container-xs flex flex-col items-start gap-[30px] xl:px-28 lg:px-20 md:px-5 sm:px-3 sm:gap-3 2xl:px-[160px]">
        <Text size="text5xl" as="p" className="uppercase tracking-[2.20px] md:text-[26px] sm:w-full sm:text-center lg:text-[22px]">
          shop by category
        </Text>
        <div className="flex sm:flex-col gap-2 self-stretch justify-center lg:gap-2 xl:gap-2 2xl:gap-2 sm:gap-2 ">
          <Link href={`/engagement-rings`} className="w-1/2 aspect-square sm:w-full sm:aspect-[2/1]">
            <div className="flex cursor-pointer aspect-square sm:aspect-[2/1] h-auto relative flex-col items-center justify-center  w-full">
              <Image
                src={`${bannerData?.[0]?.image ? bannerData?.[0]?.image : '/images/img_frame_34.png'}`}
                preview={false}
                alt="New arrivals"
                loading="lazy"
                fallback="/images/ashclair_pdp_logo_image.svg"
                width={'100%'}
                className="h-full w-full object-cover aspect-square bg-[#f8f8f8]"
              />
              <Text
                size="text5xl"
                as="p"
                className="absolute uppercase bg-[linear-gradient(0deg,rgba(255,255,255,0.4),transparent)] w-full tracking-[1.50px] bottom-[0px] py-5 pl-[30px] md:!text-[20px] md:pl-3 md:py-3 sm:left-0 sm:bottom-0"
              >
                Engagement Rings
              </Text>
            </div>
          </Link>
          <div className="w-1/2 grid grid-cols-2 gap-2 aspect-square sm:w-full ">
            <div className={` relative aspect-square `}>
              <Link href={`/earrings`} className={`flex relative aspect-square`}>
                <Image
                  src={bannerData?.[1]?.image}
                  alt="Ashclair Diam"
                  preview={false}
                  loading="lazy"
                  fallback="/images/ashclair_pdp_logo_image.svg"
                  width={'100%'}
                  className="flex !h-full !w-full object-cover bg-[#f8f8f8]"
                />
                <Text
                  size="text5xl"
                  as="p"
                  className="absolute uppercase bg-[linear-gradient(0deg,rgba(255,255,255,0.4),transparent)] w-full tracking-[1.50px] bottom-[0px] py-5 pl-[30px] md:!text-[20px] md:pl-3 md:py-3 sm:left-0 sm:bottom-0"
                >
                  {bannerData?.[1]?.title}
                </Text>
              </Link>
            </div>
            <div className={` relative  aspect-square`}>
              <Link href={`/necklaces`} className={`flex relative aspect-square`}>
                <Image
                  src={bannerData?.[2]?.image}
                  alt="Ashclair Diam"
                  loading="lazy"
                  fallback="/images/ashclair_pdp_logo_image.svg"
                  preview={false}
                  width={'100%'}
                  className=" h-full w-full aspect-square object-cover bg-[#f8f8f8]"
                />
                <Text
                  size="text5xl"
                  as="p"
                  className="absolute uppercase bg-[linear-gradient(0deg,rgba(255,255,255,0.4),transparent)] w-full tracking-[1.50px] bottom-[0px] py-5 pl-[30px] md:!text-[20px] md:pl-3 md:py-3 sm:left-0 sm:bottom-0"
                >
                  {bannerData?.[2]?.title}
                </Text>
              </Link>
            </div>

            <div className={` relative aspect-square`}>
              <Link href={`/bracelets`} className={`flex relative aspect-square`}>
                <Image
                  src={bannerData?.[3]?.image}
                  alt="Ashclair Diam"
                  loading="lazy"
                  fallback="/images/ashclair_pdp_logo_image.svg"
                  preview={false}
                  width={'100%'}
                  className=" h-full w-full aspect-square object-cover bg-[#f8f8f8]"
                />
                <Text
                  size="text5xl"
                  as="p"
                  className="absolute uppercase bg-[linear-gradient(0deg,rgba(255,255,255,0.4),transparent)]  w-full tracking-[1.50px] bottom-[0px] py-5 pl-[30px] md:!text-[20px] md:pl-3 md:py-3 sm:left-0 sm:bottom-0"
                >
                  {bannerData?.[3]?.title}
                </Text>
              </Link>
            </div>
            <div className={` relative  aspect-square`}>
              <Link href={`/engagement-rings`} className={`flex relative aspect-square`}>
                <Image
                  src={bannerData?.[4]?.image}
                  alt="Ashclair Diam"
                  preview={false}
                  loading="lazy"
                  fallback="/images/ashclair_pdp_logo_image.svg"
                  width={'100%'}
                  className=" !h-full !w-full aspect-square object-cover bg-[#f8f8f8]"
                />
                <Text
                  size="text5xl"
                  as="p"
                  className="absolute uppercase bg-[linear-gradient(0deg,rgba(255,255,255,0.4),transparent)] w-full tracking-[1.50px] bottom-[0px] py-5 pl-[30px] md:!text-[20px] md:pl-3 md:py-3 sm:left-0 sm:bottom-0"
                >
                  {bannerData?.[4]?.title}
                </Text>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
