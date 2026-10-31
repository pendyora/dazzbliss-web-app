/* eslint-disable prettier/prettier */
'use client';

import React, { useEffect, useState } from 'react';

import { Button, ConfigProvider, Image, Modal, Skeleton } from 'antd';
import dayjs from 'dayjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { LuLoader } from 'react-icons/lu';
import { FreeMode, Navigation, Thumbs } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import { pdpTheme } from '@/app/[jewelryType]/premade/pdp/pdpTheme';
import { PRIMARY_BTN } from '@/app/checkout/checkoutTheme';
import OurCollabrations from '@/app/homepage/OurCollabrations';
import ImageZoom from '@/components/CustomImageZoom';
import { BRAND } from '@/config/brand';
import { useAppDispatch, useAppSelector } from '@/store';
import { setSelectedShapesData } from '@/store/slices/customProducts/customProductSlice';
import themeColors from '@/styles/theme-colors';
import { carryForwardFilterCrumb } from '@/utils/breadcrumbFilterParams';
import { formatCurrency } from '@/utils/common';

import { Text } from '../../../components';

// Presentation only (design reference: src/app/[jewelryType]/premade/pdp/* and design-mockups/product-page-v4).
const SPEC_ROW =
  'grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-4 border-b border-line py-3 text-[14px] text-ink [&>div:first-child]:text-[10.5px] [&>div:first-child]:uppercase [&>div:first-child]:tracking-[0.16em] [&>div:first-child]:text-ink-soft [&>div:first-child]:self-center';

