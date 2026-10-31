'use client';

import React, { useState, useRef, useEffect } from 'react';

import { Image } from 'antd';
import { FaInstagram, FaPlay } from 'react-icons/fa';
import { FaFacebook, FaLinkedin, FaPinterest, FaTwitter, FaYoutube } from 'react-icons/fa6';
import { IoMdClose } from 'react-icons/io';
import { MdArrowForwardIos, MdArrowBackIos } from 'react-icons/md';
import { Navigation, EffectCoverflow } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/effect-coverflow';

import { useAppDispatch, useAppSelector } from '@/store';
import { fetchSocialPosts } from '@/store/slices/Social/socialSlice';

import { Text } from '../../components';

const sourceOptions = [
  { label: 'Instagram', value: '0', icon: <FaInstagram className="mr-2" /> },
  { label: 'YouTube', value: '1', icon: <FaYoutube className="mr-2" /> },
  { label: 'Facebook', value: '2', icon: <FaFacebook className="mr-2" /> },
  { label: 'Twitter', value: '3', icon: <FaTwitter className="mr-2" /> },
  { label: 'LinkedIn', value: '4', icon: <FaLinkedin className="mr-2" /> },
  { label: 'Pinterest', value: '5', icon: <FaPinterest className="mr-2" /> },
];

