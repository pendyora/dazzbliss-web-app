import React from 'react';

import { Text } from './..';

interface Props {
  className?: string;
  stepTitle?: React.ReactNode;
  instructionText?: React.ReactNode;
}

export default function UserInstructions({ stepTitle = 'Step n°1', instructionText = 'Submit Drawings, Sketches Or Pictures', ...props }: Props) {
  return (
    <div {...props} className={`${props.className} flex flex-col items-center gap-[18px] flex-1`}>
      <div className="flex flex-col items-start gap-0.5 self-stretch">
        <Text size="text8xl" as="p" className="!text-[#eceded]">
          {stepTitle}
        </Text>
        <Text size="text4xl" as="p" className="!text-[#eceded]">
          {instructionText}
        </Text>
      </div>
      <div className="h-px w-full rotate-[180deg] self-stretch bg-[#e7e9e8]" />
    </div>
  );
}
