import React from 'react';

import { Image } from 'antd';

import { BRAND } from '@/config/brand';

import { decrypt } from './../../utils/enc-decy';
import CustomJewelryBanner from './components/CustomjewelryBanner';
import CustomjewelryGroup2788 from './CustomjewelryGroup2788';

async function getBannerData() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/banner/3`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
      // cache: 'no-store',
      next: { revalidate: 10 }, // Cache for 10 ms
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: any = await response.json();

    if (data.status === 200) {
      const banner = decrypt(data.data);
      return banner;
    }
    return null;
  } catch (error) {
    console.error('Error fetching banner data:', error);
    return null;
  }
}

const KICKER = 'text-[10.5px] font-medium uppercase tracking-[0.22em] text-gilt';
const H2 = 'm-0 font-cormorant text-[clamp(30px,3.2vw,48px)] font-medium leading-[1.05] text-ink';
const BODY = 'm-0 max-w-[560px] text-[15px] leading-[1.75] text-ink-soft sm:text-[14px]';
const MEDIA = 'flex h-[560px] w-1/2 overflow-hidden bg-stone md:h-[460px] sm:h-auto sm:w-full';

export default async function CUSTOMJEWELRYPage() {
  const initialBanner = await getBannerData();
  return (
    <div className="w-full bg-paper font-libre">
      <header className="mx-auto grid max-w-[1440px] justify-items-center gap-3 px-[clamp(16px,3.2vw,56px)] pb-10 pt-14 text-center md:pb-8 md:pt-10">
        <span className={KICKER}>Custom jewelry</span>
        <h1 className="m-0 font-cormorant text-[clamp(34px,4vw,60px)] font-medium leading-none text-ink">
          Design your <em className="italic text-gilt">own</em>
        </h1>
        <p className="m-0 max-w-[520px] text-[14px] leading-[1.65] text-ink-soft">Begin with a setting or a diamond.</p>
      </header>
      <CustomJewelryBanner data={initialBanner} />
      <section className="flex items-center gap-[clamp(32px,6vw,120px)] pt-[clamp(48px,6vw,96px)] sm:flex-col-reverse sm:gap-6">
        <div className={MEDIA}>
          <Image
            src="/images/img_tahlia_doyle_r1_560x960.png"
            preview={false}
            rootClassName="!h-full !w-full"
            alt="Tahlia Doyle R1"
            className="!h-full !w-full object-cover sm:object-contain"
          />
        </div>
        <div className="flex flex-1 flex-col items-start gap-6 pr-[clamp(16px,3.2vw,56px)] sm:px-4">
          <span className={KICKER}>Three simple steps</span>
          <h2 className={H2}>
            Design your own <br />
            jewelry in 3 simple <em className="italic text-gilt">steps</em>
          </h2>
          <p className={BODY}>
            Buying the right type of jewelry for a special occasion is a daunting task but at {BRAND.name}, we now have a convenient solution. It is
            now possible to design your own jewelry by collaborating with our highly talented team of designers and craftsmen. Whether you are looking
            for the ideal engagement ring wedding ring anniversary ring trio ring set or any other kind of ring, we got you covered.
          </p>
        </div>
      </section>
      <section className="flex items-center gap-[clamp(32px,6vw,120px)] pt-[clamp(48px,6vw,96px)] sm:flex-col sm:gap-6">
        <div className="flex flex-1 flex-col items-start gap-6 pl-[clamp(16px,3.2vw,56px)] sm:px-4">
          <span className={KICKER}>Made for you</span>
          <h2 className={H2}>
            Why custom jewelry <em className="italic text-gilt">design</em>
          </h2>
          <p className={BODY}>
            Our team at {BRAND.name} is committed to bringing your ring design idea to life at the most affordable price. Through our long experience
            in the industry and our commitment to quality jewelry, we have consistently exceeded the expectations of clients. We invite you to design
            your jewelry with us to save time and money.
          </p>
        </div>
        <div className={MEDIA}>
          <Image
            src="/images/img_tahlia_doyle_r_1_1.png"
            preview={false}
            rootClassName="!h-full !w-full"
            alt="Tahlia Doyle R 1"
            className="!h-full !w-full object-cover sm:object-contain"
          />
        </div>
      </section>
      <section className="border-b border-line py-[clamp(48px,6vw,96px)]">
        <CustomjewelryGroup2788 />
      </section>
    </div>
  );
}
