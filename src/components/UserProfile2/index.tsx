import React from 'react';

import { Image } from 'antd';
import Link from 'next/link';

import { Text } from './..';

interface Props {
  className?: string;
  userImage?: string;
  headlineText?: React.ReactNode;
  path?: string;
}

export default function UserProfile2({
  userImage = '/img_ashclair_polinach_11007534.png',
  headlineText = 'Less than 500$',
  path = '/',
  ...props
}: Props) {
  return (
    <Link href={path} {...props} className={`${props.className} h-auto w-[32%] md:w-full relative 2xl:w-full`}>
      <div className="mx-auto h-full w-full flex-1 !aspect-square">
        <Image src={`/images${userImage}`} preview={false} alt="Ashclair Image" className="object-cover h-auto" />
      </div>
      <div className="absolute w-full bottom-0">
        <Text
          size="textxl"
          as="p"
          className=" bg-black/25 p-5 sm:p-2 whitespace-nowrap  m-auto !font-['Inter'] uppercase !text-[#ffffff] sm:bottom-4 sm:left-2 sm:text-[13px] sm:text-center"
        >
          {headlineText}
        </Text>
      </div>
    </Link>
  );
}
