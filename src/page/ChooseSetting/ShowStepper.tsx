/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import React, { useEffect, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

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

  // Step states for the trail (presentation only): current = the step on screen, done = a chosen diamond / setting.
  const diamondCurrent = state === 'd';
  const diamondDone = !diamondCurrent && !!(selectedDiamondStore && dId);
  const settingCurrent = state === 's';
  const settingDone = !settingCurrent && !!(selectedSettingStore && sId);
  const completeCurrent = state === 'c';

  const cellClass = (current: boolean) =>
    `relative flex h-full items-start gap-4 px-6 py-5 lg:gap-3 lg:px-4 lg:py-4 sm:items-center sm:gap-2 sm:px-2 sm:py-3 ${
      current ? "after:absolute after:inset-x-0 after:-bottom-px after:h-[2px] after:bg-ink after:content-['']" : ''
    }`;
  const dotClass = (current: boolean, done: boolean) =>
    `grid h-7 w-7 flex-none place-items-center rounded-full border text-[11px] tabular-nums md:h-6 md:w-6 md:text-[10.5px] ${
      current ? 'border-ink bg-ink text-paper' : done ? 'border-gilt bg-gilt text-paper' : 'border-line-strong text-ink-soft'
    }`;
  const titleClass = (current: boolean) =>
    `m-0 text-[11px] font-medium uppercase tracking-[0.16em] md:text-[10.5px] ${current ? 'text-ink' : 'text-ink-soft'}`;
  const summaryClass = 'm-0 mt-1.5 flex min-w-0 items-baseline gap-2 whitespace-nowrap text-[13px] text-ink-soft lg:text-[12px]';
  const startLinkClass =
    'mt-1.5 inline-block cursor-pointer text-[12.5px] text-ink-soft underline underline-offset-4 hover:text-ink sm:text-[11.5px]';
  const changeLinkClass =
    'm-0 cursor-pointer text-[10.5px] font-medium uppercase tracking-[0.16em] text-ink underline underline-offset-4 hover:text-ink-soft';
  const mobileLabelClass = (current: boolean) =>
    `m-0 text-[10.5px] uppercase tracking-[0.12em] ${current ? 'font-medium text-ink' : 'text-ink-soft'}`;

  return (
    <div className="border-b border-line bg-paper font-libre">
      <nav aria-label="Design your ring" className="mx-auto flex max-w-[1440px] px-[clamp(16px,3.2vw,56px)] sm:px-0">
        <div className={`relative flex w-2/3 ${selectionRoute === 2 ? 'flex-row-reverse' : ''}`}>
          {/* Diamond selection started here  */}
          <div className="relative w-1/2 border-r border-line md:w-full">
            <div aria-current={diamondCurrent ? 'step' : undefined} className={`${cellClass(diamondCurrent)} cursor-default`}>
              <span
                className={dotClass(diamondCurrent, diamondDone)}
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
              </span>
              <div className="relative min-w-0 flex-1 sm:flex sm:flex-col">
                <div
                  className={`sm:hidden ${selectedDiamondStore ? 'cursor-pointer' : ''}`}
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
                  <p className={`${titleClass(diamondCurrent)} truncate lg:hidden`}>
                    {selectedDiamondStore?.fullTitle && dId
                      ? selectedDiamondStore?.fullTitle?.length > 32
                        ? selectedDiamondStore?.fullTitle?.slice(0, 32) + '..'
                        : selectedDiamondStore?.fullTitle
                      : 'CHOOSE A DIAMOND'}
                  </p>
                  <p className={`${titleClass(diamondCurrent)} hidden lg:block`}>
                    {selectedDiamondStore?.fullTitle && dId ? 'DIAMOND' : 'CHOOSE A DIAMOND'}
                  </p>

                  {selectionRoute == 2 && !dId && (
                    <span onClick={startWithDiamondsFn} className={startLinkClass}>
                      Start with diamond
                    </span>
                  )}

                  {selectedDiamondStore && dId && (
                    <p className={`${summaryClass} md:hidden`}>
                      <span className="truncate">{`${selectedDiamondStore?.carats} CARATS - ${selectedDiamondStore?.shape_code} `}</span>
                      <span className="tabular-nums text-ink">{formatCurrency(selectedDiamondStore?.price)}</span>
                    </p>
                  )}
                </div>
                <div
                  className={`hidden h-full items-center sm:flex ${selectedDiamondStore ? 'cursor-pointer' : ''}`}
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
                  {selectedDiamondStore && dId ? (
                    <p className={mobileLabelClass(diamondCurrent)}>Diamond</p>
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
                      className={`${mobileLabelClass(diamondCurrent)} cursor-pointer`}
                    >
                      Choose diamond
                    </p>
                  )}
                </div>
                {selectedDiamondStore && dId && (
                  <div className="mt-2 flex sm:mt-0.5">
                    <p
                      className={changeLinkClass}
                      onClick={() => {
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
                      Change
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Diamond selection ended here  */}
          {/* Setting selection started here  */}
          <div className="relative w-1/2 border-r border-line md:w-full">
            <div aria-current={settingCurrent ? 'step' : undefined} className={`${cellClass(settingCurrent)} cursor-default`}>
              <span
                className={dotClass(settingCurrent, settingDone)}
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
              </span>
              <div className="relative min-w-0 flex-1 sm:flex sm:flex-col">
                <div
                  className={`sm:hidden ${selectedSettingStore && sId ? 'cursor-pointer' : ''}`}
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
                  <p className={titleClass(settingCurrent)}>{selectedSettingStore?.product_details?.title && sId ? 'SETTING' : 'CHOOSE SETTING'}</p>
                  {selectionRoute == 1 && !sId && (
                    <span onClick={startWithSettingsFn} className={startLinkClass}>
                      Start with setting
                    </span>
                  )}
                  {selectedSettingStore && sId && (
                    <>
                      <p className={`${summaryClass} lg:hidden`}>
                        {selectedSettingSkuData && (
                          <>
                            <span className="truncate">
                              {selectedSettingStore?.product_details?.title?.length > 20
                                ? selectedSettingStore?.product_details?.title?.slice(0, 20) + '..'
                                : selectedSettingStore?.product_details?.title}
                            </span>
                            <span className="tabular-nums text-ink">
                              {formatCurrency(
                                selectedSettingSkuData?.discounted_price
                                  ? selectedSettingSkuData?.discounted_price + selectedSettingRingPrice
                                  : selectedSettingSkuData?.selling_price + selectedSettingRingPrice,
                              )}
                            </span>
                          </>
                        )}
                      </p>
                      <p className={`${summaryClass} hidden lg:flex md:hidden`}>
                        {selectedSettingSkuData && (
                          <>
                            <span className="truncate">
                              {selectedSettingStore?.product_details?.title?.length > 15
                                ? selectedSettingStore?.product_details?.title?.slice(0, 15) + '..'
                                : selectedSettingStore?.product_details?.title}
                            </span>
                            <span className="tabular-nums text-ink">
                              {formatCurrency(
                                selectedSettingSkuData?.discounted_price
                                  ? selectedSettingSkuData?.discounted_price + selectedSettingRingPrice
                                  : selectedSettingSkuData?.selling_price + selectedSettingRingPrice,
                              )}
                            </span>
                          </>
                        )}
                      </p>
                    </>
                  )}
                </div>
                <div
                  className={`hidden h-full items-center sm:flex ${selectedSettingStore ? 'cursor-pointer' : ''}`}
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
                    <p className={mobileLabelClass(settingCurrent)}>Setting</p>
                  ) : (
                    <p
                      onClick={() => {
                        router.push(carryForwardFilterCrumb('/custom-jewelry?type=2&state=s', searchParams));
                        dispatch(setSelectedDiamondStore(null));
                        dispatch(setSelectedShapesData(null));
                        dispatch(setSelectedCaratsData(null));
                        setSelectionRoute(2);
                      }}
                      className={`${mobileLabelClass(settingCurrent)} cursor-pointer`}
                    >
                      Choose setting
                    </p>
                  )}
                </div>
                {selectedSettingStore && sId && (
                  <div className="mt-2 flex sm:mt-0.5">
                    <p
                      className={changeLinkClass}
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
                      Change
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Setting selection ended here  */}
        </div>
        {/* complete selection started here  */}
        <div className="relative w-1/3">
          <div
            aria-current={completeCurrent ? 'step' : undefined}
            className={`${cellClass(completeCurrent)} ${
              (selectedDiamondStore && selectedSettingStore) || completeCurrent ? 'cursor-pointer' : 'cursor-default select-none'
            }`}
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
            <span className={dotClass(completeCurrent, false)}>3</span>
            <p className={`${titleClass(completeCurrent)} sm:hidden`}>Complete selection</p>
            <p className={`${mobileLabelClass(completeCurrent)} hidden sm:block`}>Complete</p>
          </div>
        </div>
        {/* complete selection ended here  */}
      </nav>
    </div>
  );
}
