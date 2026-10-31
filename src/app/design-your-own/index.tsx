import React from 'react';

import { Image } from 'antd';

import { decrypt } from './../../utils/enc-decy';
import CustomJewelryBanner from './components/CustomjewelryBanner';
import CustomjewelryGroup2788 from './CustomjewelryGroup2788';
import { Text } from '../../components';

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
export default async function CUSTOMJEWELRYPage() {
  const initialBanner = await getBannerData();
  return (
    <div className="w-full bg-[#ffffff]">
      <div className="">
        <CustomJewelryBanner data={initialBanner} />
        <div>
          <div className="flex items-center sm:flex-col-reverse sm:gap-3  2xl:gap-[160px] xl:gap-28 lg:gap-20 md:gap-1">
            <div className="h-[560px] flex w-[50%] sm:w-full sm:h-auto ">
              <Image
                src="/images/img_tahlia_doyle_r1_560x960.png"
                preview={false}
                alt="Tahlia Doyle R1"
                className="object-cover sm:object-contain !h-full"
              />
            </div>
            <div className="flex flex-1 flex-col items-center 2xl:pl-0 2xl:items-start gap-20 px-14 2xl:gap-14 xl:gap-10  lg:gap-8 md:gap-[60px]  md:px-5 sm:px-3 sm:gap-2">
              <Text size="text5xl" as="p" className="uppercase leading-[59px] sm:!text-[16px] sm:leading-[30px] sm:mt-3">
                <>
                  DESIGN YOUR OWN <br />
                  JEWELRY IN 3 SIMPLE STEPS
                </>
              </Text>
              <Text
                size="textlg"
                as="p"
                className="w-[76%] sm:w-full !font-['Inter'] !font-light leading-8 xl:w-[80%]  text-justify  sm:!text-[13px]"
              >
                Buying the right type of jewelry for a special occasion is a daunting task but at Ashclair, we now have a convenient solution. It is
                now possible to design your own jewelry by collaborating with our highly talented team of designers and craftsmen. Whether you are
                looking for the ideal engagement ring wedding ring anniversary ring trio ring set or any other kind of ring, we got you covered.
              </Text>
            </div>
          </div>
          <div className="flex items-center sm:flex-col ">
            <div className="flex flex-1 flex-col items-center gap-20 px-14 2xl:gap-14 xl:gap-10 lg:gap-8 md:gap-[60px] md:self-stretch md:px-5 sm:px-3 sm:gap-2">
              <Text size="text5xl" as="p" className="w-[76%] sm:w-full uppercase leading-[59px] xl:w-[80%] sm:leading-[30px] sm:!text-[16px] sm:mt-3">
                WHY CUSTOM JEWELRY DESIGN
              </Text>
              <Text size="textlg" as="p" className="w-[76%] sm:w-full !font-['Inter'] !font-light leading-8 xl:w-[80%] sm:!text-[13px] text-justify ">
                Our team at Ashclair is committed to bringing your ring design idea to life at the most affordable price. Through our long experience
                in the industry and our commitment to quality jewelry, we have consistently exceeded the expectations of clients. We invite you to
                design your jewelry with us to save time and money.
              </Text>
            </div>
            <div className="h-[560px] flex w-[50%] sm:w-full sm:h-auto  sm:mt-3">
              <Image
                src="/images/img_tahlia_doyle_r_1_1.png"
                preview={false}
                alt="Tahlia Doyle R 1"
                className="sm:object-contain object-cover !h-full"
              />
            </div>
          </div>
          <div className="border-b py-[60px] md:py-5 sm:py-5">
            <CustomjewelryGroup2788 />
          </div>
        </div>
      </div>
    </div>
  );
}
