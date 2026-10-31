import React from 'react';

import { LuCheck, LuPencil } from 'react-icons/lu';

import { Text } from '../../components/Text';

interface Props {
  title?: string;
  className?: string;
  billingAddress?: React.ReactNode;
  userName?: React.ReactNode;
  userEmail?: React.ReactNode;
  userAddress?: React.ReactNode;
  userPhone?: React.ReactNode;
  editButton?: string;
  setIsEditOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onEditClick?: () => void;
}

export default function AddressDetalis({
  userName = 'Marie J. Poole',
  userEmail = 'majescajewellerystore@gmail.com',
  userAddress = '61, Nagma Nagar, Hyderabad - 320440',
  userPhone = '+91 940 5007991',
  title = 'billing',
  setIsEditOpen,
  onEditClick,
  ...props
}: Props) {
  return (
    <div {...props} className={`${props.className} flex flex-col items-center w-full`}>
      <div className="flex flex-col items-start gap-2.5 self-stretch">
        <div className="flex w-full flex-row items-center justify-between gap-2">
          <div className="flex flex-row items-center gap-2">
            <Text as="p" size="text5xl" className="text-black-900 text-[24px] font-medium uppercase md:!text-[20px] ">
              {title} address
            </Text>
            <span
              aria-label="Completed"
              className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#6f7a56] text-white md:h-[18px] md:w-[18px]"
            >
              <LuCheck className="h-[13px] w-[13px]" strokeWidth={3} />
            </span>
          </div>
          <button
            type="button"
            aria-label={`Edit ${title} address`}
            onClick={() => {
              onEditClick?.();
              setIsEditOpen(true);
            }}
            className="inline-flex items-center gap-1 text-[13px] font-sans font-normal text-[#6f7a56] transition-opacity hover:opacity-70"
          >
            <LuPencil className="h-[14px] w-[14px]" />
            <span className="uppercase tracking-[1.2px]">Edit</span>
          </button>
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-start gap-2.5 self-stretch md:gap-[8px]">
          <Text as="p" size="textxl" className="text-black-900 text-[20px] font-normal tracking-[0.48px] md:!text-[16px] capitalize">
            {userName}
          </Text>
          <div className="flex flex-col items-start gap-2 self-stretch">
            <Text as="p" size="textmd" className="break-words font-normal tracking-[1.00px] text-gray-600 sm:!text-[14px]">
              {userEmail}
            </Text>
            <Text
              as="p"
              size="textmd"
              className="break-words font-normal tracking-[1.00px] text-gray-600 capitalize md:max-w-[410px] sm:!text-[14px]"
            >
              {userAddress}
            </Text>
            <Text as="p" size="textmd" className="text-black-900 font-medium tracking-[1.00px] sm:!text-[14px]">
              {userPhone}
            </Text>
          </div>
        </div>
      </div>
      <div className="bg-gray-400_01 h-px w-full self-stretch" />
    </div>
  );
}
