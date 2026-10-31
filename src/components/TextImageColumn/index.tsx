import React from 'react';

import { SeekBar, Text } from './..';

interface Props {
  className?: string;
  mainText?: React.ReactNode;
  textI?: React.ReactNode;
  textH?: React.ReactNode;
  textG?: React.ReactNode;
  textF?: React.ReactNode;
  textE?: React.ReactNode;
  textD?: React.ReactNode;
}

export default function TextImageColumn({
  mainText = 'colors',
  textI = 'I',
  textH = 'H',
  textG = 'G',
  textF = 'F',
  textE = 'E',
  textD = 'D',
  ...props
}: Props) {
  return (
    <div {...props} className={`${props.className} flex flex-col items-start gap-4 flex-1`}>
      <Text size="textxl" as="p" className="uppercase tracking-[1.0px]">
        {mainText}
      </Text>
      <div className="flex flex-col gap-1.5 self-stretch">
        <div className="flex flex-wrap justify-between gap-5">
          <Text size="textlg" as="p" className="tracking-[2.40px] !text-[#757575]">
            {textI}
          </Text>
          <Text size="textlg" as="p" className="tracking-[2.40px] !text-[#757575]">
            {textH}
          </Text>
          <Text size="textlg" as="p" className="tracking-[2.40px] !text-[#757575]">
            {textG}
          </Text>
          <Text size="textlg" as="p" className="tracking-[2.40px] !text-[#757575]">
            {textF}
          </Text>
          <Text size="textlg" as="p" className="tracking-[2.40px] !text-[#757575]">
            {textE}
          </Text>
          <Text size="textlg" as="p" className="tracking-[2.40px] !text-[#757575]">
            {textD}
          </Text>
        </div>
        <SeekBar
          inputValue={[10, 20]}
          trackColors={['#c5ccb4', '#c5ccb4', '#c5ccb4']}
          className="flex h-[16px]"
          trackClassName="h-px w-full"
          thumbClassName="flex justify-center items-center h-[16px] w-[16px] rounded-[50%] outline-none bg-[#c5ccb4]"
        />
      </div>
    </div>
  );
}
