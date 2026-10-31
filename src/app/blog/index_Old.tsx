/* eslint-disable react-hooks/exhaustive-deps */

'use client';

import React, { Suspense, useEffect, useMemo } from 'react';

import { Pagination } from 'antd';
import { LuLoader } from 'react-icons/lu';

import { Text } from '@/components';
import UserProfile4 from '@/components/UserProfile4';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchBlogFilter,
  fetchBlogList,
  setBlogPage,
  setBlogSelectedCategory,
  setBlogSelectedFilter,
  setPrevBlogPage,
} from '@/store/slices/blog/blogSlice';

export default function BLOGPage({ BlogBanner }: any) {
  const dispatch = useAppDispatch();
  const masterData = useAppSelector((state) => state.master.data);
  const { loading, blogList, blogFilter, blogSelectedCategory, blogSelectedFilter, blogCounts, blogPage, blogPrevPage } = useAppSelector(
    (state: any) => state.blog,
  );
  const CHUNK_SIZE = 4;
  const PAGE_LIMIT = 50;
  useEffect(() => {
    if (!blogFilter) {
      dispatch(fetchBlogFilter());
    }
    if (!blogSelectedCategory) {
      dispatch(setBlogSelectedCategory('all'));
    }
  }, []);

  useEffect(() => {
    if (!blogList?.length || blogSelectedCategory !== blogSelectedFilter) {
      dispatch(fetchBlogList({ blog_type_id: blogSelectedFilter, page: 1, size: PAGE_LIMIT })).then(() => {
        dispatch(setBlogSelectedCategory(blogSelectedFilter ?? 'all'));
      });
    }
  }, [blogSelectedFilter]);

  useEffect(() => {
    if (blogPrevPage !== blogPage && blogList?.length !== 0) {
      dispatch(fetchBlogList({ blog_type_id: blogSelectedFilter, page: blogPage, size: PAGE_LIMIT }));
    }
    // Update the ref with the current page after the effect runs
    dispatch(setPrevBlogPage(blogPage));
  }, [blogPage]);
  const chunkedData = useMemo(() => {
    if (!blogList?.length) {
      return [];
    }
    return Array.from({ length: Math.ceil(blogList.length / CHUNK_SIZE) }, (_, i) => blogList.slice(i * CHUNK_SIZE, i * CHUNK_SIZE + CHUNK_SIZE));
  }, [blogList]);
  // console.log(BlogBanner, 'BlogBanner');

  return (
    <div className="w-full bg-[#ffffff]">
      <div
        className="flex !h-[380px] items-center justify-center  py-[30px] 2xl:h-[380px] xl:h-[280px] xl:py-8 lg:h-[280px] sm:!h-[200px] lg:py-8 md:py-5 sm:py-4"
        style={{
          backgroundImage: BlogBanner?.banner_image?.[0]?.desktop_image
            ? `url(${BlogBanner?.banner_image?.[0]?.desktop_image})`
            : "bg-[url('/images/blogbanner.png')]",
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="container-xs flex justify-center px-14 2xl:px-[160px] xl:px-28 lg:px-20 md:px-5 sm:px-3">
          <Text size="text5xl" as="p" className="uppercase !text-[#ffffff] md:text-[26px] sm:text-[22px]">
            {BlogBanner?.banner_image?.[0]?.title || 'our journal'}
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
                  {blogFilter?.map((type: any, index: number) => {
                    const category = index == 0 ? type.type : masterData?.find((el: any) => el.id === type.type);
                    return (
                      <div
                        key={index}
                        className={`flex flex-col  !text-black items-center cursor-pointer gap-2 sm:gap-2 sm:w-fit py-1.5 px-2 ${
                          blogSelectedFilter === type?.type ? 'opacity-100 border-b border-black ' : 'opacity-30 border-b border-transparent'
                        } ${blogSelectedFilter == 'all' && 'opacity-100 border-b border-black '}}`}
                        onClick={() => {
                          dispatch(setBlogSelectedFilter(type?.type));
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
                                <UserProfile4 {...item} />
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </Suspense>
                  </div>
                  {blogCounts >= PAGE_LIMIT && (
                    <div className="py-4 w-full flex justify-end">
                      <Pagination
                        current={blogPage}
                        pageSize={PAGE_LIMIT}
                        total={blogCounts}
                        onChange={(page) => dispatch(setBlogPage(page))}
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
