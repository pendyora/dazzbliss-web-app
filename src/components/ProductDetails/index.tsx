import React from 'react';

import { Image } from 'antd';

import { Text } from './..';

interface Props {
  className?: string;
  productImage?: string;
  productName?: React.ReactNode;
  productDescription?: React.ReactNode;
  productPrice?: React.ReactNode;
}

export default function ProductDetails({
  productImage = 'images/img_group_1259_2.png',
  productName = 'NAME OF THE PRODUCT',
  productDescription = 'Silver Sterling – Yellow Gold',
  productPrice = '$50',
  ...props
}: Props) {
  return (
    <div {...props} className={`${props.className} flex flex-col items-center md:w-full gap-10 2xl:gap-5`}>
      <div className="h-[430px] border 2xl:h-auto 2xl:max-h-[325px] w-full flex">
        <Image
          src={productImage}
          // width={430}
          // height={430}
          preview={false}
          fallback="images/no_images.svg"
          alt="Group 1259 2"
          className="object-cover !h-full"
        />
      </div>
      <div className="mx-5 flex flex-col items-start self-stretch">
        <Text size="textlg" as="p" className="tracking-[0.44px]">
          {productName}
        </Text>
        <Text size="textmd" as="p" className="tracking-[0.44px]">
          {productDescription}
        </Text>
        <Text size="textlg" as="p" className="tracking-[0.44px]">
          {productPrice}
        </Text>
      </div>
    </div>
  );
}
