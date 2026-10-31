/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unsafe-optional-chaining */
'use client';
import React, { Suspense, useEffect, useRef, useState } from 'react';

import { Button, ConfigProvider, Image, InputNumber, Slider, Tooltip } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import { BsThreeDots } from 'react-icons/bs';
import { FaCheck } from 'react-icons/fa6';
import { LuLoader } from 'react-icons/lu';
import { RxCross2 } from 'react-icons/rx';
import { Virtual, Navigation, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import { plpTheme } from '@/app/[jewelryType]/FilterDrawer';
import { debounce } from '@/page/ChooseSetting/Filter';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  clearSettingFilters,
  fetchSettingFiltersThunk,
  fetchSettings,
  setSelectedSettingFilters,
  setSelectedShapesData,
  setSettingPageNumber,
} from '@/store/slices/customProducts/customProductSlice';
import { carryForwardFilterCrumb } from '@/utils/breadcrumbFilterParams';
import { findSubTypesByParam, subTypeCodeToParam } from '@/utils/subTypeParam';

import { Text, Img } from '../../../components';
import UserProfile8 from '../../../components/UserProfile8';

const data = [
  { userName: 'Solitaire' },
  { userName: 'Halo' },
  { userName: 'Solitaire' },
  { userName: 'Halo' },
  { userName: 'Solitaire' },
  { userName: 'Halo' },
];

