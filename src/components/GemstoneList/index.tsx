import React from 'react';

import Link from 'next/link';

import { setFilterData, useAppDispatch, useAppSelector } from '@/store';

import { Text, Img } from './..';

interface Props {
  className?: string;
  list?: string[];
  list2?: string[];
  viewMore?: boolean;
  title?: string;
  handleMenuToggle?: any;
}
export default function GemstoneList({ list = [], list2 = [], viewMore = false, title = '', handleMenuToggle, ...props }: Props) {
  const dispatch = useAppDispatch();
  const { filterData } = useAppSelector((s) => s.products);
  const masterData = useAppSelector((s) => s.master.data);
  return (
    <div {...props} className={`${props.className} flex flex-col items-start w-full sm:w-full gap-3 `}>
      {
        <Text
          size="text4xl"
          className={`tracking-[0.90px] sm:!font-sans sm:!font-extralight  sm:!not-italic sm:!text-[15px] sm:p-2 sm:border-b sm:w-full ${
            !title ? 'mt-[24px]' : ''
          } `}
        >
          {title}
        </Text>
      }

      <div className=" flex items-start gap-10 md:gap-7 grid-cols-2 sm:px-3">
        <div>
          {' '}
          {list?.map((list, index) => {
            // console.log(
            //   masterData
            //     ?.filter((el: any) => el.name === list)
            //     .map((el) => el.id)
            // );

            return (
              <div className="flex flex-col gap-1.5 py-1 self-stretch" key={index}>
                <Link
                  href={title === 'METAL' ? '/all' : '/'}
                  onClick={() => {
                    if (title === 'METAL') {
                      dispatch(
                        setFilterData({
                          ...filterData,
                          metal: masterData?.filter((el: any) => el.name === list).map((el) => el.id),
                        }),
                      );
                      handleMenuToggle?.();
                    }
                  }}
                >
                  <div className="flex gap-2">
                    <Img
                      src="img_close_26x26.png"
                      width={24}
                      height={24}
                      alt="Close"
                      className="h-[24px] w-[24px] object-cover sm:h-[14px] sm:w-[14px]"
                    />
                    <Text
                      size="textlg"
                      as="p"
                      className="whitespace-nowrap tracking-[0px] cursor-pointer hover:underline !text-[#8d8e90] sm:!text-black sm:!font-sans sm:!font-extralight"
                    >
                      {list}
                    </Text>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        <div>
          {list2?.map((list, index) => (
            <div className="flex flex-col gap-1.5 py-1 self-stretch" key={index}>
              <div className="flex gap-2">
                <Img
                  src="img_close_26x26.png"
                  width={26}
                  height={26}
                  alt="Close"
                  className="h-[26px] w-[26px] object-cover sm:h-[14px] sm:w-[14px]"
                />
                <Text
                  size="textlg"
                  as="p"
                  className="whitespace-nowrap !text-[#8d8e90] cursor-pointer hover:underline sm:!text-black sm:!font-sans sm:!font-extralight"
                >
                  {list}
                </Text>
              </div>
            </div>
          ))}
          {viewMore && (
            <div className="flex flex-col gap-1.5 self-stretch">
              <div className="flex gap-2">
                <Text
                  size="textlg"
                  as="p"
                  className=" !text-[#8d8e90] hover:!text-[#000] cursor-pointer sm:mt-1 sm:!text-black underline sm:!font-sans sm:!font-extralight"
                >
                  View All
                </Text>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
