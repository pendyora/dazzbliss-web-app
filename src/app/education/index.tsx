/* eslint-disable react-hooks/exhaustive-deps */

'use client';

import React, { Suspense, useEffect, useMemo } from 'react';

import { Image, Pagination } from 'antd';
import dayjs from 'dayjs';
import Link from 'next/link';
import { LuLoader } from 'react-icons/lu';

import { useAppDispatch, useAppSelector } from '../../store';
import { Text } from './../../components';
import {
  fetchEducationFilter,
  fetchEducationList,
  setEducationPage,
  setEducationPrevPage,
  setEducationSelectedCategory,
  setEducationSelectedFilter,
} from '../../store/slices/education/educationSlice';

export default function EducationPage({ BannerData }: any) {
  const dispatch = useAppDispatch();
  const masterData = useAppSelector((state) => state.master.data);
  const {
    loading,
    educationList,
    educationFilter,
    educationSelectedCategory,
    educationSelectedFilter,
    educationCounts,
    educationPage,
    educationPrevPage,
  } = useAppSelector((state: any) => state.education);
  const CHUNK_SIZE = 4;
  const PAGE_LIMIT = 50;

  useEffect(() => {
    if (!educationFilter) {
      dispatch(fetchEducationFilter());
    }
    if (!educationSelectedCategory) {
      dispatch(setEducationSelectedCategory('all'));
    }
  }, []);

  useEffect(() => {
    if (!educationList?.length || educationSelectedCategory !== educationSelectedFilter) {
      dispatch(fetchEducationList({ education_type_id: educationSelectedFilter, page: 1, size: PAGE_LIMIT })).then(() => {
        dispatch(setEducationSelectedCategory(educationSelectedFilter ?? 'all'));
      });
    }
  }, [educationSelectedFilter]);

  useEffect(() => {
    if (educationPrevPage !== educationPage && educationList?.length !== 0) {
      dispatch(fetchEducationList({ education_type_id: educationSelectedFilter, page: educationPage, size: PAGE_LIMIT }));
    }
    // Update the ref with the current page after the effect runs
    dispatch(setEducationPrevPage(educationPage));
  }, [educationPage]);
  const chunkedData = useMemo(() => {
    if (!educationList?.length) {
      return [];
    }
    return Array.from({ length: Math.ceil(educationList.length / CHUNK_SIZE) }, (_, i) =>
      educationList.slice(i * CHUNK_SIZE, i * CHUNK_SIZE + CHUNK_SIZE),
    );
  }, [educationList]);
  console.log(BannerData, 'BannerData');

  return (
    <div className="w-full bg-[#ffffff]">
      <div
        className={`flex !h-[380px] items-center justify-center py-[30px] 2xl:h-[380px] xl:h-[280px] xl:py-8 lg:h-[280px] sm:!h-[200px] lg:py-8 md:py-5 sm:py-4`}
        style={{
          backgroundImage: BannerData?.banner_image?.[0]?.desktop_image
            ? `url(${BannerData?.banner_image?.[0]?.desktop_image})`
            : "bg-[url('/images/blogbanner.png')]",
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="container-xs flex justify-center px-14 2xl:px-[160px] xl:px-28 lg:px-20 md:px-5 sm:px-3">
          <Text size="text5xl" as="p" className="uppercase !text-[#ffffff] md:text-[26px] sm:text-[22px]">
            {BannerData?.banner_image?.[0]?.title || 'Education'}
          </Text>
        </div>
      </div>
      {loading ? (
        <div className="w-full h-[60vh] flex justify-center items-center">
          <LuLoader className="h-7 w-7 animate-spin" />
        </div>
      ) : (
        <div>
          <div className="mt-[30px] sm:mt-3 flex flex-col items-center">
            <div className="container-xs flex flex-col gap-[20px] xl:px-16 lg:px-16 md:px-5 sm:px-3 sm:gap-3 2xl:px-[160px]">
              <p className="text-[20px] sm:text-[16px]">CATEGORY</p>
              <div className="flex flex-wrap sm:flex-nowrap sm:gap-2  sm:overflow-scroll justify-between ">
                <div className="flex gap-4 flex-wrap self-stretch  overflow-auto py-2">
                  {educationFilter?.map((type: any, index: number) => {
                    const category = index == 0 ? type.type : masterData?.find((el: any) => el.id === type.type);
                    return (
                      <div
                        key={index}
                        className={`flex flex-col  !text-black items-center cursor-pointer gap-2 sm:gap-2 sm:w-fit py-1.5 px-2 ${
                          educationSelectedFilter === type?.type ? 'opacity-100 border-b border-black ' : 'opacity-30 border-b border-transparent'
                        } ${educationSelectedFilter == 'all' && 'opacity-100 border-b border-black '}}`}
                        onClick={() => {
                          dispatch(setEducationSelectedFilter(type?.type));
                        }}
                      >
                        <p className="tracking-[1.0px] text-nowrap text-center text-[18px] capitalize">{category?.name ?? category}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="border-b min-h-[60vh] border-solid border-[#3b3b3b] py-[50px] 2xl:py-5 xl:py-10 lg:py-8 md:py-5 sm:py-3">
            <div className="mb-5 flex flex-col items-center">
              <div className="container-xs flex flex-col items-center gap-[60px] 2xl:px-[160px] xl:px-28 lg:px-20 md:px-5 sm:px-3">
                <div className="self-stretch">
                  <div className="">
                    <Suspense fallback={<div>Loading feed...</div>}>
                      {chunkedData?.map((chunk: any, i: number) => {
                        return (
                          <div key={i} className="grid grid-cols-4 justify-center xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1">
                            {chunk?.map((item: any, index: number) => (
                              <div
                                key={index}
                                className={`border-black border-r border-b sm:border-l ${index == 0 && 'border-l'} ${i == 0 && 'border-t sm:first:border-t sm:border-t-0'}`}
                              >
                                <Link href={`/education/${item?.slug}`}>
                                  <div className={` flex flex-col items-center w-full gap-6 p-5 sm:gap-1 sm:p-2`}>
                                    <div className="flex items-start justify-between  gap-5 self-stretch ">
                                      <Image
                                        src={item?.thumbnail_image || '/images/noImage1.svg'}
                                        width={200}
                                        height={198}
                                        preview={false}
                                        alt={`${item?.title}-alt`}
                                        fallback="/images/noImage1.svg"
                                        className="self-center object-cover"
                                      />
                                      <Text size="textmd" as="p" className="rotate-[90deg] !font-light mt-5 -mr-5">
                                        {dayjs(item?.createdAt).format('DD.MM.YYYY')}
                                      </Text>
                                    </div>
                                    <div className="flex flex-col items-start gap-[18px] sm:gap-2 self-stretch">
                                      <Text size="textlg" as="p" className="w-full leading-[18px] text-lg">
                                        {item?.title}
                                      </Text>
                                      <Text size="textmd" as="p" className="capitalize underline">
                                        {item?.readMoreLink || 'Read more'}
                                      </Text>
                                    </div>
                                  </div>
                                </Link>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </Suspense>
                  </div>
                  {educationCounts >= PAGE_LIMIT && (
                    <div className="py-4 w-full flex justify-end">
                      <Pagination
                        current={educationPage}
                        pageSize={PAGE_LIMIT}
                        total={educationCounts}
                        onChange={(page) => dispatch(setEducationPage(page))}
                        // className="mt-5"
                        showSizeChanger={false}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
