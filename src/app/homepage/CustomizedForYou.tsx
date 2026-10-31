import React from 'react';

import { Image } from 'antd';
import Link from 'next/link';

import { Text, Button } from '@/components';

export default function CustomizedForYou() {
  return (
    <div className="mt-20">
      <div className="flex justify-center bg-primary py-[30px] sm:my-4 sm:mt-4 sm:py-0 lg:py-6">
        <div className="container-xs flex items-center justify-center gap-[92px] 2xl:px-[160px] 2xl:gap-10 xl:px-28 lg:px-20  md:px-5 xl:gap-10 sm:hidden">
          <div className="flex flex-1 flex-col items-start gap-[34px] md:self-stretch lg:gap-5 xl:gap-6">
            <Text size="text5xl" as="p" className="uppercase tracking-[2.20px] !text-text_w md:text-[26px] lg:text-[22px]">
              Customized for you
            </Text>
            <Text size="textlg" as="p" className="!font-extralight leading-8 !text-text_w text-justify !font-sans lg:leading-5 ">
              <>
                If you are looking for an engagement ring or matching band or anything that is not listed on our website, we can custom make it to
                your exact specifications. This allows you to get the designer look for a fraction of the price.
              </>
            </Text>
            <Link href="/custom-jewelry-design">
              <Button
                color="white_A700_01"
                shape="square"
                className="w-[348px] !h-[45px] tracking-[1.50px] 2xl:text-[16px]   md:w-[280px] xl:text-[16px] lg:text-[14px] lg:!h-[37px]"
              >
                START NOW
              </Button>
            </Link>
          </div>
          <div className="w-[20%]">
            <Image src="/images/img_ashclair_tima_mir.png" alt="Customized for you" preview={false} className="!object-contain w-full !h-full" />
          </div>
          <div className="flex w-[38%] flex-col  gap-5 2xl:w-1/4 xl:w-1/3 md:w-1/3">
            {/* <div className="ml-[90px] flex flex-col gap-5 self-stretch md:ml-0">
              <UserInstructions />
              <UserInstructions
                stepTitle="Step n°2"
                instructionText="Receive Our Rendering for Approval"
              />
            </div> */}
            <div className="flex flex-col items-start gap-0.5 border-b pb-5 2xl:border-b 2xl:pb-5">
              <Text size="text3xl" as="p" className="!text-text_w">
                Step n°1
              </Text>
              <Text size="textlg" as="p" className="!text-text_w !font-extralight !font-sans">
                Submit Drawings, Sketches Or Pictures
              </Text>
            </div>
            <div className="flex flex-col items-start gap-0.5 border-b pb-5 2xl:border-b 2xl:pb-5">
              <Text size="text3xl" as="p" className="!text-text_w">
                Step n°2
              </Text>
              <Text size="textlg" as="p" className="!text-text_w !font-extralight !font-sans">
                Receive Our Rendering for Approval
              </Text>
            </div>
            <div className="flex flex-col items-start gap-0.5">
              <Text size="text3xl" as="p" className="!text-text_w">
                Step n°3
              </Text>
              <Text size="textlg" as="p" className="!text-text_w !font-extralight !font-sans">
                Jewelry is Cast, Polished and Completed
              </Text>
            </div>
          </div>
        </div>

        {/* Mobile design */}
        <div className="container-xs sm:flex flex-col items-center justify-center gap-[24px] sm:gap-4 py-3 sm:px-3 hidden">
          <div className="flex flex-col items-start sm:items-center gap-3">
            <Text
              size="text5xl"
              as="p"
              className="uppercase tracking-[2.20px] !text-text_w md:text-[26px] lg:text-[22px]  sm:text-[22px] sm:w-full sm:!text-center"
            >
              Customized for you
            </Text>
            <Text size="textlg" as="p" className="!font-extralight leading-8 !text-text_w text-justify !font-sans lg:leading-5 sm:!text-[13px]">
              <>
                If you are looking for an engagement ring or matching band or anything that is not listed on our website, we can custom make it to
                your exact specifications. This allows you to get the designer look for a fraction of the price.
              </>
            </Text>
            <Link href="/custom-jewelry-design" className="w-full">
              <Button color="white_A700_01" shape="square" className="w-[348px] md:w-full !h-[32px] tracking-[1.50px]">
                START NOW
              </Button>
            </Link>
          </div>
          <div className="flex gap-3 w-full">
            {/* <div className=" w-[50%] bg-[#d9d9d9]" /> */}
            <div className="w-[33%] h-auto">
              <Image src="/images/img_ashclair_tima_mir.png" preview={false} alt="Jeweler crafting a ring by hand" className="object-contain" />
            </div>
            <div className="flex justify-center flex-col  gap-3">
              <div className="flex flex-col items-start gap-0.5 border-b pb-5 2xl:border-b 2xl:pb-5">
                <Text size="text3xl" as="p" className="!text-text_w sm:!text-[14px]">
                  Step n°1
                </Text>
                <Text size="textlg" as="p" className="!text-text_w !font-extralight !font-sans sm:!text-[12px]">
                  Submit Drawings, Sketches Or Pictures
                </Text>
              </div>
              <div className="flex flex-col items-start gap-0.5 border-b pb-5 ">
                <Text size="text3xl" as="p" className="!text-text_w sm:!text-[14px]">
                  Step n°2
                </Text>
                <Text size="textlg" as="p" className="!text-text_w !font-extralight !font-sans sm:!text-[12px]">
                  Receive Our Rendering for Approval
                </Text>
              </div>
              <div className="flex flex-col items-start gap-0.5">
                <Text size="text3xl" as="p" className="!text-text_w sm:!text-[14px]">
                  Step n°3
                </Text>
                <Text size="textlg" as="p" className="!text-text_w !font-extralight !font-sans sm:!text-[12px]">
                  Jewelry is Cast, Polished and Completed
                </Text>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
