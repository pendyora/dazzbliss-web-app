import React from 'react';

import { Text, Img } from './..';

interface Props {
  className?: string;
  mailText?: React.ReactNode;
  emeraldText?: React.ReactNode;
  heartText?: React.ReactNode;
  marquiseText?: React.ReactNode;
  ovalText?: React.ReactNode;
  globeText?: React.ReactNode;
}

export default function IconList({
  mailText = 'Round',
  emeraldText = 'Round',
  heartText = 'Round',
  marquiseText = 'Round',
  ovalText = 'Round',
  globeText = 'Round',
  ...props
}: Props) {
  return (
    <div {...props} className={`${props.className} flex items-center gap-[26px] flex-1 lg:gap-2`}>
      <div className="flex w-full flex-col items-center gap-3.5">
        <Img
          src="img_mail.svg"
          width={48}
          height={48}
          alt="Mail"
          className="mx-1.5 h-[48px] w-[48px] 2xl:w-[40px] 2xl:h-auto 2xl:max-h-[40px] lg:w-[30px] lg:max-h-[30px] object-contain"
        />
        <Text size="textmd" as="p" className="tracking-[1.0px] !text-[#757575]">
          {mailText}
        </Text>
      </div>
      <div className="flex w-full flex-col items-center gap-3.5">
        <Img
          src="img_emerald.svg"
          width={36}
          height={48}
          alt="Emerald"
          className="mx-2 h-[48px] 2xl:w-[40px] 2xl:h-auto 2xl:max-h-[40px] lg:w-[30px] lg:max-h-[30px] object-contain"
        />
        <Text size="textmd" as="p" className="tracking-[1.0px] !text-[#757575]">
          {emeraldText}
        </Text>
      </div>
      <div className="flex w-full flex-col items-center gap-3.5">
        <Img
          src="img_heart.svg"
          width={48}
          height={48}
          alt="Heart"
          className="h-[48px] w-[48px] 2xl:w-[40px] 2xl:h-auto 2xl:max-h-[40px] lg:w-[30px] lg:max-h-[30px] object-contain"
        />
        <Text size="textmd" as="p" className="tracking-[1.0px] !text-[#757575]">
          {heartText}
        </Text>
      </div>
      <div className="flex w-full flex-col items-center gap-3.5">
        <Img
          src="img_marquise.svg"
          width={24}
          height={48}
          alt="Marquise"
          className="h-[48px] 2xl:w-[40px] 2xl:h-auto 2xl:max-h-[40px] lg:w-[30px] lg:max-h-[30px] object-contain"
        />
        <Text size="textmd" as="p" className="tracking-[1.0px] !text-[#757575]">
          {marquiseText}
        </Text>
      </div>
      <div className="flex w-full flex-col items-center gap-3.5">
        <Img
          src="img_oval.svg"
          width={30}
          height={48}
          alt="Oval"
          className="mx-3 h-[48px] 2xl:w-[40px] 2xl:h-auto 2xl:max-h-[40px] lg:w-[30px] lg:max-h-[30px] object-contain"
        />
        <Text size="textmd" as="p" className="tracking-[1.0px] !text-[#757575]">
          {ovalText}
        </Text>
      </div>
      <div className="flex w-full flex-col items-center gap-3.5">
        <Img
          src="img_globe.svg"
          width={48}
          height={48}
          alt="Globe"
          className="mx-1.5 h-[48px] w-[48px] 2xl:w-[40px] 2xl:h-auto 2xl:max-h-[40px] lg:w-[30px] lg:max-h-[30px] object-contain"
        />
        <Text size="textmd" as="p" className="tracking-[1.0px] !text-[#757575]">
          {globeText}
        </Text>
      </div>
    </div>
  );
}
