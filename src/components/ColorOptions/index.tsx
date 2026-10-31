import React from 'react';

import Link from 'next/link';

import { Text, Img } from './..';

interface Props {
  className?: string;
  headlineText?: React.ReactNode;
  whiteText?: React.ReactNode;
  blueText?: React.ReactNode;
  blackText?: React.ReactNode;
  yellowText?: React.ReactNode;
  champagneText?: React.ReactNode;
  viewAllText?: React.ReactNode;
}

export default function ColorOptions({
  headlineText = 'DIAMOND',
  whiteText = 'White',
  blueText = 'Blue',
  blackText = 'Black',
  yellowText = 'Yellow',
  champagneText = 'Champagne',
  viewAllText = 'View All',
  ...props
}: Props) {
  return (
    <div {...props} className={`${props.className} flex justify-between items-start`}>
      <div className="flex w-[80%] flex-col items-start gap-3.5">
        <Text size="text4xl" as="p" className="tracking-[0.96px]">
          {headlineText}
        </Text>
        <div className="flex flex-col items-start gap-1.5 self-stretch">
          <div className="flex gap-2 self-stretch">
            <Img src="img_close_26x26.png" width={24} height={24} alt="Close" className="h-[24px] w-[24px] object-cover" />
            <Text size="textlg" as="p" className=" !text-[#8d8e90] hover:underline cursor-pointer">
              {whiteText}
            </Text>
          </div>
          <div className="flex gap-2 self-stretch">
            <Img src="img_close_26x26.png" width={24} height={24} alt="Close" className="h-[24px] w-[24px] object-cover" />
            <Text size="textlg" as="p" className=" !text-[#8d8e90] hover:underline cursor-pointer">
              {blueText}
            </Text>
          </div>
          <div className="flex gap-2 self-stretch">
            <Img src="img_close_26x26.png" width={24} height={24} alt="Close" className="h-[24px] w-[24px] object-cover" />
            <Text size="textlg" as="p" className=" !text-[#8d8e90] hover:underline cursor-pointer">
              {blackText}
            </Text>
          </div>
          <div className="flex gap-2 self-stretch">
            <Img src="img_close_26x26.png" width={24} height={24} alt="Close" className="h-[24px] w-[24px] object-cover" />
            <Text size="textlg" as="p" className=" !text-[#8d8e90] hover:underline cursor-pointer">
              {yellowText}
            </Text>
          </div>
          <div className="flex gap-2 self-stretch">
            <Img src="img_close_26x26.png" width={24} height={24} alt="Close" className="h-[24px] w-[24px] object-cover" />
            <Text size="textlg" as="p" className=" !text-[#8d8e90] hover:underline cursor-pointer">
              {champagneText}
            </Text>
          </div>
          <Link href="#" className="">
            <Text size="textlg" as="p" className=" !text-[#8d8e90] underline hover:!text-[#000] cursor-pointer">
              {viewAllText}
            </Text>
          </Link>
        </div>
      </div>
      {/* <div className="h-[290px] w-px self-center bg-[#8d8e90]" /> */}
    </div>
  );
}
