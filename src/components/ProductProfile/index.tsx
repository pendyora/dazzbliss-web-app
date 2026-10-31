/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Image } from 'antd';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FaHeart, FaRegHeart } from 'react-icons/fa6';
import SwiperCore from 'swiper';
import { Navigation, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import { YotpoReviewsRefresh } from '@/hook/useYotpo';
import { apiAddToWishList, apiDeleteFromWishList } from '@/services/cartService';
import {
  clearSelectedProduct,
  setProductsRows,
  setProductStack,
  setSelectedAppraisal,
  setSelectedEngraving,
  setSelectedRingSizeId,
  setSelectedRingSizeRedux,
  setSelectedWarranty,
  useAppDispatch,
  useAppSelector,
} from '@/store';
import { fetchWishListProducts, setWishlistProducts } from '@/store/slices/Cart/cartSlice';
import {
  clearSelectedDiamondFilters,
  setCustomCarats,
  setCustomShapes,
  setDiamondPageNumber,
  setIsSelectedDiamondFilter,
  setSelectedCaratsData,
  setSelectedDiamondStore,
  setSelectedSettingSkuData,
  setSelectedSettingStore,
  setSelectedShapesData,
} from '@/store/slices/customProducts/customProductSlice';
import { carryForwardFilterCrumb } from '@/utils/breadcrumbFilterParams';
import { formatCurrency } from '@/utils/common';
import { metalToneFor } from '@/utils/metalTone';
import { trackAddToWishlist } from '@/utils/metaPixel';

import { Text } from './..';
import PlpCard, { PlpBadge, PlpMetalTone, PlpSwatch } from './PlpCard';
import ProductName from './ProductName';
import ProductRating from '../ProductRating';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

interface SpecialProductTitle {
  id: string;
  title: string;
}
interface Props {
  className?: string;
  productImage?: string;
  productFullTitle?: string;
  stackable_image?: string;
  productHoverImage?: string;
  productName?: React.ReactNode;
  productDescription?: React.ReactNode;
  productPrice?: React.ReactNode;
  isStatic?: boolean;
  isWishlist?: string | null;
  selectionRoute?: string | null;
  slug?: string;
  variation_to_show?: any;
  variation_details?: any;
  jewelryDetails?: any;
  jewelryTypeData?: string;
  /** The PLP's own route segment (e.g. "all", "engagement-rings"), passed only when this card
   * is rendered inside that grid — distinct from `jewelryTypeData`, which is this specific
   * product's real category and can differ on an aggregate listing like `/all`. */
  pageJewelryType?: string;
  discount_type?: string | null;
  discount_value?: number | string | null;
  discounted_price?: string | null;
  specialProductTitles?: SpecialProductTitle[] | null;
  jewelry_type?: string;
  sku_master_id?: string;
  code?: string;
  jewelry_id?: string;
  handling_days?: null | number;
  ring_size_id?: null | string;
  metal_type_id?: null | string;
  metal_color_id?: null | string;
  estimated_delivery_days?: number | string | null;
  productVariation?: number | string | null;
  is_customizable?: boolean;
  is_stackable?: boolean;
  layout?: 'default' | 'plp';
}

// METAL_COLOR master codes -> swatch styling for the metal_type variation chips.
// Gold codes (RG/YG/WG, parent GOLD) and their silver plated counterparts
// (RP/YP/WP/BP/BLUP, parent SILVER) must be listed here. Anything missing falls
// through to the white default, which is why SILVER_925 + YP used to render the
// same white chip as SILVER_925 + WP.
const METAL_COLOR_SWATCH: Record<string, { bg: string; text: string }> = {
  RG: { bg: 'bg-[#D86D7Aa7]', text: 'text-primary' },
  RP: { bg: 'bg-[#D86D7Aa7]', text: 'text-primary' },
  YG: { bg: 'bg-[#F7C62Fa7]', text: 'text-primary' },
  YP: { bg: 'bg-[#F7C62Fa7]', text: 'text-primary' },
  WG: { bg: 'bg-[#E8E9EDa7]', text: 'text-primary' },
  WP: { bg: 'bg-[#E8E9EDa7]', text: 'text-primary' },
  BP: { bg: 'bg-[#3A3A3Aa7]', text: 'text-white' },
  BLUP: { bg: 'bg-[#2E5FA3a7]', text: 'text-white' },
};
const DEFAULT_METAL_COLOR_SWATCH = { bg: 'bg-[#E8E9EDa7]', text: 'text-primary' };

const NO_IMAGE = '/images/no_images.svg';

// A variant whose carat_images array is empty is a real, purchasable SKU whose photos
// have not been uploaded yet (e.g. SILVER_925 + Yellow Gold Plated on 10332). Resolve it
// to the placeholder instead of the card's default image, which belongs to a different
// metal colour than the chip the shopper selected. `fallback` is only used when no
// variant is selected at all.
const variantImageAt = (variant: any, index: number, fallback?: string) => {
  if (!variant) {
    return fallback ?? NO_IMAGE;
  }
  const images = variant?.carat_images;
  return images?.[index] ?? (index > 0 ? images?.[0] : undefined) ?? NO_IMAGE;
};

export default function ProductProfile({
  productImage = 'img_group_1259_1.png',
  stackable_image = '/images/no_images.svg',
  productHoverImage = 'img_group_1259_1.png',
  productName = 'NAME OF THE PRODUCT',
  productFullTitle,
  productPrice = '$50',
  productDescription,
  selectionRoute,
  slug,
  sku_master_id,
  jewelry_type,
  jewelry_id,
  code,
  variation_to_show = null,
  variation_details = null,
  jewelryDetails = null,
  jewelryTypeData = 'all',
  pageJewelryType,
  isWishlist = null,
  isStatic = false,
  handling_days = 0,
  discount_type = null,
  discount_value = null,
  discounted_price = null,
  specialProductTitles = null,
  estimated_delivery_days = null,
  productVariation = null,
  is_customizable = false,
  ring_size_id = null,
  metal_type_id = null,
  metal_color_id = null,
  is_stackable = false,
  layout = 'default',
  ...props
}: Props) {
  const dispatch = useAppDispatch();
  const path = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const state = searchParams.get('state');
  const dId = searchParams.get('did') ?? null;
  const urlPriceRangeParam = searchParams.get('price');

  const { user } = useAppSelector((state) => state.auth.auth);
  const { projectSetting } = useAppSelector((state) => state.master);
  const master = useAppSelector((state) => state.master.data);
  const { productStack, filterData: filtersData, filterList } = useAppSelector((state) => state.products);
  const { wishlistProducts } = useAppSelector((state) => state?.cart);
  const products = useAppSelector((state) => state?.products.products.rows);

  const swiperRefs = useRef<SwiperCore[]>([]);
  const [activeMetalTypeIndex, setActiveMetalTypeIndex] = useState<number | null>(1);

  const prevRef0 = useRef<HTMLButtonElement>(null);
  const nextRef0 = useRef<HTMLButtonElement>(null);
  const [isBeginning0, setIsBeginning0] = useState(true);
  const [isEnd0, setIsEnd0] = useState(false);
  const prevRef1 = useRef<HTMLButtonElement>(null);
  const nextRef1 = useRef<HTMLButtonElement>(null);
  const [isBeginning1, setIsBeginning1] = useState(true);
  const [isEnd1, setIsEnd1] = useState(false);
  const prevRef2 = useRef<HTMLButtonElement>(null);
  const nextRef2 = useRef<HTMLButtonElement>(null);
  const [isBeginning2, setIsBeginning2] = useState(true);
  const [isEnd2, setIsEnd2] = useState(false);

  const prevRefs = [prevRef0, prevRef1, prevRef2];
  const nextRefs = [nextRef0, nextRef1, nextRef2];
  const isBeginnings = [isBeginning0, isBeginning1, isBeginning2];
  const isEnds = [isEnd0, isEnd1, isEnd2];
  const setIsBeginnings = [setIsBeginning0, setIsBeginning1, setIsBeginning2];
  const setIsEnds = [setIsEnd0, setIsEnd1, setIsEnd2];

  const [hovered, setHovered] = useState(false);
  const [hoveredOption, setHoveredOption] = useState(false);
  const [hoverVarient, setHoverVariant] = useState<any>(null);
  const [wishlist, setWishlist] = useState(false);
  const [wId, setWid] = useState<any>(isWishlist);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [windowWidth, setWindowWidth] = useState<number>(0);
  // const [isStackedProduct, setIsStackedProduct] = useState(false);

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    let timeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setWindowWidth(window.innerWidth);
      }, 100); // Debounce by 100ms
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeout);
    };
  }, []);

  // useEffect(() => {
  //   const result = productStack?.some((el: any) => el.slug === selectedVariant?.sku_slug);
  //   setIsStackedProduct(result);
  // }, [productStack, selectedVariant]);

  const isStackedProduct = useMemo(() => {
    return productStack?.some((el: any) => (hoveredOption ? el.slug === hoverVarient?.sku_slug : el.slug === selectedVariant?.sku_slug));
  }, [productStack, selectedVariant, hoverVarient, hoveredOption]);

  const handleAddtoWishlist = async () => {
    const payload = {
      jewelry_id: jewelry_id as string,
      sku_master_id: sku_master_id as string,
      // Yotpo's product key — kept so the wishlist card can still show its star rating.
      code: code as string,
      slug: selectedVariant?.sku_slug as string,
      productDescription,
      productPrice: (selectedVariant?.selling_price as string) ?? productPrice,
      productName,
      productHoverImage: variantImageAt(selectedVariant, 1, productHoverImage),
      productImage: variantImageAt(selectedVariant, 0, productImage),
      discount_type: selectedVariant?.discount_type ?? discount_type,
      discount_value: selectedVariant?.discount_value ?? discount_value,
      discounted_price: selectedVariant?.discounted_price ?? discounted_price,
      // variation_to_show,
      // variation_details,
      jewelryDetails,
      jewelryTypeData,
      specialProductTitles,
      handling_days,
      ring_size_id,
      isWishlist: isWishlist ?? 'true',
      jewelry_type: jewelry_type as string,
      is_customizable,
      isStatic,
      productVariation,
      stackable_image,
      estimated_delivery_days,
      metal_type_id,
      is_stackable,
    };

    // Retrieve cart data from local storage
    const wishlistData = localStorage.getItem('wishListItems');
    const existingWishlist: { name: string; jewelry: (typeof payload)[] }[] = wishlistData ? JSON.parse(wishlistData) : [];

    if (user) {
      if (wId) {
        const response: any = await apiDeleteFromWishList([wId]);

        if (response?.data?.status === 200 || response?.data?.status === 201) {
          // setWishlist(true);
          const updatedProductIndex = products?.findIndex((item: any) => item?.id == jewelry_id);

          if (updatedProductIndex !== undefined && updatedProductIndex > -1) {
            const updatedProduct: any = { ...products[updatedProductIndex] };
            const updatedJewelryDetails = {
              ...updatedProduct.jewelryDetails?.[0],
              wishlist_id: null,
            };

            updatedProduct.jewelryDetails = [updatedJewelryDetails];
            const newProducts = [...products];
            newProducts.splice(updatedProductIndex, 1, updatedProduct);
            dispatch(setProductsRows([...newProducts]));
          }
        }
        if (response) {
          setWid(null);
          dispatch(fetchWishListProducts('all'));
        }
      } else {
        const response: any = await apiAddToWishList([{ jewelry_id, sku_master_id }]);
        const data = response.data.data?.[0];
        if (response?.data?.status === 200 || response?.data?.status === 201) {
          setWishlist(true);
          setWid(data?.id);
          const price = Number(selectedVariant?.discounted_price ?? selectedVariant?.selling_price ?? productPrice ?? 0);
          trackAddToWishlist({
            content_ids: [String(sku_master_id ?? jewelry_id)],
            value: price,
            currency: 'USD',
          });
          const updatedProductIndex = products?.findIndex((item: any) => item?.id == data?.jewelry_id);
          if (updatedProductIndex !== undefined && updatedProductIndex > -1) {
            const updatedProduct: any = { ...products[updatedProductIndex] };
            const updatedJewelryDetails = {
              ...updatedProduct.jewelryDetails?.[0],
              wishlist_id: data.id,
            };
            updatedProduct.jewelryDetails = [updatedJewelryDetails];
            const newProducts = [...products];
            newProducts.splice(updatedProductIndex, 1, updatedProduct);
            dispatch(setProductsRows([...newProducts]));
          }
          dispatch(fetchWishListProducts('all'));
        }
      }
    } else {
      const typeIndex = existingWishlist.findIndex((item) => item.name === jewelry_type);

      if (typeIndex > -1) {
        const productIndex = existingWishlist[typeIndex].jewelry.findIndex((item) => item.jewelry_id === jewelry_id);

        if (productIndex > -1) {
          existingWishlist[typeIndex].jewelry.splice(productIndex, 1);
          setWid(null);
          // Check if the jewelry array is empty and remove the object if it is
          if (existingWishlist[typeIndex].jewelry.length === 0) {
            existingWishlist.splice(typeIndex, 1);
          }
        } else {
          existingWishlist[typeIndex].jewelry.push({
            ...payload,
            isWishlist: 'true',
          });
          setWid('true');
          const price = Number(selectedVariant?.discounted_price ?? selectedVariant?.selling_price ?? payload.productPrice ?? 0);
          trackAddToWishlist({
            content_ids: [String(sku_master_id ?? jewelry_id)],
            value: price,
            currency: 'USD',
          });
        }
      } else {
        existingWishlist.push({
          name: jewelry_type as string,
          jewelry: [payload],
        });
        const price = Number(selectedVariant?.discounted_price ?? selectedVariant?.selling_price ?? payload.productPrice ?? 0);
        trackAddToWishlist({
          content_ids: [String(sku_master_id ?? jewelry_id)],
          value: price,
          currency: 'USD',
        });
      }
      localStorage.setItem('wishListItems', JSON.stringify(existingWishlist));
      dispatch(setWishlistProducts(existingWishlist));
    }
  };
  const EXCLUDED_KEYS = [
    'selling_price',
    'carat_images',
    'sku_slug',
    'sku_id',
    'stackable_image',
    'discount_type',
    'discount_value',
    'discounted_price',
    'center_diamond_id',
  ];
  const AXIS_KEYS = [
    'metal_type_id',
    'metal_color_id',
    'bracelet_length_ids',
    'carat_id',
    'shape_id',
    'ring_size_id',
    'center_color',
    'accent_diamond_id',
  ];
  const isHiddenAxis = (axisName: any) => typeof axisName === 'string' && axisName.toLowerCase().includes('bracelet_length');
  const findKeyFromValue = (valueToFind: string): string | undefined => {
    for (const obj of variation_details) {
      const foundKey = Object.keys(obj).find((key) => obj[key] === valueToFind);
      if (foundKey) {
        return foundKey;
      }
    }
    return undefined;
  };
  const toComparable = (value: any) => (value === null || value === undefined ? '' : String(value));
  const getAxisKeyForName = (name: any, sampleDetail?: any): string | null => {
    if (!name || name === 'metal_type' || isHiddenAxis(name)) {
      return null;
    }
    if (typeof name === 'string') {
      // center_diamond row exposes color choices; the matching field on variation_details is `center_color`
      // (center_diamond_id is the derived SKU id and co-varies with the color, so it shouldn't constrain matches).
      if (name === 'center_diamond') {
        return 'center_color';
      }
      const direct = `${name}_id`;
      if (AXIS_KEYS.includes(direct)) {
        return direct;
      }
    }
    if (typeof sampleDetail === 'string') {
      return findKeyFromValue(sampleDetail) ?? null;
    }
    return null;
  };
  const getVariantPrice = (variant: any) => {
    const rawPrice = variant?.discounted_price ?? variant?.selling_price;
    const parsedPrice = Number(rawPrice);
    return Number.isFinite(parsedPrice) ? parsedPrice : Number.NaN;
  };
  const getActivePriceRange = () => {
    const payloadMin = Number(filtersData?.min_price);
    const payloadMax = Number(filtersData?.max_price);
    if (Number.isFinite(payloadMin) && Number.isFinite(payloadMax)) {
      return { min: Math.min(payloadMin, payloadMax), max: Math.max(payloadMin, payloadMax) };
    }

    if (!urlPriceRangeParam) {
      return null;
    }

    const [minRaw, maxRaw] = urlPriceRangeParam.split('-');
    const min = Number(minRaw);
    const max = Number(maxRaw);

    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      return null;
    }

    return { min: Math.min(min, max), max: Math.max(min, max) };
  };
  const findVariantMatch = (id: string, id2: string, name: string) => {
    // Build the set of axes the user can actually change via swatches. Hidden axes
    // (bracelet_length when its row is filtered out) are anchored back to jewelryDetails
    // so a previous fallback can't permanently drift them (e.g. L6.5 → L7), which would
    // otherwise leak into every subsequent hover/click.
    const visibleAxisKeys = new Set<string>();
    variation_to_show?.forEach((el: any) => {
      if (isHiddenAxis(el?.name)) {
        return;
      }
      if (el?.name === 'metal_type') {
        visibleAxisKeys.add('metal_color_id');
        visibleAxisKeys.add('metal_type_id');
        return;
      }
      const axisKey = getAxisKeyForName(el?.name, el?.details?.[0]);
      if (axisKey) {
        visibleAxisKeys.add(axisKey);
      }
    });

    let newVariant: any = { ...selectedVariant };
    AXIS_KEYS.forEach((key) => {
      if (!visibleAxisKeys.has(key) && jewelryDetails?.[key] !== undefined && jewelryDetails?.[key] !== null) {
        newVariant[key] = jewelryDetails[key];
      }
    });

    let changedKeys: string[] = [];
    if (name === 'metal_type') {
      newVariant = {
        ...newVariant,
        metal_color_id: id,
        metal_type_id: id2,
      };
      changedKeys = ['metal_color_id', 'metal_type_id'];
    } else {
      const foundKey = getAxisKeyForName(name, id);
      if (foundKey) {
        newVariant = {
          ...newVariant,
          [foundKey]: id,
        };
        changedKeys = [foundKey];
      }
    }

    if (changedKeys.length === 0) {
      return null;
    }

    // If the resulting axes line up with jewelryDetails exactly, return the canonical SKU.
    // This is what restores the original price/length when the user hovers/clicks back to
    // jewelryDetails' metal after a fallback selection has drifted selectedVariant.
    const matchesJewelryDetails = AXIS_KEYS.every((key) => {
      if (jewelryDetails?.[key] === undefined || jewelryDetails?.[key] === null) {
        return true;
      }
      return toComparable(newVariant[key]) === toComparable(jewelryDetails[key]);
    });
    if (matchesJewelryDetails) {
      return { ...jewelryDetails };
    }

    // Strict axis match — keeps the user's preserved (visible) axes plus the changed one.
    const strictMatched = variation_details?.find((variation: any) =>
      AXIS_KEYS.every((key) => {
        if (newVariant[key] === undefined || newVariant[key] === null) {
          return true;
        }
        return toComparable(variation?.[key]) === toComparable(newVariant[key]);
      }),
    );
    if (strictMatched) {
      return strictMatched;
    }

    // Fallback: match only the changed axis so a swatch click still produces a useful result
    // when the exact combo isn't shipped (e.g. backend has L6.5 only for one metal).
    const fallback = variation_details?.find((variation: any) =>
      changedKeys.every((key) => toComparable(variation?.[key]) === toComparable(newVariant[key])),
    );
    if (fallback) {
      return fallback;
    }
    // Last resort: customizable products often expose options (e.g. every carat) without shipping a
    // variation_details row for each combo. Return the synthetic newVariant so the click still
    // updates the highlighted axis, even though no canonical SKU row exists for it.
    return newVariant;
  };

  const handleHowerVatiation = (id: string, id2 = '', name: string) => {
    const matched = findVariantMatch(id, id2, name);
    if (matched) {
      setHoverVariant(matched);
    }
  };
  const handleSelectedVatiation = (id: string, id2 = '', name: string) => {
    const matched = findVariantMatch(id, id2, name);
    if (matched) {
      setSelectedVariant(matched);
    }
  };

  useEffect(() => {}, [wishlistProducts?.length]);

  useEffect(() => {
    if (!variation_to_show || variation_to_show?.length === 0 || !variation_details || variation_details?.length === 0) {
      setSelectedVariant({ ...jewelryDetails });
      return;
    }
    const activePriceRange = getActivePriceRange();
    const variationsInPriceRange = activePriceRange
      ? variation_details.filter((variation: any) => {
          const price = getVariantPrice(variation);
          return Number.isFinite(price) && price >= activePriceRange.min && price <= activePriceRange.max;
        })
      : variation_details;
    const scopedVariations = variationsInPriceRange.length > 0 ? variationsInPriceRange : variation_details;

    // jewelryDetails is the live SKU the backend picked for this card, and with a price filter on it
    // is the SKU that actually satisfied that filter. variation_details is a stored snapshot that can
    // describe a different tier entirely (e.g. only the 0.25ct rows while jewelryDetails is the 3ct
    // SKU), so matching it on the visible axes alone hands back a sibling SKU's price. findVariantMatch
    // already returns jewelryDetails whenever the axes line up, which is why the card showed one price
    // at rest and another on hover for the very same metal swatch.
    const jewelryDetailsPrice = getVariantPrice(jewelryDetails);
    const jewelryDetailsInPriceRange =
      !activePriceRange ||
      (Number.isFinite(jewelryDetailsPrice) && jewelryDetailsPrice >= activePriceRange.min && jewelryDetailsPrice <= activePriceRange.max);
    if (jewelryDetails && Object.keys(jewelryDetails).length > 0 && jewelryDetailsInPriceRange) {
      setSelectedVariant({ ...jewelryDetails });
      return;
    }

    const mainSkuId = jewelryDetails?.id ?? jewelryDetails?.sku_id ?? null;
    if (mainSkuId) {
      const mainSkuVariation = scopedVariations?.find((variation: any) => toComparable(variation?.sku_id) === toComparable(mainSkuId));
      if (mainSkuVariation) {
        setSelectedVariant(mainSkuVariation);
        return;
      }
    }

    // Match on configurable axes only. Including price/slug/images here causes false negatives
    // whenever jewelryDetails carries a SKU (e.g. a non-standard bracelet length like L6.5) that
    // isn't represented in variation_details, and we end up showing a sibling variation's price.
    const criteriaKeys = AXIS_KEYS.filter((key) => jewelryDetails?.[key] !== undefined && jewelryDetails?.[key] !== null);
    const matchedVariation = scopedVariations?.find((variation: any) =>
      criteriaKeys.every((key) => toComparable(variation?.[key]) === toComparable(jewelryDetails[key])),
    );

    if (matchedVariation) {
      setSelectedVariant(matchedVariation);
      return;
    }

    // No variation row reproduces the jewelryDetails axes exactly (e.g. its bracelet_length isn't
    // in variation_details). Trust jewelryDetails as the canonical SKU so the displayed price,
    // image, and slug match the backend's chosen default instead of a sibling variation's price.
    if (jewelryDetails && Object.keys(jewelryDetails).length > 0) {
      setSelectedVariant({ ...jewelryDetails });
      return;
    }

    const baseVariant = scopedVariations?.[0] ?? variation_details?.[0] ?? { ...jewelryDetails };
    const pricedVariations = scopedVariations.filter((variation: any) => Number.isFinite(getVariantPrice(variation)));
    const minPriceVariation =
      pricedVariations.length > 0
        ? pricedVariations.reduce((minVariation: any, currentVariation: any) =>
            getVariantPrice(currentVariation) < getVariantPrice(minVariation) ? currentVariation : minVariation,
          )
        : null;
    const maxPriceVariation =
      pricedVariations.length > 0
        ? pricedVariations.reduce((maxVariation: any, currentVariation: any) =>
            getVariantPrice(currentVariation) > getVariantPrice(maxVariation) ? currentVariation : maxVariation,
          )
        : null;
    const baseVariantHasPrice = Number.isFinite(getVariantPrice(baseVariant));
    const priceRangeFallback = baseVariantHasPrice ? baseVariant : (minPriceVariation ?? maxPriceVariation ?? baseVariant);

    const metalTypeVariation = variation_to_show?.find((variation: any) => variation?.name === 'metal_type');
    // Prefer the metal carried on jewelryDetails so the highlighted swatch matches the canonical
    // SKU; only fall back to details[1] (then [0]) when jewelryDetails has no usable metal IDs.
    const jewelryDetailsMetalDetail =
      jewelryDetails?.metal_type_id && jewelryDetails?.metal_color_id
        ? metalTypeVariation?.details?.find(
            (d: any) =>
              toComparable(d?.metal_type_id) === toComparable(jewelryDetails?.metal_type_id) &&
              toComparable(d?.metal_color_id) === toComparable(jewelryDetails?.metal_color_id),
          )
        : null;
    const defaultMetalDetail =
      jewelryDetailsMetalDetail ??
      metalTypeVariation?.details?.[Math.min(1, (metalTypeVariation?.details?.length ?? 1) - 1)] ??
      metalTypeVariation?.details?.[0];

    if (defaultMetalDetail && Array.isArray(scopedVariations) && scopedVariations.length > 0) {
      const baseKeys = Object.keys(baseVariant).filter((key) => !EXCLUDED_KEYS.includes(key) && key !== 'metal_color_id' && key !== 'metal_type_id');

      const centerMatchedVariation = scopedVariations.find(
        (variation: any) =>
          toComparable(variation?.metal_color_id) === toComparable(defaultMetalDetail?.metal_color_id) &&
          toComparable(variation?.metal_type_id) === toComparable(defaultMetalDetail?.metal_type_id) &&
          baseKeys.every((key) => toComparable(variation?.[key]) === toComparable(baseVariant?.[key])),
      );

      const centerMetalFallback = scopedVariations.find(
        (variation: any) =>
          toComparable(variation?.metal_color_id) === toComparable(defaultMetalDetail?.metal_color_id) &&
          toComparable(variation?.metal_type_id) === toComparable(defaultMetalDetail?.metal_type_id),
      );

      setSelectedVariant(centerMatchedVariation ?? centerMetalFallback ?? priceRangeFallback);
      return;
    }

    setSelectedVariant(priceRangeFallback);
  }, [jewelryDetails, variation_to_show, variation_details, filtersData?.min_price, filtersData?.max_price, urlPriceRangeParam]);

  useEffect(() => {
    const allWishlistItems = wishlistProducts.flatMap((group: any) => group.jewelry);

    if (allWishlistItems.length === 0) {
      setIsInWishlist(false);
      return;
    }

    const exist = allWishlistItems.some((w: any) => w.jewelry_id === jewelry_id && w.sku_master_id === sku_master_id);

    setIsInWishlist(exist);
  }, [wishlistProducts, isInWishlist]);

  const handleSwiperSlideChange = () => {
    if (!variation_to_show && !selectedVariant) {
      return;
    }
    return variation_to_show?.map((el: any, groupIndex: number) => {
      const groupSize = ['/wishlist', 'premade', '/search'].includes(path)
        ? windowWidth <= 768
          ? 3 // md
          : windowWidth <= 1024
            ? 3 // lg
            : windowWidth <= 1536
              ? el?.name == 'metal_type'
                ? 3
                : 4 // xl
              : el?.name == 'metal_type'
                ? 3
                : 5 // 2xl
        : windowWidth < 640
          ? 3 // sm
          : windowWidth <= 768
            ? 3 // md
            : windowWidth <= 1024
              ? 3 // lg
              : windowWidth <= 1536
                ? el?.name == 'metal_type'
                  ? 3
                  : 5 // xl
                : el?.name == 'metal_type'
                  ? 3
                  : 6; // 2xl
      const axisKey = getAxisKeyForName(el?.name, el?.details?.[0]);
      const selectedIndex = el?.details?.findIndex((detailsId: any) => {
        if (el?.name === 'metal_type') {
          return (
            toComparable(selectedVariant?.metal_color_id) === toComparable(detailsId?.metal_color_id) &&
            toComparable(selectedVariant?.metal_type_id) === toComparable(detailsId?.metal_type_id)
          );
        }
        return axisKey ? toComparable(selectedVariant?.[axisKey]) === toComparable(detailsId) : false;
      });

      const swiper = swiperRefs.current[groupIndex];
      // findIndex returns -1 when the selected variant isn't among this row's options; sliding to
      // the negative group that produces would just bounce the row back to the start.
      if (!swiper || selectedIndex < 0) {
        return;
      }

      const groupStart = Math.floor(selectedIndex / groupSize) * groupSize;
      swiper.slideTo(groupStart);
    });
  };

  useEffect(() => {
    handleSwiperSlideChange();
  }, [variation_to_show, selectedVariant]);

  // Images always follow the chip currently being hovered/selected, so a SKU with no
  // uploaded photos renders the placeholder rather than another metal colour's photo.
  const activeVariant = hoveredOption ? (hoverVarient ?? selectedVariant) : selectedVariant;
  const displayImage = variantImageAt(activeVariant, 0, productImage);
  const displayHoverImage = variantImageAt(activeVariant, 1, productHoverImage);

  const isFastShipping =
    (estimated_delivery_days &&
      projectSetting?.fastDeliveryDay?.data?.delivery_day &&
      estimated_delivery_days <= projectSetting?.fastDeliveryDay?.data?.delivery_day) ||
    (handling_days && handling_days <= 2);

  // Combined label for the PLP filters currently applied (e.g. "10K/14K & ROUND"), carried
  // into the PDP breadcrumb via query params. Only discrete/categorical filters are covered —
  // price/carat ranges and sort aren't clean single labels, and collections isn't part of
  // Redux filterData at all.
  const activeFilterLabel = useMemo(() => {
    const namesFor = (ids?: string[]) => (ids ?? []).map((id) => master?.find((m: any) => m.id === id)?.name).filter(Boolean) as string[];
    const groups: string[] = [];
    const metalNames = namesFor(filtersData?.metal);
    if (metalNames.length) {
      groups.push(metalNames.join('/'));
    }
    const shapeNames = namesFor(filtersData?.shape);
    if (shapeNames.length) {
      groups.push(shapeNames.join('/'));
    }
    const diamondColorNames = namesFor(filtersData?.diamond_color);
    if (diamondColorNames.length) {
      groups.push(diamondColorNames.join('/'));
    }
    const subTypeNames = namesFor(filtersData?.subTypes);
    if (subTypeNames.length) {
      groups.push(subTypeNames.join('/'));
    }
    const specialTitleNames = (filtersData?.specialTitle ?? [])
      .map((id) => filterList?.special_title?.find((s) => s.id === id)?.title)
      .filter(Boolean) as string[];
    if (specialTitleNames.length) {
      groups.push(specialTitleNames.join('/'));
    }
    if (filtersData?.gender_category === 2) {
      groups.push('FOR HIM');
    }
    if (filtersData?.gender_category === 3) {
      groups.push('FOR HER');
    }
    return groups.join(' & ');
  }, [filtersData, master, filterList]);

  // Filter crumb only makes sense when the click originates from this category's own PLP grid
  // (excludes wishlist/home/search, which render the same card but shouldn't inherit stale filters).
  // Compared against the PAGE's own route segment (`pageJewelryType`), not this item's real
  // category (`jewelryTypeData`) — on an aggregate listing like `/all` those two differ per card.
  const filterQuery =
    pageJewelryType && path === `/${pageJewelryType}` && activeFilterLabel
      ? `&filterLabel=${encodeURIComponent(activeFilterLabel)}&filterHref=${encodeURIComponent(`/${pageJewelryType}?${searchParams.toString()}`)}`
      : '';

  const handleOpen = () => {
    if (selectionRoute && state) {
      // In-builder setting list: keep whatever breadcrumb crumbs the shopper carried in
      // (the PLP filter they started from, and a diamond already picked in the type=1 flow).
      router.push(
        carryForwardFilterCrumb(
          `/custom-jewelry?type=${selectionRoute}&state=${state}&id=${selectedVariant?.sku_slug}${dId ? `&did=${dId}` : ''}`,
          searchParams,
        ),
      );
    } else {
      if (is_stackable) {
        const productDetail = {
          stackId: productStack?.length < 4 ? productStack?.length + 1 : 4,
          productImage: variantImageAt(selectedVariant, 0, productImage),
          stackable_image: selectedVariant?.stackable_image ?? stackable_image,
          productHoverImage: variantImageAt(selectedVariant, 1, productHoverImage),
          productName,
          productPrice: selectedVariant?.selling_price ?? productPrice,
          productFullTitle,
          productDescription,
          slug: selectedVariant?.sku_slug,
          sku_master_id: selectedVariant?.sku_master_id ?? sku_master_id,
          jewelry_type,
          jewelry_id,
          discount_type: selectedVariant?.discount_type ?? discount_type,
          discount_value: selectedVariant?.discount_value ?? discount_value,
          discounted_price: selectedVariant?.discounted_price ?? discounted_price,
          is_customizable,
          isWishlist,
          is_stackable,
          metal_type_id: selectedVariant?.metal_type_id ?? metal_type_id,
          metal_color_id: selectedVariant?.metal_color_id ?? metal_color_id,
          ring_size_id,
          handling_days,
        };
        if (isStackedProduct) {
          const updatedStack = productStack?.filter((item: any) => item.slug !== selectedVariant?.sku_slug);
          dispatch(setProductStack(updatedStack));
        } else {
          const stackProduct = productStack?.length < 4 ? [...productStack, productDetail] : [...productStack]?.toSpliced(3, 1, productDetail);
          dispatch(setProductStack(stackProduct));
        }
      } else {
        router.push(
          path == '/wishlist'
            ? is_customizable
              ? `/custom-jewelry?type=2&state=s&id=${selectedVariant?.sku_slug}${filterQuery}`
              : `/${jewelryTypeData}/premade?slug=${selectedVariant?.sku_slug}${filterQuery}`
            : is_customizable
              ? `/custom-jewelry?type=2&state=s&id=${selectedVariant?.sku_slug}${filterQuery}`
              : `/${jewelryTypeData}/premade?slug=${selectedVariant?.sku_slug}${filterQuery}`,
        );
        dispatch(clearSelectedProduct());
        dispatch(setSelectedSettingStore(null));
        dispatch(setSelectedRingSizeRedux(ring_size_id));
        dispatch(setSelectedRingSizeId(ring_size_id));
        dispatch(setSelectedSettingSkuData(null));
        dispatch(setSelectedDiamondStore(null));
        // Opening a product from a listing starts a *new* build, so the diamond step must
        // start from defaults. `selectedDiamondFilters` is sticky by design once
        // `isSelectedDiamondFilter` flips true (that's what stops Filter.tsx re-seeding the
        // sliders on every render), so without this the previous ring's shape/colour/clarity
        // selection is still applied when the shopper reaches the diamond list. Mirrors what
        // ShowStepper's "Start With a Setting" already does.
        dispatch(clearSelectedDiamondFilters());
        dispatch(setIsSelectedDiamondFilter(false));
        dispatch(setDiamondPageNumber(1));
        dispatch(setSelectedShapesData(null));
        dispatch(setSelectedCaratsData(null));
        dispatch(setCustomShapes(null));
        dispatch(setCustomCarats(null));
        dispatch(setSelectedAppraisal(null));
        dispatch(setSelectedWarranty(null));
        dispatch(setSelectedEngraving(null));
        YotpoReviewsRefresh();
      }
    }
  };

  if (layout === 'plp') {
    const variantSlug = selectedVariant?.sku_slug ?? jewelryDetails?.sku_slug;
    const href = is_customizable
      ? `/custom-jewelry?type=2&state=s&id=${variantSlug}${filterQuery}`
      : `/${jewelryTypeData}/premade?slug=${variantSlug}${filterQuery}`;

    const metalLabel = (colorId?: string, typeId?: string) => {
      const color = master?.find((item: any) => item.id === colorId);
      const type = master?.find((item: any) => item.id === typeId);
      const karat = type?.code === 'SILVER_925' ? '925' : type?.code;
      return [karat, color?.name].filter(Boolean).join(' ');
    };
    const metalTone = (colorId?: string): PlpMetalTone => metalToneFor(master, colorId);

    const metalAxis = variation_to_show?.find((el: any) => el?.name === 'metal_type');
    const swatches: PlpSwatch[] =
      metalAxis?.details?.map((d: any) => ({
        key: `${d?.metal_color_id}-${d?.metal_type_id}`,
        label: metalLabel(d?.metal_color_id, d?.metal_type_id),
        tone: metalTone(d?.metal_color_id),
        active:
          toComparable(selectedVariant?.metal_color_id) === toComparable(d?.metal_color_id) &&
          toComparable(selectedVariant?.metal_type_id) === toComparable(d?.metal_type_id),
        onSelect: () => handleSelectedVatiation(d?.metal_color_id, d?.metal_type_id, 'metal_type'),
        onPreview: () => {
          if (windowWidth >= 868) {
            setHoveredOption(true);
            handleHowerVatiation(d?.metal_color_id, d?.metal_type_id, 'metal_type');
          }
        },
        onPreviewEnd: () => setHoveredOption(false),
      })) ?? [];
    if (swatches.length === 0 && (activeVariant?.metal_color_id || jewelryDetails?.metal_color_id)) {
      const colorId = activeVariant?.metal_color_id ?? jewelryDetails?.metal_color_id;
      const typeId = activeVariant?.metal_type_id ?? jewelryDetails?.metal_type_id;
      swatches.push({
        key: 'single',
        label: metalLabel(colorId, typeId),
        tone: metalTone(colorId),
        active: true,
        onSelect: () => undefined,
        onPreview: () => undefined,
        onPreviewEnd: () => undefined,
      });
    }

    const sellingPrice = Number(activeVariant?.selling_price ?? jewelryDetails?.selling_price ?? productPrice ?? 0);
    const hasDiscount = !!activeVariant?.discount_value;
    const offLabel = hasDiscount
      ? activeVariant?.discount_type == (2 as any)
        ? `−${activeVariant?.discount_value}%`
        : `${formatCurrency(activeVariant?.discount_value)} off`
      : null;

    const badges: PlpBadge[] = [];
    if (Array.isArray(specialProductTitles) && specialProductTitles[0]?.title) {
      badges.push({ label: specialProductTitles[0].title, tone: 'gilt' });
    }
    if (isFastShipping) {
      badges.push({ label: 'Fast delivery', tone: 'muted' });
    }

    return (
      <PlpCard
        href={href}
        onOpen={handleOpen}
        name={String(productName ?? '')}
        rating={<ProductRating code={code} />}
        mainImage={displayImage}
        hoverImage={displayHoverImage}
        spec={metalLabel(
          activeVariant?.metal_color_id ?? jewelryDetails?.metal_color_id,
          activeVariant?.metal_type_id ?? jewelryDetails?.metal_type_id,
        )}
        price={formatCurrency(hasDiscount ? Number(activeVariant?.discounted_price) : sellingPrice)}
        comparePrice={hasDiscount ? formatCurrency(sellingPrice) : null}
        offLabel={offLabel}
        badges={badges}
        swatches={swatches}
        isWishlisted={isInWishlist || (!!user && !!wId)}
        onToggleWishlist={() => void handleAddtoWishlist()}
      />
    );
  }

  return (
    <div {...props} className={`${props.className} flex bg-paper flex-col items-start gap-3 pb-5 sm:pb-1 lg:gap-3 sm:gap-2 overflow-hidden relative`}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={handleOpen}
        className={`relative h-auto w-full ${isStackedProduct && path === '/design-your-ring-stack' ? 'border border-ink' : 'border border-transparent'} !aspect-square bg-stone cursor-pointer`}
      >
        <div className="relative h-auto w-full aspect-square select-none bg-stone">
          <div
            className={`absolute flex aspect-square top-0 left-0 h-full w-full justify-center transition-opacity duration-500 ease-in-out ${
              displayImage !== NO_IMAGE && hovered ? 'opacity-0 md:opacity-100' : 'opacity-100'
            }`}
            style={{
              backgroundColor: '#F3F3F2',
            }}
          >
            <Image
              src={displayImage}
              preview={false}
              className="object-contain relative !h-full"
              alt="Normal Image"
              fallback={'/images/no_images.svg'}
              style={{
                mixBlendMode: 'multiply',
              }}
            />
          </div>
          <div
            className={`absolute flex aspect-square justify-center top-0 left-0 h-full w-full object-contain transition-all duration-500 ease-in-out ${
              displayHoverImage !== NO_IMAGE && hovered
                ? 'opacity-100 transform translate-y-0 md:hidden'
                : 'opacity-0 transform -translate-y-3 md:hidden'
            }`}
            style={{
              backgroundColor: '#F3F3F2',
            }}
          >
            <Image
              src={displayHoverImage}
              alt="Hovered Image"
              preview={false}
              className="object-contain !h-full"
              fallback={'/images/no_images.svg'}
              style={{
                mixBlendMode: 'multiply',
              }}
            />
          </div>
          {/* {productVariation && productVariation > '1' ? (
            <div className={`absolute bottom-[0rem] md:w-[42px] sm:w-[38px]  left-0 px-2  sm:text-[12px]`}>
              <Image src={'/images/diamond.svg'} preview={false} alt="Product Variation" />
            </div>
          ) : null} */}
          {(estimated_delivery_days &&
            projectSetting?.fastDeliveryDay &&
            projectSetting?.fastDeliveryDay?.data &&
            projectSetting?.fastDeliveryDay?.data?.delivery_day &&
            estimated_delivery_days <= projectSetting?.fastDeliveryDay?.data?.delivery_day) ||
          (handling_days && handling_days <= 2) ? (
            <div className={`absolute bottom-[-6px] left-[-6px] md:w-[42px] sm:w-[38px] px-2 sm:text-[12px]`}>
              <Image src={'/images/delivery.svg'} preview={false} alt="Delivery" />
            </div>
          ) : null}
          {(hoveredOption ? hoverVarient?.discount_value : selectedVariant?.discount_value) && (
            <div
              className={`absolute ${isFastShipping ? 'bottom-[30px] md:bottom-[22px] sm:bottom-[18px]' : 'bottom-5 sm:bottom-2'} left-0 bg-ink px-2 py-1 text-[10.5px] font-medium uppercase tracking-[0.14em] text-paper sm:text-[9.5px]`}
            >
              {(hoveredOption ? hoverVarient?.discount_value : selectedVariant?.discount_type) &&
              (hoveredOption ? hoverVarient?.discount_type : selectedVariant?.discount_type) == (2 as any)
                ? `${hoveredOption ? hoverVarient?.discount_value : selectedVariant?.discount_value}% off`
                : `$${hoveredOption ? hoverVarient?.discount_value : selectedVariant?.discount_value} off`}
            </div>
          )}
        </div>
        {is_stackable && isStackedProduct && (
          <div className="w-full h-full absolute top-0 left-0 bg-transparent flex items-center justify-center">
            <div className="w-fit bg-ink px-3 py-1.5 text-[10.5px] font-medium uppercase tracking-[0.18em] text-paper">Selected</div>
          </div>
        )}
      </div>

      <div className="flex w-full flex-col items-start">
        {/* Title on the left, this product's star rating pinned to the card's right edge. */}
        <div className="flex w-full items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <ProductName productName={String(productName)} />
          </div>
          <ProductRating code={code} className="mt-[3px]" />
        </div>

        <div className="flex h-fit mt-2 items-center gap-2 sm:gap-1">
          <Text
            size="textlg"
            as="p"
            className={`!font-libre tabular-nums text-ink ${hoveredOption ? (hoverVarient?.discount_value ? 'line-through !text-ink-faint !text-[13px] sm:!text-[11px]' : '') : selectedVariant?.discount_value ? 'line-through !text-ink-faint !text-[13px] sm:!text-[11px]' : ''}`}
          >
            {formatCurrency(
              Number(
                (hoveredOption ? hoverVarient?.selling_price : selectedVariant?.selling_price) ??
                  selectedVariant?.selling_price ??
                  jewelryDetails?.selling_price ??
                  productPrice ??
                  0,
              ),
            )}
          </Text>
          {hoveredOption
            ? hoverVarient?.discount_value && (
                <Text size="textlg" as="p" className="!font-libre tabular-nums text-ink sm:text-[13px]">
                  {formatCurrency(hoveredOption ? hoverVarient?.discounted_price : selectedVariant?.discounted_price)}
                </Text>
              )
            : selectedVariant?.discount_value && (
                <Text size="textlg" as="p" className="!font-libre tabular-nums text-ink sm:text-[13px]">
                  {formatCurrency(hoveredOption ? hoverVarient?.discounted_price : selectedVariant?.discounted_price)}
                </Text>
              )}
        </div>
      </div>
      {variation_to_show?.length !== 0 && (
        <div className="flex w-full min-w-0 flex-col gap-1">
          {variation_to_show?.map((el: any, variantion_index: number) => {
            const isBraceletLengthAxis = typeof el?.name === 'string' && el.name.toLowerCase().includes('bracelet_length');
            const groupAxisKey = getAxisKeyForName(el?.name, el?.details?.[0]);
            return (
              Object.keys(el).length !== 0 &&
              !isBraceletLengthAxis && (
                <div className="w-full" key={variantion_index}>
                  <div className="flex w-full items-center gap-2 font-light capitalize text-ink-soft sm:gap-1 [@media(min-width:551px)_and_(max-width:1179px)]:gap-1">
                    <span className="w-[80px] shrink-0 text-left text-[13px] leading-tight sm:w-[54px] sm:text-[10px] [@media(min-width:551px)_and_(max-width:1179px)]:w-[54px] [@media(min-width:551px)_and_(max-width:1179px)]:text-[10px]">
                      {el?.name?.replaceAll('_', ' ')}
                    </span>
                    <div className="flex min-w-0 flex-1 items-center gap-0">
                      <button
                        type="button"
                        ref={prevRefs[variantion_index]}
                        aria-label="Previous options"
                        className={`shrink-0 p-0 ${isBeginnings[variantion_index] ? 'pointer-events-none opacity-30' : ''}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1}
                          stroke="currentColor"
                          className="h-4 w-4"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                      </button>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <Swiper
                          // No Virtual module here: it keeps only a window of slides mounted, and it
                          // recomputed that window out from under slideTo, so a swatch past the first
                          // window (a 925 default sitting at index 9) never got an element and the
                          // row rendered with nothing selected. These rows hold ~10 chips, so
                          // rendering them all costs nothing.
                          modules={[Navigation, Pagination]}
                          onSwiper={(swiper) => {
                            swiperRefs.current[variantion_index] = swiper;
                            setIsBeginnings[variantion_index](swiper.isBeginning);
                            setIsEnds[variantion_index](swiper.isEnd);
                          }}
                          onSlideChange={(swiper) => {
                            setIsBeginnings[variantion_index](swiper.isBeginning);
                            setIsEnds[variantion_index](swiper.isEnd);

                            // Update active metal type index for middle slide display
                            if (el?.name === 'metal_type') {
                              const slidesPerView = windowWidth < 640 ? 3 : 3; // Match your slidesPerView logic
                              const middleIndex = Math.floor(slidesPerView / 2);
                              setActiveMetalTypeIndex(swiper.activeIndex + middleIndex);
                            }
                          }}
                          loop={false}
                          slidesPerView={
                            ['/wishlist', 'premade', '/search'].includes(path)
                              ? windowWidth <= 768
                                ? 3 // md
                                : windowWidth <= 1024
                                  ? 3 // lg
                                  : windowWidth <= 1536
                                    ? el?.name == 'metal_type'
                                      ? 3
                                      : 4 // xl
                                    : el?.name == 'metal_type'
                                      ? 3
                                      : 5 // 2xl
                              : windowWidth < 640
                                ? 3 // sm
                                : windowWidth <= 768
                                  ? 3 // md
                                  : windowWidth <= 1024
                                    ? 3 // lg
                                    : windowWidth <= 1536
                                      ? el?.name == 'metal_type'
                                        ? 3
                                        : 5 // xl
                                      : el?.name == 'metal_type'
                                        ? 3
                                        : 6 // 2xl
                          }
                          slidesPerGroup={
                            ['/wishlist', 'premade', '/search'].includes(path)
                              ? windowWidth <= 768
                                ? 3 // md
                                : windowWidth <= 1024
                                  ? 3 // lg
                                  : windowWidth <= 1536
                                    ? el?.name == 'metal_type'
                                      ? 3
                                      : 4 // xl
                                    : el?.name == 'metal_type'
                                      ? 3
                                      : 5 // 2xl
                              : windowWidth < 640
                                ? 3 // sm
                                : windowWidth <= 768
                                  ? 3 // md
                                  : windowWidth <= 1024
                                    ? 3 // lg
                                    : windowWidth <= 1536
                                      ? el?.name == 'metal_type'
                                        ? 3
                                        : 5 // xl
                                      : el?.name == 'metal_type'
                                        ? 3
                                        : 6 // 2xl
                          }
                          spaceBetween={2}
                          // pagination={{
                          //   type: 'fraction',
                          // }}
                          navigation={{
                            prevEl: prevRefs[variantion_index].current,
                            nextEl: nextRefs[variantion_index].current,
                          }}
                          className="product-variation-swiper !box-border !w-full"
                        >
                          {el?.details?.map((detailsId: any, index: number) => {
                            const mdata = master?.find((item: any) =>
                              el?.name == 'metal_type' ? item.id === detailsId?.metal_color_id : item.id === detailsId,
                            );
                            const metal_types = master?.find((item: any) => item.id === detailsId?.metal_type_id);
                            const metalSwatch = METAL_COLOR_SWATCH[mdata?.code] ?? DEFAULT_METAL_COLOR_SWATCH;
                            const isMatch =
                              el?.name === 'metal_type'
                                ? toComparable(selectedVariant?.metal_color_id) === toComparable(detailsId?.metal_color_id) &&
                                  toComparable(selectedVariant?.metal_type_id) === toComparable(detailsId?.metal_type_id)
                                : groupAxisKey
                                  ? toComparable(selectedVariant?.[groupAxisKey]) === toComparable(detailsId)
                                  : false;
                            const isHoverMatch =
                              el?.name === 'metal_type'
                                ? toComparable(hoverVarient?.metal_color_id) === toComparable(detailsId?.metal_color_id) &&
                                  toComparable(hoverVarient?.metal_type_id) === toComparable(detailsId?.metal_type_id)
                                : groupAxisKey
                                  ? toComparable(hoverVarient?.[groupAxisKey]) === toComparable(detailsId)
                                  : false;

                            return (
                              <SwiperSlide
                                key={`${index}`}
                                virtualIndex={index}
                                className="!flex !box-border !items-center !justify-center !overflow-visible"
                              >
                                <div
                                  className={`relative box-border flex cursor-pointer items-center justify-center ${el?.name == 'metal_type' ? 'w-[90%] !min-w-[36px] sm:!min-w-[28px] [@media(min-width:551px)_and_(max-width:1179px)]:!min-w-[28px]' : el?.name == 'center_diamond' ? 'aspect-square w-[40px] sm:w-[32px] [@media(min-width:551px)_and_(max-width:1179px)]:w-[32px]' : 'aspect-square w-[36px] sm:w-[28px] [@media(min-width:551px)_and_(max-width:1179px)]:w-[28px]'} ${isMatch ? 'shadow-[inset_0_0_0_1px_#111111]' : 'shadow-[inset_0_0_0_1px_transparent]'} hover:shadow-[inset_0_0_0_1px_#111111] ${el?.name == 'metal_type' ? 'overflow-hidden' : ''}`}
                                  onMouseEnter={() => {
                                    if (windowWidth >= 868) {
                                      setHoveredOption(true);
                                      handleHowerVatiation(
                                        el?.name === 'metal_type' ? detailsId?.metal_color_id : detailsId,
                                        el?.name === 'metal_type' ? detailsId?.metal_type_id : '',
                                        el?.name, // pass the name so the function knows what kind of field this is
                                      );
                                    }
                                  }}
                                  onMouseLeave={() => {
                                    if (windowWidth >= 868) {
                                      setHoveredOption(false);
                                      handleHowerVatiation(
                                        el?.name === 'metal_type' ? detailsId?.metal_color_id : detailsId,
                                        el?.name === 'metal_type' ? detailsId?.metal_type_id : '',
                                        el?.name, // pass the name so the function knows what kind of field this is
                                      );
                                    }
                                  }}
                                  onClick={() => {
                                    handleSelectedVatiation(
                                      el?.name === 'metal_type' ? detailsId?.metal_color_id : detailsId,
                                      el?.name === 'metal_type' ? detailsId?.metal_type_id : '',
                                      el?.name, // pass the name so the function knows what kind of field this is
                                    );
                                  }}
                                >
                                  {el?.name == 'carat' ? (
                                    <div className="text-[13px] sm:text-[10px] aspect-square flex items-center justify-center">{mdata?.name}</div>
                                  ) : el?.name == 'metal_type' ? (
                                    <div
                                      className={`${el?.name == 'metal_type' ? '!w-[100%] !h-[33px] sm:!w-[100%] sm:!h-[26px]' : '!w-[100%] !h-[28px] sm:!w-[100%] sm:!h-[22px]'} ${'m-[2px]'} object-contain ${metalSwatch.bg} flex items-center justify-center`}
                                    >
                                      {el?.name == 'metal_type' &&
                                        (isMatch ||
                                          (hoveredOption && isHoverMatch) ||
                                          (activeMetalTypeIndex !== null && index === activeMetalTypeIndex)) && (
                                          <div className={`${metalSwatch.text} text-[14px] lg:text-[13px] sm:text-[10px]`}>
                                            {metal_types?.code !== 'SILVER_925' ? metal_types?.code : '925'}
                                          </div>
                                        )}
                                    </div>
                                  ) : (
                                    <Image
                                      src={mdata?.image?.[0]}
                                      // height={30}
                                      preview={false}
                                      // width={30}
                                      fallback="/images/no_images.svg"
                                      alt="image"
                                      className={`${el?.name == 'metal_type' ? '!w-[35px] !h-[35px] sm:!w-[28px] sm:!h-[28px]' : el?.name == 'center_diamond' ? '!w-[30px] !h-[30px] sm:!w-[24px] sm:!h-[24px]' : '!w-[30px] !h-[30px] sm:!w-[24px]'} sm:!aspect-square object-contain`}
                                      // className={`${productSKU?.metalColor === newObj?.code ? '' : 'opacity-70'} cursor-pointer aspect-square`}
                                    />
                                  )}
                                  {/* {el?.name == 'metal_type' && (isMatch || (hoveredOption && isHoverMatch)) && (
                                    <div className="text-[9px] sm:text-[8px] absolute top-[8%] left-[-36%] w-full text-center bg-primary/70 text-text_w -rotate-45">
                                      {metal_types?.code !== 'SILVER_925' ? metal_types?.code : '925'}
                                    </div>
                                  )} */}
                                </div>
                              </SwiperSlide>
                            );
                          })}
                        </Swiper>
                      </div>
                      <button
                        type="button"
                        ref={nextRefs[variantion_index]}
                        aria-label="Next options"
                        className={`shrink-0 p-0 ${isEnds[variantion_index] ? 'pointer-events-none opacity-30' : ''}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1}
                          stroke="currentColor"
                          className="h-4 w-4"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )
            );
          })}
        </div>
      )}

      {Array.isArray(specialProductTitles) && specialProductTitles.length > 0 && (
        <div className="pointer-events-none absolute left-3 top-3 z-[2] flex items-center gap-1">
          <span
            key={specialProductTitles[0].id}
            className="text-[10.5px] font-semibold uppercase leading-[1.3] tracking-[0.14em] text-ink sm:text-[9.5px]"
          >
            {specialProductTitles[0].title ?? ''}
          </span>
        </div>
      )}

      <div className="absolute top-1 right-2 p-1 pointer-events-auto">
        <button
          type="button"
          aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          className="flex min-h-[44px] min-w-[44px] cursor-pointer touch-manipulation items-start justify-end border-0 bg-transparent p-0 text-ink [-webkit-tap-highlight-color:transparent]"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            void handleAddtoWishlist();
          }}
        >
          {isInWishlist ? (
            <FaHeart className="pointer-events-none h-5 w-5 shrink-0 text-teal" aria-hidden />
          ) : (
            <FaRegHeart className="pointer-events-none h-5 w-5 shrink-0" aria-hidden />
          )}
        </button>
      </div>
    </div>
  );
}
