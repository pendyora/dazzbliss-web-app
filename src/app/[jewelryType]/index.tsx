/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-case-declarations */
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { ConfigProvider, InputNumber, Select, Skeleton, Slider, SliderSingleProps } from 'antd';
import { debounce } from 'lodash';
import Link from 'next/link';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { LuLoader } from 'react-icons/lu';
import { RxCross2 } from 'react-icons/rx';

import useStaticHeader from '@/components/Header/useStaticHeader';
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
  setShouldLoadList,
  useAppDispatch,
  useAppSelector,
} from '@/store';
import { isObjectEmpty } from '@/utils/objectUtils';
import { findSubTypesByParam, subTypeCodeToParam } from '@/utils/subTypeParam';

import FilterDrawer, { DrawerSection, FilterGroup, FilterPanel, FilterPanelProps, plpTheme } from './FilterDrawer';
import PlpGrid, { PlpGridSkeleton } from './PlpGrid';

const SORT_OPTIONS = [
  { label: 'Featured', value: '' },
  { label: 'Price, high to low', value: 'hightolow' },
  { label: 'Price, low to high', value: 'lowtohigh' },
  { label: 'Fastest delivery', value: 'fastdelivery' },
];

const SHARED_LEDE = 'Set with lab-grown and ethically mined diamonds, certified at origin.';
const LEDE: Record<string, string> = {
  all: `Rings, earrings, necklaces and bracelets in recycled gold. ${SHARED_LEDE}`,
  'new-arrivals': `The newest pieces from our atelier, in recycled gold. ${SHARED_LEDE}`,
  rings: `Solitaires, bands and statement rings in recycled gold. ${SHARED_LEDE}`,
  'engagement-rings': `Engagement rings in recycled gold, made to be worn every day. ${SHARED_LEDE}`,
  'wedding-bands': `Wedding bands in recycled gold, from slim and polished to fully set. ${SHARED_LEDE}`,
  earrings: `Studs, hoops and drops in recycled gold. ${SHARED_LEDE}`,
  necklaces: `Pendants and chains in recycled gold. ${SHARED_LEDE}`,
  bracelets: `Tennis bracelets, chains and bangles in recycled gold. ${SHARED_LEDE}`,
  collection: `Recycled gold. ${SHARED_LEDE}`,
};

const GUTTER = 'px-[clamp(16px,3.2vw,56px)]';
const FILTER_URL_KEY: Record<FilterGroup, string> = {
  metal: 'metal',
  shape: 'shape',
  diamond_color: 'diamondColor',
  subTypes: 'subTypes',
  specialTitle: 'specialTitle',
};

