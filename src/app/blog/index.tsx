'use client';
import React, { useEffect, useRef, useState, useMemo } from 'react';

import { Button, Image, Input } from 'antd';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { HiArrowLongRight, HiMinus } from 'react-icons/hi2';
import { IoMdArrowBack, IoMdArrowForward } from 'react-icons/io';
import { LuLoader } from 'react-icons/lu';
import { Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import 'swiper/css';
import { Text } from '@/components';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchFeaturedViews, fetchBlogMapping } from '@/store/slices/blog/blogSlice';

const BlogPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { blogFeaturedViews, categoryMapping } = useAppSelector((state) => state.blog);
  const [categorySwiper, setCategorySwiper] = useState<any>(null);
  const [featuredSwiper, setFeaturedSwiper] = useState<any>(null);
  const categoryPrevRef = useRef(null);
  const categoryNextRef = useRef(null);
  const featuredPrevRef = useRef(null);
  const featuredNextRef = useRef(null);
  const [isCategoryBeginning, setIsCategoryBeginning] = useState(true);
  const [isCategoryEnd, setIsCategoryEnd] = useState(false);
  const [isFeaturedBeginning, setIsFeaturedBeginning] = useState(true);
  const [isFeaturedEnd, setIsFeaturedEnd] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');
  const [showCategoryNavigation, setShowCategoryNavigation] = useState(false);
  const [windowWidth, setWindowWidth] = useState<number>(0);

  useEffect(() => {
    setWindowWidth(window.innerWidth);

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const categories = useMemo(
    () => [
      { id: 'all', category_name: 'All', category_link: '/blog/all-blogs' },
      ...(categoryMapping
        ? [...categoryMapping]
            .sort((a: { sequence: number }, b: { sequence: number }) => a.sequence - b.sequence)
            .map((category: { id: number; category_name: string; category_link: string }) => ({
              id: category.id.toString(),
              category_name: category.category_name,
              category_link: category.category_link,
            }))
        : []),
    ],
    [categoryMapping],
  );

  const handleCategoryClick = (categoryId: string, categoryLink: string) => {
    setActiveCategory(categoryId);
    router.push(categoryLink);
  };

  useEffect(() => {
    if (Object.keys(blogFeaturedViews ?? {}).length == 0) {
      dispatch(fetchFeaturedViews());
    }
    if (categoryMapping.length == 0) {
      dispatch(fetchBlogMapping());
    }
  }, [dispatch, blogFeaturedViews, categoryMapping.length]);

  useEffect(() => {
    setShowCategoryNavigation(categories.length > 6.5); // 6.5 is the slidesPerView value
  }, [categories]);

  return Object.keys(blogFeaturedViews ?? {}).length == 0 ? (
    <div className="flex flex-col items-center gap-[60px] min-h-[50vh] justify-center">
      <div className="w-full flex justify-center items-center">
        <LuLoader className="h-10 w-10 animate-spin text-primary" />
      </div>
    </div>
  ) : (
    <div className="px-52 lg:px-20 md:px-10 sm:px-4 sm:pt-4 pt-5 pb-5 max-w-screen-xl mx-auto font-serif">
      <div className="py-5 sm:py-0 px-0 md:px-0s max-w-7xl mx-auto mb-8">
        <div className="flex flex-col">
          <h1 className="text-[48px] md:text-5xl sm:text-[35px] font-medium font-notosans text-neutral-800 tracking-tight">
            THE <span className="font-normal">BLOGS</span>
          </h1>
          <p className="mt-4 sm:mt-2 text-neutral-700 font-notosans sm:text-[14px]">
            Inspiration, Trends & Timeless Beauty from the World of Jewelry.
          </p>
        </div>
        {/* <div></div> */}
        <div className="relative mt-10 sm:mt-5">
          <Swiper
            spaceBetween={10}
            slidesPerView={
              windowWidth < 640
                ? 2.5 // sm
                : windowWidth < 768
                  ? 3.5 // md
                  : windowWidth < 1024
                    ? 4.5 // lg
                    : windowWidth < 1536
                      ? 5.5 // xl
                      : 6.5 // 2xl
            }
            className={`category-swiper relative ${showCategoryNavigation ? 'w-[93%]' : 'w-[100%]'}`}
            modules={[Navigation]}
            navigation={{
              prevEl: categoryPrevRef.current,
              nextEl: categoryNextRef.current,
            }}
            onSwiper={(swiperInstance) => {
              setCategorySwiper(swiperInstance);
            }}
            onSlideChange={(swiper) => {
              setIsCategoryBeginning(swiper.isBeginning);
              setIsCategoryEnd(swiper.isEnd);
            }}
            onBeforeInit={(swiper) => {
              if (typeof swiper.params.navigation !== 'boolean') {
                if (swiper.params.navigation) {
                  swiper.params.navigation.prevEl = categoryPrevRef.current;
                  swiper.params.navigation.nextEl = categoryNextRef.current;
                }
              }
            }}
            loop={false}
          >
            <div className="absolute top-0 left-0  h-full w-[20px] z-10 bg-gradient-to-r from-white"></div>
            {categories.map((category) => (
              <SwiperSlide key={category.id} className={`cursor-pointer ${category.id == 'all' ? '!w-fit !ml-4' : '!min-w-fit'}`}>
                <div
                  className={`flex justify-center items-center py-2 px-4 transition hover:!bg-secondary hover:!text-text_w ${
                    activeCategory === category.id ? 'bg-secondary text-white' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  onClick={() => handleCategoryClick(category.id, category.category_link)}
                >
                  <p className="text-sm font-notosans text-nowrap font-medium">{category.category_name}</p>
                </div>
              </SwiperSlide>
            ))}
            <div className="absolute top-0 right-0  h-full w-[20px] z-10 bg-gradient-to-l from-white"></div>
          </Swiper>
          {showCategoryNavigation && (
            <>
              <div className="absolute top-1/2 -translate-y-1/2 left-0 z-10">
                <button
                  ref={categoryPrevRef}
                  className={`bg-white border border-gray-500 rounded-full w-8 h-8 flex items-center justify-center transition-colors ${
                    isCategoryBeginning ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
                  }`}
                  disabled={isCategoryBeginning}
                >
                  <IoMdArrowBack className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <div className="absolute top-1/2 -translate-y-1/2 right-0 z-10">
                <button
                  ref={categoryNextRef}
                  className={`bg-white border border-gray-500 rounded-full w-8 h-8 flex items-center justify-center transition-colors ${
                    isCategoryEnd ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
                  }`}
                  disabled={isCategoryEnd}
                >
                  <IoMdArrowForward className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      {/* Featured Post */}
      <div className="relative">
        <Swiper
          spaceBetween={30}
          slidesPerView={1}
          className="mb-14 sm:mb-8"
          modules={[Navigation]}
          navigation={{
            prevEl: featuredPrevRef.current,
            nextEl: featuredNextRef.current,
          }}
          onSwiper={(swiperInstance) => {
            setFeaturedSwiper(swiperInstance);
          }}
          onSlideChange={(swiper) => {
            setIsFeaturedBeginning(swiper.isBeginning);
            setIsFeaturedEnd(swiper.isEnd);
          }}
          onBeforeInit={(swiper) => {
            if (typeof swiper.params.navigation !== 'boolean') {
              if (swiper.params.navigation) {
                swiper.params.navigation.prevEl = featuredPrevRef.current;
                swiper.params.navigation.nextEl = featuredNextRef.current;
              }
            }
          }}
          loop={true}
          autoplay={false}
        >
          {blogFeaturedViews?.slider_view?.slice(0, 1)?.map((post: any) => (
            <SwiperSlide key={post.id} className="">
              <div
                className="flex sm:flex-col gap-[40px] md:gap-[28px] sm:gap-6 items-center w-full cursor-pointer"
                onClick={() => {
                  router.push(`/blog/${post?.slug}`);
                }}
              >
                <div className="flex justify-center md:justify-normal bg-[#f8f8f8] max-w-[54%] sm:max-w-full !aspect-[31/19] w-full h-auto">
                  <Image
                    src={post?.thumbnail_image}
                    alt={post?.title}
                    className="bg-[#f8f8f8] !w-full !h-full"
                    preview={false}
                    loading="lazy"
                    fallback="/images/ashclair_pdp_logo_image.svg"
                    style={{
                      objectFit: 'cover',
                      aspectRatio: '31/19',
                    }}
                  />
                </div>
                <div className="flex-1 flex flex-col gap-[22px] lg:gap-[18px] md:gap-[10px] relative">
                  <p className="text-[15px] md:text-[12px] font-notosans text-gray-400 uppercase">{dayjs(post?.createdAt).format(`MMMM DD, YYYY`)}</p>
                  <p
                    className={`font-notosans text-[48px] lg:text-[28px] md:text-[20px] leading-[3.7rem] lg:leading-[34px] md:leading-[30px] text-balance -mt-[5px] lg:-mt-[5px]`}
                  >
                    {post?.title}
                  </p>
                  {post?.subtitle && (
                    <p className="font-notosans text-gray-500 lg:text-[14px] md:text-[12px]">
                      {post?.subtitle?.length > 220 ? `${post?.subtitle?.substring(0, 150)}...` : post?.subtitle}
                    </p>
                  )}
                  <div className="flex gap-2 items-center">
                    <HiMinus className="w-6 h-6 -mr-4" />
                    <HiArrowLongRight className="w-6 h-6" />
                    <p className="text-[12px] uppercase font-notosans md:text-[11px]">Read More</p>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        {blogFeaturedViews?.slider_view?.slice(0, 1)?.length > 1 && (
          <div className="absolute -bottom-[20px] md:bottom-[40%] -translate-y-1/2 left-[138px] md:left-0 right-0 z-10 flex justify-center md:justify-between gap-12 px-4 md:px-2">
            <button
              ref={featuredPrevRef}
              className={`bg-white border border-gray-500 rounded-full w-8 h-8 flex items-center justify-center transition-colors ${
                isFeaturedBeginning ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
              }`}
              disabled={isFeaturedBeginning}
            >
              <IoMdArrowBack className="h-5 w-5 text-gray-500" />
            </button>
            <button
              ref={featuredNextRef}
              className={`bg-white border border-gray-500 rounded-full w-8 h-8 flex items-center justify-center transition-colors ${
                isFeaturedEnd ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
              }`}
              disabled={isFeaturedEnd}
            >
              <IoMdArrowForward className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        )}
      </div>

      {/* Blog List */}
      <div className="grid grid-cols-3 md:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-3 mb-14">
        {blogFeaturedViews?.grid_view?.map((post: any) => (
          <div
            key={post.id}
            className="cursor-pointer p-0"
            onClick={() => {
              router.push(`/blog/${post?.slug}`);
              // console.log(post?.slug);
            }}
          >
            <div className="flex justify-center aspect-[31/19] mb-4 bg-[#f8f8f8]">
              <Image
                src={post?.thumbnail_image}
                alt={post.title}
                className="bg-[#f8f8f8] !w-full !h-full"
                preview={false}
                fallback="/images/ashclair_pdp_logo_image.svg"
                loading="lazy" // Enables lazy loading
                style={{
                  objectFit: 'cover',
                  width: '100%', // Adjust width as needed (can be a fixed value or percentage)
                  height: '100%',
                  aspectRatio: '31/19', // Maintains the aspect ratio of 31:19
                }}
              />
            </div>
            <div className="flex flex-col gap-3 sm:gap-[8px]">
              <p className="text-sm font-notosans text-gray-400 uppercase sm:text-[10px]">{dayjs(post?.createdAt).format(`MMMM DD, YYYY`)}</p>
              <Text className="text-xl sm:text-[13px] sm:leading-[20px] font-notosans  font-semibold sm:-mt-[8px]">
                {post?.title?.length > 78 ? `${post?.title?.substring(0, 78)}...` : post?.title}
              </Text>
              {post?.subtitle && (
                <p className="font-notosans text-gray-500 text-[12px] sm:text-[10px] w-full">
                  {post?.subtitle?.length > 177 ? `${post?.subtitle?.substring(0, 177)}...` : post?.subtitle}
                </p>
              )}
              <div className="flex gap-2 items-center">
                <HiMinus className="w-4 h-4 -mr-4" />
                <HiArrowLongRight className="w-4 h-4" />
                <p className="text-[12px] uppercase font-notosans sm:text-[10px]">Read More</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="w-full flex justify-center">
        <Button
          className="min-w-[200px]  border !border-black uppercase hover:!bg-secondary hover:!text-text_w hover:!border-secondary"
          onClick={() => {
            router.push('/blog/all-blogs');
          }}
        >
          More Blogs
        </Button>
      </div>
    </div>
  );
};

export default BlogPage;