export default function CustomJewelrySettingFilter({ isLoading, setIsLoading }: { isLoading: boolean; setIsLoading: any }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const shapeDropdownRef = useRef<HTMLDivElement | null>(null);
  const searchParams = useSearchParams();

  // Same rebuild-from-scratch problem as the diamond filter panel: each setting-filter change
  // reassembles the URL and would drop the breadcrumb crumb params the shopper carried in. Both
  // crumbs survive here — neither the PLP filter nor an already-picked diamond's filter is
  // invalidated by changing setting filters.
  const replaceUrl = (url: string, options?: { scroll?: boolean }) => router.replace(carryForwardFilterCrumb(url, searchParams), options);
  const type = searchParams?.get('type');
  const state = searchParams?.get('state');
  const dId = searchParams?.get('did');
  const price = searchParams?.get('price');
  const jewelry = searchParams?.get('jewelry');
  const metal = searchParams?.get('metal');
  const subTypes = searchParams?.get('subTypes');
  const shape = searchParams?.get('shape');
  const [swiperRef, setSwiperRef] = useState<any>(null);
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const [swiperMetalRef, setSwiperMetalRef] = useState<any>(null);
  const prevMetalRef = useRef<HTMLButtonElement>(null);
  const nextMetalRef = useRef<HTMLButtonElement>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);

  const { settingFilters, selectedShapesData, settingPageNumber, settingPageSize, selectedSettingFilters } = useAppSelector((s) => s.customProduct);

  const masterData = useAppSelector((s) => s.master.data);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [selectedJewelryType, setSelectedJewelryType] = useState('all');
  const [selectedFilters, setSelectedFilters] = useState<any>({
    min_price: settingFilters?.price_range?.min_price || 0,
    max_price: settingFilters?.price_range?.max_price || 0,
    jewelryType: '',
    subTypes: [],
    metal: [],
    shape: [],
    is_customizable: true,
  });
  const [isOpenSubType, setIsOpenSubType] = useState(false);
  const [isOpenShape, setIsOpenShape] = useState(false);
  const [selectedMoreSubType, setSelectedMoreSubType] = useState<any>([]);
  const [selectedMoreShape, setSelectedMoreShape] = useState<any>([]);
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

  const handleMenuToggle = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  const debouncedFetchDiamonds = (payload: any) =>
    debounce(() => {
      dispatch(fetchSettings({ data: payload, page: 1, size: settingPageSize }));
    }, 300);

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpenSubType(false);
    }
    if (shapeDropdownRef.current && !shapeDropdownRef.current.contains(event.target as Node)) {
      setIsOpenShape(false);
    }
  };

  const handleFilterChange = (filterType: string, value: any) => {
    dispatch(setSettingPageNumber(1));
    if (filterType == 'metal') {
      const updateFilter = { ...selectedFilters };
      const updatedMetalColor: any = [...updateFilter?.metal];
      const metalColorIndex = updateFilter.metal.findIndex((el: any) => el == value);
      if (metalColorIndex !== -1) {
        updatedMetalColor.splice(metalColorIndex, 1);
      } else {
        updatedMetalColor.push(value);
      }
      setSelectedFilters({
        ...updateFilter,
        metal: updatedMetalColor,
      });
      dispatch(
        setSelectedSettingFilters({
          ...updateFilter,
          metal: updatedMetalColor,
        }),
      );
      const newData = masterData?.filter((item: any) => updatedMetalColor.includes(item?.id));

      replaceUrl(
        `custom-jewelry?type=${type}&state=${state}${dId ? `&did=${dId}` : ''}${
          price ? `&price=${price}` : ''
        }${jewelry ? `&jewelry=${jewelry}` : ''}${
          newData?.length > 0
            ? `&metal=${newData
                ?.map((el: any) => el?.code?.toLowerCase())
                ?.toString()
                ?.replaceAll(',', '|')}`
            : ''
        }${subTypes ? `&subTypes=${subTypes}` : ''}${shape ? `&shape=${shape}` : ''}`,
        { scroll: false },
      );
      debouncedFetchDiamonds({
        ...updateFilter,
        metal: updatedMetalColor,
      }).call(debounce);
    } else if (filterType == 'price') {
      setSelectedFilters((prevFilters: any) => ({
        ...prevFilters,
        min_price: value[0],
        max_price: value[1],
      }));
      dispatch(
        setSelectedSettingFilters({
          ...selectedSettingFilters,
          min_price: value[0],
          max_price: value[1],
        }),
      );
      replaceUrl(
        `custom-jewelry?type=${type}&state=${state}${dId ? `&did=${dId}` : ''}${
          value ? `&price=${`${value[0]}-${value[1]}`}` : ''
        }${jewelry ? `&jewelry=${jewelry}` : ''}${metal ? `&metal=${metal}` : ''}${subTypes ? `&subTypes=${subTypes}` : ''}${
          shape ? `&shape=${shape}` : ''
        }`,
        { scroll: false },
      );
      debouncedFetchDiamonds({
        ...selectedFilters,
        min_price: value[0],
        max_price: value[1],
      }).call(debounce);
    } else if (filterType === 'jewelryType') {
      setSelectedFilters((prevFilters: any) => ({
        ...prevFilters,
        min_price: 0,
        max_price: 0,
        subTypes: [],
        metal: [],
        shape: [],
        jewelryType: value,
      }));
      dispatch(
        setSelectedSettingFilters({
          ...selectedSettingFilters,
          min_price: 0,
          max_price: 0,
          subTypes: [],
          metal: [],
          shape: [],
          jewelryType: value,
        }),
      );
      // Clear cached setting filters so they are re-fetched for the new jewelry type
      dispatch(clearSettingFilters());
      replaceUrl(`custom-jewelry?type=${type}&state=${state}${dId ? `&did=${dId}` : ''}${value ? `&jewelry=${value}` : ''}`, { scroll: false });
      // Re-fetch the product list with the new jewelry type and reset filters
      debouncedFetchDiamonds({
        min_price: 0,
        max_price: 0,
        subTypes: [],
        metal: [],
        shape: [],
        jewelryType: value,
      }).call(debounce);
    } else if (filterType === 'subTypes') {
      const updateFilter = { ...selectedFilters };
      const updatedSubTypes: any = [...updateFilter?.subTypes];
      const subTypeIndex = updateFilter.subTypes.findIndex((el: any) => el === value);
      if (subTypeIndex !== -1) {
        updatedSubTypes.splice(subTypeIndex, 1);
      } else {
        updatedSubTypes.push(value);
      }
      setSelectedFilters({
        ...updateFilter,
        subTypes: updatedSubTypes,
      });
      dispatch(
        setSelectedSettingFilters({
          ...updateFilter,
          subTypes: updatedSubTypes,
        }),
      );
      const newData = masterData?.filter((item: any) => updatedSubTypes.includes(item?.id));

      replaceUrl(
        `custom-jewelry?type=${type}&state=${state}${dId ? `&did=${dId}` : ''}${
          price ? `&price=${price}` : ''
        }${jewelry ? `&jewelry=${jewelry}` : ''}${metal ? `&metal=${metal}` : ''}${
          newData?.length > 0
            ? `&subTypes=${newData
                ?.map((el: any) => subTypeCodeToParam(el?.code))
                ?.toString()
                ?.replaceAll(',', '|')}`
            : ''
        }${shape ? `&shape=${shape}` : ''}`,
        { scroll: false },
      );
      debouncedFetchDiamonds({
        ...updateFilter,
        subTypes: updatedSubTypes,
      }).call(debounce);
    } else if (filterType === 'shape') {
      const updateFilter = { ...selectedFilters };
      const updatedShapes: any = [...updateFilter?.shape];
      const shapeIndex = updateFilter.shape.findIndex((el: any) => el === value);
      if (shapeIndex !== -1) {
        updatedShapes.splice(shapeIndex, 1);
      } else {
        updatedShapes.push(value);
      }
      setSelectedFilters({
        ...updateFilter,
        shape: updatedShapes,
      });
      dispatch(
        setSelectedSettingFilters({
          ...updateFilter,
          shape: updatedShapes,
        }),
      );
      const newData = masterData?.filter((item: any) => updatedShapes.includes(item?.id));

      replaceUrl(
        `custom-jewelry?type=${type}&state=${state}${dId ? `&did=${dId}` : ''}${
          price ? `&price=${price}` : ''
        }${jewelry ? `&jewelry=${jewelry}` : ''}${metal ? `&metal=${metal}` : ''}${subTypes ? `&subTypes=${subTypes}` : ''}${
          newData?.length > 0
            ? `&shape=${newData
                ?.map((el: any) => el?.code?.toLowerCase()?.replaceAll('_', '-'))
                ?.toString()
                ?.replaceAll(',', '|')}`
            : ''
        }`,
        { scroll: false },
      );
      debouncedFetchDiamonds({
        ...updateFilter,
        shape: updatedShapes,
      }).call(debounce);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!settingFilters || Object.keys(settingFilters)?.length == 0) {
      dispatch(fetchSettingFiltersThunk(selectedJewelryType));
    }
  }, [selectedJewelryType, dispatch, searchParams?.toString()]);

  useEffect(() => {
    if (settingFilters && Object.keys(settingFilters)?.length !== 0) {
      const IdFilter = (arr: string) => {
        return masterData
          ?.filter((item: any) =>
            arr
              ?.split('|')
              ?.map((el: string) => el.toUpperCase())
              .includes(item?.code),
          )
          .map((el: any) => el.id);
      };
      const SubtypeIdFilter = (arr: string) => {
        return (arr?.split('|') ?? []).flatMap((token: string) =>
          findSubTypesByParam(token, masterData, settingFilters?.subTypes).map((el: any) => el.id),
        );
      };
      const ShapeIdFilter = (arr: string) => {
        return masterData
          ?.filter((item: any) =>
            arr
              ?.split('|')
              ?.map((el: string) => el?.replaceAll('-', '_'))
              ?.includes(item?.code?.toLowerCase()),
          )
          .map((el: any) => el.id);
      };
      const normalizedFilters = {
        jewelryType: jewelry ? jewelry : selectedJewelryType,
        subTypes: subTypes ? SubtypeIdFilter(subTypes) : [],
        metal: metal ? IdFilter(metal) : [],
        shape: shape ? ShapeIdFilter(shape) : [],
        min_price: price ? Number(price?.split('-')?.[0]) : settingFilters?.price_range?.min_price,
        max_price: price ? Number(price?.split('-')?.[1]) : settingFilters?.price_range?.max_price,
        is_customizable: true,
      };
      setSelectedFilters(normalizedFilters);
      dispatch(
        setSelectedSettingFilters({
          ...selectedSettingFilters,
          ...normalizedFilters,
        }),
      );
      dispatch(setSettingPageNumber(1));
      dispatch(
        fetchSettings({
          data: {
            ...normalizedFilters,
            shape: shape ? ShapeIdFilter(shape) : selectedShapesData && type == '1' ? [selectedShapesData] : [],
          },
          page: settingPageNumber,
          size: settingPageSize,
        }),
      ).then(() => {
        dispatch(setSelectedShapesData(null));
        setIsLoading(false);
      });
    }
  }, [settingFilters, searchParams?.toString(), selectedJewelryType, masterData]);

  return (
    <ConfigProvider theme={plpTheme}>
      {isLoading ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 sm:min-h-[20vh]">
          <LuLoader className="h-6 w-6 animate-spin text-ink" />
          <span className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-ink-soft">Loading settings</span>
        </div>
      ) : (
        <div className="w-full bg-paper font-libre text-ink">
          <div className="mx-auto w-full max-w-[1440px] px-[clamp(16px,3.2vw,56px)]">
            <div className="flex items-start justify-center gap-10 border-y border-line py-7 lg:gap-6 sm:border-t-0 sm:py-3">
              <div className="flex w-[30%] flex-col gap-7 border-r border-line pr-10 lg:w-[35%] lg:pr-6 sm:hidden">
                <div className="flex flex-col items-start gap-3">
                  <p className="m-0 text-[10.5px] font-medium uppercase tracking-[0.16em] text-ink-soft">PRICE RANGE</p>
                  <div className="flex min-h-[100px] flex-col self-stretch">
                    {settingFilters?.price_range && Object.keys(settingFilters?.price_range)?.length !== 0 && (
                      <Slider
                        range
                        defaultValue={[settingFilters?.price_range?.min_price, settingFilters?.price_range?.max_price]}
                        value={[selectedFilters.min_price, selectedFilters.max_price]}
                        onChange={(value: any) => {
                          setSelectedFilters((prevFilters: any) => ({
                            ...prevFilters,
                            min_price: value[0],
                            max_price: value[1],
                          }));
                          dispatch(
                            setSelectedSettingFilters({
                              ...selectedSettingFilters,
                              min_price: value[0],
                              max_price: value[1],
                            }),
                          );
                        }}
                        min={settingFilters?.price_range?.min_price || 0}
                        max={settingFilters?.price_range?.max_price || 0}
                        onChangeComplete={(value: any) => handleFilterChange('price', value)}
                      />
                    )}
                    <div className="mt-2 flex justify-between gap-3">
                      <div className="flex items-center gap-1.5">
                        <p className="m-0 text-[13px] text-ink-soft">{settingFilters?.currency_symbol}</p>
                        <InputNumber
                          size="small"
                          min={settingFilters?.price_range?.min_price}
                          max={settingFilters?.price_range?.max_price}
                          className="!w-[96px] tabular-nums"
                          value={selectedFilters?.min_price}
                          onChange={(value: any) => {
                            setSelectedFilters((prevFilters: any) => ({
                              ...prevFilters,
                              min_price: value,
                            }));
                            dispatch(
                              setSelectedSettingFilters({
                                ...selectedSettingFilters,
                                min_price: value,
                              }),
                            );
                            handleFilterChange('price', [
                              value ?? settingFilters?.price_range?.min_price ?? 0,
                              settingFilters?.price_range?.max_price,
                            ]);
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <p className="m-0 text-[13px] text-ink-soft">{settingFilters?.currency_symbol}</p>
                        <InputNumber
                          size="small"
                          min={settingFilters?.price_range?.min_price}
                          max={settingFilters?.price_range?.max_price}
                          className="!w-[96px] tabular-nums"
                          value={selectedFilters?.max_price}
                          onChange={(value: any) => {
                            setSelectedFilters((prevFilters: any) => ({
                              ...prevFilters,
                              max_price: value,
                            }));
                            dispatch(
                              setSelectedSettingFilters({
                                ...selectedSettingFilters,
                                max_price: value,
                              }),
                            );
                            handleFilterChange('price', [
                              settingFilters?.price_range?.min_price,
                              value ?? settingFilters?.price_range?.max_price ?? 0,
                            ]);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-start gap-3">
                  <p className="m-0 text-[10.5px] font-medium uppercase tracking-[0.16em] text-ink-soft">METAL</p>
                  {/* <div className="grid grid-cols-8 lg:!grid-cols-7 md:!grid-cols-6 gap-2 items-start justify-between self-stretch">
                    {settingFilters.metal_color_id &&
                      masterData
                        ?.filter((item: any) => settingFilters.metal_color_id?.includes(item?.id))
                        .map((metal: any, index: number) => (
                          <Tooltip key={index} title={metal?.name}>
                            <div
                              key={index}
                              className={`w-[35px] min-w-[80px] flex flex-col pt-2 select-none items-center gap-3 aspect-square cursor-pointer sm:px-4 border-b pb-1 ${
                                selectedFilters?.metal?.includes(metal?.id as any) ? 'border-[#17381d] ' : ' border'
                              }`}
                              onClick={(event) => {
                                event.persist();
                                handleFilterChange('metal', metal?.id);
                              }}
                            >
                              <Image
                                fallback="/images/img_asset_1.png"
                                src={metal?.image?.[0]}
                                height={30}
                                preview={false}
                                alt="10k Rose Gold"
                                className="object-cover"
                              />
                            </div>
                          </Tooltip>
                        ))}
                  </div> */}
                  <div className="relative w-full">
                    <div className="w-[85%] mx-auto">
                      <Swiper
                        modules={[Virtual, Navigation, Pagination]}
                        onSwiper={(swiper) => {
                          setSwiperMetalRef(swiper);
                        }}
                        onSlideChange={(swiper) => {
                          setIsBeginning(swiper.isBeginning);
                          setIsEnd(swiper.isEnd);
                        }}
                        slidesPerView={4}
                        spaceBetween={2}
                        pagination={{
                          type: 'fraction',
                        }}
                        // navigation={true}
                        navigation={{
                          prevEl: prevMetalRef.current,
                          nextEl: nextMetalRef.current,
                        }}
                        virtual
                        className="subtype-swiper !px-0"
                      >
                        {settingFilters.metal_color_id &&
                          masterData
                            ?.filter((item: any) => settingFilters.metal_color_id?.includes(item?.id))
                            .map((metal: any, index: number) => {
                              // const shapeData = masterData.find((el: any) => el.id === shapeId);
                              return (
                                <SwiperSlide key={`${metal?.id}-${index}`} virtualIndex={index}>
                                  <div
                                    className={`relative mx-1.5 flex w-[72px] cursor-pointer flex-col items-center justify-center !overflow-hidden border bg-paper py-1.5 transition-colors ${
                                      selectedFilters?.metal?.includes(metal?.id as any)
                                        ? 'border-ink opacity-100'
                                        : 'border-line opacity-80 hover:border-ink-soft'
                                    }`}
                                    onClick={() => {
                                      handleFilterChange('metal', metal?.id);
                                    }}
                                  >
                                    <Tooltip title={metal?.name}>
                                      <div className="w-[35px] items-center aspect-square flex justify-center">
                                        <Image
                                          preview={false}
                                          className="object-contain"
                                          height={30}
                                          fallback="/images/no_images.svg"
                                          src={metal?.image?.[0]}
                                          alt={metal?.name}
                                        />
                                      </div>
                                    </Tooltip>
                                    <div className="text-[9px] sm:text-[8px] absolute left-[-36%] top-[8%] w-full -rotate-45 bg-ink/75 text-center tracking-[0.06em] text-paper">
                                      {metal?.code !== 'SILVER_925' ? metal?.code : '925'}
                                    </div>
                                  </div>
                                </SwiperSlide>
                              );
                            })}
                      </Swiper>
                    </div>
                    <div className="absolute top-5 w-full flex justify-between items-center">
                      <button
                        ref={prevMetalRef}
                        className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 py-1.5 px-0 ${isBeginning ? 'opacity-30' : ''}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="h-5 w-5 text-ink"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                      </button>
                      <button
                        ref={nextMetalRef}
                        className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 py-1.5 px-0 ${isEnd ? 'opacity-30' : ''}`}
                        // onClick={() => console.log(swiperRef.activeIndex, swiperRef?.visibleSlidesIndexes)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="h-5 w-5 text-ink"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex w-[70%] flex-1 flex-col items-start gap-6 lg:w-[65%] sm:w-full sm:flex-wrap sm:gap-4">
                <div className="hidden flex-1 sm:w-full flex-col items-start gap-2 sm:gap-2 sm:flex-wrap">
                  <div className="flex justify-between items-center sm:w-full ">
                    <p className="m-0 text-[10.5px] font-medium uppercase tracking-[0.16em] text-ink-soft">JEWELRY TYPE</p>

                    <div
                      className="hidden items-center justify-between gap-2 bg-ink px-3.5 py-2 text-paper sm:flex sm:min-w-[96px]"
                      onClick={handleMenuToggle}
                    >
                      <p className="m-0 flex gap-2 text-[10.5px] uppercase tracking-[0.18em] text-paper">Filter</p>
                      <div>
                        <Img width={14} height={14} className="h-4 w-4 p-0 invert" src="filter_icon.svg" />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 flex-wrap self-stretch sm:gap-2 overflow-auto py-2">
                    <Suspense fallback={<div>Loading feed...</div>}>
                      {settingFilters?.jewelry_types?.map((type: any, index: number) => (
                        <div
                          key={index}
                          className={`inline-flex min-h-[32px] cursor-pointer items-center border px-3 text-[12.5px] transition-colors ${
                            selectedJewelryType === type.name.toLowerCase().replace(' ', '-')
                              ? 'border-ink bg-ink text-paper'
                              : 'border-line text-ink hover:border-ink'
                          }`}
                          onClick={() => {
                            handleFilterChange('jewelryType', type.name?.toLowerCase()?.replace(' ', '-'));
                            setSelectedJewelryType(type.name.toLowerCase().replace(' ', '-'));
                          }}
                        >
                          <p className="m-0 text-nowrap text-center">{type?.name}</p>
                        </div>
                      ))}
                    </Suspense>
                  </div>
                </div>
                <div className="flex flex-1 sm:w-full flex-col items-start gap-1.5 sm:gap-2 sm:flex-wrap">
                  <div className="flex justify-between items-center sm:w-full">
                    <p className="m-0 text-[10.5px] font-medium uppercase tracking-[0.16em] text-ink-soft">SETTING STYLE</p>
                    <div className="hidden cursor-pointer items-center bg-ink px-3.5 py-2 sm:flex" onClick={handleMenuToggle}>
                      <Text size="textxl" as="p" className="!m-0 flex items-center gap-2 !text-[10.5px] uppercase !tracking-[0.18em] !text-paper">
                        Filter
                        <Img width={14} height={14} className="h-4 w-4 invert" src="filter_icon.svg" />
                      </Text>
                    </div>
                  </div>
                  <div className="relative flex gap-2 self-stretch py-1 lg:flex-wrap lg:gap-2 sm:max-w-[95vw] sm:gap-2 sm:py-0">
                    {settingFilters?.subTypes
                      ?.slice(
                        0,
                        windowWidth <= 425 ? 4 : windowWidth <= 768 && windowWidth > 425 ? 5 : windowWidth <= 1024 && windowWidth > 768 ? 6 : 8,
                      )
                      ?.map((sub: any, index: number) => (
                        <div
                          key={index}
                          className={`flex h-[92px] w-[100px] cursor-pointer select-none flex-col items-center justify-center gap-1 border bg-paper p-2 pt-0 transition-colors xl:w-[90px] lg:h-[65px] lg:w-[65px] md:w-[65px] sm:hidden ${selectedFilters.subTypes.includes(sub?.id) ? 'border-ink' : 'border-line hover:border-ink-soft'}`}
                          onClick={() => {
                            handleFilterChange('subTypes', sub.id);
                          }}
                        >
                          <Image
                            preview={false}
                            className="px-3 lg:px-1"
                            fallback="/images/no_images.svg"
                            src={masterData.find((el: any) => el.id === sub?.id)?.image?.[0]}
                            alt={masterData.find((el: any) => el.id === sub?.id)?.name}
                          />
                          <span className="w-[98%] overflow-hidden text-nowrap px-0.5 text-center text-[12.5px] text-ink xl:text-[12px] lg:text-[11px]">
                            {masterData.find((el: any) => el.id === sub?.id)?.name}
                          </span>
                        </div>
                      ))}
                    {settingFilters?.subTypes?.length >
                      (windowWidth <= 425 ? 4 : windowWidth <= 768 && windowWidth > 425 ? 5 : windowWidth <= 1024 && windowWidth > 768 ? 6 : 8) && (
                      <>
                        <div
                          className={`flex h-[92px] w-[100px] cursor-pointer flex-col items-center justify-center border bg-paper p-2 pt-0 transition-colors xl:w-[90px] lg:h-[60px] lg:w-[64px] sm:hidden ${selectedMoreSubType?.length > 0 || isOpenSubType ? 'border-ink' : 'border-line hover:border-ink-soft'}`}
                          onClick={() => {
                            setIsOpenSubType(true);
                          }}
                        >
                          <div>
                            <BsThreeDots className="my-3 h-5 w-5 text-ink lg:my-1" />
                          </div>
                          <span className="text-wrap px-0.5 text-center text-[12.5px] text-ink xl:text-[12px] lg:px-0 lg:text-[11px]">
                            More Styles
                          </span>
                        </div>
                      </>
                    )}

                    {isOpenSubType && (
                      <div
                        ref={dropdownRef}
                        className="absolute right-0 top-[102px] z-[19] w-[220px] border border-line bg-paper lg:right-0 lg:top-[72px] sm:hidden"
                      >
                        <div className="flex items-center justify-between border-b border-line px-4 py-3">
                          <span className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-ink-soft !text-ink">More Styles</span>
                          <RxCross2 className="h-4 w-4 cursor-pointer text-ink" onClick={() => setIsOpenSubType(false)} />
                        </div>
                        <div className="max-h-[250px] overflow-y-scroll">
                          {settingFilters?.subTypes?.slice(6, settingFilters?.subTypes?.length)?.map((item: any, index: number) => (
                            <div
                              key={index}
                              className={`flex h-6 w-[100%] cursor-pointer select-none items-center gap-3 border-b border-line px-4 py-5 last:border-b-0 hover:bg-stone`}
                              onClick={() => {
                                setSelectedMoreSubType(
                                  selectedMoreSubType?.includes(item?.id)
                                    ? selectedMoreSubType?.filter((subType: any) => subType !== item.id)
                                    : [...selectedMoreSubType, item.id],
                                );
                              }}
                            >
                              <div className="flex h-auto w-9 items-center justify-center">
                                <Image
                                  preview={false}
                                  className="w-full h-full object-cover"
                                  fallback="/images/no_images.svg"
                                  src={masterData.find((el: any) => el.id === item.id)?.image?.[0] ?? '/images/no_images.svg'}
                                  alt={masterData.find((el: any) => el.id === item.id)?.name}
                                />
                              </div>
                              <div className="flex justify-between items-center w-full">
                                <span className="text-wrap px-0.5 text-center text-[13.5px] text-ink">
                                  {masterData.find((el: any) => el.id === item.id)?.name}
                                </span>
                                {selectedMoreSubType?.includes(item?.id) && (
                                  <span>
                                    <FaCheck className="h-3.5 w-3.5 text-ink" />
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="relative hidden sm:block w-full">
                      <div className="w-[85%] mx-auto">
                        <Swiper
                          modules={[Virtual, Navigation, Pagination]}
                          onSwiper={(swiper) => {
                            setSwiperRef(swiper);
                          }}
                          onSlideChange={(swiper) => {
                            setIsBeginning(swiper.isBeginning);
                            setIsEnd(swiper.isEnd);
                          }}
                          slidesPerView={4}
                          spaceBetween={2}
                          pagination={{
                            type: 'fraction',
                          }}
                          // navigation={true}
                          navigation={{
                            prevEl: prevRef.current,
                            nextEl: nextRef.current,
                          }}
                          virtual
                          className="subtype-swiper !px-0"
                        >
                          {settingFilters?.subTypes?.map((sub: any, index: number) => (
                            <SwiperSlide key={`${sub.id}-${index}`} virtualIndex={index}>
                              <div
                                className={`flex aspect-square w-[65px] min-w-[65px] cursor-pointer flex-col justify-center border bg-paper p-1.5 pt-0 ${
                                  selectedFilters.subTypes.includes(sub?.id) ? 'border-ink' : 'border-line'
                                }`}
                                onClick={() => {
                                  handleFilterChange('subTypes', sub.id);
                                }}
                              >
                                <Image
                                  preview={false}
                                  className="px-3 lg:px-1"
                                  fallback="/images/no_images.svg"
                                  src={masterData.find((el: any) => el.id === sub?.id)?.image?.[0]}
                                  alt={masterData.find((el: any) => el.id === sub?.id)?.name}
                                />
                                <span className="w-[98%] overflow-hidden text-nowrap px-0.5 text-center text-[12.5px] text-ink xl:text-[12px] lg:text-[11px]">
                                  {masterData.find((el: any) => el.id === sub?.id)?.name}
                                </span>
                              </div>
                            </SwiperSlide>
                          ))}
                        </Swiper>
                      </div>
                      <div className="absolute top-8 w-full flex justify-between items-center">
                        <button
                          ref={prevRef}
                          className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 py-1.5 px-0 ${isBeginning ? 'opacity-30' : ''}`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="h-5 w-5 text-ink"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                          </svg>
                        </button>
                        <button
                          ref={nextRef}
                          className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 py-1.5 px-0 ${isEnd ? 'opacity-30' : ''}`}
                          // onClick={() => console.log(swiperRef.activeIndex, swiperRef?.visibleSlidesIndexes)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="h-5 w-5 text-ink"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-1 sm:w-full flex-col items-start gap-1.5 sm:gap-2 sm:flex-wrap">
                  <div className="flex justify-between items-center sm:w-full">
                    <p className="m-0 text-[10.5px] font-medium uppercase tracking-[0.16em] text-ink-soft">SHAPE</p>
                  </div>
                  <div className="relative flex gap-2 self-stretch py-1 lg:flex-wrap sm:max-w-[95vw] sm:gap-2 sm:py-0">
                    {settingFilters?.shape_id
                      ?.filter((shapeId: string) => shapeId !== null)
                      ?.map((shapeId: string, index: number) => {
                        const shapeData = masterData.find((el: any) => el.id === shapeId);
                        return (
                          <div
                            key={index}
                            className={`flex cursor-pointer flex-col items-center justify-center border p-1.5 transition-colors sm:hidden ${
                              selectedFilters.shape.includes(shapeId)
                                ? 'border-ink opacity-100'
                                : 'border-line opacity-70 hover:border-ink-soft hover:opacity-100'
                            }`}
                            onClick={() => {
                              handleFilterChange('shape', shapeId);
                            }}
                          >
                            <Tooltip title={shapeData?.name}>
                              <div className="w-[35px] items-center aspect-square flex justify-center">
                                <Image
                                  preview={false}
                                  height={30}
                                  fallback="/images/no_images.svg"
                                  src={shapeData?.image?.[0]}
                                  alt={shapeData?.name}
                                  // className=""
                                />
                              </div>
                            </Tooltip>
                          </div>
                        );
                      })}

                    <div className="relative hidden sm:block w-full">
                      <div className="w-[85%] mx-auto">
                        <Swiper
                          modules={[Virtual, Navigation, Pagination]}
                          onSwiper={(swiper) => {
                            setSwiperRef(swiper);
                          }}
                          onSlideChange={(swiper) => {
                            setIsBeginning(swiper.isBeginning);
                            setIsEnd(swiper.isEnd);
                          }}
                          slidesPerView={5}
                          spaceBetween={1}
                          pagination={{
                            type: 'fraction',
                          }}
                          // navigation={true}
                          navigation={{
                            prevEl: prevRef.current,
                            nextEl: nextRef.current,
                          }}
                          virtual
                          className="subtype-swiper !px-0"
                        >
                          {settingFilters?.shape_id?.map((shapeId: any, index: number) => {
                            const shapeData = masterData.find((el: any) => el.id === shapeId);
                            return (
                              <SwiperSlide key={`${shapeId}-${index}`} virtualIndex={index}>
                                <div
                                  className={`mx-1.5 flex w-[64px] cursor-pointer flex-col items-center justify-center border p-1 ${
                                    selectedFilters.subTypes.includes(shapeId) ? 'border-ink opacity-100' : 'border-line opacity-70'
                                  }`}
                                  onClick={() => {
                                    handleFilterChange('subTypes', shapeId);
                                  }}
                                >
                                  <Tooltip title={shapeData?.name}>
                                    <div className="w-[35px] items-center aspect-square flex justify-center">
                                      <Image
                                        preview={false}
                                        className="object-contain"
                                        height={30}
                                        fallback="/images/no_images.svg"
                                        src={shapeData?.image?.[0]}
                                        alt={shapeData?.name}
                                      />
                                    </div>
                                  </Tooltip>
                                </div>
                              </SwiperSlide>
                            );
                          })}
                        </Swiper>
                      </div>
                      <div className="absolute top-5 w-full flex justify-between items-center">
                        <button
                          ref={prevRef}
                          className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 py-1.5 px-0 ${isBeginning ? 'opacity-30' : ''}`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="h-5 w-5 text-ink"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                          </svg>
                        </button>
                        <button
                          ref={nextRef}
                          className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 py-1.5 px-0 ${isEnd ? 'opacity-30' : ''}`}
                          // onClick={() => console.log(swiperRef.activeIndex, swiperRef?.visibleSlidesIndexes)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="h-5 w-5 text-ink"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* drawer */}
          <div
            className={`fixed inset-0 left-0 top-0 z-[1053] bg-ink/40 transition-all duration-500 ease-in-out ${
              isFilterOpen ? '-translate-y-0' : 'translate-y-full'
            }`}
            style={{ width: '100%', height: '100vh' }}
          >
            <div className="modal-content relative h-full overflow-hidden bg-paper">
              <div className="flex w-full items-center justify-between border-b border-line px-[18px] py-[18px]">
                <Text size="text5xl" as="p" className="!m-0 !text-[12px] !font-medium uppercase !tracking-[0.18em] !text-ink">
                  Filter By
                </Text>
                <div>
                  <button
                    type="button"
                    aria-label="Close filters"
                    onClick={handleMenuToggle}
                    className="grid place-items-center bg-ink px-3.5 py-2 text-paper"
                  >
                    <RxCross2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="w-full overflow-auto px-[18px] pt-2" style={{ width: '100%', maxHeight: 'calc(100vh - 79px)' }}>
                <div className="flex h-full flex-col">
                  <div className="flex flex-col items-start gap-3 border-b border-line py-[22px]">
                    <Text size="textxl" as="p" className="!m-0 font-cormorant !text-[22px] !font-medium !text-ink">
                      PRICE RANGE
                    </Text>
                    <div className="flex flex-col gap-2 self-stretch">
                      <div className="flex flex-wrap justify-between gap-5">
                        <div className="flex items-center gap-1.5">
                          <p className="m-0 text-[13px] text-ink-soft">{settingFilters?.currency_symbol}</p>
                          <InputNumber
                            min={settingFilters?.price_range?.min_price}
                            max={settingFilters?.price_range?.max_price}
                            className="!w-[96px] tabular-nums"
                            size="small"
                            // prefix="$"
                            inputMode="numeric"
                            value={selectedFilters?.min_price}
                            onChange={(value: any) => {
                              setSelectedFilters((prevFilters: any) => ({
                                ...prevFilters,
                                min_price: value,
                                // max_price: value[1],
                              }));
                              dispatch(
                                setSelectedSettingFilters({
                                  ...selectedSettingFilters,
                                  min_price: value,
                                }),
                              );
                              handleFilterChange('price', [
                                value ?? settingFilters?.price_range?.min_price ?? 0,
                                settingFilters?.price_range?.max_price,
                              ]);
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <p className="m-0 text-[13px] text-ink-soft">{settingFilters?.currency_symbol}</p>
                          <InputNumber
                            min={settingFilters?.price_range?.min_price}
                            max={settingFilters?.price_range?.max_price}
                            className="!w-[96px] tabular-nums"
                            // prefix="$"
                            // style={{ margin: "0 16px" }}
                            inputMode="numeric"
                            size="small"
                            value={selectedFilters?.max_price}
                            onChange={(value: any) => {
                              setSelectedFilters((prevFilters: any) => ({
                                ...prevFilters,
                                // min_price: value[0],
                                max_price: value,
                              }));
                              dispatch(
                                setSelectedSettingFilters({
                                  ...selectedSettingFilters,
                                  max_price: value,
                                }),
                              );
                              handleFilterChange('price', [
                                settingFilters?.price_range?.min_price,
                                value ?? settingFilters?.price_range?.max_price ?? 0,
                              ]);
                            }}
                          />
                        </div>
                      </div>
                      {settingFilters?.price_range && Object.keys(settingFilters?.price_range)?.length !== 0 && (
                        <Slider
                          range
                          defaultValue={[settingFilters?.price_range?.min_price, settingFilters?.price_range?.max_price]}
                          value={[selectedFilters.min_price, selectedFilters.max_price]}
                          onChange={(value: any) => {
                            setSelectedFilters((prevFilters: any) => ({
                              ...prevFilters,
                              min_price: value[0],
                              max_price: value[1],
                            }));
                            dispatch(
                              setSelectedSettingFilters({
                                ...selectedSettingFilters,
                                min_price: value[0],
                                max_price: value[1],
                              }),
                            );
                          }}
                          min={settingFilters?.price_range?.min_price || 0}
                          max={settingFilters?.price_range?.max_price || 0}
                          onChangeComplete={(value: any) => handleFilterChange('price', value)}
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-3 border-b border-line py-[22px]">
                    <Text size="textxl" as="p" className="!m-0 font-cormorant !text-[22px] !font-medium !text-ink">
                      METAL
                    </Text>
                    {/* <div className="grid grid-cols-7 gap-2 items-start justify-between self-stretch">
                      {settingFilters.metal_color_id &&
                        masterData
                          ?.filter((item: any) => settingFilters.metal_color_id.includes(item?.id))
                          .map((metal: any, index: number) => (
                            <Tooltip title={metal?.name} key={index}>
                              <div
                                className={`flex flex-col select-none items-center gap-2 aspect-square cursor-pointer sm:px-4 border-b ${
                                  selectedFilters?.metal?.includes(metal?.id as any) ? ' border-primary' : ' border-transparent'
                                }`}
                                onClick={(event) => {
                                  event.persist();
                                  handleFilterChange('metal', metal?.id);
                                }}
                              >
                                <Image
                                  fallback="/images/img_asset_1.png" // silver image for default
                                  src={metal?.image?.[0]}
                                  width={30}
                                  height={30}
                                  preview={false}
                                  alt="10k Rose Gold"
                                  className=" h-[30px] w-[30px] object-cover"
                                />
                              
                              </div>
                            </Tooltip>
                          ))}
                    </div> */}
                    <div className="relative w-full">
                      <div className="w-[90%] mx-auto">
                        <Swiper
                          modules={[Virtual, Navigation, Pagination]}
                          onSwiper={(swiper) => {
                            setSwiperMetalRef(swiper);
                          }}
                          onSlideChange={(swiper) => {
                            setIsBeginning(swiper.isBeginning);
                            setIsEnd(swiper.isEnd);
                          }}
                          slidesPerView={3}
                          spaceBetween={2}
                          pagination={{
                            type: 'fraction',
                          }}
                          // navigation={true}
                          navigation={{
                            prevEl: prevMetalRef.current,
                            nextEl: nextMetalRef.current,
                          }}
                          virtual
                          className="subtype-swiper !px-0"
                        >
                          {settingFilters.metal_color_id &&
                            masterData
                              ?.filter((item: any) => settingFilters.metal_color_id?.includes(item?.id))
                              .map((metal: any, index: number) => {
                                // const shapeData = masterData.find((el: any) => el.id === shapeId);
                                return (
                                  <SwiperSlide key={`${metal?.id}-${index}`} virtualIndex={index}>
                                    <div
                                      className={`relative mx-1.5 flex w-[72px] cursor-pointer flex-col items-center justify-center !overflow-hidden border bg-paper py-1.5 transition-colors ${
                                        selectedFilters?.metal?.includes(metal?.id as any)
                                          ? 'border-ink opacity-100'
                                          : 'border-line opacity-80 hover:border-ink-soft'
                                      }`}
                                      onClick={() => {
                                        handleFilterChange('metal', metal?.id);
                                      }}
                                    >
                                      <Tooltip title={metal?.name}>
                                        <div className="w-[35px] items-center aspect-square flex justify-center">
                                          <Image
                                            preview={false}
                                            className="object-contain"
                                            height={30}
                                            fallback="/images/no_images.svg"
                                            src={metal?.image?.[0]}
                                            alt={metal?.name}
                                          />
                                        </div>
                                      </Tooltip>
                                      <div className="text-[9px] sm:text-[8px] absolute left-[-36%] top-[8%] w-full -rotate-45 bg-ink/75 text-center tracking-[0.06em] text-paper">
                                        {metal?.code !== 'SILVER_925' ? metal?.code : '925'}
                                      </div>
                                    </div>
                                  </SwiperSlide>
                                );
                              })}
                        </Swiper>
                      </div>
                      <div className="absolute top-5 w-full flex justify-between items-center">
                        <button
                          ref={prevMetalRef}
                          className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 py-1.5 px-0 ${isBeginning ? 'opacity-30' : ''}`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="h-5 w-5 text-ink"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                          </svg>
                        </button>
                        <button
                          ref={nextMetalRef}
                          className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 py-1.5 px-0 ${isEnd ? 'opacity-30' : ''}`}
                          // onClick={() => console.log(swiperRef.activeIndex, swiperRef?.visibleSlidesIndexes)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="h-5 w-5 text-ink"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-stretch gap-3 py-[22px]">
                    <Button
                      className="!h-12 !rounded-none !border !border-ink !bg-transparent !px-8 !text-[11px] uppercase !tracking-[0.2em] !text-ink hover:!bg-ink hover:!text-paper"
                      onClick={() => {
                        handleMenuToggle();
                        replaceUrl(`/custom-jewelry?type=${type}&state=${state}${dId ? `&did=${dId}` : ''}`);
                        setSelectedJewelryType(settingFilters?.jewelry_types?.[0]?.name?.toLowerCase()?.replace(' ', '-'));
                        setSelectedFilters({
                          ...selectedFilters,
                          jewelryType: settingFilters?.jewelry_types?.[0]?.name?.toLowerCase()?.replace(' ', '-'),
                          subTypes: [],
                          metal: [],
                          shape: [],
                          min_price: settingFilters?.price_range?.min_price,
                          max_price: settingFilters?.price_range?.max_price,
                        });
                        dispatch(
                          setSelectedSettingFilters({
                            ...selectedSettingFilters,
                            jewelryType: settingFilters?.jewelry_types?.[0]?.name?.toLowerCase()?.replace(' ', '-'),
                            subTypes: [],
                            metal: [],
                            shape: [],
                            min_price: settingFilters?.price_range?.min_price,
                            max_price: settingFilters?.price_range?.max_price,
                          }),
                        );
                        dispatch(
                          fetchSettings({
                            data: {
                              ...selectedFilters,
                              jewelryType: selectedJewelryType,
                              subTypes: [],
                              metal: [],
                              shape: [],
                              min_price: settingFilters?.price_range?.min_price,
                              max_price: settingFilters?.price_range?.max_price,
                            },
                            page: 1,
                            size: settingPageSize,
                          }),
                        );
                      }}
                    >
                      RESET ALL
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mx-auto flex w-full max-w-[1440px] flex-col px-[clamp(16px,3.2vw,56px)] sm:hidden">
            <div className="flex flex-wrap items-center justify-end gap-5 py-4">
              <Button
                type="link"
                className="!h-auto !p-0 !text-[11px] uppercase !tracking-[0.12em] !text-ink-soft underline underline-offset-4 hover:!text-ink"
                onClick={() => {
                  replaceUrl(`/custom-jewelry?type=${type}&state=${state}${dId ? `&did=${dId}` : ''}`);
                  setSelectedJewelryType(settingFilters?.jewelry_types?.[0]?.name?.toLowerCase()?.replace(' ', '-'));
                  setSelectedFilters({
                    ...selectedFilters,
                    jewelryType: settingFilters?.jewelry_types?.[0]?.name?.toLowerCase()?.replace(' ', '-'),
                    subTypes: [],
                    metal: [],
                    shape: [],
                    min_price: settingFilters?.price_range?.min_price,
                    max_price: settingFilters?.price_range?.max_price,
                  });
                  dispatch(
                    setSelectedSettingFilters({
                      ...selectedSettingFilters,
                      jewelryType: settingFilters?.jewelry_types?.[0]?.name?.toLowerCase()?.replace(' ', '-'),
                      subTypes: [],
                      metal: [],
                      shape: [],
                      min_price: settingFilters?.price_range?.min_price,
                      max_price: settingFilters?.price_range?.max_price,
                    }),
                  );
                  dispatch(
                    fetchSettings({
                      data: {
                        ...selectedFilters,
                        jewelryType: selectedJewelryType,
                        subTypes: [],
                        metal: [],
                        shape: [],
                        min_price: settingFilters?.price_range?.min_price,
                        max_price: settingFilters?.price_range?.max_price,
                      },
                      page: 1,
                      size: settingPageSize,
                    }),
                  );
                }}
              >
                RESET ALL
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfigProvider>
  );
}
