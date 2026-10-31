import React from 'react';

import { Text, Img } from './..';

interface Props {
  className?: string;
  userName?: React.ReactNode;
}

export default function UserProfile8({ userName = 'Solitaire', ...props }: Props) {
  return (
    <div {...props} className={`${props.className} flex flex-col items-center gap-4 sm:gap-2 sm:w-fit`}>
      <div className="flex flex-col items-center h-[65px] w-[65px] max-w-[265px] rounded-[56px] border border-solid border-[#757575] bg-[#ffffff] ">
        <Img src="img_mask_group_35_1.png" width={58} height={92} alt="Mask Group 35 1" className="h-[65px] w-[65px] object-contain" />
      </div>
      <Text size="textmd" as="p" className="tracking-[1.0px] !text-[#757575]">
        {userName}
      </Text>
    </div>
  );
}
