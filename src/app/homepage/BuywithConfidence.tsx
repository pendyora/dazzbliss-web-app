'use client';
import React, { useEffect, useState } from 'react';

import { Image } from 'antd';
import { Autoplay, Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import { Text } from './../../components';

// Import Swiper styles. This component is rendered on pages that have no other
// Swiper on them (About Us, Jewelry Care, FAQs), so it cannot rely on a sibling
// component pulling the stylesheet in -- without this the slides lose `display: flex`
// and collapse into a stack of 17px-wide slivers, leaving the row blank.
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/autoplay';

// import { Text } from '@/components';

const imageData = [
  { img: '/images/90-days-guarantee.png', title: '90-days-guarantee' },
  { img: '/images/american-express.png', title: 'american-express' },
  { img: '/images/authorize-net-no-bg.png', title: 'authorize-net-no-bg' },
  { img: '/images/yotpo.png', title: 'yotpo' },
  // The affirm SVG is tightly cropped, unlike the other logos which have padding baked
  // into the file, so scale it down to match them. Its swoosh arc also fills the top half
  // of the viewBox, which pushes the wordmark below the row the other logos sit on, so
  // nudge it back up onto that line.
  { img: '/images/affirm_logo.svg', title: 'affirm', className: 'scale-[0.7] translate-y-[-12px] sm:translate-y-[-8px]' },
  { img: '/images/30-day-return-policy.png', title: '30-day-return-policy' },
];

export default function BuyWithConfidence() {
  const [showNavigation, setShowNavigation] = useState(false);
  const [windowWidth, setWindowWidth] = useState<number>(0);
  useEffect(() => {
    setTimeout(() => {
      setShowNavigation(true);
    }, 300);
    setWindowWidth(window.innerWidth);

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  return (
    <div className="flex flex-col items-center justify-center pt-[30px] pb-[30px] lg:py-8 md:py-5 sm:py-4 sm:pb-2 border-b">
      <div className="container-xs flex flex-col items-center gap-[30px] xl:px-28 lg:px-20 md:px-5 sm:px-3 sm:gap-3 2xl:px-[160px]">
        <Text size="text5xl" as="p" className="uppercase tracking-[2.20px] md:text-[26px] sm:w-full sm:text-center lg:text-[22px]">
          Buy with Confidence
        </Text>
        <div className="flex sm:flex-col gap-8 self-stretch justify-center lg:gap-3 xl:gap-3 2xl:gap-4 sm:gap-2 ">
          <Swiper
            loop={true}
            navigation={showNavigation}
            spaceBetween={30}
            slidesPerView={windowWidth <= 425 ? 1 : windowWidth <= 768 && windowWidth > 425 ? 4 : windowWidth <= 1024 && windowWidth > 768 ? 6 : 6}
            modules={[Navigation, Autoplay]}
            className="mySwiper2 sm:max-w-[95vw] sm:!hidden [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:!hidden"
          >
            {imageData?.map((banner: any, index: number) => (
              <SwiperSlide key={index} className="">
                <div
                  key={index}
                  className="h-[85px] w-full !flex !justify-center !items-center grayscale opacity-50 hover:opacity-100 transition-all ease-in-out duration-[800ms] hover:grayscale-0"
                >
                  <Image src={banner?.img} preview={false} className={`flex w-full p-2 !h-[85px] object-contain ${banner?.className ?? ''}`} />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          {/* Portrait tablets use this mobile grid too: in the 4-up slider the next arrow sits on top of
              the last logo at 551-1024px portrait. */}
          <div className="!hidden sm:!grid [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:!grid grid-cols-3 gap-2 mt-2">
            {imageData?.map((banner: any, index: number) => (
              <div key={index} className="!h-[65px] w-full !flex !justify-center !items-center  transition-all ease-in-out duration-[800ms]">
                <Image src={banner?.img} preview={false} className={`flex w-full p-2 !h-[65px] object-contain ${banner?.className ?? ''}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
