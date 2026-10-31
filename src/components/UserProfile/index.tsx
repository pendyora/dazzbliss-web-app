import React from 'react';

import { Image } from 'antd';
import Link from 'next/link';

import { Text } from './..';

interface Props {
  className?: string;
  userImage?: string;
  userHeadline?: React.ReactNode;
  link?: string;
}

export default function UserProfile({ userImage = 'img_ashclair_diam.png', userHeadline = 'earrings', ...props }: Props) {
  return (
    <div {...props} className={`${props.className} h-auto w-full relative overflow-hidden aspect-square`}>
      <Link href={`${props?.link}`}>
        <Image src={'/images/' + userImage} alt="Ashclair Diam" preview={false} className="mx-auto h-full w-full object-cover" />
        <Text size="textxl" as="p" className="absolute bottom-[21px] left-[30px] m-auto uppercase tracking-[1.50px] sm:left-3 sm:bottom-3">
          {userHeadline}
        </Text>
      </Link>
    </div>
  );
}
