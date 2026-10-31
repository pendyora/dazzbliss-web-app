/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-case-declarations */
'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Button,
  Checkbox,
  ConfigProvider,
  Drawer,
  Image,
  InputNumber,
  Radio,
  RadioChangeEvent,
  Select,
  Skeleton,
  Slider,
  SliderSingleProps,
} from 'antd';
import { debounce } from 'lodash';
import Link from 'next/link';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { BsFilterLeft, BsThreeDots } from 'react-icons/bs';
import { FaCheck, FaHeart, FaRegHeart } from 'react-icons/fa6';
import { FiMinus, FiX } from 'react-icons/fi';
import { GoChevronDown, GoChevronUp } from 'react-icons/go';
import { HiPlus } from 'react-icons/hi2';
import { LuLoader } from 'react-icons/lu';
import { RiFilter2Line } from 'react-icons/ri';
import { RxCross1, RxCross2, RxHamburgerMenu } from 'react-icons/rx';
import { Virtual, Navigation, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import { Text } from '@/components';
import ProductProfile from '@/components/ProductProfile';
import * as ga4 from '@/lib/analytics';
import { apiAddToWishList, apiDeleteFromWishList } from '@/services/cartService';
import {
  clearProducts,
  fetchProducts,
  fetchProductsFilterList,
  fetchPromotionalImages,
  setCurrentPage,
  setFilterData,
  setFilterLoadingFirst,
  setIsFasterPopup,
  setLoadingFilterId,
  setProductsRows,
  setProductStack,
  setShouldLoadFilter,
  setShouldLoadList,
  useAppDispatch,
  useAppSelector,
} from '@/store';
import { addCartProductCounts, fetchCartProducts, fetchWishListProducts, setWishlistProducts } from '@/store/slices/Cart/cartSlice';
import { formatCurrency } from '@/utils/common';
import { trackAddToCart, trackAddToWishlist } from '@/utils/metaPixel';
import { isObjectEmpty } from '@/utils/objectUtils';
import { findSubTypesByParam, subTypeCodeToParam } from '@/utils/subTypeParam';

import ChunkComponent from './ChunkComponent';
import { plpTheme } from '../[jewelryType]/FilterDrawer';

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
/** When API id whitelist is empty, fall back to master rows by parent_code so filter UIs are not blank. */
function masterRowsByWhitelistOrParent(masterData: any[] | undefined, allowedIds: any[] | undefined | null, parentCodeFallback?: string | null) {
  if (!masterData?.length) {
    return [];
  }
  if (allowedIds?.length) {
    const allowedIdSet = new Set(allowedIds.map((id) => String(id)));
    return masterData.filter((obj) => allowedIdSet.has(String(obj.id)));
  }
  if (parentCodeFallback) {
    return masterData.filter((obj) => obj?.parent_code === parentCodeFallback);
  }
  return [];
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
    case 'stackable':
    case 'new-arrivals':
      return true; // Jewelry type exists
    default:
      return false; // Jewelry type does not exist
  }
}