export default function CustomDiamondPDP({
  selectionRoute,
  setActiveStep,
}: {
  selectionRoute: number;
  setActiveStep: React.Dispatch<React.SetStateAction<'diamond' | 'setting' | 'complete'>>;
}) {
  const { selectedDiamondStore, selectedSettingStore, loading } = useAppSelector((s) => s.customProduct);
  const masterData = useAppSelector((s) => s.master.data);
  const dispatch = useAppDispatch();
  const [selectedProduct, setSelectedProduct] = useState<any>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const did = searchParams?.get('did');
  const sid = searchParams?.get('id');
  const [isLoding, setIsLoding] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);
  const [swiperData, setSwiperData] = useState<any>([]);
  const [isVideo, setIsVideo] = useState<any>(false);
  const [is360, setIs360] = useState<any>(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const [showMore, setShowMore] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    // This will run only on the client side
    setWindowWidth(window.innerWidth);

    // Optional: Update the window width on resize
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  useEffect(() => {
    if (selectedDiamondStore) {
      setSelectedProduct(selectedDiamondStore);
    }
    setIsLoding(false);
  }, [selectedDiamondStore]);

  useEffect(() => {
    if (loading) {
      setIsLoding(true);
    }
  }, [loading]);

  useEffect(() => {
    if (!selectedProduct?.videoFile && !selectedProduct?.imageFile) {
      return;
    }
    // setSwiperData([selectedProduct?.videoFile, selectedProduct?.imageFile]);

    const sliderArray = [];
    // 360 image is on index 0
    if (!selectedProduct?.videoFile) {
      setIs360(true);
    } else {
      sliderArray.unshift(selectedProduct?.videoFile);
    }
    // sliderArray.unshift(selectedProduct?.imageFile);

    // first video on index 1
    if (selectedProduct?.videos_image_uri?.length > 0) {
      const update = [sliderArray?.[0]];
      if (selectedProduct?.imageFile) {
        update.push(selectedProduct?.imageFile);
      }
      setIsVideo(true);
      // console.log(update, 'üpdate');
      setSwiperData(update);
    } else {
      sliderArray.push(selectedProduct?.imageFile);
      setSwiperData(sliderArray);
    }
  }, [selectedProduct]);

  return (
    <ConfigProvider theme={pdpTheme}>
      <div className="w-full bg-paper font-libre text-ink">
        <div className="flex flex-col items-center gap-[40px] sm:gap-[20px]">
          {isLoding ? (
            <div className="flex min-h-[50vh] flex-col items-center justify-center gap-[60px]">
              {/* <Spin /> */}
              <div className="flex w-full items-center justify-center">
                <LuLoader className="h-8 w-8 animate-spin text-ink-soft" />
              </div>
            </div>
          ) : (
            <div className="flex w-full justify-center border-b border-line pb-[72px] lg:pb-10">
              <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-12 px-[clamp(16px,3.2vw,56px)] sm:gap-8 sm:px-0">
                <div className="relative flex items-start gap-[clamp(24px,4vw,64px)] sm:flex-col">
                  <div className="mt-5 grid w-[60%] grid-cols-2 gap-2 md:w-[55%] md:grid-cols-1 sm:my-0 sm:flex sm:w-full sm:flex-col-reverse">
                    {swiperData && swiperData?.length > 0 && (
                      <div className="col-span-2 min-h-fit hidden sm:block">
                        <Swiper
                          loop={true}
                          spaceBetween={10}
                          slidesPerView={1}
                          navigation={true}
                          onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
                          // navigation={{
                          //   prevEl: null,
                          //   nextEl: null,
                          // }}
                          thumbs={{ swiper: thumbsSwiper }}
                          modules={[FreeMode, Navigation, Thumbs]}
                          className="mySwiper2 min-h-fit mb-3"
                        >
                          {swiperData?.map((d: any, index: number) => {
                            const lastIndex = swiperData?.length - 1;
                            return (
                              <SwiperSlide key={'group3179' + index} className="!flex !justify-center !items-center !w-full">
                                {index == 0 ? (
                                  !is360 && (
                                    <div className="aspect-square relative w-full xl:h-auto lg:h-auto sm:!h-full">
                                      <iframe
                                        src={` ${selectedProduct?.videoFile?.split('/500/500')[0]}${`/${windowWidth - 24}/${windowWidth - 24}`}`}
                                        title={`Model View`}
                                        className="h-full w-full hidden sm:block aspect-square"
                                        style={{
                                          aspectRatio: '1 / 1',
                                        }}
                                        allow="autoplay; fullscreen;"
                                        frameBorder="0"
                                      />

                                      <div className="w-[8%] absolute bottom-2 right-3 z-[19] flex items-center select-none">
                                        <Image src="/images/viewIcon.svg" alt="360-view" preview={false} className="!w-[100%] select-none" />
                                      </div>
                                    </div>
                                  )
                                ) : isVideo && (index == 1 || index == lastIndex) ? (
                                  <>
                                    {/* <video muted loop>
                                  <source src={d} type="video/mp4" />
                                  Your browser does not support the video tag.
                                </video> */}
                                    <Image
                                      src={d}
                                      preview={false}
                                      alt="Mask Group"
                                      fallback={'/images/no_images.svg'}
                                      className="h-[500px] 2xl:h-auto w-full mx-auto object-contain xl:h-auto lg:h-auto bg-stone aspect-square"
                                    />
                                  </>
                                ) : (
                                  <Image
                                    src={d}
                                    preview={false}
                                    alt="Mask Group"
                                    fallback={'/images/no_images.svg'}
                                    className="h-[500px] 2xl:h-auto w-full mx-auto object-contain xl:h-auto lg:h-auto bg-stone aspect-square"
                                  />
                                )}
                              </SwiperSlide>
                            );
                          })}
                        </Swiper>
                        <Swiper
                          onSwiper={(value) => setThumbsSwiper(value)}
                          loop={true}
                          spaceBetween={2}
                          slidesPerView={4}
                          freeMode={true}
                          navigation={{
                            prevEl: null,
                            nextEl: null,
                          }}
                          watchSlidesProgress={true}
                          modules={[FreeMode, Navigation, Thumbs]}
                          className="mySwiper min-h-[20%] px-2 "
                        >
                          {swiperData?.map((d: any, index: number) => {
                            const lastIndex = swiperData?.length - 1;
                            return (
                              <SwiperSlide
                                key={'group3179' + index}
                                className={`cursor-pointer transition-all duration-300 border !aspect-square ${activeIndex === index ? ' border-ink p-1' : 'border-transparent p-1.5'}`}
                              >
                                {index == 0 ? (
                                  !is360 && (
                                    <div className={`w-full bottom-2 left-2 z-[19] flex items-center select-none ${thumbsSwiper}`}>
                                      <Image
                                        src="/images/viewIcon.svg"
                                        alt="360-view"
                                        preview={false}
                                        className="!w-[100%] px-5 !aspect-square bg-stone select-none"
                                      />
                                    </div>
                                  )
                                ) : isVideo && (index == 1 || index == lastIndex) ? (
                                  <>
                                    <Image
                                      src={d}
                                      preview={false}
                                      alt="Mask Group"
                                      fallback={'/images/no_images.svg'}
                                      className="h-[500px] 2xl:h-auto w-full mx-auto object-contain xl:h-auto lg:h-auto bg-stone aspect-square"
                                    />
                                  </>
                                ) : (
                                  <Image
                                    src={d}
                                    preview={false}
                                    alt="Mask Group"
                                    fallback={'/images/no_images.svg'}
                                    className="h-[500px] 2xl:h-auto w-full object-contain xl:h-auto lg:h-auto bg-stone aspect-square"
                                  />
                                )}
                              </SwiperSlide>
                            );
                          })}
                        </Swiper>
                      </div>
                    )}
                    {selectedProduct?.videoFile ? (
                      <div className="aspect-square col-span-1 relative sm:hidden">
                        <iframe
                          src={` ${selectedProduct?.videoFile.split('/500/500')[0]}`}
                          title={`Model View`}
                          className="h-full w-full block lg:hidden bg-stone"
                        />
                        <iframe
                          src={` ${selectedProduct?.videoFile.split('/500/500')[0]}`}
                          title={`Model View`}
                          className="h-full w-full hidden lg:block md:hidden"
                        />
                        <iframe
                          src={` ${selectedProduct?.videoFile.split('/500/500')[0]}`}
                          title={`Model View`}
                          className="h-full w-full hidden md:block sm:hidden"
                        />
                        <iframe
                          src={` ${selectedProduct?.videoFile.split('/500/500')[0]}`}
                          title={`Model View`}
                          className="h-full w-full hidden sm:block"
                        />
                        <div className="w-[8%] absolute bottom-2 right-3 z-[19] flex items-center select-none">
                          <Image src="/images/viewIcon.svg" alt="360-view" preview={false} className="!w-[100%] select-none" />
                        </div>
                      </div>
                    ) : (
                      <>
                        <Image
                          src={BRAND.logo.monogram}
                          alt="PDP1"
                          preview={false}
                          style={{
                            borderRadius: '0px',
                            width: '100%',
                            height: '100%',
                            aspectRatio: '1 / 1',
                            backgroundColor: themeColors.stone.DEFAULT,
                          }}
                        />
                      </>
                    )}
                    {selectedProduct?.imageFile ? (
                      <div className=" col-span-1 sm:hidden bg-stone 2xl:h-auto w-full aspect-square xl:h-auto lg:h-auto md:h-auto flex justify-center items-center">
                        <ImageZoom src={selectedProduct?.imageFile} alt="Product image" zoom="200" className="!aspect-square sm:hidden" />
                      </div>
                    ) : (
                      <>
                        <Image
                          src={BRAND.logo.monogram}
                          alt="PDP1"
                          preview={false}
                          style={{
                            borderRadius: '0px',
                            width: '100%',
                            height: '100%',
                            aspectRatio: '1 / 1',
                            backgroundColor: themeColors.stone.DEFAULT,
                          }}
                        />
                      </>
                    )}
                  </div>
                  <div className="sticky top-[calc(var(--header-height,72px)+24px)] flex w-[40%] flex-col gap-8 md:w-[45%] sm:top-0 sm:w-full sm:gap-5 sm:px-4">
                    <div className="mt-6 flex flex-col sm:mt-0">
                      <div className="flex flex-col items-start gap-5 sm:gap-3">
                        <div className="flex flex-col items-start gap-3 self-stretch">
                          <span className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-gilt">Your diamond</span>
                          <h1 className="m-0 font-cormorant text-[clamp(30px,3.2vw,44px)] font-medium leading-[1.05] text-ink">
                            {selectedProduct?.fullTitle}
                          </h1>
                          <p className="m-0 text-[14px] leading-[1.65] text-ink-soft">
                            {`${selectedProduct?.col ? `${selectedProduct?.col} - ` : ''}${selectedProduct?.clr ? `${selectedProduct?.clr} - ` : ''}${
                              selectedProduct?.cut ? `${selectedProduct?.cut} - ` : ''
                            }${selectedProduct?.shape_name ? ` ${selectedProduct?.shape_name?.toUpperCase()}` : ''}`}
                          </p>
                        </div>
                        <p className="m-0 border-t border-line pt-5 text-[20px] tabular-nums text-ink self-stretch">
                          {formatCurrency(selectedProduct?.price)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-4">
                      <Button
                        onClick={() => {
                          if (selectionRoute === 1) {
                            const shapeId = masterData?.find(
                              (el: any) => el.name === selectedDiamondStore.shape_name && el.parent_code == 'SHAPE',
                            )?.id;
                            dispatch(setSelectedShapesData(shapeId));
                            if (sid && selectedSettingStore !== null) {
                              setActiveStep('complete');
                              router.push(
                                carryForwardFilterCrumb(`/custom-jewelry?type=1&did=${did}&state=c${sid ? `&id=${sid}` : ''}`, searchParams),
                              );
                            } else {
                              setActiveStep('setting');
                              router.push(
                                carryForwardFilterCrumb(`/custom-jewelry?type=1&did=${did}&state=s${sid ? `&id=${sid}` : ''}`, searchParams),
                              );
                            }
                          } else if (selectionRoute === 2) {
                            if (did && selectedDiamondStore !== null) {
                              router.push(
                                carryForwardFilterCrumb(`/custom-jewelry?type=2&state=c${sid ? `&id=${sid}` : ''}&did=${did}`, searchParams),
                              );
                              setActiveStep('complete');
                            } else {
                              setActiveStep('diamond');
                              router.push(
                                carryForwardFilterCrumb(
                                  `/custom-jewelry?type=2&state=d${did ? `&did=${did}` : ''}${sid ? `&id=${sid}` : ''}`,
                                  searchParams,
                                ),
                              );
                            }
                          }
                        }}
                        className={`${PRIMARY_BTN} w-full self-stretch`}
                      >
                        {selectionRoute === 1
                          ? !sid
                            ? 'SELECT THIS DIAMOND'
                            : 'COMPLETE SELECTION'
                          : selectionRoute == 2
                            ? selectedDiamondStore === null
                              ? 'SELECT THIS SETTING'
                              : 'COMPLETE SELECTION'
                            : null}
                      </Button>

                      {/* <Text size="textmd" className="!text-[#707070]">
                      IN STOCK: Ships on {dayjs().add(selectedProduct?.max_delivery_days, 'day').format('MMMM DD, YYYY')} Delivery Estimate
                    </Text> */}
                      <div className="hidden items-center justify-between bg-haze px-5 py-3 md:px-3">
                        <Text
                          size="textmd"
                          className="!font-thin sm:!font-normal text-center whitespace-nowrap tracking-[0.16em] uppercase text-ink-soft"
                        >
                          Delivery
                        </Text>
                        <div className="w-[1px] !pl-[1px] h-4 bg-line-strong" />
                        <Text
                          size="textmd"
                          className="!font-thin sm:!font-normal text-center whitespace-nowrap tracking-[0.16em] uppercase text-ink-soft"
                        >
                          RETURN Policy
                        </Text>
                        <div className="w-[1px] h-4 !pl-[1px] bg-line-strong" />
                        <Text
                          size="textmd"
                          className="!font-thin sm:!font-normal  text-center whitespace-nowrap tracking-[0.16em] uppercase text-ink-soft"
                        >
                          Exchange
                        </Text>
                      </div>
                    </div>
                  </div>
                </div>
                {selectedDiamondStore && (
                  <div className="flex flex-col sm:px-4">
                    <p className="m-0 pb-5 font-cormorant text-[clamp(26px,2.4vw,34px)] font-medium leading-none text-ink">Diamond Information</p>
                    <div className="flex gap-[clamp(24px,4vw,64px)] border-t border-line sm:flex-col sm:gap-0">
                      <div className="w-1/2 sm:w-full">
                        <div className={SPEC_ROW}>
                          <div>Certificate</div>
                          <div
                            onClick={showModal}
                            className="cursor-pointer justify-self-start border-b border-current text-[12px] font-semibold uppercase tracking-[0.1em] text-ink"
                          >
                            View Report
                          </div>
                        </div>
                        <div className={SPEC_ROW}>
                          <div>Shape</div>
                          <div>{selectedDiamondStore?.shape_name}</div>
                        </div>
                        <div className={SPEC_ROW}>
                          <div>Carat</div>
                          <div>{selectedDiamondStore?.carats}</div>
                        </div>
                        <div className={SPEC_ROW}>
                          <div>Color</div>
                          <div>{selectedDiamondStore?.col}</div>
                        </div>
                        <div className={SPEC_ROW}>
                          <div>Intensity</div>
                          <div>None</div>
                        </div>
                        <div className={SPEC_ROW}>
                          <div>Clarity</div>
                          <div>{selectedDiamondStore?.clr}</div>
                        </div>
                        <div className={SPEC_ROW}>
                          <div>Polish</div>
                          <div>{selectedDiamondStore?.pol}</div>
                        </div>
                        <div className={SPEC_ROW}>
                          <div>Symmetry</div>
                          <div>{selectedDiamondStore?.sym}</div>
                        </div>
                      </div>
                      <div className={`w-1/2 sm:w-full ${showMore ? 'sm:block' : 'sm:hidden'}`}>
                        <div className={SPEC_ROW}>
                          <div>Fluorescence</div>
                          <div>None</div>
                        </div>
                        <div className={SPEC_ROW}>
                          <div>Table</div>
                          <div>{selectedDiamondStore?.table}</div>
                        </div>
                        <div className={SPEC_ROW}>
                          <div>Culet</div>
                          <div>{selectedDiamondStore?.culet}</div>
                        </div>
                        <div className={SPEC_ROW}>
                          <div>Depth</div>
                          <div>{selectedDiamondStore?.depth}</div>
                        </div>
                        <div className={SPEC_ROW}>
                          <div>Girdle</div>
                          <div>{selectedDiamondStore?.girdle}</div>
                        </div>
                        <div className={SPEC_ROW}>
                          <div>L/W (mm)</div>
                          <div className="text-nowrap">
                            {selectedDiamondStore?.length}
                            {' x '}
                            {selectedDiamondStore?.width}
                            {' x '}
                            {selectedDiamondStore?.height}
                          </div>
                        </div>
                        <div className={SPEC_ROW}>
                          <div>L/W Ratio</div>
                          <div>{(selectedDiamondStore?.length / selectedDiamondStore?.width).toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                    <div
                      className="hidden cursor-pointer items-center justify-between border-b border-line py-4 sm:flex"
                      onClick={() => setShowMore(!showMore)}
                    >
                      <p className="m-0 text-[14px] font-medium text-ink">{!showMore ? 'More Information' : 'Less Information'}</p>
                      <p className="m-0 text-[16px] text-ink">{!showMore ? '+' : '-'}</p>
                    </div>
                  </div>
                )}
              </div>

              <Modal
                title="Certificate"
                open={isModalOpen}
                // className="certificate"
                onOk={handleOk}
                className="!w-[60%] sm:!w-[100%]"
                onCancel={handleCancel}
                footer={false}
              >
                <div className="!w-[100%] !h-[60vh]" style={{ minHeight: '100%' }}>
                  <iframe className="!w-full !h-full" width={700} height={700} src={selectedDiamondStore?.certificateFile} />
                </div>
              </Modal>
            </div>
          )}
        </div>

        <OurCollabrations />
      </div>
    </ConfigProvider>
  );
}
