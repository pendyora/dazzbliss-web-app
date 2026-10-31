import React from 'react';

import { Img, Text } from '../../components';

export default function FeaturedIn() {
  return (
    <div className="container-xs grid grid-cols-5 justify-center px-[78px] py-[74px] xl:grid-cols-4 2xl:px-[160px] xl:px-28 xl:py-14 lg:grid-cols-4 lg:px-20 lg:py-10 md:grid-cols-4 md:p-5 sm:grid-cols-1 sm:p-4">
      <Text size="text5xl" as="p" className="w-fit uppercase tracking-[2.20px] md:text-[26px] sm:text-[22px] whitespace-nowrap ">
        FEATURED IN
      </Text>
      <div className="grid grid-cols-4 xl:col-span-3 col-span-4 gap-x-10 gap-y-10">
        <Img
          src="img_vogue_revista_logo.png"
          width={262}
          height={68}
          alt="Vogue Revista Logo"
          className="h-[50px] w-full object-cover opacity-[0.29] lg:h-auto md:h-auto"
        />
        <Img
          src="img_vogue_revista_logo.png"
          width={262}
          height={68}
          alt="Vogue Revista Logo"
          className="h-[50px] w-full object-cover opacity-[0.29] lg:h-auto md:h-auto"
        />
        <Img
          src="img_vogue_revista_logo.png"
          width={262}
          height={68}
          alt="Vogue Revista Logo"
          className="h-[50px] w-full object-cover opacity-[0.29] lg:h-auto md:h-auto"
        />
        <Img
          src="img_vogue_revista_logo.png"
          width={262}
          height={68}
          alt="Vogue Revista Logo"
          className="h-[50px] w-full object-cover opacity-[0.29] lg:h-auto md:h-auto"
        />
        <Img
          src="img_vogue_revista_logo.png"
          width={262}
          height={68}
          alt="Vogue Revista Logo"
          className="h-[50px] w-full object-cover opacity-[0.29] lg:h-auto md:h-auto"
        />
        <Img
          src="img_vogue_revista_logo.png"
          width={262}
          height={68}
          alt="Vogue Revista Logo"
          className="h-[50px] w-full object-cover opacity-[0.29] lg:h-auto md:h-auto"
        />
        <Img
          src="img_vogue_revista_logo.png"
          width={262}
          height={68}
          alt="Vogue Revista Logo"
          className="h-[50px] w-full object-cover opacity-[0.29] lg:h-auto md:h-auto"
        />
        <Img
          src="img_vogue_revista_logo.png"
          width={262}
          height={68}
          alt="Vogue Revista Logo"
          className="h-[50px] w-full object-cover opacity-[0.29] lg:h-auto md:h-auto"
        />
      </div>
    </div>
  );
}
