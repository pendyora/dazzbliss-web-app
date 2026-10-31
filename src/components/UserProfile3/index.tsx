'use client';
import React, { useState } from 'react';

import { Image } from 'antd';

import { Text } from './..';

interface Props {
  className?: string;
  userHeadline?: React.ReactNode;
}

export default function UserProfile3({
  userHeadline = (
    <>
      NAME OF THE PRODUCT
      <br />
      $50
    </>
  ),
  ...props
}: Props) {
  const [hovered, setHovered] = useState(false);
  return (
    <div {...props} className={`${props.className} flex flex-col items-start w-[24%] sm:w-1/2 gap-6 lg:gap-3`}>
      <div
        className=" h-[384px] 2xl:h-[325px] xl:h-[289px] lg:h-[201px] self-stretch sm:h-[188px] sm:w-[170px]"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Image
          src={!hovered ? '/images/img_ashclair_diam_384x384.png' : '/images/img_ashclair_an_e_384x384.png'}
          preview={false}
          alt="Ashclair Diam"
          className=" m-auto h-[384px] 2xl:h-[325px] xl:h-[289px] lg:h-[201px] sm:h-[188px] w-full object-cover"
        />
      </div>
      <Text size="textlg" as="p" className="uppercase leading-[30px] tracking-[1.20px] pl-5 lg:pl-3">
        {userHeadline}
      </Text>
    </div>
  );
}
