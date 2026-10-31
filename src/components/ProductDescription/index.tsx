import React from 'react';

import { Text, Img } from './..';

interface Props {
  className?: string;
  productImage?: string;
  productDescription?: React.ReactNode;
}

export default function ProductDescription({
  productImage = 'img_10k_rose_gold.png',
  productDescription = (
    <>
      Rose
      <br />
      Gold
    </>
  ),
  ...props
}: Props) {
  return (
    <div {...props} className={`${props.className} flex flex-col items-center gap-3`}>
      <Img src={productImage} width={28} height={28} alt="10k Rose Gold" className="mx-1.5 h-[28px] w-[28px] object-cover" />
      <Text size="textlg" as="p" className="leading-[21px] tracking-[1.60px] !text-[#757575]">
        {productDescription}
      </Text>
    </div>
  );
}
