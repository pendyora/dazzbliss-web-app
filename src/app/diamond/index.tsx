'use client';
import { useEffect, useState } from 'react';

import { Image } from 'antd';

import CustomSwiper from '@/components/CustomSwiper';
import { useAppSelector } from '@/store';

import DiamondsCard from './diamondCard';

// DAZZBLISS TODO: placeholder from the design set; replace with a Dazzbliss diamond photo.
// (Was hot-linked from a third-party jeweller's site.)
const DIAMOND_HERO_IMAGE = '/images/Model/editorial.jpg';

export default function DiamondsPage() {
  const masterData = useAppSelector((state) => state.master.data);

  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const diamondData = masterData?.filter((el: any) => el.parent_code == 'SHAPE' && el.is_web_visible == true);
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    setWindowWidth(window.innerWidth);

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="bg-paper font-libre">
      <div
        className={`flex bg-stone sm:hidden h-[660px] items-center justify-center py-48 2xl:h-[480px] xl:h-[380px] xl:py-8 lg:h-[280px] lg:py-8 md:h-auto md:py-5 sm:py-4`}
        style={{
          backgroundImage: `url('${DIAMOND_HERO_IMAGE}')`,
          backgroundSize: 'cover',
          // backgroundPosition: "center",
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="mx-auto flex w-full max-w-[1440px] justify-end px-[clamp(16px,3.2vw,56px)]">
          <div className="flex w-[37%] lg:w-[37%] md:w-[30%] flex-col items-start gap-[72px] 2xl:gap-[50px] xl:gap-[40px] lg:gap-[30px] md:gap-[40px] sm:gap-9 xl:w-[495px] h-fit xl:justify-center">
            <div className="flex flex-col items-start gap-[30px] self-stretch 2xl:gap-[20px] xl:gap-4 text-white "></div>
          </div>
        </div>
      </div>
      <div className="hidden flex-col sm:flex">
        <div className="flex h-[224px] w-full overflow-hidden bg-stone">
          <Image src={DIAMOND_HERO_IMAGE} preview={false} alt="Ring" rootClassName="!h-full !w-full" className="!h-full !w-full object-cover" />
        </div>
      </div>
      <section className="flex flex-col gap-8 py-[clamp(48px,6vw,96px)] sm:gap-5">
        <div className="grid justify-items-center gap-3 px-4 text-center">
          <span className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-gilt">Diamonds</span>
          <h1 className="m-0 font-cormorant text-[clamp(30px,3.2vw,48px)] font-medium leading-none text-ink">
            Shop by <em className="italic text-gilt">Shape</em>
          </h1>
        </div>

        <div className="mx-auto w-full max-w-[1440px] border-y border-line bg-stone px-5 md:py-0">
          <CustomSwiper
            products={diamondData}
            Component={DiamondsCard}
            currentSlide={currentSlide}
            onSlideChange={(newIndex: any) => {
              setCurrentSlide(newIndex?.realIndex);
            }}
            loop={true}
            style={{ padding: '60px 10px', margin: 'auto' }}
            centeredSlides={true}
            minimumProducts={windowWidth <= 425 ? 1 : 5}
            mobileSlidesPerView={windowWidth > 425 && windowWidth <= 768 ? 3 : 2.1}
            spaceBetween={'20px'}
            seeAllButton={false}
            isCenterZoom={true}
            speed={500}
          />
        </div>
      </section>
    </div>
  );
}
