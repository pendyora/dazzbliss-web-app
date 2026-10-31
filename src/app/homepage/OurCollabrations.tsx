'use client';

import React, { useState, useRef, useEffect } from 'react';

import { Image } from 'antd';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useLenis } from 'lenis/react';
import { FaInstagram } from 'react-icons/fa';
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

const sourceOptions = [
  { label: 'Instagram', value: '0', icon: <FaInstagram /> },
  { label: 'YouTube', value: '1', icon: <FaYoutube /> },
  { label: 'Facebook', value: '2', icon: <FaFacebook /> },
  { label: 'Twitter', value: '3', icon: <FaTwitter /> },
  { label: 'LinkedIn', value: '4', icon: <FaLinkedin /> },
  { label: 'Pinterest', value: '5', icon: <FaPinterest /> },
];

// ─── Data shell — only renders the section when data is ready ────────────────
// This ensures sectionRef is live on first mount of CollaborationsSection,
// so useScroll can properly attach its listener (never receives a null ref).

const OurCollaborations = () => {
  const dispatch = useAppDispatch();
  const socialPost = useAppSelector((state) => state.Social?.data);

  useEffect(() => {
    dispatch(fetchSocialPosts());
  }, [dispatch]);

  if (!socialPost?.length) {
    return null;
  }
  return <CollaborationsSection socialPost={socialPost} />;
};

export default OurCollaborations;

// ─── Animation + UI — mounts only when data exists, ref is always live ───────

