'use client';

import React, { useEffect, useRef, useState } from 'react';

import { Image } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navigation, Autoplay, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import ProtectedVideo from '@/components/ProtectedVideo';
import { BRAND } from '@/config/brand';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/autoplay';

function collectBannerFonts(bannerData: any): string[] {
  const fonts = new Set<string>();

  (bannerData?.font_family || []).forEach((family: string) => {
    if (family) {
      fonts.add(family.trim());
    }
  });

  bannerData?.banner_image?.forEach((banner: any) => {
    [...(banner.desktop_elements || []), ...(banner.mobile_elements || [])].forEach((el: any) => {
      const fontFamily = el?.style?.fontFamily;
      if (fontFamily) {
        fonts.add(fontFamily.trim());
      }
    });
  });

  return [...fonts];
}

function googleFontStylesheetUrl(family: string): string {
  return `https://fonts.googleapis.com/css?family=${family.replace(/\s+/g, '+')}&display=swap`;
}

export default function BannerSwiper({ bannerData }: any) {
  const route = useRouter();
  const [showNavigation, setShowNavigation] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const desktopSwiperRef = useRef<any>(null);
  const mobileSwiperRef = useRef<any>(null);
  const bannerFonts = collectBannerFonts(bannerData);

  useEffect(() => {
    const navigationTimer = setTimeout(() => {
      setShowNavigation(true);
    }, 300);

    // Prevent keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(navigationTimer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const preventRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  // Size overlays with CSS (cqw / %) so text is visible on first paint with the image.
  const getScaledStyle = (el: any) => {
    const { style, size, alignment, position } = el;

    return {
      ...el.style,
      fontSize: el.fontSizePercent ? `${el.fontSizePercent}cqw` : style?.fontSize || '16px',
      width: size?.widthPercent ? `${size.widthPercent}%` : 'auto',
      height: size?.heightPercent ? `${size.heightPercent}%` : 'auto',
      position: 'absolute',
      top: `${position.yPercent}%`,
      left: `${position.xPercent}%`,
      padding: 0,
      display: alignment.display,
      alignItems: alignment.alignItems,
      justifyContent: alignment.justifyContent,
    };
  };
  const getButtonStyle = (el: any) => {
    const { style, variant, alignment } = el;

    const base: React.CSSProperties = {
      fontSize: el.fontSizePercent ? `${el.fontSizePercent}cqw` : style?.fontSize || '16px',
      fontFamily: style.fontFamily,
      color: style.color,
      borderRadius: style.borderRadius,
      padding: style.padding,
      fontWeight: style.fontWeight,
      border: style.borderWidth ? `${style.borderWidth} solid ${style.borderColor || '#000'}` : undefined,
      backgroundColor: style.backgroundColor,
      display: alignment.display,
      alignItems: alignment.alignItems,
      justifyContent: alignment.justifyContent,
    };

    if (variant === 'outline') {
      return {
        ...base,
        backgroundColor: 'transparent',
        border: `${style.borderWidth || '1px'} solid ${style.borderColor || style.color}`,
        color: style.color,
      };
    }

    if (variant === 'text') {
      return {
        ...base,
        backgroundColor: 'transparent',
        border: 'none',
        color: style.color,
        padding: '0',
      };
    }

    // default = filled
    return base;
  };
  return (
    <div ref={containerRef} onContextMenu={preventRightClick} style={{ WebkitTouchCallout: 'none' }}>
      {bannerFonts.length > 0 && (
        <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          {bannerFonts.map((family) => (
            <link key={family} rel="stylesheet" href={googleFontStylesheetUrl(family)} />
          ))}
        </>
      )}
      {/* Desktop Banner */}
      <div className="sm:hidden">
        <Swiper
          ref={desktopSwiperRef}
          navigation={
            showNavigation
              ? {
                  prevEl: '.swiper-button-prev-custom',
                  nextEl: '.swiper-button-next-custom',
                }
              : false
          }
          pagination={{
            clickable: true,
            // renderBullet: function (index, className) {
            //   return '<span class="' + className + '">' + (index + 1) + '</span>';
            // },
          }}
          modules={[Navigation, Autoplay, Pagination]}
          className="homepage-banner-swiper"
          loop={true}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
          }}
          speed={1000}
          onSlideChange={(swiper) => {
            setIsVideoPlaying(true);
            setIsBeginning(swiper.isBeginning);
            setIsEnd(swiper.isEnd);
          }}
          onAfterInit={(swiper) => {
            setIsBeginning(swiper.isBeginning);
            setIsEnd(swiper.isEnd);
          }}
        >
          {bannerData?.banner_image?.map((banner: any, index: number) => (
            <SwiperSlide key={index} className="!aspect-[12/5] !w-full !relative [container-type:inline-size]">
              {!banner?.is_desktop_image ? (
                banner?.desktop_image?.toLowerCase().includes('.mp4') && (
                  <ProtectedVideo src={banner?.desktop_image} autoPlay={isVideoPlaying} link={banner?.http_link || null} className="max-h-[700px]" />
                )
              ) : (
                <div className="!w-full !h-full">
                  <Image
                    src={banner?.desktop_image}
                    preview={false}
                    draggable={false}
                    loading="lazy"
                    className="w-full min-w-[100vw] !aspect-[12/5] pointer-events-none"
                    style={{ WebkitTouchCallout: 'none' }}
                  />
                  {banner?.http_link && <Link href={banner.http_link} className="absolute inset-0 w-full h-full" />}
                </div>
              )}

              {/* Render desktop elements */}
              {banner?.desktop_elements?.map((el: any, i: number) => (
                <div key={i} style={getScaledStyle(el)}>
                  {el?.type !== 'button' ? (
                    <span style={{ userSelect: 'text', cursor: 'text' }} className="swiper-no-swiping">
                      {el?.content}
                    </span>
                  ) : (
                    <button className="w-full h-full" style={getButtonStyle(el)} onClick={() => route.push(el?.link)}>
                      {el?.content}
                    </button>
                  )}
                </div>
              ))}
            </SwiperSlide>
          ))}
          {showNavigation && (
            <>
              <button
                className="swiper-button-prev-custom absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-none border border-line bg-paper/90 text-ink transition-colors hover:bg-paper"
                onClick={() => desktopSwiperRef.current?.swiper.slidePrev()}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                className="swiper-button-next-custom absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-none border border-line bg-paper/90 text-ink transition-colors hover:bg-paper"
                onClick={() => desktopSwiperRef.current?.swiper.slideNext()}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </Swiper>
      </div>

      {/* Mobile Banner */}
      <div className="hidden sm:block">
        <Swiper
          ref={mobileSwiperRef}
          navigation={
            showNavigation
              ? {
                  prevEl: '.swiper-button-prev-mobile',
                  nextEl: '.swiper-button-next-mobile',
                }
              : false
          }
          modules={[Navigation, Autoplay, Pagination]}
          className="homepage-banner-swiper"
          loop={true}
          pagination={{
            clickable: true,
            // renderBullet: function (index, className) {
            //   return '<span class="' + className + '">' + (index + 1) + '</span>';
            // },
          }}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
          }}
          speed={1000}
          onSlideChange={(swiper) => {
            setIsVideoPlaying(true);
            setIsBeginning(swiper.isBeginning);
            setIsEnd(swiper.isEnd);
          }}
          onAfterInit={(swiper) => {
            setIsBeginning(swiper.isBeginning);
            setIsEnd(swiper.isEnd);
          }}
        >
          {bannerData?.banner_image?.map((banner: any, index: number) => (
            <SwiperSlide key={index} className="!aspect-[1/1] !w-full !relative [container-type:inline-size]">
              {!banner?.is_mobile_image ? (
                banner?.mobile_image?.toLowerCase().includes('.mp4') && (
                  <ProtectedVideo src={banner?.mobile_image} autoPlay={isVideoPlaying} link={banner?.http_link || null} className="max-h-[700px]" />
                )
              ) : (
                <div className="!w-full h-full">
                  <Image
                    src={banner?.mobile_image}
                    preview={false}
                    draggable={false}
                    loading="lazy"
                    fallback={BRAND.logo.monogram}
                    className="w-full h-full min-w-[100vw] object-cover pointer-events-none"
                    style={{ WebkitTouchCallout: 'none' }}
                  />
                  {banner?.http_link && <Link href={banner.http_link} className="absolute inset-0 w-full h-full" />}
                </div>
              )}

              {/* Render mobile elements */}
              {banner?.mobile_elements?.map((el: any, i: number) => (
                <div key={i} style={getScaledStyle(el)}>
                  {el?.type !== 'button' ? (
                    <span className="text-center swiper-no-swiping" style={{ userSelect: 'text', cursor: 'text' }}>
                      {el?.content}
                    </span>
                  ) : (
                    <button className="w-full h-full" style={getButtonStyle(el)} onClick={() => route.push(el?.link)}>
                      {el?.content}
                    </button>
                  )}
                </div>
              ))}
            </SwiperSlide>
          ))}
          {showNavigation && (
            <>
              <button
                className="swiper-button-prev-mobile absolute left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-none border border-line bg-paper/90 text-ink transition-colors hover:bg-paper"
                onClick={() => mobileSwiperRef.current?.swiper.slidePrev()}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                className="swiper-button-next-mobile absolute right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-none border border-line bg-paper/90 text-ink transition-colors hover:bg-paper"
                onClick={() => mobileSwiperRef.current?.swiper.slideNext()}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </Swiper>
      </div>
    </div>
  );
}
