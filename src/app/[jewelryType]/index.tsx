/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-case-declarations */
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Button, Checkbox, Image, InputNumber, Radio, RadioChangeEvent, Select, Skeleton, Slider, SliderSingleProps } from 'antd';
import { debounce } from 'lodash';
import Link from 'next/link';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { BsFilterLeft, BsThreeDots } from 'react-icons/bs';
import { FiMinus } from 'react-icons/fi';
import { HiPlus } from 'react-icons/hi2';
import { LuLoader } from 'react-icons/lu';
import { RiFilter2Line } from 'react-icons/ri';
import { RxCross2 } from 'react-icons/rx';
import { Virtual, Navigation, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import { Text } from '@/components';
import {
  clearProducts,
  fetchProducts,
  fetchProductsBulkRefresh,
  fetchProductsFilterList,
  fetchPromotionalImages,
  setCurrentPage,
  setFilterData,
  setFilterLoadingFirst,
  setIsFasterPopup,
  setLoadingFilterId,
  setShouldLoadFilter,
  setShouldLoadList,
  useAppDispatch,
  useAppSelector,
} from '@/store';
import { isObjectEmpty } from '@/utils/objectUtils';
import { findSubTypesByParam, subTypeCodeToParam } from '@/utils/subTypeParam';

import ChunkComponent from './ChunkComponent';
const dropDownOptions = [
  { label: <div className="flex justify-end items-center pr-[10px]">{'Sort By'}</div>, value: '' },
  { label: <div className="flex justify-end items-center pr-[10px]">{'High to Low'}</div>, value: 'hightolow' },
  { label: <div className="flex justify-end items-center pr-[10px]">{'Low to High'}</div>, value: 'lowtohigh' },
  { label: <div className="flex justify-end items-center pr-[10px]">{'Fast Delivery'}</div>, value: 'fastdelivery' },
];

function chunkArray(arr: any, chunkSize: number) {
  const result = [];
  for (let i = 0; i < arr?.length; i += chunkSize) {
    result.push(arr.slice(i, i + chunkSize));
  }
  return result;
}
function isJewelryTypeExist(jewelryTypeName: string) {
  switch (jewelryTypeName) {
    case 'earrings':
    case 'rings':
    case 'necklaces':
    case 'bracelets':
    case 'wedding-bands':
    case 'engagement-rings':
    case 'all':
    case 'new-arrivals':
      return true; // Jewelry type exists
    default:
      return false; // Jewelry type does not exist
  }
}

export default function PRODUCTPAGEPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const dropdownRefMobile = useRef<HTMLDivElement | null>(null);
  const productsLoading = useAppSelector((state) => state.products?.loading);
  const products = useAppSelector((state) => state.products?.products?.rows);
  const PromotionalImages = useAppSelector((state) => state.products?.PromotionalImages);
  const counts = useAppSelector((state) => state.products?.products?.count);
  const filters = useAppSelector((state) => state.products?.filterList);
  const filtersData = useAppSelector((state) => state.products?.filterData);
  const { filterLoadingFirst, isFasterPopup, loadingFilterId, lastLoadedKey, lastLoadedPage } = useAppSelector((state) => state.products);
  const { pageSize, currentPage } = useAppSelector((state) => state.products.pagination);
  const { headerData } = useAppSelector((state) => state.master);
  const masterData = useAppSelector((s) => s.master.data);
  const masterRingSizePrice = useAppSelector((state) => state?.master?.ringSizePriceList);
  const productFilter = useAppSelector((state) => state?.master?.data);

  const [caratWeight, setCaratWeight] = useState<SliderSingleProps['marks']>({});
  const { jewelryType } = useParams();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const collections = searchParams.get('collections');

  const collectionType = searchParams.get('collections') ? searchParams.get('collections') : null;
  const subTypes = searchParams.get('subTypes');
  const sort = searchParams.get('sort');
  const price = searchParams.get('price');
  // `price` is the slider's own `min-max` param. `min_price` is a floor-only entry point for
  // deep links (the cart's "Add $X more" button): the caller knows the minimum a product must
  // cost, but not what the catalogue tops out at, so it must not have to invent a maximum.
  // Sending a sentinel instead put a bogus number in the address bar and dragged it into
  // every later filter change, since handleFilterChange clones the query string.
  const minPriceParam = searchParams.get('min_price');

  const urlMinPrice = (() => {
    const fromRange = price ? Number(price.split('-')[0]) : NaN;
    if (Number.isFinite(fromRange)) {
      return fromRange;
    }
    const fromFloor = minPriceParam ? Number(minPriceParam) : NaN;
    return Number.isFinite(fromFloor) && fromFloor >= 0 ? fromFloor : undefined;
  })();

  const urlMaxPrice = (() => {
    const raw = price ? price.split('-')[1] : undefined;
    const parsed = Number(raw);
    // No upper bound given ("min_price=660", or a trailing "660-") means "no ceiling", not
    // "max = 0" — Number('') is 0, which would otherwise filter every product out.
    if (!raw || !Number.isFinite(parsed) || parsed <= 0) {
      return undefined;
    }
    const catalogueMax = filters?.price_range?.max_price;
    return catalogueMax ? Math.min(parsed, catalogueMax) : parsed;
  })();

  const metal = searchParams.get('metal');
  const specialTitle = searchParams?.get('specialTitle');
  const diamondColor = searchParams.get('diamondColor');
  const shape = searchParams.get('shape');
  const carat = searchParams.get('carat');
  const gender = searchParams.get('gender');

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isItemsOpen, setIsItemsOpen] = useState(true);
  const [isMetalOpen, setIsMetalOpen] = useState(false);
  const [isSpecialTitleOpen, setSpecialTitleOpen] = useState(false);
  const [isDiamondColorOpen, setIsDiamondColorOpen] = useState(false);
  const [isShapeOpen, setIsShapeOpen] = useState(false);
  const [isCaratWeightOpen, setIsCaratWeightOpen] = useState(false);
  const [isPriceOpen, setIsPriceOpen] = useState(true);
  const [isProductCall, setIsProductCall] = useState(false);
  // Warm re-entry: if we're returning to the same jewelryType/collectionType with rows already
  // cached in Redux, skip the spinner and show the cached grid while a silent refresh runs.
  const effectiveJewelryType = jewelryType as string | undefined;
  const urlFilterSignature = [
    metal ?? '',
    shape ?? '',
    diamondColor ?? '',
    subTypes ?? '',
    specialTitle ?? '',
    gender ?? '',
    sort ?? '',
    price ?? '',
    carat ?? '',
  ].join('|');
  const currentListKey = effectiveJewelryType ? `${effectiveJewelryType}|${collectionType ?? ''}|${urlFilterSignature}` : null;
  const isWarmMountRef = useRef<boolean>(!!currentListKey && lastLoadedKey === currentListKey && (products?.length ?? 0) > 0);
  // The first URL-derived setFilterData after a warm mount changes filtersData by reference but
  // not by value — swallow it once so the [filtersData, jewelryType] effect doesn't clobber
  // the multi-page cached rows with a fresh page=1 fetch.
  const skipNextFilterRefetchRef = useRef<boolean>(isWarmMountRef.current);
  // Tracks the previous `filterLoadingFirst` value so the effect only fires on a real
  // false→true transition. Without this, a warm remount where Redux already holds
  // `filterLoadingFirst === true` would fire the mount-run of the effect and dispatch
  // fetchProducts(page=currentPage, size=pageSize), overriding the warm bulk refresh.
  const filterLoadingFirstPrevRef = useRef<boolean>(filterLoadingFirst);
  // Block infinite-scroll during the warm bulk refresh (scroll position is restored before
  // the refresh resolves; handleScroll could otherwise fire page=currentPage+1 immediately).
  const warmRefreshInFlightRef = useRef<boolean>(isWarmMountRef.current);
  const [isLoading, setLoading] = useState(!isWarmMountRef.current);
  const [isOpenSubType, setIsOpenSubType] = useState(false);
  const [isFasterPopupShow, setIsFasterPopupShow] = useState(false);
  const [isOpenSubTypeMobile, setIsOpenSubTypeMobile] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<any>({
    metal: [],
    shape: [],
    specialTitle: [],
    diamondColor: [],
    subTypes: [],
    gender: 1,
    sort: '',
    min_price: filters?.price_range?.min_price ?? 0,
    max_price: filters?.price_range?.max_price ?? 0,
    min_carat: 0,
    max_carat: 0,
  });
  // antd's InputNumber reports `null` the instant the box is emptied. Falling straight back to the
  // catalogue bound there refills the field mid-edit, so a shopper can never clear "2000" to type a
  // new ceiling. `undefined` means "not being edited" (mirror selectedFilters); `null` means the
  // shopper deliberately emptied it and we leave it blank until they type or blur.
  const [priceDraft, setPriceDraft] = useState<{ min?: number | null; max?: number | null }>({});
  const [selectedMoreSubType, setSelectedMoreSubType] = useState<any>([]);
  const [collectionData, setCollectionData] = useState<any>();
  const previousCollectionType = useRef<string | null>(null);
  const [swiperRef, setSwiperRef] = useState<any>(null);
  const [swiperRefDesk, setSwiperRefDesk] = useState<any>(null);
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const prevRefDesk = useRef<HTMLButtonElement>(null);
  const nextRefDesk = useRef<HTMLButtonElement>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSortLoading, setIsSortLoading] = useState(false);
  const productsLoadingPrevRef = useRef<boolean>(productsLoading);
  const [windowWidth, setWindowWidth] = useState<number>(0);

  // Clear the sort-change loader once the products fetch completes (true → false transition).
  useEffect(() => {
    if (productsLoadingPrevRef.current && !productsLoading && isSortLoading) {
      setIsSortLoading(false);
    }
    productsLoadingPrevRef.current = productsLoading;
  }, [productsLoading, isSortLoading]);

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

  const scrollRestoreKey = `listing-scroll:${pathname}?${searchParams.toString()}`;
  const restoreTargetRef = useRef<{ scrollY: number; currentPage: number } | null>(null);
  // Set when the cold-start effect dispatches the product list in parallel with list-filter
  // (safe only for non-price-capped types with no URL filters). The filterLoadingFirst effect
  // reads it to skip the duplicate fetch it would otherwise fire.
  const earlyListDispatchedRef = useRef(false);
  const hasRestoredRef = useRef(false);
  const latestStateRef = useRef({ scrollY: 0, currentPage: 1, key: scrollRestoreKey });

  useEffect(() => {
    latestStateRef.current.currentPage = currentPage;
    latestStateRef.current.key = scrollRestoreKey;
  }, [currentPage, scrollRestoreKey]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const raw = sessionStorage.getItem(scrollRestoreKey);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw);
      sessionStorage.removeItem(scrollRestoreKey);
      if (parsed && typeof parsed.scrollY === 'number' && typeof parsed.currentPage === 'number' && parsed.currentPage >= 1 && parsed.scrollY > 0) {
        restoreTargetRef.current = { scrollY: parsed.scrollY, currentPage: parsed.currentPage };
      }
    } catch {
      // Ignore sessionStorage / JSON errors.
    }
  }, []);

  useEffect(() => {
    const trackScroll = () => {
      latestStateRef.current.scrollY = window.scrollY;
    };
    window.addEventListener('scroll', trackScroll, { passive: true });
    return () => window.removeEventListener('scroll', trackScroll);
  }, []);

  useEffect(() => {
    return () => {
      const { scrollY, currentPage: page, key } = latestStateRef.current;
      if (scrollY > 0) {
        try {
          sessionStorage.setItem(key, JSON.stringify({ scrollY, currentPage: page }));
        } catch {
          // Ignore quota / serialization errors.
        }
      }
    };
  }, []);

  const handleScroll = useCallback(() => {
    if (warmRefreshInFlightRef.current) {
      return;
    }
    if (productsLoading || isLoadingMore || !counts || products?.length >= counts) {
      return;
    }

    const scrollPosition = window.scrollY + window.innerHeight;
    const totalHeight = document.documentElement.scrollHeight;
    const scrollPercentage = (scrollPosition / totalHeight) * 100;

    if (scrollPercentage > 70) {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;
      dispatch(setCurrentPage(nextPage));

      if (collectionType) {
        dispatch(
          fetchProducts({
            type: jewelryType as string,
            data: filtersData,
            page: nextPage,
            size: pageSize,
            collectionType: collectionType,
            listKey: currentListKey ?? undefined,
          }),
        ).then(() => setIsLoadingMore(false));
      } else {
        dispatch(
          fetchProducts({
            type: jewelryType as string,
            data: filtersData,
            page: nextPage,
            size: pageSize,
            listKey: currentListKey ?? undefined,
          }),
        ).then(() => setIsLoadingMore(false));
      }
    }
  }, [
    currentPage,
    counts,
    products?.length,
    productsLoading,
    isLoadingMore,
    dispatch,
    jewelryType,
    filtersData,
    pageSize,
    collectionType,
    currentListKey,
  ]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // const jewelry_type = [{ name: 'Engagement Rings' }, { name: 'Wedding Bands' }, { name: 'Earrings' }, { name: 'Necklaces' }, { name: 'Bracelets' }];
  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  const handleJewelryToggle = () => {
    setIsItemsOpen(!isItemsOpen);
  };
  const [chunkedData, setChunkedData] = useState([]);

  function getPriceViaRingAndMetal(ringSize: null | string = '0', metal: string) {
    const ProductPrice = masterRingSizePrice?.find((item: any) => item.ring_size_id == ringSize && item.metal_type_id == metal);
    return ringSize && ringSize !== '0' ? ProductPrice?.rate : 0;
  }
  const handleStateData = async (productsData: any) => {
    const newData = await productsData?.map((item: any) => {
      const carat_image = item.jewelryDetails[0]?.carat_images || [];
      const metal_type_id = item.jewelryDetails?.[0]?.metal_type_id;
      const ring_size_id = item.jewelryDetails?.[0]?.ring_size_id;
      const ring_size_price = getPriceViaRingAndMetal(ring_size_id, metal_type_id);
      const jewelryTypeName = item?.jewelrySubType?.parent_code;
      const jewelryTypeData = jewelryTypeName?.toLowerCase()?.replace('_', '-');
      const jewelryDetails = item?.jewelryDetails?.[0];
      return {
        estimated_delivery_days: item?.estimated_delivery_days,
        productVariation: item?.image_folder_info.length,
        productImage: carat_image[0] ? `${carat_image[0]}` : '/images/no_images.svg',
        productHoverImage: carat_image[1] ? `${carat_image[1]}` : '/images/no_images.svg',
        is_customizable: item?.is_customizable,
        variation_to_show: item?.variation_to_show,
        variation_details: item?.variation_details,
        jewelryDetails,
        jewelryTypeData,
        productName: item?.title,
        // Yotpo keys reviews by this product-level code — the card's star rating needs it.
        code: item?.code,
        productPrice:
          ring_size_price && ring_size_price > 0
            ? `${Math.ceil(item?.jewelryDetails[0]?.selling_price + ring_size_price)}`
            : `${Math.ceil(item?.jewelryDetails[0]?.selling_price)}`,
        // slug: `${jewelryType}/${item?.slug}`,
        slug: item?.is_customizable ? item.jewelryDetails[0]?.sku_slug : `${jewelryTypeData}/premade?slug=${item.jewelryDetails[0]?.sku_slug}`,
        sku_master_id: item?.jewelryDetails[0]?.id,
        jewelry_id: item?.id,
        jewelry_type: item?.jewelrySubType?.parent_code,
        isWishlist: item?.jewelryDetails[0]?.wishlist_id,
        handling_days: item?.jewelryDetails[0]?.handling_days,
        discount_type: item?.jewelryDetails[0]?.discount_type,
        discount_value: item?.jewelryDetails[0]?.discount_value == 0 ? null : item?.jewelryDetails[0]?.discount_value,
        discounted_price: item?.jewelryDetails[0]?.discounted_price
          ? ring_size_price && ring_size_price > 0
            ? `${item?.jewelryDetails[0]?.discounted_price + ring_size_price}`
            : `${item?.jewelryDetails[0]?.discounted_price}`
          : null,
        ring_size_id: ring_size_id,
        specialProductTitles: item?.specialProductTitles,
      };
    });
    const d: any = chunkArray(newData, 5);
    setChunkedData(d);
  };

  function getValuesInRange(min: any, max: any) {
    return Object.keys(caratWeight ? caratWeight : {})
      .map(Number)
      .filter((key) => key >= min && key <= max)
      .map((key) => (caratWeight ? caratWeight[key] : null));
  }
  const handleSliderChange = (values: any) => {
    const allValues = getValuesInRange(values?.[0], values?.[1])?.sort((a: any, b: any) => a - b);

    const caratSizeIds = filters?.diamond_details?.filter((obj: any) => allValues?.includes(obj?.weight)).map((obj) => obj.id);
    dispatch(
      setFilterData({
        ...filtersData,
        carats: caratSizeIds,
      }),
    );
  };
  // console.log(dropdownRef.current, 'dropdownRef.current');
  // console.log('-----');

  const handleClickOutside = (event: MouseEvent) => {
    // Ensure dropdownRef.current is a valid element before calling contains
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpenSubType(false);
    }
    if (dropdownRefMobile.current && !dropdownRefMobile.current.contains(event.target as Node)) {
      setIsOpenSubTypeMobile(false);
    }
  };
  const applyPriceRange = (minValue: number, maxValue: number) => {
    setSelectedFilters((prevFilters: any) => ({ ...prevFilters, min_price: minValue, max_price: maxValue }));
    handleFilterChange('price', [minValue, maxValue]);
    dispatch(setFilterData({ ...filtersData, min_price: minValue, max_price: maxValue }));
  };

  // Keeps an emptied box empty. The filter only moves once there is a number that makes a valid
  // range - so typing "1500" back into the max box doesn't fire 1, 15 and 150 (each of them an
  // inverted range against the current floor) on the way there.
  const handlePriceInputChange = (bound: 'min' | 'max', value: number | null) => {
    setPriceDraft((prevDraft) => ({ ...prevDraft, [bound]: value }));
    if (value === null || value === undefined) {
      return;
    }
    const minValue = bound === 'min' ? value : selectedFilters?.min_price;
    const maxValue = bound === 'max' ? value : selectedFilters?.max_price;
    if (Number(minValue) > Number(maxValue)) {
      return;
    }
    applyPriceRange(minValue, maxValue);
  };

  // Leaving the box (blur or Enter) settles it: empty means "no bound here" (back to the catalogue
  // edge), and a number that crosses the other bound is clamped to it rather than applied inverted.
  const handlePriceInputCommit = (bound: 'min' | 'max') => {
    const draftValue = priceDraft[bound];
    setPriceDraft((prevDraft) => ({ ...prevDraft, [bound]: undefined }));
    if (draftValue === undefined) {
      return;
    }
    const currentMin = Number(selectedFilters?.min_price) || 0;
    const currentMax = Number(selectedFilters?.max_price) || 0;
    const catalogueFloor = filters?.price_range?.min_price ?? 0;
    const catalogueCeiling = filters?.price_range?.max_price ?? 0;
    const editedMin = draftValue === null ? catalogueFloor : currentMax > 0 ? Math.min(draftValue, currentMax) : draftValue;
    const editedMax = draftValue === null ? catalogueCeiling : Math.max(draftValue, currentMin);
    const minValue = bound === 'min' ? editedMin : currentMin;
    const maxValue = bound === 'max' ? editedMax : currentMax;
    if (minValue === currentMin && maxValue === currentMax) {
      return;
    }
    applyPriceRange(minValue, maxValue);
  };

  const handleFilterChange = useCallback(
    (filterType: string, value: any) => {
      let newFilters = { ...selectedFilters };
      const currentParams = new URLSearchParams(searchParams.toString()); // Make a copy of the current URL parameters
      // Update the selectedFilters based on the filterType
      switch (filterType) {
        case 'price':
          newFilters = { ...newFilters, min_price: value[0], max_price: value[1] };
          currentParams.set('price', `${value[0]}-${value[1]}`);
          // The slider now owns the range; a leftover deep-link floor would contradict it.
          currentParams.delete('min_price');
          break;

        case 'metal':
          newFilters = { ...newFilters, metal: value };
          const new_metal = productFilter?.filter((item: any) => value.includes(item.id));
          const metal_data = new_metal?.length > 0 ? new_metal?.map((el: any) => el?.code?.toLowerCase()).join(',') : '';
          currentParams.set('metal', metal_data);
          if (metal_data.length == 0) {
            currentParams.delete('metal');
          }
          break;

        case 'specialTitle':
          newFilters = { ...newFilters, specialTitle: value };
          const selectedTitles = filters?.special_title
            ?.filter((item: any) => value.includes(item.id))
            ?.map((item: any) => encodeURIComponent(item.title?.replace(/\s+/g, '-')))
            ?.join(',');
          currentParams.set('specialtitle', selectedTitles);
          if (selectedTitles?.length === 0) {
            currentParams.delete('specialtitle');
          }
          break;

        case 'subTypes':
          newFilters = { ...newFilters, subTypes: value };
          const new_style = masterData?.filter((item: any) => value.includes(item.id));
          const seenCodes = new Set<string>();
          const subTypeCodes =
            new_style?.length > 0
              ? new_style
                  ?.map((el: any) => subTypeCodeToParam(el?.code))
                  ?.filter((code: string) => {
                    if (seenCodes.has(code)) {
                      return false;
                    }
                    seenCodes.add(code);
                    return true;
                  })
                  ?.join(',')
              : '';
          currentParams.set('subTypes', subTypeCodes);
          if (subTypeCodes.length == 0) {
            currentParams.delete('subTypes');
          }
          // currentParams.set('subTypes', value.join(','));
          break;

        case 'diamondColor':
          newFilters = { ...newFilters, diamondColor: value };
          const newColor = masterData?.filter((item: any) => value.includes(item.id));
          const color_data =
            newColor?.length > 0 ? newColor?.map((el: any) => `${el?.parent_code}${el?.sub_code?.[0]}`?.toLowerCase()).join(',') : '';
          currentParams.set('diamondColor', color_data);
          if (color_data.length == 0) {
            currentParams.delete('diamondColor');
          }
          // currentParams.set('diamondColor', value.join(','));
          break;

        case 'shape':
          newFilters = { ...newFilters, shape: value };
          const new_shape = productFilter?.filter((item: any) => value.includes(item.id));
          const shape_data = new_shape.length > 0 ? new_shape?.map((el: any) => el?.name?.toLowerCase())?.join(',') : '';
          currentParams.set('shape', shape_data);
          if (shape_data.length == 0) {
            currentParams.delete('shape');
          }
          // currentParams.set('shape', value.join(','));
          break;

        case 'carat':
          newFilters = { ...newFilters, carat: value };
          currentParams.set('carat', `${value[0]}-${value[1]}`);
          break;

        case 'gender':
          const gender_data = value >= 2 ? (value == 2 ? 'for_him' : 'for_her') : 'both';
          newFilters = { ...newFilters, gender: value };
          currentParams.set('gender', gender_data);
          break;

        case 'sort':
          newFilters = { ...newFilters, sort: value };
          currentParams.set('sort', value);
          if (value.length == 0) {
            currentParams.delete('sort');
          }
          break;
        default:
          return;
      }
      // Now that we've updated all the relevant parameters, let's construct the final URL
      const updatedUrl = `/${jewelryType}?${decodeURIComponent(currentParams.toString())}`;

      // Update the URL with all the filters, while preserving the changes
      router.replace(updatedUrl, { scroll: false });
    },
    [selectedFilters, jewelryType, router, searchParams],
  );

  const handleApiCall = useCallback(
    debounce(({ jewelryType, filtersData, currentPage = 1, pageSize, collectionType = null, listKey = undefined }) => {
      if (collectionType) {
        dispatch(
          fetchProducts({
            type: jewelryType as string,
            data: filtersData,
            page: currentPage,
            size: pageSize,
            collectionType: collectionType,
            listKey,
          }),
        );
      } else {
        dispatch(
          fetchProducts({
            type: jewelryType as string,
            data: filtersData,
            page: currentPage,
            size: pageSize,
            listKey,
          }),
        );
      }
      // Dispatch action to fetch API data
    }, 1000), // Delay in ms before calling API
    [dispatch],
  );

  useEffect(() => {
    // PDP (and similar) sets shouldLoadList false; without resetting, returning to this page
    // skipped filter + product refresh and left stale subTypes / jewelry_types in Redux.
    dispatch(setShouldLoadList(true));
    setIsProductCall(false);
    const typeForFetch = jewelryType as string | undefined;
    if (!typeForFetch) {
      return;
    }

    // Recompute warm status at effect-run time so within-segment param changes (e.g. /rings →
    // /earrings without full remount) re-evaluate against current Redux state instead of using
    // a stale ref value captured at first render.
    const isWarm = !!currentListKey && lastLoadedKey === currentListKey && (products?.length ?? 0) > 0;
    isWarmMountRef.current = isWarm;
    warmRefreshInFlightRef.current = isWarm;
    skipNextFilterRefetchRef.current = isWarm;

    if (isWarm) {
      // Returning to the same listing — keep cached rows visible, refresh in the background.
      setLoading(false);
      dispatch(fetchPromotionalImages({ type: typeForFetch, collection: collectionType }));
      dispatch(
        fetchProductsFilterList({
          type: typeForFetch,
          collection: collectionType ?? null,
          silent: true,
        } as any),
      );
      dispatch(
        fetchProductsBulkRefresh({
          type: typeForFetch,
          data: filtersData,
          lastPage: Math.max(lastLoadedPage, 1),
          size: pageSize,
          collectionType: collectionType ?? null,
          listKey: currentListKey ?? undefined,
        }),
      ).finally(() => {
        warmRefreshInFlightRef.current = false;
        setLoading(false);
        setIsProductCall(true);
      });
      return;
    }

    // Cold start: first visit, refresh, or different jewelryType/collection.
    setLoading(true);
    dispatch(clearProducts());
    dispatch(setCurrentPage(1));
    dispatch(fetchPromotionalImages({ type: typeForFetch, collection: collectionType }));
    dispatch(
      fetchProductsFilterList({
        type: typeForFetch,
        collection: collectionType ?? null,
      }),
    );

    // Parallel-load: for normal (non-price-capped) types with no URL filters, the list-filter
    // response's default price range spans the full set, so the product query returns the
    // identical rows whether or not it waits for that response. Fire it in parallel to cut one
    // round-trip from time-to-first-product. Price-capped types (less-than-*) and
    // URL-filtered / collection loads keep the gated path below (they need the filter response /
    // masterData); the filterLoadingFirst effect skips its duplicate via earlyListDispatchedRef.
    const isPriceCappedType = ['less-than-five-hundred', 'less-than-thousand', 'less-than-two-thousand'].includes(typeForFetch);
    const hasNoUrlFilters = urlFilterSignature.replace(/\|/g, '') === '';
    // Skip the parallel path when a multi-page scroll restore is pending — the gated effect
    // below refetches pageSize * restorePages and restores the page number, which this single-page
    // early fetch would not reproduce.
    const hasNoPendingRestore = (restoreTargetRef.current?.currentPage ?? 1) <= 1;
    if (!collectionType && !isPriceCappedType && hasNoUrlFilters && hasNoPendingRestore) {
      earlyListDispatchedRef.current = true;
      dispatch(
        fetchProducts({
          type: typeForFetch,
          data: {
            ...filtersData,
            metal: [],
            shape: [],
            diamond_color: [],
            subTypes: [],
            gender_category: 1,
            sort_order: '',
            min_price: filters?.price_range?.min_price,
            max_price: filters?.price_range?.max_price,
            carats: [],
          },
          page: currentPage,
          size: pageSize,
          listKey: currentListKey ?? undefined,
        }),
      ).then(() => {
        setLoading(false);
        setIsProductCall(true);
      });
      setTimeout(() => {
        setIsFasterPopupShow(true);
      }, 1500);
    }
  }, [jewelryType, collectionType, dispatch]);

  useEffect(() => {
    // Only react to a real false→true transition. A warm remount inherits `filterLoadingFirst`
    // as true from the previous visit; firing the mount-run of this effect would dispatch
    // fetchProducts(page=currentPage, size=pageSize), which overrides the warm bulk refresh
    // and shrinks the visible grid back to a single page of data.
    const prev = filterLoadingFirstPrevRef.current;
    filterLoadingFirstPrevRef.current = filterLoadingFirst;
    if (!filterLoadingFirst || prev) {
      return;
    }
    // The cold-start effect already dispatched the product list in parallel with list-filter;
    // skip the duplicate fetch this effect would otherwise fire.
    if (earlyListDispatchedRef.current) {
      earlyListDispatchedRef.current = false;
      return;
    }
    if (filterLoadingFirst) {
      const data = {
        ...filtersData,
        metal: metal ? IdFilter(metal) : [],
        shape: shape ? ShapeFilter(shape) : [],
        diamond_color: diamondColor ? diamondColorFind(diamondColor) : [],
        subTypes: subTypes ? SubtypeIdFilter(subTypes) : [],
        gender_category: gender ? genderFind(gender) : 1,
        sort_order: sort ? sort : '',
        min_price: urlMinPrice ?? filters?.price_range?.min_price,
        max_price: urlMaxPrice ?? filters?.price_range?.max_price,
        carats: carat ? carat?.split('-') : [],
        // min_carat: carat ? Number(carat?.split('-')?.[0]) : Math.min(...Object.keys(caratWeight as any).map(Number)),
        // max_carat: carat ? Number(carat?.split('-')?.[1]) : Math.max(...Object.keys(caratWeight as any).map(Number)),
      };
      const restorePages = restoreTargetRef.current?.currentPage ?? 1;
      const initialPage = 1;
      const initialSize = pageSize * restorePages;
      if (collectionType) {
        dispatch(
          fetchProducts({
            type: jewelryType as string,
            data: data,
            page: initialPage,
            size: initialSize,
            collectionType: collectionType,
            listKey: currentListKey ?? undefined,
          }),
        ).then(() => {
          setLoading(false);
          setIsProductCall(true);
          if (restorePages > 1) {
            dispatch(setCurrentPage(restorePages));
          }
        });
      } else {
        dispatch(
          fetchProducts({
            type: jewelryType as string,
            data: data,
            page: currentPage,
            size: pageSize,
            listKey: currentListKey ?? undefined,
          }),
        ).then(() => {
          setLoading(false);
          setIsProductCall(true);
          if (restorePages > 1) {
            dispatch(setCurrentPage(restorePages));
          }
        });
      }
      setTimeout(() => {
        setIsFasterPopupShow(true);
      }, 1500);
    }
  }, [filterLoadingFirst]);

  useEffect(() => {
    const collData = headerData && headerData?.collections?.find((type: any) => type?.name?.toLowerCase()?.split(' ')?.join('-') == collections);
    setCollectionData(collData);
    // if (collData?.name !== collectionData?.name) {
    //   setLoading(true);
    // }
  }, [collections, collectionData, headerData]);

  useEffect(() => {
    console.log(isProductCall, jewelryType, filtersData, isObjectEmpty(filters), 'isProductCall');
    if (isProductCall) {
      if (jewelryType && filtersData) {
        // Absorb the first filtersData change that follows a warm mount (URL-derived
        // setFilterData produces a new object reference with identical values).
        if (skipNextFilterRefetchRef.current) {
          skipNextFilterRefetchRef.current = false;
          return;
        }
        if (isObjectEmpty(filters)) {
          if (collectionType) {
            dispatch(
              fetchProductsFilterList({
                type: jewelryType,
                collection: collectionType ?? null,
              }),
            );
          } else {
            dispatch(
              fetchProductsFilterList({
                type: jewelryType,
                collection: null,
              }),
            );
          }
        }
        dispatch(setCurrentPage(1));
        // set currentPage == 1 on change of any filterData
        if (collectionType && previousCollectionType.current !== collectionType) {
          handleApiCall({ jewelryType, filtersData, currentPage: 1, pageSize, collectionType, listKey: currentListKey });
        } else {
          handleApiCall({ jewelryType, filtersData, currentPage: 1, pageSize, listKey: currentListKey });
        }
      }
    }
  }, [filtersData, jewelryType]);

  const IdFilter = (arr: string) => {
    return masterData
      ?.filter((item: any) =>
        arr
          ?.split(',')
          ?.map((el: string) => el.toUpperCase())
          ?.includes(item?.code),
      )
      .map((el: any) => el.id);
  };
  const ShapeFilter = (arr: string) => {
    return masterData
      ?.filter(
        (item: any) =>
          item?.parent_code == 'SHAPE' &&
          arr
            ?.split(',')
            ?.map((el: string) => el.toLowerCase())
            // The filter writes shape names (`marquise`), but hand-written links also use codes (`mq`).
            ?.some((el: string) => el === item?.name?.toLowerCase() || el === item?.code?.toLowerCase()),
      )
      .map((el: any) => el.id);
  };
  const SubtypeIdFilter = (arr: string) => {
    const seen = new Set<string>();
    return (arr?.split(',') ?? [])
      .map((token: string) => findSubTypesByParam(token, masterData, filters?.subTypes)?.[0]?.id)
      .filter((id: string | undefined): id is string => {
        if (!id || seen.has(id)) {
          return false;
        }
        seen.add(id);
        return true;
      });
  };

  const SpecialTitleIdFilter = (arr: string) => {
    return filters?.special_title
      ?.filter((item: any) =>
        arr
          ?.split(',')
          ?.map((el: string) => decodeURIComponent(el.replace(/\s+/g, '-')))
          ?.some((decodedTitle) => {
            const itemTitleFormatted = item.title?.replace(/\s+/g, '-');
            return decodedTitle === itemTitleFormatted;
          }),
      )
      ?.map((el: any) => el.id);
  };

  const diamondColorFind = (arr: string) => {
    const matchingItems = arr
      ?.split(',')
      .map((code) => {
        const parentCode = code.toUpperCase().slice(0, 2); // Assuming parent_code is 2 characters long
        const subCode = code.toUpperCase().slice(2); // Sub_code starts after the first 2 characters

        // Find the item that matches the parent_code and sub_code
        const item = masterData.find((el) => el.parent_code === parentCode && el.sub_code?.[0] === subCode);

        return item ? item.id : null; // Return the item id or null if not found
      })
      .filter((id) => id !== null);
    return matchingItems;
  };
  const genderFind = (value: string) => {
    switch (value) {
      case 'for_him':
        return 2;
      case 'for_her':
        return 3;
      default:
        return 1;
    }
  };

  useEffect(() => {
    if (filters && productFilter) {
      const caratMarks: SliderSingleProps['marks'] = {};
      filters.diamond_details?.forEach((obj) => {
        if (obj) {
          caratMarks[Number(obj?.weight)] = obj?.weight;
        }
      });
      setCaratWeight(caratMarks);
      const minCarat = Math.min(...Object.values(caratMarks as any).map(Number));
      const maxCarat = Math.max(...Object.values(caratMarks as any).map(Number));

      setSelectedFilters((prevFilters: any) => ({
        ...prevFilters,
        metal: metal ? IdFilter(metal) : [],
        shape: shape ? ShapeFilter(shape) : [],
        diamondColor: diamondColor ? diamondColorFind(diamondColor) : [],
        subTypes: subTypes ? SubtypeIdFilter(subTypes) : [],
        specialTitle: specialTitle ? SpecialTitleIdFilter(specialTitle) : [],
        gender: gender ? genderFind(gender) : 1,
        sort: sort ? sort : '',
        min_price: urlMinPrice ?? filters?.price_range?.min_price,
        max_price: urlMaxPrice ?? filters?.price_range?.max_price,
        min_carat: carat ? Number(carat?.split('-')?.[0]) : minCarat,
        max_carat: carat ? Number(carat?.split('-')?.[1]) : maxCarat,
      }));

      dispatch(
        setFilterData({
          ...filtersData,
          metal: metal ? IdFilter(metal) : [],
          shape: shape ? ShapeFilter(shape) : [],
          diamond_color: diamondColor ? diamondColorFind(diamondColor) : [],
          subTypes: subTypes ? SubtypeIdFilter(subTypes) : [],
          specialTitle: specialTitle ? SpecialTitleIdFilter(specialTitle) : [],
          gender_category: gender ? genderFind(gender) : 1,
          sort_order: sort ? sort : '',
          min_price: urlMinPrice ?? filters?.price_range?.min_price,
          max_price: urlMaxPrice ?? filters?.price_range?.max_price,
          carats: carat ? carat?.split('-') : [],
          // min_carat: carat ? Number(carat?.split('-')?.[0]) : Math.min(...Object.keys(caratWeight as any).map(Number)),
          // max_carat: carat ? Number(carat?.split('-')?.[1]) : Math.max(...Object.keys(caratWeight as any).map(Number)),
        } as any),
      );
      // setSelectedFilters((prevFilters: any) => ({
      //   ...prevFilters,
      //   min_carat: Math.min(...Object.keys(caratWeight as any).map(Number)),
      //   max_carat: Math.max(...Object.keys(caratWeight as any).map(Number)),
      // }));
    }
  }, [filters, productFilter, metal, shape, diamondColor, subTypes, specialTitle, gender, sort, price, carat]);

  useEffect(() => {
    if (products) {
      handleStateData(products);
    }
  }, [products]);

  useEffect(() => {
    const target = restoreTargetRef.current;
    if (!target || hasRestoredRef.current) {
      return;
    }
    if (isLoading || productsLoading) {
      return;
    }
    if (!chunkedData || chunkedData.length === 0) {
      return;
    }
    hasRestoredRef.current = true;
    restoreTargetRef.current = null;
    const y = target.scrollY;
    // Wait two frames so chunked rows (aspect-square placeholders) have laid out before we scroll.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo(0, y);
      });
    });
  }, [chunkedData, isLoading, productsLoading]);

  useEffect(() => {
    if (filtersData) {
      if (filtersData?.metal && filtersData?.metal?.length > 0) {
        setIsMetalOpen(true);
      }
      if (filtersData?.shape && filtersData?.shape?.length > 0) {
        setIsShapeOpen(true);
      }
      if (filtersData.diamond_color?.length > 0) {
        setIsDiamondColorOpen(true);
      }
      if (filtersData.carats?.length > 0) {
        setIsCaratWeightOpen(true);
      }
      if (filtersData.min_price || filtersData.max_price) {
        setIsPriceOpen(true);
      }
      if ((filtersData.specialTitle?.length ?? 0) > 0) {
        setSpecialTitleOpen(true);
      }
    }
  }, [filtersData]);
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    // console.log('start listning...');

    return () => {
      // console.log('stop listning...');
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  return (
    <div className="w-full bg-[#ffffff] ">
      {collectionType && (
        <div className="flex flex-col justify-center items-center">
          {collectionData?.desktop_image && (
            <div className={`${collectionData?.desktop_image ? 'h-fit max-h-[310px]' : ''} overflow-hidden sm:h-auto`}>
              <Image
                src={collectionData?.desktop_image}
                preview={false}
                alt="collection banner"
                className="object-cover h-[310px] w-full sm:hidden"
              />
            </div>
          )}
          {collectionData?.mobile_image && (
            <div className={`${collectionData?.desktop_image ? 'h-fit max-h-[310px]' : ''} overflow-hidden sm:h-auto hidden sm:block`}>
              <Image
                src={collectionData?.mobile_image}
                preview={false}
                alt="collection banner"
                className="hidden object-cover h-[310px] w-full sm:block"
              />
            </div>
          )}
          <h4
            className={`py-4 text-4xl sm:text-3xl ${collectionData?.desktop_image ? 'mt-4' : '-mb-5'}${
              collectionData?.mobile_image ? 'sm:mt-2' : 'sm:-mt-5'
            } sm:py-2 capitalize`}
          >
            {collectionData?.name}
          </h4>
        </div>
      )}
      <div className={`flex justify-center border-b border-solid border-[#3b3b3b] sm:hidden`}>
        <div
          className={`container-xs relative ${collectionType ? 'pb-5' : 'pb-14'} lg:pb-10 md:pb-5 mb-[22px] flex items-start justify-center 2xl:px-[50px] xl:px-[50px] lg:px-[30px] lg:gap-5 md:gap-3 md:px-5 sm:px-5`}
        >
          <div
            className={`sm:hidden sticky ${collectionType ? 'pt-5' : 'pt-6'} lg:pt-8 md:pt-5 top-0  flex flex-col items-start gap-[30px] md:!w-[33%] 2xl:w-[23%] xl:w-[26%] lg:gap-[30px] lg:w-[25%] pr-5 lg:pr-0 w-[20%]`}
          >
            {jewelryType !== 'all' && (
              <Text size="text5xl" as="p" className="uppercase">
                {isJewelryTypeExist(jewelryType as string)
                  ? jewelryType.toString()?.replace('-', ' ') && jewelryType == 'all'
                    ? null
                    : jewelryType.toString()?.replace('-', ' ')
                  : 'Collection'}
              </Text>
            )}
            <div
              className={`flex flex-col max-h-[95vh] min-h-[100vh] ${jewelryType == 'all' ? 'pb-[110px]' : 'pb-[170px]'} px-[2px] items-start gap-[20px] self-stretch overflow-y-scroll scrollbar-visible pr-5`}
            >
              <Text size="textxl" as="p" className="!font-normal ">
                <span>{counts ?? 0}</span> items
              </Text>
              <div className="flex flex-col gap-5 w-full lg:gap-5">
                {/* <div className="radio-group-plp">
                  <Radio.Group
                    className="flex flex-wrap justify-evenly lg:!grid lg:!grid-cols-3 lg:gap-0 gap-4 lg:!text-[10px]"
                    onChange={(e: RadioChangeEvent) => {
                      dispatch(
                        setFilterData({
                          ...filtersData,
                          gender_category: e.target.value,
                        }),
                      );
                    }}
                    value={filtersData.gender_category}
                  >
                    <Radio value={1} className="lg:my-auto lg:self-center lg:!text-[11px]">
                      BOTH
                    </Radio>
                    <Radio value={2} className="lg:my-auto lg:self-center lg:!text-[11px] lg:!pr-0">
                      FOR HIM
                    </Radio>
                    <Radio value={3} className="lg:my-auto lg:self-center lg:!text-[11px] lg:!pr-0">
                      FOR HER
                    </Radio>
                  </Radio.Group>
                </div> */}
                <div className="flex flex-col items-start gap-1 lg:gap-[1px] md:gap-1">
                  {/* PRICE */}
                  <div className="flex flex-col items-start gap-1 self-stretch relative">
                    <div
                      className="flex items-center justify-between gap-1 self-stretch cursor-pointer py-5"
                      onClick={() => setIsPriceOpen(!isPriceOpen)}
                    >
                      <Text size="textlg" as="p" className="font-light ">
                        PRICE
                      </Text>
                      {!isPriceOpen ? (
                        <HiPlus className=" h-[20px] w-[20px] cursor-pointer" onClick={() => setIsPriceOpen(!isPriceOpen)} />
                      ) : (
                        <FiMinus className=" h-[18px] w-[18px] cursor-pointer" onClick={() => setIsPriceOpen(!isPriceOpen)} />
                      )}
                    </div>
                    {isPriceOpen && (
                      <div className="w-full px-0 pb-4">
                        {/* Tablet: antd gives each box a fixed 90px, and with the currency signs the pair
                            needs ~200px — wider than this sidebar at 551-600px and 800-834px, so the max
                            box ran past the column edge. Here the two halves share the row instead. */}
                        <div className="flex justify-between [@media(min-width:551px)_and_(max-width:1024px)]:gap-2">
                          <div className="flex items-center gap-1 [@media(min-width:551px)_and_(max-width:1024px)]:min-w-0 [@media(min-width:551px)_and_(max-width:1024px)]:flex-1">
                            <p>{filters?.currency_symbol}</p>
                            <InputNumber
                              size="small"
                              className="[@media(min-width:551px)_and_(max-width:1024px)]:!w-full [@media(min-width:551px)_and_(max-width:1024px)]:min-w-0"
                              min={0}
                              max={filters?.price_range?.max_price}
                              style={{ color: 'black' }}
                              // prefix="$"
                              value={priceDraft.min !== undefined ? priceDraft.min : selectedFilters?.min_price}
                              onChange={(value: any) => handlePriceInputChange('min', value)}
                              onBlur={() => handlePriceInputCommit('min')}
                              onPressEnter={() => handlePriceInputCommit('min')}
                            />
                          </div>
                          <div className="flex items-center gap-1 [@media(min-width:551px)_and_(max-width:1024px)]:min-w-0 [@media(min-width:551px)_and_(max-width:1024px)]:flex-1">
                            <p>{filters?.currency_symbol}</p>
                            <InputNumber
                              size="small"
                              className="[@media(min-width:551px)_and_(max-width:1024px)]:!w-full [@media(min-width:551px)_and_(max-width:1024px)]:min-w-0"
                              min={0}
                              max={filters?.price_range?.max_price}
                              style={{ color: 'black' }}
                              // prefix="$"
                              // style={{ margin: "0 16px" }}
                              value={priceDraft.max !== undefined ? priceDraft.max : selectedFilters?.max_price}
                              onChange={(value: any) => handlePriceInputChange('max', value)}
                              onBlur={() => handlePriceInputCommit('max')}
                              onPressEnter={() => handlePriceInputCommit('max')}
                            />
                          </div>
                        </div>
                        <div className="w-full px-0">
                          <Slider
                            range
                            min={filters?.price_range?.min_price}
                            max={filters?.price_range?.max_price}
                            defaultValue={[filters?.price_range?.min_price, filters?.price_range?.max_price]}
                            value={[selectedFilters.min_price, selectedFilters.max_price]}
                            onChange={(value: any) => {
                              // setTimeout(() => {
                              setSelectedFilters((prevFilters: any) => ({
                                ...prevFilters,
                                min_price: value[0],
                                max_price: value[1],
                              }));
                              // }, 300);
                            }}
                            onChangeComplete={(value: any) => {
                              // setTimeout(() => {
                              handleFilterChange('price', value);
                              dispatch(
                                setFilterData({
                                  ...filtersData,
                                  min_price: value[0],
                                  max_price: value[1],
                                }),
                              );
                              // }, 300);
                            }}
                          />
                        </div>
                      </div>
                    )}
                    <div className="h-[1.5px] w-full bg-[#707070]" />
                  </div>
                  {/* ITEMS */}
                  <div className="flex flex-col items-start gap-1 self-stretch relative">
                    <div className="flex items-center justify-between gap-5 self-stretch cursor-pointer py-5" onClick={handleJewelryToggle}>
                      <Text size="textlg" as="p" className="font-light">
                        ITEM
                      </Text>
                      {!isItemsOpen ? (
                        <HiPlus className=" h-[20px] w-[20px] cursor-pointer" onClick={handleJewelryToggle} />
                      ) : (
                        <FiMinus className=" h-[18px] w-[18px] cursor-pointer" onClick={handleJewelryToggle} />
                      )}
                    </div>
                    {isItemsOpen && (
                      <div className="pb-4">
                        {filters?.jewelry_types && filters?.jewelry_types?.length !== 0 ? (
                          <div className="flex flex-col gap-3">
                            {filters?.jewelry_types?.map((item, index) => (
                              <Text
                                as="p"
                                key={index}
                                size="textmd"
                                className={`font-extralight tracking-[1px]  cursor-pointer ${
                                  jewelryType == item?.name?.toLowerCase()?.replace(/\s+/g, '-') ? '!font-bold !text-[#18381d]' : ''
                                }`}
                                onClick={() => {
                                  // dispatch(setShouldLoadList(true));
                                  router.push(
                                    collectionType
                                      ? `/${item?.name?.toLowerCase().replace(/\s+/g, '-')}?collections=${collectionData?.name?.toLowerCase().split(' ').join('-')}`
                                      : `/${item?.name?.toLowerCase().replace(/\s+/g, '-')}`,
                                  );
                                  dispatch(setCurrentPage(1));
                                  dispatch(setFilterLoadingFirst());
                                }}
                              >
                                {/* <Link
                                  href={
                                    collectionType
                                      ? `/${item?.name?.toLowerCase().replace(/\s+/g, '-')}?collections=${collectionData?.name?.toLowerCase().split(' ').join('-')}`
                                      : `/${item?.name?.toLowerCase().replace(/\s+/g, '-')}`
                                  }
                                  // scroll={false}
                                  key={index}
                                > */}
                                {item?.name}
                                {/* </Link> */}
                              </Text>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <Skeleton.Input active={true} size="small" />
                            <Skeleton.Input active={true} size="small" />
                            <Skeleton.Input active={true} size="small" />
                          </div>
                        )}
                      </div>
                    )}
                    <div className="h-[1.5px] w-full bg-[#707070]" />
                  </div>

                  {/* Special Title */}
                  <div className="flex flex-col items-start gap-1 self-stretch relative">
                    <div
                      className="flex items-center justify-between gap-5 self-stretch cursor-pointer py-5"
                      onClick={() => setSpecialTitleOpen(!isSpecialTitleOpen)}
                    >
                      <Text size="textlg" as="p" className="font-light ">
                        SPECIAL TITLE
                      </Text>
                      {!isSpecialTitleOpen ? (
                        <HiPlus className="h-[20px] w-[20px] cursor-pointer" onClick={() => setSpecialTitleOpen(!isSpecialTitleOpen)} />
                      ) : (
                        <FiMinus className="h-[18px] w-[18px] cursor-pointer" onClick={() => setSpecialTitleOpen(!isSpecialTitleOpen)} />
                      )}
                    </div>
                    {isSpecialTitleOpen && (
                      <div className="pb-4">
                        <div className="flex flex-col gap-3">
                          {/* Check if filters.special_title exists before mapping */}
                          {filters?.special_title && filters.special_title.length > 0 ? (
                            filters.special_title?.map((item: any, index: number) => {
                              const isSelected = filtersData?.specialTitle?.includes(item.id);
                              return (
                                <div key={index}>
                                  <Checkbox
                                    checked={isSelected}
                                    onClick={() => {
                                      dispatch(setLoadingFilterId(item?.id));
                                      const updatedSpecialTitles = isSelected
                                        ? filtersData?.specialTitle?.filter((titleId) => titleId !== item.id)
                                        : [...(filtersData?.specialTitle || []), item.id];

                                      handleFilterChange('specialTitle', updatedSpecialTitles);
                                      dispatch(
                                        setFilterData({
                                          ...filtersData,
                                          specialTitle: updatedSpecialTitles,
                                        }),
                                      );
                                    }}
                                  >
                                    <div className="flex items-center gap-2">
                                      <Text
                                        as="p"
                                        size="textmd"
                                        className={`font-extralight tracking-[1px] cursor-pointer ${isSelected ? '!font-bold text-[#18381d]' : ''}`}
                                      >
                                        {item?.title}
                                      </Text>{' '}
                                      {loadingFilterId === item?.id && <LuLoader className="h-4 w-4 animate-spin opacity-80" />}
                                    </div>
                                  </Checkbox>
                                </div>
                              );
                            })
                          ) : (
                            <Text as="p" size="textmd" className="font-extralight tracking-[1px] text-gray-500">
                              No special titles available
                            </Text>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="h-[1.5px] w-full bg-[#707070]" />
                  </div>

                  {/* METAL */}
                  <div className="flex flex-col items-start gap-1 self-stretch relative">
                    <div
                      className="flex items-center justify-between gap-5 self-stretch cursor-pointer py-5"
                      onClick={() => setIsMetalOpen(!isMetalOpen)}
                    >
                      <Text size="textlg" as="p" className="font-light ">
                        METAL
                      </Text>
                      {!isMetalOpen ? (
                        <HiPlus className=" h-[20px] w-[20px] cursor-pointer" onClick={() => setIsMetalOpen(!isMetalOpen)} />
                      ) : (
                        <FiMinus className=" h-[18px] w-[18px] cursor-pointer" onClick={() => setIsMetalOpen(!isMetalOpen)} />
                      )}
                    </div>
                    {isMetalOpen && (
                      <div className="pb-4">
                        <div className="flex flex-col gap-3">
                          {productFilter
                            ?.filter((obj: any) => filters?.metal_color_id?.includes(obj.id))
                            ?.map((item: any, index: number) => {
                              const isSelected = filtersData?.metal?.includes(item.id);
                              // const isSelected = selectedFilters?.metal?.includes(item.id);

                              return (
                                <div key={index}>
                                  <Checkbox
                                    checked={isSelected}
                                    onClick={() => {
                                      dispatch(setLoadingFilterId(item?.id));
                                      const updatedMetals = isSelected
                                        ? filtersData?.metal?.filter((metalId) => metalId !== item.id)
                                        : [...(filtersData?.metal || []), item.id];
                                      // setSelectedFilters({ ...selectedFilters, metal: updatedMetals });
                                      handleFilterChange('metal', updatedMetals);
                                      dispatch(
                                        setFilterData({
                                          ...filtersData,
                                          metal: updatedMetals,
                                        }),
                                      );
                                    }}
                                  >
                                    <div className="flex items-center gap-2">
                                      <Text
                                        as="p"
                                        size="textmd"
                                        className={`font-extralight tracking-[1px]  cursor-pointer ${isSelected ? '!font-bold text-[#18381d]' : ''}`}
                                      >
                                        {item?.name}
                                      </Text>{' '}
                                      {loadingFilterId == item?.id && <LuLoader className="h-4 w-4 animate-spin opacity-80" />}
                                    </div>
                                  </Checkbox>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                    <div className="h-[1.5px] w-full bg-[#707070]" />
                  </div>

                  {/* DIAMOND COLOR */}
                  <div className="flex flex-col items-start gap-1 self-stretch relative">
                    <div
                      className="flex items-center justify-between gap-5 self-stretch cursor-pointer py-5"
                      onClick={() => setIsDiamondColorOpen(!isDiamondColorOpen)}
                    >
                      <Text size="textlg" as="p" className="font-light ">
                        DIAMOND COLOR
                      </Text>
                      {!isDiamondColorOpen ? (
                        <HiPlus className=" h-[20px] w-[20px] cursor-pointer" onClick={() => setIsDiamondColorOpen(!isDiamondColorOpen)} />
                      ) : (
                        <FiMinus className=" h-[18px] w-[18px] cursor-pointer" onClick={() => setIsDiamondColorOpen(!isDiamondColorOpen)} />
                      )}
                    </div>
                    {isDiamondColorOpen && (
                      <div className="pb-4">
                        <div className="flex flex-col gap-3">
                          {productFilter
                            ?.filter((obj: any) => filters?.diamond_color_id?.includes(obj.id))
                            ?.map((item, index) => {
                              const isItemSelected = filtersData?.diamond_color?.includes(item.id);

                              return (
                                <Checkbox
                                  checked={isItemSelected}
                                  key={index}
                                  onClick={() => {
                                    dispatch(setLoadingFilterId(item?.id));
                                    const updatedColors = isItemSelected
                                      ? filtersData?.diamond_color?.filter((colorId) => colorId !== item.id)
                                      : [...(filtersData?.diamond_color || []), item.id];
                                    handleFilterChange('diamondColor', updatedColors);
                                    dispatch(
                                      setFilterData({
                                        ...filtersData,
                                        diamond_color: updatedColors,
                                      }),
                                    );
                                  }}
                                >
                                  <div className="flex items-center gap-2">
                                    <Text
                                      as="p"
                                      // key={index}
                                      size="textmd"
                                      // onClick={() => {
                                      //   const updatedColors = isItemSelected
                                      //     ? filtersData?.diamond_color?.filter(
                                      //         (colorId) => colorId !== item.id
                                      //       )
                                      //     : [
                                      //         ...(filtersData?.diamond_color || []),
                                      //         item.id,
                                      //       ];

                                      //   dispatch(
                                      //     setFilterData({
                                      //       ...filtersData,
                                      //       diamond_color: updatedColors,
                                      //     })
                                      //   );
                                      // }}
                                      className={` font-extralight tracking-[1px]  cursor-pointer ${isItemSelected ? '!font-semibold' : ''}`}
                                    >
                                      {item?.name}
                                    </Text>
                                    {loadingFilterId == item?.id && <LuLoader className="h-4 w-4 animate-spin opacity-80" />}
                                  </div>
                                </Checkbox>
                              );
                            })}
                        </div>
                      </div>
                    )}
                    <div className="h-[1.5px] w-full bg-[#707070]"></div>
                  </div>

                  {/* SHAPE */}
                  <div className="flex flex-col items-start gap-1  self-stretch relative">
                    <div
                      className="flex items-center justify-between gap-5 self-stretch cursor-pointer py-5"
                      onClick={() => setIsShapeOpen(!isShapeOpen)}
                    >
                      <Text size="textlg" as="p" className="font-light ">
                        SHAPE
                      </Text>
                      {!isShapeOpen ? (
                        <HiPlus className=" h-[20px] w-[20px] cursor-pointer" onClick={() => setIsShapeOpen(!isShapeOpen)} />
                      ) : (
                        <FiMinus className=" h-[18px] w-[18px] cursor-pointer" onClick={() => setIsShapeOpen(!isShapeOpen)} />
                      )}
                    </div>
                    {isShapeOpen && (
                      <div className="pb-4">
                        <div className="flex flex-col gap-3">
                          {productFilter
                            ?.filter((obj: any) => filters?.shape_id?.includes(obj.id))
                            ?.map((item, index) => {
                              const isItemSelected = filtersData?.shape?.includes(item.id);

                              return (
                                <Checkbox
                                  key={index}
                                  checked={isItemSelected}
                                  onClick={() => {
                                    dispatch(setLoadingFilterId(item?.id));
                                    const updatedShapes = isItemSelected
                                      ? filtersData?.shape?.filter((shapeId) => shapeId !== item.id)
                                      : [...(filtersData?.shape || []), item.id];
                                    handleFilterChange('shape', updatedShapes);
                                    dispatch(
                                      setFilterData({
                                        ...filtersData,
                                        shape: updatedShapes,
                                      }),
                                    );
                                  }}
                                >
                                  <div className="flex items-center gap-2">
                                    <Text
                                      as="p"
                                      size="textmd"
                                      className={` font-extralight tracking-[1px]  cursor-pointer ${isItemSelected ? '!font-semibold' : ''}`}
                                    >
                                      {item?.name}
                                    </Text>
                                    {loadingFilterId == item?.id && <LuLoader className="h-4 w-4 animate-spin opacity-80" />}
                                  </div>
                                </Checkbox>
                              );
                            })}
                        </div>
                      </div>
                    )}
                    <div className="h-[1.5px] w-full bg-[#707070]"></div>
                  </div>

                  {/* CARAT WEIGHT */}
                  <div className="flex flex-col items-start gap-1  self-stretch relative">
                    <div
                      className="flex items-center justify-between gap-5 self-stretch cursor-pointer py-5"
                      onClick={() => setIsCaratWeightOpen(!isCaratWeightOpen)}
                    >
                      <Text size="textlg" as="p" className="font-light ">
                        CARAT WEIGHT
                      </Text>
                      {!isCaratWeightOpen ? (
                        <HiPlus className=" h-[20px] w-[20px] cursor-pointer" onClick={() => setIsCaratWeightOpen(!isCaratWeightOpen)} />
                      ) : (
                        <FiMinus className=" h-[18px] w-[18px] cursor-pointer" onClick={() => setIsCaratWeightOpen(!isCaratWeightOpen)} />
                      )}
                    </div>
                    {isCaratWeightOpen && (
                      <div className="w-full px-2 pb-4">
                        {/* Same tablet treatment as the price row: the fixed-width boxes overflow the sidebar. */}
                        <div className="flex justify-between [@media(min-width:551px)_and_(max-width:1024px)]:gap-2">
                          <div className="flex items-center gap-1 [@media(min-width:551px)_and_(max-width:1024px)]:min-w-0 [@media(min-width:551px)_and_(max-width:1024px)]:flex-1">
                            <InputNumber
                              size="small"
                              className="[@media(min-width:551px)_and_(max-width:1024px)]:!w-full [@media(min-width:551px)_and_(max-width:1024px)]:min-w-0"
                              min={Math.min(...Object.keys(caratWeight as any).map(Number))}
                              max={Math.max(...Object.keys(caratWeight as any).map(Number))}
                              style={{ color: 'black' }}
                              step={0.01}
                              // prefix="$"
                              value={selectedFilters?.min_carat ?? Math.min(...Object.keys(caratWeight as any).map(Number))}
                              onChange={
                                (value: any) => {
                                  setSelectedFilters((prevFilters: any) => ({
                                    ...prevFilters,
                                    min_carat: value ?? 0,
                                    // max_price: value[1],
                                  }));
                                  handleFilterChange('carat', [value ?? 0, selectedFilters?.max_carat]);
                                  dispatch(
                                    setFilterData({
                                      ...filtersData,
                                      min_price: value ?? 0,
                                      // max_price: value[1],
                                    }),
                                  );
                                }
                                // console.log(value,"minprice")
                              }
                            />
                          </div>
                          <div className="flex items-center gap-1 [@media(min-width:551px)_and_(max-width:1024px)]:min-w-0 [@media(min-width:551px)_and_(max-width:1024px)]:flex-1">
                            <InputNumber
                              size="small"
                              className="[@media(min-width:551px)_and_(max-width:1024px)]:!w-full [@media(min-width:551px)_and_(max-width:1024px)]:min-w-0"
                              min={Math.min(...Object.keys(caratWeight as any).map(Number))}
                              max={Math.max(...Object.keys(caratWeight as any).map(Number))}
                              style={{ color: 'black' }}
                              step={0.01}
                              // prefix="$"
                              // style={{ margin: "0 16px" }}
                              value={selectedFilters?.max_carat ?? Math.max(...Object.keys(caratWeight as any).map(Number))}
                              onChange={
                                (value: any) => {
                                  setSelectedFilters((prevFilters: any) => ({
                                    ...prevFilters,
                                    // min_price: value[0],
                                    max_carat: value ?? Math.max(...Object.keys(caratWeight as any).map(Number)) ?? 0,
                                  }));
                                  handleFilterChange('carat', [
                                    selectedFilters?.min_carat,
                                    selectedFilters?.max_carat ?? Math.max(...Object.keys(caratWeight as any).map(Number)),
                                  ]);
                                  dispatch(
                                    setFilterData({
                                      ...filtersData,
                                      // min_price: value[0],
                                      max_price: value ?? Math.max(...Object.keys(caratWeight as any).map(Number)) ?? 0,
                                    }),
                                  );
                                }
                                // console.log(value,"maxprice")
                              }
                            />
                          </div>
                        </div>
                        <div className="w-full">
                          <Slider
                            // marks={caratWeight}
                            // included={true}
                            range
                            step={0.01}
                            defaultValue={[
                              Math.min(...Object.keys(caratWeight as any).map(Number)),
                              Math.max(...Object.keys(caratWeight as any).map(Number)),
                            ]}
                            value={[selectedFilters.min_carat, selectedFilters.max_carat]}
                            min={Math.min(...Object.keys(caratWeight as any).map(Number))}
                            max={Math.max(...Object.keys(caratWeight as any).map(Number))}
                            style={{ color: '#c5ccb4' }}
                            onChange={(value: any) => {
                              setSelectedFilters((prevFilters: any) => ({
                                ...prevFilters,
                                min_carat: value[0],
                                max_carat: value[1],
                              }));
                            }}
                            onChangeComplete={(value: any) => {
                              handleFilterChange('carat', value);
                              handleSliderChange(value);
                            }}
                          />
                        </div>
                      </div>
                    )}
                    <div className="h-[1.5px] w-full bg-[#707070]" />
                  </div>

                  {/* GENDER  */}
                  <div className="flex flex-col items-start gap-1  self-stretch relative">
                    <div className="radio-group-plp py-6">
                      <Radio.Group
                        className="flex flex-wrap justify-evenly lg:!grid lg:!grid-cols-3 lg:gap-0 gap-4 lg:!text-[10px]"
                        onChange={(e: RadioChangeEvent) => {
                          handleFilterChange('gender', e.target.value);
                          dispatch(
                            setFilterData({
                              ...filtersData,
                              gender_category: e.target.value,
                            }),
                          );
                        }}
                        value={filtersData.gender_category}
                      >
                        <Radio value={1} className="lg:my-auto lg:self-center lg:!text-[11px]">
                          BOTH
                        </Radio>
                        <Radio value={2} className="lg:my-auto lg:self-center lg:!text-[11px] lg:!pr-0">
                          FOR HIM
                        </Radio>
                        <Radio value={3} className="lg:my-auto lg:self-center lg:!text-[11px] lg:!pr-0">
                          FOR HER
                        </Radio>
                      </Radio.Group>
                    </div>
                    {/* <div className="h-[1.5px] w-full bg-[#707070]" /> */}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={`flex flex-col w-[75%] gap-4 self-start lg:gap-6 2xl:w-4/5 xl:w-4/5 lg:w-[75%] md:w-[67%] sm:w-full relative`}>
            <div
              className={`ml-8  ${collectionType ? 'pt-5' : 'pt-6'} lg:pt-5 md:pt-5 sm:pt-3 top-0 z-[10] bg-white flex flex-col items-start gap-[10px] lg:gap-[10px] lg:ml-0  xl:gap-[10px] `}
            >
              <div className="flex gap-4 lg:gap-3 2xl:gap-3 md:gap-1 self-stretch min-h-10 md:flex-col">
                <div className="flex w-full flex-col gap-3 self-stretch mt-[10px]">
                  <div className="relative w-full">
                    <div className="w-[96%] lg:w-[95%] mx-auto">
                      <Swiper
                        key={`subtype-desk-${String(jewelryType)}-${collectionType ?? ''}`}
                        modules={[Virtual, Navigation, Pagination]}
                        onSwiper={(swiper) => {
                          setSwiperRefDesk(swiper);
                        }}
                        onSlideChange={(swiper) => {
                          // Update states on slide change
                          setIsBeginning(swiper.isBeginning);
                          setIsEnd(swiper.isEnd);
                        }}
                        slidesPerView={
                          windowWidth < 640
                            ? 2 // sm
                            : windowWidth <= 768
                              ? 4 // md
                              : windowWidth <= 1024
                                ? 5 // lg
                                : windowWidth < 1536
                                  ? 6 // xl
                                  : 7 // 2xl
                        }
                        spaceBetween={10}
                        pagination={{
                          type: 'fraction',
                        }}
                        navigation={{
                          prevEl: prevRefDesk.current,
                          nextEl: nextRefDesk.current,
                        }}
                        virtual
                        className="subtype-swiper !px-0"
                      >
                        {filters?.subTypes?.map((item, index) => (
                          <SwiperSlide key={`${item.id}-${index}`} virtualIndex={index}>
                            <div
                              className={`flex items-center flex-col justify-center cursor-pointer group overflow-hidden`}
                              onClick={() => {
                                dispatch(setLoadingFilterId(item?.id));
                                // Trigger the external logic for filter apply
                                // Single selection: picking another subtype replaces the current one
                                const updatedStyles = filtersData.subTypes.includes(item?.id) ? [] : [item.id];
                                handleFilterChange('subTypes', updatedStyles);
                                dispatch(
                                  setFilterData({
                                    ...filtersData,
                                    subTypes: updatedStyles,
                                  }),
                                );
                              }}
                            >
                              <div
                                style={{ backgroundColor: '#f9f9f9' }}
                                className={`aspect-square relative min-w-[85%] w-[85%] p-3 lg:p-2 flex items-center justify-center bg-[#f9f9f9] ${loadingFilterId == item.id ? 'border-0' : 'border-2 group-hover:border-primary'}  group-hover:bg-[#f9f9f9] !overflow-hidden ${
                                  filtersData.subTypes.includes(item?.id) ? 'border-primary' : 'border-transparent'
                                } `}
                              >
                                <Image
                                  preview={false}
                                  className="object-cover !mix-blend-multiply box appliedstrips"
                                  fallback="/images/no_images.svg"
                                  style={{ mixBlendMode: 'multiply' }}
                                  src={productFilter.find((el: any) => el.id === item.id)?.image?.[0]}
                                  alt={productFilter.find((el: any) => el.id === item.id)?.name}
                                />
                                <div
                                  className={`box absolute top-0 w-full h-full border-0 ${
                                    loadingFilterId == item.id ? 'border-primary/20 appliedstrips' : 'border-transparent'
                                  } z-[0] !overflow-hidden`}
                                ></div>
                              </div>
                              <span className="text-[14px] line-clamp-2 font-normal py-2 xl:text-[13px] lg:text-[12px] text-center overflow-hidden px-0.5 lg:px-0.5">
                                {productFilter.find((el: any) => el.id === item.id)?.name}
                              </span>
                            </div>
                          </SwiperSlide>
                        ))}
                      </Swiper>
                    </div>
                    {!isLoading && (
                      <div className="absolute top-[40%] w-full flex justify-between items-center">
                        <button
                          ref={prevRefDesk}
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
                        <button
                          ref={nextRefDesk}
                          className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 py-1.5 px-0 ${isEnd ? 'opacity-30' : ''}`}
                          // onClick={() => {
                          //   console.log(swiperRef.activeIndex, swiperRef?.visibleSlidesIndexes, swiperRef.current);
                          //   if (swiperRef.current) {
                          //     swiperRef.current.slideNext();
                          //   }
                          // }}
                        >
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
                    )}
                  </div>
                </div>
              </div>
              <div className="flex sticky top-0 justify-end items-center w-full">
                <div className="flex relative w-[16%] md:pb-2 items-center justify-end gap-4 md:w-full self-start 2xl:gap-1 2xl:w-fit lg:w-1/5">
                  <Select
                    suffixIcon={<BsFilterLeft className="h-6 w-6 text-black" />}
                    placeholder={`SORT BY`}
                    options={dropDownOptions}
                    defaultValue={dropDownOptions[0]}
                    value={filtersData.sort_order}
                    onChange={(option: any) => {
                      setIsSortLoading(true);
                      setTimeout(() => {
                        handleFilterChange('sort', option);
                        dispatch(
                          setFilterData({
                            ...filtersData,
                            sort_order: option,
                          }),
                        );
                      }, 1000);
                    }}
                    className="sorting-selection w-[136px] !h-8 gap-2.5 !border-none !bg-transparent whitespace-nowrap placeholder:text-black text-[16px] lg:text-[14px] 2xl:gap-2"
                  />
                  {isFasterPopup && isFasterPopupShow && products?.length > 0 && (
                    <div className="absolute top-[50px] md:top-[139px] w-[276px]">
                      <div className="flex items-center relative bg-white gap-2 p-2 py-3 rounded-md shadow-[0px_0px_6px_rgba(0,0,0,0.2)] before:content-[''] before:rotate-45 before:absolute before:-top-[9px] before:right-[65px] before:border-t before:border-l  before:w-[16px] before:h-[16px] before:bg-white before:clip-path-[polygon(100%_0,0_0,100%_100%)]">
                        {/* Notch */}
                        {/* <div className="absolute -top-[6px] z-0 right-2 w-4 h-4 bg-white rotate-45 shadow-[0px_0px_6px_rgba(0,0,0,0.2)]"></div> */}
                        <div className="w-1/6 flex items-center justify-center">
                          <Image src={'/images/delivery.svg'} preview={false} alt="Delivery" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <p className="text-[16px]">Need it Faster?</p>
                          <p className="text-[12px]">
                            <span
                              className="underline cursor-pointer"
                              onClick={() => {
                                setIsSortLoading(true);
                                handleFilterChange('sort', 'fastdelivery');
                                dispatch(
                                  setFilterData({
                                    ...filtersData,
                                    sort_order: 'fastdelivery',
                                  }),
                                );
                                dispatch(setIsFasterPopup(false));
                              }}
                            >
                              Show me
                            </span>{' '}
                            what arrive the soonest.
                          </p>
                        </div>
                        <div className="absolute top-2 right-2 cursor-pointer" onClick={() => dispatch(setIsFasterPopup(false))}>
                          <RxCross2 />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="ml-8 flex flex-col items-center gap-[60px] lg:ml-0 md:ml-0 sm:gap-[30px]">
              <div className="flex flex-col gap-6 self-stretch">
                <div className="flex flex-col items-end gap-10">
                  {(isLoading || isSortLoading) && (
                    // scaletons
                    <>
                      <div className="w-full flex justify-center items-center">
                        <LuLoader className="h-10 w-10 animate-spin" />
                      </div>
                    </>
                  )}
                  {!isLoading && !isSortLoading && products?.length === 0 && (
                    <div className="ml-8 px-8 w-full flex flex-col items-center justify-center gap-[10px] lg:ml-0 md:ml-0 sm:gap-[30px] min-h-[30vh]">
                      <p className="text-[22px]">We found no results that match your search criteria.</p>
                      <p className="text-[22px]">
                        Please expand your search or
                        <span
                          className="inline underline cursor-pointer pl-1"
                          onClick={() => {
                            router.push(`/${jewelryType}`);
                            dispatch(
                              setFilterData({
                                ...filtersData,
                                metal: [],
                                shape: [],
                                diamond_color: [],
                                subTypes: [],
                                gender_category: 1,
                                sort_order: '',
                                min_price: filters?.price_range?.min_price,
                                max_price: filters?.price_range?.max_price,
                                carats: [],
                                // min_carat: carat ? Number(carat?.split('-')?.[0]) : Math.min(...Object.keys(caratWeight as any).map(Number)),
                                // max_carat: carat ? Number(carat?.split('-')?.[1]) : Math.max(...Object.keys(caratWeight as any).map(Number)),
                              }),
                            );
                            // handleApiCall({ jewelryType, filtersData, currentPage: 1, pageSize, collectionType });
                          }}
                        >
                          reset your filters
                        </span>
                        .
                      </p>
                    </div>
                  )}
                  {!isLoading && !isSortLoading && products?.length > 0 && (
                    <>
                      <div className="w-full flex flex-col items-center">
                        {chunkedData.map((chunk, index) => (
                          <ChunkComponent
                            key={index}
                            chunk={chunk}
                            index={index}
                            bannerData={PromotionalImages || []}
                            pageJewelryType={jewelryType as string}
                          />
                        ))}
                        {isLoadingMore && (
                          <div className="w-full flex justify-center items-center py-4">
                            <LuLoader className="h-8 w-8 animate-spin opacity-80" />
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* mobile screen */}
      <div className="sm:flex hidden justify-center border-b border-solid border-[#3b3b3b] py-14 lg:py-10 md:py-5 sm:py-4">
        <div className="container-xs flex flex-col px-5 sm:px-3">
          <div className="flex items-start justify-between flex-wrap">
            {!collectionData?.name && (
              <Text size="text5xl" as="p" className="uppercase pb-2 ">
                {isJewelryTypeExist(jewelryType as string)
                  ? jewelryType.toString()?.replace('-', ' ') && jewelryType == 'all'
                    ? ''
                    : jewelryType.toString()?.replace('-', ' ')
                  : 'Collection'}
              </Text>
            )}
            <div className=" flex gap-3 items-start justify-between w-full ">
              <div className=" sm:min-w-[96px] px-[11px] py-[4.5px] flex items-center justify-center gap-0" onClick={handleMenuToggle}>
                <p className="capitalize tracking-[1px] text-[14px] flex gap-2">Filter</p>
                <div>
                  <RiFilter2Line className="h-6 w-6 p-0.5" />
                </div>
              </div>
              <div className="relative">
                <Select
                  suffixIcon={<BsFilterLeft className="h-6 w-6 text-black" />}
                  placeholder={`SORT BY`}
                  defaultValue={dropDownOptions[0]}
                  options={dropDownOptions}
                  value={filtersData.sort_order}
                  onChange={(option: any) => {
                    setIsSortLoading(true);
                    setTimeout(() => {
                      handleFilterChange('sort', option);
                      dispatch(
                        setFilterData({
                          ...filtersData,
                          sort_order: option,
                        }),
                      );
                    }, 1000);
                  }}
                  className="sorting-selection gap-2.5 whitespace-nowrap placeholder:!text-black text-[16px] lg:text-[14px] 2xl:gap-2 sm:!h-[29px] sm:min-w-[110px] sm:placeholder:text-[14px]"
                />
                {isFasterPopup && isFasterPopupShow && products?.length > 0 && (
                  <div className="absolute top-[45px] right-0 z-[11] w-[276px]">
                    <div className="flex items-center relative bg-white gap-2 p-2 py-3 rounded-md shadow-[0px_0px_6px_rgba(0,0,0,0.2)] before:content-[''] before:rotate-45 before:absolute before:-top-[9px] before:right-[65px] before:border-t before:border-l  before:w-[16px] before:h-[16px] before:bg-white before:clip-path-[polygon(100%_0,0_0,100%_100%)]">
                      <div className="w-1/6 flex items-center justify-center">
                        <Image src={'/images/delivery.svg'} preview={false} alt="Delivery" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <p className="text-[16px]">Need it Faster?</p>
                        <p className="text-[12px]">
                          <span
                            className="underline cursor-pointer"
                            onClick={() => {
                              setIsSortLoading(true);
                              handleFilterChange('sort', 'fastdelivery');
                              dispatch(
                                setFilterData({
                                  ...filtersData,
                                  sort_order: 'fastdelivery',
                                }),
                              );
                              dispatch(setIsFasterPopup(false));
                            }}
                          >
                            Show me
                          </span>{' '}
                          what arrive the soonest.
                        </p>
                      </div>
                      <div className="absolute top-2 right-2 cursor-pointer" onClick={() => dispatch(setIsFasterPopup(false))}>
                        <RxCross2 />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* filters sideMenu started */}
          {isMenuOpen && (
            <div
              className={`fixed top-0 left-0 inset-0 bg-gray-800 bg-opacity-75 z-[1052] transition-all duration-500 ease-in-out ${
                isMenuOpen ? 'translate-y-0' : 'translate-y-full'
              }`}
              style={{ width: '100%', height: '100vh' }}
            >
              <div className="relative modal-content bg-white h-full p-5 sm:px-3 overflow-auto">
                <div className="relative flex w-full flex-col items-start gap-[26px] self-stretch max-h-[94dvh]">
                  <div className="flex justify-between items-center w-full">
                    <Text size="text5xl" as="p" className="uppercase !text-[18px]">
                      Filter By
                    </Text>
                    <div>
                      <RxCross2 className="h-5 w-5" onClick={handleMenuToggle} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-6 w-full px-2 pb-[85px] overflow-scroll">
                    <Radio.Group
                      className="flex gap-4"
                      onChange={(e: RadioChangeEvent) => {
                        dispatch(
                          setFilterData({
                            ...filtersData,
                            gender_category: e.target.value,
                          }),
                        );
                      }}
                      value={filtersData.gender_category}
                    >
                      <Radio value={1}>BOTH</Radio>
                      <Radio value={2}>FOR HIM</Radio>
                      <Radio value={3}>FOR HER</Radio>
                    </Radio.Group>
                    <div className="flex flex-col items-start gap-[16px]">
                      {/* ITEM */}
                      <div className="flex flex-col items-start gap-5 self-stretch w-full">
                        <div className="flex items-center justify-between gap-5 self-stretch" onClick={handleJewelryToggle}>
                          <Text size="textxl" as="p" className="!text-[14px]">
                            ITEM
                          </Text>
                          {!isItemsOpen ? (
                            <HiPlus className=" h-[20px] w-[20px] cursor-pointer" onClick={handleJewelryToggle} />
                          ) : (
                            <FiMinus className=" h-[18px] w-[18px] cursor-pointer" onClick={handleJewelryToggle} />
                          )}
                        </div>
                        {isItemsOpen && (
                          <div>
                            {filters?.jewelry_types && filters?.jewelry_types?.length !== 0 ? (
                              <div className="flex flex-col gap-3">
                                {filters?.jewelry_types?.map((item, index) => (
                                  <Text
                                    as="p"
                                    key={index}
                                    size="textmd"
                                    className={` font-extralight tracking-[1px]  cursor-pointer ${
                                      jewelryType == item?.name?.toLowerCase()?.replace(/\s+/g, '-') ? '!font-semibold' : ''
                                    }`}
                                    onClick={() => {
                                      dispatch(setCurrentPage(1));
                                    }}
                                  >
                                    <Link href={`/${item?.name?.toLowerCase().replace(/\s+/g, '-')}`} key={index}>
                                      {item?.name}
                                    </Link>
                                  </Text>
                                ))}
                              </div>
                            ) : (
                              <div className="flex flex-col gap-2">
                                <Skeleton.Input active={true} size="small" />
                                <Skeleton.Input active={true} size="small" />
                                <Skeleton.Input active={true} size="small" />
                              </div>
                            )}
                          </div>
                        )}
                        <div className="h-[1.5px] w-[100%] bg-[#707070]" />
                      </div>
                      {/* Special Title */}

                      <div className="flex flex-col items-start gap-6 md:gap-5 self-stretch relative">
                        <div
                          className="flex items-center justify-between gap-5 self-stretch"
                          onClick={() => setSpecialTitleOpen(!isSpecialTitleOpen)}
                        >
                          <Text size="textxl" as="p" className="!text-[14px] ">
                            SPECIAL TITLE
                          </Text>
                          {!isSpecialTitleOpen ? (
                            <HiPlus className="h-[20px] w-[20px] cursor-pointer" onClick={() => setSpecialTitleOpen(!isSpecialTitleOpen)} />
                          ) : (
                            <FiMinus className="h-[18px] w-[18px] cursor-pointer" onClick={() => setSpecialTitleOpen(!isSpecialTitleOpen)} />
                          )}
                        </div>
                        {isSpecialTitleOpen && (
                          <div className="">
                            <div className="flex flex-col gap-1">
                              {filters?.special_title && filters.special_title.length > 0 ? (
                                filters.special_title?.map((item: any, index: number) => {
                                  const isSelected = filtersData?.specialTitle?.includes(item.id);
                                  return (
                                    <Checkbox
                                      key={index}
                                      checked={isSelected}
                                      onClick={() => {
                                        const updatedSpecialTitles = isSelected
                                          ? filtersData?.specialTitle?.filter((titleId) => titleId !== item.id)
                                          : [...(filtersData?.specialTitle || []), item.id];

                                        handleFilterChange('specialTitle', updatedSpecialTitles);
                                        dispatch(
                                          setFilterData({
                                            ...filtersData,
                                            specialTitle: updatedSpecialTitles,
                                          }),
                                        );
                                      }}
                                    >
                                      <Text
                                        as="p"
                                        size="textmd"
                                        className={`font-extralight tracking-[1px] cursor-pointer ${isSelected ? '!font-semibold' : ''}`}
                                      >
                                        {item?.title}
                                      </Text>
                                    </Checkbox>
                                  );
                                })
                              ) : (
                                <Text as="p" size="textmd" className="font-extralight tracking-[1px] text-gray-500">
                                  No special titles available
                                </Text>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="h-[1.5px] w-full bg-[#707070]" />
                      </div>

                      {/* METAL */}
                      <div className="flex flex-col items-start gap-6 md:gap-5 self-stretch relative">
                        <div className="flex items-center justify-between gap-5 self-stretch" onClick={() => setIsMetalOpen(!isMetalOpen)}>
                          <Text size="textxl" as="p" className="!text-[14px] ">
                            METAL
                          </Text>
                          {!isMetalOpen ? (
                            <HiPlus className=" h-[20px] w-[20px] cursor-pointer" onClick={() => setIsMetalOpen(!isMetalOpen)} />
                          ) : (
                            <FiMinus className=" h-[18px] w-[18px] cursor-pointer" onClick={() => setIsMetalOpen(!isMetalOpen)} />
                          )}
                        </div>
                        {isMetalOpen && (
                          <div className="">
                            <div className="flex flex-col gap-1">
                              {productFilter
                                ?.filter((obj: any) => filters?.metal_color_id?.includes(obj.id))
                                ?.map((item: any, index: number) => {
                                  const isSelected = filtersData?.metal?.includes(item.id);

                                  return (
                                    <Checkbox
                                      key={index}
                                      checked={isSelected}
                                      onClick={() => {
                                        const updatedMetals = isSelected
                                          ? filtersData?.metal?.filter((metalId) => metalId !== item.id)
                                          : [...(filtersData?.metal || []), item.id];
                                        handleFilterChange('metal', updatedMetals);

                                        dispatch(
                                          setFilterData({
                                            ...filtersData,
                                            metal: updatedMetals,
                                          }),
                                        );
                                      }}
                                    >
                                      <Text
                                        as="p"
                                        size="textmd"
                                        className={` font-extralight tracking-[1px]  cursor-pointer ${isSelected ? '!font-semibold' : ''}`}
                                      >
                                        {item?.name}
                                      </Text>
                                    </Checkbox>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                        <div className="h-[1.5px] w-full bg-[#707070]" />
                      </div>
                      {/* DIAMOND COLOR */}
                      <div className="flex flex-col items-start gap-6 md:gap-5 self-stretch relative">
                        <div
                          className="flex items-center justify-between gap-5 self-stretch"
                          onClick={() => setIsDiamondColorOpen(!isDiamondColorOpen)}
                        >
                          <Text size="textxl" as="p" className="!text-[14px]">
                            DIAMOND COLOR
                          </Text>
                          {!isDiamondColorOpen ? (
                            <HiPlus className=" h-[20px] w-[20px] cursor-pointer" onClick={() => setIsDiamondColorOpen(!isDiamondColorOpen)} />
                          ) : (
                            <FiMinus className=" h-[18px] w-[18px] cursor-pointer" onClick={() => setIsDiamondColorOpen(!isDiamondColorOpen)} />
                          )}
                        </div>
                        {isDiamondColorOpen && (
                          <div className="">
                            <div className="flex flex-col gap-1">
                              {productFilter
                                ?.filter((obj: any) => filters?.diamond_color_id?.includes(obj.id))
                                ?.map((item, index) => {
                                  const isItemSelected = filtersData?.diamond_color?.includes(item.id);

                                  return (
                                    <Checkbox
                                      key={index}
                                      checked={isItemSelected}
                                      onClick={() => {
                                        const updatedColors = isItemSelected
                                          ? filtersData?.diamond_color?.filter((colorId) => colorId !== item.id)
                                          : [...(filtersData?.diamond_color || []), item.id];
                                        handleFilterChange('diamondColor', updatedColors);
                                        dispatch(
                                          setFilterData({
                                            ...filtersData,
                                            diamond_color: updatedColors,
                                          }),
                                        );
                                      }}
                                    >
                                      <Text
                                        as="p"
                                        size="textmd"
                                        className={` font-extralight tracking-[1px]  cursor-pointer ${isItemSelected ? '!font-semibold' : ''}`}
                                      >
                                        {item?.name}
                                      </Text>
                                    </Checkbox>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                        <div className="h-[1.5px] w-full bg-[#707070]" />
                      </div>
                      {/* SHAPE */}
                      <div className="flex flex-col items-start gap-6 md:gap-5 self-stretch relative">
                        <div className="flex items-center justify-between gap-5 self-stretch" onClick={() => setIsShapeOpen(!isShapeOpen)}>
                          <Text size="textxl" as="p" className="!text-[14px]">
                            SHAPE
                          </Text>
                          {!isShapeOpen ? (
                            <HiPlus className=" h-[20px] w-[20px] cursor-pointer" onClick={() => setIsShapeOpen(!isShapeOpen)} />
                          ) : (
                            <FiMinus className=" h-[18px] w-[18px] cursor-pointer" onClick={() => setIsShapeOpen(!isShapeOpen)} />
                          )}
                        </div>
                        {isShapeOpen && (
                          <div className="">
                            <div className="flex flex-col gap-1">
                              {productFilter
                                ?.filter((obj: any) => filters?.shape_id?.includes(obj.id))
                                ?.map((item, index) => {
                                  const isItemSelected = filtersData?.shape?.includes(item.id);

                                  return (
                                    <Checkbox
                                      key={index}
                                      checked={isItemSelected}
                                      onClick={() => {
                                        const updatedShapes = isItemSelected
                                          ? filtersData?.shape?.filter((shapeId) => shapeId !== item.id)
                                          : [...(filtersData?.shape || []), item.id];
                                        handleFilterChange('shape', updatedShapes);
                                        dispatch(
                                          setFilterData({
                                            ...filtersData,
                                            shape: updatedShapes,
                                          }),
                                        );
                                      }}
                                    >
                                      <Text
                                        as="p"
                                        size="textmd"
                                        className={` font-extralight tracking-[1px]  cursor-pointer ${isItemSelected ? '!font-semibold' : ''}`}
                                      >
                                        {item?.name}
                                      </Text>
                                    </Checkbox>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                        <div className="h-[1.5px] w-full bg-[#707070]" />
                      </div>
                      {/* CARAT WEIGHT */}
                      <div className="flex flex-col items-start gap-6 md:gap-5 self-stretch relative">
                        <div
                          className="flex items-center justify-between gap-5 self-stretch"
                          onClick={() => setIsCaratWeightOpen(!isCaratWeightOpen)}
                        >
                          <Text size="textxl" as="p" className="!text-[14px]">
                            CARAT WEIGHT
                          </Text>
                          {!isCaratWeightOpen ? (
                            <HiPlus className=" h-[20px] w-[20px] cursor-pointer" onClick={() => setIsCaratWeightOpen(!isCaratWeightOpen)} />
                          ) : (
                            <FiMinus className=" h-[18px] w-[18px] cursor-pointer" onClick={() => setIsCaratWeightOpen(!isCaratWeightOpen)} />
                          )}
                        </div>
                        {isCaratWeightOpen && (
                          <div className="w-full px-2 pb-4">
                            <div className="flex justify-between">
                              <div className="flex items-center gap-1">
                                <InputNumber
                                  size="small"
                                  min={Math.min(...Object.keys(caratWeight as any).map(Number))}
                                  max={Math.max(...Object.keys(caratWeight as any).map(Number))}
                                  style={{ color: 'black' }}
                                  step={0.01}
                                  // prefix="$"
                                  value={selectedFilters?.min_carat ?? Math.min(...Object.keys(caratWeight as any).map(Number))}
                                  onChange={
                                    (value: any) => {
                                      setSelectedFilters((prevFilters: any) => ({
                                        ...prevFilters,
                                        min_carat: value ?? 0,
                                        // max_price: value[1],
                                      }));
                                      handleFilterChange('carat', [value ?? 0, selectedFilters?.max_carat]);
                                      dispatch(
                                        setFilterData({
                                          ...filtersData,
                                          min_price: value ?? 0,
                                          // max_price: value[1],
                                        }),
                                      );
                                    }
                                    // console.log(value,"minprice")
                                  }
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <InputNumber
                                  size="small"
                                  min={Math.min(...Object.keys(caratWeight as any).map(Number))}
                                  max={Math.max(...Object.keys(caratWeight as any).map(Number))}
                                  style={{ color: 'black' }}
                                  step={0.01}
                                  // prefix="$"
                                  // style={{ margin: "0 16px" }}
                                  value={selectedFilters?.max_carat ?? Math.max(...Object.keys(caratWeight as any).map(Number))}
                                  onChange={
                                    (value: any) => {
                                      setSelectedFilters((prevFilters: any) => ({
                                        ...prevFilters,
                                        // min_price: value[0],
                                        max_carat: value ?? Math.max(...Object.keys(caratWeight as any).map(Number)) ?? 0,
                                      }));
                                      handleFilterChange('carat', [
                                        selectedFilters?.min_carat,
                                        selectedFilters?.max_carat ?? Math.max(...Object.keys(caratWeight as any).map(Number)),
                                      ]);
                                      dispatch(
                                        setFilterData({
                                          ...filtersData,
                                          // min_price: value[0],
                                          max_price: value ?? Math.max(...Object.keys(caratWeight as any).map(Number)) ?? 0,
                                        }),
                                      );
                                    }
                                    // console.log(value,"maxprice")
                                  }
                                />
                              </div>
                            </div>
                            <div className="w-full">
                              <Slider
                                // marks={caratWeight}
                                // included={true}
                                range
                                step={0.01}
                                defaultValue={[
                                  Math.min(...Object.keys(caratWeight as any).map(Number)),
                                  Math.max(...Object.keys(caratWeight as any).map(Number)),
                                ]}
                                value={[selectedFilters.min_carat, selectedFilters.max_carat]}
                                min={Math.min(...Object.keys(caratWeight as any).map(Number))}
                                max={Math.max(...Object.keys(caratWeight as any).map(Number))}
                                style={{ color: '#c5ccb4' }}
                                onChange={(value: any) => {
                                  setSelectedFilters((prevFilters: any) => ({
                                    ...prevFilters,
                                    min_carat: value[0],
                                    max_carat: value[1],
                                  }));
                                }}
                                onChangeComplete={(value: any) => {
                                  handleFilterChange('carat', value);
                                  handleSliderChange(value);
                                }}
                              />
                            </div>
                          </div>
                        )}
                        <div className="h-[1.5px] w-full bg-[#707070]" />
                      </div>
                      {/* GEMSTONE */}

                      {/* PRICE */}
                      <div className="flex flex-col items-start gap-6 md:gap-5 self-stretch relative">
                        <div className="flex items-center justify-between gap-5 self-stretch" onClick={() => setIsPriceOpen(!isPriceOpen)}>
                          <Text size="textxl" as="p" className="!text-[14px]">
                            PRICE
                          </Text>
                          {!isPriceOpen ? (
                            <HiPlus className=" h-[20px] w-[20px] cursor-pointer" onClick={() => setIsPriceOpen(!isPriceOpen)} />
                          ) : (
                            <FiMinus className=" h-[18px] w-[18px] cursor-pointer" onClick={() => setIsPriceOpen(!isPriceOpen)} />
                          )}
                        </div>
                        {isPriceOpen && (
                          <div className="w-full px-2">
                            <div className="flex justify-between">
                              <div className="flex items-center gap-1">
                                <p>{filters?.currency_symbol}</p>
                                <InputNumber
                                  size="small"
                                  min={filters?.price_range?.min_price}
                                  max={filters?.price_range?.max_price}
                                  style={{ color: 'black' }}
                                  // prefix="$"
                                  inputMode="numeric"
                                  value={priceDraft.min !== undefined ? priceDraft.min : selectedFilters?.min_price}
                                  onChange={(value: any) => handlePriceInputChange('min', value)}
                                  onBlur={() => handlePriceInputCommit('min')}
                                  onPressEnter={() => handlePriceInputCommit('min')}
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <p>{filters?.currency_symbol}</p>
                                <InputNumber
                                  size="small"
                                  min={filters?.price_range?.min_price}
                                  max={filters?.price_range?.max_price}
                                  style={{ color: 'black' }}
                                  // prefix="$"
                                  // style={{ margin: "0 16px" }}
                                  inputMode="numeric"
                                  value={priceDraft.max !== undefined ? priceDraft.max : selectedFilters?.max_price}
                                  onChange={(value: any) => handlePriceInputChange('max', value)}
                                  onBlur={() => handlePriceInputCommit('max')}
                                  onPressEnter={() => handlePriceInputCommit('max')}
                                />
                              </div>
                            </div>
                            <div className="w-full px-4">
                              <Slider
                                range
                                min={filters?.price_range?.min_price}
                                max={filters?.price_range?.max_price}
                                defaultValue={[filters?.price_range?.min_price, filters?.price_range?.max_price]}
                                onChange={(value: any) => {
                                  handleFilterChange('price', value);
                                  dispatch(
                                    setFilterData({
                                      ...filtersData,
                                      min_price: value[0],
                                      max_price: value[1],
                                    }),
                                  );
                                }}
                              />
                            </div>
                          </div>
                        )}
                        <div className="h-[1.5px] w-full bg-[#707070]" />
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-0 flex justify-center w-full bg-white ">
                    <Button variant="solid" className="!min-w-full" onClick={handleMenuToggle}>
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* filters sideMenu ended */}
          <div className="flex w-[100%] flex-col gap-5 self-center sm:gap-4">
            <div className="flex flex-col items-start gap-[20px]">
              <div className="flex flex-col gap-3 self-stretch mt-[20px] sm:mt-[10px]">
                <div className="relative hidden sm:block w-full">
                  <div className="w-[85%] mx-auto">
                    <Swiper
                      key={`subtype-mob-${String(jewelryType)}-${collectionType ?? ''}`}
                      modules={[Virtual, Navigation, Pagination]}
                      onSwiper={(swiper) => {
                        setSwiperRef(swiper);
                      }}
                      onSlideChange={(swiper) => {
                        // Update states on slide change
                        setIsBeginning(swiper.isBeginning);
                        setIsEnd(swiper.isEnd);
                      }}
                      slidesPerView={4}
                      spaceBetween={2}
                      pagination={{
                        type: 'fraction',
                      }}
                      navigation={{
                        prevEl: prevRef.current,
                        nextEl: nextRef.current,
                      }}
                      virtual
                      className="subtype-swiper"
                    >
                      {filters?.subTypes?.map((item: any, index: number) => (
                        <SwiperSlide key={`${item.id}-${index}`} virtualIndex={index}>
                          <div
                            className={`flex items-center flex-col justify-center cursor-pointer group`}
                            onClick={() => {
                              dispatch(setLoadingFilterId(item?.id));
                              // Single selection: picking another subtype replaces the current one
                              const updatedStyles = filtersData.subTypes.includes(item?.id) ? [] : [item.id];
                              handleFilterChange('subTypes', updatedStyles);
                              dispatch(
                                setFilterData({
                                  ...filtersData,
                                  subTypes: updatedStyles,
                                }),
                              );
                            }}
                          >
                            <div
                              className={`relative aspect-square min-w-[90%] w-[90%] p-3 lg:p-2 flex items-center justify-center bg-[#f9f9f9] ${loadingFilterId == item.id ? 'border-0' : 'border'} ${
                                filtersData.subTypes.includes(item?.id) ? 'border-primary' : 'border-transparent'
                              }`}
                            >
                              <Image
                                preview={false}
                                className="object-cover !mix-blend-multiply"
                                style={{ mixBlendMode: 'multiply' }}
                                fallback="/images/no_images.svg"
                                src={productFilter.find((el: any) => el.id === item.id)?.image?.[0]}
                                alt={productFilter.find((el: any) => el.id === item.id)?.name}
                              />
                              <div
                                className={`box absolute top-0 w-full h-full border-0 ${
                                  loadingFilterId == item.id ? 'border-primary/20 appliedstrips' : 'border-transparent'
                                } z-[0] !overflow-hidden`}
                              ></div>
                            </div>
                            <span className="lg:text-[12px] text-center line-clamp-2 overflow-hidden px-0.5 pt-1">
                              {productFilter.find((el: any) => el.id === item.id)?.name}
                            </span>
                          </div>
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  </div>
                  {!isLoading && (
                    <div className="absolute top-[40%] w-full flex justify-between items-center">
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
                          className="w-6 h-6"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-[60px]">
              <div className="flex flex-col gap-6 self-stretch">
                <div className="flex flex-col items-end gap-10 sm:gap-2">
                  {(isLoading || isSortLoading) && (
                    <>
                      <div className="w-full flex min-h-[75vh] justify-center items-center relative">
                        <LuLoader className="h-10 w-10 animate-spin absolute top-[30%]" />
                      </div>
                    </>
                  )}

                  {!isLoading && !isSortLoading && products?.length === 0 && (
                    <div className="ml-8 w-full flex flex-col items-center pt-[10vh] gap-[60px] lg:ml-0 md:ml-0 sm:gap-[1px] min-h-[55vh]">
                      <p className="text-[15px] text-center">
                        We found no results that match your search criteria. Please expand your search or
                        <span
                          className="inline underline cursor-pointer pl-1 text-nowrap"
                          onClick={() => {
                            router.push(`/${jewelryType}`);
                            dispatch(
                              setFilterData({
                                ...filtersData,
                                metal: [],
                                shape: [],
                                diamond_color: [],
                                subTypes: [],
                                gender_category: 1,
                                sort_order: '',
                                min_price: filters?.price_range?.min_price,
                                max_price: filters?.price_range?.max_price,
                                carats: [],
                                // min_carat: carat ? Number(carat?.split('-')?.[0]) : Math.min(...Object.keys(caratWeight as any).map(Number)),
                                // max_carat: carat ? Number(carat?.split('-')?.[1]) : Math.max(...Object.keys(caratWeight as any).map(Number)),
                              }),
                            );
                            // handleApiCall({ jewelryType, filtersData, currentPage: 1, pageSize, collectionType });
                          }}
                        >
                          reset your filters
                        </span>
                        .
                      </p>
                    </div>
                  )}
                  {!isLoading && !isSortLoading && products?.length > 0 && (
                    <div className="w-full min-h-[50vh]">
                      {chunkedData.map((chunk, index) => (
                        <ChunkComponent
                          key={index}
                          chunk={chunk}
                          index={index}
                          bannerData={PromotionalImages || []}
                          pageJewelryType={jewelryType as string}
                        />
                      ))}
                      {isLoadingMore && (
                        <div className="w-full flex justify-center items-center py-4">
                          <LuLoader className="h-8 w-8 animate-spin" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
