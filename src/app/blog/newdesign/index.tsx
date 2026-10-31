'use client';
import React, { useEffect, useRef, useState } from 'react';

import { Button, Image } from 'antd';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { IoMdArrowBack, IoMdArrowForward } from 'react-icons/io';
import { LuLoader } from 'react-icons/lu';
import { Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import 'swiper/css';
import { Text } from '@/components';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchFeaturedViews } from '@/store/slices/blog/blogSlice';

const BlogPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { blogFeaturedViews } = useAppSelector((state) => state.blog);
  const [swiper, setSwiper] = useState<any>(null);
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  // const blogPosts = {
  //   grid_view: [
  //     {
  //       id: 1,
  //       title: '5 Simple Steps To Dress Up Your Room',
  //       date: '5 OCT, 2021',
  //       excerpt:
  //         'Lorem ipsum dolor sit amet, consectetur adipiscing elit lorem. Pellentesque ut mauris in Lorem ipsum dolor sit amet, consectetur adipiscing elit lorem. Pellentesque ut mauris in...',
  //     },
  //     ...Array(5)
  //       .fill({
  //         title: 'Lorum Ipsum Dolor Sit Amet Ipsum Dolor',
  //         date: '5 OCT, 2021',
  //         excerpt: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit lorem. Pellentesque ut mauris in consectetur adipiscing elit...',
  //       })
  //       .map((item, index) => ({ ...item, id: index + 2 })),
  //   ],
  //   slider_view: [
  //     {
  //       id: 1,
  //       title: '1 Simple Steps To Dress Up Your Room',
  //       date: '5 OCT, 2021',
  //       excerpt:
  //         'Lorem ipsum dolor sit amet, consectetur adipiscing elit lorem. Pellentesque ut mauris in Lorem ipsum dolor sit amet, consectetur adipiscing elit lorem. Pellentesque ut mauris in Lorem ipsum dolor sit amet, consectetur adipiscing elit lorem. Pellentesque ut mauris in Lorem ipsum dolor sit amet, consectetur adipiscing elit lorem. Pellentesque ut mauris in...',
  //     },
  //     ...Array(9)
  //       .fill({
  //         title: 'Lorum Ipsum Dolor Sit Amet Ipsum Dolor',
  //         date: '5 OCT, 2021',
  //         excerpt: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit lorem. Pellentesque ut mauris in consectetur adipiscing elit...',
  //       })
  //       .map((item, index) => ({ ...item, id: index + 2 })),
  //   ],
  // };

  // console.log(blogFeaturedViews, 'blogFeaturedViews');
  useEffect(() => {
    if (Object.keys(blogFeaturedViews).length == 0) {
      dispatch(fetchFeaturedViews());
    }
  }, [dispatch, blogFeaturedViews]);
  return Object.keys(blogFeaturedViews).length == 0 ? (
    <div className="flex flex-col items-center gap-[60px] min-h-[50vh] justify-center">
      <div className="w-full flex justify-center items-center">
        <LuLoader className="h-10 w-10 animate-spin text-primary" />
      </div>
    </div>
  ) : (
    <div className="px-52 lg:px-20 md:px-10 sm:px-4 sm:pt-4 pt-10 pb-5 max-w-screen-xl mx-auto font-serif">
      {/* Featured Post */}
      <div className="relative">
        <Swiper
          spaceBetween={30}
          slidesPerView={1}
          className="mb-14 sm:mb-8"
          modules={[Navigation]}
          navigation={{
            prevEl: prevRef.current,
            nextEl: nextRef.current,
          }}
          onSwiper={(swiperInstance) => {
            setSwiper(swiperInstance);
          }}
          loop={false}
          autoplay={false}
        >
          {blogFeaturedViews?.slider_view?.map((post: any) => (
            <SwiperSlide key={post.id} className="">
              <div
                className="grid grid-cols-2 gap-6 sm:gap-2 md:grid-cols-1 items-center w-full cursor-pointer"
                onClick={() => {
                  router.push(`/blog/${post?.slug}`);
                  // console.log(post?.slug);
                }}
              >
                <div className="flex justify-center md:justify-normal  h-auto md:h-fit sm:h-fit">
                  <Image
                    src={post?.thumbnail_image}
                    alt={post?.title}
                    // className="object-cover"
                    preview={false}
                    style={{
                      objectFit: 'cover',
                      width: '100%', // Adjust width as needed (can be a fixed value or percentage)
                      height: 'auto',
                      aspectRatio: '31/19', // Maintains the aspect ratio of 31:19
                    }}
                  />
                </div>
                <div className="h-full flex flex-col justify-center">
                  <p className={`font-notosans mb-4 ${post?.title?.length >= 100 ? 'text-[26px] leading-[2.7rem]' : 'text-[48px] leading-[3.7rem]'}`}>
                    {post?.title}
                  </p>
                  <p className="text-sm font-notosans text-gray-500 mb-4">{dayjs(post?.createdAt).format(`MMMM DD, YYYY`)}</p>
                  <p className="font-notosans text-gray-700">
                    {post?.subtitle?.length > 220 ? `${post?.subtitle?.substring(0, 220)}...` : post?.subtitle}
                  </p>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        <div className="absolute -bottom-[20px] md:bottom-[40%] -translate-y-1/2 left-[138px] md:left-0 right-0 z-10 flex justify-center md:justify-between gap-12 px-4 md:px-2">
          <button
            ref={prevRef}
            className="bg-white border border-gray-500 rounded-full w-8 h-8 flex items-center justify-center  hover:bg-gray-100 transition-colors"
          >
            {/* <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg> */}
            <IoMdArrowBack className="h-5 w-5 text-gray-500" />
          </button>
          <button
            ref={nextRef}
            className="bg-white border border-gray-500 rounded-full w-8 h-8 flex items-center justify-center  hover:bg-gray-100 transition-colors"
          >
            {/* <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg> */}
            <IoMdArrowForward className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Blog List */}
      <div className="grid grid-cols-3 md:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-3 mb-14">
        {blogFeaturedViews?.grid_view?.map((post: any) => (
          <div
            key={post.id}
            className="cursor-pointer"
            onClick={() => {
              router.push(`/blog/${post?.slug}`);
              // console.log(post?.slug);
            }}
          >
            <div className="flex justify-center">
              <Image
                src={post?.thumbnail_image}
                alt={post.title}
                className="mb-4"
                preview={false}
                style={{
                  objectFit: 'cover',
                  width: '100%', // Adjust width as needed (can be a fixed value or percentage)
                  height: 'auto',
                  aspectRatio: '31/19', // Maintains the aspect ratio of 31:19
                }}
              />
            </div>
            <Text className="text-xl font-notosans font-semibold mb-2">
              {post?.title?.length > 80 ? `${post?.title?.substring(0, 80)}...` : post?.title}
            </Text>
            <p className="text-sm font-notosans text-gray-500 mb-2">{dayjs(post?.createdAt).format(`MMMM DD, YYYY`)}</p>
            <p className="font-notosans text-gray-700">{post?.subtitle?.length > 80 ? `${post?.subtitle?.substring(0, 80)}...` : post?.subtitle}</p>
          </div>
        ))}
      </div>

      <div className="w-full flex justify-center">
        <Button
          className="min-w-[200px]  border !border-black uppercase"
          onClick={() => {
            router.push('/blog/all-blogs');
          }}
        >
          Discover More
        </Button>
      </div>
    </div>
  );
};

export default BlogPage;
