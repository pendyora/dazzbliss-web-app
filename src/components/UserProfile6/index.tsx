import React from 'react';

import { Text, Img } from './..';

interface Props {
  className?: string;
  userImage?: string;
  userText?: React.ReactNode;
}

export default function UserProfile6({ userImage = 'img_mail.svg', userText = 'Round', ...props }: Props) {
  return (
    <div {...props} className={`${props.className} flex flex-col items-center w-full gap-3.5`}>
      <Img src={userImage} width={48} height={48} alt="Mail" className="mx-1.5 h-[48px] w-[48px]" />
      <Text size="textlg" as="p" className="tracking-[1.60px] !text-[#757575]">
        {userText}
      </Text>
    </div>
  );
}
