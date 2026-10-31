/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import React, { useEffect, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { Text } from '@/components';
import { fetchProductsDetails, setSelectedProductsDetails, useAppDispatch, useAppSelector } from '@/store';
import {
  clearSelectedDiamondFilters,
  fetchDiamondByIdThunk,
  setCustomCarats,
  setCustomShapes,
  setDiamondPageNumber,
  setDiamondPageSize,
  setIsSelectedDiamondFilter,
  setSelectedCaratsData,
  setSelectedDiamondStore,
  setSelectedSettingRingPrice,
  setSelectedSettingSkuData,
  setSelectedSettingStore,
  setSelectedShapesData,
} from '@/store/slices/customProducts/customProductSlice';
import { carryForwardFilterCrumb } from '@/utils/breadcrumbFilterParams';
import { formatCurrency } from '@/utils/common';

export default function ShowStepper({
  selectionRoute,
  activeStep,
  selectedDiamond,
  selectedSetting,
  setSelectionRoute,
  setActiveStep,
  setSelectedSetting,
  setSelectedDiamond,
  dId,
  sId,
  state,
}: {
  selectionRoute: number;
  activeStep: 'diamond' | 'setting' | 'complete';
  selectedDiamond: any;
  selectedSetting: any;
  setSelectionRoute: any;
  setActiveStep: React.Dispatch<React.SetStateAction<'diamond' | 'setting' | 'complete'>>;
  dId: string | null;
  sId: string | null;
  state: string;
  setSelectedSetting: React.Dispatch<React.SetStateAction<any>>;
  setSelectedDiamond: React.Dispatch<React.SetStateAction<any>>;
}) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedRingSizeId, selectedProduct } = useAppSelector((state) => state?.products);
  const { selectedDiamondStore, selectedSettingStore, selectedSettingSkuData, selectedRingSize, selectedSettingRingPrice } = useAppSelector(
    (s) => s.customProduct,
  );
  const selectedProductVariation = useAppSelector((state) => state.products?.selectedProduct?.product_variation);
  const masterRingSizePrice = useAppSelector((state) => state?.master?.ringSizePriceList);

  const [selectedSettingType, setSelectedSettingType] = useState<any>();
  const [customVariant, setCustomVariants] = useState<any>();

  function getPriceViaRingAndMetal(ringSize: null | string, metal: string) {
    const ProductPrice = masterRingSizePrice?.find((item: any) => item.ring_size_id == (ringSize ?? '0') && item.metal_type_id == metal);
    return ringSize ? ProductPrice?.rate : 0;
  }

  const startWithDiamondsFn = () => {
    setCustomVariants(null);
    setSelectedSettingType(null);
    router.push(carryForwardFilterCrumb('/custom-jewelry?type=1&state=d', searchParams));
    dispatch(setCustomShapes(null));
    dispatch(setCustomCarats(null));
    dispatch(setSelectedShapesData(null));
    dispatch(setSelectedCaratsData(null));
    dispatch(setSelectedSettingStore(null));
    dispatch(clearSelectedDiamondFilters());
    dispatch(setDiamondPageNumber(1));
    dispatch(setIsSelectedDiamondFilter(false));
    setSelectionRoute(1);
  };
  const startWithSettingsFn = () => {
    router.push(carryForwardFilterCrumb('/custom-jewelry?type=2&state=s', searchParams));
    dispatch(setSelectedDiamondStore(null));
    dispatch(setSelectedShapesData(null));
    dispatch(setSelectedCaratsData(null));
    dispatch(setCustomShapes(null));
    dispatch(setCustomCarats(null));
    dispatch(clearSelectedDiamondFilters());
    dispatch(setDiamondPageNumber(1));
    dispatch(setIsSelectedDiamondFilter(false));
    setSelectionRoute(2);
  };

  useEffect(() => {
    if (dId) {
      dispatch(fetchDiamondByIdThunk(dId));
    }
  }, [dId, state]);

  useEffect(() => {
    if (state !== 's' && sId && ((selectedSettingStore && Object.keys(selectedSettingStore).length == 0) || !selectedSettingStore)) {
      dispatch(fetchProductsDetails(sId as string));
    }
  }, [sId]);

  useEffect(() => {
    const jewelryMetadata = selectedProduct?.product_details?.jewelry_sku?.find((item: any) => (item.sku_slug as string) == sId);
    dispatch(setSelectedSettingSkuData(jewelryMetadata));
    dispatch(setSelectedSettingStore(selectedProduct));
    dispatch(setSelectedSettingRingPrice(getPriceViaRingAndMetal(selectedRingSizeId, selectedSettingSkuData?.metal_type_id)));
  }, [selectedRingSizeId, selectedProduct]);

  useEffect(() => {
    if (state === 'd' && selectedSettingStore && sId) {
      setSelectedSettingType(selectedSettingStore?.product_details?.jewelry_sku?.find((el: any) => el.sku_slug == sId));
    }
  }, [sId, selectedSettingStore]);

  useEffect(() => {
    if (selectedProductVariation?.length > 0 && selectedSettingType?.metal_type_id) {
      const metalTypeVariant = selectedProductVariation.find((item: any) => item.id === selectedSettingType?.metal_type_id);
      const metalColorVariant = metalTypeVariant?.metal_color_id?.find((item: any) => item.id === selectedSettingType?.metal_color_id);
      setCustomVariants(metalColorVariant?.customization_options);
    }
  }, [selectedSettingType?.metal_type_id]);
  useEffect(() => {
    if (!customVariant) {
      return;
    }

    const shapeList = customVariant?.map((shape: any) => shape?.shape_id);
    dispatch(setCustomShapes(shapeList));
    if (selectedSettingType?.shape_id) {
      const selectedShape = customVariant.find((shape: any) => shape?.shape_id === selectedSettingType.shape_id);
      const carateList = customVariant
        ?.find((shape: any) => shape?.shape_id === selectedSettingType?.shape_id)
        ?.carats?.map((el: any) => el?.carat_id);
      const diamondColorList = selectedShape?.carats?.find((shape: any) => shape?.carat_id === selectedSettingType.carat_id)?.colors;
      dispatch(setSelectedShapesData(selectedSettingType?.shape_id));
      dispatch(setCustomCarats(carateList));
      setSelectedCaratsData(selectedShape?.carats);
      // setDiamondColorData(diamondColorList);
      dispatch(setSelectedCaratsData([carateList?.[0], carateList?.[carateList?.length - 1]]));
    }
  }, [customVariant, selectedSettingType?.shape_id]);

  return (
    <div>
      <div className="flex justify-center border-b border-solid border-[#cecece60] min-h-[73.5px] lg:min-h-fit">
        <div className="container-xs flex justify-center overflow-hidden gap-[0px] lg:gap-[0px] md:gap-[0px] 2xl:mx-[160px] xl:mx-20 lg:mx-10 sm:mx-0  md:mx-0 sm:gap-[0px] sm:px-0 sm:-ml-5">
          <div className={`w-2/3 flex gap-[0px] relative lg:gap-[0px] md:gap-[0px] sm:gap-[0px] ${selectionRoute === 2 ? 'flex-row-reverse' : ''}`}>
            {/* Diamond selection started here  */}
            <div className="relative w-1/2 md:w-full">
              <div
                className={`relative pl-10 flex px-5 lg:pr-1 h-full pt-3 pb-3 lg:py-2 sm:pb-[10px] sm:pt-[8px] items-start cursor-default gap-[30px] lg:gap-[15px] md:gap-[15px] sm:gap-[10px] md:w-full sm:px-1 sm:pl-5 sm:flex sm:items-center ${
                  state === 'd' || dId ? 'bg-[#e7eae1] first-step z-[10]' : 'bg-white next-try'
                }`}
              >
                <Text
                  as="p"
                  size="textxl"
                  className={`flex h-[40px] w-[40px] md:h-[30px] md:w-[30px] aspect-square items-center justify-center rounded-[24px] !bg-secondary !text-text_w text-center tracking-[2.40px] ${
                    state === 'd' ? '' : ''
                  }`}
                  onClick={() => {
                    if (selectionRoute == 1) {
                      if (selectedDiamondStore !== null) {
                        router.push(
                          carryForwardFilterCrumb(
                            `/custom-jewelry?type=${selectionRoute}&state=d${dId ? `&did=${dId}` : ''}${sId ? `&id=${sId}` : ''}`,
                            searchParams,
                          ),
                        );
                      }
                    } else {
                      if (selectedDiamondStore !== null) {
                        router.push(
                          carryForwardFilterCrumb(
                            `/custom-jewelry?type=${selectionRoute}&state=d${dId ? `&did=${dId}` : ''}${sId ? `&id=${sId}` : ''}`,
                            searchParams,
                          ),
                        );
                      } else {
                        dispatch(setSelectedDiamondStore(null));
                      }
                    }
                  }}
                >
                  {selectionRoute == 2 ? 2 : 1}
                </Text>
                <div className={`w-full sm:flex sm:flex-col relative md:h-full`}>
                  <div
                    className={`sm:text-center sm:hidden  ${selectedDiamondStore ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                      if (selectionRoute == 1) {
                        if (selectedDiamondStore !== null) {
                          router.push(
                            carryForwardFilterCrumb(
                              `/custom-jewelry?type=${selectionRoute}&state=d${dId ? `&did=${dId}` : ''}${sId ? `&id=${sId}` : ''}`,
                              searchParams,
                            ),
                          );
                        }
                      } else {
                        if (selectedDiamondStore !== null) {
                          router.push(
                            carryForwardFilterCrumb(
                              `/custom-jewelry?type=${selectionRoute}&state=d${dId ? `&did=${dId}` : ''}${sId ? `&id=${sId}` : ''}`,
                              searchParams,
                            ),
                          );
                        } else {
                          dispatch(setSelectedDiamondStore(null));
                        }
                      }
                    }}
                  >
                    <>
                      <Text
                        size="textxl"
                        as="p"
                        className={`w-full  lg:hidden md:w-full ${
                          selectedDiamondStore && dId ? '' : 'mt-2 md:mt-1'
                        } tracking-[0.50px]  lg:text-[16px] md:text-[14px] sm:text-[12px] md:w-full ${state === 'd' ? '' : ''}`}
                      >
                        {/* {selectedDiamond?.name ?? "CHOOSE A DIAMOND"} */}
                        {selectedDiamondStore?.fullTitle && dId
                          ? selectedDiamondStore?.fullTitle?.length > 32
                            ? selectedDiamondStore?.fullTitle?.slice(0, 32) + '..'
                            : selectedDiamondStore?.fullTitle
                          : 'CHOOSE A DIAMOND'}
                      </Text>
                      <Text
                        size="textxl"
                        as="p"
                        className={`w-full hidden lg:block md:w-full ${
                          selectedDiamondStore && dId ? '' : 'mt-2 md:mt-1'
                        } tracking-[0.50px]  lg:text-[16px] md:text-[14px] sm:text-[12px] md:w-full ${state === 'd' ? '' : ''}`}
                      >
                        {/* {selectedDiamondStore?.fullTitle && dId
                          ? selectedDiamondStore?.fullTitle?.length > 22
                            ? selectedDiamondStore?.fullTitle?.slice(0, 22) + '..'
                            : selectedDiamondStore?.fullTitle
                          : 'CHOOSE A DIAMOND'} */}
                        {selectedDiamondStore?.fullTitle && dId ? 'DIAMOND' : 'CHOOSE A DIAMOND'}
                      </Text>
                    </>

                    {selectionRoute == 2 && !dId && (
                      <span
                        onClick={startWithDiamondsFn}
                        className=" hover:text-primary cursor-pointer underline text-[14px] sm:text-[12px] capitalize"
                      >
                        start with Diamond
                      </span>
                    )}

                    {selectedDiamondStore && dId && (
                      <Text
                        as="p"
                        size="textlg"
                        className={`!font-thin font-sans mt-1 mb-1 flex text-nowrap w-[75%] lg:text-[12px] sm:text-[10px] md:hidden ${state === 'd' ? '' : ''}`}
                      >
                        <span className="flex !w-[53%] text-nowrap overflow-hidden">
                          {`${selectedDiamondStore?.carats} CARATS - ${selectedDiamondStore?.shape_code} `}
                        </span>
                        <span className="pl-1 !font-castoro">{` ${formatCurrency(selectedDiamondStore?.price)}`}</span>
                      </Text>
                    )}
                  </div>
                  <div
                    className={`hidden sm:flex items-center h-full tracking-[1.0px]  ${selectedDiamondStore ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                      if (selectionRoute == 1) {
                        if (selectedDiamondStore !== null) {
                          router.push(
                            carryForwardFilterCrumb(
                              `/custom-jewelry?type=${selectionRoute}&state=d${dId ? `&did=${dId}` : ''}${sId ? `&id=${sId}` : ''}`,
                              searchParams,
                            ),
                          );
                        }
                      } else {
                        if (selectedDiamondStore !== null) {
                          router.push(
                            carryForwardFilterCrumb(
                              `/custom-jewelry?type=${selectionRoute}&state=d${dId ? `&did=${dId}` : ''}${sId ? `&id=${sId}` : ''}`,
                              searchParams,
                            ),
                          );
                        } else {
                          dispatch(setSelectedDiamondStore(null));
                        }
                      }
                    }}
                  >
                    {/* <p className="text-[12px] capitalize">choose diamond</p> */}
                    {/* {selectionRoute == 2 && !dId && ( */}

                    {/* )} */}
                    {selectedDiamondStore && dId ? (
                      <p className={`text-[12px] ${state === 'd' ? '' : ''}`}>Diamond</p>
                    ) : (
                      <p
                        onClick={() => {
                          dispatch(setCustomShapes(null));
                          dispatch(setCustomCarats(null));
                          dispatch(setSelectedShapesData(null));
                          dispatch(setSelectedCaratsData(null));
                          dispatch(setSelectedSettingStore(null));
                          setSelectionRoute(1);
                          router.push(carryForwardFilterCrumb('/custom-jewelry?type=1&state=d', searchParams));
                        }}
                        className={`cursor-pointer sm:text-[12px] capitalize ${selectionRoute == 2 && !dId ? '' : ''}`}
                      >
                        choose diamond
                      </p>
                    )}
                  </div>
                  {selectedDiamondStore && dId && (
                    <div className="flex absolute sm:relative bottom-0 justify-end w-full sm:justify-start">
                      <Text
                        as="p"
                        size="textmd"
                        className="cursor-pointer uppercase underline tracking-[1.0px] sm:capitalize sm:!text-[12px]"
                        onClick={() => {
                          // dispatch(setSelectedShapesData(null));
                          // dispatch(setSelectedCaratsData(null));
                          setActiveStep('diamond');
                          if (selectionRoute === 2) {
                            router.push(
                              carryForwardFilterCrumb(`/custom-jewelry?type=${selectionRoute}&state=d${sId ? `&id=${sId}` : ''}`, searchParams),
                            );
                            setSelectedDiamond(null);
                            dispatch(setSelectedDiamondStore(null));
                          } else {
                            router.push(carryForwardFilterCrumb('/custom-jewelry?type=1&state=d', searchParams));
                            setSelectedDiamond(null);
                            setSelectedSetting(null);
                            dispatch(setCustomShapes(null));
                            dispatch(setCustomCarats(null));
                            dispatch(setSelectedShapesData(null));
                            dispatch(setSelectedCaratsData(null));
                            dispatch(setSelectedDiamondStore(null));
                            dispatch(setSelectedSettingStore(null));
                          }
                        }}
                      >
                        change
                      </Text>
                    </div>
                  )}
                </div>
                <div className="absolute top-0 -right-3 z-[10] flex flex-col justify-center items-center h-full w-[10px]">
                  <div className="bg-secondary w-[1px] h-1/2" style={{ transform: 'skew(20deg)' }}></div>
                  <div className="bg-secondary w-[1px] h-1/2" style={{ transform: 'skew(-20deg)' }}></div>
                </div>
              </div>
            </div>
            {/* Diamond selection ended here  */}
            {/* Setting selection started here  */}
            <div className="relative w-1/2 md:w-full">
              <div
                className={`flex px-5 h-full pl-10 pt-3 pb-3 lg:pr-1 lg:py-2 sm:pb-[10px] sm:pt-[8px] cursor-default items-start gap-[30px] md:gap-[15px] lg:gap-[15px] sm:gap-[10px] md:w-full sm:pl-5 sm:px-1 sm:flex sm:items-center ${
                  state === 's' || sId ? 'bg-[#e7eae1] first-step z-[10]' : 'bg-white next-try'
                }`}
              >
                <Text
                  as="p"
                  size="textxl"
                  className={`flex h-[40px] w-[40px] md:h-[30px] md:w-[30px] aspect-square items-center justify-center rounded-[24px] !bg-secondary !text-text_w text-center tracking-[2.40px]`}
                  onClick={() => {
                    if (selectionRoute == 2) {
                      if (selectedSettingStore !== null) {
                        router.push(
                          carryForwardFilterCrumb(
                            `/custom-jewelry?type=${selectionRoute}&state=s${dId ? `&did=${dId}` : ''}${sId ? `&id=${sId}` : ''}`,
                            searchParams,
                          ),
                        );
                      }
                    } else {
                      if (selectedSettingStore !== null) {
                        router.push(
                          carryForwardFilterCrumb(
                            `/custom-jewelry?type=${selectionRoute}&state=s${dId ? `&did=${dId}` : ''}${sId ? `&id=${sId}` : ''}`,
                            searchParams,
                          ),
                        );
                      } else {
                        dispatch(setSelectedSettingStore(null));
                      }
                    }
                  }}
                >
                  {selectionRoute == 1 ? 2 : 1}
                </Text>
                <div className="w-full sm:flex sm:flex-col relative md:h-full">
                  <div
                    className={`sm:hidden ${selectedSettingStore && sId ? 'cursor-pointer' : ''} `}
                    onClick={() => {
                      if (selectionRoute == 2) {
                        if (selectedSettingStore !== null) {
                          router.push(
                            carryForwardFilterCrumb(
                              `/custom-jewelry?type=${selectionRoute}&state=s${dId ? `&did=${dId}` : ''}${sId ? `&id=${sId}` : ''}`,
                              searchParams,
                            ),
                          );
                        }
                      } else {
                        if (selectedSettingStore !== null && sId) {
                          router.push(
                            carryForwardFilterCrumb(
                              `/custom-jewelry?type=${selectionRoute}&state=s${dId ? `&did=${dId}` : ''}${sId ? `&id=${sId}` : ''}`,
                              searchParams,
                            ),
                          );
                        } else {
                          dispatch(setSelectedSettingStore(null));
                        }
                      }
                    }}
                  >
                    <Text
                      size="textxl"
                      as="p"
                      className={`w-full md:w-full lg:w-[calc(100%-50px)] ${
                        selectedSettingStore && sId ? '' : 'mt-2 md:mt-1'
                      } tracking-[1.20px] lg:text-[16px] md:text-[14px] sm:text-[12px]`}
                    >
                      {selectedSettingStore?.product_details?.title && sId ? 'SETTING' : 'CHOOSE SETTING'}
                    </Text>
                    {selectionRoute == 1 && !sId && (
                      <span
                        onClick={startWithSettingsFn}
                        // className="sm:opacity-30 underline text-[14px] sm:text-[12px] capitalize"
                        className=" hover:text-primary z-1 cursor-pointer underline text-[14px] sm:text-[12px] capitalize"
                      >
                        start with Setting
                      </span>
                    )}
                    {selectedSettingStore && sId && (
                      <>
                        <Text
                          as="p"
                          size="textlg"
                          className={`lg:hidden flex !font-thin font-sans text-nowrap w-[75%] mt-1 mb-1 md:text-[12px] sm:text-[10px]`}
                        >
                          {selectedSettingSkuData && (
                            <>
                              <span className="flex !w-[53%] text-nowrap overflow-hidden">
                                {selectedSettingStore?.product_details?.title?.length > 20
                                  ? selectedSettingStore?.product_details?.title?.slice(0, 20) + '..'
                                  : selectedSettingStore?.product_details?.title}
                              </span>{' '}
                              <span className="pl-1 !font-castoro">
                                {formatCurrency(
                                  selectedSettingSkuData?.discounted_price
                                    ? selectedSettingSkuData?.discounted_price + selectedSettingRingPrice
                                    : selectedSettingSkuData?.selling_price + selectedSettingRingPrice,
                                )}
                              </span>
                            </>
                          )}
                        </Text>
                        <Text
                          as="p"
                          size="textlg"
                          className={`!font-castoro hidden lg:block !font-thin mt-1 mb-1 md:text-[12px] sm:text-[10px] md:hidden `}
                        >
                          {selectedSettingSkuData && (
                            <>
                              {selectedSettingStore?.product_details?.title?.length > 15
                                ? selectedSettingStore?.product_details?.title?.slice(0, 15) + '..'
                                : selectedSettingStore?.product_details?.title}{' '}
                              -{' '}
                              {formatCurrency(
                                selectedSettingSkuData?.discounted_price
                                  ? selectedSettingSkuData?.discounted_price + selectedSettingRingPrice
                                  : selectedSettingSkuData?.selling_price + selectedSettingRingPrice,
                              )}
                            </>
                          )}
                        </Text>
                      </>
                    )}
                  </div>
                  <div
                    className={`hidden sm:flex items-center h-full ${selectedSettingStore ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                      if (selectionRoute == 2) {
                        if (selectedSettingStore !== null) {
                          router.push(
                            carryForwardFilterCrumb(
                              `/custom-jewelry?type=${selectionRoute}&state=s${dId ? `&did=${dId}` : ''}${sId ? `&id=${sId}` : ''}`,
                              searchParams,
                            ),
                          );
                        }
                      } else {
                        if (selectedSettingStore !== null) {
                          router.push(
                            carryForwardFilterCrumb(
                              `/custom-jewelry?type=${selectionRoute}&state=s${dId ? `&did=${dId}` : ''}${sId ? `&id=${sId}` : ''}`,
                              searchParams,
                            ),
                          );
                        } else {
                          dispatch(setSelectedSettingStore(null));
                        }
                      }
                    }}
                  >
                    {selectedSettingStore && sId ? (
                      <p className={`text-[12px] tracking-[1.0px]`}>Setting</p>
                    ) : (
                      <p
                        onClick={() => {
                          router.push(carryForwardFilterCrumb('/custom-jewelry?type=2&state=s', searchParams));
                          dispatch(setSelectedDiamondStore(null));
                          dispatch(setSelectedShapesData(null));
                          dispatch(setSelectedCaratsData(null));
                          setSelectionRoute(2);
                        }}
                        className={`cursor-pointer sm:text-[12px] tracking-[1.0px] capitalize ${selectionRoute == 1 && !sId ? '' : ''}`}
                      >
                        choose setting
                      </p>
                    )}
                  </div>
                  {selectedSettingStore && sId && (
                    <div className={`flex absolute sm:relative bottom-0 justify-end w-full  sm:justify-start`}>
                      <Text
                        as="p"
                        size="textmd"
                        className="cursor-pointer uppercase underline tracking-[1.0px] sm:capitalize sm:!text-[12px]"
                        onClick={() => {
                          setActiveStep('setting');
                          if (selectionRoute === 1) {
                            dispatch(setSelectedProductsDetails(null));
                            dispatch(setSelectedSettingStore(null));
                            router.push(
                              carryForwardFilterCrumb(`/custom-jewelry?type=${selectionRoute}&state=s${dId ? `&did=${dId}` : ''}`, searchParams),
                            );
                            setSelectedSetting(null);
                          } else {
                            dispatch(setSelectedShapesData(null));
                            dispatch(setSelectedCaratsData(null));
                            dispatch(setSelectedProductsDetails(null));
                            dispatch(setSelectedSettingStore(null));
                            router.push(carryForwardFilterCrumb('/custom-jewelry?type=2&state=s', searchParams));
                            setSelectedDiamond(null);
                            setSelectedSetting(null);
                            dispatch(setSelectedDiamondStore(null));
                            dispatch(clearSelectedDiamondFilters());
                            dispatch(setDiamondPageNumber(1));
                            dispatch(setIsSelectedDiamondFilter(false));
                          }
                        }}
                      >
                        change
                      </Text>
                    </div>
                  )}
                </div>
                <div className="absolute top-0 -right-3 z-[10] flex flex-col justify-center items-center h-full w-[10px]">
                  <div className="bg-secondary w-[1px] h-1/2" style={{ transform: 'skew(20deg)' }}></div>
                  <div className="bg-secondary w-[1px] h-1/2" style={{ transform: 'skew(-20deg)' }}></div>
                </div>
              </div>
            </div>
            {/* Setting selection ended here  */}
          </div>
          {/* complete selection started here  */}
          <div className={`relative w-1/3`}>
            <div
              className={`flex w-full h-full sm:pl-5 lg:pr-1 pl-10 px-3 pt-3 pb-3 lg:py-2 sm:pb-[10px] sm:pt-[8px] gap-[30px] md:gap-[20px] sm:gap-[10px] lg:gap-[15px] sm:px-3 sm:flex sm:items-center ${
                selectedDiamondStore && selectedSettingStore ? 'cursor-pointer' : ''
              } ${state === 'c' ? 'cursor-pointer last-step bg-[#e7eae1]' : 'cursor-default select-none bg-white z-0'}`}
              onClick={() => {
                selectedDiamondStore &&
                  selectedSettingStore &&
                  router.push(
                    carryForwardFilterCrumb(
                      `/custom-jewelry?type=${selectionRoute}&state=c${dId ? `&did=${dId}` : ''}${sId ? `&id=${sId}` : ''}`,
                      searchParams,
                    ),
                  );
              }}
            >
              <Text
                as="p"
                size="textxl"
                className="flex h-[40px] md:h-[30px] md:w-[30px] aspect-square w-[40px] items-center justify-center rounded-[24px] !bg-secondary !text-text_w text-center tracking-[2.40px]"
              >
                3
              </Text>
              <Text
                size="textxl"
                as="p"
                className={`w-full sm:text-center uppercase sm:capitalize sm:w-full lg:w-[calc(100%-50px)] my-2 md:my-1 tracking-[1.20px] md:text-[14px] sm:text-[12px]`}
              >
                <>complete selection</>
              </Text>
            </div>
          </div>
          {/* complete selection ended here  */}
        </div>
      </div>
    </div>
  );
}
