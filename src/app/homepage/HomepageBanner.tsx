/* eslint-disable import/order */
/* eslint-disable react-hooks/exhaustive-deps */
'use client';
// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/autoplay';
import BannerSwiper from './BannerSlider';

export default function HomepageBanner({ bannerData }: any) {
  return (
    <div>
      <BannerSwiper bannerData={bannerData} />
    </div>
  );
}
