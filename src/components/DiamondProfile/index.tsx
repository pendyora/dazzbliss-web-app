import React from 'react';

import { Text, Heading } from './..';

interface Props {
  className?: string;
  diamondId?: React.ReactNode;
  diamondName?: React.ReactNode;
  diamondDetails?: React.ReactNode;
  changeText?: React.ReactNode;
}

export default function DiamondProfile({
  diamondId = '1',
  diamondName = 'name of the diamond',
  diamondDetails = '0,5 CARATS - EMERALD - 100000$',
  changeText = 'Change',
  ...props
}: Props) {
  return (
    <div {...props} className={`${props.className} flex flex-col items-end w-[50%]  gap-2 px-[30px] sm:px-4`}>
      <div className="flex items-center justify-end gap-[20px] self-stretch opacity-20">
        <Heading as="h4" className="flex h-[50px] w-[50px] items-center justify-center rounded-[24px] bg-[#c5ccb4] text-center tracking-[2.40px]">
          {diamondId}
        </Heading>
        <div className="flex flex-1 flex-col items-start">
          <Text size="text4xl" as="p" className="uppercase tracking-[2.40px]">
            {diamondName}
          </Text>
          <Text size="textlg" as="p" className="uppercase tracking-[1.60px]">
            {diamondDetails}
          </Text>
        </div>
      </div>
      <Text size="textlg" as="p" className="capitalize tracking-[1.60px] underline">
        {changeText}
      </Text>
    </div>
  );
}
