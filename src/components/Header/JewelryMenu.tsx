/* eslint-disable react-hooks/rules-of-hooks */
'use client';

import React from 'react';

import { Image } from 'antd';
import Link from 'next/link';

import { setFilterData, useAppDispatch, useAppSelector } from '@/store';

import { Text } from '../../components';

export default function jewelrymenu({ handleMouseLeave }: { handleMouseLeave: any }) {
  const dispatch = useAppDispatch();
  const { headerData, data } = useAppSelector((state) => state.master);
  const { filterData } = useAppSelector((state) => state.products);
  const masterData = useAppSelector((state) => state.master.data);

  return (
    <div className="flex cursor-default flex-col absolute w-full z-50 top-[140px] lg:top-[120px] xl:top[120px] border bg-white items-center pt-[20px] pb-[20px]">
      <div className="container-xs flex flex-col gap-[30px] md:gap-5 px-28  xl:px-28 lg:px-20 !md:px-5 ">
        <div className="flex items-start justify-between gap-8">
          <div className="flex w-2/3 items-start gap-8 ">
            <div className="flex w-[20%] md:w-[25%] flex-col items-start gap-3.5">
              <Text size="text4xl" as="p" className="tracking-[0.96px]">
                CATEGORY
              </Text>
              <div className="flex flex-col items-start gap-1.5 self-stretch">
                {headerData?.jewelryType
                  ?.map((jewelry: any) => data.find((el) => el.id == jewelry?.id))
                  ?.map((item: any, i: number) => (
                    <Link key={i} href={item?.name?.toLowerCase().split(' ').join('-')} onClick={handleMouseLeave}>
                      <Text key={i} size="textlg" as="p" className=" !text-[#8d8e90] text-nowrap hover:underline cursor-pointer">
                        {item?.name}
                      </Text>
                    </Link>
                  ))}
              </div>
            </div>
            {/* <div className="h-[266px] w-px m-2 self-center bg-[#8d8e90]" /> */}
            <div className="h-[160px] w-px bg-[#8d8e90] sm:h-px sm:w-[266px]" />

            <div className="flex w-[80%]  flex-col items-start gap-3.5">
              <Text size="text4xl" as="p" className="tracking-[0.96px]">
                METAL
              </Text>
              <div className="grid grid-cols-1 items-start gap-1.5 self-stretch">
                {headerData?.metalColor
                  ?.map((jewelry: any) => data.find((el) => el.id == jewelry?.id))
                  ?.map((item: any, i: number) => (
                    <Link
                      key={i}
                      href={
                        '/all'
                        // item?.name?.toLowerCase().split(" ").join("-")
                      }
                      onClick={() => {
                        // if (title === "METAL") {
                        dispatch(
                          setFilterData({
                            ...filterData,
                            metal: masterData?.filter((el: any) => el.name === item.name).map((el) => el.id),
                          }),
                        );
                        handleMouseLeave();
                        // handleMenuToggle?.();
                        // }
                      }}
                    >
                      <div className="flex gap-2">
                        <Image width={20} src={item?.image?.[0]} alt={item?.name} preview={false} fallback="/images/no_images.svg" />
                        <Text key={i} size="textlg" as="p" className=" !text-[#8d8e90] hover:underline cursor-pointer">
                          {item?.name}
                        </Text>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          </div>
          <div className="relative  w-[25%] content-center lg:h-auto ">
            <Image
              src="/images/img_mask_group_19_2.png"
              // width={200}
              alt="Mask Group 19 2"
              className="mx-auto flex-1 object-cover"
            />
            <Text
              size="text2xl"
              as="p"
              className="absolute bottom-0  md:text-[11px] px-2 w-full  m-auto !font-normal uppercase  bg-black/20 !text-[#ffffff]"
            >
              DISCOVER OUR BESTSELLERS
            </Text>
          </div>
        </div>
        <div className="flex w-full items-center justify-between gap-8 pb-2">
          <div className="flex w-2/3  items-start gap-8 ">
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
                        href={
                          '/all'
                          // item?.name?.toLowerCase().split(" ").join("-")
                        }
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
          </div>
          <div className="relative w-[25%] content-center lg:h-auto ">
            <Image
              src="/images/img_mask_group_32_1.png"
              // width={200}
              alt="Mask Group 19 2"
              className="mx-auto flex-1 object-cover"
            />
            <Text
              size="text2xl"
              as="p"
              className="absolute md:text-[11px]  bottom-2 w-full px-2 m-auto !font-normal uppercase  bg-black/20 !text-[#ffffff]"
            >
              DISCOVER CUSTOM JEWELRY
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}