const toTitle = (slug: string) =>
  slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

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

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerFocus, setDrawerFocus] = useState<DrawerSection | null>(null);
  // Desktop filter rail; hiding it widens the grid from 3 to 4 columns.
  const [showRail, setShowRail] = useState(true);
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
  const [isFasterPopupShow, setIsFasterPopupShow] = useState(false);
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
  const [collectionData, setCollectionData] = useState<any>();
  const previousCollectionType = useRef<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSortLoading, setIsSortLoading] = useState(false);
  const productsLoadingPrevRef = useRef<boolean>(productsLoading);
  // Clear the sort-change loader once the products fetch completes (true → false transition).
  useEffect(() => {
    if (productsLoadingPrevRef.current && !productsLoading && isSortLoading) {
      setIsSortLoading(false);
    }
    productsLoadingPrevRef.current = productsLoading;
  }, [productsLoading, isSortLoading]);

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

  const [productCards, setProductCards] = useState<any[]>([]);

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
    setProductCards(newData ?? []);
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
          currentParams.set('specialTitle', selectedTitles);
          if (!selectedTitles) {
            currentParams.delete('specialTitle');
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
    if (productCards.length === 0) {
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
  }, [productCards, isLoading, productsLoading]);

  // ───── Layout helpers ─────
  // This page has its own sticky filter bar, so the site header scrolls away here.
  useStaticHeader();

  const railRef = useRef<HTMLDivElement>(null);
  const [railEdges, setRailEdges] = useState({ atStart: true, atEnd: true });
  const updateRailEdges = useCallback(() => {
    const el = railRef.current;
    if (!el) {
      return;
    }
    setRailEdges({ atStart: el.scrollLeft <= 4, atEnd: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);
  useEffect(() => {
    updateRailEdges();
    window.addEventListener('resize', updateRailEdges);
    return () => window.removeEventListener('resize', updateRailEdges);
  }, [updateRailEdges, filters?.subTypes]);
  const scrollRail = (direction: 1 | -1) => {
    const el = railRef.current;
    el?.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  const openDrawer = (section: DrawerSection | null = null) => {
    setDrawerFocus(section);
    setDrawerOpen(true);
  };

  // ───── Filter actions ─────
  const toggleFilter = (group: FilterGroup, id: string) => {
    dispatch(setLoadingFilterId(id));
    const current: string[] = (filtersData as any)?.[group] ?? [];
    // Style (subTypes) is single selection: picking another style replaces the current one.
    const updated =
      group === 'subTypes' ? (current.includes(id) ? [] : [id]) : current.includes(id) ? current.filter((value) => value !== id) : [...current, id];
    handleFilterChange(FILTER_URL_KEY[group], updated);
    dispatch(setFilterData({ ...filtersData, [group]: updated }));
  };

  const removeParam = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    const query = decodeURIComponent(params.toString());
    router.replace(`/${jewelryType}${query ? `?${query}` : ''}`, { scroll: false });
  };

  const setGender = (value: number) => {
    if (value === 1) {
      removeParam('gender');
    } else {
      handleFilterChange('gender', value);
    }
    dispatch(setFilterData({ ...filtersData, gender_category: value }));
  };

  const changeSort = (value: string) => {
    setIsSortLoading(true);
    handleFilterChange('sort', value);
    dispatch(setFilterData({ ...filtersData, sort_order: value }));
  };

  const priceRange = filters?.price_range;
  const commitPrice = (value: number[]) => {
    setSelectedFilters((prev: any) => ({ ...prev, min_price: value[0], max_price: value[1] }));
    handleFilterChange('price', value);
    dispatch(setFilterData({ ...filtersData, min_price: value[0], max_price: value[1] }));
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
    commitPrice([minValue, maxValue]);
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
    const catalogueFloor = priceRange?.min_price ?? 0;
    const catalogueCeiling = priceRange?.max_price ?? 0;
    const editedMin = draftValue === null ? catalogueFloor : currentMax > 0 ? Math.min(draftValue, currentMax) : draftValue;
    const editedMax = draftValue === null ? catalogueCeiling : Math.max(draftValue, currentMin);
    const minValue = bound === 'min' ? editedMin : currentMin;
    const maxValue = bound === 'max' ? editedMax : currentMax;
    if (minValue === currentMin && maxValue === currentMax) {
      return;
    }
    commitPrice([minValue, maxValue]);
  };
  const resetPrice = () => {
    // Clears the slider range and any deep-link `min_price` floor in one navigation.
    const params = new URLSearchParams(searchParams.toString());
    params.delete('price');
    params.delete('min_price');
    const query = decodeURIComponent(params.toString());
    router.replace(`/${jewelryType}${query ? `?${query}` : ''}`, { scroll: false });
    setSelectedFilters((prev: any) => ({ ...prev, min_price: priceRange?.min_price, max_price: priceRange?.max_price }));
    dispatch(setFilterData({ ...filtersData, min_price: priceRange?.min_price, max_price: priceRange?.max_price }));
  };

  const caratValues = Object.keys(caratWeight ?? {}).map(Number);
  const caratMin = caratValues.length ? Math.min(...caratValues) : 0;
  const caratMax = caratValues.length ? Math.max(...caratValues) : 0;
  const commitCarat = (value: number[]) => {
    setSelectedFilters((prev: any) => ({ ...prev, min_carat: value[0], max_carat: value[1] }));
    handleFilterChange('carat', value);
    handleSliderChange(value);
  };
  const resetCarat = () => {
    removeParam('carat');
    setSelectedFilters((prev: any) => ({ ...prev, min_carat: caratMin, max_carat: caratMax }));
    dispatch(setFilterData({ ...filtersData, carats: [] }));
  };

  const clearAll = () => {
    const params = new URLSearchParams();
    if (collections) {
      params.set('collections', collections);
    }
    if (sort) {
      params.set('sort', sort);
    }
    const query = decodeURIComponent(params.toString());
    router.replace(`/${jewelryType}${query ? `?${query}` : ''}`, { scroll: false });
    dispatch(
      setFilterData({
        ...filtersData,
        metal: [],
        shape: [],
        diamond_color: [],
        subTypes: [],
        specialTitle: [],
        gender_category: 1,
        min_price: priceRange?.min_price,
        max_price: priceRange?.max_price,
        carats: [],
      }),
    );
  };

  // ───── Derived view data ─────
  const typeKey = String(jewelryType ?? '');
  const pageTitle = collectionType
    ? (collectionData?.name ?? 'Collection')
    : typeKey === 'all'
      ? 'Fine Jewelry'
      : isJewelryTypeExist(typeKey)
        ? toTitle(typeKey)
        : 'Collection';
  const lede = collectionType ? (collectionData?.description ?? LEDE.collection) : (LEDE[typeKey] ?? LEDE.all);
  const masterName = (id: string) => productFilter?.find((item: any) => item.id === id)?.name;
  const currency = filters?.currency_symbol ?? '';

  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  filtersData?.subTypes?.forEach((id) =>
    chips.push({ key: `st-${id}`, label: masterName(id) ?? 'Style', onRemove: () => toggleFilter('subTypes', id) }),
  );
  filtersData?.metal?.forEach((id) => chips.push({ key: `m-${id}`, label: masterName(id) ?? 'Metal', onRemove: () => toggleFilter('metal', id) }));
  filtersData?.shape?.forEach((id) => chips.push({ key: `sh-${id}`, label: masterName(id) ?? 'Shape', onRemove: () => toggleFilter('shape', id) }));
  filtersData?.diamond_color?.forEach((id) =>
    chips.push({ key: `dc-${id}`, label: `Color ${masterName(id) ?? ''}`.trim(), onRemove: () => toggleFilter('diamond_color', id) }),
  );
  filtersData?.specialTitle?.forEach((id) =>
    chips.push({
      key: `t-${id}`,
      label: filters?.special_title?.find((t) => t.id === id)?.title ?? 'Featured',
      onRemove: () => toggleFilter('specialTitle', id),
    }),
  );
  if (price || minPriceParam) {
    chips.push({ key: 'price', label: `${currency}${selectedFilters?.min_price} – ${currency}${selectedFilters?.max_price}`, onRemove: resetPrice });
  }
  if (carat) {
    chips.push({ key: 'carat', label: `${selectedFilters?.min_carat} – ${selectedFilters?.max_carat} ct`, onRemove: resetCarat });
  }
  if (filtersData?.gender_category && filtersData.gender_category !== 1) {
    chips.push({ key: 'gender', label: filtersData.gender_category === 2 ? 'For him' : 'For her', onRemove: () => setGender(1) });
  }

  const optionsFrom = (ids?: string[]) =>
    (productFilter ?? [])
      .filter((item: any) => ids?.includes(item.id))
      .map((item: any) => ({ id: item.id, name: item.name, image: item.image?.[0] }));

  const categories = (filters?.jewelry_types ?? []).map((item) => {
    const slug = item?.name?.toLowerCase().replace(/\s+/g, '-');
    return {
      name: item?.name,
      href: collectionType ? `/${slug}?collections=${collections}` : `/${slug}`,
      active: jewelryType == slug,
      onClick: () => {
        dispatch(setCurrentPage(1));
        dispatch(setFilterLoadingFirst());
      },
    };
  });

  const rangeLabel = 'grid flex-1 gap-1.5 text-[10.5px] uppercase tracking-[0.16em] text-ink-soft';
  const priceSlot = priceRange ? (
    <div>
      <div className="mb-1.5 flex justify-between gap-3">
        <label className={rangeLabel}>
          Min
          <InputNumber
            prefix={currency}
            min={priceRange.min_price}
            max={priceRange.max_price}
            value={priceDraft.min !== undefined ? priceDraft.min : selectedFilters?.min_price}
            onChange={(value) => handlePriceInputChange('min', value as number | null)}
            onBlur={() => handlePriceInputCommit('min')}
            onPressEnter={() => handlePriceInputCommit('min')}
            className="!w-full !bg-transparent tabular-nums"
          />
        </label>
        <label className={rangeLabel}>
          Max
          <InputNumber
            prefix={currency}
            min={priceRange.min_price}
            max={priceRange.max_price}
            value={priceDraft.max !== undefined ? priceDraft.max : selectedFilters?.max_price}
            onChange={(value) => handlePriceInputChange('max', value as number | null)}
            onBlur={() => handlePriceInputCommit('max')}
            onPressEnter={() => handlePriceInputCommit('max')}
            className="!w-full !bg-transparent tabular-nums"
          />
        </label>
      </div>
      <Slider
        range
        min={priceRange.min_price}
        max={priceRange.max_price}
        value={[selectedFilters.min_price, selectedFilters.max_price]}
        onChange={(value: number[]) => setSelectedFilters((prev: any) => ({ ...prev, min_price: value[0], max_price: value[1] }))}
        onChangeComplete={(value: number[]) => commitPrice(value)}
      />
    </div>
  ) : (
    <Skeleton.Input active size="small" block />
  );

  const caratSlot =
    caratValues.length > 1 ? (
      <div>
        <div className="mb-1.5 flex justify-between gap-3">
          <label className={rangeLabel}>
            From (ct)
            <InputNumber
              step={0.01}
              min={caratMin}
              max={caratMax}
              value={selectedFilters?.min_carat ?? caratMin}
              onChange={(value) => setSelectedFilters((prev: any) => ({ ...prev, min_carat: value ?? caratMin }))}
              onBlur={() => commitCarat([selectedFilters.min_carat ?? caratMin, selectedFilters.max_carat ?? caratMax])}
              onPressEnter={() => commitCarat([selectedFilters.min_carat ?? caratMin, selectedFilters.max_carat ?? caratMax])}
              className="!w-full !bg-transparent tabular-nums"
            />
          </label>
          <label className={rangeLabel}>
            To (ct)
            <InputNumber
              step={0.01}
              min={caratMin}
              max={caratMax}
              value={selectedFilters?.max_carat ?? caratMax}
              onChange={(value) => setSelectedFilters((prev: any) => ({ ...prev, max_carat: value ?? caratMax }))}
              onBlur={() => commitCarat([selectedFilters.min_carat ?? caratMin, selectedFilters.max_carat ?? caratMax])}
              onPressEnter={() => commitCarat([selectedFilters.min_carat ?? caratMin, selectedFilters.max_carat ?? caratMax])}
              className="!w-full !bg-transparent tabular-nums"
            />
          </label>
        </div>
        <Slider
          range
          step={0.01}
          min={caratMin}
          max={caratMax}
          value={[selectedFilters.min_carat ?? caratMin, selectedFilters.max_carat ?? caratMax]}
          onChange={(value: number[]) => setSelectedFilters((prev: any) => ({ ...prev, min_carat: value[0], max_carat: value[1] }))}
          onChangeComplete={(value: number[]) => commitCarat(value)}
        />
      </div>
    ) : null;

  const showSkeleton = isLoading || isSortLoading;
  const shownCount = productCards.length;
  const totalCount = counts ?? 0;

  const panelProps: FilterPanelProps = {
    loadingFilterId,
    categories,
    styles: (filters?.subTypes ?? []).map((item) => ({ id: item.id, name: masterName(item.id) ?? item.name })),
    metals: optionsFrom(filters?.metal_color_id),
    shapes: optionsFrom(filters?.shape_id),
    diamondColors: optionsFrom(filters?.diamond_color_id).map(({ id, name }: any) => ({ id, name })),
    specialTitles: (filters?.special_title ?? []).map((item) => ({ id: item.id, name: item.title })),
    selected: {
      metal: filtersData?.metal ?? [],
      shape: filtersData?.shape ?? [],
      diamond_color: filtersData?.diamond_color ?? [],
      subTypes: filtersData?.subTypes ?? [],
      specialTitle: filtersData?.specialTitle ?? [],
    },
    onToggle: toggleFilter,
    gender: Number(filtersData?.gender_category ?? 1),
    onGender: setGender,
    priceSlot,
    priceActive: !!(price || minPriceParam),
    caratSlot,
    caratActive: !!carat,
  };
  const columns = showRail ? 3 : 4;
  const piecesLabel = `${totalCount} ${totalCount === 1 ? 'piece' : 'pieces'}`;
  const filterIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} className="h-[18px] w-[18px]" aria-hidden>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </svg>
  );

  return (
    <ConfigProvider theme={plpTheme}>
      <div className="w-full bg-paper font-libre text-[14px] leading-[1.55] text-ink antialiased">
        {/* Collection banner */}
        {collectionType && (collectionData?.desktop_image || collectionData?.mobile_image) && (
          <div className="relative w-full overflow-hidden bg-stone">
            <picture className="block">
              {collectionData?.mobile_image && <source media="(max-width: 550px)" srcSet={collectionData.mobile_image} />}
              <img
                src={collectionData?.desktop_image || collectionData?.mobile_image}
                alt={collectionData?.name ? `${collectionData.name} collection` : 'Collection'}
                className="block h-[clamp(220px,32vw,460px)] w-full object-cover"
              />
            </picture>
          </div>
        )}

        <div className={`mx-auto max-w-[1440px] ${GUTTER}`}>
          {/* Title row */}
          <section className="pt-7 md:pt-5">
            <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 text-[12px] text-ink-soft">
              <Link href="/" className="text-ink-soft hover:text-ink">
                Home
              </Link>
              <span aria-hidden className="text-line-strong">
                /
              </span>
              {collectionType && (
                <>
                  <Link href="/collections" className="text-ink-soft hover:text-ink">
                    Collections
                  </Link>
                  <span aria-hidden className="text-line-strong">
                    /
                  </span>
                </>
              )}
              <span aria-current="page">{pageTitle}</span>
            </nav>
            <div className="mb-1.5 mt-3.5 flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
              <h1 className="m-0 font-cormorant text-[clamp(38px,4vw,54px)] font-medium leading-none tracking-[-0.01em] text-ink">{pageTitle}</h1>
              <small className="text-[13px] tabular-nums text-ink-soft">{piecesLabel}</small>
            </div>
            {lede && <p className="m-0 max-w-[62ch] text-[14.5px] text-ink-soft">{lede}</p>}
          </section>

          {/* Style row: square tiles from the CMS styles */}
          {(filters?.subTypes?.length ?? 0) > 0 && (
            <div className="relative pb-[30px] pt-[26px]">
              <div
                ref={railRef}
                onScroll={updateRailEdges}
                role="toolbar"
                aria-label="Shop by style"
                className="flex gap-3 overflow-x-auto scroll-smooth [scrollbar-width:none]"
              >
                {filters?.subTypes?.map((item) => {
                  const meta = productFilter?.find((el: any) => el.id === item.id);
                  const active = !!filtersData?.subTypes?.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleFilter('subTypes', item.id)}
                      className="group grid flex-[0_0_clamp(96px,9.2vw,132px)] gap-2.5 text-center"
                    >
                      <span
                        className={`relative block aspect-square overflow-hidden border-b-2 bg-stone transition-colors ${
                          active ? 'border-ink' : 'border-transparent group-hover:border-line-strong'
                        }`}
                      >
                        <img
                          src={meta?.image?.[0] || '/images/no_images.svg'}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-contain p-[10%] mix-blend-multiply transition-transform duration-[900ms] ease-luxe group-hover:scale-105"
                        />
                        {loadingFilterId == item.id && (
                          <span className="absolute inset-0 z-[1] animate-shimmer bg-gradient-to-r from-transparent via-paper/60 to-transparent bg-[length:220%_100%]" />
                        )}
                      </span>
                      <span className={`text-[13px] leading-[1.35] text-ink ${active ? 'font-semibold' : 'font-medium'}`}>
                        {meta?.name ?? item.name}
                      </span>
                    </button>
                  );
                })}
              </div>
              {!railEdges.atStart && (
                <button
                  type="button"
                  aria-label="Scroll styles left"
                  onClick={() => scrollRail(-1)}
                  className="absolute -left-2.5 top-[calc(26px+clamp(96px,9.2vw,132px)/2)] z-[2] grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-paper text-ink shadow-md shadow-ink/10 md:hidden"
                >
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.4} className="h-3.5 w-3.5" aria-hidden>
                    <path d="M10 3 5 8l5 5" />
                  </svg>
                </button>
              )}
              {!railEdges.atEnd && (
                <button
                  type="button"
                  aria-label="Scroll styles right"
                  onClick={() => scrollRail(1)}
                  className="absolute -right-2.5 top-[calc(26px+clamp(96px,9.2vw,132px)/2)] z-[2] grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-paper text-ink shadow-md shadow-ink/10 md:hidden"
                >
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.4} className="h-3.5 w-3.5" aria-hidden>
                    <path d="m6 3 5 5-5 5" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="sticky top-0 z-20 border-y border-line bg-paper">
          <div className={`mx-auto flex min-h-14 max-w-[1440px] items-center gap-3.5 py-2 ${GUTTER}`}>
            <button
              type="button"
              aria-expanded={showRail}
              aria-controls="plp-filter-rail"
              onClick={() => setShowRail((v) => !v)}
              className="inline-flex flex-none items-center gap-2.5 text-[13px] font-medium text-ink lg:hidden"
            >
              {filterIcon}
              {showRail ? 'Hide filters' : 'Show filters'}
              {chips.length > 0 && (
                <span className="inline-grid h-[18px] min-w-[18px] place-items-center rounded-full bg-ink px-[5px] text-[10px] text-paper">
                  {chips.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => openDrawer(null)}
              className="hidden h-9 flex-none items-center gap-2 border border-ink px-3.5 text-[13px] font-medium text-ink lg:inline-flex"
            >
              {filterIcon}
              Filters{chips.length > 0 ? ` · ${chips.length}` : ''}
            </button>

            {chips.length > 0 && (
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 md:hidden">
                {chips.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={chip.onRemove}
                    aria-label={`Remove filter ${chip.label}`}
                    className="inline-flex h-[30px] items-center gap-2 bg-stone px-3 text-[12.5px] text-ink transition-colors hover:bg-stone-deep"
                  >
                    {chip.label}
                    <RxCross2 className="h-2.5 w-2.5 text-ink-soft" />
                  </button>
                ))}
                <button type="button" onClick={clearAll} className="text-[12.5px] text-ink-soft underline underline-offset-[3px] hover:text-ink">
                  Clear all
                </button>
              </div>
            )}

            <div className="ml-auto flex flex-none items-center gap-[18px] text-[13px] text-ink-soft">
              <span className="tabular-nums sm:hidden">{piecesLabel}</span>
              <div className="relative flex items-center gap-1">
                <span className="text-ink sm:hidden">Sort:</span>
                <Select
                  variant="borderless"
                  aria-label="Sort"
                  value={filtersData?.sort_order ?? ''}
                  options={SORT_OPTIONS}
                  onChange={changeSort}
                  popupMatchSelectWidth={false}
                  className="min-w-[124px] [&_.ant-select-arrow]:text-ink [&_.ant-select-selection-item]:!text-[13px] [&_.ant-select-selection-item]:!font-medium [&_.ant-select-selection-item]:text-ink [&_.ant-select-selector]:!px-0"
                />
                {isFasterPopup && isFasterPopupShow && products?.length > 0 && (
                  <div className="absolute right-0 top-[calc(100%+12px)] z-[25] grid w-[280px] gap-1 border border-line bg-paper py-4 pl-4 pr-9 shadow-lg shadow-ink/10 sm:w-[min(280px,calc(100vw-32px))]">
                    <strong className="font-cormorant text-[20px] font-medium leading-[1.1] text-ink">Need it sooner?</strong>
                    <p className="m-0 text-[12.5px] text-ink-soft">
                      <button
                        type="button"
                        className="text-teal underline underline-offset-[3px]"
                        onClick={() => {
                          changeSort('fastdelivery');
                          dispatch(setIsFasterPopup(false));
                        }}
                      >
                        Show pieces
                      </button>{' '}
                      that arrive the soonest.
                    </p>
                    <button
                      type="button"
                      aria-label="Dismiss"
                      onClick={() => dispatch(setIsFasterPopup(false))}
                      className="absolute right-2.5 top-2.5 grid h-[22px] w-[22px] place-items-center text-ink"
                    >
                      <RxCross2 />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div
          className={`mx-auto grid max-w-[1440px] items-start gap-10 pt-7 lg:grid-cols-1 ${GUTTER} ${
            showRail ? 'grid-cols-[240px_minmax(0,1fr)]' : 'grid-cols-1'
          }`}
        >
          {/* Filter rail (desktop) */}
          {showRail && (
            <aside
              id="plp-filter-rail"
              aria-label="Filters"
              data-lenis-prevent
              className="sticky top-[72px] max-h-[calc(100vh-88px)] overflow-y-auto pr-1.5 [scrollbar-width:thin] lg:hidden"
            >
              <FilterPanel {...panelProps} compact />
              <div className="mt-[22px] bg-mist p-[18px]">
                <b className="mb-1 block font-cormorant text-[20px] font-medium">Not sure of the size?</b>
                <p className="m-0 mb-2.5 text-[13px] text-ink-soft">Get sized or see pieces with a specialist over video.</p>
                <Link href="/virtual-appointment" className="border-b border-current text-[12px] font-semibold uppercase tracking-[0.08em] text-teal">
                  Book an appointment
                </Link>
              </div>
            </aside>
          )}

          <div className="min-w-0">
            {showSkeleton && <PlpGridSkeleton columns={columns} />}

            {!showSkeleton && products?.length === 0 && (
              <div className="grid justify-items-center gap-3 py-20 text-center">
                <h3 className="m-0 font-cormorant text-[34px] font-normal text-ink">Nothing matches yet</h3>
                <p className="m-0 text-ink-soft">Try removing a filter or two to see more pieces.</p>
                <button type="button" onClick={clearAll} className="text-[13px] text-ink-soft underline underline-offset-4">
                  Clear all filters
                </button>
              </div>
            )}

            {!showSkeleton && products?.length > 0 && (
              <>
                <PlpGrid products={productCards} banners={PromotionalImages ?? []} columns={columns} pageJewelryType={jewelryType as string} />
                <div className="grid justify-items-center gap-3.5 pb-[72px] pt-12">
                  {isLoadingMore ? (
                    <span className="inline-flex items-center gap-2 text-[13px] text-ink-soft">
                      <LuLoader className="h-4 w-4 animate-spin" /> Loading more pieces
                    </span>
                  ) : (
                    <span className="text-[13px] tabular-nums text-ink-soft">
                      {shownCount >= totalCount ? `Showing all ${totalCount} pieces` : `Showing ${shownCount} of ${totalCount}`}
                    </span>
                  )}
                  {totalCount > 0 && (
                    <div className="relative h-0.5 w-[220px] bg-line">
                      <i
                        className="absolute inset-y-0 left-0 bg-ink transition-[width] duration-500 ease-luxe"
                        style={{ width: `${Math.min(100, (shownCount / totalCount) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <FilterDrawer
          open={drawerOpen}
          focusSection={drawerFocus}
          onClose={() => setDrawerOpen(false)}
          resultCount={totalCount}
          activeCount={chips.length}
          onClearAll={clearAll}
          {...panelProps}
        />
      </div>
    </ConfigProvider>
  );
}
