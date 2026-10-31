import React from 'react';

import { Text } from '../../components';
import HomepageGroup3338 from '../homepage/HomepageGroup3338';

export default function GiftguideFrame67() {
  return (
    <>
      <div className="flex flex-col items-center sm:hidden my-[60px]  xl:my-[40px] lg:my-[30px]">
        <div className="w-full px-8 mb-[60px]  xl:mb-[40px] lg:mb-[30px] md:px-5">
          <div className="flex items-center justify-between gap-5 md:flex-col">
            <h2 className="font-cormorant text-3xl mt-4 leading-[0.95] text-primary">
              " Jewellery to live in. The finishing touches for effortless everyday style. "
            </h2>
          </div>
        </div>
        <div className="flex justify-center gap-2.5 self-stretch md:flex-col">
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
