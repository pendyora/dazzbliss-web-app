/* eslint-disable react-hooks/exhaustive-deps */

/** @format */

import React, { useEffect, useRef, useState } from 'react';

import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';
import { Swiper, SwiperProps, SwiperSlide } from 'swiper/react';

import 'swiper/css';
import 'swiper/css/navigation';

interface ICustomSwiperProps extends SwiperProps {
  products: any;
  trackingPath?: string;
  redirectionPath?: string;
  Component: any;
  cartFunctionality?: boolean;
  metalColorFunctionality?: boolean;
  wishlistFunctionality?: boolean;
  minimumProducts?: number;
  initialSlide?: number;
  navigation?: boolean;
  isButton?: boolean;
  loop?: boolean;
  seeAllButton?: boolean;
  mobileSlidesPerView?: number;
  style?: React.CSSProperties;
  onSlideChange?: any;
  showDefaultNavigation?: boolean;
  spaceBetween?: string;
  // mousewheel?: boolean;
  keyboard?: boolean;
  duplicateSlides?: boolean;
  className?: string;
  prevIcon?: any;
  nextIcon?: any;
  spaceBeforeIcons?: boolean;
  centeredSlides?: boolean;
  longArrow?: boolean;
  isExtraInfo?: boolean;
  extraCompo?: any;
  currentSlide?: number;
  isCenterZoom?: boolean;
  extraNavpadding?: boolean;
}