const OurCollaborations = () => {
  const dispatch = useAppDispatch();
  const socialPost = useAppSelector((state) => state.Social?.data);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [mounted, setMounted] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<boolean>(false);

  const swiperRef = useRef<any>(null);
  const thumbnailVideoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const popupVideoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const suggestedJewelry = socialPost[activeIndex]?.suggestedJewelry || [];
  const totalSlides = suggestedJewelry.length;

  const [mainIsBeginning, setMainIsBeginning] = useState(true);
  const [mainIsEnd, setMainIsEnd] = useState(false);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);

  const handleCardClick = (index: number) => {
    setVideoError(false);
    setActiveIndex(index);
    setIsOpen(true);
  };

  const stopAllPopupVideos = () => {
    popupVideoRefs.current.forEach((video) => {
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
    });
  };

  const setThumbnailVideoRef = (el: HTMLVideoElement | null, index: number) => {
    thumbnailVideoRefs.current[index] = el;
  };

  const setPopupVideoRef = (el: HTMLVideoElement | null, index: number) => {
    popupVideoRefs.current[index] = el;
  };

  useEffect(() => {
    dispatch(fetchSocialPosts());
    setMounted(true);
  }, [dispatch]);

  useEffect(() => {
    if (isOpen) {
      const currentVideo = popupVideoRefs.current[activeIndex];
      if (currentVideo) {
        currentVideo.play();
      }
    }
    return () => stopAllPopupVideos();
  }, [isOpen, activeIndex]);

  useEffect(() => {
    thumbnailVideoRefs.current.forEach((video) => {
      if (video) {
        video
          .play()
          .then(() => {
            video.pause();
            video.currentTime = 0;
          })
          .catch(() => {
            if (video.readyState >= 1) {
              video.currentTime = 0.1;
            } else {
              setVideoError(true);
            }
          });
      }
    });
  }, [socialPost]);

  if (!mounted) {
    return null;
  }

  return (
    socialPost?.length > 0 && (
      <div className="relative mt-[64px] flex flex-col items-center lg:mt-10 2xl:mt-14 xl:mt-14 sm:mt-[20px]">
        <div className="container-xs 2xl:px-[100px] xl:px-24 lg:px-20 md:px-5 sm:px-3 sm:py-3">
          <div className="flex flex-wrap items-center justify-between gap-5 self-stretch px-[0px] md:px-5 sm:px-0">
            <Text
              size="text5xl"
              as="p"
              className="uppercase tracking-[2.20px] md:text-[26px] sm:w-full sm:text-center sm:!text-[20px] lg:text-[22px] pb-9"
            >
              Our Collaborations
            </Text>
          </div>

          <div className="relative">
            <Swiper
              spaceBetween={20}
              onSlideChange={(swiper) => {
                setMainIsBeginning(swiper.isBeginning);
                setMainIsEnd(swiper.isEnd);
              }}
              onAfterInit={(swiper) => {
                setMainIsBeginning(swiper.isBeginning);
                setMainIsEnd(swiper.isEnd);
              }}
              navigation={{ nextEl: '.custom-next', prevEl: '.custom-prev' }}
              modules={[Navigation]}
              breakpoints={{
                0: { slidesPerView: 1.4 },
                640: { slidesPerView: 3 },
                868: { slidesPerView: 5 },
              }}
            >
              {socialPost?.map((item, index) => {
                return (
                  <SwiperSlide key={item.id}>
                    <div className="relative video-card">
                      <div
                        onClick={() => handleCardClick(index)}
                        className="bg-black rounded-xl overflow-hidden text-white cursor-pointer relative aspect-[9/15]"
                      >
                        <div className="relative w-full h-full">
                          <a
                            href={item.account_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="absolute top-3 text-3xl right-3 z-10"
                          >
                            {sourceOptions?.find((s) => s.value == item.source.toString())?.icon}
                          </a>

                          <div className="custom-play-icon absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 border border-white rounded-full w-8 h-8 flex items-center justify-center bg-transparent">
                            <FaPlay className="text-white text-sm" />
                          </div>
                          {item.video_url && !videoError ? (
                            <video
                              ref={(el) => setThumbnailVideoRef(el, index)}
                              className="absolute inset-0 w-full h-full object-cover"
                              src={item.video_url}
                              loop
                              muted
                              playsInline
                              onMouseEnter={() => thumbnailVideoRefs.current[index]?.play()}
                              onMouseLeave={() => {
                                const video = thumbnailVideoRefs.current[index];
                                if (video) {
                                  video.pause();
                                  video.currentTime = 0;
                                }
                              }}
                              onError={() => setVideoError(true)}
                            />
                          ) : (
                            <div className="absolute inset-0 w-full h-full flex items-center justify-center text-white text-sm">
                              <Image
                                src="/images/ashclair_pdp_logo_image.svg"
                                alt="Asclair"
                                preview={false}
                                width={'100%'}
                                height={'100%'}
                                className="!bg-secondary"
                              />
                            </div>
                          )}
                        </div>

                        <div className="absolute bottom-2 w-full px-3 py-2 z-10">
                          <p className="text-xl font-normal">{item.title}</p>
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                );
              })}
            </Swiper>

            <button
              className={`custom-prev block sm:hidden absolute left-[-45px] top-1/2 -translate-y-1/2 z-10
    ${mainIsBeginning ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
              disabled={mainIsBeginning}
            >
              <MdArrowBackIos className="font-thin text-2xl text-[#2f2f2f]" />
            </button>

            <button
              className={`custom-next block sm:hidden absolute right-[-55px] top-1/2 -translate-y-1/2 z-10
    ${mainIsEnd ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
              disabled={mainIsEnd}
            >
              <MdArrowForwardIos className="font-thin text-2xl text-[#2f2f2f]" />
            </button>
          </div>

          {isOpen && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[1054]">
              <div className="absolute top-6 right-[26px] sm:right-[16px] z-[999]">
                <button
                  onClick={() => {
                    stopAllPopupVideos();
                    setIsOpen(false);
                  }}
                  className="text-white text-2xl"
                >
                  <IoMdClose />
                </button>
              </div>

              <div className="w-full lg:w-full md:w-full sm:max-w-full md:max-w-[600px] lg:max-w-[800px] max-w-[675px] xl:max-w-[450px]  xl:w-full px-4 md:px-0 relative">
                <Swiper
                  spaceBetween={50}
                  slidesPerView={1}
                  initialSlide={activeIndex}
                  onSlideChange={(swiper) => {
                    stopAllPopupVideos();
                    setVideoError(false);
                    setActiveIndex(swiper.activeIndex);
                    const nextVideo = popupVideoRefs.current[swiper.activeIndex];
                    if (nextVideo) {
                      nextVideo.play();
                    }
                    // update navigation state
                    setIsBeginning(swiper.isBeginning);
                    setIsEnd(swiper.isEnd);
                  }}
                  onAfterInit={(swiper) => {
                    setIsBeginning(swiper.isBeginning);
                    setIsEnd(swiper.isEnd);
                  }}
                  navigation={{
                    nextEl: '.popup-next',
                    prevEl: '.popup-prev',
                  }}
                  modules={[Navigation]}
                >
                  {socialPost?.map((item, index) => (
                    <SwiperSlide key={item.id}>
                      <div className="relative flex flex-col items-center justify-center">
                        {item.video_url && !videoError ? (
                          <video
                            ref={(el) => setPopupVideoRef(el, index)}
                            className="w-full h-screen object-cover sm:h-auto sm:object-contain 
         xs:h-auto xs:object-contain"
                            src={item.video_url}
                            loop
                            controls
                            playsInline
                            preload="metadata"
                            onLoadedMetadata={(e) => {
                              const v = e.currentTarget;
                              v.currentTime = 0.1;
                            }}
                            onError={() => setVideoError(true)} // Catch error
                          />
                        ) : (
                          <div className="w-full h-[100vh]  flex items-center justify-center text-white text-lg">
                            <Image
                              src="/images/ashclair_pdp_logo_image.svg"
                              alt="Asclair"
                              preview={false}
                              width={'100%'}
                              height={'100%'}
                              className="!bg-secondary"
                            />
                          </div>
                        )}

                        <div className="absolute w-[90%] top-6 left-6 right-6 flex items-center justify-between z-20 text-white text-sm">
                          <div className="font-semibold truncate w-[60%]">{item.title} &nbsp;&nbsp;</div>
                          <div className="flex gap-4 w-[40%] justify-end items-center pr-[0px] sm:pr-[30px]">
                            <a href={item.account_link} target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 text-[28px]">
                              {sourceOptions?.find((s) => s.value == item.source.toString())?.icon}
                            </a>
                          </div>
                        </div>

                        <div className="absolute bottom-[120px] left-0 w-full">
                          <div className="relative max-w-[27rem] mx-auto">
                            <Swiper
                              effect="coverflow"
                              centeredSlides={true}
                              grabCursor={true}
                              loop={false}
                              modules={[Navigation, EffectCoverflow]}
                              navigation={{
                                nextEl: `.product-next`,
                                prevEl: `.product-prev`,
                              }}
                              breakpoints={{
                                0: { slidesPerView: 1.2 },
                                640: { slidesPerView: 1.4 },
                                768: { slidesPerView: 1.4 },
                              }}
                              onSwiper={(swiper) => {
                                swiperRef.current = swiper;
                              }}
                              onSlideChange={(swiper) => {
                                setCurrentIndex(swiper.realIndex);
                              }}
                            >
                              {socialPost[activeIndex]?.suggestedJewelry?.map((product, i) => {
                                const detail = product.jewelryDetails?.[0];
                                const productTitle = product.title;
                                const jewelryType = product?.jewelrySubType?.parent_code?.toLowerCase()?.replace(/_/g, '-');
                                return (
                                  <SwiperSlide key={i}>
                                    <div className="bg-black/80 text-white rounded-md px-2 py-2 shadow-md">
                                      <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-white rounded-md overflow-hidden flex-shrink-0">
                                          {detail?.carat_images?.[0] ? (
                                            <img src={detail.carat_images[0]} alt={productTitle} className="w-full h-full object-cover" />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-600">No Image</div>
                                          )}
                                        </div>

                                        <div className="flex-1">
                                          <p className="text-sm font-semibold truncate">{product.title}</p>
                                          {detail?.selling_price ? (
                                            <p className="text-xs text-gray-300">${detail.selling_price.toLocaleString('en-IN')}</p>
                                          ) : (
                                            <p className="text-xs text-gray-500 italic">Price not available</p>
                                          )}
                                        </div>
                                      </div>

                                      {detail?.sku_slug && (
                                        <a
                                          href={
                                            product.is_customizable
                                              ? `/custom-jewelry?type=2&state=s&id=${detail.sku_slug}`
                                              : `/${jewelryType}/premade?slug=${detail.sku_slug}`
                                          }
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="mt-2 block bg-[#0c3a3e] hover:bg-[#0f474c] text-white text-xs text-center py-2 rounded-md font-medium tracking-wide transition"
                                        >
                                          VIEW PRODUCT →
                                        </a>
                                      )}
                                    </div>
                                  </SwiperSlide>
                                );
                              })}
                            </Swiper>

                            {/* Prev Button */}
                            <button
                              className={`product-prev absolute top-1/2 left-[10px] -translate-y-1/2 z-10 
                            bg-white text-black rounded-full w-7 h-7 shadow 
                            flex items-center justify-center transition-opacity duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                            ${currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}
                          `}
                              disabled={currentIndex === 0}
                            >
                              <MdArrowBackIos />
                            </button>

                            {/* Next Button */}
                            <button
                              className={`product-next absolute top-1/2 right-[10px] -translate-y-1/2 z-10 
                            bg-white text-black rounded-full w-7 h-7 shadow 
                            flex items-center justify-center transition-opacity duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                            ${currentIndex === totalSlides - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}
                          `}
                              disabled={currentIndex === totalSlides - 1}
                            >
                              <MdArrowForwardIos />
                            </button>
                          </div>
                        </div>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>

                <button
                  className={`popup-prev absolute left-[-70px] sm:left-[0px] top-1/2 -translate-y-1/2 z-50 bg-white rounded-full p-3
    ${isBeginning ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
                  disabled={isBeginning}
                >
                  <MdArrowBackIos />
                </button>

                <button
                  className={`popup-next absolute right-[-70px] sm:right-[0px] top-1/2 -translate-y-1/2 z-50 bg-white rounded-full p-3
    ${isEnd ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
                  disabled={isEnd}
                >
                  <MdArrowForwardIos />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  );
};

export default OurCollaborations;
