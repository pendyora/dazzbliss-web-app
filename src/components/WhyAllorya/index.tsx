import React from 'react';

import { Text, Img } from '../';

/**
 * The five brand promises, shared so the checkout rail can lay them out its own way (dividers,
 * flanking rules) without a second copy of the list drifting out of step with the PDP's.
 */
export const whyAshclairBadges = [
  { src: 'img_close.svg', label: 'Finest Diamond & Gemstone' },
  { src: 'img_user.svg', label: 'Expert Support' },
  { src: 'img_calculator.svg', label: 'Free Shipping & Returns' },
  { src: 'img_home.svg', label: 'Shop Now Pay Later' },
  { src: 'img_signal.svg', label: '90 Days Warranty' },
];

// The compact card's default vertical pull, which tucks it under the PDP's action buttons.
// Callers that place the card inside their own padded panel (the cart / checkout summary rail)
// pass an empty string instead, so the card sits on that panel's own spacing.
const COMPACT_PDP_SPACING = '-mt-4 md:-mt-2 -mb-4 md:-mb-2';

export default function WhyAllorya({ compact = false, className = COMPACT_PDP_SPACING }: { compact?: boolean; className?: string }) {
  // Compact card variant — sized to fit inside the PDP options column (narrow on
  // desktop, full-width on mobile) directly under the action buttons.
  if (compact) {
    return (
      <div className={`w-full border bg-white px-4 py-6 sm:px-3 ${className}`}>
        <Text size="textmd" as="p" className="mb-5 text-center uppercase tracking-[1.5px] !text-secondary !text-[14px] sm:!text-[12px]">
          WHY ASHCLAIR?
        </Text>
        <div className="grid grid-cols-5 gap-x-2 gap-y-3">
          {whyAshclairBadges.map((badge, i) => (
            <div key={i} className="flex flex-col items-center gap-2 text-center">
              <Img src={badge.src} width={40} height={40} alt={badge.label} className="why-ashclair-icon h-7 w-7 object-contain sm:h-5 sm:w-5" />
              <Text size="textxs" as="p" className="uppercase leading-[1.3] tracking-[0.3px] !text-secondary !text-[10px] sm:!text-[8px]">
                {badge.label}
              </Text>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col items-center justify-center bg-primary py-[74px] 2xl:py-12 xl:py-10 lg:py-8 md:py-5 sm:py-4">
        <div className="container-xs mb-1 flex flex-col items-center gap-[50px] 2xl:px-[160px] xl:px-28 lg:px-20 md:px-4 sm:px-3 sm:gap-3 lg:gap-8">
          <Text size="text5xl" as="p" className="uppercase !text-text_w">
            WHY ASHCLAIR?
          </Text>
          <div className="flex w-full flex-wrap justify-evenly gap-y-10 sm:gap-y-3 md:justify-center xl:justify-between items-start">
            <div className="flex w-[16%] flex-col items-center gap-4 sm:gap-2 md:w-1/3 lg:w-[18%]">
              <Img
                src="img_close.svg"
                width={52}
                height={66}
                alt="Close"
                className="h-[45px] w-[45px] object-contain lg:h-[30px] lg:w-[30px] sm:h-5 sm:w-5"
              />
              <Text
                size="textxl"
                as="p"
                className="text-center uppercase leading-7 tracking-[2.40px] !text-text_w lg:text-[14px] sm:!text-[12px] sm:tracking-[1px] lg:leading-5"
              >
                <>Finest Diamond & Gemstone</>
              </Text>
            </div>
            <div className="flex w-[16%] flex-col items-center gap-4 sm:gap-2 md:w-1/3 lg:w-[18%]">
              <Img src="img_user.svg" width={60} height={60} alt="User" className="h-[45px] w-[45px] lg:h-[30px] lg:w-[30px] sm:h-5 sm:w-5" />
              <Text
                size="textxl"
                as="p"
                className="uppercase tracking-[2.40px] md:w-20 !text-text_w lg:text-[14px] lg:leading-5 sm:!text-[12px] sm:tracking-[1px] text-center"
              >
                Expert Support
              </Text>
            </div>
            <div className=" flex w-[16%] flex-col items-center gap-4 sm:gap-2 md:w-1/3 lg:w-[18%]">
              <Img
                src="img_calculator.svg"
                width={60}
                height={60}
                alt="Calculator"
                className="h-[45px] w-[45px] lg:h-[30px] lg:w-[30px] sm:h-5 sm:w-5"
              />
              <Text
                size="textxl"
                as="p"
                className="text-center uppercase leading-7 tracking-[2.40px] !text-text_w lg:text-[14px] sm:!text-[12px] sm:tracking-[1px] lg:leading-5"
              >
                <>
                  Free Shipping
                  <br />
                  and Returns
                </>
              </Text>
            </div>
            <div className="flex w-[16%] flex-col items-center gap-4 sm:gap-2 md:w-1/3 lg:w-[18%] ">
              <Img src="img_home.svg" width={60} height={56} alt="Home" className="h-[45px] w-[45px] lg:h-[30px] lg:w-[30px] sm:h-5 sm:w-5" />
              <Text
                size="textxl"
                as="p"
                className="text-center uppercase leading-7 tracking-[2.40px] !text-text_w lg:text-[14px] sm:!text-[12px] sm:tracking-[1px] lg:leading-5"
              >
                <>
                  Shop Now
                  <br />
                  Pay Later
                </>
              </Text>
            </div>
            <div className="flex w-[16%] flex-col items-center gap-4 sm:gap-2 md:w-1/3 lg:w-[18%]">
              <Img src="img_signal.svg" width={58} height={58} alt="Signal" className="h-[45px] w-[45px] lg:h-[30px] lg:w-[30px] sm:h-5 sm:w-5" />
              <Text
                size="textxl"
                as="p"
                className="text-center uppercase leading-7 tracking-[2.40px] !text-text_w lg:text-[14px] sm:!text-[12px] sm:tracking-[1px] lg:leading-5"
              >
                <>
                  90 Days
                  <br />
                  Warranty
                </>
              </Text>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