export default function DesignYourRingStackPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const previousCollectionType = useRef<string | null>(null);
  const divRef = useRef<any>(null);
  const divMobileRef = useRef<any>(null);
  const sectionRef = useRef<any>(null);
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const prevRefDesk = useRef<HTMLButtonElement>(null);
  const nextRefDesk = useRef<HTMLButtonElement>(null);
  const FilterDropdownRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const dropdownRefMobile = useRef<HTMLDivElement | null>(null);
  const productsLoading = useAppSelector((state) => state.products?.loading);
  const products = useAppSelector((state) => state?.products?.products?.rows);
  const PromotionalImages = useAppSelector((state) => state.products?.PromotionalImages);
  const { user } = useAppSelector((state) => state.auth.auth);
  const counts = useAppSelector((state) => state.products?.products?.count);
  const { cartProducts, wishlistProducts, loading } = useAppSelector((state) => state?.cart);
  const filters = useAppSelector((state) => state.products?.filterList);
  const filtersData = useAppSelector((state) => state.products?.filterData);
  const { filterLoadingFirst, isFasterPopup, loadingFilterId, productStack } = useAppSelector((state) => state.products);
  const { pageSize, currentPage } = useAppSelector((state) => state.products.pagination);
  const { headerData } = useAppSelector((state) => state.master);
  const masterData = useAppSelector((s) => s.master.data);
  const masterRingSizePrice = useAppSelector((state) => state?.master?.ringSizePriceList);
  const productFilter = useAppSelector((state) => state?.master?.data);

  const shapeFilterMasterRows = useMemo(() => masterRowsByWhitelistOrParent(masterData, filters?.shape_id, 'SHAPE'), [masterData, filters?.shape_id]);
  const metalFilterMasterRows = useMemo(
    () => masterRowsByWhitelistOrParent(masterData, filters?.metal_color_id, null),
    [masterData, filters?.metal_color_id],
  );
  const diamondColorFilterMasterRows = useMemo(
    () => masterRowsByWhitelistOrParent(masterData, filters?.diamond_color_id, null),
    [masterData, filters?.diamond_color_id],
  );

  let jewelryType = 'stackable';
  const searchParams = useSearchParams();
  const collections = searchParams.get('collections');

  const collectionType = searchParams.get('collections') ? searchParams.get('collections') : null;
  const subTypes = searchParams.get('subTypes');
  const sort = searchParams.get('sort');
  const price = searchParams.get('price');
  const metal = searchParams.get('metal');
  const diamondColor = searchParams.get('diamondColor');
  const shape = searchParams.get('shape');
  const carat = searchParams.get('carat');
  const gender = searchParams.get('gender');

  const [count, setCount] = useState(1);
  const [caratWeight, setCaratWeight] = useState<SliderSingleProps['marks']>({});
  const caratBounds = useMemo(() => {
    const values = Object.keys(caratWeight as any)
      .map(Number)
      .filter((n) => Number.isFinite(n));
    if (values.length === 0) {
      return { min: 0, max: 0, hasRange: false };
    }
    return { min: Math.min(...values), max: Math.max(...values), hasRange: true };
  }, [caratWeight]);
  const [isFilterOpen, setIsFilterOpen] = useState<
    null | 'price' | 'sub_style' | 'carat' | 'shape' | 'diamond_color' | 'jewelry_type' | 'metal' | 'gender' | 'diamond_type'
  >(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isItemsOpen, setIsItemsOpen] = useState(true);
  const [isMetalOpen, setIsMetalOpen] = useState(false);
  const [isDiamondColorOpen, setIsDiamondColorOpen] = useState(false);
  const [isShapeOpen, setIsShapeOpen] = useState(false);
  const [isCaratWeightOpen, setIsCaratWeightOpen] = useState(false);
  const [isPriceOpen, setIsPriceOpen] = useState(true);
  const [isProductCall, setIsProductCall] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [isOpenSubType, setIsOpenSubType] = useState(false);
  const [isFasterPopupShow, setIsFasterPopupShow] = useState(false);
  const [isOpenSubTypeMobile, setIsOpenSubTypeMobile] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<any>({
    metal: [],
    shape: [],
    diamondColor: [],
    subTypes: [],
    gender: 1,
    sort: '',
    min_price: filters?.price_range?.min_price ?? 0,
    max_price: filters?.price_range?.max_price ?? 0,
    min_carat: 0,
    max_carat: 0,
  });
  const [selectedMoreSubType, setSelectedMoreSubType] = useState<any>([]);
  const [collectionData, setCollectionData] = useState<any>();
  const [swiperRef, setSwiperRef] = useState<any>(null);
  const [swiperRefDesk, setSwiperRefDesk] = useState<any>(null);
  const [chunkedData, setChunkedData] = useState([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [windowWidth, setWindowWidth] = useState<number>(0);
  const [selectedRing, setSelectedRing] = useState<any>(null);
  const [wishlist, setWishlist] = useState(false);
  const [wId, setWid] = useState<any>(true);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isAtTop, setIsAtTop] = useState(false);

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

  const handleScroll = useCallback(() => {
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
          }),
        ).then(() => setIsLoadingMore(false));
      } else {
        dispatch(
          fetchProducts({
            type: jewelryType as string,
            data: filtersData,
            page: nextPage,
            size: pageSize,
          }),
        ).then(() => setIsLoadingMore(false));
      }
    }
  }, [currentPage, counts, products?.length, productsLoading, isLoadingMore, dispatch, jewelryType, filtersData, pageSize, collectionType]);

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

  function getPriceViaRingAndMetal(ringSize: null | string, metal: string) {
    const ProductPrice = masterRingSizePrice?.find((item: any) => item.ring_size_id == ringSize && item.metal_type_id == metal);
    return ringSize ? ProductPrice?.rate : 0;
  }

  const genderWiseRing = masterRingSizePrice?.filter((el: any) => {
    // if (selectedProduct?.gender_category == 2) {
    //   return el.is_men == true;
    // } else {
    return el.is_women == true;
  });

  const ringSizeMasterData = productFilter
    .filter((ring) => ring.parent_code == 'RING_SIZE' && genderWiseRing.some((el) => el.ring_size_id == ring.id))
    .map((ring) => ({
      ...ring,
      rate: genderWiseRing.find((el) => el.ring_size_id == ring.id)?.rate || 0,
    }));

  const defaultRingSize = productFilter.filter(
    (ring: any) =>
      ring.parent_code == 'RING_SIZE' &&
      genderWiseRing
        // ?.filter((el: any) => (selectedProduct?.gender_category == 2 ? el.is_default_men == true : el.is_default_women == true))
        ?.filter((el: any) => el.is_default_women == true)
        .some((el) => el.ring_size_id == ring.id),
  );
  const ringSizeMaster = ringSizeMasterData
    ?.sort((a, b) => Number(a.name) - Number(b.name))
    ?.map((option: any) => ({
      value: Number(option.name),
      label: (
        <div className="!w-full !flex !justify-between !items-center">
          <p>{option.name}</p>
          {option.rate > 0 && <p>{`+${localStorage.getItem('currencySymbol')}${option.rate}`}</p>}
        </div>
      ),
      id: option.id,
      // rate: option.rate,
    }));

  const handleLocalWishlist = () => {
    const wishlistData = localStorage.getItem('wishListItems');
    const wishList = wishlistData ? JSON.parse(wishlistData) : [];

    // localStorage.removeItem("cartItems");
    if (wishList?.length > 0) {
      dispatch(setWishlistProducts(wishList));
    }
  };
  useEffect(() => {
    if (user) {
      dispatch(fetchWishListProducts('all'));
    } else {
      handleLocalWishlist();
    }
  }, []);

  const handleAddtocart = async () => {
    if (!selectedRing) {
      setErrorMessage('Please enter a valid ring size!');
      return;
    }
    const selectedRingId = ringSizeMasterData?.find((el: any) => el?.name == selectedRing)?.id;
    if (count > 0) {
      const map = new Map();

      for (const item of productStack) {
        if (map.has(item.slug)) {
          // Increment count on first occurrence
          map.get(item.slug).count += 1;
        } else {
          // Add item with count = 1
          map.set(item.slug, { ...item, count: 1 });
        }
      }

      const uniqueArray = Array.from(map.values());

      const payload: {
        jewelry_id: string;
        count: number;
        sku_master: string;
        ring_size_id?: string;
        is_appraisal: boolean;
        engravingText: any;
        selectedYearValue: any;
      }[] = uniqueArray?.map((product: any) => {
        return {
          jewelry_id: product?.jewelry_id,
          count: product?.count,
          sku_master: product?.sku_master_id,
          is_appraisal: false,
          engravingText: {
            Text: '',
            fontFamily: '',
          },
          selectedYearValue: null,
          ring_size_id: masterRingSizePrice?.find((item: any) => item.ring_size_id == selectedRingId && item.metal_type_id == product?.metal_type_id)
            ?.id,
        };
      });

      // Retrieve cart data from local storage
      const cartData = localStorage.getItem('cartItems');
      const existingCart: {
        jewelry_id: string;
        count: number;
        sku_master: string;
        ring_size_id?: string;
        is_appraisal: boolean;
        engravingText: any;
        selectedYearValue: any;
      }[] = cartData ? JSON.parse(cartData) : [];

      const isMatchingProduct = (a: any, b: any): boolean => {
        if (a.ring_size_id) {
          return a.sku_master === b.sku_master && a.ring_size_id === b.ring_size_id;
        }
        return a.sku_master === b.sku_master;
      };
      const contentIds = uniqueArray?.map((p: any) => String(p.sku_master_id ?? p.jewelry_id)) ?? [];
      const numItems = payload?.reduce((sum: number, p: any) => sum + p.count, 0) ?? 0;
      const value = uniqueArray?.reduce((sum: number, p: any) => sum + Number(p.discounted_price ?? p.productPrice ?? 0) * (p.count ?? 1), 0) ?? 0;
      // GA4 add_to_cart items (built once, used in both guest and logged-in branches below)
      const ga4Items = (uniqueArray ?? []).map((p: any) =>
        ga4.buildProductItem({
          item_id: p?.sku_master_id ?? p?.jewelry_id,
          item_name: p?.fullTitle ?? p?.title,
          price: Number(p?.discounted_price ?? p?.productPrice ?? 0),
          quantity: p?.count ?? 1,
          item_variant: p?.metal_type_id,
        }),
      );

      if (user) {
        const cartItems = cartProducts.some((p: any) => payload.some((item) => isMatchingProduct(p, item)));
        if (!cartItems) {
          const response = await dispatch(fetchCartProducts({ data: [...payload] }));
          if (response?.payload?.status === 200 || response?.payload?.status === 201) {
            trackAddToCart({ content_ids: contentIds, value, currency: 'USD', num_items: numItems });
            ga4.addToCart({ items: ga4Items, value });
            router.push('/cart');
          }
        } else {
          router.push('/cart');
        }
      } else {
        payload.forEach((payloadItem) => {
          const existingIndex = existingCart.findIndex((cartItem) => isMatchingProduct(cartItem, payloadItem));

          if (existingIndex > -1) {
            // Update count if product exists
            existingCart[existingIndex] = {
              ...existingCart[existingIndex],
              count: existingCart[existingIndex].count + payloadItem.count,
            };
          } else {
            // Add new product if not found
            existingCart.push(payloadItem);
          }
        });

        trackAddToCart({ content_ids: contentIds, value, currency: 'USD', num_items: numItems });
        ga4.addToCart({ items: ga4Items, value });
        dispatch(addCartProductCounts(existingCart?.length));
        localStorage.setItem('cartItems', JSON.stringify(existingCart));
        router.push('/cart');
      }
    }
  };

  const handleAddtoWishlist = async () => {
    const payload: any[] = productStack.map((product: any) => ({
      jewelry_id: product.jewelry_id,
      sku_master_id: product.sku_master_id,
      slug: product.slug,
      productDescription: product.productDescription,
      productPrice: product.productPrice,
      productName: product.productName,
      productHoverImage: product.productHoverImage,
      productImage: product.productImage,
      discount_type: product.discount_type,
      discount_value: product.discount_value,
      discounted_price: product.discounted_price,
      handling_days: product.handling_days,
      ring_size_id: product.ring_size_id,
      isWishlist: product?.isWishlist ?? 'true',
      jewelry_type: product.jewelry_type,
      is_customizable: product.is_customizable,
      metal_type_id: product.metal_type_id,
    }));

    const wishlistData = localStorage.getItem('wishListItems');
    const existingWishlist: {
      name: string;
      jewelry: any[];
    }[] = wishlistData ? JSON.parse(wishlistData) : [];

    if (user) {
      const allWishlistItems = wishlistProducts.flatMap((group: any) => group.jewelry);
      // Check how many from productStack already exist
      const existingCount = productStack.filter((stackItem: any) =>
        allWishlistItems.some((wish: any) => wish.jewelry_id === stackItem.jewelry_id && wish.sku_master_id === stackItem.sku_master_id),
      ).length;

      const allExistInWishlist = existingCount === productStack.length;

      if (allExistInWishlist) {
        // Remove all from wishlist
        const wishlistIdsToDelete = productStack
          .map((stackItem) => {
            const existing = allWishlistItems.find(
              (wish: any) => wish.jewelry_id === stackItem.jewelry_id && wish.sku_master_id === stackItem.sku_master_id,
            );
            return existing?.isWishlist ?? null;
          })
          .filter((id): id is string => Boolean(id)); // Filters out null/undefined

        if (wishlistIdsToDelete.length > 0) {
          await apiDeleteFromWishList(wishlistIdsToDelete);
        }
      } else {
        // Add only those not present
        const toAdd = payload.filter(
          (item) => !allWishlistItems.some((p: any) => p.jewelry_id === item.jewelry_id && p.sku_master_id === item.sku_master_id),
        );
        if (toAdd?.length > 0) {
          const response: any = await apiAddToWishList(
            toAdd?.map((item) => ({
              jewelry_id: item.jewelry_id,
              sku_master_id: item.sku_master_id,
            })),
          );

          const addedItems = response?.data?.data || [];

          if (response?.data?.status === 200 || response?.data?.status === 201) {
            const contentIds = toAdd?.map((item) => String(item.sku_master_id ?? item.jewelry_id));
            const value = toAdd?.reduce((sum, item) => sum + Number(item.productPrice ?? item.discounted_price ?? 0), 0);
            trackAddToWishlist({ content_ids: contentIds, value, currency: 'USD' });
            const updatedProducts = [...products];

            for (const data of addedItems) {
              const index = updatedProducts.findIndex((p: any) => p.id === data?.jewelry_id);
              if (index > -1) {
                const updatedProduct: any = { ...updatedProducts[index] };
                const updatedDetails = {
                  ...updatedProduct.jewelryDetails?.[0],
                  wishlist_id: data.id,
                };
                updatedProduct.jewelryDetails = [updatedDetails];
                updatedProducts.splice(index, 1, updatedProduct);
              }
            }

            dispatch(setProductsRows(updatedProducts));
          }
        }
      }

      dispatch(fetchWishListProducts('all'));
    } else {
      // Guest Users (using localStorage)
      let countInWishlist = 0;

      for (const item of payload) {
        const typeIndex = existingWishlist.findIndex((w) => w.name === item.jewelry_type);

        if (
          typeIndex > -1 &&
          existingWishlist[typeIndex].jewelry.some((j) => j.jewelry_id === item.jewelry_id && j.sku_master_id === item.sku_master_id)
        ) {
          countInWishlist++;
        }
      }

      const allExistInWishlist = countInWishlist === productStack.length;

      if (allExistInWishlist) {
        // Remove all
        for (const item of payload) {
          const typeIndex = existingWishlist.findIndex((w) => w.name === item.jewelry_type);
          if (typeIndex > -1) {
            const productIndex = existingWishlist[typeIndex].jewelry.findIndex(
              (j) => j.jewelry_id === item.jewelry_id && j.sku_master_id === item.sku_master_id,
            );

            if (productIndex > -1) {
              existingWishlist[typeIndex].jewelry.splice(productIndex, 1);

              if (existingWishlist[typeIndex].jewelry.length === 0) {
                existingWishlist.splice(typeIndex, 1);
              }
            }
          }
        }
      } else {
        // Add only missing ones
        const addedForTrack: typeof payload = [];
        for (const item of payload) {
          const typeIndex = existingWishlist.findIndex((w) => w.name === item.jewelry_type);

          const isAlreadyPresent =
            typeIndex > -1 &&
            existingWishlist[typeIndex].jewelry.some((j) => j.jewelry_id === item.jewelry_id && j.sku_master_id === item.sku_master_id);

          if (!isAlreadyPresent) {
            addedForTrack?.push(item);
            if (typeIndex > -1) {
              existingWishlist[typeIndex].jewelry.push({
                ...item,
                isWishlist: 'true',
              });
            } else {
              existingWishlist.push({
                name: item.jewelry_type,
                jewelry: [{ ...item, isWishlist: 'true' }],
              });
            }
          }
        }
        if (addedForTrack?.length > 0) {
          const contentIds = addedForTrack?.map((item) => String(item.sku_master_id ?? item.jewelry_id));
          const value = addedForTrack?.reduce((sum, item) => sum + Number(item.productPrice ?? item.discounted_price ?? 0), 0);
          trackAddToWishlist({ content_ids: contentIds, value, currency: 'USD' });
        }
      }

      localStorage.setItem('wishListItems', JSON.stringify(existingWishlist));
      dispatch(setWishlistProducts(existingWishlist));
      handleLocalWishlist();
    }
  };

  const handleStateData = async (productsData: any) => {
    const newData = await productsData?.map((item: any) => {
      const carat_image = item.jewelryDetails[0]?.carat_images || [];
      const metal_type_id = item.jewelryDetails?.[0]?.metal_type_id;
      const metal_color_id = item.jewelryDetails?.[0]?.metal_color_id;
      const ring_size_id = item.jewelryDetails?.[0]?.ring_size_id;
      const ring_size_price = getPriceViaRingAndMetal(ring_size_id, metal_type_id);
      const jewelryTypeName = item?.jewelrySubType?.parent_code;
      const jewelryTypeData = jewelryTypeName?.toLowerCase()?.replace('_', '-');
      const jewelryDetails = item?.jewelryDetails?.[0];
      return {
        estimated_delivery_days: item?.estimated_delivery_days,
        productVariation: item?.image_folder_info.length,
        productImage: carat_image[0] ? `${carat_image[0]}` : '/images/no_images.svg',
        stackable_image: item?.jewelryDetails?.[0]?.stackable_image ?? '/images/no_images.svg',
        productHoverImage: carat_image[1] ? `${carat_image[1]}` : '/images/no_images.svg',
        is_customizable: item?.is_customizable,
        variation_to_show: item?.variation_to_show,
        variation_details: item?.variation_details,
        jewelryDetails,
        jewelryTypeData,
        productName: item?.title,
        productFullTitle: item?.fullTitle,
        // Yotpo keys reviews by this product-level code — the card's star rating needs it.
        code: item?.code,
        productPrice:
          ring_size_price && ring_size_price > 0
            ? `${Math.ceil(item?.jewelryDetails[0]?.selling_price + ring_size_price)}`
            : `${Math.ceil(item?.jewelryDetails[0]?.selling_price)}`,
        // slug: `${jewelryType}/${item?.slug}`,
        slug: item?.is_customizable ? item.jewelryDetails[0]?.sku_slug : `${item.jewelryDetails[0]?.sku_slug}`,
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
        metal_type_id: metal_type_id,
        metal_color_id: metal_color_id,
      };
    });

    const d: any = chunkArray(newData, 8);
    // console.log(newData);

    setChunkedData(newData);
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

  const handleClickOutside = (event: MouseEvent) => {
    // Ensure dropdownRef.current is a valid element before calling contains
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpenSubType(false);
    }
    if (dropdownRefMobile.current && !dropdownRefMobile.current.contains(event.target as Node)) {
      setIsOpenSubTypeMobile(false);
    }
    if (FilterDropdownRef.current && !FilterDropdownRef.current.contains(event.target as Node)) {
      setIsFilterOpen(null);
    }
  };
  const handleFilterChange = useCallback(
    (filterType: string, value: any) => {
      let newFilters = { ...selectedFilters };
      const currentParams = new URLSearchParams(searchParams.toString()); // Make a copy of the current URL parameters

      // Update the selectedFilters based on the filterType
      switch (filterType) {
        case 'price':
          const [min, max] = value;
          const defaultPrice = [filters?.price_range?.min_price, filters?.price_range?.max_price].toString();

          newFilters.min_price = min;
          newFilters.max_price = max;
          const priceVal = `${min}-${max}`;
          const val = priceVal === defaultPrice?.replace(',', '-') ? null : priceVal;
          if (val && val.length > 0) {
            currentParams.set('price', val);
          } else {
            currentParams.delete('price');
          }
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

        case 'subTypes':
          newFilters = { ...newFilters, subTypes: value };
          const new_style = masterData?.filter((item: any) => value.includes(item.id));

          const subTypeCodes = new_style.length > 0 ? new_style?.map((el: any) => subTypeCodeToParam(el?.code))?.join(',') : '';
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
          break;

        case 'carat':
          const default_carat = [
            Math.min(...Object.keys(caratWeight as any).map(Number)),
            Math.max(...Object.keys(caratWeight as any).map(Number)),
          ].toString();

          const caratStr = `${value[0]}-${value[1]}`;
          newFilters = { ...newFilters, carat: value };
          currentParams.set('carat', caratStr);
          if (default_carat === value?.toString()) {
            currentParams.delete('carat');
          }
          break;

        case 'gender':
          const genderStr = value >= 2 ? (value == 2 ? 'for_him' : 'for_her') : 'both';
          newFilters = { ...newFilters, gender: value };
          currentParams.set('gender', genderStr);
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
      const updatedUrl = `${pathname}?${decodeURIComponent(currentParams.toString())}`;
      // Update the URL with all the filters, while preserving the changes
      window?.history.replaceState(null, '', updatedUrl);
    },
    [selectedFilters, jewelryType, router, searchParams],
  );

  const handleApiCall = useCallback(
    debounce(({ jewelryType, filtersData, currentPage = 1, pageSize, collectionType = null }) => {
      if (collectionType) {
        dispatch(
          fetchProducts({
            type: jewelryType as string,
            data: filtersData,
            page: currentPage,
            size: pageSize,
            collectionType: collectionType,
          }),
        );
      } else {
        dispatch(
          fetchProducts({
            type: jewelryType as string,
            data: filtersData,
            page: currentPage,
            size: pageSize,
          }),
        );
      }
      // Dispatch action to fetch API data
    }, 1000), // Delay in ms before calling API
    [dispatch],
  );

  useEffect(() => {
    const allWishlistItems = wishlistProducts.flatMap((group: any) => group.jewelry);
    if (productStack.length === 0 || allWishlistItems.length === 0) {
      setIsInWishlist(false);
      return;
    }

    const allExist = productStack.every((product) =>
      allWishlistItems.some((w: any) => w.jewelry_id === product.jewelry_id && w.sku_master_id === product.sku_master_id),
    );

    setIsInWishlist(allExist);
  }, [productStack, wishlistProducts, isInWishlist]);

  useEffect(() => {
    dispatch(setShouldLoadList(true));
    setLoading(true);
    setIsProductCall(false);
    jewelryType = collectionType ? 'all' : jewelryType;
    if (jewelryType) {
      dispatch(clearProducts());
      dispatch(
        fetchPromotionalImages({
          type: jewelryType as string,
        }),
      );
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
  }, [jewelryType, collectionType, dispatch]);

  useEffect(() => {
    if (filterLoadingFirst) {
      const data = {
        ...filtersData,
        metal: metal ? IdFilter(metal) : [],
        shape: shape ? ShapeFilter(shape) : [],
        diamond_color: diamondColor ? diamondColorFind(diamondColor) : [],
        subTypes: subTypes ? SubtypeIdFilter(subTypes) : [],
        gender_category: gender ? genderFind(gender) : 1,
        sort_order: sort ? sort : '',
        min_price: price ? Number(price?.split('-')?.[0]) : filters?.price_range?.min_price,
        max_price: price ? Number(price?.split('-')?.[1]) : filters?.price_range?.max_price,
        carats: carat ? carat?.split('-') : [],
        // min_carat: carat ? Number(carat?.split('-')?.[0]) : Math.min(...Object.keys(caratWeight as any).map(Number)),
        // max_carat: carat ? Number(carat?.split('-')?.[1]) : Math.max(...Object.keys(caratWeight as any).map(Number)),
      };
      if (collectionType) {
        dispatch(
          fetchProducts({
            type: jewelryType as string,
            data: data,
            page: currentPage,
            size: pageSize,
            collectionType: collectionType,
          }),
        ).then(() => {
          setLoading(false);
          setIsProductCall(true);
        });
      } else {
        dispatch(
          fetchProducts({
            type: jewelryType as string,
            data: data,
            page: currentPage,
            size: pageSize,
          }),
        ).then(() => {
          setLoading(false);
          setIsProductCall(true);
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
          handleApiCall({ jewelryType, filtersData, currentPage: 1, pageSize, collectionType });
        } else {
          handleApiCall({ jewelryType, filtersData, currentPage: 1, pageSize });
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
            ?.includes(item?.name?.toLowerCase()),
      )
      .map((el: any) => el.id);
  };
  const SubtypeIdFilter = (arr: string) => {
    return (arr?.split(',') ?? []).flatMap((token: string) => findSubTypesByParam(token, masterData, filters?.subTypes).map((el: any) => el.id));
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = productStack.findIndex((item) => item.stackId === active.id);
      const newIndex = productStack.findIndex((item) => item.stackId === over.id);
      dispatch(setProductStack(arrayMove(productStack, oldIndex, newIndex)));
    }
  };

  type Product = {
    stackId?: any;
    slug: string;
    stackable_image?: string;
    productName: string;
    productImage?: string;
    productHoverImage?: string;
    sku_master_id?: string;
    jewelry_id?: string;
    jewelry_type?: string;
    isWishlist?: string;
    handling_days?: number;
    discount_type?: string;
    discount_value?: number | null;
    discounted_price?: number | string | null;
    ring_size_id?: string;
    metal_type_id?: string;
    metal_color_id?: string;
    productPrice?: number | string;
  };

  function SortableImage({ product }: { product: Product }) {
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id: product.stackId });

    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.6 : 1,
      cursor: 'grab',
      lineHeight: '0',
      touchAction: 'none',
      // marginBottom: '8px',
    };

    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <Image
          src={product.stackable_image ?? '/images/no_images.svg'}
          alt={product.productName}
          width={240}
          // height={40}
          preview={false}
          style={{
            mixBlendMode: 'multiply',
          }}
        />
      </div>
    );
  }

  useEffect(() => {
    if (filters && productFilter) {
      const caratMarks: SliderSingleProps['marks'] = {};
      filters.diamond_details?.forEach((obj) => {
        if (obj) {
          caratMarks[Number(obj?.weight)] = obj?.weight;
        }
      });
      setCaratWeight(caratMarks);
      const caratMarkValues = Object.values(caratMarks as any)
        .map(Number)
        .filter((n) => Number.isFinite(n));
      const minCarat = caratMarkValues.length > 0 ? Math.min(...caratMarkValues) : 0;
      const maxCarat = caratMarkValues.length > 0 ? Math.max(...caratMarkValues) : 0;

      setSelectedFilters({
        ...selectedFilters,
        metal: metal ? IdFilter(metal) : [],
        shape: shape ? ShapeFilter(shape) : [],
        diamondColor: diamondColor ? diamondColorFind(diamondColor) : [],
        subTypes: subTypes ? SubtypeIdFilter(subTypes) : [],
        gender: gender ? genderFind(gender) : 1,
        sort: sort ? sort : '',
        min_price: price ? Number(price?.split('-')?.[0]) : filters?.price_range?.min_price,
        max_price: price ? Number(price?.split('-')?.[1]) : filters?.price_range?.max_price,
        min_carat: carat ? Number(carat?.split('-')?.[0]) : minCarat,
        max_carat: carat ? Number(carat?.split('-')?.[1]) : maxCarat,
      });

      dispatch(
        setFilterData({
          ...filtersData,
          metal: metal ? IdFilter(metal) : [],
          shape: shape ? ShapeFilter(shape) : [],
          diamond_color: diamondColor ? diamondColorFind(diamondColor) : [],
          subTypes: subTypes ? SubtypeIdFilter(subTypes) : [],
          gender_category: gender ? genderFind(gender) : 1,
          sort_order: sort ? sort : '',
          min_price: price ? Number(price?.split('-')?.[0]) : filters?.price_range?.min_price,
          max_price: price ? Number(price?.split('-')?.[1]) : filters?.price_range?.max_price,
          carats: carat ? carat?.split('-') : [],
          // min_carat: carat ? Number(carat?.split('-')?.[0]) : Math.min(...Object.keys(caratWeight as any).map(Number)),
          // max_carat: carat ? Number(carat?.split('-')?.[1]) : Math.max(...Object.keys(caratWeight as any).map(Number)),
        }),
      );
    }
  }, [filters, productFilter]);

  useEffect(() => {
    if (products) {
      handleStateData(products);
    }
  }, [products, isInWishlist]);

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

  function SortableItem({ product, selectedRing }: { product: any; selectedRing: any }) {
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id: product.stackId });

    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.6 : 1,
      // background: '#fff',
      // borderRadius: '8px',
      // border: '1px solid #e5e5e5',
      // display: 'flex',
      // alignItems: 'center',
      // padding: '12px',
      // gap: '12px',
      marginBottom: '0px',
      boxShadow: isDragging ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
    };
    const selectedRingId = ringSizeMasterData?.find((el: any) => el?.name == selectedRing)?.id;
    const ringPrice = getPriceViaRingAndMetal(selectedRingId, product?.metal_type_id);
    const actualPrice = Number(product?.productPrice ?? 0) + ringPrice;
    const discountedPrice = Number(product?.discounted_price ?? 0) + ringPrice;

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`${isDragging ? 'bg-stone' : 'bg-paper'} w-full flex items-center py-2 px-5 gap-5 border-b border-line`}
      >
        <span
          style={{ cursor: 'pointer' }}
          onClick={() => {
            const updatedStack = productStack
              ?.filter((item: any) => item.stackId !== product?.stackId)
              ?.map((el, i) => {
                return { ...el, stackId: i + 1 };
              });
            dispatch(setProductStack(updatedStack));
          }}
        >
          <RxCross1 className="h-6 w-6 sm:w-4 sm:h-4" />
        </span>
        <span {...listeners} {...attributes} style={{ cursor: 'grab', touchAction: 'none' }}>
          <RxHamburgerMenu className="h-6 w-6 sm:w-4 sm:h-4" />
        </span>
        <span {...listeners} {...attributes} style={{ cursor: 'grab', touchAction: 'none' }}>
          <Image
            src={product.productImage ?? '/images/no_images.svg'}
            alt={product.productName}
            preview={false}
            fallback="/images/no_images.svg"
            width={60}
            height={60}
            // style={{ borderRadius: 6 }}
          />
        </span>
        <div style={{ flex: 1 }}>
          <Text size="textmd" className="text-[14px] text-ink line-clamp-2 xl:text-[13px] lg:text-[12px] text-wrap px-0.5 lg:px-0.5">
            {/* {product.productFullTitle} */}
            {product.productName}
          </Text>
          <Text size="texts" className="text-[12px] mt-1 text-ink-soft line-clamp-2 xl:text-[13px] lg:text-[12px] text-wrap px-0.5 lg:px-0.5">
            {masterData?.find((el: any) => el.id === product.metal_type_id)?.name}{' '}
            {masterData?.find((el: any) => el.id === product.metal_color_id)?.name}
          </Text>
          <div className="flex h-fit mt-1 items-center gap-2 sm:gap-1">
            {product?.discount_value && (
              <Text size="textlg" as="p" className="!font-libre tracking-[0.44px] sm:text-[13px]">
                {formatCurrency(discountedPrice)}
              </Text>
            )}
            <Text
              size="textlg"
              as="p"
              className={`!font-libre ${product?.discount_value ? 'line-through text-ink-faint !text-[13px] sm:!text-[11px]' : ''}`}
            >
              {formatCurrency(actualPrice)}
            </Text>
          </div>
        </div>
        <span className="!w-5">
          <span
            style={{ cursor: 'pointer' }}
            onPointerDown={(e) => e.stopPropagation()}
            className={productStack?.length >= 4 ? '!hidden' : ''}
            onClick={() => {
              if (productStack?.length < 4) {
                const updatedStack = [...productStack, { ...product, stackId: productStack?.length + 1 }];
                dispatch(setProductStack(updatedStack));
              }
            }}
          >
            <RxCross1 className="h-5 w-5 rotate-45 sm:w-4 sm:h-4" />
          </span>
        </span>
      </div>
    );
  }

  useEffect(() => {
    const handleScroll = () => {
      if (!divRef.current) {
        return;
      }

      const rect = window.innerWidth < 770 ? divMobileRef.current.getBoundingClientRect() : divRef.current.getBoundingClientRect();

      // Check if the top of the div is at the top of the viewport (or very close)
      setIsAtTop(Math.round(rect.top) <= 0);
    };

    window.addEventListener('scroll', handleScroll);

    // Initial check in case the div starts at the top
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <ConfigProvider theme={plpTheme}>
      <div ref={sectionRef} className="w-full bg-paper font-libre text-ink antialiased">
        <div className={`flex justify-center border-b border-line md:hidden`}>
          <div
            className={`mx-auto w-full max-w-[1440px] relative ${collectionType ? 'pb-5' : 'pb-14'} lg:pb-10 md:pb-5 mb-[22px] flex flex-col items-start justify-center lg:gap-5 md:gap-3  gap-8`}
          >
            <div
              className={`sm:hidden ${collectionType ? 'pt-5' : 'pt-6'} lg:pt-8 md:pt-5 top-0  flex flex-col items-start gap-[30px] w-[100%] 2xl:px-[50px] xl:px-[50px] lg:px-[30px] md:px-5 sm:px-5 lg:gap-[30px]`}
            >
              <div className="min-h-[280px] w-full bg-stone flex justify-center mt-5">
                {productStack?.length == 0 ? (
                  <div className="w-1/2 flex items-center justify-center h-full gap-5">
                    <div className="flex flex-col items-center justify-center gap-3 w-2/3">
                      <h1 className="m-0 text-center font-cormorant text-[clamp(32px,3.6vw,48px)] font-medium leading-none text-ink">
                        Design your <em className="text-gilt">ring stack</em>
                      </h1>
                      <Text size="textxl" as="p" className="!text-[15px] !leading-[1.65] text-center text-ink-soft">
                        Design your own stack of lab-grown diamond rings. Layer up to 4 styles of your choice!
                      </Text>
                    </div>
                  </div>
                ) : (
                  <div className="w-full flex items-center justify-center h-full overflow-hidden">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                      modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
                    >
                      <SortableContext items={productStack.map((p) => p.stackId)} strategy={verticalListSortingStrategy}>
                        <div className="w-1/2 relative flex justify-center h-full">
                          <div className="flex flex-col items-center justify-center border w-full h-full">
                            <div className="flex flex-col items-center w-full">
                              {productStack.map((product) => (
                                <SortableImage key={product.stackId} product={product} />
                              ))}
                            </div>

                            <div className="pointer-events-auto absolute right-6 top-6 z-30 sm:right-1">
                              <button
                                type="button"
                                aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                                className="flex min-h-[44px] min-w-[44px] cursor-pointer touch-manipulation items-center justify-center rounded-none border-0 bg-transparent p-0 text-ink [-webkit-tap-highlight-color:transparent]"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleAddtoWishlist();
                                }}
                              >
                                {isInWishlist ? (
                                  <FaHeart className="pointer-events-none h-5 w-5 shrink-0" aria-hidden />
                                ) : (
                                  <FaRegHeart className="pointer-events-none h-5 w-5 shrink-0" aria-hidden />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </SortableContext>
                    </DndContext>

                    <div className="w-1/2 px-5 flex flex-col h-full items-center bg-white overflow-hidden">
                      <div className="w-full flex flex-col items-center justify-between mb-5">
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleDragEnd}
                          modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
                        >
                          <SortableContext items={productStack?.map((item) => item.stackId)} strategy={verticalListSortingStrategy}>
                            {productStack?.map((product) => (
                              <SortableItem key={product.stackId} product={product} selectedRing={selectedRing} />
                            ))}
                          </SortableContext>
                          <div className="min-h-16 w-full mt-5 flex justify-between lg:flex-col lg:gap-3">
                            <div className="flex flex-col lg:flex-row items-start gap-[10px] self-stretch relative">
                              <div className="flex items-center justify-between gap-5 self-stretch">
                                <Text size="textmd" className="!text-[10.5px] uppercase tracking-[0.16em] text-ink-soft">
                                  RING SIZE
                                </Text>
                              </div>

                              <div className="w-full lg:w-fit">
                                <div className="flex gap-[10px] self-stretch">
                                  <Select
                                    // showSearch
                                    className={`!w-[150px] ${errorMessage ? '!outline outline-[0.6px] !outline-red-500' : ''}`}
                                    placeholder="Select a Ring Size"
                                    defaultValue={ringSizeMaster?.[0]?.value}
                                    value={selectedRing}
                                    onChange={(value: number | string) => {
                                      setSelectedRing(value);
                                    }}
                                    options={ringSizeMaster}
                                  />
                                </div>
                                {errorMessage && (
                                  <div className="relative">
                                    <Text className="!text-[10px] text-nowrap absolute" style={{ color: 'red', marginTop: '8px' }}>
                                      {errorMessage}
                                    </Text>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="h-full w-2/3 lg:w-full flex justify-end items-center lg:justify-between px-3 lg:px-0 gap-5">
                              <div className="flex mt-2 items-center gap-2 sm:gap-1">
                                Total Price:
                                {productStack?.some((prod) => prod?.discount_value) && (
                                  <Text size="textlg" as="p" className="!font-libre tracking-[0.44px] lg:!text-[18px]">
                                    {formatCurrency(
                                      productStack?.reduce((accumulator, currentValue: any) => {
                                        const selectedRingId = ringSizeMasterData?.find((el: any) => el?.name == selectedRing)?.id;
                                        const ringPrice = getPriceViaRingAndMetal(selectedRingId, currentValue?.metal_type_id);
                                        return (
                                          accumulator +
                                          ringPrice +
                                          (currentValue?.discounted_price ? +currentValue?.discounted_price : +currentValue?.productPrice)
                                        );
                                      }, 0),
                                    )}
                                  </Text>
                                )}
                                <Text
                                  size="textlg"
                                  as="p"
                                  className={`!font-libre ${productStack?.some((prod) => prod?.discount_value) ? 'line-through text-ink-faint !text-[13px] lg:!text-[14px]' : ''}`}
                                >
                                  {formatCurrency(
                                    productStack?.reduce((accumulator, currentValue: any) => {
                                      const selectedRingId = ringSizeMasterData?.find((el: any) => el?.name == selectedRing)?.id;
                                      const ringPrice = getPriceViaRingAndMetal(selectedRingId, currentValue?.metal_type_id);
                                      return accumulator + +currentValue?.productPrice + ringPrice;
                                    }, 0),
                                  )}
                                </Text>
                              </div>
                              <Button
                                type="default"
                                className="w-1/3 lg:w-2/5 !h-11 !rounded-none !border-0 !bg-ink !px-6 !text-[11.5px] !font-medium uppercase !tracking-[0.2em] !text-paper hover:!bg-ink-hover disabled:!bg-ink/40 disabled:!text-paper mt-1"
                                loading={loading}
                                onClick={handleAddtocart}
                                disabled={count < 1}
                              >
                                Add to Cart
                              </Button>
                            </div>
                          </div>
                        </DndContext>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className={`flex flex-col items-start gap-[20px] w-full`}>
                <div className="flex flex-col gap-5 w-full lg:gap-5">
                  <div className="relative">
                    <div className="flex flex-wrap w-[80%] lg:w-[87%] gap-5 lg:gap-3 md:gap-3 ">
                      {/* PRICE */}
                      <div
                        className={`flex flex-col items-start gap-1 h-fit relative border border-line-strong hover:bg-stone ${isFilterOpen == 'price' ? 'bg-stone' : ''}`}
                      >
                        <div
                          className="flex items-center justify-center  gap-2 self-stretch cursor-pointer py-1 px-4"
                          onClick={() => setIsFilterOpen(isFilterOpen == 'price' ? null : 'price')}
                        >
                          {price && price?.length > 0 && (
                            <FiX
                              className=" h-[20px] w-[20px] text-ink-soft hover:bg-white cursor-pointer z-[2]"
                              onClick={() => {
                                const value = [filters?.price_range?.min_price, filters?.price_range?.max_price];
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
                          )}
                          <Text size="textmd" as="p" className="!text-[11px] uppercase tracking-[0.16em] text-ink-soft">
                            PRICE
                          </Text>
                          {isFilterOpen !== 'price' ? (
                            <GoChevronDown className="h-5 w-5 cursor-pointer text-ink-soft" onClick={() => setIsFilterOpen('price')} />
                          ) : (
                            <GoChevronUp className="h-5 w-5 cursor-pointer text-ink-soft" onClick={() => setIsFilterOpen(null)} />
                          )}
                        </div>
                        {isFilterOpen === 'price' && (
                          <div
                            ref={FilterDropdownRef}
                            className="sm:hidden flex flex-col gap-5 absolute border border-line bg-paper min-w-[320px] top-10 left-0 py-5 px-5 z-[2]"
                          >
                            <div className="flex justify-between items-center">
                              <Text size="textlg" as="p" className="font-medium ">
                                PRICE
                              </Text>
                              <FiX className=" h-[18px] w-[18px] cursor-pointer" onClick={() => setIsFilterOpen(null)} />
                            </div>
                            <div className="w-full">
                              <div className="flex justify-between">
                                <div className="flex items-center gap-1">
                                  <p>{filters?.currency_symbol}</p>
                                  <InputNumber
                                    size="small"
                                    min={0}
                                    max={filters?.price_range?.max_price}
                                    style={{ color: 'black' }}
                                    // prefix="$"
                                    value={selectedFilters?.min_price}
                                    onChange={(value: any) => {
                                      setSelectedFilters((prevFilters: any) => ({
                                        ...prevFilters,
                                        min_price: value ?? 0,
                                        // max_price: value[1],
                                      }));
                                      handleFilterChange('price', [value ?? 0, selectedFilters?.max_price]);

                                      dispatch(
                                        setFilterData({
                                          ...filtersData,
                                          min_price: value ?? filters?.price_range?.min_price ?? 0,
                                          // max_price: value[1],
                                        }),
                                      );
                                    }}
                                  />
                                </div>
                                <div className="flex items-center gap-1">
                                  <p>{filters?.currency_symbol}</p>
                                  <InputNumber
                                    size="small"
                                    min={0}
                                    max={filters?.price_range?.max_price}
                                    style={{ color: 'black' }}
                                    // prefix="$"
                                    // style={{ margin: "0 16px" }}
                                    value={selectedFilters?.max_price}
                                    onChange={(value: any) => {
                                      setSelectedFilters((prevFilters: any) => ({
                                        ...prevFilters,
                                        // min_price: value[0],
                                        max_price: value ?? filters?.price_range?.max_price ?? 0,
                                      }));
                                      handleFilterChange('price', [selectedFilters?.min_price, value ?? filters?.price_range?.max_price ?? 0]);
                                      dispatch(
                                        setFilterData({
                                          ...filtersData,
                                          // min_price: value[0],
                                          max_price: value ?? filters?.price_range?.max_price ?? 0,
                                        }),
                                      );
                                    }}
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
                          </div>
                        )}
                      </div>
                      {/* METAL */}
                      <div
                        className={`flex flex-col items-start gap-1 h-fit relative border border-line-strong hover:bg-stone ${isFilterOpen == 'metal' ? 'bg-stone' : ''}`}
                      >
                        <div
                          className="flex items-center justify-center  gap-2 self-stretch cursor-pointer py-1 px-4"
                          onClick={() => setIsFilterOpen(isFilterOpen == 'metal' ? null : 'metal')}
                        >
                          {metal && metal?.length > 0 && (
                            <FiX
                              className=" h-[20px] w-[20px] text-ink-soft hover:bg-white cursor-pointer z-[2]"
                              onClick={() => {
                                handleFilterChange('metal', []);
                                dispatch(
                                  setFilterData({
                                    ...filtersData,
                                    metal: [],
                                  }),
                                );
                              }}
                            />
                          )}
                          <Text size="textmd" as="p" className="!text-[11px] uppercase tracking-[0.16em] text-ink-soft">
                            {metal && metal?.length > 0 ? `METAL (${filtersData?.metal?.length})` : `METAL`}
                          </Text>
                          {isFilterOpen !== 'metal' ? (
                            <GoChevronDown className="h-5 w-5 cursor-pointer text-ink-soft" onClick={() => setIsFilterOpen('metal')} />
                          ) : (
                            <GoChevronUp className="h-5 w-5 cursor-pointer text-ink-soft" onClick={() => setIsFilterOpen(null)} />
                          )}
                        </div>
                        {isFilterOpen == 'metal' && (
                          <div
                            ref={FilterDropdownRef}
                            className="sm:hidden flex flex-col gap-5 absolute border border-line bg-paper min-w-[290px] top-10 left-0 py-5 px-5 z-[2]"
                          >
                            <div className="flex justify-between items-center">
                              <Text size="textlg" as="p" className="font-medium ">
                                METAL
                              </Text>
                              <FiX className=" h-[18px] w-[18px] cursor-pointer" onClick={() => setIsFilterOpen(null)} />
                            </div>

                            <div className="pb-4">
                              <div className="flex flex-col gap-3">
                                {metalFilterMasterRows.map((item: any, index: number) => {
                                  const isSelected = filtersData?.metal?.includes(item.id);
                                  // const isSelected = selectedFilters?.metal?.includes(item.id);

                                  return (
                                    <div key={index}>
                                      <Checkbox
                                        checked={isSelected}
                                        onClick={() => {
                                          const updatedMetals = isSelected
                                            ? filtersData?.metal?.filter((metalId: any) => metalId !== item.id)
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
                                        <Text
                                          as="p"
                                          size="textmd"
                                          // onClick={() => {
                                          //   const updatedMetals = isSelected
                                          //     ? filtersData?.metal?.filter(
                                          //         (metalId) => metalId !== item.id
                                          //       )
                                          //     : [
                                          //         ...(filtersData?.metal || []),
                                          //         item.id,
                                          //       ];

                                          //   dispatch(
                                          //     setFilterData({
                                          //       ...filtersData,
                                          //       metal: updatedMetals,
                                          //     })
                                          //   );
                                          // }}
                                          className={` text-ink-soft cursor-pointer ${isSelected ? '!font-semibold !text-ink' : ''}`}
                                        >
                                          {item?.name}
                                        </Text>
                                      </Checkbox>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      {/* SUBSTYLE */}
                      <div
                        className={`flex flex-col items-start gap-1 h-fit relative border border-line-strong hover:bg-stone ${isFilterOpen == 'sub_style' ? 'bg-stone' : ''}`}
                      >
                        <div
                          className={`flex items-center justify-center  gap-2 self-stretch cursor-pointer py-1 px-4`}
                          onClick={() => setIsFilterOpen(isFilterOpen == 'sub_style' ? null : 'sub_style')}
                        >
                          {filtersData.subTypes.length > 0 && (
                            <FiX
                              className=" h-[20px] w-[20px] text-ink-soft hover:bg-white cursor-pointer z-[2]"
                              onClick={() => {
                                handleFilterChange('subTypes', []);
                                dispatch(
                                  setFilterData({
                                    ...filtersData,
                                    subTypes: [],
                                  }),
                                );
                              }}
                            />
                          )}
                          <Text size="textmd" as="p" className="!text-[11px] uppercase tracking-[0.16em] text-ink-soft">
                            {filtersData.subTypes.length > 0 ? `SUBSTYLE (${filtersData.subTypes.length})` : `SUBSTYLE`}
                          </Text>
                          {isFilterOpen !== 'sub_style' ? (
                            <GoChevronDown className="h-5 w-5 cursor-pointer text-ink-soft" onClick={() => setIsFilterOpen('sub_style')} />
                          ) : (
                            <GoChevronUp className="h-5 w-5 cursor-pointer text-ink-soft" onClick={() => setIsFilterOpen(null)} />
                          )}
                        </div>

                        {isFilterOpen == 'sub_style' && (
                          <div
                            ref={FilterDropdownRef}
                            className="sm:hidden flex flex-col gap-5 absolute border border-line bg-paper min-w-[290px] top-10 left-0 pt-2 px-2 z-[2]"
                          >
                            <div className="flex justify-between items-center px-2">
                              <Text size="textlg" as="p" className="font-medium">
                                SUBSTYLE
                              </Text>
                              <FiX className=" h-[18px] w-[18px] cursor-pointer" onClick={() => setIsFilterOpen(null)} />
                            </div>
                            <div className="relative flex flex-col overflow-scroll pr-2 h-fit max-h-[300px] scrollbar-visible">
                              {filters?.subTypes?.map((item: any, index: number) => (
                                <div
                                  key={index}
                                  className={`flex gap-5 relative items-center border-b select-none justify-center min-h-10 cursor-pointer ${filtersData.subTypes.includes(item?.id) ? '' : ''}`}
                                  onClick={() => {
                                    const updatedStyles = filtersData.subTypes.includes(item?.id)
                                      ? filtersData.subTypes.filter((subType: any) => subType !== item.id)
                                      : [...filtersData.subTypes, item.id];
                                    handleFilterChange('subTypes', updatedStyles);
                                    dispatch(
                                      setFilterData({
                                        ...filtersData,
                                        subTypes: updatedStyles,
                                      }),
                                    );
                                  }}
                                >
                                  <Image
                                    preview={false}
                                    className="px-0 lg:px-1 !w-10"
                                    fallback="/images/no_images.svg"
                                    src={masterData.find((el: any) => el.id === item.id)?.image?.[0] ?? '/images/no_images.svg'}
                                    alt={masterData.find((el: any) => el.id === item.id)?.name}
                                  />
                                  <Text
                                    size="textmd"
                                    className="text-[14px] text-ink w-full xl:text-[13px] lg:text-[12px] text-nowrap overflow-hidden px-0.5 lg:px-0.5"
                                  >
                                    {masterData.find((el: any) => el.id === item.id)?.name}
                                  </Text>
                                  {filtersData.subTypes.includes(item?.id) && (
                                    <FaCheck className="absolute h-6 w-6 text-ink right-4 cursor-pointer" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {/* DIAMOND COLOR */}
                      <div
                        className={`flex flex-col items-start gap-1 h-fit relative border border-line-strong hover:bg-stone ${isFilterOpen == 'diamond_color' ? 'bg-stone' : ''}`}
                      >
                        <div
                          className="flex items-center justify-center  gap-2 self-stretch cursor-pointer py-1 px-4"
                          onClick={() => setIsFilterOpen(isFilterOpen == 'diamond_color' ? null : 'diamond_color')}
                        >
                          {diamondColor && diamondColor?.length > 0 && (
                            <FiX
                              className=" h-[20px] w-[20px] text-ink-soft hover:bg-white cursor-pointer z-[2]"
                              onClick={() => {
                                handleFilterChange('diamondColor', []);
                                dispatch(
                                  setFilterData({
                                    ...filtersData,
                                    diamond_color: [],
                                  }),
                                );
                              }}
                            />
                          )}
                          <Text size="textmd" as="p" className="!text-[11px] uppercase tracking-[0.16em] text-ink-soft">
                            {diamondColor && diamondColor?.length > 0 ? `DIAMOND COLOR (${filtersData?.diamond_color?.length})` : `DIAMOND COLOR`}
                          </Text>
                          {isFilterOpen !== 'diamond_color' ? (
                            <GoChevronDown className="h-5 w-5 cursor-pointer text-ink-soft" onClick={() => setIsFilterOpen('diamond_color')} />
                          ) : (
                            <GoChevronUp className="h-5 w-5 cursor-pointer text-ink-soft" onClick={() => setIsFilterOpen(null)} />
                          )}
                        </div>
                        {isFilterOpen === 'diamond_color' && (
                          <div
                            ref={FilterDropdownRef}
                            className="sm:hidden  flex flex-col gap-5 absolute border border-line bg-paper min-w-[290px] top-10 left-0 py-5 px-5 z-[2]"
                          >
                            <div className="flex justify-between items-center">
                              <Text size="textlg" as="p" className="font-medium ">
                                DIAMOND COLOR
                              </Text>
                              <FiX className=" h-[18px] w-[18px] cursor-pointer" onClick={() => setIsFilterOpen(null)} />
                            </div>
                            <div className="pb-4">
                              <div className="flex flex-col gap-3">
                                {diamondColorFilterMasterRows?.map((item: any, index: number) => {
                                  const isItemSelected = filtersData?.diamond_color?.includes(item.id);

                                  return (
                                    <Checkbox
                                      checked={isItemSelected}
                                      key={index}
                                      onClick={() => {
                                        const updatedColors = isItemSelected
                                          ? filtersData?.diamond_color?.filter((colorId: any) => colorId !== item.id)
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
                                        className={` text-ink-soft cursor-pointer ${isItemSelected ? '!font-semibold !text-ink' : ''}`}
                                      >
                                        {item?.name}
                                      </Text>
                                    </Checkbox>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      {/* SHAPE */}
                      <div
                        className={`flex flex-col items-start gap-1 h-fit relative border border-line-strong hover:bg-stone ${isFilterOpen == 'shape' ? 'bg-stone' : ''}`}
                      >
                        <div
                          className="flex items-center justify-center  gap-2 self-stretch cursor-pointer py-1 px-4"
                          onClick={() => setIsFilterOpen(isFilterOpen == 'shape' ? null : 'shape')}
                        >
                          {shape && shape?.length > 0 && (
                            <FiX
                              className=" h-[20px] w-[20px] text-ink-soft hover:bg-white cursor-pointer z-[2]"
                              onClick={() => {
                                handleFilterChange('shape', []);
                                dispatch(
                                  setFilterData({
                                    ...filtersData,
                                    shape: [],
                                  }),
                                );
                              }}
                            />
                          )}
                          <Text size="textmd" as="p" className="!text-[11px] uppercase tracking-[0.16em] text-ink-soft">
                            {shape && shape?.length > 0 ? `SHAPE (${filtersData?.shape?.length})` : `SHAPE`}
                          </Text>
                          {isFilterOpen !== 'shape' ? (
                            <GoChevronDown className="h-5 w-5 cursor-pointer text-ink-soft" onClick={() => setIsFilterOpen('shape')} />
                          ) : (
                            <GoChevronUp className="h-5 w-5 cursor-pointer text-ink-soft" onClick={() => setIsFilterOpen(null)} />
                          )}
                        </div>
                        {isFilterOpen == 'shape' && (
                          <div
                            ref={FilterDropdownRef}
                            className="sm:hidden  flex flex-col gap-5 absolute border border-line bg-paper min-w-[290px] top-10 left-0 py-5 px-5 z-[2]"
                          >
                            <div className="flex justify-between items-center">
                              <Text size="textlg" as="p" className="font-medium ">
                                SHAPE
                              </Text>
                              <FiX className=" h-[18px] w-[18px] cursor-pointer" onClick={() => setIsFilterOpen(null)} />
                            </div>
                            <div className="pb-4">
                              <div className="flex flex-col gap-3">
                                {shapeFilterMasterRows?.map((item: any, index: number) => {
                                  const isItemSelected = filtersData?.shape?.includes(item.id);

                                  return (
                                    <Checkbox
                                      key={index}
                                      checked={isItemSelected}
                                      onClick={() => {
                                        const updatedShapes = isItemSelected
                                          ? filtersData?.shape?.filter((shapeId: any) => shapeId !== item.id)
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
                                        className={` text-ink-soft cursor-pointer ${isItemSelected ? '!font-semibold !text-ink' : ''}`}
                                      >
                                        {item?.name}
                                      </Text>
                                    </Checkbox>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      {/* CARAT WEIGHT */}
                      <div
                        className={`flex flex-col items-start gap-1 h-fit relative border border-line-strong hover:bg-stone ${isFilterOpen == 'carat' ? 'bg-stone' : ''}`}
                      >
                        <div
                          className="flex items-center justify-center  gap-2 self-stretch cursor-pointer py-1 px-4"
                          onClick={() => setIsFilterOpen(isFilterOpen == 'carat' ? null : 'carat')}
                        >
                          {carat && carat?.length > 0 && (
                            <FiX
                              className=" h-[20px] w-[20px] text-ink-soft hover:bg-white cursor-pointer z-[2]"
                              onClick={() => {
                                const value = [
                                  Math.min(...Object.keys(caratWeight as any).map(Number)),
                                  Math.max(...Object.keys(caratWeight as any).map(Number)),
                                ];
                                handleFilterChange('carat', value);
                                handleSliderChange(value);
                              }}
                            />
                          )}
                          <Text size="textmd" as="p" className="!text-[11px] uppercase tracking-[0.16em] text-ink-soft">
                            CARAT WEIGHT
                          </Text>
                          {isFilterOpen !== 'carat' ? (
                            <GoChevronDown className="h-5 w-5 cursor-pointer text-ink-soft" onClick={() => setIsFilterOpen('carat')} />
                          ) : (
                            <GoChevronUp className="h-5 w-5 cursor-pointer text-ink-soft" onClick={() => setIsFilterOpen(null)} />
                          )}
                        </div>
                        {isFilterOpen == 'carat' && (
                          <div
                            ref={FilterDropdownRef}
                            className="sm:hidden flex flex-col gap-5 absolute border border-line bg-paper min-w-[320px] top-10 left-0 py-5 px-5 z-[2]"
                          >
                            <div className="flex justify-between items-center">
                              <Text size="textlg" as="p" className="font-medium ">
                                CARAT WEIGHT
                              </Text>
                              <FiX className=" h-[18px] w-[18px] cursor-pointer" onClick={() => setIsFilterOpen(null)} />
                            </div>
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
                                    onChange={(value: any) => {
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
                                    }}
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
                                    onChange={(value: any) => {
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
                                    }}
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
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex absolute top-0 right-0 gap-4 lg:gap-3 2xl:gap-3 md:gap-1 self-stretch min-h-10 md:flex-col">
                      <div className="flex relative w-[19%] md:pb-2 items-center justify-end gap-4 md:w-full self-start 2xl:gap-1 2xl:w-fit ">
                        <Select
                          placeholder={`SORT BY`}
                          options={dropDownOptions}
                          defaultValue={dropDownOptions[0]}
                          value={filtersData.sort_order}
                          onChange={(option: any) => {
                            handleFilterChange('sort', option);
                            dispatch(
                              setFilterData({
                                ...filtersData,
                                sort_order: option,
                              }),
                            );
                          }}
                          className="sorting-selection !h-8 gap-2.5 w-[126px] whitespace-nowrap placeholder:text-black text-[16px] lg:text-[14px] 2xl:gap-2"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[14px] text-ink-soft w-[80%]">
                    {carat && filtersData?.carats?.length > 0 && (
                      <div className="flex items-center gap-2 justify-between w-fit border-r px-2">
                        <p>{carat}</p>
                        <FiX
                          className=" h-[20px] w-[20px] text-ink-soft hover:bg-stone cursor-pointer"
                          onClick={() => {
                            const value = [
                              Math.min(...Object.keys(caratWeight as any).map(Number)),
                              Math.max(...Object.keys(caratWeight as any).map(Number)),
                            ];
                            handleFilterChange('carat', value);
                            handleSliderChange(value);
                          }}
                        />
                      </div>
                    )}
                    {price && filtersData?.min_price && filtersData?.max_price && (
                      <div className="flex items-center gap-2 justify-between w-fit border-r px-2">
                        <p>{`${formatCurrency(filtersData?.min_price)} - ${formatCurrency(filtersData?.max_price)}`}</p>
                        <FiX
                          className=" h-[20px] w-[20px] text-ink-soft hover:bg-stone cursor-pointer"
                          onClick={() => {
                            const value = [filters?.price_range?.min_price, filters?.price_range?.max_price];
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
                    )}
                    {gender && filtersData?.gender_category != 3 && (
                      <div className="flex items-center gap-2 justify-between w-fit border-r px-2">
                        <p>{filtersData?.gender_category == 2 ? `Men` : `Women`}</p>
                        <FiX
                          className=" h-[20px] w-[20px] text-ink-soft hover:bg-stone cursor-pointer"
                          onClick={() => {
                            handleFilterChange('gender', 3);
                            dispatch(
                              setFilterData({
                                ...filtersData,
                                gender_category: 3,
                              }),
                            );
                          }}
                        />
                      </div>
                    )}
                    {/* {diamondType && diamondType !== 'both' && filtersData?.diamond_type != 1 && (
                    <div className="flex items-center gap-2 justify-between w-fit border-r px-2">
                      <p>{filtersData?.diamond_type == 2 ? `Natural Diamonds` : `Lab Grown Diamonds`}</p>
                      <FiX
                        className=" h-[20px] w-[20px] text-ink-soft hover:bg-stone cursor-pointer"
                        onClick={() => {
                          handleFilterChange('diamond_type', 1);
                          dispatch(
                            setFilterData({
                              ...filtersData,
                              diamond_type: 1,
                            }),
                          );
                        }}
                      />
                    </div>
                  )} */}
                    {masterData
                      ?.filter((item: any) => filtersData?.subTypes?.includes(item?.id))
                      ?.map((el: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 justify-between w-fit border-r px-2">
                          <p>{el?.name}</p>
                          <FiX
                            className=" h-[20px] w-[20px] text-ink-soft hover:bg-stone cursor-pointer"
                            onClick={() => {
                              const updatedStyles = filtersData.subTypes.includes(el?.id)
                                ? filtersData.subTypes.filter((subType: any) => subType !== el?.id)
                                : [...filtersData.subTypes, el?.id];
                              handleFilterChange('subTypes', updatedStyles);
                              dispatch(
                                setFilterData({
                                  ...filtersData,
                                  subTypes: updatedStyles,
                                }),
                              );
                            }}
                          />{' '}
                        </div>
                      ))}
                    {masterData
                      .filter((item: any) => filtersData?.metal?.includes(item?.id))
                      .map((el: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 justify-between w-fit border-r px-2">
                          <p>{el?.name}</p>
                          <FiX
                            className=" h-[20px] w-[20px] text-ink-soft hover:bg-stone cursor-pointer"
                            onClick={() => {
                              const updatedMetals = filtersData?.metal?.includes(el?.id)
                                ? filtersData?.metal?.filter((metalId: any) => metalId !== el?.id)
                                : [...(filtersData?.metal || []), el?.id];
                              // setSelectedFilters({ ...selectedFilters, metal: updatedMetals });
                              handleFilterChange('metal', updatedMetals);
                              dispatch(
                                setFilterData({
                                  ...filtersData,
                                  metal: updatedMetals,
                                }),
                              );
                            }}
                          />{' '}
                        </div>
                      ))}
                    {masterData
                      .filter((item: any) => filtersData?.shape?.includes(item?.id))
                      .map((el: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 justify-between w-fit border-r px-2">
                          <p>{el?.name}</p>
                          <FiX
                            className=" h-[20px] w-[20px] text-ink-soft hover:bg-stone cursor-pointer"
                            onClick={() => {
                              const updatedShapes = filtersData?.shape?.includes(el?.id)
                                ? filtersData?.shape?.filter((shapeId: any) => shapeId !== el?.id)
                                : [...(filtersData?.shape || []), el?.id];
                              handleFilterChange('shape', updatedShapes);
                              dispatch(
                                setFilterData({
                                  ...filtersData,
                                  shape: updatedShapes,
                                }),
                              );
                            }}
                          />{' '}
                        </div>
                      ))}
                    {masterData
                      .filter((item: any) => filtersData?.diamond_color?.includes(item?.id))
                      .map((el: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 justify-between w-fit border-r px-2">
                          <p>{el?.name}</p>
                          <FiX
                            className=" h-[20px] w-[20px] text-ink-soft hover:bg-stone cursor-pointer"
                            onClick={() => {
                              const updatedColors = filtersData?.diamond_color?.includes(el?.id)
                                ? filtersData?.diamond_color?.filter((colorId: any) => colorId !== el?.id)
                                : [...(filtersData?.diamond_color || []), el?.id];
                              handleFilterChange('diamondColor', updatedColors);
                              dispatch(
                                setFilterData({
                                  ...filtersData,
                                  diamond_color: updatedColors,
                                }),
                              );
                            }}
                          />{' '}
                        </div>
                      ))}
                    {((gender && gender !== 'for_her') || carat || shape || metal || diamondColor || price || subTypes) && (
                      // ||
                      // (diamondType && diamondType !== 'both')
                      <div className="flex items-center gap-2 justify-between w-fit">
                        <span
                          className="inline text-ink-faint cursor-pointer pl-1"
                          onClick={() => {
                            // router.push(`/${jewelryType}`);
                            window?.history.replaceState(null, '', `${pathname}`);
                          }}
                        >
                          Reset Filters
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div ref={divRef} className={`flex flex-col w-[100%] gap-10 self-start lg:gap-6 sm:w-full relative`}>
              {isAtTop && productStack?.length !== 0 && (
                <div className="w-full min-h-[120px] h-fit !sticky top-0 left-0 z-20 border bg-stone flex justify-center items-center">
                  <div className="flex justify-center items-center gap-5 w-[90%] h-full p-4">
                    <div className="font-cormorant text-[24px] font-medium leading-none text-ink">Your Ring Stack</div>
                    <div className="flex items-center gap-4">
                      {productStack.map((product, index) => (
                        <div key={index} className="flex items-center gap-0">
                          <span>{index + 1}.</span>
                          <Image
                            src={product.stackable_image ?? '/images/no_images.svg'}
                            alt={product.productName}
                            // width={140}
                            // height={35}
                            className="!w-[75%] !max-w-[240px] object-contain ml-2"
                            preview={false}
                            style={{
                              mixBlendMode: 'multiply',
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col items-center">
                      {productStack.map((product, index) => (
                        <Image
                          key={index}
                          src={product.stackable_image ?? '/images/no_images.svg'}
                          alt={product.productName}
                          // width={140}
                          // height={35}
                          preview={false}
                          className="!w-[70%] !max-w-[270px] object-contain"
                          style={{
                            mixBlendMode: 'multiply',
                          }}
                        />
                      ))}
                    </div>
                    <div>
                      <Button
                        type="default"
                        className="w-full !h-11 !rounded-none !border-0 !bg-ink !px-6 !text-[11.5px] !font-medium uppercase !tracking-[0.2em] !text-paper hover:!bg-ink-hover disabled:!bg-ink/40 disabled:!text-paper"
                        onClick={() => {
                          sectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        Customize
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-10 w-full 2xl:px-[50px] xl:px-[50px] lg:px-[30px] md:px-5 sm:px-5">
                {isLoading && (
                  <>
                    <div className="w-full flex justify-center items-center min-h-[30vh]">
                      <LuLoader className="h-10 w-10 animate-spin" />
                    </div>
                  </>
                )}
                {!isLoading && products?.length === 0 && (
                  <div className="px-8 w-full flex flex-col items-center justify-center gap-[10px] lg:ml-0 md:ml-0 sm:gap-[30px] min-h-[30vh]">
                    <p className="m-0 text-center font-cormorant text-[24px] leading-[1.2] text-ink">
                      We found no results that match your search criteria.
                    </p>
                    <p className="m-0 text-center font-cormorant text-[24px] leading-[1.2] text-ink">
                      Please expand your search or
                      <span
                        className="inline cursor-pointer pl-1 text-teal underline underline-offset-[3px]"
                        onClick={() => {
                          // router.push(`/${jewelryType}`);
                          window?.history.replaceState(null, '', `${pathname}`);
                        }}
                      >
                        reset your filters
                      </span>
                      .
                    </p>
                  </div>
                )}
                {!isLoading && products?.length > 0 && (
                  <div className="w-full flex flex-col items-center">
                    <div className="w-full grid grid-cols-4 gap-4 mb-4 sm:mb-2 md:grid-cols-3 sm:grid-cols-2 sm:gap-2">
                      {chunkedData?.map((chunk: any, index: number) => (
                        <div key={index} className="col-span-1">
                          <ProductProfile {...chunk} is_stackable={true} isStatic={true} key={'group2652' + index} className={`w-full`} />
                          {/* <ChunkComponent key={index} chunk={chunk} index={index} bannerData={[]} /> */}
                        </div>
                      ))}
                    </div>
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

        {/* Mobile + Tab screen */}
        <div className="md:!flex !hidden justify-center border-b border-line py-14 lg:py-10 md:py-5 sm:py-4">
          <div className="mx-auto w-full max-w-[1440px] !flex flex-col px-5 sm:px-3">
            <div className="flex items-start justify-between flex-wrap">
              <div className="min-h-[280px] mb-5 w-full bg-stone flex justify-center items-center">
                {productStack?.length == 0 ? (
                  <div className="w-full flex sm:flex-col py-5 items-center justify-center h-full gap-5">
                    <div className="flex flex-col items-center justify-center gap-3 w-2/3">
                      <h1 className="m-0 text-center font-cormorant text-[clamp(32px,3.6vw,48px)] font-medium leading-none text-ink">
                        Design your <em className="text-gilt">ring stack</em>
                      </h1>
                      <Text size="textxl" as="p" className="!text-[15px] !leading-[1.65] text-center text-ink-soft">
                        Design your own stack of lab-grown diamond rings. Layer up to 4 styles of your choice!
                      </Text>
                    </div>
                  </div>
                ) : (
                  <div className="w-full flex flex-col items-center justify-center">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                      modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
                    >
                      <SortableContext items={productStack.map((p) => p.stackId)} strategy={verticalListSortingStrategy}>
                        <div className="min-h-[240px] w-full h-full relative flex items-center justify-center">
                          <div className="flex flex-col items-center justify-center w-[180px] max-w-[500px]">
                            {productStack.map((product) => (
                              <SortableImage key={product.stackId} product={product} />
                            ))}
                            <div className="pointer-events-auto absolute top-4 right-4 z-30 sm:top-1 sm:right-1 p-1">
                              <button
                                type="button"
                                aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                                className="flex min-h-[44px] min-w-[44px] cursor-pointer touch-manipulation items-center justify-center rounded-none border-0 bg-transparent p-0 text-ink [-webkit-tap-highlight-color:transparent]"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleAddtoWishlist();
                                }}
                              >
                                {isInWishlist ? (
                                  <FaHeart className="pointer-events-none h-5 w-5 shrink-0" aria-hidden />
                                ) : (
                                  <FaRegHeart className="pointer-events-none h-5 w-5 shrink-0" aria-hidden />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </SortableContext>
                    </DndContext>

                    <div className="w-full flex flex-col h-full items-center bg-white ">
                      <div className="w-full flex flex-col items-center justify-between mb-5">
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleDragEnd}
                          modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
                        >
                          <SortableContext items={productStack?.map((item) => item.stackId)} strategy={verticalListSortingStrategy}>
                            {productStack?.map((product) => (
                              <SortableItem key={product.stackId} product={product} selectedRing={selectedRing} />
                            ))}
                          </SortableContext>
                          <div className="min-h-16 w-full mt-5 flex md:flex-col md:gap-2 sm:flex-col justify-between sm:gap-2">
                            <div className="md:w-full flex md:flex-row sm:flex-row flex-col items-start gap-[10px] md:gap-[10px] self-stretch relative">
                              <div className="flex items-center justify-between gap-5 self-stretch">
                                <Text size="textmd" className="!text-[10.5px] uppercase tracking-[0.16em] text-ink-soft sm:text-[14px]">
                                  RING SIZE
                                </Text>
                              </div>

                              <div className="w-full md:w-fit">
                                <div className="flex gap-[10px] self-stretch">
                                  <Select
                                    // showSearch
                                    className={`!w-[150px] ${errorMessage ? '!outline !outline-red-500' : ''}`}
                                    placeholder="Select a Ring Size"
                                    defaultValue={ringSizeMaster?.[0]?.value}
                                    value={selectedRing}
                                    onChange={(value: number | string) => {
                                      setSelectedRing(value);
                                    }}
                                    options={ringSizeMaster}
                                  />
                                </div>
                                {errorMessage && (
                                  <div className="relative">
                                    <Text className="!text-[10px] text-nowrap absolute" style={{ color: 'red', marginTop: '8px' }}>
                                      {errorMessage}
                                    </Text>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="h-full w-2/3 md:w-full flex sm:flex-col justify-end sm:justify-normal md:justify-between items-center px-3 md:px-0 sm:gap-2 gap-5">
                              <div className="flex sm:w-full mt-2 items-center sm:text-[14px] gap-2 sm:gap-2">
                                Total Price:
                                {productStack?.some((prod) => prod?.discount_value) && (
                                  <Text size="textlg" as="p" className="!font-libre tracking-[0.44px] md:!text-[20px] sm:!text-[16px]">
                                    {formatCurrency(
                                      productStack?.reduce((accumulator, currentValue: any) => {
                                        const selectedRingId = ringSizeMasterData?.find((el: any) => el?.name == selectedRing)?.id;
                                        const ringPrice = getPriceViaRingAndMetal(selectedRingId, currentValue?.metal_type_id);
                                        return (
                                          accumulator +
                                          ringPrice +
                                          (currentValue?.discounted_price ? +currentValue?.discounted_price : +currentValue?.productPrice)
                                        );
                                      }, 0),
                                    )}
                                  </Text>
                                )}
                                <Text
                                  size="textlg"
                                  as="p"
                                  className={`!font-libre ${productStack?.some((prod) => prod?.discount_value) ? 'line-through text-ink-faint !text-[13px] md:!text-[15px] sm:!text-[12px]' : ''}`}
                                >
                                  {formatCurrency(
                                    productStack?.reduce((accumulator, currentValue: any) => {
                                      const selectedRingId = ringSizeMasterData?.find((el: any) => el?.name == selectedRing)?.id;
                                      const ringPrice = getPriceViaRingAndMetal(selectedRingId, currentValue?.metal_type_id);
                                      return accumulator + +currentValue?.productPrice + ringPrice;
                                    }, 0),
                                  )}
                                </Text>
                              </div>
                              <Button
                                type="default"
                                className="w-1/3 md:w-1/2 sm:w-full !h-11 !rounded-none !border-0 !bg-ink !px-6 !text-[11.5px] !font-medium uppercase !tracking-[0.2em] !text-paper hover:!bg-ink-hover disabled:!bg-ink/40 disabled:!text-paper mt-1"
                                loading={loading}
                                onClick={handleAddtocart}
                                disabled={count < 1}
                              >
                                Add to Cart
                              </Button>
                            </div>
                          </div>
                        </DndContext>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className=" flex flex-col gap-3 items-start justify-between w-full ">
                <div className="relative">
                  <div className="flex max-w-[95vw] w-[100%] gap-5 lg:gap-3 md:gap-3 sm:gap-3 overflow-x-auto pb-2 text-nowrap">
                    {/* GENDER  */}
                    <>
                      {/* <div
                    className={`flex flex-col items-start gap-1 h-fit relative border border-line-strong hover:bg-stone ${isFilterOpen == 'gender' ? 'bg-stone' : ''}`}
                  >
                    <div
                      className="flex items-center justify-center  gap-2 self-stretch cursor-pointer py-1 px-4"
                      onClick={() => setIsFilterOpen(isFilterOpen === 'gender' ? null : 'gender')}
                    >
                      {gender && gender?.length > 0 && (
                        <FiX
                          className=" h-[20px] w-[20px] text-ink-soft hover:bg-white cursor-pointer z-[2]"
                          onClick={() => {
                            handleFilterChange('gender', 3);
                            dispatch(
                              setFilterData({
                                ...filtersData,
                                gender_category: 3,
                              }),
                            );
                          }}
                        />
                      )}
                      <Text size="textmd" as="p" className="!text-[11px] uppercase tracking-[0.16em] text-ink-soft">
                        {`GENDER ${filtersData?.gender_category == 2 ? `(Men)` : filtersData?.gender_category == 3 ? `(Women)` : ''}`}
                      </Text>
                      {isFilterOpen !== 'gender' ? (
                        <GoChevronDown className="h-5 w-5 cursor-pointer text-ink-soft" onClick={() => setIsFilterOpen('gender')} />
                      ) : (
                        <GoChevronUp className="h-5 w-5 cursor-pointer text-ink-soft" onClick={() => setIsFilterOpen(null)} />
                      )}
                    </div>
                  </div> */}
                    </>
                    {/* PRICE */}
                    <div
                      className={`flex flex-col items-start gap-1 h-fit relative border border-line-strong hover:bg-stone ${isFilterOpen == 'price' ? 'bg-stone' : ''}`}
                    >
                      <div
                        className="flex items-center justify-center  gap-2 self-stretch cursor-pointer py-1 px-4"
                        onClick={() => setIsFilterOpen(isFilterOpen == 'price' ? null : 'price')}
                      >
                        {price && price?.length > 0 && (
                          <FiX
                            className=" h-[20px] w-[20px] text-ink-soft hover:bg-white cursor-pointer z-[2]"
                            onClick={() => {
                              const value = [filters?.price_range?.min_price, filters?.price_range?.max_price];
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
                        )}
                        <Text size="textmd" as="p" className="!text-[11px] uppercase tracking-[0.16em] text-ink-soft">
                          PRICE
                        </Text>
                        {isFilterOpen !== 'price' ? (
                          <GoChevronDown className="h-5 w-5 cursor-pointer text-ink-soft" onClick={() => setIsFilterOpen('price')} />
                        ) : (
                          <GoChevronUp className="h-5 w-5 cursor-pointer text-ink-soft" onClick={() => setIsFilterOpen(null)} />
                        )}
                      </div>
                    </div>
                    {/* METAL */}
                    <div
                      className={`flex flex-col items-start gap-1 h-fit relative border border-line-strong hover:bg-stone ${isFilterOpen == 'metal' ? 'bg-stone' : ''}`}
                    >
                      <div
                        className="flex items-center justify-center  gap-2 self-stretch cursor-pointer py-1 px-4"
                        onClick={() => setIsFilterOpen(isFilterOpen == 'metal' ? null : 'metal')}
                      >
                        {metal && metal?.length > 0 && (
                          <FiX
                            className=" h-[20px] w-[20px] text-ink-soft hover:bg-white cursor-pointer z-[2]"
                            onClick={() => {
                              handleFilterChange('metal', []);
                              dispatch(
                                setFilterData({
                                  ...filtersData,
                                  metal: [],
                                }),
                              );
                            }}
                          />
                        )}
                        <Text size="textmd" as="p" className="!text-[11px] uppercase tracking-[0.16em] text-ink-soft">
                          {metal && metal?.length > 0 ? `METAL (${filtersData?.metal?.length})` : `METAL`}
                        </Text>
                        {isFilterOpen !== 'metal' ? (
                          <GoChevronDown className="h-5 w-5 cursor-pointer text-ink-soft" onClick={() => setIsFilterOpen('metal')} />
                        ) : (
                          <GoChevronUp className="h-5 w-5 cursor-pointer text-ink-soft" onClick={() => setIsFilterOpen(null)} />
                        )}
                      </div>
                    </div>
                    {/* DIAMOND TYPE */}
                    {/* <div
                    className={`flex flex-col items-start gap-1 h-fit relative border border-line-strong  hover:bg-stone ${isFilterOpen == 'diamond_type' ? 'bg-stone' : ''}`}
                  >
                    <div
                      className="flex items-center justify-center  gap-2 self-stretch cursor-pointer py-1 px-4"
                      onClick={() => setIsFilterOpen(isFilterOpen === 'diamond_type' ? null : 'diamond_type')}
                    >
                      {diamondType && diamondType !== 'both' && diamondType?.length > 0 && (
                        <FiX
                          className=" h-[20px] w-[20px] text-ink-soft hover:bg-white cursor-pointer z-[2]"
                          onClick={() => {
                            handleFilterChange('diamond_type', 1);
                            dispatch(
                              setFilterData({
                                ...filtersData,
                                gender_category: 1,
                              }),
                            );
                          }}
                        />
                      )}
                      <Text size="textmd" as="p" className="!text-[11px] uppercase tracking-[0.16em] text-ink-soft">
                        {`DIAMOND TYPE ${filtersData?.diamond_type == 2 ? `(Natural)` : filtersData?.diamond_type == 3 ? `(Lab Grown)` : ''}`}
                      </Text>
                      {isFilterOpen !== 'diamond_type' ? (
                        <GoChevronDown className="h-5 w-5 cursor-pointer text-ink-soft" onClick={() => setIsFilterOpen('diamond_type')} />
                      ) : (
                        <GoChevronUp className="h-5 w-5 cursor-pointer text-ink-soft" onClick={() => setIsFilterOpen(null)} />
                      )}
                    </div>
                  </div> */}
                    {/* DIAMOND COLOR */}
                    <div
                      className={`flex flex-col items-start gap-1 h-fit relative border border-line-strong  hover:bg-stone ${isFilterOpen == 'diamond_color' ? 'bg-stone' : ''}`}
                    >
                      <div
                        className="flex items-center justify-center  gap-2 self-stretch cursor-pointer py-1 px-4"
                        onClick={() => setIsFilterOpen(isFilterOpen == 'diamond_color' ? null : 'diamond_color')}
                      >
                        {diamondColor && diamondColor?.length > 0 && (
                          <FiX
                            className=" h-[20px] w-[20px] text-ink-soft hover:bg-white cursor-pointer z-[2]"
                            onClick={() => {
                              handleFilterChange('diamondColor', []);
                              dispatch(
                                setFilterData({
                                  ...filtersData,
                                  diamond_color: [],
                                }),
                              );
                            }}
                          />
                        )}
                        <Text size="textmd" as="p" className="!text-[11px] uppercase tracking-[0.16em] text-ink-soft">
                          {diamondColor && diamondColor?.length > 0 ? `DIAMOND COLOR (${filtersData?.diamond_color?.length})` : `DIAMOND COLOR`}
                        </Text>
                        {isFilterOpen !== 'diamond_color' ? (
                          <GoChevronDown className="h-5 w-5 cursor-pointer text-ink-soft" onClick={() => setIsFilterOpen('diamond_color')} />
                        ) : (
                          <GoChevronUp className="h-5 w-5 cursor-pointer text-ink-soft" onClick={() => setIsFilterOpen(null)} />
                        )}
                      </div>
                    </div>
                    {/* SHAPE */}
                    <div
                      className={`flex flex-col items-start gap-1 h-fit relative border border-line-strong  hover:bg-stone ${isFilterOpen == 'shape' ? 'bg-stone' : ''}`}
                    >
                      <div
                        className="flex items-center justify-center  gap-2 self-stretch cursor-pointer py-1 px-4"
                        onClick={() => setIsFilterOpen(isFilterOpen == 'shape' ? null : 'shape')}
                      >
                        {shape && shape?.length > 0 && (
                          <FiX
                            className=" h-[20px] w-[20px] text-ink-soft hover:bg-white cursor-pointer z-[2]"
                            onClick={() => {
                              handleFilterChange('shape', []);
                              dispatch(
                                setFilterData({
                                  ...filtersData,
                                  shape: [],
                                }),
                              );
                            }}
                          />
                        )}
                        <Text size="textmd" as="p" className="!text-[11px] uppercase tracking-[0.16em] text-ink-soft">
                          {shape && shape?.length > 0 ? `SHAPE (${filtersData?.shape?.length})` : `SHAPE`}
                        </Text>
                        {isFilterOpen !== 'shape' ? (
                          <GoChevronDown className="h-5 w-5 cursor-pointer text-ink-soft" onClick={() => setIsFilterOpen('shape')} />
                        ) : (
                          <GoChevronUp className="h-5 w-5 cursor-pointer text-ink-soft" onClick={() => setIsFilterOpen(null)} />
                        )}
                      </div>
                    </div>
                    {/* CARAT WEIGHT */}
                    <div
                      className={`flex flex-col items-start gap-1 h-fit relative border border-line-strong  hover:bg-stone ${isFilterOpen == 'carat' ? 'bg-stone' : ''}`}
                    >
                      <div
                        className="flex items-center justify-center  gap-2 self-stretch cursor-pointer py-1 px-4"
                        onClick={() => setIsFilterOpen(isFilterOpen == 'carat' ? null : 'carat')}
                      >
                        {carat && carat?.length > 0 && (
                          <FiX
                            className=" h-[20px] w-[20px] text-ink-soft hover:bg-white cursor-pointer z-[2]"
                            onClick={() => {
                              const value = [caratBounds.min, caratBounds.max];
                              handleFilterChange('carat', value);
                              handleSliderChange(value);
                            }}
                          />
                        )}
                        <Text size="textmd" as="p" className="!text-[11px] uppercase tracking-[0.16em] text-ink-soft">
                          CARAT WEIGHT
                        </Text>
                        {isFilterOpen !== 'carat' ? (
                          <GoChevronDown className="h-5 w-5 cursor-pointer text-ink-soft" onClick={() => setIsFilterOpen('carat')} />
                        ) : (
                          <GoChevronUp className="h-5 w-5 cursor-pointer text-ink-soft" onClick={() => setIsFilterOpen(null)} />
                        )}
                      </div>
                    </div>
                    {/* SUBSTYLE */}
                    <div
                      className={`flex flex-col items-start gap-1 h-fit relative border border-line-strong hover:bg-stone ${isFilterOpen == 'sub_style' ? 'bg-stone' : ''}`}
                    >
                      <div
                        className={`flex relative items-center justify-center  gap-2 self-stretch cursor-pointer py-1 px-4`}
                        onClick={() => setIsFilterOpen(isFilterOpen == 'sub_style' ? null : 'sub_style')}
                      >
                        {filtersData.subTypes.length > 0 && (
                          <FiX
                            className=" h-[20px] w-[20px] text-ink-soft hover:bg-white cursor-pointer z-[2]"
                            onClick={() => {
                              handleFilterChange('subTypes', []);
                              dispatch(
                                setFilterData({
                                  ...filtersData,
                                  subTypes: [],
                                }),
                              );
                            }}
                          />
                        )}
                        <Text size="textmd" as="p" className="!text-[11px] uppercase tracking-[0.16em] text-ink-soft">
                          {filtersData.subTypes.length > 0 ? `SUBSTYLE (${filtersData.subTypes.length})` : `SUBSTYLE`}
                        </Text>
                        {isFilterOpen !== 'sub_style' ? (
                          <GoChevronDown className="h-5 w-5 cursor-pointer text-ink-soft" onClick={() => setIsFilterOpen('sub_style')} />
                        ) : (
                          <GoChevronUp className="h-5 w-5 cursor-pointer text-ink-soft" onClick={() => setIsFilterOpen(null)} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {((gender && gender !== 'for_her') ||
                  // (diamondType && diamondType !== 'both') ||
                  carat ||
                  shape ||
                  metal ||
                  diamondColor ||
                  price ||
                  subTypes) && (
                  <div className="flex flex-wrap gap-2 text-[14px] text-ink-soft w-[100%] ">
                    {carat && filtersData?.carats?.length > 0 && (
                      <div className="flex items-center gap-2 justify-between w-fit border-r px-2">
                        <p>{`${filtersData?.carats?.[0]} - ${filtersData?.carats?.[1]}`}</p>
                        <FiX
                          className=" h-[20px] w-[20px] text-ink-soft hover:bg-stone cursor-pointer"
                          onClick={() => {
                            const value = [caratBounds.min, caratBounds.max];
                            handleFilterChange('carat', value);
                            handleSliderChange(value);
                          }}
                        />
                      </div>
                    )}
                    {price && filtersData?.min_price && filtersData?.max_price && (
                      <div className="flex items-center gap-2 justify-between w-fit border-r px-2">
                        <p>{`${formatCurrency(filtersData?.min_price)} - ${formatCurrency(filtersData?.max_price)}`}</p>
                        <FiX
                          className=" h-[20px] w-[20px] text-ink-soft hover:bg-stone cursor-pointer"
                          onClick={() => {
                            const value = [filters?.price_range?.min_price, filters?.price_range?.max_price];
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
                    )}
                    {gender && gender !== 'for_her' && filtersData?.gender_category != 3 && (
                      <div className="flex items-center gap-2 justify-between w-fit border-r px-2">
                        <p>{filtersData?.gender_category == 2 ? `Men` : `Women`}</p>
                        <FiX
                          className=" h-[20px] w-[20px] text-ink-soft hover:bg-stone cursor-pointer"
                          onClick={() => {
                            handleFilterChange('gender', 3);
                            dispatch(
                              setFilterData({
                                ...filtersData,
                                gender_category: 3,
                              }),
                            );
                          }}
                        />
                      </div>
                    )}
                    {/* {diamondType && diamondType !== 'both' && filtersData?.diamond_type != 1 && (
                    <div className="flex items-center gap-2 justify-between w-fit border-r px-2">
                      <p>{filtersData?.diamond_type == 2 ? `Natural` : `Lab Grown`}</p>
                      <FiX
                        className=" h-[20px] w-[20px] text-ink-soft hover:bg-stone cursor-pointer"
                        onClick={() => {
                          handleFilterChange('diamond_type', 1);
                          dispatch(
                            setFilterData({
                              ...filtersData,
                              diamond_type: 1,
                            }),
                          );
                        }}
                      />
                    </div>
                  )} */}
                    {masterData
                      .filter((item: any) => filtersData?.subTypes?.includes(item?.id))
                      .map((el: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 justify-between w-fit border-r px-2">
                          <p>{el?.name}</p>
                          <FiX
                            className=" h-[20px] w-[20px] text-ink-soft hover:bg-stone cursor-pointer"
                            onClick={() => {
                              const updatedStyles = filtersData.subTypes.includes(el?.id)
                                ? filtersData.subTypes.filter((subType: any) => subType !== el?.id)
                                : [...filtersData.subTypes, el?.id];
                              handleFilterChange('subTypes', updatedStyles);
                              dispatch(
                                setFilterData({
                                  ...filtersData,
                                  subTypes: updatedStyles,
                                }),
                              );
                            }}
                          />{' '}
                        </div>
                      ))}
                    {masterData
                      .filter((item: any) => filtersData?.metal?.includes(item?.id))
                      .map((el: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 justify-between w-fit border-r px-2">
                          <p>{el?.name}</p>
                          <FiX
                            className=" h-[20px] w-[20px] text-ink-soft hover:bg-stone cursor-pointer"
                            onClick={() => {
                              const updatedMetals = filtersData?.metal?.includes(el?.id)
                                ? filtersData?.metal?.filter((metalId: any) => metalId !== el?.id)
                                : [...(filtersData?.metal || []), el?.id];
                              // setSelectedFilters({ ...selectedFilters, metal: updatedMetals });
                              handleFilterChange('metal', updatedMetals);
                              dispatch(
                                setFilterData({
                                  ...filtersData,
                                  metal: updatedMetals,
                                }),
                              );
                            }}
                          />{' '}
                        </div>
                      ))}
                    {masterData
                      .filter((item: any) => filtersData?.shape?.includes(item?.id))
                      .map((el: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 justify-between w-fit border-r px-2">
                          <p>{el?.name}</p>
                          <FiX
                            className=" h-[20px] w-[20px] text-ink-soft hover:bg-stone cursor-pointer"
                            onClick={() => {
                              const updatedShapes = filtersData?.shape?.includes(el?.id)
                                ? filtersData?.shape?.filter((shapeId: any) => shapeId !== el?.id)
                                : [...(filtersData?.shape || []), el?.id];
                              handleFilterChange('shape', updatedShapes);
                              dispatch(
                                setFilterData({
                                  ...filtersData,
                                  shape: updatedShapes,
                                }),
                              );
                            }}
                          />{' '}
                        </div>
                      ))}
                    {masterData
                      ?.filter((item: any) => filtersData?.diamond_color?.includes(item?.id))
                      ?.map((el: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 justify-between w-fit border-r px-2">
                          <p>{el?.name}</p>
                          <FiX
                            className=" h-[20px] w-[20px] text-ink-soft hover:bg-stone cursor-pointer"
                            onClick={() => {
                              const updatedColors = filtersData?.diamond_color?.includes(el?.id)
                                ? filtersData?.diamond_color?.filter((colorId: any) => colorId !== el?.id)
                                : [...(filtersData?.diamond_color || []), el?.id];
                              handleFilterChange('diamondColor', updatedColors);
                              dispatch(
                                setFilterData({
                                  ...filtersData,
                                  diamond_color: updatedColors,
                                }),
                              );
                            }}
                          />{' '}
                        </div>
                      ))}
                    {((gender && gender !== 'for_her') ||
                      // (diamondType && diamondType !== 'both') ||
                      carat ||
                      shape ||
                      metal ||
                      diamondColor ||
                      price ||
                      subTypes) && (
                      <div className="flex items-center gap-2 justify-between w-fit">
                        <span
                          className="inline text-ink-faint cursor-pointer pl-1"
                          onClick={() => {
                            // router.push(`/${jewelryType}`);
                            window?.history.replaceState(null, '', `${pathname}`);
                          }}
                        >
                          Reset Filters
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <div className="relative self-end mb-3">
                  <Select
                    placeholder={`SORT BY`}
                    defaultValue={dropDownOptions[0]}
                    options={dropDownOptions}
                    value={filtersData.sort_order}
                    onChange={(option: any) => {
                      handleFilterChange('sort', option);
                      dispatch(
                        setFilterData({
                          ...filtersData,
                          sort_order: option.value,
                        }),
                      );
                    }}
                    className="sorting-selection gap-2.5 min-w-[110px] whitespace-nowrap placeholder:!text-black text-[16px] lg:text-[14px] 2xl:gap-2 sm:!h-[29px] sm:min-w-[97px] sm:placeholder:text-[14px]"
                  />
                  {/* {isFasterPopup && isFasterPopupShow && products?.length > 0 && (
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
                )} */}
                </div>
              </div>
            </div>
            {/* filters sideMenu started */}
            {windowWidth <= 768 && (
              <Drawer
                placement="bottom"
                closable
                onClose={() => setIsFilterOpen(null)}
                rootClassName="ring-stack-mobile-filter-drawer"
                zIndex={10001}
                getContainer={typeof document !== 'undefined' ? document.body : undefined}
                open={isFilterOpen !== null}
                closeIcon={
                  <div className="flex gap-1 justify-between items-center pl-4">
                    <FiX className=" cursor-pointer text-ink-faint" />
                    <Text size="textxl" as="p" className="font-medium text-ink-soft">
                      Close
                    </Text>
                  </div>
                }
                key="bottom"
                // fit-content breaks bottom-sheet height on iOS Safari (often resolves to 0 / off-screen).
                height="85dvh"
                styles={{
                  wrapper: {
                    maxHeight: '50dvh',
                    minHeight: 'min(40dvh, 320px)',
                  },
                  body: {
                    maxHeight: '78dvh',
                    minHeight: 0,
                    overflowY: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
                  },
                }}
                extra={
                  <span
                    className="inline text-ink-faint cursor-pointer pl-1"
                    onClick={() => {
                      // router.push(`/${jewelryType}`);
                      window?.history.replaceState(null, '', `/${pathname}`);
                    }}
                  >
                    Reset Filters
                  </span>
                }
              >
                <div className="flex !min-h-fit flex-wrap w-[100%] gap-5 lg:gap-3 md:gap-3 sm:gap-3 mb-[55px]">
                  {/* GENDER  */}
                  {isFilterOpen === 'gender' && (
                    <div ref={FilterDropdownRef} className="flex flex-col gap-5 w-full bg-white">
                      <div className="flex justify-between items-center">
                        <Text size="textxl" as="p" className="font-medium">
                          GENDER
                        </Text>
                        {/* <FiX className=" h-[18px] w-[18px] cursor-pointer text-gray-700" onClick={() => setIsFilterOpen(null)} /> */}
                      </div>
                      <div className="radio-group-plp ">
                        <Radio.Group
                          className="!flex !flex-col w-full justify-evenly lg:!grid lg:!grid-cols-3 lg:gap-0 gap-3 lg:!text-[10px]"
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
                    </div>
                  )}
                  {/* PRICE */}
                  {isFilterOpen === 'price' && (
                    <div ref={FilterDropdownRef} className="flex flex-col gap-5 w-full bg-white">
                      <div className="flex justify-between items-center">
                        <Text size="textxl" as="p" className="font-medium ">
                          PRICE
                        </Text>
                        {/* <FiX className=" h-[18px] w-[18px] cursor-pointer" onClick={() => setIsFilterOpen(null)} /> */}
                      </div>
                      <div className="w-full">
                        <div className="flex justify-between">
                          <div className="flex items-center gap-1">
                            <p>{filters?.currency_symbol}</p>
                            <InputNumber
                              size="small"
                              min={0}
                              max={filters?.price_range?.max_price}
                              style={{ color: 'black' }}
                              // prefix="$"
                              value={selectedFilters?.min_price}
                              onChange={(value: any) => {
                                setSelectedFilters((prevFilters: any) => ({
                                  ...prevFilters,
                                  min_price: value ?? 0,
                                  // max_price: value[1],
                                }));
                                handleFilterChange('price', [value ?? 0, selectedFilters?.max_price]);

                                dispatch(
                                  setFilterData({
                                    ...filtersData,
                                    min_price: value ?? filters?.price_range?.min_price ?? 0,
                                    // max_price: value[1],
                                  }),
                                );
                              }}
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <p>{filters?.currency_symbol}</p>
                            <InputNumber
                              size="small"
                              min={0}
                              max={filters?.price_range?.max_price}
                              style={{ color: 'black' }}
                              // prefix="$"
                              // style={{ margin: "0 16px" }}
                              value={selectedFilters?.max_price}
                              onChange={(value: any) => {
                                setSelectedFilters((prevFilters: any) => ({
                                  ...prevFilters,
                                  // min_price: value[0],
                                  max_price: value ?? filters?.price_range?.max_price ?? 0,
                                }));
                                handleFilterChange('price', [selectedFilters?.min_price, value ?? filters?.price_range?.max_price ?? 0]);
                                dispatch(
                                  setFilterData({
                                    ...filtersData,
                                    // min_price: value[0],
                                    max_price: value ?? filters?.price_range?.max_price ?? 0,
                                  }),
                                );
                              }}
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
                    </div>
                  )}
                  {/* METAL */}
                  {isFilterOpen == 'metal' && (
                    <div ref={FilterDropdownRef} className="flex flex-col gap-5 w-full bg-white">
                      <div className="flex justify-between items-center">
                        <Text size="textlg" as="p" className="font-medium ">
                          METAL
                        </Text>
                        {/* <FiX className=" h-[18px] w-[18px] cursor-pointer" onClick={() => setIsFilterOpen(null)} /> */}
                      </div>

                      <div className="pb-4">
                        <div className="flex flex-col gap-3">
                          {metalFilterMasterRows.map((item: any, index: number) => {
                            const isSelected = filtersData?.metal?.includes(item.id);
                            // const isSelected = selectedFilters?.metal?.includes(item.id);

                            return (
                              <div key={index}>
                                <Checkbox
                                  checked={isSelected}
                                  onClick={() => {
                                    const updatedMetals = isSelected
                                      ? filtersData?.metal?.filter((metalId: any) => metalId !== item.id)
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
                                  <Text
                                    as="p"
                                    size="textmd"
                                    // onClick={() => {
                                    //   const updatedMetals = isSelected
                                    //     ? filtersData?.metal?.filter(
                                    //         (metalId) => metalId !== item.id
                                    //       )
                                    //     : [
                                    //         ...(filtersData?.metal || []),
                                    //         item.id,
                                    //       ];

                                    //   dispatch(
                                    //     setFilterData({
                                    //       ...filtersData,
                                    //       metal: updatedMetals,
                                    //     })
                                    //   );
                                    // }}
                                    className={` text-ink-soft cursor-pointer ${isSelected ? '!font-semibold !text-ink' : ''}`}
                                  >
                                    {item?.name}
                                  </Text>
                                </Checkbox>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                  {/* DIAMOND TYPE  */}
                  {/* {isFilterOpen === 'diamond_type' && (
                  <div ref={FilterDropdownRef} className="flex flex-col gap-5 w-full bg-white">
                    <div className="flex justify-between items-center">
                      <Text size="textxl" as="p" className="font-medium">
                        DIAMOND TYPE
                      </Text>
                    </div>
                    <div className="radio-group-plp ">
                      <Radio.Group
                        className="!flex !flex-col w-full justify-evenly lg:!grid lg:!grid-cols-3 lg:gap-0 gap-3 lg:!text-[10px]"
                        onChange={(e: RadioChangeEvent) => {
                          handleFilterChange('diamond_type', e.target.value);
                          dispatch(
                            setFilterData({
                              ...filtersData,
                              diamond_type: e.target.value,
                            }),
                          );
                        }}
                        value={filtersData.diamond_type}
                      >
                        <Radio value={1} className="lg:my-auto lg:self-center lg:!text-[11px]">
                          BOTH
                        </Radio>
                        <Radio value={2} className="lg:my-auto lg:self-center lg:!text-[11px] lg:!pr-0">
                          NATURAL
                        </Radio>
                        <Radio value={3} className="lg:my-auto lg:self-center lg:!text-[11px] lg:!pr-0">
                          LAB GROWN
                        </Radio>
                      </Radio.Group>
                    </div>
                  </div>
                )} */}
                  {/* DIAMOND COLOR */}
                  {isFilterOpen === 'diamond_color' && (
                    <div ref={FilterDropdownRef} className="flex flex-col gap-5 w-full h-full bg-white">
                      <div className="flex justify-between items-center">
                        <Text size="textxl" as="p" className="font-medium ">
                          DIAMOND COLOR
                        </Text>
                        {/* <FiX className=" h-[18px] w-[18px] cursor-pointer" onClick={() => setIsFilterOpen(null)} /> */}
                      </div>
                      <div className="flex flex-col gap-3 max-h-[50vh] scrollbar-visible overflow-y-auto pb-4">
                        {diamondColorFilterMasterRows?.map((item: any, index: number) => {
                          const isItemSelected = filtersData?.diamond_color?.includes(item.id);

                          return (
                            <Checkbox
                              checked={isItemSelected}
                              key={index}
                              onClick={() => {
                                const updatedColors = isItemSelected
                                  ? filtersData?.diamond_color?.filter((colorId: any) => colorId !== item.id)
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
                                // key={index}
                                size="textlg"
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
                                className={` text-ink-soft cursor-pointer ${isItemSelected ? '!font-semibold !text-ink' : ''}`}
                              >
                                {item?.name}
                              </Text>
                            </Checkbox>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {/* SHAPE */}
                  {isFilterOpen == 'shape' && (
                    <div ref={FilterDropdownRef} className="flex flex-col gap-5 w-full bg-white">
                      <div className="flex justify-between items-center">
                        <Text size="textlg" as="p" className="font-medium ">
                          SHAPE
                        </Text>
                        {/* <FiX className=" h-[18px] w-[18px] cursor-pointer" onClick={() => setIsFilterOpen(null)} /> */}
                      </div>
                      <div className="pb-4">
                        <div className="flex flex-col gap-3">
                          {shapeFilterMasterRows?.map((item: any, index: number) => {
                            const isItemSelected = filtersData?.shape?.includes(item.id);

                            return (
                              <Checkbox
                                key={index}
                                checked={isItemSelected}
                                onClick={() => {
                                  const updatedShapes = isItemSelected
                                    ? filtersData?.shape?.filter((shapeId: any) => shapeId !== item.id)
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
                                  className={` text-ink-soft cursor-pointer ${isItemSelected ? '!font-semibold !text-ink' : ''}`}
                                >
                                  {item?.name}
                                </Text>
                              </Checkbox>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                  {/* CARAT WEIGHT */}
                  {isFilterOpen == 'carat' && (
                    <div ref={FilterDropdownRef} className="flex flex-col gap-5 w-full bg-white">
                      <div className="flex justify-between items-center">
                        <Text size="textlg" as="p" className="font-medium ">
                          CARAT WEIGHT
                        </Text>
                        {/* <FiX className=" h-[18px] w-[18px] cursor-pointer" onClick={() => setIsFilterOpen(null)} /> */}
                      </div>
                      <div className="w-full px-2 pb-4">
                        <div className="flex justify-between">
                          <div className="flex items-center gap-1">
                            <InputNumber
                              size="small"
                              min={caratBounds.min}
                              max={caratBounds.max}
                              style={{ color: 'black' }}
                              step={0.01}
                              disabled={!caratBounds.hasRange}
                              // prefix="$"
                              value={selectedFilters?.min_carat ?? caratBounds.min}
                              onChange={(value: any) => {
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
                              }}
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <InputNumber
                              size="small"
                              min={caratBounds.min}
                              max={caratBounds.max}
                              style={{ color: 'black' }}
                              step={0.01}
                              disabled={!caratBounds.hasRange}
                              // prefix="$"
                              // style={{ margin: "0 16px" }}
                              value={selectedFilters?.max_carat ?? caratBounds.max}
                              onChange={(value: any) => {
                                setSelectedFilters((prevFilters: any) => ({
                                  ...prevFilters,
                                  // min_price: value[0],
                                  max_carat: value ?? caratBounds.max ?? 0,
                                }));
                                handleFilterChange('carat', [selectedFilters?.min_carat, selectedFilters?.max_carat ?? caratBounds.max]);
                                dispatch(
                                  setFilterData({
                                    ...filtersData,
                                    // min_price: value[0],
                                    max_price: value ?? caratBounds.max ?? 0,
                                  }),
                                );
                              }}
                            />
                          </div>
                        </div>
                        <div className="w-full">
                          <Slider
                            // marks={caratWeight}
                            // included={true}
                            range
                            step={0.01}
                            disabled={!caratBounds.hasRange}
                            defaultValue={[caratBounds.min, caratBounds.max]}
                            value={[selectedFilters.min_carat, selectedFilters.max_carat]}
                            min={caratBounds.min}
                            max={caratBounds.max}

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
                    </div>
                  )}
                  {/* SUBSTYLE */}
                  {isFilterOpen == 'sub_style' && (
                    <div ref={FilterDropdownRef} className="flex flex-col gap-5 w-full bg-white">
                      <div className="flex justify-between items-center px-2">
                        <Text size="textlg" as="p" className="font-medium ">
                          SUBSTYLE
                        </Text>
                        {/* <FiX className=" h-[18px] w-[18px] cursor-pointer" onClick={() => setIsFilterOpen(null)} /> */}
                      </div>
                      <div className="relative flex flex-col overflow-scroll pr-2 h-fit max-h-[300px] scrollbar-visible">
                        {filters?.subTypes?.map((item: any, index: number) => (
                          <div
                            key={index}
                            className={`flex gap-5 relative items-center border-b select-none justify-center min-h-10 cursor-pointer ${filtersData.subTypes.includes(item?.id) ? '' : ''}`}
                            onClick={() => {
                              const updatedStyles = filtersData.subTypes.includes(item?.id)
                                ? filtersData.subTypes.filter((subType: any) => subType !== item.id)
                                : [...filtersData.subTypes, item.id];
                              handleFilterChange('subTypes', updatedStyles);
                              dispatch(
                                setFilterData({
                                  ...filtersData,
                                  subTypes: updatedStyles,
                                }),
                              );
                            }}
                          >
                            <Image
                              preview={false}
                              className="px-0 lg:px-1 !w-10"
                              fallback="/images/no_images.svg"
                              src={masterData.find((el: any) => el.id === item.id)?.image?.[0]}
                              alt={masterData.find((el: any) => el.id === item.id)?.name}
                            />
                            <Text
                              size="textmd"
                              className="text-[14px] text-ink w-full xl:text-[13px] lg:text-[12px] text-nowrap overflow-hidden px-0.5 lg:px-0.5"
                            >
                              {masterData.find((el: any) => el.id === item.id)?.name}
                            </Text>
                            {filtersData.subTypes.includes(item?.id) && <FaCheck className="absolute h-6 w-6 text-ink right-4 cursor-pointer" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 w-full px-3 py-3">
                  <Button
                    variant="filled"
                    className="w-full !h-11 !rounded-none !border-0 !bg-ink !px-6 !text-[11.5px] !font-medium uppercase !tracking-[0.2em] !text-paper hover:!bg-ink-hover disabled:!bg-ink/40 disabled:!text-paper"
                    onClick={() => setIsFilterOpen(null)}
                  >
                    view results
                  </Button>
                </div>
              </Drawer>
            )}
            {/* filters sideMenu ended */}
            <div ref={divMobileRef} className="flex w-[100%] flex-col gap-5 self-center sm:gap-2 relative">
              {/* {productsLoading ? ( */}
              {isAtTop && productStack?.length !== 0 && (
                <div className="w-full min-h-[120px] h-fit !sticky top-0 sm:top-[85px] left-0 z-20 border bg-stone flex justify-center items-center">
                  <div className="flex justify-center items-center gap-5 w-[90%] h-full p-4">
                    <div className="font-cormorant text-[24px] font-medium leading-none text-ink">Your Ring Stack</div>
                    <div className="flex sm:hidden items-center gap-4">
                      {productStack.map((product, index) => (
                        <div key={index} className="flex items-center gap-0">
                          <span>{index + 1}.</span>
                          <Image
                            src={product.stackable_image ?? '/images/no_images.svg'}
                            alt={product.productName}
                            // width={100}
                            // height={35}
                            preview={false}
                            className="md:w-[80px] object-contain"
                            style={{
                              mixBlendMode: 'multiply',
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col items-center">
                      {productStack.map((product, index) => (
                        <Image
                          key={index}
                          src={product.stackable_image ?? '/images/no_images.svg'}
                          alt={product.productName}
                          // width={140}
                          // height={35}
                          preview={false}
                          className="md:w-[80px] sm:w-[120px] object-contain"
                          style={{
                            mixBlendMode: 'multiply',
                          }}
                        />
                      ))}
                    </div>
                    <div>
                      <Button
                        type="default"
                        className="w-full !h-11 !rounded-none !border-0 !bg-ink !px-6 !text-[11.5px] !font-medium uppercase !tracking-[0.2em] !text-paper hover:!bg-ink-hover disabled:!bg-ink/40 disabled:!text-paper"
                        onClick={() => {
                          sectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        Customize
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex flex-col items-end gap-10 sm:gap-2">
                {isLoading && (
                  <>
                    <div className="w-full flex justify-center items-center">
                      <LuLoader className="h-10 w-10 animate-spin" />
                    </div>
                  </>
                )}

                {!isLoading && products?.length > 0 && (
                  <div className="w-full">
                    <div className="w-full grid grid-cols-4 gap-4 mb-4 sm:mb-2 md:grid-cols-3 sm:grid-cols-2 sm:gap-2">
                      {chunkedData?.map((chunk: any, index: number) => (
                        <div key={index} className="col-span-1">
                          <ProductProfile {...chunk} is_stackable={true} isStatic={true} key={'group2652' + index} className={`w-full`} />
                          {/* <ChunkComponent key={index} chunk={chunk} index={index} bannerData={[]} /> */}
                        </div>
                      ))}
                    </div>
                    {isLoadingMore && (
                      <div className="w-full flex justify-center items-center py-4">
                        <LuLoader className="h-8 w-8 animate-spin" />
                      </div>
                    )}
                    {/* {chunkedData?.map((chunk: any, index: number) => <ChunkComponent key={index} chunk={chunk} index={index} bannerData={[]} />)}
                  {isLoadingMore && (
                    <div className="w-full flex justify-center items-center py-4">
                      <LuLoader className="h-8 w-8 animate-spin" />
                    </div>
                  )} */}
                  </div>
                )}
                {!isLoading && products?.length === 0 && (
                  <div className="w-full flex flex-col items-center pt-[10vh] gap-[60px] lg:ml-0 md:ml-0 sm:gap-[1px] min-h-[55vh]">
                    <p className="text-[15px] text-center">
                      We found no results that match your search criteria. Please expand your search or
                      <span
                        className="inline underline cursor-pointer pl-1 text-nowrap"
                        onClick={() => {
                          // router.push(`/${jewelryType}`);
                          window?.history.replaceState(null, '', `/${pathname}`);
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
                            }),
                          );
                        }}
                      >
                        reset your filters
                      </span>
                      .
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}
