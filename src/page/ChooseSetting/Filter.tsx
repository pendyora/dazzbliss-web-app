/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unsafe-optional-chaining */
/* eslint-disable @typescript-eslint/ban-ts-comment */
'use client';
import React, { useEffect, useRef, useState } from 'react';

import { Button, Image, InputNumber, Slider, Tooltip } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import { LuLoader } from 'react-icons/lu';
import { RxCross2 } from 'react-icons/rx';
import { Virtual, Navigation, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchDiamondFiltersThunk,
  fetchDiamonds,
  setDiamondPageNumber,
  setDiamondPageSize,
  setSelectedDiamondFilters,
} from '@/store/slices/customProducts/customProductSlice';
import { carryForwardFilterCrumb, PLP_FILTER_CRUMB_PARAMS } from '@/utils/breadcrumbFilterParams';

import { Text, Img } from '../../components';
export function debounce(func: any, wait: number) {
  let timeout: NodeJS.Timeout;
  return function (...args: any[]) {
    clearTimeout(timeout);
    timeout = setTimeout(
      () =>
        func.apply(
          // @ts-ignore
          this,
          args,
        ),
      wait,
    );
  };
}

export default function CustomJewelryDiamondFilter({ isLoading, setIsLoading }: { isLoading: boolean; setIsLoading: any }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Every URL below is rebuilt from scratch out of the filter params, which would drop the
  // breadcrumb's PLP filter crumb the shopper arrived with (`filterLabel`/`filterHref`) on the
  // first filter change. Re-attach it on each navigation. The diamond crumb is deliberately NOT
  // carried: it describes the very filter set being replaced here, so keeping it would leave the
  // breadcrumb showing the previously applied diamond filters — it's re-set from the fresh
  // params when a diamond is picked (see CustomJewelryDiamondListTable).
  const replaceUrl = (url: string, options?: { scroll?: boolean }) =>
    router.replace(carryForwardFilterCrumb(url, searchParams, [PLP_FILTER_CRUMB_PARAMS]), options);
  const type = searchParams.get('type');
  const state = searchParams.get('state');
  const sId = searchParams.get('id') ? decodeURIComponent(searchParams.get('id') as string) : null;
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const colors = searchParams.get('colors');
  const clarity = searchParams.get('clarity');
  const cut = searchParams.get('cut');
  const carat = searchParams.get('carat');
  const shapes = searchParams.get('shapes');
  const diamondFilters = useAppSelector((state) => state.customProduct.diamondFilters);
  const { data } = useAppSelector((state) => state.master);
  const {
    selectedCaratsData,
    selectedShapesData,
    customCarats,
    customShapes,
    diamondPageNumber,
    diamondPageSize,
    selectedDiamondFilters,
    isSelectedDiamondFilter,
    selectedSettingSkuData,
  } = useAppSelector((state) => state.customProduct);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [swiperRef, setSwiperRef] = useState<any>(null);
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);

  const debouncedFetchDiamonds = (payload: any) =>
    debounce(() => {
      dispatch(fetchDiamonds(payload));
    }, 300);
  const handleFilterChange = (filterType: string, value: any) => {
    dispatch(setDiamondPageNumber(1));
    if (filterType == 'colors' || filterType == 'clarity' || filterType == 'cut') {
      if (filterType == 'colors') {
        replaceUrl(
          `custom-jewelry?type=${type}&state=${state}${sId ? `&id=${sId}` : ''}${minPrice ? `&minPrice=${minPrice}` : ''}${
            maxPrice ? `&maxPrice=${maxPrice}` : ''
          }${carat ? `&carat=${carat}` : ''}${shapes ? `&shapes=${shapes}` : ''}${
            value?.[1] ? `&colors=${diamondFilters?.['colors']?.[value[0]]}-${diamondFilters?.['colors']?.[value[1]]}` : ''
          }${clarity ? `&clarity=${clarity}` : ''}${cut ? `&cut=${cut}` : ''}`,
          { scroll: false },
        );
      }
      if (filterType == 'clarity') {
        replaceUrl(
          `custom-jewelry?type=${type}&state=${state}${sId ? `&id=${sId}` : ''}${minPrice ? `&minPrice=${minPrice}` : ''}${
            maxPrice ? `&maxPrice=${maxPrice}` : ''
          }${shapes ? `&shapes=${shapes}` : ''}${carat ? `&carat=${carat}` : ''}${colors ? `&colors=${colors}` : ''}${
            value?.[1] ? `&clarity=${diamondFilters?.['clarity']?.[value[0]]}-${diamondFilters?.['clarity']?.[value[1]]}` : ''
          }${cut ? `&cut=${cut}` : ''}`,
          { scroll: false },
        );
      }
      if (filterType == 'cut') {
        replaceUrl(
          `custom-jewelry?type=${type}&state=${state}${sId ? `&id=${sId}` : ''}${minPrice ? `&minPrice=${minPrice}` : ''}${
            maxPrice ? `&maxPrice=${maxPrice}` : ''
          }${shapes ? `&shapes=${shapes}` : ''}${carat ? `&carat=${carat}` : ''}${colors ? `&colors=${colors}` : ''}${
            clarity ? `&clarity=${clarity}` : ''
          }${value?.[1] ? `&cut=${diamondFilters?.['cut']?.[value[0]]}-${diamondFilters?.['cut']?.[value[1]]}` : ''}`,
          { scroll: false },
        );
      }
      debouncedFetchDiamonds({
        data: {
          ...selectedDiamondFilters,
          [filterType]: diamondFilters?.[filterType]?.slice(value[0], value[1] + 1),
        },
        pageData: { page: 1, size: diamondPageSize },
      }).call(debounce);
    } else if (filterType == 'price') {
      // setSelectedFilters((prevFilters: any) => ({
      //   ...prevFilters,
      //   minAmount: value[0],
      //   maxAmount: value[1],
      // }));
      replaceUrl(
        `custom-jewelry?type=${type}&state=${state}${sId ? `&id=${sId}` : ''}${
          value[0] ? `&minPrice=${value[0]}` : ''
        }${value[1] ? `&maxPrice=${value[1]}` : ''}${
          shapes ? `&shapes=${shapes}` : ''
        }${carat ? `&carat=${carat}` : ''}${colors ? `&colors=${colors}` : ''}${clarity ? `&clarity=${clarity}` : ''}${cut ? `&cut=${cut}` : ''}`,
        { scroll: false },
      );
      debouncedFetchDiamonds({
        data: {
          ...selectedDiamondFilters,
          minAmount: value[0],
          maxAmount: value[1],
        },
        pageData: { page: 1, size: diamondPageSize },
      }).call(debounce);
    } else if (filterType == 'carat') {
      replaceUrl(
        `custom-jewelry?type=${type}&state=${state}${sId ? `&id=${sId}` : ''}${
          minPrice ? `&minPrice=${minPrice}` : ''
        }${maxPrice ? `&maxPrice=${maxPrice}` : ''}${shapes ? `&shapes=${shapes}` : ''}${value?.[1] ? `&carat=${value[0]}-${value[1]}` : ''}${
          clarity ? `&clarity=${clarity}` : ''
        }${cut ? `&cut=${cut}` : ''}`,
        { scroll: false },
      );
      // setSelectedFilters((prevFilters: any) => ({
      //   ...prevFilters,
      //   minCarat: value[0],
      //   maxCarat: value[1],
      // }));
      dispatch(
        setSelectedDiamondFilters({
          minCarat: value[0],
          maxCarat: value[1],
        }),
      );
      debouncedFetchDiamonds({
        data: {
          ...selectedDiamondFilters,
          minCarat: value[0],
          maxCarat: value[1],
        },
        pageData: { page: 1, size: diamondPageSize },
      }).call(debounce);
    } else if (filterType == 'shapes') {
      const updateFilter = { ...selectedDiamondFilters };
      const updatedShape: any = [...updateFilter?.shapes];
      const shapeIndex = updateFilter.shapes.findIndex((el: any) => el == value);

      if (shapeIndex == -1) {
        updatedShape.splice(shapeIndex, 1, value);
      }
      // if want to multiply shape then use this
      // else {
      //   updatedShape.push(value);
      // }

      // setSelectedFilters({
      //   ...updateFilter,
      //   shapes: updatedShape,
      // });
      dispatch(
        setSelectedDiamondFilters({
          shapes: updatedShape,
        }),
      );

      replaceUrl(
        `custom-jewelry?type=${type}&state=${state}${sId ? `&id=${sId}` : ''}${
          minPrice ? `&minPrice=${minPrice}` : ''
        }${maxPrice ? `&maxPrice=${maxPrice}` : ''}${carat ? `&carat=${carat}` : ''}${
          updatedShape?.length > 0 ? `&shapes=${updatedShape?.toString()}` : ''
        }${clarity ? `&clarity=${clarity}` : ''}${cut ? `&cut=${cut}` : ''}`,
        { scroll: false },
      );
      debouncedFetchDiamonds({
        data: {
          ...updateFilter,
          shapes: updatedShape,
        },
        pageData: { page: 1, size: diamondPageSize },
      }).call(debounce);
    }
    //  else {
    //   setSelectedFilters((prevFilters: any) => ({
    //     ...prevFilters,
    //     [filterType]: value,
    //   }));
    // }
  };
  const clarityLevels = diamondFilters?.clarity?.map((level: string, index: number) => ({
    label: level,
    value: index,
  }));
  const colorLevels = diamondFilters?.colors?.map((color: string, index: number) => ({
    label: color,
    value: index,
  }));
  // const caratLevels = data
  //   .filter((el) => el?.parent_code === 'CARAT_SIZE' && el.is_web_visible === true)
  //   .sort((a, b) => a.sorting_sequence - b.sorting_sequence)
  //   ?.map((carat: any) => ({
  //     label: carat.name as string,
  //     value: parseFloat(carat.name) as number,
  //   }));
  const cutLevels = diamondFilters?.cut?.map((cut: string, index: number) => ({
    label: cut,
    value: index,
  }));

  const handleMenuToggle = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  // Restrict carat/number inputs to digits and a single decimal point with at
  // most 2 decimal places. antd's InputNumber is a text field that only strips
  // invalid chars / applies precision on blur, so letters (incl. "e"), signs
  // and extra decimals can appear while typing without this guard.
  const blockNonNumericKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (allowedKeys.includes(event.key) || event.ctrlKey || event.metaKey) {
      return;
    }
    // Only digits and a single decimal point are allowed at all.
    if (event.key !== '.' && !/^[0-9]$/.test(event.key)) {
      event.preventDefault();
      return;
    }

    const input = event.currentTarget;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    const nextValue = input.value.slice(0, start) + event.key + input.value.slice(end);
    if (!/^\d*\.?\d{0,2}$/.test(nextValue)) {
      event.preventDefault();
    }
  };

  useEffect(() => {
    const payload = {
      shape_id: selectedSettingSkuData && customShapes && customCarats ? customShapes : null,
      carat_id: selectedSettingSkuData && customShapes && customCarats ? customCarats : null,
    };
    if (selectedDiamondFilters.colors.length == 0) {
      if (Object.keys(diamondFilters)?.length === 0 || customShapes) {
        dispatch(fetchDiamondFiltersThunk(payload));
      }
    }
  }, [customShapes, customCarats, selectedSettingSkuData]);

  useEffect(() => {
    if (Object.keys(diamondFilters)?.length !== 0) {
      const TypeArray = (type: string, arr: string) => {
        return diamondFilters?.[type]?.slice(
          diamondFilters?.[type].findIndex((el: string) => el == arr?.split('-')?.[0]),
          diamondFilters?.[type].findIndex((el: string) => el == arr?.split('-')?.[1]) + 1,
        );
      };

      if (!isSelectedDiamondFilter) {
        dispatch(
          setSelectedDiamondFilters({
            clarity: clarity ? TypeArray('clarity', clarity) : diamondFilters?.clarity,
            colors: colors ? TypeArray('colors', colors) : diamondFilters?.colors,
            cut: cut ? TypeArray('cut', cut) : diamondFilters?.cut,
            minCarat: carat
              ? carat?.split('-')?.[0]
              : selectedCaratsData
                ? Number(data?.find((item: any) => item.id === selectedCaratsData?.[0])?.name)
                : diamondFilters?.minCarat,
            maxCarat: carat
              ? carat?.split('-')?.[1]
              : selectedCaratsData
                ? Number(data?.find((item: any) => item.id === selectedCaratsData?.[1])?.name)
                : diamondFilters?.maxCarat,
            minAmount: minPrice ? Number(minPrice) : diamondFilters?.minAmount,
            maxAmount: maxPrice ? Number(maxPrice) : diamondFilters?.maxAmount,
            shapes: shapes
              ? shapes?.split(',')
              : selectedShapesData
                ? [data?.find((item: any) => item.id === selectedShapesData)?.code]
                : [diamondFilters?.shapes?.[0]],
          }),
        );

        dispatch(
          fetchDiamonds({
            data: {
              ...selectedDiamondFilters,
              clarity: clarity ? TypeArray('clarity', clarity) : diamondFilters?.clarity,
              colors: colors ? TypeArray('colors', colors) : diamondFilters?.colors,
              cut: cut ? TypeArray('cut', cut) : diamondFilters?.cut,
              minCarat: carat
                ? carat?.split('-')?.[0]
                : selectedCaratsData
                  ? Number(data?.find((item: any) => item.id === selectedCaratsData?.[0])?.name)
                  : diamondFilters?.minCarat,
              maxCarat: carat
                ? carat?.split('-')?.[1]
                : selectedCaratsData
                  ? Number(data?.find((item: any) => item.id === selectedCaratsData?.[1])?.name)
                  : diamondFilters?.maxCarat,
              minAmount: minPrice ? Number(minPrice) : diamondFilters?.minAmount,
              maxAmount: maxPrice ? Number(maxPrice) : diamondFilters?.maxAmount,
              shapes: shapes
                ? shapes?.split(',')
                : selectedShapesData
                  ? [data?.find((item: any) => item.id === selectedShapesData)?.code]
                  : [diamondFilters?.shapes?.[0]],
            },
            pageData: { page: diamondPageNumber, size: diamondPageSize },
          }),
        );
      } else {
        dispatch(
          setSelectedDiamondFilters({
            ...selectedDiamondFilters,
            shapes: shapes
              ? shapes?.split(',')
              : selectedShapesData
                ? [data?.find((item: any) => item.id === selectedShapesData)?.code]
                : [diamondFilters?.shapes?.[0]],
          }),
        );
        dispatch(
          fetchDiamonds({
            data: {
              ...selectedDiamondFilters,
              clarity: clarity ? TypeArray('clarity', clarity) : selectedDiamondFilters?.clarity,
              colors: colors ? TypeArray('colors', colors) : selectedDiamondFilters?.colors,
              cut: cut ? TypeArray('cut', cut) : selectedDiamondFilters?.cut,
              minCarat: carat
                ? carat?.split('-')?.[0]
                : selectedCaratsData
                  ? Number(data?.find((item: any) => item.id === selectedCaratsData?.[0])?.name)
                  : selectedDiamondFilters?.minCarat,
              maxCarat: carat
                ? carat?.split('-')?.[1]
                : selectedCaratsData
                  ? Number(data?.find((item: any) => item.id === selectedCaratsData?.[1])?.name)
                  : selectedDiamondFilters?.maxCarat,
              minAmount: minPrice ? Number(minPrice) : selectedDiamondFilters?.minAmount,
              maxAmount: maxPrice ? Number(maxPrice) : selectedDiamondFilters?.maxAmount,
              shapes: shapes
                ? shapes?.split(',')
                : selectedShapesData
                  ? [data?.find((item: any) => item.id === selectedShapesData)?.code]
                  : [selectedDiamondFilters?.shapes?.[0]],
            },
            pageData: { page: diamondPageNumber, size: diamondPageSize },
          }),
        );
      }

      setIsLoading(false);
    }
  }, [diamondFilters, diamondPageNumber, diamondPageSize, selectedShapesData, isSelectedDiamondFilter]);

  useEffect(() => {
    // if (Object.keys(diamondFilters).length !== 0) {
    // }
  }, [selectedDiamondFilters]);

  return (
    <>
      {isLoading ? (
        <div className="flex flex-col items-center gap-[60px] min-h-[50vh] justify-center">
          {/* <Spin /> */}
          <div className="w-full flex justify-center items-center">
            <LuLoader className="h-10 w-10 animate-spin" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col justify-center">
          <div className="container-xs flex flex-col gap-4  2xl:px-[50px] xl:px-[50px] lg:px-[30px]  md:px-5 sm:px-3">
            <div className="flex w-full justify-center gap-8 lg:gap-5 2xl:gap-8 xl:gap-5 md:grid md:grid-cols-2 md:gap-x-8">
              <div className="flex w-1/3 md:w-full md:col-span-2 md:grid-cols-2 md:grid md:gap-8 flex-col gap-5 lg:gap-5 sm:w-full">
                <div className="flex flex-col items-start gap-2 sm:hidden">
                  <p className="text-[15px]">PRICE RANGE</p>
                  <div className="flex flex-col-reverse self-stretch">
                    <div className="flex flex-wrap justify-between gap-5">
                      <div className="flex items-center gap-1">
                        <p>{diamondFilters?.currency_symbol}</p>
                        <InputNumber
                          size="small"
                          min={diamondFilters?.minAmount}
                          max={selectedDiamondFilters?.maxAmount}
                          style={{ color: 'black' }}
                          // prefix="$"
                          value={selectedDiamondFilters?.minAmount}
                          onChange={(value: any) => {
                            // setSelectedFilters((prevFilters: any) => ({
                            //   ...prevFilters,
                            //   minAmount: value,
                            //   // maxAmount: value[1],
                            // }));
                            dispatch(
                              setSelectedDiamondFilters({
                                minAmount: value,
                              }),
                            );
                            handleFilterChange('price', [value ?? diamondFilters?.minAmount ?? 0, selectedDiamondFilters?.maxAmount]);
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <p>{diamondFilters?.currency_symbol}</p>

                        <InputNumber
                          size="small"
                          min={selectedDiamondFilters?.minAmount}
                          max={diamondFilters?.maxAmount}
                          style={{ color: 'black' }}
                          // prefix="$"
                          value={selectedDiamondFilters?.maxAmount}
                          onChange={(value: any) => {
                            // setSelectedFilters((prevFilters: any) => ({
                            //   ...prevFilters,
                            //   // minAmount: value,
                            //   maxAmount: value,
                            // }));
                            dispatch(
                              setSelectedDiamondFilters({
                                maxAmount: value,
                              }),
                            );
                            handleFilterChange('price', [selectedDiamondFilters?.minAmount, value ?? diamondFilters?.maxAmount ?? 0]);
                          }}
                        />
                      </div>
                    </div>
                    {Object.keys(selectedDiamondFilters).length !== 0 && (
                      <Slider
                        range
                        defaultValue={[diamondFilters?.minAmount, diamondFilters?.maxAmount]}
                        value={[selectedDiamondFilters.minAmount, selectedDiamondFilters.maxAmount]}
                        onChange={(value: any) => {
                          // setSelectedFilters((prevFilters: any) => ({
                          //   ...prevFilters,
                          //   minAmount: value[0],
                          //   maxAmount: value[1],
                          // }));
                          dispatch(
                            setSelectedDiamondFilters({
                              minAmount: value[0],
                              maxAmount: value[1],
                            }),
                          );
                        }}
                        min={diamondFilters?.minAmount || 0}
                        max={diamondFilters?.maxAmount || 0}
                        onChangeComplete={(value: any) => handleFilterChange('price', value)}
                      />
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-start gap-2 lg:gap-2 md:gap-2 sm:gap-4 sm:col-span-2">
                  <div className="flex justify-between w-full items-center">
                    <p className="text-[15px]">SHAPE</p>
                    <div
                      className="bg-secondary hidden sm:flex sm:min-w-[96px] text-text_w px-[11px] py-[4.5px]  items-center justify-between gap-1"
                      onClick={handleMenuToggle}
                    >
                      <p className="text-text_w capitalize tracking-[1px] text-[14px] flex gap-2">Filter</p>
                      <div>
                        <Img width={14} height={14} className="h-5 w-5 p-0" src="filter_icon.svg" />
                      </div>
                    </div>
                  </div>
                  <div className="flex sm:hidden sm:grid-cols-7 sm:gap-3 gap-[8px] xl:gap-[8px] lg:gap-[8px] md:gap-2 self-stretch flex-wrap overflow-auto">
                    {data
                      ?.filter((shapeData: any) => {
                        if (!customShapes) {
                          return diamondFilters?.shapes?.includes(shapeData.code);
                        }
                        return customShapes?.includes(shapeData.id);
                      })
                      ?.sort((a: any, b: any) => {
                        const order = diamondFilters?.shapes ?? [];
                        const ai = order.indexOf(a.code);
                        const bi = order.indexOf(b.code);
                        if (ai === -1 && bi === -1) {
                          return 0;
                        }
                        if (ai === -1) {
                          return 1;
                        }
                        if (bi === -1) {
                          return -1;
                        }
                        return ai - bi;
                      })
                      ?.map((shape: any) => shape.code)
                      ?.map((shape: any, index: number) => (
                        <div
                          key={index}
                          className={`flex flex-col items-center justify-center cursor-pointer border-b border-black pb-1.5 ${
                            selectedDiamondFilters?.shapes?.includes(shape) ? 'opacity-100 border-b' : 'opacity-60 border-transparent'
                          }`}
                          onClick={(event) => {
                            event.persist();
                            if (selectedDiamondFilters.shapes?.[0] !== shape) {
                              handleFilterChange('shapes', shape);
                            }
                          }}
                        >
                          <Tooltip title={data.find((el) => el.code == shape)?.name}>
                            <div className="w-[35px] items-center aspect-square flex justify-center">
                              <Image
                                preview={false}
                                height={30}
                                fallback="/images/no_images.svg"
                                src={data.find((el) => el.code == shape)?.image?.[0]}
                                alt={data.find((el) => el.code == shape)?.name}
                                // className=""
                              />
                            </div>
                          </Tooltip>
                        </div>
                      ))}
                  </div>
                  {/* // In Filter.tsx, replace the existing shapes mapping code with this: */}
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
                        spaceBetween={2}
                        pagination={{
                          type: 'fraction',
                        }}
                        navigation={{
                          prevEl: prevRef.current,
                          nextEl: nextRef.current,
                        }}
                        virtual
                        className="subtype-swiper !px-0"
                      >
                        {diamondFilters?.shapes?.map((shape: any, index: number) => (
                          <SwiperSlide key={`${shape}-${index}`} virtualIndex={index}>
                            <div
                              className={`flex flex-col items-center justify-center cursor-pointer pb-1 mx-2 border-b ${
                                selectedDiamondFilters?.shapes?.includes(shape) ? 'opacity-100 border-primary' : 'opacity-70 border-transparent'
                              }`}
                              onClick={(event) => {
                                event.persist();
                                handleFilterChange('shapes', shape);
                              }}
                            >
                              <Tooltip title={data.find((el) => el.code == shape)?.name}>
                                <div className="w-[35px] items-center aspect-square flex justify-center">
                                  <Image
                                    preview={false}
                                    className="object-contain"
                                    height={30}
                                    fallback="/images/no_images.svg"
                                    src={data.find((el) => el.code == shape)?.image?.[0]}
                                    alt={data.find((el) => el.code == shape)?.name}
                                  />
                                </div>
                              </Tooltip>
                            </div>
                          </SwiperSlide>
                        ))}
                      </Swiper>
                    </div>
                    <div className="absolute top-5 w-full flex justify-between items-center ">
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
                          className="w-6 h-6"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                      </button>
                      <button ref={nextRef} className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 py-1.5 px-0 ${isEnd ? 'opacity-30' : ''}`}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-6 h-6"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {/* drawer */}
              <div
                className={`hidden sm:block fixed top-0 left-0 inset-0 bg-gray-800 bg-opacity-75 z-[1052] transition-all duration-500 ease-in-out ${
                  isFilterOpen ? '-translate-y-0' : 'translate-y-full'
                }`}
                style={{ width: '100%', height: '100vh' }}
              >
                <div className="relative modal-content bg-white h-full py-5 overflow-hidden">
                  <div className="flex justify-between items-center w-full px-5">
                    <Text size="text5xl" as="p" className="uppercase !text-[18px]">
                      Filter By
                    </Text>
                    <div>
                      <RxCross2 className="h-5 w-5" onClick={handleMenuToggle} />
                    </div>
                  </div>
                  <div className="w-full overflow-auto px-5 mt-[20px] max-w-[100vw]" style={{ width: '100%' }}>
                    <div className="h-full flex flex-col gap-3">
                      <div className="flex flex-col items-start gap-2">
                        <Text size="textxl" as="p" className="!text-[14px]">
                          PRICE RANGE
                        </Text>
                        <div className="flex px-2 flex-col gap-0 self-stretch">
                          <div className="flex flex-wrap justify-between gap-5">
                            <div className="flex items-center gap-1">
                              <p>{diamondFilters?.currency_symbol}</p>
                              <InputNumber
                                size="small"
                                min={diamondFilters?.minAmount}
                                max={selectedDiamondFilters?.maxAmount}
                                style={{ color: 'black' }}
                                // prefix="$"
                                inputMode="numeric"
                                value={selectedDiamondFilters?.minAmount}
                                onChange={(value: any) => {
                                  // setSelectedFilters((prevFilters: any) => ({
                                  //   ...prevFilters,
                                  //   minAmount: value,
                                  //   // maxAmount: value[1],
                                  // }));
                                  dispatch(
                                    setSelectedDiamondFilters({
                                      minAmount: value,
                                    }),
                                  );
                                  handleFilterChange('price', [value ?? diamondFilters?.minAmount ?? 0, selectedDiamondFilters?.maxAmount]);
                                }}
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <p>{diamondFilters?.currency_symbol}</p>

                              <InputNumber
                                size="small"
                                min={selectedDiamondFilters?.minAmount}
                                max={diamondFilters?.maxAmount}
                                style={{ color: 'black' }}
                                // prefix="$"
                                inputMode="numeric"
                                value={selectedDiamondFilters?.maxAmount}
                                onChange={(value: any) => {
                                  // setSelectedFilters((prevFilters: any) => ({
                                  //   ...prevFilters,
                                  //   // minAmount: value,
                                  //   maxAmount: value,
                                  // }));
                                  dispatch(
                                    setSelectedDiamondFilters({
                                      maxAmount: value,
                                    }),
                                  );

                                  handleFilterChange('price', [selectedDiamondFilters?.minAmount, value ?? diamondFilters?.maxAmount ?? 0]);
                                }}
                              />
                            </div>
                          </div>
                          {Object.keys(selectedDiamondFilters).length !== 0 && (
                            <Slider
                              range
                              defaultValue={[diamondFilters?.minAmount, diamondFilters?.maxAmount]}
                              value={[selectedDiamondFilters.minAmount, selectedDiamondFilters.maxAmount]}
                              onChange={(value: any) => {
                                // setSelectedFilters((prevFilters: any) => ({
                                //   ...prevFilters,
                                //   minAmount: value[0],
                                //   maxAmount: value[1],
                                // }));
                                dispatch(
                                  setSelectedDiamondFilters({
                                    minAmount: value[0],
                                    maxAmount: value[1],
                                  }),
                                );
                              }}
                              min={diamondFilters?.minAmount || 0}
                              max={diamondFilters?.maxAmount || 0}
                              onChangeComplete={(value: any) => handleFilterChange('price', value)}
                            />
                          )}
                        </div>
                      </div>
                      <div className="flex   flex-col items-start gap-2">
                        <Text size="textxl" as="p" className="tracking-[1.0px] !text-[14px]">
                          CARATS
                        </Text>
                        <div className="flex px-2 flex-col gap-0 self-stretch">
                          <div className="flex flex-wrap justify-between gap-5">
                            <div className="flex items-center gap-1">
                              <InputNumber
                                size="small"
                                min={diamondFilters?.minCarat}
                                max={selectedDiamondFilters?.maxCarat}
                                style={{ color: 'black' }}
                                step={0.05}
                                precision={2} // prefix="$"
                                inputMode="decimal"
                                onKeyDown={blockNonNumericKeys}
                                value={selectedDiamondFilters?.minCarat}
                                onChange={(value: any) => {
                                  // setSelectedFilters((prevFilters: any) => ({
                                  //   ...prevFilters,
                                  //   minCarat: value,
                                  //   // maxCarat: value[1],
                                  // }));
                                  dispatch(
                                    setSelectedDiamondFilters({
                                      minCarat: value,
                                    }),
                                  );

                                  handleFilterChange('carat', [value ?? diamondFilters?.minCarat ?? 0, selectedDiamondFilters?.maxCarat]);
                                }}
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <InputNumber
                                size="small"
                                min={selectedDiamondFilters?.minCarat}
                                max={diamondFilters?.maxCarat}
                                style={{ color: 'black' }}
                                // prefix="$"
                                step={0.05}
                                precision={2}
                                inputMode="decimal"
                                onKeyDown={blockNonNumericKeys}
                                value={selectedDiamondFilters?.maxCarat}
                                onChange={(value: any) => {
                                  // setSelectedFilters((prevFilters: any) => ({
                                  //   ...prevFilters,
                                  //   // minCarat: value,
                                  //   maxCarat: value,
                                  // }));
                                  dispatch(
                                    setSelectedDiamondFilters({
                                      maxCarat: value,
                                    }),
                                  );

                                  handleFilterChange('carat', [selectedDiamondFilters?.minCarat, value ?? diamondFilters?.maxCarat ?? 0]);
                                }}
                              />
                            </div>
                          </div>
                          <Slider
                            // included={false}
                            range
                            defaultValue={[diamondFilters?.minCarat, diamondFilters?.maxCarat]}
                            value={[selectedDiamondFilters.minCarat, selectedDiamondFilters.maxCarat]}
                            onChange={(value: any) => {
                              // setSelectedFilters((prevFilters: any) => ({
                              //   ...prevFilters,
                              //   minCarat: value[0],
                              //   maxCarat: value[1],
                              // }));
                              dispatch(
                                setSelectedDiamondFilters({
                                  minCarat: value[0],
                                  maxCarat: value[1],
                                }),
                              );
                            }}
                            step={0.01}
                            min={diamondFilters?.minCarat || 0}
                            max={diamondFilters?.maxCarat || 0}
                            onChangeComplete={(value: any) => handleFilterChange('carat', value)}
                          />
                        </div>
                      </div>
                      <div className="flex   flex-col items-start gap-2">
                        <Text size="textxl" as="p" className="tracking-[1.0px] !text-[14px]">
                          COLOR
                        </Text>
                        <div className="flex px-2 flex-col gap-0 self-stretch">
                          {Object?.keys(diamondFilters)?.length !== 0 && (
                            <Slider
                              range
                              defaultValue={[colorLevels?.[0]?.value, colorLevels?.[colorLevels?.length - 1]?.value]}
                              min={0}
                              max={colorLevels?.[colorLevels?.length - 1]?.value || 0}
                              value={[
                                diamondFilters?.['colors']?.indexOf(selectedDiamondFilters?.colors?.[0]),
                                diamondFilters?.['colors']?.indexOf(selectedDiamondFilters?.colors?.[selectedDiamondFilters?.colors?.length - 1]),
                              ]}
                              tooltip={{ open: false }}
                              onChange={(value: any) => {
                                // setSelectedFilters((prevFilters: any) => ({
                                //   ...prevFilters,
                                //   colors: diamondFilters?.['colors']?.slice(value[0], value[1] + 1),
                                // }));
                                dispatch(
                                  setSelectedDiamondFilters({
                                    colors: diamondFilters?.['colors']?.slice(value[0], value[1] + 1),
                                  }),
                                );
                              }}
                              onChangeComplete={(value: any) => handleFilterChange('colors', value)}
                              step={null}
                              marks={colorLevels?.reduce((acc: any, level: any) => {
                                acc[level.value] = level.label;
                                return acc;
                              }, {})}
                            />
                          )}
                        </div>
                      </div>
                      <div className="flex   flex-col items-start gap-2">
                        <Text size="textxl" as="p" className="tracking-[1.0px] !text-[14px]">
                          CUT
                        </Text>
                        <div className="flex px-2 flex-col gap-0 self-stretch">
                          {Object.keys(diamondFilters)?.length !== 0 && (
                            <Slider
                              range
                              defaultValue={[0, cutLevels?.length - 1 || 0]}
                              min={0}
                              max={cutLevels?.length - 1 || 0}
                              tooltip={{ open: false }}
                              marks={cutLevels?.reduce((acc: any, level: any) => {
                                acc[level.value] = level.label;
                                return acc;
                              }, {})}
                              value={[
                                diamondFilters?.['cut']?.indexOf(selectedDiamondFilters?.cut?.[0]),
                                diamondFilters?.['cut']?.indexOf(selectedDiamondFilters?.cut?.[selectedDiamondFilters?.cut?.length - 1]),
                              ]}
                              onChange={(value: any) => {
                                // setSelectedFilters((prevFilters: any) => ({
                                //   ...prevFilters,
                                //   cut: diamondFilters?.['cut']?.slice(value[0], value[1] + 1),
                                // }));
                                dispatch(
                                  setSelectedDiamondFilters({
                                    cut: diamondFilters?.['cut']?.slice(value[0], value[1] + 1),
                                  }),
                                );
                              }}
                              onChangeComplete={(value: any) => handleFilterChange('cut', value)}
                            />
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-start gap-2">
                        <Text size="textxl" as="p" className="tracking-[1.0px] !text-[14px]">
                          CLARITY
                        </Text>
                        <div className="flex flex-col px-2 gap-0 self-stretch">
                          {Object.keys(diamondFilters)?.length !== 0 && (
                            <Slider
                              range
                              defaultValue={[0, clarityLevels?.length - 1 || 0]}
                              min={0}
                              max={clarityLevels?.length - 1 || 0}
                              tooltip={{ open: false }}
                              marks={clarityLevels?.reduce((acc: any, level: any) => {
                                acc[level.value] = level.label;
                                return acc;
                              }, {})}
                              value={[
                                diamondFilters?.['clarity']?.indexOf(selectedDiamondFilters?.clarity?.[0]),
                                diamondFilters?.['clarity']?.indexOf(selectedDiamondFilters?.clarity?.[selectedDiamondFilters?.clarity?.length - 1]),
                              ]}
                              onChange={(value: any) => {
                                // setSelectedFilters((prevFilters: any) => ({
                                //   ...prevFilters,
                                //   clarity: diamondFilters?.['clarity']?.slice(value[0], value[1] + 1),
                                // }));
                                dispatch(
                                  setSelectedDiamondFilters({
                                    clarity: diamondFilters?.['clarity']?.slice(value[0], value[1] + 1),
                                  }),
                                );
                              }}
                              onChangeComplete={(value: any) => handleFilterChange('clarity', value)}
                            />
                          )}
                        </div>
                      </div>
                      <div className="flex justify-center items-center gap-3">
                        {/* <div className="flex flex-col items-center gap-[118px] self-stretch lg:gap-[118px] md:gap-[88px] sm:gap-[59px]">
                      <div className="flex justify-center gap-3 self-stretch">
                        <Button
                          size="xs"
                          shape="round"
                          className=" w-1/2 font-light font-sans"
                        >
                          NATURAL
                        </Button>
                        <Button
                          size="xs"
                          shape="round"
                          className=" w-1/2 font-light font-sans"
                        >
                          LAB GROWN
                        </Button>
                      </div>
                    </div> */}
                        {/* <Text size="textlg" as="p" className="tracking-[1.0px] underline ">
                          RESET ALL
                        </Text> */}
                        <Button
                          size="small"
                          onClick={() => {
                            handleMenuToggle();
                            replaceUrl(`/custom-jewelry?type=${type}&state=${state}${sId ? `&id=${sId}` : ''}`);
                            // setSelectedFilters({
                            //   ...selectedDiamondFilters,
                            //   clarity: diamondFilters?.clarity,
                            //   colors: diamondFilters?.colors,
                            //   cut: diamondFilters?.cut,
                            //   minCarat: diamondFilters?.minCarat,
                            //   maxCarat: diamondFilters?.maxCarat,
                            //   minAmount: diamondFilters?.minAmount,
                            //   maxAmount: diamondFilters?.maxAmount,
                            //   shapes: selectedShapesData ? [data?.find((item: any) => item.id === selectedShapesData)?.code] : [],
                            // });
                            dispatch(setDiamondPageNumber(1));
                            dispatch(setDiamondPageSize(50));
                            dispatch(
                              setSelectedDiamondFilters({
                                clarity: diamondFilters?.clarity,
                                colors: diamondFilters?.colors,
                                cut: diamondFilters?.cut,
                                minCarat: diamondFilters?.minCarat,
                                maxCarat: diamondFilters?.maxCarat,
                                minAmount: diamondFilters?.minAmount,
                                maxAmount: diamondFilters?.maxAmount,
                                shapes: selectedShapesData
                                  ? [data?.find((item: any) => item.id === selectedShapesData)?.code]
                                  : [diamondFilters?.shapes?.[0]],
                              }),
                            );
                            dispatch(
                              fetchDiamonds({
                                data: {
                                  ...selectedDiamondFilters,
                                  clarity: diamondFilters?.clarity,
                                  colors: diamondFilters?.colors,
                                  cut: diamondFilters?.cut,
                                  minCarat: diamondFilters?.minCarat,
                                  maxCarat: diamondFilters?.maxCarat,
                                  minAmount: diamondFilters?.minAmount,
                                  maxAmount: diamondFilters?.maxAmount,
                                  // shapes: [],
                                  shapes: selectedShapesData
                                    ? [data?.find((item: any) => item.id === selectedShapesData)?.code]
                                    : [diamondFilters?.shapes?.[0]],
                                },
                                pageData: { page: 1, size: 50 },
                              }),
                            );
                          }}
                        >
                          RESET ALL
                        </Button>
                        <Button size="small" type="primary" onClick={handleMenuToggle}>
                          APPLY FILTER
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex w-1/3 md:w-full md:col-span-2 md:grid-cols-2 md:grid md:gap-8 flex-col gap-6 lg:gap-5  px-0 lg:px-0 sm:px-4 sm:hidden">
                <div className="flex flex-col items-start gap-2 md:gap-2">
                  <p className="text-[15px]">COLOR</p>
                  <div className="flex flex-col self-stretch">
                    {Object.keys(diamondFilters)?.length !== 0 && (
                      <Slider
                        range
                        defaultValue={[colorLevels?.[0]?.value, colorLevels?.[colorLevels?.length - 1]?.value]}
                        min={0}
                        tooltip={{ open: false }}
                        max={colorLevels?.[colorLevels?.length - 1]?.value || 0}
                        value={[
                          diamondFilters?.['colors']?.indexOf(selectedDiamondFilters?.colors?.[0]),
                          diamondFilters?.['colors']?.indexOf(selectedDiamondFilters?.colors?.[selectedDiamondFilters?.colors?.length - 1]),
                        ]}
                        onChange={(value: any) => {
                          {
                            // setSelectedFilters((prevFilters: any) => ({
                            //   ...prevFilters,
                            //   colors: diamondFilters?.['colors']?.slice(value[0], value[1] + 1),
                            // }));
                            dispatch(
                              setSelectedDiamondFilters({
                                colors: diamondFilters?.['colors']?.slice(value[0], value[1] + 1),
                              }),
                            );
                          }
                        }}
                        onChangeComplete={(value: any) => handleFilterChange('colors', value)}
                        step={null}
                        marks={colorLevels?.reduce((acc: any, level: any) => {
                          acc[level.value] = level.label;
                          return acc;
                        }, {})}
                      />
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-start gap-2 md:gap-2">
                  <p className="text-[15px]">CUT</p>
                  <div className="flex flex-col gap-1.5 self-stretch">
                    {Object.keys(diamondFilters)?.length !== 0 && (
                      <Slider
                        range
                        defaultValue={[0, cutLevels?.length - 1 || 0]}
                        min={0}
                        max={cutLevels?.length - 1 || 0}
                        tooltip={{ open: false }}
                        marks={cutLevels?.reduce((acc: any, level: any) => {
                          acc[level.value] = level.label;
                          return acc;
                        }, {})}
                        value={[
                          diamondFilters?.['cut']?.indexOf(selectedDiamondFilters?.cut?.[0]),
                          diamondFilters?.['cut']?.indexOf(selectedDiamondFilters?.cut?.[selectedDiamondFilters?.cut?.length - 1]),
                        ]}
                        onChange={(value: any) => {
                          // setSelectedFilters((prevFilters: any) => ({
                          //   ...prevFilters,
                          //   cut: diamondFilters?.['cut']?.slice(value[0], value[1] + 1),
                          // }));
                          dispatch(
                            setSelectedDiamondFilters({
                              cut: diamondFilters?.['cut']?.slice(value[0], value[1] + 1),
                            }),
                          );
                        }}
                        onChangeComplete={(value: any) => handleFilterChange('cut', value)}
                      />
                    )}
                  </div>
                </div>
              </div>
              <div className="flex w-1/3 md:w-full md:col-span-2 md:grid-cols-2 md:grid md:gap-8 flex-col gap-6 lg:gap-5 sm:hidden  sm:gap-[59px]">
                <div className="flex flex-col md:col-span-1 items-center gap-[118px] self-stretch lg:gap-[118px] md:gap-[88px] sm:gap-[59px]">
                  <div className="flex w-[100%] flex-col items-start gap-2 lg:w-full md:w-full">
                    <p className="text-[15px]">CLARITY</p>
                    <div className="flex flex-col self-stretch">
                      {Object.keys(diamondFilters)?.length !== 0 && (
                        <Slider
                          range
                          defaultValue={[0, clarityLevels?.length - 1 || 0]}
                          min={0}
                          max={clarityLevels?.length - 1 || 0}
                          tooltip={{ open: false }}
                          marks={clarityLevels?.reduce((acc: any, level: any) => {
                            acc[level.value] = level.label;
                            return acc;
                          }, {})}
                          value={[
                            diamondFilters?.['clarity']?.indexOf(selectedDiamondFilters?.clarity?.[0]),
                            diamondFilters?.['clarity']?.indexOf(selectedDiamondFilters?.clarity?.[selectedDiamondFilters?.clarity?.length - 1]),
                          ]}
                          onChange={(value: any) => {
                            // setSelectedFilters((prevFilters: any) => ({
                            //   ...prevFilters,
                            //   clarity: diamondFilters?.['clarity']?.slice(value[0], value[1] + 1),
                            // }));
                            dispatch(
                              setSelectedDiamondFilters({
                                clarity: diamondFilters?.['clarity']?.slice(value[0], value[1] + 1),
                              }),
                            );
                          }}
                          onChangeComplete={(value: any) => handleFilterChange('clarity', value)}
                        />
                      )}
                    </div>
                  </div>
                  {/* comment if in future use */}
                  {/* <div className="flex justify-center gap-3 self-stretch">
                <Button
                  size="xs"
                  shape="round"
                  className=" w-1/2 font-light font-sans"
                >
                  NATURAL
                </Button>
                <Button
                  size="xs"
                  shape="round"
                  className=" w-1/2 font-light font-sans"
                >
                  LAB GROWN
                </Button>
              </div> */}
                </div>
                <div className="flex w-full md:col-span-1 flex-col items-start gap-2 ">
                  <p className="text-[15px]">CARATS</p>
                  <div className="flex flex-col-reverse self-stretch">
                    <div className="flex flex-wrap justify-between gap-5">
                      <div className="flex items-center gap-1">
                        <InputNumber
                          size="small"
                          min={diamondFilters?.minCarat}
                          max={selectedDiamondFilters?.maxCarat}
                          style={{ color: 'black' }}
                          step={0.05}
                          precision={2}
                          inputMode="decimal"
                          onKeyDown={blockNonNumericKeys}
                          // prefix="$"
                          value={selectedDiamondFilters?.minCarat}
                          onChange={(value: any) => {
                            // setSelectedFilters((prevFilters: any) => ({
                            //   ...prevFilters,
                            //   minCarat: value,
                            //   // maxCarat: value[1],
                            // }));
                            dispatch(
                              setSelectedDiamondFilters({
                                minCarat: value,
                              }),
                            );
                            handleFilterChange('carat', [value ?? diamondFilters?.minCarat ?? 0, selectedDiamondFilters?.maxCarat]);
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <InputNumber
                          size="small"
                          min={selectedDiamondFilters?.minCarat}
                          max={diamondFilters?.maxCarat}
                          style={{ color: 'black' }}
                          // prefix="$"
                          step={0.05}
                          precision={2}
                          inputMode="decimal"
                          onKeyDown={blockNonNumericKeys}
                          value={selectedDiamondFilters?.maxCarat}
                          onChange={(value: any) => {
                            // setSelectedFilters((prevFilters: any) => ({
                            //   ...prevFilters,
                            //   // minCarat: value,
                            //   maxCarat: value,
                            // }));
                            dispatch(
                              setSelectedDiamondFilters({
                                maxCarat: value,
                              }),
                            );
                            handleFilterChange('carat', [selectedDiamondFilters?.minCarat, value ?? diamondFilters?.maxCarat ?? 0]);
                          }}
                        />
                      </div>
                    </div>
                    <Slider
                      // included={false}
                      range
                      defaultValue={[diamondFilters?.minCarat, diamondFilters?.maxCarat]}
                      value={[selectedDiamondFilters.minCarat, selectedDiamondFilters.maxCarat]}
                      onChange={(value: any) => {
                        // setSelectedFilters((prevFilters: any) => ({
                        //   ...prevFilters,
                        //   minCarat: value[0],
                        //   maxCarat: value[1],
                        // }));
                        dispatch(
                          setSelectedDiamondFilters({
                            minCarat: value[0],
                            maxCarat: value[1],
                          }),
                        );
                      }}
                      step={0.01}
                      min={diamondFilters?.minCarat || 0}
                      max={diamondFilters?.maxCarat || 0}
                      onChangeComplete={(value: any) => handleFilterChange('carat', value)}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="self-end sm:hidden">
              <Button
                size="small"
                onClick={() => {
                  replaceUrl(`/custom-jewelry?type=${type}&state=${state}${sId ? `&id=${sId}` : ''}`);
                  dispatch(setDiamondPageNumber(1));
                  dispatch(setDiamondPageSize(50));
                  // setSelectedFilters({
                  //   ...selectedDiamondFilters,
                  //   clarity: diamondFilters?.clarity,
                  //   colors: diamondFilters?.colors,
                  //   cut: diamondFilters?.cut,
                  //   minCarat: diamondFilters?.minCarat,
                  //   maxCarat: diamondFilters?.maxCarat,
                  //   minAmount: diamondFilters?.minAmount,
                  //   maxAmount: diamondFilters?.maxAmount,
                  //   shapes: selectedShapesData ? [data?.find((item: any) => item.id === selectedShapesData)?.code] : [],
                  // });
                  dispatch(
                    setSelectedDiamondFilters({
                      clarity: diamondFilters?.clarity,
                      colors: diamondFilters?.colors,
                      cut: diamondFilters?.cut,
                      minCarat: diamondFilters?.minCarat,
                      maxCarat: diamondFilters?.maxCarat,
                      minAmount: diamondFilters?.minAmount,
                      maxAmount: diamondFilters?.maxAmount,
                      shapes: selectedShapesData ? [data?.find((item: any) => item.id === selectedShapesData)?.code] : [diamondFilters?.shapes?.[0]],
                    }),
                  );
                  dispatch(
                    fetchDiamonds({
                      data: {
                        ...selectedDiamondFilters,
                        clarity: diamondFilters?.clarity,
                        colors: diamondFilters?.colors,
                        cut: diamondFilters?.cut,
                        minCarat: diamondFilters?.minCarat,
                        maxCarat: diamondFilters?.maxCarat,
                        minAmount: diamondFilters?.minAmount,
                        maxAmount: diamondFilters?.maxAmount,
                        shapes: selectedShapesData
                          ? [data?.find((item: any) => item.id === selectedShapesData)?.code]
                          : [diamondFilters?.shapes?.[0]],
                      },
                      pageData: { page: 1, size: 50 },
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
    </>
  );
}
