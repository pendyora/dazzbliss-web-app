import React from 'react';

import { Text } from '../../components';
import HomepageGroup3338 from '../homepage/HomepageGroup3338';

export default function GiftguideFrame67() {
  return (
    <>
      <div className="flex flex-col items-center gap-[60px] xl:gap-[40px] lg:gap-[30px] sm:hidden">
        <div className="container-xs 2xl:px-[160px] mt-[60px]  xl:mt-[40px] lg:mt-[30px] xl:px-28 lg:px-20 md:px-5">
          <div className="flex items-center justify-between gap-5 md:flex-col">
            <Text size="text5xl" as="p" className="uppercase tracking-[2.20px] md:text-[26px] sm:text-[22px] lg:text-[22px]">
              GIFT GUIDE
            </Text>
            <Text as="p" size="textlg" className="w-[46%] !font-light leading-[34px] xl:w-[47%] lg:w-[47%] md:w-full text-justify ">
              Whether you’re celebrating a special occasion, expressing your love and appreciation, or simply looking to surprise someone with a
              meaningful gift, our curated collection has something for every moment.
            </Text>
          </div>
        </div>
        <div className="container-xs flex justify-center gap-2.5 self-stretch md:flex-col">
          {/* <Suspense fallback={<div>Loading feed...</div>}>
          {data.map((d, index) => (
            <UserProfile2 {...d} key={"group2603" + index} />
          ))}
        </Suspense> */}
          <HomepageGroup3338 />
        </div>
      </div>
      <div className="sm:flex flex-col items-center gap-3 hidden py-4">
        <div className="container-xs px-2">
          <div className="flex flex-col items-center justify-between gap-3 sm:gap-2">
            <Text size="text5xl" as="p" className="uppercase tracking-[2.20px]">
              GIFT GUIDE
            </Text>
            <Text as="p" size="textlg" className="px-4 !font-light leading-[14px] w-full text-center ">
              Whether you’re celebrating a special occasion, expressing your love and appreciation, or simply looking to surprise someone with a
              meaningful gift, our curated collection has something for every moment.
            </Text>
          </div>
        </div>
        <div className="container-xs flex justify-center gap-2.5 self-stretch flex-col">
          {/* <Suspense fallback={<div>Loading feed...</div>}>
          {data.map((d, index) => (
            <UserProfile2 {...d} key={"group2603" + index} />
          ))}
        </Suspense> */}
          <HomepageGroup3338 />
        </div>
      </div>
    </>
  );
}
