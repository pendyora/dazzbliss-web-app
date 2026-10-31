'use client';
import React from 'react';

import { Image } from 'antd';
import Link from 'next/link';

import { fetchProductsFilterList, useAppDispatch, useAppSelector } from '@/store';

import { Text } from '../../components';

/**
 * Component that renders a collection menu.
 *
 * This component renders a collection menu that shows all the collections.
 * The menu is divided into 3 sections: All Collections, Best Sellers and
 * Categories. The All Collections section has a list of all the collections.
 * The Best Sellers section has a list of the best selling collections.
 * The Categories section has a list of all the categories.
 *
 * The component also renders a footer with a link to the homepage.
 */
export default function CollectionMenu({ handleMouseLeave }: { handleMouseLeave: any }) {
  const dispatch = useAppDispatch();
  const { headerData } = useAppSelector((state) => state.master);
  return (
    <div className="flex w-full absolute z-50 flex-col border pt-[20px] lg:mt-[-20px] top-[140px] bg-white cursor-default">
      <footer className="mb-[30px] flex items-center justify-center">
        <div className="container-xs flex items-start justify-between gap-5 md:gap-1 px-28  xl:px-28 lg:px-20  md:px-5">
          <div className="flex w-[68%] flex-col items-start gap-3.5 ">
            <Text size="text4xl" as="p" className="tracking-[0.96px]">
              COLLECTION
            </Text>
            <div className="grid grid-cols-3 items-start gap-1.5 self-stretch">
              {headerData?.collections?.map((item: any, i: number) => {
                return (
                  <Link
                    key={i}
                    href={`/all?collections=${item?.name?.toLowerCase().split(' ').join('-')}`}
                    onClick={() => {
                      handleMouseLeave();
                      dispatch(
                        fetchProductsFilterList({
                          type: 'all',
                          collection: `${item?.name?.toLowerCase().split(' ').join('-')}`,
                        }),
                      );
                    }}
                  >
                    <div className="flex gap-2">
                      {/* <Image
                          width={20}
                          src={
                            item?.image?.[0]
                              ? item?.image?.[0]
                              : "/images/no_images.svg"
                          }
                          alt={item.name}
                          preview={false}
                          fallback="/images/no_images.svg"
                        /> */}
                      <Text key={i} size="textlg" as="p" className=" !text-[#8d8e90] text-nowrap hover:underline cursor-pointer">
                        {item?.name}
                      </Text>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="relative w-[25%] content-center lg:h-auto ">
            <Image
              src="/images/img_mask_group_19_1.png"
              // width={200}
              alt="Mask Group 19 2"
              className="mx-auto flex-1 object-cover"
            />
            <Text
              size="text2xl"
              as="p"
              className="absolute md:text-[11px]  bottom-2 w-full px-2 m-auto !font-normal uppercase  bg-black/20 !text-[#ffffff]"
            >
              DISCOVER OUR BESTSELLERS
            </Text>
          </div>
        </div>
      </footer>
    </div>
  );
}