function CollaborationsSection({ socialPost }: { socialPost: any[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);

  const sectionRef = useRef<HTMLDivElement>(null);
  const popupVideoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const suggestedJewelry = socialPost[activeIndex]?.suggestedJewelry || [];
  const totalSlides = suggestedJewelry.length;

  // Lenis-driven scroll: updated on every animation frame, never stale.
  const scrollY = useMotionValue(0);
  useLenis(({ scroll }) => {
    scrollY.set(scroll);
  });

  // Section bounds: top = distance from document top, recomputed on resize.
  const [bounds, setBounds] = useState({ top: 9999, height: 600, vh: 768 });
  useEffect(() => {
    const update = () => {
      if (!sectionRef.current) {
        return;
      }
      setBounds({
        top: sectionRef.current.getBoundingClientRect().top + window.scrollY,
        height: sectionRef.current.offsetHeight,
        vh: window.innerHeight,
      });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // 0 when section enters viewport bottom → 1 when section exits viewport top
  const scrollYProgress = useTransform(scrollY, [bounds.top - bounds.vh, bounds.top + bounds.height], [0, 1], { clamp: true });

  const stopAllPopupVideos = () => {
    popupVideoRefs.current.forEach((v) => {
      if (v) {
        v.pause();
        v.currentTime = 0;
      }
    });
  };

  const handleCardClick = (index: number) => {
    setVideoError(false);
    setActiveIndex(index);
    setIsOpen(true);
  };

  useEffect(() => {
    if (isOpen) {
      popupVideoRefs.current[activeIndex]?.play();
    }
    return () => stopAllPopupVideos();
  }, [isOpen, activeIndex]);

  return (
    <section ref={sectionRef} className="py-[80px] bg-primary overflow-hidden lg:py-10 sm:py-8">
      <div className="container-xs px-20 md:px-5 sm:px-3">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 lg:mb-10 sm:mb-8"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <FaInstagram className="text-luxury text-3xl lg:text-2xl sm:text-xl" />
            <h2 className="font-cormorant text-[52px] text-text_w uppercase tracking-[2.2px] lg:text-[34px] sm:text-[22px]">Our Collaborations</h2>
          </div>
          <p className="font-libre text-sm text-text_w/50 tracking-[0.25em] uppercase">See how our community brings luxury to life</p>
        </motion.div>

        {/* Outer wrapper — nav buttons sit here, outside the clip zone */}
        <div className="relative">
          {/* Clip zone — gives vertical room for the parallax y motion */}
          <div className="py-20 overflow-hidden">
            {/* inline overflow:visible always wins; immune to CSS load-order changes */}
            <Swiper
              spaceBetween={16}
              modules={[Navigation]}
              navigation={{ nextEl: '.collab-next', prevEl: '.collab-prev' }}
              style={{ overflow: 'visible' }}
              breakpoints={{
                0: { slidesPerView: 1 },
                640: { slidesPerView: 2 },
                768: { slidesPerView: 2 },
                1024: { slidesPerView: Math.min(socialPost.length, 5) },
                1280: { slidesPerView: Math.min(socialPost.length, 6) },
              }}
            >
              {socialPost.map((item: any, index: number) => (
                <SwiperSlide key={item.id}>
                  <ReelCard
                    item={item}
                    index={index}
                    sourceOptions={sourceOptions}
                    scrollYProgress={scrollYProgress}
                    onClick={() => handleCardClick(index)}
                    hasVideoError={videoError}
                    onVideoError={() => setVideoError(true)}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Nav buttons — siblings of clip zone so they are never clipped */}
          <button className="collab-prev absolute left-[-44px] top-1/2 -translate-y-1/2 z-10 w-9 h-9 border border-text_w/20 flex items-center justify-center text-text_w hover:border-luxury hover:text-luxury transition-all duration-300 disabled:opacity-20 sm:hidden">
            <MdArrowBackIos size={15} />
          </button>
          <button className="collab-next absolute right-[-44px] top-1/2 -translate-y-1/2 z-10 w-9 h-9 border border-text_w/20 flex items-center justify-center text-text_w hover:border-luxury hover:text-luxury transition-all duration-300 disabled:opacity-20 sm:hidden">
            <MdArrowForwardIos size={15} />
          </button>
        </div>
      </div>

      {/* Popup lightbox */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[1054]">
          <button
            onClick={() => {
              stopAllPopupVideos();
              setIsOpen(false);
            }}
            className="absolute top-6 right-6 z-[999] w-10 h-10 border border-text_w/30 flex items-center justify-center text-text_w hover:border-luxury hover:text-luxury transition-all duration-300"
          >
            <IoMdClose size={20} />
          </button>

          <div className="w-full max-w-[450px] xl:max-w-[400px] lg:max-w-[380px] sm:max-w-full px-4 relative">
            <Swiper
              spaceBetween={50}
              slidesPerView={1}
              initialSlide={activeIndex}
              onSlideChange={(swiper) => {
                stopAllPopupVideos();
                setVideoError(false);
                setActiveIndex(swiper.activeIndex);
                popupVideoRefs.current[swiper.activeIndex]?.play();
                setIsBeginning(swiper.isBeginning);
                setIsEnd(swiper.isEnd);
              }}
              onAfterInit={(swiper) => {
                setIsBeginning(swiper.isBeginning);
                setIsEnd(swiper.isEnd);
              }}
              navigation={{ nextEl: '.popup-next', prevEl: '.popup-prev' }}
              modules={[Navigation]}
            >
              {socialPost.map((item: any, index: number) => (
                <SwiperSlide key={item.id}>
                  <div className="relative flex flex-col items-center justify-center">
                    {item.video_url && !videoError ? (
                      <video
                        ref={(el) => {
                          popupVideoRefs.current[index] = el;
                        }}
                        className="w-full h-screen object-cover sm:h-auto sm:object-contain"
                        src={item.video_url}
                        loop
                        controls
                        playsInline
                        preload="metadata"
                        onLoadedMetadata={(e) => {
                          e.currentTarget.currentTime = 0.1;
                        }}
                        onError={() => setVideoError(true)}
                      />
                    ) : (
                      <div className="w-full h-[100vh] flex items-center justify-center">
                        <Image
                          src="/images/ashclair_pdp_logo_image.svg"
                          alt="Ashclair"
                          preview={false}
                          width="100%"
                          height="100%"
                          className="!bg-secondary"
                        />
                      </div>
                    )}

                    <div className="absolute top-5 left-5 right-5 flex items-center justify-between z-20">
                      <p className="font-libre text-xs tracking-[1.5px] uppercase text-text_w/80 truncate w-[60%]">{item.title}</p>
                      <a
                        href={item.account_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-luxury text-2xl hover:text-text_w transition-colors duration-300"
                      >
                        {sourceOptions.find((s) => s.value == item.source.toString())?.icon}
                      </a>
                    </div>

                    {suggestedJewelry.length > 0 && (
                      <div className="absolute bottom-[100px] left-0 w-full px-4">
                        <div className="relative max-w-[27rem] mx-auto">
                          <Swiper
                            effect="coverflow"
                            centeredSlides={true}
                            grabCursor={true}
                            loop={false}
                            modules={[Navigation, EffectCoverflow]}
                            navigation={{ nextEl: '.product-next', prevEl: '.product-prev' }}
                            breakpoints={{
                              0: { slidesPerView: 1.2 },
                              640: { slidesPerView: 1.4 },
                              768: { slidesPerView: 1.4 },
                            }}
                            onSlideChange={(swiper) => setCurrentIndex(swiper.realIndex)}
                          >
                            {suggestedJewelry.map((product: any, i: number) => {
                              const detail = product.jewelryDetails?.[0];
                              const jewelryType = product?.jewelrySubType?.parent_code?.toLowerCase()?.replace(/_/g, '-');
                              return (
                                <SwiperSlide key={i}>
                                  <div className="bg-primary/90 border border-text_w/10 text-text_w px-3 py-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 overflow-hidden flex-shrink-0 bg-cream">
                                        {detail?.carat_images?.[0] ? (
                                          <img src={detail.carat_images[0]} alt={product.title} className="w-full h-full object-cover" />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-xs text-mocha">No Image</div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-cormorant text-base leading-tight truncate">{product.title}</p>
                                        {detail?.selling_price ? (
                                          <p className="font-libre text-xs text-luxury">${detail.selling_price.toLocaleString('en-IN')}</p>
                                        ) : (
                                          <p className="font-libre text-xs text-text_w/40">Price unavailable</p>
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
                                        className="mt-2 block bg-luxury text-text_w font-libre text-[10px] tracking-[1.5px] uppercase text-center py-2 hover:bg-mocha transition-colors duration-300"
                                      >
                                        View Product →
                                      </a>
                                    )}
                                  </div>
                                </SwiperSlide>
                              );
                            })}
                          </Swiper>

                          <button
                            className="product-prev absolute top-1/2 left-2 -translate-y-1/2 z-10 w-7 h-7 bg-text_w text-primary flex items-center justify-center disabled:opacity-40"
                            disabled={currentIndex === 0}
                          >
                            <MdArrowBackIos size={14} />
                          </button>
                          <button
                            className="product-next absolute top-1/2 right-2 -translate-y-1/2 z-10 w-7 h-7 bg-text_w text-primary flex items-center justify-center disabled:opacity-40"
                            disabled={currentIndex === totalSlides - 1}
                          >
                            <MdArrowForwardIos size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            <button
              className="popup-prev absolute left-[-60px] sm:left-1 top-1/2 -translate-y-1/2 z-50 w-10 h-10 bg-text_w/10 border border-text_w/20 flex items-center justify-center text-text_w hover:border-luxury hover:text-luxury transition-all duration-300 disabled:opacity-30"
              disabled={isBeginning}
            >
              <MdArrowBackIos size={16} />
            </button>
            <button
              className="popup-next absolute right-[-60px] sm:right-1 top-1/2 -translate-y-1/2 z-50 w-10 h-10 bg-text_w/10 border border-text_w/20 flex items-center justify-center text-text_w hover:border-luxury hover:text-luxury transition-all duration-300 disabled:opacity-30"
              disabled={isEnd}
            >
              <MdArrowForwardIos size={16} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Reel Card ────────────────────────────────────────────────────────────────

function ReelCard({
  item,
  index,
  sourceOptions,
  scrollYProgress,
  onClick,
  hasVideoError,
  onVideoError,
}: {
  item: any;
  index: number;
  sourceOptions: any[];
  scrollYProgress: any;
  onClick: () => void;
  hasVideoError: boolean;
  onVideoError: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const y = useTransform(scrollYProgress, [0, 0.5, 1], [index % 2 === 0 ? 80 : -80, 0, index % 2 === 0 ? -80 : 80]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    videoRef.current?.play();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
  };

  const SourceIcon = sourceOptions.find((s) => s.value == item.source?.toString())?.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.07 }}
      style={{ y }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className="relative aspect-[9/16] overflow-hidden cursor-pointer bg-zinc-900"
    >
      {item.video_url && !hasVideoError ? (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          src={item.video_url}
          loop
          muted
          playsInline
          preload="metadata"
          onError={onVideoError}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-mocha/20">
          <Image src="/images/ashclair_pdp_logo_image.svg" alt="Ashclair" preview={false} width="100%" height="100%" className="!bg-secondary" />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

      {SourceIcon && (
        <a
          href={item.account_link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="absolute top-3 left-3 z-10 text-luxury text-lg hover:text-text_w transition-colors duration-200"
        >
          {SourceIcon}
        </a>
      )}

      <motion.div
        animate={{ y: isHovered ? 0 : 6, opacity: isHovered ? 1 : 0.7 }}
        transition={{ duration: 0.3 }}
        className="absolute bottom-0 left-0 right-0 p-3"
      >
        <p className="font-libre text-[10px] tracking-wide text-text_w/80 line-clamp-2 uppercase">{item.title}</p>
      </motion.div>

      <motion.div
        className="absolute top-0 left-0 right-0 h-[2px] bg-luxury"
        animate={{ scaleX: isHovered ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        style={{ transformOrigin: 'left' }}
      />
    </motion.div>
  );
}
