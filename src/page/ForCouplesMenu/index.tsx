import React from 'react';

import { Image } from 'antd';
import Link from 'next/link';

import { Text } from '@/components';
import { setFilterData, useAppDispatch, useAppSelector } from '@/store';

export default function ForCouplesMenu({ handleMouseLeave }: { handleMouseLeave: any }) {
  const dispatch = useAppDispatch();
  const { headerData, data } = useAppSelector((state) => state.master);
  const { filterData } = useAppSelector((state) => state.products);
  const masterData = useAppSelector((state) => state.master.data);
  return (
    <div className="flex flex-col absolute w-full z-50 top-[140px] lg:top-[120px] xl:top[120px] border bg-white items-center pt-[20px] pb-[20px] cursor-default">
      <div className="container-xs flex flex-col gap-[30px] px-28  xl:px-28 lg:px-20 md:px-5 ">
        <div className="flex w-full  items-center justify-between gap-8 pb-2">
          <div className="relative w-[25%] content-center lg:h-auto ">
            <Image
              src="/images/img_mask_group_2_1.png"
              // width={200}
              alt="Mask Group 19 2"
              className="mx-auto flex-1 object-cover"
            />
            <Text
              size="text2xl"
              as="p"
              className="absolute md:text-[11px]  bottom-2 w-full px-2 m-auto !font-normal uppercase  bg-black/20 !text-[#ffffff]"
            >
              SHOP FOR WEDDING
            </Text>
          </div>
          <div className="flex w-2/3  items-start gap-5 justify-center ">
            <div className=" flex w-[20%] flex-col items-start gap-3.5 self-start sm:self-auto">
              <Text size="text4xl" as="p" className="tracking-[0.90px]">
                GEMSTONE
              </Text>
              <div className="grid grid-cols-1 items-start gap-1.5 self-stretch">
                {headerData?.gemStones
                  ?.map((jewelry: any) => {
                    return data.find((el) => el.id == jewelry?.id);
                  })
                  ?.map((item: any, i: number) => {
                    return (
                      <Link
                        key={i}
                        href={'/all'}
                        onClick={() => {
                          // if (title === "METAL") {
                          dispatch(
                            setFilterData({
                              ...filterData,
                              diamond_color: masterData?.filter((el: any) => el.name === item.name).map((el) => el.id),
                            }),
                          );
                          handleMouseLeave();
                          // handleMenuToggle?.();
                          // }
                        }}
                      >
                        <div className="flex gap-2">
                          <Image
                            width={20}
                            src={item?.image?.[0] ? item?.image?.[0] : '/images/no_images.svg'}
                            alt={item.name}
                            preview={false}
                            fallback="/images/no_images.svg"
                          />
                          <Text key={i} size="textlg" as="p" className=" !text-[#8d8e90] text-nowrap hover:underline cursor-pointer">
                            {item.name}
                          </Text>
                        </div>
                      </Link>
                    );
                  })}
              </div>
            </div>
            <div className="h-[160px] w-px bg-[#8d8e90] sm:h-px sm:w-[266px]" />
            <div className=" flex  w-[80%] flex-col items-start gap-3.5 self-start sm:self-auto">
              <Text size="text4xl" as="p" className="tracking-[0.90px]">
                DIAMOND
              </Text>
              <div className="grid grid-cols-1 items-start gap-1.5 self-stretch">
                {headerData?.diamonds
                  ?.map((jewelry: any) => {
                    return data.find((el) => el.id == jewelry?.id);
                  })
                  ?.map((item: any, i: number) => {
                    return (
                      <Link
                        key={i}
                        href={'/all'}
                        onClick={() => {
                          dispatch(
                            setFilterData({
                              ...filterData,
                              diamond_color: masterData?.filter((el: any) => el.name === item.name).map((el) => el.id),
                            }),
                          );
                          handleMouseLeave();
                        }}
                      >
                        <div className="flex gap-2">
                          <Image
                            width={20}
                            src={item?.image?.[0] ? item?.image?.[0] : '/images/no_images.svg'}
                            alt={item.name}
                            preview={false}
                            fallback="/images/no_images.svg"
                          />
                          <Text key={i} size="textlg" as="p" className=" !text-[#8d8e90] text-nowrap hover:underline cursor-pointer">
                            {item.name}
                          </Text>
                        </div>
                      </Link>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
        <div className="flex w-full  items-center justify-between gap-8 pb-2">
          <div className="relative w-[25%] content-center lg:h-auto ">
            <Image src="/images/img_mask_group_3_1.png" alt="Mask Group 19 2" className="mx-auto flex-1 object-cover" />
            <Text
              size="text2xl"
              as="p"
              className="absolute md:text-[11px]  bottom-2 w-full px-2 m-auto !font-normal uppercase  bg-black/20 !text-[#ffffff]"
            >
              SHOP FOR ENGAGEMENT
            </Text>
          </div>
          <div className="flex w-2/3  items-start gap-5 justify-center ">
            <div className=" flex flex-1 w-[25%] flex-col items-start gap-3.5 self-start sm:self-auto">
              <Text size="text4xl" as="p" className="tracking-[0.90px]">
                METAL
              </Text>
              <div className="grid grid-cols-1 items-start gap-1.5 self-stretch">
                {headerData?.metalColor
                  ?.map((jewelry: any) => {
                    return data.find((el) => el.id == jewelry?.id);
                  })
                  ?.map((item: any, i: number) => {
                    return (
                      <Link
                        key={i}
                        href={'/all'}
                        onClick={() => {
                          dispatch(
                            setFilterData({
                              ...filterData,
                              metal: masterData?.filter((el: any) => el.name === item.name).map((el) => el.id),
                            }),
                          );
                          handleMouseLeave();
                        }}
                      >
                        <div className="flex gap-2">
                          <Image
                            width={20}
                            src={item?.image?.[0] ? item?.image?.[0] : '/images/no_images.svg'}
                            alt={item.name}
                            preview={false}
                            fallback="/images/no_images.svg"
                          />
                          <Text key={i} size="textlg" as="p" className=" !text-[#8d8e90] text-nowrap hover:underline cursor-pointer">
                            {item.name}
                          </Text>
                        </div>
                      </Link>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
