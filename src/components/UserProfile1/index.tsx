import React from 'react';

import { Image } from 'antd';
import Link from 'next/link';

import { Text } from './..';

interface Props {
  className?: string;
  userImage?: string;

  userHeadline?: React.ReactNode;
}

export default function UserProfile1({
  userImage = 'img_ashclair_diam_450x384.png',
  userHeadline = (
    <>
      NAME OF THE PRODUCT
      <br />
      $50
    </>
  ),
  ...props
}: Props) {
  return (
    <div {...props} className={`${props.className} flex flex-col items-center w-[24%] md:w-full gap-6`}>
      <Link href="/productpagespecificproduct" className="sm:w-[170px]">
        <Image
          src={'/images/' + userImage}
          preview={false}
          alt="Ashclair Diam"
          className="h-[450px] w-full object-cover lg:h-[230px] xl:h-[330px] 2xl:h-[400px] sm:h-[200px]"
        />
        <Text size="textlg" as="p" className="uppercase leading-[30px] tracking-[1.00px] xl:p-3 2xl:p-3 lg:p-2 lg:leading-5">
          {userHeadline}
        </Text>
      </Link>
    </div>
  );
}
