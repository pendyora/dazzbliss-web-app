import React from 'react';

import { Text, Img } from './..';

interface Props {
  className?: string;
  productName?: React.ReactNode;
  productDescription?: React.ReactNode;
  productPrice?: React.ReactNode;
}

export default function ProductProfile1({
  productName = 'NAME OF THE PRODUCT',
  productDescription = 'Silver Sterling – Yellow Gold',
  productPrice = '$50',
  ...props
}: Props) {
  return (
    <div {...props} className={`${props.className} flex flex-col items-center w-full gap-6`}>
      <Img src="img_group_1259_1.png" width={392} height={392} alt="Group 1259 1" className="h-[392px] w-full object-cover" />
      <div className="flex flex-col items-start self-stretch px-5">
        <Text as="p" className="tracking-[0.44px]">
          {productName}
        </Text>
        <Text as="p" className="tracking-[0.44px]">
          {productDescription}
        </Text>
        <Text as="p" className="tracking-[0.44px]">
          {productPrice}
        </Text>
      </div>
    </div>
  );
}
