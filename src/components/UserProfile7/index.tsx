import React from 'react';

import { Img, Text } from './..';

interface Props {
  className?: string;
  userStatus?: React.ReactNode;
  userRating?: React.ReactNode;
  userGrade?: React.ReactNode;
  userPreference?: React.ReactNode;
  userLevel?: React.ReactNode;
  userPrice?: React.ReactNode;
}

export default function UserProfile7({
  userStatus = 'Round',
  userRating = '0.50',
  userGrade = 'G',
  userPreference = 'Ideal',
  userLevel = '3',
  userPrice = '1000$',
  ...props
}: Props) {
  return (
    <div {...props} className={`${props.className} flex justify-center items-center py-6  sm:py-4 border-[#707070] border-b border-solid flex-1`}>
      <div className="container-xs flex items-center justify-center">
        <div className="flex w-full  items-center justify-between">
          <div className="flex items-center gap-[18px] px-2.5">
            <Img src="img_mail.svg" width={48} height={48} alt="Mail" className="h-[48px] w-[48px]" />
            <Text size="textlg" as="p">
              {userStatus}
            </Text>
          </div>
          <Text size="textlg" as="p" className="ml-[50px] ">
            {userRating}
          </Text>
          <Text size="textlg" as="p" className="ml-[50px] ">
            {userGrade}
          </Text>
          <Text size="textlg" as="p" className="ml-[50px] capitalize ">
            {userPreference}
          </Text>
          {/* <div className="flex w-[50%] flex-wrap justify-between gap-5 px-[148px] lg:px-8   sm:px-4"> */}
          <Text size="textlg" as="p" className=" ml-[50px]  ">
            {userLevel}
          </Text>
          <Text size="textlg" as="p" className="ml-[50px] ">
            {userPrice}
          </Text>
          {/* </div> */}
          <Img src="img_arrow_down.svg" width={84} height={24} alt="Arrow Down" className="h-[24px] w-[6%] object-contain ml-[50px] " />
          <Img src="img_frame_1284.svg" width={102} height={28} alt="Frame 1284" className="h-[28px] w-[6%] object-contain ml-[50px] " />
        </div>
      </div>
    </div>
  );
}
