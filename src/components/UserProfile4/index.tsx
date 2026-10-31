import React from 'react';

import { Image } from 'antd';
import dayjs from 'dayjs';
import Link from 'next/link';

import { Text } from './..';

interface Props {
  className?: string;
  userImage?: string;
  createdAt?: string;
  title?: React.ReactNode;
  readMoreLink?: React.ReactNode;
  banner?: string;
  thumbnail_image?: string;
  slug?: string;
}

export default function UserProfile4({
  banner = '',
  slug = '#',
  createdAt = '01.02.24',
  title = '6 Reasons Why You Should Buy Three Stone Diamond Rings',
  readMoreLink = 'Read more',
  ...props
}: Props) {
  return (
    <Link href={`/blog/${slug}`}>
      <div {...props} className={`${props.className} flex flex-col items-center w-full gap-6 p-5 sm:gap-1 sm:p-2`}>
        <div className="flex items-start justify-between  gap-5 self-stretch ">
          <Image
            src={props?.thumbnail_image || '/images/noImage1.svg'}
            width={200}
            height={198}
            preview={false}
            alt={`${title}-alt`}
            fallback="/images/noImage1.svg"
            className="self-center object-cover"
          />
          <Text size="textmd" as="p" className="rotate-[90deg] !font-light mt-5 -mr-5">
            {dayjs(createdAt).format('DD.MM.YYYY')}
          </Text>
        </div>
        <div className="flex flex-col items-start gap-[18px] sm:gap-2 self-stretch">
          <Text size="textlg" as="p" className="w-full leading-[18px] text-lg">
            {title}
          </Text>
          <Text size="textmd" as="p" className="capitalize underline">
            {readMoreLink}
          </Text>
        </div>
      </div>
    </Link>
  );
}
