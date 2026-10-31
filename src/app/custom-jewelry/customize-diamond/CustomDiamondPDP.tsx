/* eslint-disable prettier/prettier */
'use client';

import React, { useEffect, useState } from 'react';

import { Button, Image, Modal, Skeleton } from 'antd';
import dayjs from 'dayjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { LuLoader } from 'react-icons/lu';
import { FreeMode, Navigation, Thumbs } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import OurCollabrations from '@/app/homepage/OurCollabrations';
import ImageZoom from '@/components/CustomImageZoom';
import { useAppDispatch, useAppSelector } from '@/store';
import { setSelectedShapesData } from '@/store/slices/customProducts/customProductSlice';
import { carryForwardFilterCrumb } from '@/utils/breadcrumbFilterParams';
import { formatCurrency } from '@/utils/common';

import { Text } from '../../../components';
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
    <div className="w-full bg-[#ffffff]">
      <div className="flex md:px-5 flex-col items-center gap-[40px] sm:gap-[20px] sm:px-0">
        {isLoding ? (
          <div className="flex flex-col items-center gap-[60px] min-h-[50vh] justify-center">
            {/* <Spin /> */}
            <div className="w-full flex justify-center items-center">
              <LuLoader className="h-10 w-10 animate-spin" />
            </div>
          </div>
        ) : (
          <div className="flex w-full justify-center  border-b border-solid border-[#3b3b3b] pb-[60px] lg:pb-8">
            <div className="container-xs flex flex-col gap-5 2xl:px-[50px] xl:px-[50px] lg:px-[30px] md:px-0 sm:px-3">
              <div className="flex relative items-start gap-8 lg:gap-[16px] lg:items-start 2xl:items-start sm:flex-col">
                <div className="grid mt-5 mb-8 sm:my-0 w-2/3 lg:w-2/3 md:w-[60%] sm:w-full grid-cols-2 md:grid-cols-1 gap-2 2xl:gap-[10px] lg:gap-[10px] 2xl:h-fit xl:h-auto sm:flex sm:flex-col-reverse  xl:grid-cols-2">
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
                                    className="h-[500px] 2xl:h-auto w-full mx-auto object-contain xl:h-auto lg:h-auto bg-[#f8f8f8] aspect-square"
                                  />
                                </>
                              ) : (
                                <Image
                                  src={d}
                                  preview={false}
                                  alt="Mask Group"
                                  fallback={'/images/no_images.svg'}
                                  className="h-[500px] 2xl:h-auto w-full mx-auto object-contain xl:h-auto lg:h-auto bg-[#f8f8f8] aspect-square"
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
                              className={`cursor-pointer transition-all duration-300 border-2  !aspect-square ${activeIndex === index ? ' border-[#17381d] p-1' : 'border-transparent p-1.5'}`}
                            >
                              {index == 0 ? (
                                !is360 && (
                                  <div className={`w-full bottom-2 left-2 z-[19] flex items-center select-none ${thumbsSwiper}`}>
                                    <Image
                                      src="/images/viewIcon.svg"
                                      alt="360-view"
                                      preview={false}
                                      className="!w-[100%] px-5 !aspect-square bg-[#f8f8f8] select-none"
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
                                    className="h-[500px] 2xl:h-auto w-full mx-auto object-contain xl:h-auto lg:h-auto bg-[#f8f8f8] aspect-square"
                                  />
                                </>
                              ) : (
                                <Image
                                  src={d}
                                  preview={false}
                                  alt="Mask Group"
                                  fallback={'/images/no_images.svg'}
                                  className="h-[500px] 2xl:h-auto w-full object-contain xl:h-auto lg:h-auto bg-[#f8f8f8] aspect-square"
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
                        className="h-full w-full block lg:hidden bg-[#f8f8f8]"
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
                        src="/images/ashclair_pdp_logo_image.svg"
                        alt="PDP1"
                        preview={false}
                        style={{
                          borderRadius: '0px',
                          width: '100%',
                          height: '100%',
                          aspectRatio: '1 / 1',
                          backgroundColor: '#F8F8F8',
                        }}
                      />
                    </>
                  )}
                  {selectedProduct?.imageFile ? (
                    <div className=" col-span-1 sm:hidden bg-[#f8f8f8] 2xl:h-auto w-full aspect-square xl:h-auto lg:h-auto md:h-auto flex justify-center items-center">
                      <ImageZoom src={selectedProduct?.imageFile} alt="Product image" zoom="200" className="!aspect-square sm:hidden" />
                    </div>
                  ) : (
                    <>
                      <Image
                        src="/images/ashclair_pdp_logo_image.svg"
                        alt="PDP1"
                        preview={false}
                        style={{
                          borderRadius: '0px',
                          width: '100%',
                          height: '100%',
                          aspectRatio: '1 / 1',
                          backgroundColor: '#F8F8F8',
                        }}
                      />
                    </>
                  )}
                </div>
                <div className="flex w-[33%] sticky 2xl:top-[106px] xl:top-[100px] lg:top-[83px] md:top-[83px] sm:top-0 2xl:w-1/3 lg:w-1/3 md:w-[40%] sm:w-full flex-col gap-[38px] 2xl:gap-[30px] lg:gap-[20px] sm:gap-2">
                  <div className="flex flex-col gap-[70px] 2xl:gap-[50px] xl:gap-[40px] lg:gap-[40px] md:gap-[52px] sm:gap-[20px] mt-4 sm:mt-0">
                    <div className="flex flex-col items-start gap-8 2xl:gap-6 lg:gap-4 sm:gap-2 ">
                      <div className="flex flex-col items-start gap-4 self-stretch sm:gap-2">
                        <Text size="text5xl" as="p" className="md:!text-[20px] sm:!text-[18px]">
                          {selectedProduct?.fullTitle}
                        </Text>
                        <p className="text-[22px] md:text-[16px] text-primary font-thin sm:font-normal sm:text-[14px]">
                          {`${selectedProduct?.col ? `${selectedProduct?.col} - ` : ''}${selectedProduct?.clr ? `${selectedProduct?.clr} - ` : ''}${
                            selectedProduct?.cut ? `${selectedProduct?.cut} - ` : ''
                          }${selectedProduct?.shape_name ? ` ${selectedProduct?.shape_name?.toUpperCase()}` : ''}`}
                        </p>
                      </div>
                      <Text size="text2xl" as="p" className=" !font-medium !font-castoro">
                        {formatCurrency(selectedProduct?.price)}
                      </Text>
                    </div>
                  </div>
                  <div className="flex flex-col gap-5 sm:gap-2">
                    <Button
                      onClick={() => {
                        if (selectionRoute === 1) {
                          const shapeId = masterData?.find((el: any) => el.name === selectedDiamondStore.shape_name && el.parent_code == 'SHAPE')?.id;
                          dispatch(setSelectedShapesData(shapeId));
                          if (sid && selectedSettingStore !== null) {
                            setActiveStep('complete');
                            router.push(carryForwardFilterCrumb(`/custom-jewelry?type=1&did=${did}&state=c${sid ? `&id=${sid}` : ''}`, searchParams));
                          } else {
                            setActiveStep('setting');
                            router.push(carryForwardFilterCrumb(`/custom-jewelry?type=1&did=${did}&state=s${sid ? `&id=${sid}` : ''}`, searchParams));
                          }
                        } else if (selectionRoute === 2) {
                          if (did && selectedDiamondStore !== null) {
                            router.push(carryForwardFilterCrumb(`/custom-jewelry?type=2&state=c${sid ? `&id=${sid}` : ''}&did=${did}`, searchParams));
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
                      className="!bg-secondary !text-text_w  self-stretch w-full !h-[45px] tracking-[1.50px] 2xl:text-[16px] xl:w-full xl:text-[16px] lg:w-full lg:text-[14px] lg:!h-[37px]"
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
                    <div className="hidden items-center justify-between px-5 py-3 md:px-3  bg-[#fafafa] ">
                      <Text
                        size="textmd"
                        className="!font-thin sm:!font-normal text-center whitespace-nowrap tracking-[1px] !font-sans uppercase text-[#494949] "
                      >
                        Delivery
                      </Text>
                      <div className="w-[1px] !pl-[1px] h-4 bg-[#494949]" />
                      <Text
                        size="textmd"
                        className="!font-thin sm:!font-normal text-center whitespace-nowrap tracking-[1px] !font-sans uppercase text-[#494949] "
                      >
                        RETURN Policy
                      </Text>
                      <div className="w-[1px] h-4 !pl-[1px] bg-[#494949]" />
                      <Text
                        size="textmd"
                        className="!font-thin sm:!font-normal  text-center whitespace-nowrap tracking-[1px] !font-sans uppercase text-[#494949] "
                      >
                        Exchange
                      </Text>
                    </div>
                  </div>
                </div>
              </div>
              {selectedDiamondStore && (
                <div className=" flex flex-col">
                  <p className="pb-4 text-[20px] sm:text-[16px]">Diamond Information</p>
                  <div className="flex sm:flex-col">
                    <div className="w-1/2 sm:w-full">
                      <div className="grid grid-cols-4 md:grid-cols-3 p-2 sm:text-[14px] bg-[#f4f6f5]">
                        <div>Certificate</div>
                        <div onClick={showModal} className="cursor-pointer underline">
                          View Report
                        </div>
                      </div>
                      <div className="grid grid-cols-4 md:grid-cols-3 p-2 sm:text-[14px]">
                        <div>Shape</div>
                        <div>{selectedDiamondStore?.shape_name}</div>
                      </div>
                      <div className="grid grid-cols-4 md:grid-cols-3 p-2 sm:text-[14px] bg-[#f4f6f5]">
                        <div>Carat</div>
                        <div>{selectedDiamondStore?.carats}</div>
                      </div>
                      <div className="grid grid-cols-4 md:grid-cols-3 p-2 sm:text-[14px]">
                        <div>Color</div>
                        <div>{selectedDiamondStore?.col}</div>
                      </div>
                      <div className="grid grid-cols-4 md:grid-cols-3 p-2 sm:text-[14px] bg-[#f4f6f5]">
                        <div>Intensity</div>
                        <div>None</div>
                      </div>
                      <div className="grid grid-cols-4 md:grid-cols-3 p-2 sm:text-[14px]">
                        <div>Clarity</div>
                        <div>{selectedDiamondStore?.clr}</div>
                      </div>
                      <div className="grid grid-cols-4 md:grid-cols-3 p-2 sm:text-[14px] bg-[#f4f6f5]">
                        <div>Polish</div>
                        <div>{selectedDiamondStore?.pol}</div>
                      </div>
                      <div className="grid grid-cols-4 md:grid-cols-3 p-2 sm:text-[14px]">
                        <div>Symmetry</div>
                        <div>{selectedDiamondStore?.sym}</div>
                      </div>
                    </div>
                    <div className={`w-1/2 sm:w-full ${showMore ? 'sm:block' : 'sm:hidden'}`}>
                      <div className="grid grid-cols-4 md:grid-cols-3 p-2 sm:text-[14px] bg-[#f4f6f5]">
                        <div>Fluorescence</div>
                        <div>None</div>
                      </div>
                      <div className="grid grid-cols-4 md:grid-cols-3 p-2 sm:text-[14px]">
                        <div>Table</div>
                        <div>{selectedDiamondStore?.table}</div>
                      </div>
                      <div className="grid grid-cols-4 md:grid-cols-3 p-2 sm:text-[14px] bg-[#f4f6f5]">
                        <div>Culet</div>
                        <div>{selectedDiamondStore?.culet}</div>
                      </div>
                      <div className="grid grid-cols-4 md:grid-cols-3 p-2 sm:text-[14px]">
                        <div>Depth</div>
                        <div>{selectedDiamondStore?.depth}</div>
                      </div>
                      <div className="grid grid-cols-4 md:grid-cols-3 p-2 sm:text-[14px] bg-[#f4f6f5]">
                        <div>Girdle</div>
                        <div>{selectedDiamondStore?.girdle}</div>
                      </div>
                      <div className="grid grid-cols-4 md:grid-cols-3 p-2 sm:text-[14px]">
                        <div>L/W (mm)</div>
                        <div className="text-nowrap">
                          {selectedDiamondStore?.length}
                          {' x '}
                          {selectedDiamondStore?.width}
                          {' x '}
                          {selectedDiamondStore?.height}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 md:grid-cols-3 p-2 sm:text-[14px] bg-[#f4f6f5]">
                        <div>L/W Ratio</div>
                        <div>{(selectedDiamondStore?.length / selectedDiamondStore?.width).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:flex px-4 py-4 border-y mt-2 items-center justify-between" onClick={() => setShowMore(!showMore)}>
                    <p className="text-[14px]">{!showMore ? 'More Information' : 'Less Information'}</p>
                    <p className="text-[14px]">{!showMore ? '+' : '-'}</p>
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
  );
}
