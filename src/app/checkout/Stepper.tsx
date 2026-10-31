import React from 'react';

import { Text } from '@/components';

type Popes = {
  currentStep: number;
};

const Stepper = ({ currentStep }: Popes) => {
  return (
    <div className="w-full max-w-[1440px] pb-1">
      <div className="grid grid-cols-4 items-start gap-2 lg:gap-3">
        <div className="flex flex-col items-center justify-center gap-1">
          <Text
            as="p"
            size="texts"
            className="!text-text_w !bg-primary flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[14px] text-center text-[14px] font-normal uppercase lg:h-[20px] lg:w-[20px]"
          >
            1
          </Text>
          <Text
            as="p"
            size="texts"
            className="text-center text-[10px] font-normal uppercase text-black-900 sm:text-[10px] md:text-[12px] lg:text-[14px]"
          >
            Sign in
          </Text>
        </div>
        <div className={`flex flex-col items-center justify-center gap-1 ${currentStep >= 1 ? '' : 'opacity-30'} `}>
          <Text
            as="p"
            size="texts"
            className="!text-text_w !bg-primary flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[14px] text-center text-[14px] font-normal uppercase lg:h-[20px] lg:w-[20px]"
          >
            2
          </Text>
          <Text
            as="p"
            size="texts"
            className="text-center text-[10px] font-normal uppercase text-black-900 sm:text-[10px] md:text-[12px] lg:text-[14px]"
          >
            Billing
            <br className="hidden md:block" />
            address
          </Text>
        </div>

        <div className={`flex flex-col items-center justify-center gap-1 ${currentStep >= 2 ? '' : 'opacity-30'}`}>
          <Text
            as="p"
            size="texts"
            className="!text-text_w !bg-primary flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[14px] text-center text-[14px] font-normal uppercase lg:h-[20px] lg:w-[20px]"
          >
            3
          </Text>
          <Text
            as="p"
            size="texts"
            className="text-center text-[10px] font-normal uppercase text-black-900 sm:text-[10px] md:text-[12px] lg:text-[14px]"
          >
            Delivery
            <br className="hidden md:block" />
            address
          </Text>
        </div>

        <div className={`flex flex-col items-center justify-center gap-1 ${currentStep >= 3 ? '' : 'opacity-30'}`}>
          <Text
            as="p"
            size="texts"
            className="!text-text_w !bg-primary flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[14px] text-center text-[14px] font-normal uppercase lg:h-[20px] lg:w-[20px]"
          >
            4
          </Text>
          <Text
            as="p"
            size="texts"
            className="text-center text-[10px] font-normal uppercase text-black-900 sm:text-[10px] md:text-[12px] lg:text-[14px]"
          >
            payment
          </Text>
        </div>
      </div>
    </div>
  );
};

export default Stepper;
