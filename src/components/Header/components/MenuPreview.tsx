'use client';
import React from 'react';

import { Image } from 'antd';
import { useRouter } from 'next/navigation';
import { GoArrowUpRight } from 'react-icons/go';

import { Text } from '@/components/Text';
import { useAppSelector } from '@/store';

const menuColumnList = ['menu_column_one', 'menu_column_two', 'menu_column_three', 'menu_column_four'];
const MenuPreview = ({ Details, setActiveMenu }: any) => {
  const { data } = useAppSelector((state) => state.master);
  const router = useRouter();
  const reloadPage = () => {
    // window.location.reload();
    setActiveMenu(null);
  };
  // console.log(Details);

  return (
    <div className="flex flex-row cursor-default bg-white absolute w-full z-[9999px] px-12 lg:px-0 shadow-md border  items-start pt-[5px] pb-[5px]">
      <div className="w-full flex flex-row justify-between  p-5 gap-5 ">
        {/* Tablets hide the 270px image column (`lg:hidden` below), so the link grid takes the full width
            there instead of leaving that space empty. */}
        <div className="grid grid-cols-4 w-[calc(100%-270px)] [@media(min-width:551px)_and_(max-width:1024px)]:w-full">
          {menuColumnList?.map((item: any, index: number) => {
            if (Details[item]?.length > 0) {
              return (
                <div
                  key={index}
                  className={`flex gap-4 ${Details[item].length > 1 && index === 0 ? '' : 'border-l first-of-type:border-0'} px-4 lg:px-3 md:px-2 flex-col`}
                >
                  {Details?.[item]?.map((item: any, i: number) => (
                    <div key={i} className="flex flex-col gap-2">
                      <div
                        className={`${item?.link ? 'cursor-pointer hover:text-[#256030]' : ''} uppercase font-semibold text-[13px] lg:text-[11px] md:text-[10px] flex items-center gap-0.5`}
                        onClick={() => {
                          if (item?.link) {
                            router.push(item.link);
                            reloadPage();
                          }
                        }}
                      >
                        {item?.title}
                        {item?.link && <GoArrowUpRight className="inline-block w-[14px] h-[14px] lg:w-[12px] lg:h-[12px] md:w-[11px] md:h-[11px]" />}
                      </div>
                      {(item?.sub_menu?.length || item?.master?.length > 0) && (
                        <div className="w-full">
                          {item?.master?.length > 0 && (
                            <div
                              className={
                                item?.is_multiple_column
                                  ? 'grid grid-cols-2 lg:grid-cols-1 py-2 gap-x-3 gap-y-1 w-full'
                                  : 'flex flex-col py-2 gap-1 w-full'
                              }
                            >
                              {item.is_master === true &&
                                item?.master?.map((masterItem: any, masterIndex: number) => {
                                  const findData = data?.find((el: any) => el.id === masterItem?.id);
                                  return (
                                    <div
                                      key={masterIndex}
                                      onClick={() => {
                                        router.push(masterItem.value);
                                        reloadPage();
                                      }}
                                      className="flex hover:text-[#256030] items-center cursor-pointer h-[30px] flex-row gap-1.5 min-w-0"
                                    >
                                      {masterItem && (
                                        <Image
                                          src={findData?.image?.[0] ?? '/images/no_images.svg'}
                                          alt={findData?.name}
                                          fallback="/images/no_images.svg"
                                          className="!w-6 !h-6 shrink-0 p-[0px] object-contain"
                                          preview={false}
                                        />
                                      )}
                                      <div className="cursor-pointer capitalize font-normal text-[13px] lg:text-[11px] md:text-[10px] whitespace-nowrap overflow-hidden text-ellipsis">
                                        {findData?.name}
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          )}
                          {item.is_master === false && item?.sub_menu?.length > 0 && item?.is_multiple_column ? (
                            <div className="grid grid-cols-2 lg:grid-cols-1 py-2 gap-x-3 gap-y-1 w-full">
                              {item.is_master === false &&
                                item?.sub_menu?.map((subItem: any, subIndex: number) => (
                                  <div
                                    key={subIndex}
                                    onClick={() => {
                                      router.push(subItem?.link);
                                      reloadPage();
                                    }}
                                    className="flex gap-1.5 hover:text-[#256030] cursor-pointer flex-row h-[30px] items-center min-w-0"
                                  >
                                    {subItem.image && (
                                      <Image
                                        preview={false}
                                        src={subItem.image ?? '/images/no_images.svg'}
                                        fallback="/images/no_images.svg"
                                        className="object-contain !w-6 !h-6 shrink-0 p-[0px]"
                                        alt={subItem.title}
                                      />
                                    )}
                                    <div className="cursor-pointer capitalize font-normal text-[13px] lg:text-[11px] md:text-[10px] whitespace-nowrap overflow-hidden text-ellipsis">
                                      {subItem?.title}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <div className="flex flex-col py-1 gap-1">
                              {item.is_master === false &&
                                item?.sub_menu?.map((subItem: any, subIndex: number) => (
                                  <div
                                    key={subIndex}
                                    onClick={() => {
                                      router.push(subItem?.link);
                                      reloadPage();
                                    }}
                                    className="flex gap-2 cursor-pointer hover:text-[#256030] h-[30px] items-center md:w-full flex-row"
                                  >
                                    {subItem.image && (
                                      <Image
                                        preview={false}
                                        src={subItem.image ?? '/images/no_images.svg'}
                                        fallback="/images/no_images.svg"
                                        className="object-contain !w-7 !h-7 p-[0px]"
                                        alt={subItem.title}
                                        // width={25}
                                        // height={25}
                                      />
                                    )}
                                    <div className={`cursor-pointer capitalize font-normal text-[13px] lg:text-[11px] md:text-[10px]`}>
                                      {subItem?.title}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            }
          })}
        </div>
        {Details?.menu_images?.length > 0 && (Details?.menu_images[0]?.link || Details?.menu_images[0]?.image) && (
          <div className="flex gap-3 border-l w-[270px] px-4 lg:px-3 md:px-2  lg:hidden flex-col ">
            {Details?.menu_images?.map((item: any, index: number) => (
              <div
                key={index}
                className="flex flex-col gap-2 cursor-pointer relative h-[180px] min-w-fit"
                onClick={() => {
                  router.push(item.link);
                  reloadPage();
                }}
              >
                <Image
                  src={`${item?.image ?? '/images/no_images.svg'}`}
                  fallback="/images/no_images.svg"
                  preview={false}
                  width={250}
                  height={180}
                  className="!h-[180px] object-cover"
                />
                <Text
                  size="textlg"
                  as="p"
                  className="absolute bottom-0  md:text-[11px] px-2 w-full !font-normal uppercase  bg-black/20 !text-[#ffffff]"
                >
                  {item?.title}
                </Text>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuPreview;
