/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';

import { Text, Img } from './..';

interface Props {
  className?: string;
  userValuesTitle?: React.ReactNode;
  userDate?: React.ReactNode;
  userDescription?: React.ReactNode;
}

export default function UserProfile5({ userValuesTitle = 'OUR DIAMONDS', userDate = '10.12.2023', userDescription, ...props }: Props) {
  return (
    <div {...props} className={`${props.className} flex sm:flex-col items-start gap-10 md:gap-5 flex-1`}>
      <Img
        src="img_tahlia_doyle_r1_270x400.png"
        width={400}
        height={270}
        alt="Tahlia Doyle R1"
        className="h-[270px] w-[26%] object-contain 2xl:h-auto "
      />
      <div className="flex flex-1 flex-col items-start gap-6 md:gap-3 self-center ">
        <Text size="text5xl" as="p" className="uppercase md:text-[26px] sm:text-[22px]">
          {userValuesTitle}
        </Text>
        <Text size="textlg" as="p" className="!font-['Inter'] !font-light">
          {userDate}
        </Text>
        <Text size="textlg" as="p" className="w-full !font-['Inter'] !font-light leading-8 !text-[#757575]">
          <span className="text-[#757575]">Lorem ipsum dolor sit amet, consectetur adipiscing elit.&nbsp;</span>
          <span className="text-[#000000]">
            Sustainable Diamonds vel purus luctus vulputate nec et mi. Cras eget odio et velit vehicula vehicula. Phasellus pharetra eros ut nulla
            aliquet, non lacinia mauris cursus. Nam sed molestie urna. Curabitur vel tortor vel eros tempor congue. Donec tristique ac felis ut
            euismod. Phasellus tincidunt, massa vitae aliquam feugiat, lacus sapien dictum dolor, ut finibus odio tortor et libero. Curabitur maximus
            enim ac velit finibus,.
          </span>
        </Text>
      </div>
    </div>
  );
}