const createArrayWithMinimumLength = (minimumProducts: number, modifiedData: Array<any>, duplicateSlides: boolean, isMobile: boolean) => {
  const requiredLength = minimumProducts * 2;

  // Check if we need to duplicate the array based on conditions
  if (modifiedData.length < requiredLength && duplicateSlides && !isMobile) {
    // Calculate how many times we need to duplicate the array
    const timesToDuplicate = Math.ceil(requiredLength / modifiedData.length);

    // Duplicate the array by concatenating itself multiple times
    let duplicatedArray: any[] = [];
    for (let i = 0; i < timesToDuplicate; i++) {
      duplicatedArray = [...duplicatedArray, ...modifiedData];
    }

    // Slice the duplicated array to match the required length
    return duplicatedArray.slice(0, requiredLength);
  } else {
    // Return the original array if it already meets the length requirement
    return modifiedData.slice(0, requiredLength);
  }
};
const CustomSwiper = (props: ICustomSwiperProps) => {
  const {
    products,
    trackingPath,
    // redirectionPath,
    Component,
    // cartFunctionality,
    // metalColorFunctionality,
    duplicateSlides = true,
    // wishlistFunctionality,
    minimumProducts = 4,
    navigation = true,
    isButton,
    seeAllButton = true,
    mobileSlidesPerView = 1.6,
    style = {},
    initialSlide = 0,
    loop,
    onSlideChange = () => {
      console.log('onSlideChange');
    },
    showDefaultNavigation = false,
    spaceBetween = '40px',
    keyboard = false,
    mousewheel = false,
    className = '',
    prevIcon,
    nextIcon,
    spaceBeforeIcons = false,
    centeredSlides,
    longArrow,
    isExtraInfo,
    extraCompo,
    currentSlide,
    isCenterZoom,
    extraNavpadding = false,
    ...rest
  } = props;

  const [isCenterdSlice, setIsCenterdSlice] = useState(false);
  const swiperRef = useRef<any>(null);

  const handleNext = () => {
    if (swiperRef.current) {
      swiperRef.current.slideNext();
    }
  };
  const handlePrev = () => {
    if (swiperRef.current) {
      swiperRef.current.slidePrev();
    }
  };

  const handleCenterSlides = () => {
    const isOddNumber = minimumProducts % 2 !== 0;
    if (isOddNumber && centeredSlides) {
      setIsCenterdSlice(true);
    } else {
      setIsCenterdSlice(false);
    }
  };

  useEffect(() => {
    handleCenterSlides();
  }, []);

  return (
    <div className="relative">
      <Swiper
        speed={500}
        slidesPerView={products?.length < 2 ? 1 : minimumProducts}
        spaceBetween={spaceBetween}
        loop={loop !== undefined ? loop : true}
        navigation={{
          prevEl: null,
          nextEl: null,
        }}
        className={`${className ? className : 'product-swiper'} !w-[calc(100vw-600px)] 2xl:!w-[calc(100vw-300px)] xl:!w-[calc(100vw-320px)] lg:!w-[calc(100vw-180px)] md:!w-[calc(100vw-75px)] sm:!w-[calc(100vw-50px)]`}
        style={{ width: '100%', ...style }}
        wrapperClass="product-wrapper"
        onSwiper={(swiper: any) => (swiperRef.current = swiper)}
        initialSlide={initialSlide || 0}
        onSlideChange={onSlideChange}
        keyboard={{ enabled: keyboard }}
        mousewheel={mousewheel ? { forceToAxis: true, releaseOnEdges: false } : false}
        preventClicksPropagation={true}
        centeredSlides={isCenterdSlice}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...rest}
      >
        {products?.length > 0 &&
          [
            ...products,
            ...(duplicateSlides && products?.length < 8 && products?.length < minimumProducts
              ? createArrayWithMinimumLength(minimumProducts, products, duplicateSlides, false)
              : loop && isCenterdSlice
                ? products
                : []),
          ]?.map((item: any, index: any) => {
            return (
              <SwiperSlide key={index} className="swiper-slide" style={{ width: '100%' }}>
                <div
                  className={
                    isCenterdSlice && isCenterZoom
                      ? `${currentSlide === index ? 'flex justify-center carousel-image transition-transform duration-500 ease-in-out opacity-100 transform scale-[1.75] md:scale-150 active' : 'flex justify-center carousel-image transition-transform duration-500 ease-in-out opacity-50 transform scale-100 active:opacity-100 active:scale-180'}`
                      : ''
                  }
                >
                  <Component diamond={item} />
                </div>
              </SwiperSlide>
            );
          })}
      </Swiper>
      {prevIcon && nextIcon && navigation && (
        <div>
          <style>
            {`
                    .${className} > .swiper-button-prev::after, .${className} > .swiper-button-next::after {
                      display:none !important;
                    }
                    .${className} > .swiper-button-prev, .${className} > .swiper-button-next {
                      padding: 0px;
                      height: fit-content;
                    }
                  `}
          </style>
          <div className="swiper-button-prev" onClick={handlePrev}>
            {prevIcon}
          </div>
          <div className="swiper-button-next" onClick={handleNext}>
            {nextIcon}
          </div>
        </div>
      )}
      {/* Add navigation buttons */}
      {!showDefaultNavigation && !longArrow && navigation && products?.length > 1 && (
        <div
          className="absolute w-full top-[25%]"
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',

            marginTop: '40px',
            flex: 1,
          }}
        >
          <div
            style={{
              position: 'relative',
              cursor: 'pointer',
              // flex: 0.1,
              zIndex: 2000,
            }}
          >
            <HiOutlineChevronLeft
              style={{
                width: '100%',
                height: '40px',
                cursor: 'pointer',
                marginTop: '8px',
                position: 'relative',
              }}
              onClick={handlePrev}
              aria-label="prev"
            />
          </div>
          <div
            style={{
              position: 'relative',

              zIndex: 2000,
            }}
          >
            <HiOutlineChevronRight
              style={{
                width: '100%',
                height: '40px',
                cursor: 'pointer',
                marginTop: '8px',
                position: 'relative',
              }}
              aria-label="next"
              onClick={handleNext}
            />
          </div>
        </div>
      )}
      {isExtraInfo && <div>{extraCompo()}</div>}
      {longArrow || (longArrow && products?.length > 1) ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            boxSizing: 'content-box',
            marginBottom: '0px !important',
          }}
        ></div>
      ) : null}
    </div>
  );
};

export default CustomSwiper;
