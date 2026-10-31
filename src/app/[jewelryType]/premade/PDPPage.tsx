/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable import/no-unresolved */
/* eslint-disable no-unsafe-optional-chaining */
'use client';
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState, startTransition } from 'react';

import Slider from '@mui/material/Slider';
import { Button, Checkbox, Image, Input, Radio, Select, Skeleton, Tooltip } from 'antd';
import dayjs from 'dayjs';
import _ from 'lodash';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { BsBoxSeam } from 'react-icons/bs';
import { FaHeart, FaRegHeart } from 'react-icons/fa6';
import { FiMinus, FiPlus } from 'react-icons/fi';
import { LuLoader } from 'react-icons/lu';
import { PiRuler, PiTruck } from 'react-icons/pi';
import { FreeMode, Navigation, Thumbs, Zoom } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import ShopPayExpressButton from '@/app/cart/ShopPayExpressButton';
import { Text } from '@/components';
import ImageZoom from '@/components/CustomImageZoom';
import ProtectedVideo from '@/components/ProtectedVideo';
import ShareButton from '@/components/ShareButton';
import WhyAllorya from '@/components/WhyAllorya';
import { IsRingSizeType } from '@/constants/Header';
import * as ga4 from '@/lib/analytics';
import * as klaviyo from '@/lib/klaviyo';
import { apiAddToWishList, apiDeleteFromWishList, apiGetLoalCartList } from '@/services/cartService';
import {
  fetchProductsDetails,
  fetchSuggestedProducts,
  setClearSuggestion,
  setSelectedAppraisal,
  setSelectedProductsDetails,
  setSelectedRingSizeId,
  setSelectedRingSizeRedux,
  setSelectedWarranty,
  setShouldLoadList,
  useAppDispatch,
  useAppSelector,
} from '@/store';
import { addCartProductCounts, fetchCartProducts, fetchWishListProducts, setWishlistProducts } from '@/store/slices/Cart/cartSlice';
import {
  setCustomCarats,
  setCustomShapes,
  setSelectedCaratsData,
  setSelectedRingSize,
  setSelectedSettingRingPrice,
  setSelectedSettingSkuData,
  setSelectedSettingStore,
  setSelectedShapesData,
} from '@/store/slices/customProducts/customProductSlice';
import { carryForwardFilterCrumb } from '@/utils/breadcrumbFilterParams';
import { formatCurrency } from '@/utils/common';
import { trackAddToCart, trackAddToWishlist, trackViewContent } from '@/utils/metaPixel';

import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import 'swiper/css/zoom';
import CompareMetalsModal from './CompareMetalsModal';
import { Engraving } from './Components/Engraving';
import CustomRequestForm from './CustomRequestForm';
import RingSizeChartModal from './RingSizeChartModal';
import { YotpoStarReview } from './yotpoReiew';

function getSkuSlug(
  variations: any,
  metal_id: string,
  metal_color_id: string,
  shape_id?: string,
  carat_id?: string,
  custom_stone_id?: string,
  center_diamond_id?: string,
  accent_diamond_id?: string,
  second_accent_diamond_id?: string,
  pre_made_carat?: string | null,
  pre_made_bracelet_length?: string | null,
  pre_made_band_width?: string | null,
  center_shape_id?: string | null,
): string | undefined {
  const variantMetal = variations?.find((variation: any) => variation.id === metal_id)?.metal_color_id;
  const metalColor = variantMetal?.find((color: any) => color.id === metal_color_id) ?? variantMetal?.[0];
  const filterBraceletLength = metalColor?.bracelet_length_ids?.find((option: any) => option?.id === pre_made_bracelet_length);
  const filterBandWidth = metalColor?.band_width_ids?.find((option: any) => option?.id === pre_made_band_width);

  // Shape + carat logic stays same
  if (shape_id && carat_id) {
    const diamondShape = metalColor?.customization_options.find((option: any) => option?.shape_id === shape_id);
    const diamondCarat = diamondShape?.carats.find((carat: any) => carat?.carat_id === carat_id);
    return diamondCarat?.sku_slug ?? diamondShape?.sku_slug;
  }

  // ---- Stones logic starts ----

  // A product can offer several center shapes, so the node is matched on (shape, colour). The
  // fallbacks run in order: the exact pair, then that shape's first colour - a colour that exists
  // under Oval may not exist under Pear, and without that step switching shape would silently
  // stay on the old one - then the first node of all.
  const centerStoneCandidates = center_shape_id
    ? metalColor?.center_stone_id?.filter((option: any) => option.shape === center_shape_id)
    : metalColor?.center_stone_id;
  const centerStone =
    centerStoneCandidates?.find((option: any) => option.color?.[0]?.id === center_diamond_id) ??
    centerStoneCandidates?.[0] ??
    metalColor?.center_stone_id?.find((option: any) => option.color?.[0]?.id === center_diamond_id) ??
    metalColor?.center_stone_id?.[0];

  // accent one depends on center stone
  const accentStone =
    centerStone?.accent_stone_id?.find((option: any) => option.color?.[0]?.id === accent_diamond_id) ?? centerStone?.accent_stone_id?.[0]; // fallback [0]

  // accent two depends on accent one
  const accentTwoStone =
    accentStone?.accent_diamond_two?.find((option: any) => option.color?.[0]?.id === second_accent_diamond_id) ??
    accentStone?.accent_diamond_two?.[0]; // fallback [0]
  // ---- Rule 1: if accent one exists, skip size logic for center stone ----
  if (centerStone && accentStone && !second_accent_diamond_id) {
    const caratAccentOne =
      accentStone?.color?.[0]?.sizes?.find((option: any) => option?.weight == pre_made_carat) ?? accentStone?.color?.[0]?.sizes?.[0];
    const braceletAccentOne = caratAccentOne?.bracelet_length_ids?.find((option: any) => option?.id === pre_made_bracelet_length);
    const bandWidthAccentOne = caratAccentOne?.band_width_ids?.find((option: any) => option?.id === pre_made_band_width);
    return braceletAccentOne?.sku_slug ?? bandWidthAccentOne?.sku_slug ?? caratAccentOne?.sku_slug ?? accentStone?.sku_slug ?? centerStone?.sku_slug;
  }

  // ---- Rule 2: if accent two exists, skip size logic for accent one ----
  if (centerStone && accentStone && accentTwoStone) {
    const caratAccentTwo =
      accentTwoStone?.color?.[0]?.sizes?.find((option: any) => option?.weight == pre_made_carat) ?? accentTwoStone?.color?.[0]?.sizes?.[0];

    const braceletAccentTwo = caratAccentTwo?.bracelet_length_ids?.find((option: any) => option?.id === pre_made_bracelet_length);
    const bandWidthAccentTwo = caratAccentTwo?.band_width_ids?.find((option: any) => option?.id === pre_made_band_width);
    return (
      braceletAccentTwo?.sku_slug ??
      bandWidthAccentTwo?.sku_slug ??
      caratAccentTwo?.sku_slug ??
      accentTwoStone?.sku_slug ??
      accentStone?.sku_slug ??
      centerStone?.sku_slug
    );
  }

  // ---- Normal center stone logic if no accent one ----
  if (centerStone && !accentStone) {
    const caratCenter =
      centerStone?.color?.[0]?.sizes?.find((option: any) => option?.weight == pre_made_carat) ?? centerStone?.color?.[0]?.sizes?.[0];
    const braceletCenter = caratCenter?.bracelet_length_ids?.find((option: any) => option?.id === pre_made_bracelet_length);
    const bandWidthCenter = caratCenter?.band_width_ids?.find((option: any) => option?.id === pre_made_band_width);
    return braceletCenter?.sku_slug ?? bandWidthCenter?.sku_slug ?? caratCenter?.sku_slug ?? centerStone?.sku_slug;
  }

  // no stones case
  return filterBraceletLength?.sku_slug ?? filterBandWidth?.sku_slug ?? metalColor?.sku_slug;
}

interface ProductSKUData {
  productNo: string;
  diamondShape: string;
  metalColor: string;
  metalType: string;
  diamondCarat: string;
  diamondType: string;
  ringSize: string;
}

const PDPPage = ({ selectionRoute }: { selectionRoute?: any }) => {
  const dispatch = useAppDispatch();

  const router = useRouter();

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const rawSlug = searchParams?.get('slug');
  // eslint-disable-next-line prefer-const
  let year: number | null = searchParams?.get('year') ? Number(searchParams.get('year')) : null;
  // eslint-disable-next-line prefer-const
  let appraisal = searchParams?.get('appraisal') === 'true';
  // eslint-disable-next-line prefer-const
  let warranty = searchParams?.get('warranty') === 'true';
  const decodedSlug = rawSlug ?? searchParams?.get('id');
  const slug = decodedSlug ? decodeURIComponent(decodedSlug) : '';
  const dId = searchParams?.get('did');
  const { user } = useAppSelector((state) => state.auth.auth);
  const { cartProducts, wishlistProducts, loading } = useAppSelector((state) => state?.cart);
  const selectedProduct = useAppSelector((state) => state.products?.selectedProduct?.product_details);
  const selectedProductAllData = useAppSelector((state) => state.products?.selectedProduct);
  const selectedProductVariation = useAppSelector((state) => state.products?.selectedProduct?.product_variation);
  const redirectToSlug = useAppSelector((state) => state.products?.selectedProduct?.redirect_to_slug);
  const redirectToCategory = useAppSelector((state) => state.products?.selectedProduct?.redirect_to_category);
  const loadedSlug = useAppSelector((state) => state.products?.selectedProduct?.requested_slug);
  const productFilter = useAppSelector((state) => state?.master?.data);
  const { appraisalData, warrantyData, engraving }: any = useAppSelector((state) => state?.master);
  const masterRingSizePrice = useAppSelector((state) => state?.master?.ringSizePriceList);
  const { selectedRingSizeId, selectedRingSizeRedux, suggestion } = useAppSelector((state) => state?.products);
  const { selectedDiamondStore, selectedSettingStore, selectedRingSize } = useAppSelector((s) => s.customProduct);
  const [product, setProduct] = useState<any>(selectedProduct);
  const [caratsData, setCaratsData] = useState<any>();
  const [engravingText, setEngravingText] = useState<any>({
    Text: '',
    fontFamily: 'Arial',
  });
  const [diamondColorData, setDiamondColorData] = useState<any>();
  const [customVariant, setCustomVariants] = useState<any>();
  const [centerStoneVariant, setCenterStoneVariant] = useState<any>(null);
  // Distinct center shapes of the current metal colour. Only rendered when there is more than one,
  // so single-shape products look exactly as they did.
  const [centerShapeVariant, setCenterShapeVariant] = useState<any>(null);
  const [accentOneStoneVariant, setAccentOneStoneVariant] = useState<any>();
  const [accentTwoStoneVariant, setAccentTwoStoneVariant] = useState<any>();
  const jewelryMetadataLookup = product?.jewelry_sku?.find((item: any) => (item.sku_slug as string) == slug);
  const jewelryMetadataFallbackRef = useRef<any>(null);
  // Keep a stable reference: when switching variants on the same product, the new slug
  // might not be in jewelry_sku yet (before API response). Fall back to the previous
  // valid metadata so the UI doesn't flash empty.
  if (jewelryMetadataLookup) {
    jewelryMetadataFallbackRef.current = jewelryMetadataLookup;
  }
  const jewelryMetadata = jewelryMetadataLookup ?? jewelryMetadataFallbackRef.current;
  const [productVariant, setProductVariant] = useState<any>(selectedProductVariation);
  const [selectedProductObject, setSelectedProductObject] = useState<any>();
  const [productSKU, setProductSKU] = useState<ProductSKUData | any>();
  const [showFullDescription, setShowFullDescription] = useState(false);

  const [selectedMetalType, setSelectedMetalType] = useState<{
    id: string;
    name: string;
  }>();
  const [selectedCarat, setSelectedCarat] = useState<any>();
  const [selectedMetalColor, setSelectedMetalColor] = useState<any>();
  const [selectedSize, setSelectedSize] = useState<any>();
  const [selectedJewelryType, setSelectedJewelryType] = useState<any>('');
  const [customRingSize, setCustomRingSize] = useState<any>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isRingSizeChartOpen, setIsRingSizeChartOpen] = useState(false);
  const [isCompareMetalsOpen, setIsCompareMetalsOpen] = useState(false);
  const [count] = useState(1);
  const isSilverMetal = productSKU?.metalType === 'SILVER_925';
  const [wishlist, setWishlist] = useState(false);
  const [wId, setWid] = useState<any>();
  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);
  // Mobile-only: reference to the main product Swiper instance plus a per-product
  // guard so we default the slider to the second product image once per product
  // (desktop keeps its own separate slider and is unaffected).
  const mobileSwiperRef = useRef<any>(null);
  const mobileSecondImageAppliedRef = useRef<string | null>(null);
  const [swiperData, setSwiperData] = useState<any>(null);
  const [isVideo, setIsVideo] = useState<any>(false);
  const [isVideo2, setIsVideo2] = useState<any>(false);
  const [productPrice, setProductPrice] = useState<number>(0);
  const [preMadeCarats, setPreMadeCarats] = useState<any>();
  const [videoOne, setVideoOne] = useState<any>(null);
  const [videoTwo, setVideoTwo] = useState<any>(null);
  const [is360, setIs360] = useState<any>(false);
  const [activeIndex, setActiveIndex] = useState(0);
  // Mobile-only fullscreen zoom viewer (pinch / double-tap / drag) for the product images.
  const [mobileZoom, setMobileZoom] = useState<{ open: boolean; current: number }>({ open: false, current: 0 });
  // True while the shopper has pinched a mobile slide in past 1x, so the tap handler can
  // reset it instead of opening the fullscreen viewer on top of an already-zoomed slide.
  const [inlineZoomed, setInlineZoomed] = useState(false);
  const [imageComponent, setImageComponent] = useState<any>();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isExpandedProductDetails, setIsExpandedProductDetails] = useState(false);
  const [isExpandedDescription, setIsExpandedDescription] = useState(true);
  const [isExpandedSideDiamond, setIsExpandedSideDiamond] = useState(true);
  const [is_appraisal, setIsAppraisalSelected] = useState(appraisal); // State to track checkbox selection
  const [isChecked, setIsChecked] = useState<any>(warranty);
  const [selectedYear, setSelectedYear] = useState<number | null>(year);
  const [selectedYearValue, setSelectedYearValue] = useState<any>(null);
  const [openCustomRequest, setOpenCustomRequest] = useState(false);
  const [preMadeBraceletLength, setPreMadeBraceletLength] = useState<any>();
  // BRACELET_LENGTH
  const [preMadeBandWidth, setPreMadeBandWidth] = useState<any>();
  const [topOffset, setTopOffset] = useState<any>(0);
  // Gate the desktop-only 360 iframe on viewport. `sm:hidden` merely hides it
  // visually on mobile — iOS Safari still boots the iframe's WebGL context,
  // which combined with the in-swiper mobile 360 iframe causes an OOM kill.
  const [isDesktopViewport, setIsDesktopViewport] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }
    const mq = window.matchMedia('(min-width: 551px)');
    const update = () => setIsDesktopViewport(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  const cRef = useRef<HTMLDivElement>(null);

  // ─── Affirm Promo Messaging ──────────────────────────────────────
  const affirmPriceInCents = useMemo(() => {
    const base = selectedProductObject?.discounted_price ?? selectedProductObject?.selling_price ?? 0;
    const ring = productPrice || 0;
    const appraisal = is_appraisal ? appraisalData?.price || 0 : 0;
    const warranty = selectedYear !== null ? selectedYearValue?.price || 0 : 0;
    const engrave = engravingText?.Text ? engraving?.data?.engraving_price || 0 : 0;
    return Math.round((Number(base) + Number(ring) + Number(appraisal) + Number(warranty) + Number(engrave)) * 100);
  }, [selectedProductObject, productPrice, is_appraisal, appraisalData, selectedYear, selectedYearValue, engravingText, engraving]);

  // Affirm injects the whole promo sentence — including the "Learn more" wording — into the
  // <p> at runtime, so it cannot be changed in markup. Watch the node and swap that text for a
  // round info icon whenever the SDK renders or refreshes it.
  const affirmMessageRef = useRef<HTMLParagraphElement | null>(null);
  useEffect(() => {
    const el = affirmMessageRef.current;
    if (!el) {
      return;
    }
    const swapLearnMore = () => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let node: Node | null = walker.nextNode();
      while (node) {
        const text = node.nodeValue ?? '';
        if (/learn\s*more/i.test(text)) {
          const icon = document.createElement('span');
          icon.className = 'affirm-info-icon';
          icon.setAttribute('role', 'img');
          icon.setAttribute('aria-label', 'Learn more about Affirm');
          icon.title = 'Learn more about Affirm';
          icon.textContent = 'i';
          node.nodeValue = text.replace(/learn\s*more/i, '').replace(/\s+/g, ' ');
          node.parentNode?.insertBefore(icon, node.nextSibling);
          return;
        }
        node = walker.nextNode();
      }
    };
    swapLearnMore();
    const observer = new MutationObserver(swapLearnMore);
    observer.observe(el, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [affirmPriceInCents]);

  useEffect(() => {
    // Retry refresh a few times — SDK may still be loading
    const tryRefresh = () => {
      if (typeof (window as any).affirm?.ui?.refresh === 'function') {
        (window as any).affirm.ui.refresh();
        return true;
      }
      return false;
    };
    if (!tryRefresh()) {
      const timer = setTimeout(tryRefresh, 1000);
      return () => clearTimeout(timer);
    }
  }, [affirmPriceInCents, dId]);

  useEffect(() => {
    if ((window as any).affirm?.checkout) {
      return;
    }

    const affirmPublicKey = process.env.NEXT_PUBLIC_AFFIRM_PUBLIC_KEY;
    const affirmJsUrl = process.env.NEXT_PUBLIC_AFFIRM_JS_URL;
    if (!affirmPublicKey || !affirmJsUrl) {
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-affirm-sdk="true"]');
    if (existingScript) {
      setTimeout(() => {
        if (typeof (window as any).affirm?.ui?.refresh === 'function') {
          (window as any).affirm.ui.refresh();
        }
      }, 500);
      return;
    }

    const _affirm_config = {
      public_api_key: affirmPublicKey,
      script: affirmJsUrl,
    };
    (function (m: any, g: any, n: any, d: any, a: any, e: any, h: any, c: any) {
      const b = m[n] || {},
        k = document.createElement(e),
        p = document.getElementsByTagName(e)[0],
        l = function (a: any, b: any, c: any) {
          return function (...args: unknown[]) {
            a[b]._.push([c, args]);
          };
        };
      b[d] = l(b, d, 'set');
      const f = b[d];
      b[n] = function (...args: unknown[]) {
        f.apply(b, args);
      };
      b[n]._ = [];
      f._ = [];
      b[n + '_' + d] = l(b, n, 'init');
      b[a] = l(b, a, 'set');
      b[h] = l(b, h, 'set');
      k.async = !0;
      k.src = c[e];
      k.dataset.affirmSdk = 'true';
      p.parentNode.insertBefore(k, p);
      delete c[e];
      f(c);
      m[n] = b;
    })(window, 0, 'affirm', 'checkout', 'ui', 'script', 'ready', _affirm_config);

    setTimeout(() => {
      if (typeof (window as any).affirm?.ui?.refresh === 'function') {
        (window as any).affirm.ui.refresh();
      }
    }, 500);
  }, []);
  // ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (warrantyData?.yearPriceList && year != null) {
      const defaultSelected = warrantyData.yearPriceList.find((item: any) => item.year === year);
      if (defaultSelected) {
        setSelectedYear(year);
        setSelectedYearValue(defaultSelected);
      }
    }
  }, []);

  // The APPRAISAL & WARRANTY panel stays expanded, but the Extended Warranty
  // is left UNchecked by default — the customer opts in explicitly. The URL
  // params (warranty/year) still pre-select it when present.
  const warrantyDefaultAppliedRef = useRef(false);
  useEffect(() => {
    if (warrantyDefaultAppliedRef.current) {
      return;
    }
    if (warranty || year != null) {
      warrantyDefaultAppliedRef.current = true;
    }
  }, [warrantyData]);

  useEffect(() => {
    const updateOffset = () => {
      if (typeof window === 'undefined' || !cRef.current) {
        return;
      }

      const height = cRef.current.offsetHeight;
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const offset = vh - height;

      let topValue = '';
      if (vw >= 1024) {
        topValue = searchParams?.get('id') ? (offset - 80 > 0 ? `5rem` : `${offset}px`) : offset > 0 ? `0px` : `${offset}px`;
      } else if (vw >= 768) {
        topValue = searchParams?.get('id') ? (offset - 130 > 0 ? `5rem` : `${offset}px`) : offset > 0 ? `0px` : `${offset}px`;
      } else {
        topValue = '0px';
      }
      setTopOffset(topValue);
    };

    // Debounced handler — iOS Safari fires resize on every scroll (address bar
    // hide/show), and each setState triggers a re-render. Debouncing at 150ms
    // batches rapid-fire resize events into a single state update.
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedUpdateOffset = () => {
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
      resizeTimer = setTimeout(updateOffset, 150);
    };

    // Run immediately on mount
    updateOffset();
    window.addEventListener('resize', debouncedUpdateOffset);

    // Recompute the sticky `top` whenever the sticky column's own height changes —
    // opening/closing the PRODUCT DETAILS / DESCRIPTION / SIDE DIAMOND accordions,
    // toggling warranty/appraisal, or late-loading content all change its height.
    // Without this the bottom-align offset (`viewportHeight - columnHeight`) goes
    // stale and the Buy Now button no longer sticks to the viewport bottom.
    // The 500ms accordion transition fires many intermediate sizes, so the shared
    // debounce settles on the final height.
    let resizeObserver: ResizeObserver | null = null;
    if (cRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(debouncedUpdateOffset);
      resizeObserver.observe(cRef.current);
    }

    return () => {
      window.removeEventListener('resize', debouncedUpdateOffset);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
    };
  }, [product?.code, showFullDescription]);

  function getPriceViaRingAndMetal(ringSize: null | string, metal: string) {
    const ProductPrice = masterRingSizePrice?.find((item: any) => item.ring_size_id == (ringSize ?? '0') && item.metal_type_id == metal);
    return ringSize != null ? Number(ProductPrice?.rate) : 0;
  }

  const genderWiseRing = masterRingSizePrice?.filter((el: any) => {
    if (selectedProduct?.gender_category == 2) {
      return el.is_men == true;
    } else {
      return el.is_women == true;
    }
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
        ?.filter((el: any) => (selectedProduct?.gender_category == 2 ? el.is_default_men == true : el.is_default_women == true))
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

  // Match on the jewelry type name rather than the slug built at line ~1000, which turns
  // "Custom Engagement Rings" into "custom-engagement-rings" and so misses every hardcoded
  // 'engagement-rings' | 'wedding-bands' comparison.
  const isRingSizeType = IsRingSizeType?.includes(selectedProduct?.subType?.jewelry_type?.name);

  // Inside the 3-step custom flow the buyer picks the size on the complete page (step 3), so the
  // setting PDP must not ask for it as well. `selectionRoute` is only passed down when this page
  // is rendered from that flow, so its absence means this is a normal standalone PDP.
  const showRingSizeSelector = selectionRoute === undefined && isRingSizeType;

  // The ring size checks Buy Now and Shop Pay share. Surfaces the message and returns false when unmet.
  const isRingSizeValid = () => {
    // Only demand a size where we actually rendered the selector.
    if (!selectedRingSizeRedux && showRingSizeSelector) {
      setErrorMessage('Please enter a valid ring size!');
      return false;
    }
    if (selectedSize === 0) {
      const customSizeRegex = /^[0-9]{1,2}(\.[0-9]{1,2})?$/;
      // Validate custom size when "Other Size" is selected
      if (
        !customRingSize ||
        !customSizeRegex.test(customRingSize) ||
        parseFloat(customRingSize) > 20 ||
        parseFloat(customRingSize) < 3 ||
        customRingSize.length > 5
      ) {
        setErrorMessage('Please enter a valid ring size!');
        return false;
      }
    }
    return true;
  };

  // The line Buy Now adds to the cart — and the one Shop Pay buys on its own.
  const cartLinePayload = useMemo(
    () => ({
      jewelry_id: product?.jewelry_id,
      count: count,
      sku_master: jewelryMetadata?.id,
      is_appraisal: is_appraisal,
      engravingText: { Text: engravingText?.Text, fontFamily: engravingText?.fontFamily },
      selectedYearValue: selectedYearValue?.year,
      ring_size_id: masterRingSizePrice?.find(
        (item: any) => item.ring_size_id == selectedRingSizeId && item.metal_type_id == jewelryMetadata?.metal_type_id,
      )?.id,
    }),
    [
      product?.jewelry_id,
      count,
      jewelryMetadata?.id,
      jewelryMetadata?.metal_type_id,
      is_appraisal,
      engravingText?.Text,
      engravingText?.fontFamily,
      selectedYearValue?.year,
      masterRingSizePrice,
      selectedRingSizeId,
    ],
  );

  // Shop Pay prices this product alone, not the cart. The backend prices the same enriched lines the
  // cart page sends, so the line is resolved through the guest cart endpoint (debounced, as the
  // engraving text changes per keystroke). `key` records which selection the line was built from.
  const cartLineKey = JSON.stringify(cartLinePayload);
  const [shopPayLine, setShopPayLine] = useState<{ key: string; items: any[] }>({ key: '', items: [] });
  useEffect(() => {
    if (searchParams?.get('id') || !cartLinePayload.jewelry_id || !cartLinePayload.sku_master || count < 1) {
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      apiGetLoalCartList([cartLinePayload])
        .then((res: any) => {
          if (cancelled) {
            return;
          }
          // Same normalisation as the cart page: the warranty travels as `{ year, price }`.
          const items = (res?.data?.data ?? []).map((line: any) => ({
            ...line,
            selectedYearValue: line?.is_warranty ? { year: line?.warranty_year, price: line?.warranty_amount } : null,
          }));
          setShopPayLine({ key: cartLineKey, items });
        })
        .catch(() => {
          if (!cancelled) {
            setShopPayLine({ key: '', items: [] });
          }
        });
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartLineKey]);

  // Synchronous click gate for Shop Pay (the window must open in the same tick as the click).
  const canStartShopPay = () => {
    if (!isRingSizeValid()) {
      return false;
    }
    // The line is still being re-priced for the latest selection; never pay for the previous one.
    if (shopPayLine.key !== cartLineKey) {
      setErrorMessage('Updating your total. Please try again in a moment.');
      return false;
    }
    setErrorMessage('');
    return true;
  };

  const handleAddtocart = async () => {
    if (!isRingSizeValid()) {
      return;
    }
    // Clear the carried-over size for products that take no size at all — never for a ring type,
    // or the chosen size would be wiped out of the store on the way to the cart.
    if (!isRingSizeType) {
      dispatch(setSelectedRingSize(null));
      dispatch(setSelectedRingSizeRedux(null));
    }
    if (count > 0) {
      const payload = cartLinePayload;

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

      if (user) {
        const cartItems = cartProducts.some((p: any) => {
          if (payload.ring_size_id) {
            // For rings, match both sku_master and ring_size_id
            return p.sku_master === payload.sku_master && p.ring_size_id === payload.ring_size_id;
          }
          // For other jewelry, match only sku_master
          return p.sku_master === payload.sku_master;
        });
        if (!cartItems) {
          const response = await dispatch(fetchCartProducts({ data: [payload] }));
          if (response?.payload?.status === 200 || response?.payload?.status === 201) {
            const price = selectedProductObject?.discounted_price ?? selectedProductObject?.selling_price ?? 0;
            trackAddToCart({
              content_ids: [String(jewelryMetadata?.id ?? payload.sku_master)],
              value: Number(price) * count,
              currency: 'USD',
              num_items: count,
            });
            // GA4 add_to_cart
            ga4.addToCart({
              items: [
                ga4.buildProductItem({
                  item_id: jewelryMetadata?.id ?? payload.sku_master,
                  item_name: product?.title,
                  price: Number(price),
                  quantity: count,
                  item_category: product?.subType?.jewelry_type?.name,
                  item_variant: jewelryMetadata?.metal_type_id,
                }),
              ],
              value: Number(price) * count,
            });
            klaviyo.trackAddedToCart({
              productId: String(jewelryMetadata?.id ?? payload.sku_master),
              productName: product?.title,
              sku: selectedProductObject?.sku_code ?? jewelryMetadata?.sku_code,
              categories: product?.subType?.jewelry_type?.name ? [product.subType.jewelry_type.name] : [],
              imageUrl: selectedProductObject?.carat_images?.[0] ?? jewelryMetadata?.carat_images?.[0],
              url: typeof window !== 'undefined' ? window.location.href : undefined,
              brand: 'Ashclair',
              price: Number(price),
              quantity: count,
            });
            router.push('/cart');
          }
        }
        router.push('/cart');
      } else {
        const productIndex = existingCart.findIndex((item) => {
          if (payload.ring_size_id) {
            // For rings, match both sku_master and ring_size_id
            return item.sku_master === payload.sku_master && item.ring_size_id === payload.ring_size_id;
          }
          // For other jewelry, match only sku_master
          return item.sku_master === payload.sku_master;
        });
        if (productIndex > -1) {
          existingCart[productIndex] = {
            ...existingCart[productIndex],
            ...payload,
          };
          existingCart[productIndex].is_appraisal = is_appraisal;
          existingCart[productIndex].selectedYearValue = selectedYearValue?.year;
          existingCart[productIndex].engravingText = { Text: engravingText?.Text, fontFamily: engravingText?.fontFamily };
        } else {
          existingCart.push(payload);
          const price = selectedProductObject?.discounted_price ?? selectedProductObject?.selling_price ?? 0;
          trackAddToCart({
            content_ids: [String(jewelryMetadata?.id ?? payload.sku_master)],
            value: Number(price) * count,
            currency: 'USD',
            num_items: count,
          });
          // GA4 add_to_cart
          ga4.addToCart({
            items: [
              ga4.buildProductItem({
                item_id: jewelryMetadata?.id ?? payload.sku_master,
                item_name: product?.title,
                price: Number(price),
                quantity: count,
                item_category: product?.subType?.jewelry_type?.name,
                item_variant: jewelryMetadata?.metal_type_id,
              }),
            ],
            value: Number(price) * count,
          });
          klaviyo.trackAddedToCart({
            productId: String(jewelryMetadata?.id ?? payload.sku_master),
            productName: product?.title,
            sku: selectedProductObject?.sku_code ?? jewelryMetadata?.sku_code,
            categories: product?.subType?.jewelry_type?.name ? [product.subType.jewelry_type.name] : [],
            imageUrl: selectedProductObject?.carat_images?.[0] ?? jewelryMetadata?.carat_images?.[0],
            url: typeof window !== 'undefined' ? window.location.href : undefined,
            brand: 'Ashclair',
            price: Number(price),
            quantity: count,
          });
          router.push('/cart');
        }
        dispatch(addCartProductCounts(existingCart?.length));
        localStorage.setItem('cartItems', JSON.stringify(existingCart));
        router.push('/cart');
      }
    }
  };
  const memoizedSuggestion = useMemo(() => suggestion, [suggestion]);
  const extraTitles = useMemo(() => {
    return (product?.extra_titles ?? [])
      .map((item: any) => {
        const label = item?.master_name?.trim?.() ?? '';
        const value = item?.value?.trim?.() ?? '';
        return { id: item?.id, label, value };
      })
      .filter((item: { value: string }) => Boolean(item?.value));
  }, [product?.extra_titles]);
  const attributesData = useMemo(() => {
    return (product?.attribute_values ?? [])
      .map((item: any) => {
        const label = item?.attribute_name?.trim?.() ?? '';
        const value = item?.value?.trim?.() ?? '';

        return { id: item?.id, label, value };
      })
      .filter((item: { value: string }) => Boolean(item?.value));
  }, [product?.attribute_values]);

  // Material highlights appended to the metal line under the title. Metal, center stone (or shape in the
  // custom flow) and certificate are already on that line, so only the remaining details of the selected
  // SKU and the chosen ring size are listed here; each follows the variant switch and empty ones are dropped.
  const materialHighlights = useMemo(() => {
    const masterName = (id?: string | null): string | undefined => (id ? productFilter?.find((el: any) => el.id === id)?.name?.trim() : undefined);
    const withUnit = (name: string | undefined, unit: string) => (name && /^[\d.]+$/.test(name) ? `${name} ${unit}` : name);
    const prefixed = (prefix: string, value: string | undefined) => (value ? `${prefix} ${value}` : undefined);
    const isCustomFlow = Boolean(searchParams?.get('id'));

    const premadeCaratWeight = Number(jewelryMetadata?.premade_carat_weight);
    const caratName = masterName(jewelryMetadata?.carat_id);
    const carat =
      premadeCaratWeight > 0
        ? `${premadeCaratWeight} Carat`
        : caratName && !isNaN(parseFloat(caratName))
          ? `${parseFloat(caratName)} Carat`
          : caratName;

    // Only report a ring size where the selector is rendered, otherwise a size carried over in the
    // store from another product would show. 0 is the "Other Size" option backed by the free-text input.
    const ringSizeValue = isCustomFlow ? selectedRingSize : selectedRingSizeRedux;
    const hasRingSize = showRingSizeSelector && ringSizeValue !== null && ringSizeValue !== undefined && ringSizeValue !== '';
    const ringSize = hasRingSize ? (ringSizeValue === 0 ? customRingSize : ringSizeValue) : undefined;

    // A premade SKU has no shape_id; its shape is the center stone's. It is listed only when the product
    // offers several shapes, so single-shape products keep the line they had.
    const premadeShape = centerShapeVariant?.length > 1 ? masterName(jewelryMetadata?.center_shape_id) : undefined;

    return [
      isCustomFlow ? undefined : prefixed('Shape', masterName(jewelryMetadata?.shape_id) ?? premadeShape),
      carat,
      masterName(jewelryMetadata?.custom_stone_id),
      prefixed('Accent Stone', masterName(jewelryMetadata?.accent_diamond_id)),
      prefixed('Accent Stone 2', masterName(jewelryMetadata?.second_accent_diamond_id)),
      prefixed('Length', withUnit(masterName(jewelryMetadata?.bracelet_length_ids), 'inch')),
      prefixed('Width', withUnit(masterName(jewelryMetadata?.band_width_ids), 'mm')),
      prefixed('Ring Size', ringSize ? String(ringSize).trim() : undefined),
    ].filter((value): value is string => Boolean(value && String(value).trim()));
  }, [
    productFilter,
    jewelryMetadata,
    searchParams,
    selectedRingSize,
    selectedRingSizeRedux,
    customRingSize,
    showRingSizeSelector,
    centerShapeVariant,
  ]);

  // Metal types split the way the METAL selector shows them: silver is plated, karat types ("10k") are
  // solid gold. Anything else keeps its own untitled group.
  const isGoldMetalName = (name?: string) => /^\d{1,2}\s*k/i.test(name?.trim() ?? '');
  const selectedMetalTypeName = productFilter?.find((el: any) => el.id === jewelryMetadata?.metal_type_id)?.name?.trim();
  const isGoldMetal = !isSilverMetal && isGoldMetalName(selectedMetalTypeName);
  const selectedMetalColorName = productFilter?.find((el: any) => el.id === jewelryMetadata?.metal_color_id)?.name?.trim();
  // The silver plating is the color name without its own "925 Sterling Silver - " prefix, and the white plating is rhodium.
  const silverPlating = (selectedMetalColorName ?? '')
    .replace(/^\s*925\s*sterling\s*silver\s*-?\s*/i, '')
    .replace(/^white (gold|rhodium) plated$/i, 'Rhodium Plated')
    .trim();
  // Metal of the selected SKU as the title reads it: "10K Solid Rose Gold" / "Rhodium Plated Sterling Silver".
  const titleMetal = isGoldMetal
    ? `${selectedMetalTypeName?.toUpperCase()} Solid ${selectedMetalColorName ?? 'Gold'}`
    : isSilverMetal
      ? `${silverPlating} Sterling Silver`.trim()
      : [selectedMetalTypeName, selectedMetalColorName].filter(Boolean).join(' ');
  const metalGroups = useMemo(() => {
    const groups: { label: string; items: any[] }[] = [
      { label: 'PLATED', items: [] },
      { label: 'SOLID GOLD', items: [] },
      { label: '', items: [] },
    ];
    productVariant?.forEach((item: any) => {
      const master = productFilter?.find((el: any) => el.id === item?.id);
      const isGold = master?.code !== 'SILVER_925' && isGoldMetalName(master?.name);
      // Button text is the metal type master name exactly as the backend returns it.
      groups[master?.code === 'SILVER_925' ? 0 : isGold ? 1 : 2].items.push({ ...item, name: master?.name?.trim() });
    });
    return groups.filter((group) => group.items.length > 0);
  }, [productVariant, productFilter]);

  const productDetailsSection = useMemo(() => {
    // Side (accent) diamond summary grouped by shape, rendered inline inside
    // PRODUCT DETAILS — between the center stone info and the description.
    const backendGroups = product?.sideDiamondDetails ?? (selectedProduct as any)?.sideDiamondDetails;
    const shapeGroups = Array.isArray(backendGroups) ? backendGroups : [];
    const totalSideCaratWeight = Number(product?.totalSideDiamondCaratWeight ?? (selectedProduct as any)?.totalSideDiamondCaratWeight ?? 0);
    const hasSideDiamond = shapeGroups.length > 0 && totalSideCaratWeight > 0;
    const hasExtraTitles = (extraTitles?.length ?? 0) > 0;
    const hasattributesData = (attributesData?.length ?? 0) > 0;
    const hasDescription = Boolean(product?.description && product?.description?.length > 0);

    // Render the section when ANY of its parts has content. Previously the
    // whole block bailed out on missing extra_titles, hiding the description and
    // side-diamond details for products that had those but no extra titles.
    if (!hasExtraTitles && !hasattributesData && !hasSideDiamond && !hasDescription) {
      return null;
    }
    return (
      <div className=" border p-4">
        <div
          className="!cursor-pointer font-medium !text-[#707070] flex items-center justify-between"
          onClick={() => setIsExpandedProductDetails((prev) => !prev)}
        >
          <Text size="textxl" className="!font-light  !cursor-pointer !font-sans !text-[16px]">
            PRODUCT DETAILS
          </Text>
          {isExpandedProductDetails ? (
            <FiMinus className="h-[18px] w-[18px] cursor-pointer" />
          ) : (
            <FiPlus className="h-[18px] w-[18px] cursor-pointer" />
          )}
        </div>
        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpandedProductDetails ? 'max-h-[2500px] opacity-100' : 'max-h-0 opacity-0'}`}
        >
          {hasExtraTitles && (
            <div className="rounded-xl border border-[#dde3d1] mt-3 bg-gradient-to-b from-[#fcfdf9] to-[#f6f8f1] shadow-[0_2px_10px_rgba(24,56,29,0.06)] overflow-hidden">
              {extraTitles.map((item: { id?: string; label: string; value: string }, index: number) => (
                <div
                  key={`${item?.id ?? item?.value}-${index}`}
                  className="grid grid-cols-[minmax(0,1fr)_24px_minmax(0,1fr)] items-center gap-2 px-4 py-2.5 border-b border-[#e5e9db] last:border-b-0 hover:bg-white/80 transition-colors duration-200"
                >
                  <span className="text-[#5f6655] text-[13px] sm:text-[12px] tracking-[0.2px] font-medium capitalize text-left">
                    {(item?.label || 'Detail').toLowerCase()}
                  </span>
                  <span className="text-[#8b927f] text-[14px] text-center">:</span>
                  <span className="text-[#1d1f1b] text-[13px] sm:text-[12px] font-normal text-left leading-5">{item?.value}</span>
                </div>
              ))}
            </div>
          )}
          {hasattributesData && (
            <div className="rounded-xl border border-[#dde3d1] mt-3 bg-gradient-to-b from-[#fcfdf9] to-[#f6f8f1] shadow-[0_2px_10px_rgba(24,56,29,0.06)] overflow-hidden">
              {attributesData.map((item: { id?: string; label: string; value: string }, index: number) => (
                <div
                  key={`${item?.id ?? item?.value}-${index}`}
                  className="grid grid-cols-[minmax(0,1fr)_24px_minmax(0,1fr)] items-center gap-2 px-4 py-2.5 border-b border-[#e5e9db] last:border-b-0 hover:bg-white/80 transition-colors duration-200"
                >
                  <span className="text-[#5f6655] text-[13px] sm:text-[12px] tracking-[0.2px] font-medium capitalize text-left">
                    {(item?.label || 'Detail').toLowerCase()}
                  </span>
                  <span className="text-[#8b927f] text-[14px] text-center">:</span>
                  <span className="text-[#1d1f1b] text-[13px] sm:text-[12px] font-normal text-left leading-5">{item?.value}</span>
                </div>
              ))}
            </div>
          )}
          {hasSideDiamond && (
            <>
              <div className={`border-t border-[#e5e9db] ${hasExtraTitles ? 'mt-5' : 'mt-4'} mb-4`} />
              <div
                className="!cursor-pointer font-medium !text-[#707070] flex items-center justify-between"
                onClick={() => setIsExpandedSideDiamond((prev) => !prev)}
              >
                <Text size="textxl" className="!font-light  !cursor-pointer !font-sans !text-[16px]">
                  SIDE DIAMOND DETAILS
                </Text>
                {isExpandedSideDiamond ? (
                  <FiMinus className="h-[18px] w-[18px] cursor-pointer" />
                ) : (
                  <FiPlus className="h-[18px] w-[18px] cursor-pointer" />
                )}
              </div>
              <div
                className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpandedSideDiamond ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
              >
                {/* Tablet cells use the mobile padding/size: at 810-834px portrait the table was 11-19px
                    wider than this box, hiding half of "Total Carat Weight" behind a sideways scroll. */}
                <div className="rounded-xl border border-[#dde3d1] mt-3 bg-gradient-to-b from-[#fcfdf9] to-[#f6f8f1] shadow-[0_2px_10px_rgba(24,56,29,0.06)] overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-[#eef1e6] text-[#5f6655]">
                        <th className="border-b border-[#e5e9db] px-4 py-2.5 text-[13px] font-medium tracking-[0.2px] sm:px-3 sm:py-2 sm:text-[12px] [@media(min-width:551px)_and_(max-width:1024px)]:px-3 [@media(min-width:551px)_and_(max-width:1024px)]:text-[12px]">
                          Shape
                        </th>
                        <th className="border-b border-[#e5e9db] px-4 py-2.5 text-[13px] font-medium tracking-[0.2px] sm:px-3 sm:py-2 sm:text-[12px] [@media(min-width:551px)_and_(max-width:1024px)]:px-3 [@media(min-width:551px)_and_(max-width:1024px)]:text-[12px]">
                          Color
                        </th>
                        <th className="border-b border-[#e5e9db] px-4 py-2.5 text-[13px] font-medium tracking-[0.2px] sm:px-3 sm:py-2 sm:text-[12px] [@media(min-width:551px)_and_(max-width:1024px)]:px-3 [@media(min-width:551px)_and_(max-width:1024px)]:text-[12px]">
                          Total Carat Weight
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {shapeGroups.map((group: any, index: number) => (
                        <tr key={index} className="text-[#1d1f1b] hover:bg-white/80 transition-colors duration-200">
                          <td className="border-b border-[#e5e9db] px-4 py-2.5 text-[13px] font-normal sm:px-3 sm:py-2 sm:text-[12px] [@media(min-width:551px)_and_(max-width:1024px)]:px-3 [@media(min-width:551px)_and_(max-width:1024px)]:text-[12px]">
                            {group.shapeName}
                          </td>
                          <td className="border-b border-[#e5e9db] px-4 py-2.5 text-[13px] font-normal sm:px-3 sm:py-2 sm:text-[12px] [@media(min-width:551px)_and_(max-width:1024px)]:px-3 [@media(min-width:551px)_and_(max-width:1024px)]:text-[12px]">
                            {group.colorName}
                          </td>
                          <td className="border-b border-[#e5e9db] px-4 py-2.5 text-[13px] font-normal sm:px-3 sm:py-2 sm:text-[12px] [@media(min-width:551px)_and_(max-width:1024px)]:px-3 [@media(min-width:551px)_and_(max-width:1024px)]:text-[12px]">
                            {group.caratWeight}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
          {hasDescription && (
            <>
              <div className={`border-t border-[#e5e9db] ${hasExtraTitles || hasSideDiamond ? 'mt-5' : 'mt-4'} mb-4`} />
              <div
                className="!cursor-pointer font-medium !text-[#707070] flex items-center justify-between"
                onClick={() => setIsExpandedDescription((prev) => !prev)}
              >
                <Text size="textxl" className="!font-light  !cursor-pointer !font-sans !text-[16px]">
                  DESCRIPTION
                </Text>
                {isExpandedDescription ? (
                  <FiMinus className="h-[18px] w-[18px] cursor-pointer" />
                ) : (
                  <FiPlus className="h-[18px] w-[18px] cursor-pointer" />
                )}
              </div>
              <div
                className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpandedDescription ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <div className="rounded-xl border border-[#dde3d1] mt-3 bg-gradient-to-b from-[#fcfdf9] to-[#f6f8f1] shadow-[0_2px_10px_rgba(24,56,29,0.06)] px-5 py-4">
                  <Text
                    size="textlg"
                    className="!font-extralight !font-sans !text-[#3d403a] whitespace-pre-line !text-[15px] !leading-7 tracking-[0.2px]"
                  >
                    {product?.description}
                  </Text>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }, [
    extraTitles,
    attributesData,
    isExpandedProductDetails,
    product?.description,
    isExpandedDescription,
    product?.sideDiamondDetails,
    (selectedProduct as any)?.sideDiamondDetails,
    product?.totalSideDiamondCaratWeight,
    (selectedProduct as any)?.totalSideDiamondCaratWeight,
    isExpandedSideDiamond,
  ]);

  const fetchSuggestion = useCallback(
    (data: any) => {
      if (memoizedSuggestion?.length === 0) {
        dispatch(fetchSuggestedProducts(data));
      }
    },
    [memoizedSuggestion, dispatch],
  );

  // Tracks the variant key (metal_type|metal_color|center_diamond|accent_diamond|second_accent_diamond)
  // across renders so the heavy stone-variant rebuild block only runs when this combination changes.
  const prevVariantKeyRef = useRef<string | null>(null);

  useEffect(() => {
    localStorage.removeItem('checkoutProduct');
    localStorage.removeItem('isDirect');
    dispatch(setShouldLoadList(false));
  }, []);

  useEffect(() => {
    if (!slug) {
      return;
    }
    // Back/forward navigation between different PDPs can leave the previous
    // product in Redux. Re-fetch when the current slug isn't part of the loaded
    // product's jewelry_sku (variant switches keep the same product, so they
    // still hit the cached path).
    const reduxEmpty = Object.keys(selectedProductAllData).length === 0 || !selectedProduct;
    const slugBelongsToLoadedProduct = !reduxEmpty && selectedProduct?.jewelry_sku?.some((sku: any) => (sku?.sku_slug as string) === slug);

    if (slugBelongsToLoadedProduct) {
      return;
    }

    // Cross-product navigation (initial mount / direct URL / browser back/forward).
    // Reset local product state and ring-size selections so the new product starts
    // from a clean slate — otherwise the second effect's `isSameProduct` guard
    // short-circuits state updates. We deliberately KEEP `jewelryMetadataFallbackRef`
    // populated so the model_view iframe stays mounted with the previous src during
    // the fetch — unmounting/remounting an iframe with src adds parent-window
    // history entries (multi-back regression).
    if (!reduxEmpty) {
      dispatch(setSelectedRingSizeId(null));
      dispatch(setSelectedRingSizeRedux(null));
      setProduct(undefined);
      setSelectedProductObject(undefined);
    }
    dispatch(setClearSuggestion());
    dispatch(fetchProductsDetails(slug as string));
    if (typeof window !== 'undefined') {
      // Browser's native scroll restoration runs AFTER React effects on
      // back/forward navigation, so a synchronous scrollTo gets overridden.
      // Defer with double rAF to win the race and force every cross-product
      // navigation (including Back from a "You May Also Like" click) to start
      // at the top of the page.
      const scrollTop = () => window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      scrollTop();
      requestAnimationFrame(() => {
        scrollTop();
        requestAnimationFrame(scrollTop);
      });
    }
  }, [slug]);

  const prevShapeIdRef = useRef<string | null>(null);
  const prevCustomVariantRef = useRef<any>(null);
  useEffect(() => {
    if (!customVariant) {
      return;
    }

    const shapeChanged = prevShapeIdRef.current !== (jewelryMetadata?.shape_id ?? null);
    const variantChanged = prevCustomVariantRef.current !== customVariant;
    prevShapeIdRef.current = jewelryMetadata?.shape_id ?? null;
    prevCustomVariantRef.current = customVariant;

    // Only rebuild shape/carat data when the shape or variant tree actually changed —
    // not on every metal/carat switch which also triggers customVariant update.
    if (!shapeChanged && !variantChanged) {
      return;
    }

    const shapeList = customVariant?.map((shape: any) => shape?.shape_id);
    dispatch(setCustomShapes(shapeList));
    if (jewelryMetadata?.shape_id) {
      const selectedShape = customVariant.find((shape: any) => shape?.shape_id === jewelryMetadata.shape_id);
      const carateList = customVariant?.find((shape: any) => shape?.shape_id === jewelryMetadata?.shape_id)?.carats?.map((el: any) => el?.carat_id);
      const diamondColorList = selectedShape?.carats?.find((shape: any) => shape?.carat_id === jewelryMetadata.carat_id)?.colors;
      dispatch(setSelectedShapesData(jewelryMetadata?.shape_id));
      dispatch(setCustomCarats(carateList));
      setCaratsData(selectedShape?.carats);
      setDiamondColorData(diamondColorList);
      dispatch(setSelectedCaratsData([carateList?.[0], carateList?.[carateList?.length - 1]]));
    }
  }, [customVariant, jewelryMetadata?.shape_id]);

  useEffect(() => {
    if (!selectedProduct || !selectedProductAllData) {
      return;
    }
    const data = {
      jewelry_subtype: selectedProduct?.subtype,
      jewelry_type: selectedProduct?.subType?.jewelry_type?.id,
      jewelry_id: selectedProduct?.jewelry_id,
    };
    if (suggestion?.length === 0) {
      fetchSuggestion(data);
      // dispatch(fetchSuggestedProducts(data));
    }
    setProduct(selectedProduct);
    if (searchParams?.get('id')) {
      dispatch(setSelectedSettingStore(selectedProductAllData));
    }
    const productObject = selectedProduct?.jewelry_sku?.find((el: any) => el.sku_slug === slug);
    // If no productObject is found, dispatch fetchProductsDetails
    // const fetchProduct1 = async () => {
    //   try {
    //     console.log('resultAction');
    //     // await dispatch(fetchProductsDetails(slug as string)).unwrap(); // await it
    //     const resultAction = await dispatch(fetchProductsDetails(slug)).unwrap();
    //     console.log(resultAction, 'resultAction2');
    //     // unwrapResult(resultAction);
    //   } catch (error) {
    //     console.error('Error in fetchProduct:', error); // Add this
    //     router.replace('/'); // Redirect or fallback
    //   }
    // };

    if (!productObject) {
      // Only fetch if this is genuinely a different product (e.g. direct URL navigation).
      // When switching variants (metal, carat, color) on the SAME product, the slug changes
      // but the product data is already loaded. Re-fetching causes the lower half to flash
      // loading skeletons unnecessarily.
      const isSameProduct = selectedProduct?.jewelry_id === product?.jewelry_id;
      if (!isSameProduct) {
        dispatch(fetchProductsDetails(slug as string));
      }
      // Keep existing UI state stable — don't set selectedProductObject to undefined
      return;
    }

    setSelectedProductObject(productObject);
    const metalColor = productFilter?.find((el: any) => el.id === productObject?.metal_color_id)?.code;
    const metalType = productFilter?.find((el: any) => el.id === productObject?.metal_type_id)?.code;
    setProductSKU({ metalColor, metalType });
    setSelectedJewelryType(selectedProduct?.subType?.jewelry_type?.name?.toLowerCase().replace(/\s+/g, '-'));

    // Track the variant-key — the heavy stone-variant rebuild below only needs to run
    // when metal/color/diamond combination changes. Ring-size-only changes and
    // carat-only changes on the same metal/color don't need to rebuild the stone trees.
    const variantKey = [
      productObject?.metal_type_id,
      productObject?.metal_color_id,
      // Without the shape here a shape-only switch is treated as "nothing changed", so the colour
      // and carat rows would keep showing the previous shape's options.
      productObject?.center_shape_id,
      productObject?.center_diamond_id,
      productObject?.accent_diamond_id,
      productObject?.second_accent_diamond_id,
    ].join('|');
    const skipStoneVariantRebuild = prevVariantKeyRef.current === variantKey;
    prevVariantKeyRef.current = variantKey;

    if (!skipStoneVariantRebuild && selectedProductVariation && productObject?.center_diamond_id) {
      const metalTypeVariant = selectedProductVariation.find((item: any) => item.id === productObject.metal_type_id);
      const metalColorVariant = metalTypeVariant?.metal_color_id?.find((item: any) => item.id === productObject.metal_color_id);

      // Safe fallback lists
      const allCenterStones = metalColorVariant?.center_stone_id ?? [];
      // A product may carry several center shapes. The colour and carat rows must only offer what
      // exists under the shape being shown, otherwise the same colour appears once per shape.
      const centerStoneList = productObject?.center_shape_id
        ? allCenterStones.filter((item: any) => item.shape === productObject.center_shape_id)
        : allCenterStones;
      const centerStoneOnly = centerStoneList.find((item: any) => item.color?.[0]?.id == productObject.center_diamond_id) ?? centerStoneList?.[0];

      const accentOneList =
        centerStoneList.find((item: any) => item.color?.[0]?.id === productObject.center_diamond_id)?.accent_stone_id ??
        centerStoneOnly?.accent_stone_id ??
        [];

      const accentTwoList =
        accentOneList.find((item: any) => item.color?.[0]?.id === productObject.accent_diamond_id)?.accent_diamond_two ??
        accentOneList?.[0]?.accent_diamond_two ??
        [];

      // New rule: choose sizes depending on stone presence
      const findOnlyAccentOne = accentOneList?.find((el: any) => el.accent_diamond_two.length === 0);
      const findAccentOneWithAccentTwo = accentOneList?.find((el: any) => el.accent_diamond_two.length !== 0);

      const premadeCaratsList = productObject.accent_diamond_id
        ? productObject.second_accent_diamond_id
          ? findAccentOneWithAccentTwo?.accent_diamond_two?.[0]?.color?.[0]?.sizes
          : findOnlyAccentOne?.color?.[0]?.sizes
        : centerStoneOnly?.color?.[0]?.sizes;

      const preMadeBraceletLengthList = productObject.accent_diamond_id
        ? productObject.second_accent_diamond_id
          ? findAccentOneWithAccentTwo?.accent_diamond_two?.[0]?.color?.[0]?.sizes?.[0]?.bracelet_length_ids
          : findOnlyAccentOne?.color?.[0]?.sizes?.[0]?.bracelet_length_ids
        : centerStoneOnly?.color?.[0]?.sizes?.[0]?.bracelet_length_ids;

      const preMadeBandWidthList = productObject.accent_diamond_id
        ? productObject.second_accent_diamond_id
          ? findAccentOneWithAccentTwo?.accent_diamond_two?.[0]?.color?.[0]?.sizes?.[0]?.band_width_ids
          : findOnlyAccentOne?.color?.[0]?.sizes?.[0]?.band_width_ids
        : centerStoneOnly?.color?.[0]?.sizes?.[0]?.band_width_ids;

      setPreMadeCarats(premadeCaratsList?.map((el: any) => el.weight));
      setPreMadeBraceletLength(preMadeBraceletLengthList);
      setPreMadeBandWidth(preMadeBandWidthList);
      // Rebuilt on every stone-variant change rather than only once: the list is scoped to the
      // shape being shown, so it has to follow a shape switch.
      setCenterStoneVariant(centerStoneList?.map((item: any) => ({ color: item.color?.[0], sku_slug: item.sku_slug })));
      // Every distinct center shape of this metal colour, for the shape swatches.
      setCenterShapeVariant(
        _.uniqBy(
          (allCenterStones || []).filter((item: any) => item?.shape),
          'shape',
        ).map((item: any) => ({ shape: item.shape, sku_slug: item.sku_slug })),
      );

      setAccentOneStoneVariant(accentOneList?.map((item: any) => ({ color: item.color?.[0], sku_slug: item.sku_slug })));

      setAccentTwoStoneVariant(accentTwoList?.map((item: any) => ({ color: item.color?.[0], sku_slug: item.sku_slug })));

      setCustomVariants(metalColorVariant?.customization_options);
    }
    if (!skipStoneVariantRebuild && selectedProductVariation && !productObject?.center_diamond_id) {
      const metalTypeVariant = selectedProductVariation.find((item: any) => item.id === productObject?.metal_type_id);
      const metalColorVariant = metalTypeVariant?.metal_color_id?.find((item: any) => item.id === productObject.metal_color_id);

      const accentOneList = metalColorVariant?.accent_stone_id ?? [];
      const accentTwoList =
        accentOneList.find((item: any) => item?.color?.[0]?.id === selectedProductObject?.accent_diamond_id)?.accent_diamond_two ??
        accentOneList?.[0]?.accent_diamond_two ??
        [];

      const premadeCaratsList = selectedProductObject?.second_accent_diamond_id
        ? accentOneList?.[0]?.accent_diamond_two?.[0].color?.[0]?.sizes
        : accentOneList?.[0]?.color?.[0]?.sizes;

      const findOnlyAccentOne = accentOneList?.find((el: any) => el.accent_diamond_two.length == 0);
      const preMadeBraceletLengthList = selectedProductObject?.second_accent_diamond_id
        ? accentOneList?.[0]?.accent_diamond_two?.[0]?.color?.[0]?.bracelet_length_ids
        : findOnlyAccentOne?.color?.[0]?.bracelet_length_ids;
      const preMadeBandWidthList = selectedProductObject?.second_accent_diamond_id
        ? accentOneList?.[0]?.accent_diamond_two?.[0]?.color?.[0]?.band_width_ids
        : findOnlyAccentOne?.color?.[0]?.band_width_ids;

      if (!productObject?.accent_diamond_id) {
        setPreMadeBraceletLength(metalColorVariant?.bracelet_length_ids);
        setPreMadeBandWidth(metalColorVariant?.band_width_ids);
      } else {
        setPreMadeBraceletLength(preMadeBraceletLengthList);
        setPreMadeBandWidth(preMadeBandWidthList);
      }

      setPreMadeCarats(premadeCaratsList?.map((el: any) => el.weight));
      setAccentOneStoneVariant(accentOneList?.map((item: any) => ({ color: item.color?.[0], sku_slug: item?.sku_slug })));
      setAccentTwoStoneVariant(accentTwoList?.map((item: any) => ({ color: item.color?.[0], sku_slug: item?.sku_slug })));
      setCustomVariants(metalColorVariant?.customization_options);
    }
    if (selectedProductVariation) {
      setProductVariant(selectedProductVariation);
    }
    // changing ringSizeMasterData to --> defaultRingSize
    if (isRingSizeType) {
      if (!selectedRingSizeId) {
        if (defaultRingSize?.length > 0) {
          if (searchParams?.get('id')) {
            dispatch(setSelectedRingSize(Number(defaultRingSize?.[0]?.name)));
          } else {
            dispatch(setSelectedRingSizeRedux(Number(defaultRingSize?.[0]?.name)));
          }
          dispatch(setSelectedRingSizeId(defaultRingSize?.[0]?.id));
          setProductPrice(getPriceViaRingAndMetal(defaultRingSize?.[0]?.id, selectedProductObject?.metal_type_id));
        } else {
          if (searchParams?.get('id')) {
            dispatch(setSelectedRingSize(null));
          } else {
            dispatch(setSelectedRingSizeRedux(null));
          }
          dispatch(setSelectedRingSizeId(null));
          setProductPrice(getPriceViaRingAndMetal(null, selectedProductObject?.metal_type_id));
        }
      } else {
        if (searchParams?.get('id')) {
          dispatch(setSelectedRingSize(Number(ringSizeMasterData?.find((el: any) => el?.id == selectedRingSizeId)?.name)));
        } else {
          dispatch(setSelectedRingSizeRedux(Number(ringSizeMasterData?.find((el: any) => el?.id == selectedRingSizeId)?.name)));
        }
        setProductPrice(getPriceViaRingAndMetal(selectedRingSizeId, selectedProductObject?.metal_type_id));
      }
    }
    // NOTE: selectedProductObject is intentionally excluded — it is SET inside this effect.
    // Including it would create a circular dependency (effect fires → sets state → dep changes → fires again).
  }, [selectedProduct, selectedProductVariation, slug, selectedRingSizeId]);

  const prevMetalLabelKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!product?.jewelry_id) {
      return;
    }

    // Derivation depends only on metalType + metal_type_id + metal_color_id.
    // Skip the O(n) filter/find chain entirely when none of these changed —
    // other selectedProductObject mutations (carat, shape) shouldn't trigger this.
    const metalType = productSKU?.metalType;
    const metalTypeId = selectedProductObject?.metal_type_id ?? null;
    const metalColorId = selectedProductObject?.metal_color_id ?? null;
    const key = `${metalType}|${metalTypeId}|${metalColorId}`;
    if (prevMetalLabelKeyRef.current === key) {
      return;
    }
    prevMetalLabelKeyRef.current = key;

    const selectedMetal = productFilter?.find((obj) => obj.code === metalType);
    const selectedMetalVariant = productVariant?.find((item: any) => item.id === metalTypeId);

    const selectedJewelryMetalType = productFilter?.filter((color: any) =>
      selectedMetalVariant?.metal_color_id?.map((el: any) => el.id).includes(color.id),
    );

    const currentMetalColor = selectedJewelryMetalType?.find((color: any) => color.id === metalColorId);

    setSelectedMetalType({ name: selectedMetal?.name, id: selectedMetal?.id });
    setSelectedMetalColor(currentMetalColor?.name?.replace(' ', '-'));
  }, [slug, product?.jewelry_id, productFilter, selectedProductObject]);

  const prevWishlistSkuIdRef = useRef<string | null>(null);
  useEffect(() => {
    // Only re-check wishlist when the actual SKU changes — not on every
    // selectedProductObject reference change from other variant switches.
    const currentSkuId = selectedProductObject?.id ?? null;
    if (prevWishlistSkuIdRef.current === currentSkuId) {
      return;
    }
    prevWishlistSkuIdRef.current = currentSkuId;

    if (selectedProductObject?.wishlist_id) {
      setWishlist(true);
      setWid(selectedProductObject?.wishlist_id);
    } else if (!user) {
      const typeIndex = wishlistProducts.findIndex((item: any) => item.name === product?.subType?.jewelry_type?.name);
      if (typeIndex > -1) {
        const productIndex = wishlistProducts[typeIndex].jewelry.findIndex((item: any) => item.sku_master_id === currentSkuId);
        setWishlist(productIndex > -1);
      }
    }
  }, [selectedProductObject, selectedProductObject?.wishlist_id]);

  // Track previous values so we only update price when something actually changed —
  // not on every re-render caused by the cascading useEffect chain.
  const prevRingSizeIdRef = useRef<string | null>(null);
  const prevMetalTypeIdRef = useRef<string | null>(null);
  useEffect(() => {
    const currentRingSize = selectedRingSizeId ?? null;
    const currentMetalType = selectedProductObject?.metal_type_id ?? jewelryMetadata?.metal_type_id ?? null;

    const ringSizeChanged = prevRingSizeIdRef.current !== currentRingSize;
    const metalChanged = prevMetalTypeIdRef.current !== currentMetalType;

    // Only update when ring size or metal actually changed — prevents duplicate
    // setProductPrice calls (the big useEffect at line 632 also sets price on
    // initial load / product switch; this effect handles subsequent changes only).
    if (!ringSizeChanged && !metalChanged) {
      return;
    }
    prevRingSizeIdRef.current = currentRingSize;
    prevMetalTypeIdRef.current = currentMetalType;

    if (currentRingSize) {
      setProductPrice(getPriceViaRingAndMetal(currentRingSize, currentMetalType));
    }
    if (searchParams?.get('id')) {
      dispatch(setSelectedSettingSkuData(jewelryMetadata));
      dispatch(setSelectedSettingRingPrice(getPriceViaRingAndMetal(currentRingSize, currentMetalType)));
    }
  }, [jewelryMetadata, selectedRingSizeId, selectedProductObject?.metal_type_id]);

  const prevJewelryIdRef = useRef<string | null>(null);
  const prevSwiperDataKeyRef = useRef<string | null>(null);
  const prevVideoOneRef = useRef<string | null>(null);
  const prevVideoTwoRef = useRef<string | null>(null);
  useEffect(() => {
    if (!jewelryMetadata?.carat_images) {
      return;
    }

    const currentJewelryId = jewelryMetadata?.jewelry_id ?? product?.id;
    const isSameProduct = prevJewelryIdRef.current === currentJewelryId;

    // Build the full slider URL set up-front so we can skip the entire effect if
    // the URLs haven't actually changed (preserves iOS memory — no image/video reload).
    const sliderArray = [...jewelryMetadata.carat_images];
    const has360 = jewelryMetadata?.model_view && 'https://' == jewelryMetadata.model_view.slice(0, 8);
    if (has360) {
      sliderArray.unshift(jewelryMetadata.model_view);
    }

    const videoOneUrl = jewelryMetadata?.carat_video?.[0] ?? null;
    const videoTwoUrl = jewelryMetadata?.carat_video?.[1] ?? null;

    let nextSwiperData: any[];
    if (jewelryMetadata?.carat_video?.length > 0) {
      nextSwiperData = [sliderArray[0], videoOneUrl, ...jewelryMetadata.carat_images];
      if (videoTwoUrl) {
        nextSwiperData.push(videoTwoUrl);
      }
    } else {
      // Keep the natural image order. The mobile slider defaults to the "-2" image by
      // selecting it in place (see the slideTo effect below) rather than reordering it
      // to the front — so its thumbnail stays in its original position instead of
      // becoming the first card.
      nextSwiperData = sliderArray.length === 0 ? ['/images/no_images.svg'] : [...sliderArray];
    }

    // Stable URL-based key — if every URL in the swiper matches the previous set,
    // skip ALL state updates. This is the primary iOS memory optimization: metal
    // swaps that produce identical image sets won't force Swiper/video re-downloads.
    const swiperDataKey = nextSwiperData.join('|');
    if (isSameProduct && prevSwiperDataKeyRef.current === swiperDataKey) {
      return;
    }
    prevJewelryIdRef.current = currentJewelryId;
    prevSwiperDataKeyRef.current = swiperDataKey;

    if (has360) {
      setIs360(true);
    }

    // Only touch video state when URLs actually differ — prevents iOS from tearing
    // down and re-downloading video elements on metal changes that share videos.
    if (videoOneUrl && prevVideoOneRef.current !== videoOneUrl) {
      setVideoOne(videoOneUrl);
      setIsVideo(true);
      prevVideoOneRef.current = videoOneUrl;
    }
    if (videoTwoUrl && prevVideoTwoRef.current !== videoTwoUrl) {
      setVideoTwo(videoTwoUrl);
      setIsVideo2(true);
      prevVideoTwoRef.current = videoTwoUrl;
    }

    setSwiperData(nextSwiperData);
    setImageComponent([...(jewelryMetadata?.carat_video ?? []), ...sliderArray]);
  }, [jewelryMetadata]);

  // Mobile view: default the product slider to the "-2" product image (filename
  // ending in `-2`, e.g. `W-2.jpg`) when the PDP opens — even when the first slide
  // is a 360 view or video (those must stay at index 0, so we select the "-2" slide
  // in place instead of reordering). Desktop uses a separate slider above and is
  // left untouched. Applied once per product; a manual swipe afterwards is not
  // overridden because the guard blocks re-running for the same product.
  useEffect(() => {
    if (isDesktopViewport) {
      return; // mobile only
    }
    if (!swiperData || swiperData.length < 2) {
      return;
    }
    const caratImages: string[] = jewelryMetadata?.carat_images ?? [];
    // Prefer the image whose filename ends in `-2` (before the extension); fall back
    // to the positional second image if no such filename exists.
    const secondImage = caratImages.find((img) => /-2\.[a-z0-9]+(\?.*)?$/i.test(img)) ?? caratImages[1];
    if (!secondImage) {
      return;
    }
    const targetIndex = swiperData.indexOf(secondImage);
    if (targetIndex < 1) {
      return;
    }
    const productKey = (jewelryMetadata?.sku_slug as string) ?? slug;
    if (mobileSecondImageAppliedRef.current === productKey) {
      return;
    }

    // Swiper registers newly-added slides asynchronously (observer), so a single
    // slideTo right after swiperData updates can run before the target slide exists
    // and get clamped. Retry across a few animation frames until the slide is
    // available, then jump to it (no animation).
    let rafId: number;
    let attempts = 0;
    const applySelection = () => {
      const sw = mobileSwiperRef.current;
      if (!sw || sw.destroyed) {
        if (attempts++ < 20) {
          rafId = requestAnimationFrame(applySelection);
        }
        return;
      }
      sw.update();
      const slideCount = sw.slides?.length ?? 0;
      if (slideCount <= targetIndex && attempts++ < 20) {
        rafId = requestAnimationFrame(applySelection);
        return;
      }
      if (sw.params?.loop) {
        sw.slideToLoop(targetIndex, 0);
      } else {
        sw.slideTo(targetIndex, 0);
      }
      mobileSecondImageAppliedRef.current = productKey;
    };
    rafId = requestAnimationFrame(applySelection);
    return () => cancelAnimationFrame(rafId);
  }, [swiperData, isDesktopViewport, jewelryMetadata, slug]);

  // Mobile slides that are plain images (same index rules as the slide render below:
  // 360 at 0, video one at 1, video two last). Deduped because the video layout repeats
  // the first image.
  const mobileZoomImages = useMemo<string[]>(() => {
    if (!swiperData) {
      return [];
    }
    const images = swiperData.filter(
      (d: any, index: number) =>
        typeof d === 'string' &&
        d !== '/images/no_images.svg' &&
        !(index === 0 && is360) &&
        !(isVideo && index === 1) &&
        !(isVideo2 && index === swiperData.length - 1),
    );
    return Array.from(new Set<string>(images));
  }, [swiperData, is360, isVideo, isVideo2]);

  const openMobileZoom = (src: string) => {
    const current = mobileZoomImages.indexOf(src);
    if (current < 0) {
      return;
    }
    // Drop any inline pinch so the gallery sits at 1x behind the viewer.
    mobileSwiperRef.current?.zoom?.out();
    setMobileZoom({ open: true, current });
  };

  const closeMobileZoom = () => {
    // Leave the gallery on the image the shopper ended on inside the viewer.
    const target = swiperData?.indexOf(mobileZoomImages[mobileZoom.current]) ?? -1;
    const sw = mobileSwiperRef.current;
    if (target >= 0 && sw && !sw.destroyed) {
      if (sw.params?.loop) {
        sw.slideToLoop(target, 0);
      } else {
        sw.slideTo(target, 0);
      }
    }
    setMobileZoom((prev) => ({ ...prev, open: false }));
  };

  // The zoom viewer has to re-enable pointer events on its image (the global `img` rule
  // blocks them, which kills pinch/drag), so block the long-press save menu there instead.
  useEffect(() => {
    if (!mobileZoom.open) {
      return;
    }
    const blockContextMenu = (e: Event) => {
      if ((e.target as HTMLElement)?.closest?.('.pdp-mobile-zoom')) {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', blockContextMenu);
    return () => document.removeEventListener('contextmenu', blockContextMenu);
  }, [mobileZoom.open]);

  const viewContentTracked = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedProductObject || !selectedProductAllData?.product_details || !slug) {
      return;
    }
    const contentId = selectedProductObject?.id ?? jewelryMetadata?.id;
    if (!contentId || viewContentTracked.current === slug) {
      return;
    }
    viewContentTracked.current = slug;
    const price = selectedProductObject?.discounted_price ?? selectedProductObject?.selling_price ?? 0;
    const contentName = selectedProductAllData?.product_details?.title ?? selectedProduct?.title ?? '';
    trackViewContent({
      content_ids: [String(contentId)],
      content_type: 'product',
      content_name: contentName,
      value: Number(price),
      currency: 'USD',
    });
    // GA4 view_item
    const ga4Item = ga4.buildProductItem({
      item_id: contentId,
      item_name: contentName,
      price: Number(price),
      quantity: 1,
      item_category: product?.subType?.jewelry_type?.name,
      item_variant: jewelryMetadata?.metal_type_id,
    });
    ga4.viewItem({ items: [ga4Item], value: Number(price) });

    // Klaviyo — identify first so `Viewed Product` attaches to a known profile. Without this
    // only visitors Klaviyo already cookied (email click / form signup) can be reached by the
    // Browse Abandonment flow.
    if (user?.email) {
      klaviyo.identify({
        email: user.email,
        firstName: user?.first_name,
        lastName: user?.last_name,
      });
    }
    const sellingPrice = Number(selectedProductObject?.selling_price ?? 0);
    klaviyo.trackViewedProduct({
      productId: String(contentId),
      productName: contentName,
      sku: selectedProductObject?.sku_code ?? jewelryMetadata?.sku_code,
      categories: product?.subType?.jewelry_type?.name ? [product.subType.jewelry_type.name] : [],
      imageUrl: selectedProductObject?.carat_images?.[0] ?? jewelryMetadata?.carat_images?.[0],
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      brand: 'Ashclair',
      price: Number(price),
      // Only a genuine markdown — otherwise Klaviyo renders a struck-through equal price.
      compareAtPrice: sellingPrice > Number(price) ? sellingPrice : undefined,
    });
  }, [slug, selectedProductObject, selectedProductAllData, jewelryMetadata, selectedProduct, product, user]);

  const handleAddToWishlist = async () => {
    const payload = {
      jewelry_id: product?.jewelry_id as string,
      sku_master_id: selectedProductObject?.id as string,
      slug: slug as string,
      productDescription: product?.description,
      productPrice: selectedProductObject?.selling_price,
      productName: product?.title,
      productHoverImage: (selectedProductObject?.carat_images[1] as string) ?? '/images/no_images.svg',
      productImage: (selectedProductObject?.carat_images[0] as string) ?? '/images/no_images.svg',
      isWishlist: selectedProductObject?.wishlist_id ?? 'true',
      jewelry_type: product?.subType?.jewelry_type?.name as string,
      discounted_price: selectedProductObject?.discounted_price,
      discount_type: selectedProductObject?.discount_type,
      discount_value: selectedProductObject?.discount_value,
      jewelryDetails: jewelryMetadata,
      // variation_to_show,
      // variation_details,
      // jewelryTypeData,
      // specialProductTitles,
      // handling_days,
      // ring_size_id,
      // is_customizable,
      // isStatic,
      // productVariation,
      // stackable_image,
      // estimated_delivery_days,
      // metal_type_id,
      // is_stackable,
    };

    // Retrieve cart data from local storage
    const wishlistData = localStorage.getItem('wishListItems');
    const existingWishlist: { name: string; jewelry: (typeof payload)[] }[] = wishlistData ? JSON.parse(wishlistData) : [];

    if (user) {
      if (wId) {
        const response: any = await apiDeleteFromWishList([wId]);

        if (response) {
          setWid(null);
          dispatch(fetchWishListProducts('all'));
          setWishlist(false);
        }
        if (response?.data?.status === 200 || response?.data?.status === 201) {
          setWishlist(true);
          const updatedProductIndex = product?.jewelry_sku?.findIndex((item: any) => item?.sku_slug === slug);
          if (updatedProductIndex !== undefined && updatedProductIndex > -1) {
            const jewelry_skuProducts: any = [...product?.jewelry_sku];
            const updatedJewelryDetails = {
              ...jewelry_skuProducts?.[updatedProductIndex],
              wishlist_id: null,
            };
            setSelectedProductObject({
              ...selectedProductObject,
              wishlist_id: null,
            });
            const updatedJewelryProducts = jewelry_skuProducts.splice(updatedProductIndex, 1, updatedJewelryDetails);
            const updateProductDetails = {
              ...product,
              jewelry_sku: updatedJewelryProducts,
            };
            dispatch(setSelectedProductsDetails(updateProductDetails));
          }
        }
      } else {
        const response: any = await apiAddToWishList([
          {
            jewelry_id: payload.jewelry_id,
            sku_master_id: payload.sku_master_id,
          },
        ]);
        const data = response.data.data?.[0];
        if (response?.data?.status === 200 || response?.data?.status === 201) {
          setWishlist(true);
          const price = selectedProductObject?.discounted_price ?? selectedProductObject?.selling_price ?? 0;
          trackAddToWishlist({
            content_ids: [String(selectedProductObject?.id ?? payload.sku_master_id)],
            value: Number(price),
            currency: 'USD',
          });
          const updatedProductIndex = product?.jewelry_sku?.findIndex((item: any) => item?.id === data?.sku_master_id);
          if (updatedProductIndex !== undefined && updatedProductIndex > -1) {
            const jewelry_skuProducts: any = [...product?.jewelry_sku];
            const updatedJewelryDetails = {
              ...jewelry_skuProducts?.[updatedProductIndex],
              wishlist_id: data?.id,
            };
            setSelectedProductObject({
              ...selectedProductObject,
              wishlist_id: data?.id,
            });
            const updatedJewelryProducts = jewelry_skuProducts.splice(updatedProductIndex, 1, updatedJewelryDetails);
            const updateProductDetails = {
              ...product,
              jewelry_sku: updatedJewelryProducts,
            };
            dispatch(setSelectedProductsDetails(updateProductDetails));
            dispatch(fetchWishListProducts('all'));
          }
        }
      }
    } else {
      const typeIndex = existingWishlist.findIndex((item) => item.name === product?.subType?.jewelry_type?.name);

      if (typeIndex > -1) {
        const productIndex = existingWishlist[typeIndex].jewelry.findIndex((item) => item.sku_master_id === selectedProductObject?.id);

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
          const price = selectedProductObject?.discounted_price ?? selectedProductObject?.selling_price ?? 0;
          trackAddToWishlist({
            content_ids: [String(selectedProductObject?.id ?? payload.sku_master_id)],
            value: Number(price),
            currency: 'USD',
          });
        }
      } else {
        existingWishlist.push({
          name: product?.subType?.jewelry_type?.name as string,
          jewelry: [payload],
        });
        const price = selectedProductObject?.discounted_price ?? selectedProductObject?.selling_price ?? 0;
        trackAddToWishlist({
          content_ids: [String(selectedProductObject?.id ?? payload.sku_master_id)],
          value: Number(price),
          currency: 'USD',
        });
      }
      localStorage.setItem('wishListItems', JSON.stringify(existingWishlist));
      dispatch(setWishlistProducts(existingWishlist));
    }
  };

  const changeRouterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const changeRouter = useCallback(
    (name: string) => {
      if (changeRouterTimerRef.current) {
        clearTimeout(changeRouterTimerRef.current);
      }
      changeRouterTimerRef.current = setTimeout(() => {
        // Every variant switch (metal / colour / carat / shape / ring size) rebuilds the URL
        // around the new slug, which would drop the breadcrumb's filter crumbs — carry them.
        const url = carryForwardFilterCrumb(`/${name}`, searchParams);
        if (new URL(url, window.location.origin).pathname === window.location.pathname) {
          // Same page, new variant: every SKU of the product is already loaded, so only the URL
          // changes. Next.js syncs native history updates into useSearchParams, and skipping
          // router.replace avoids a server render (and its product metadata fetch). Anything the
          // server renders from `slug` (e.g. future JSON-LD) would stay on the first variant here.
          window.history.replaceState(null, '', url);
        } else {
          // Different route (e.g. another [jewelryType] segment): navigate normally.
          startTransition(() => {
            router.replace(url, { scroll: false });
          });
        }
        changeRouterTimerRef.current = null;
      }, 400);
    },
    [router, searchParams],
  );

  const handleAppraisalChange = (e: any) => {
    setIsAppraisalSelected(e.target.checked); // Update state based on checkbox selection
    if (e.target.checked) {
      dispatch(setSelectedAppraisal(appraisalData));
    } else {
      dispatch(setSelectedAppraisal(null));
    }
  };
  const handleCheckboxChange = (e: any) => {
    const checked = e.target.checked;
    setIsChecked(checked);

    if (!checked) {
      setSelectedYear(null); // reset on uncheck
      setSelectedYearValue(null);
      dispatch(setSelectedWarranty(null));
    } else if (!selectedYear && warrantyData?.yearPriceList?.length > 0) {
      // Set first radio as default if none selected
      const first = warrantyData.yearPriceList[0];
      setSelectedYear(first.year);
      setSelectedYearValue(first);
      dispatch(
        setSelectedWarranty({
          warrantyName: warrantyData?.warrantyName,
          yearPrice: first,
        }),
      );
    }
  };

  // Fallback for when the server-side redirect in page.tsx could not run. Checking
  // `loadedSlug === slug` ignores the previous payload while a newly picked variation loads.
  const isRetiredSlug = Boolean(redirectToSlug) && loadedSlug === slug && redirectToSlug !== slug;
  const productGoneTarget = redirectToCategory && loadedSlug === slug ? `/${redirectToCategory}` : null;

  // A visitor arriving from outside the site has no product in the store yet: show the
  // loader until the fetch for this slug has settled.
  const hasNoProductYet = Object.keys(selectedProductAllData ?? {}).length === 0 || !selectedProduct;
  const isInitialProductLoad = hasNoProductYet && loadedSlug !== slug;

  useEffect(() => {
    if (productGoneTarget) {
      router.replace(productGoneTarget);
    }
  }, [productGoneTarget]);

  useEffect(() => {
    if (!isRetiredSlug) {
      return;
    }
    const nextQuery = new URLSearchParams(searchParams?.toString() ?? '');
    nextQuery.set('slug', redirectToSlug as string);
    router.replace(`${pathname}?${nextQuery.toString()}`);
  }, [isRetiredSlug, redirectToSlug, pathname]);

  const handleRadioChange = (e: any) => {
    const selected = warrantyData?.yearPriceList?.find((item: any) => item.year === e.target.value);
    setSelectedYearValue(selected);
    setSelectedYear(e.target.value);
    dispatch(
      setSelectedWarranty({
        warrantyName: warrantyData?.warrantyName,
        yearPrice: selected,
      }),
    );
  };

  if (isRetiredSlug || isInitialProductLoad || productGoneTarget) {
    return (
      // Full-screen so the layout's header and footer do not frame the loader.
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
        <LuLoader className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container-xs 2xl:px-[50px] xl:px-[50px] lg:px-[30px] md:px-5 sm:px-3">
      <div
        className={`flex relative ${
          searchParams?.get('id') ? '' : 'pb-0'
        } sm:pt-0 sm:pb-0 items-start gap-8 lg:gap-[16px] md:gap-[20px] lg:items-start 2xl:items-start sm:flex-col sm:gap-0`}
      >
        <div className="grid h-full 2xl:w-full lg:w-2/3 sm:w-full flex-1 grid-cols-1 gap-6 2xl:gap-3 lg:gap-[16px] 2xl:h-fit xl:h-auto lg:grid-cols-1 md:grid-cols-1 sm:flex sm:flex-col xl:grid-cols-1 sm:!gap-0 pb-5 sm:pb-0">
          <div className="mt-2 lg:mt-1 sm:mt-1">
            <div className="flex justify-end pb-2 sm:pb-1 sm:pr-1">
              {jewelryMetadata ? <ShareButton /> : <Skeleton.Input active={true} size="small" style={{ width: 90, minWidth: 90, height: 20 }} />}
            </div>
            <div className="grid h-fit 2xl:w-full lg:w-full sm:w-full flex-1 grid-cols-2 gap-[5px] lg:gap-[8px] 2xl:h-fit xl:h-auto lg:grid-cols-2 md:grid-cols-1 sm:hidden xl:grid-cols-2">
              <Suspense fallback={<div>Loading feed...</div>}>
                {isDesktopViewport && jewelryMetadata?.model_view && (
                  <div className="relative !aspect-square h-auto w-full xl:h-auto lg:h-auto sm:hidden">
                    <iframe
                      key={jewelryMetadata?.model_view}
                      title="scene"
                      frameBorder="0"
                      allowFullScreen={true}
                      allow="autoplay; fullscreen; xr-spatial-tracking; web-share"
                      className="w-full border-none"
                      style={{
                        aspectRatio: '1 / 1',
                      }}
                      src={jewelryMetadata?.model_view}
                    />
                    <div className="w-[8%] absolute bottom-2 right-3 z-[19] flex items-center select-none">
                      <Image src="/images/viewIcon.svg" alt="360-view" preview={false} className="!w-[100%] select-none" />
                    </div>
                  </div>
                )}
                {jewelryMetadata && jewelryMetadata?.carat_video?.length > 0 && (
                  <>
                    {/* <video autoPlay muted loop>
                  <source src={jewelryMetadata?.carat_video?.[0]} type="video/mp4" />
                  Your browser does not support the video tag.
                </video> */}
                    <ProtectedVideo
                      src={jewelryMetadata?.carat_video?.[0]}
                      autoPlay={true}
                      muted={true}
                      loop={true}
                      className="w-full h-full object-cover"
                    />
                  </>
                )}
                {jewelryMetadata ? (
                  jewelryMetadata?.carat_images?.length > 0 ? (
                    jewelryMetadata?.carat_images?.map((d: any, index: number) => {
                      return <ImageZoom key={index} src={d} alt="Product image" zoom="200" className="!aspect-square sm:hidden" />;
                    })
                  ) : (
                    <>
                      <Image
                        src="/images/ashclair_pdp_logo_image.svg"
                        alt="PDP1"
                        preview={false}
                        className="sm:hidden"
                        style={{
                          borderRadius: '0px',
                          width: '100%',
                          height: '100%',
                          aspectRatio: '1 / 1',
                          backgroundColor: '#F8F8F8',
                        }}
                      />
                      <Image
                        src="/images/ashclair_pdp_logo_image.svg"
                        alt="PDP1"
                        preview={false}
                        className="sm:hidden"
                        style={{
                          borderRadius: '0px',
                          width: '100%',
                          height: '100%',
                          aspectRatio: '1 / 1',
                          backgroundColor: '#F8F8F8',
                        }}
                      />
                      <Image
                        src="/images/ashclair_pdp_logo_image.svg"
                        alt="PDP1"
                        preview={false}
                        className="sm:hidden"
                        style={{
                          borderRadius: '0px',
                          width: '100%',
                          height: '100%',
                          aspectRatio: '1 / 1',
                          backgroundColor: '#F8F8F8',
                        }}
                      />
                      <Image
                        src="/images/ashclair_pdp_logo_image.svg"
                        alt="PDP1"
                        preview={false}
                        className="sm:hidden"
                        style={{
                          borderRadius: '0px',
                          width: '100%',
                          height: '100%',
                          aspectRatio: '1 / 1',
                          backgroundColor: '#F8F8F8',
                        }}
                      />
                    </>
                  )
                ) : (
                  <>
                    <Skeleton.Node
                      active={true}
                      className="sm:hidden"
                      style={{
                        borderRadius: '0px',
                        width: '100%',
                        height: '100%',
                        aspectRatio: '1 / 1',
                      }}
                    />
                    <Skeleton.Node
                      active={true}
                      className="sm:hidden"
                      style={{
                        borderRadius: '0px',
                        width: '100%',
                        height: '100%',
                        aspectRatio: '1 / 1',
                      }}
                    />
                    <Skeleton.Node
                      active={true}
                      className="sm:hidden"
                      style={{
                        borderRadius: '0px',
                        width: '100%',
                        height: '100%',
                        aspectRatio: '1 / 1',
                      }}
                    />
                    <Skeleton.Node
                      active={true}
                      className="sm:hidden"
                      style={{
                        borderRadius: '0px',
                        width: '100%',
                        height: '100%',
                        aspectRatio: '1 / 1',
                      }}
                    />
                  </>
                )}
              </Suspense>
              {jewelryMetadata && jewelryMetadata?.carat_video?.length > 0 && jewelryMetadata?.carat_video?.[1] && (
                <>
                  {/* <video autoPlay muted loop>
                <source src={jewelryMetadata?.carat_video?.[1]} type="video/mp4" />
                Your browser does not support the video tag.
              </video> */}
                  <ProtectedVideo
                    src={jewelryMetadata?.carat_video?.[1]}
                    autoPlay={true}
                    muted={true}
                    loop={true}
                    className="w-full h-full object-cover"
                  />
                </>
              )}
              {imageComponent && imageComponent?.length > 1 && imageComponent?.length % 2 > 0 && (
                <>
                  <Image
                    src="/images/ashclair_pdp_logo_image.svg"
                    alt="PDP1"
                    preview={false}
                    className="md:hidden"
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
          </div>
          {/* mobile Product images */}
          {jewelryMetadata ? (
            <div className="col-span-2 min-h-fit hidden sm:block sm:pt-2">
              <Swiper
                // iOS Safari can reload the page when loop clones the 360 iframe slide.
                // Keep looping for normal media, but disable it when 360 is present.
                loop={(swiperData?.length ?? 0) > 1 && !is360}
                spaceBetween={10}
                slidesPerView={1}
                navigation={true}
                modules={[FreeMode, Navigation, Thumbs, Zoom]}
                // Two-finger pinch on the slide itself. `toggle: false` leaves double-tap
                // unbound so it cannot race the single tap that opens the fullscreen viewer.
                zoom={{ maxRatio: 3, toggle: false }}
                onZoomChange={(_sw: any, scale: number) => setInlineZoomed(scale > 1)}
                onSwiper={(sw) => {
                  mobileSwiperRef.current = sw;
                }}
                onSlideChange={(swiper) => {
                  // Never carry a pinch across slides.
                  swiper.zoom?.out();
                  setActiveIndex(swiper.realIndex);
                }}
                className="mySwiper2 min-h-fit mb-3"
              >
                {// [
                //   9,
                //   jewelryMetadata?.carat_video?.length > 0 && jewelryMetadata?.carat_video?.[0],
                //   ...(jewelryMetadata?.carat_images?.length > 0 ? jewelryMetadata?.carat_images : Array(5)),
                //   jewelryMetadata?.carat_video?.length > 0 && jewelryMetadata?.carat_video?.[1],
                // ]
                // swiperData?.length>0?...swiperData:...Array(4)]?
                swiperData?.map((d: any, index: number) => {
                  const lastIndex =
                    // [
                    //   9,
                    //   jewelryMetadata?.carat_video?.length > 0 && jewelryMetadata?.carat_video?.[0],
                    //   ...(jewelryMetadata?.carat_images?.length > 0 ? jewelryMetadata?.carat_images : Array(5)),
                    //   jewelryMetadata?.carat_video?.length > 0 && jewelryMetadata?.carat_video?.[1],
                    // ]
                    swiperData?.length - 1;
                  return (
                    <SwiperSlide key={'group3179' + index} className="!flex !justify-center bg-[#f8f8f8] !items-center !w-full">
                      {index == 0 && is360 ? (
                        <div className="relative h-[512px] 2xl:h-auto w-full xl:h-auto lg:h-auto bg-[#f8f8f8]">
                          <iframe
                            key={d}
                            title="scene"
                            frameBorder="0"
                            allowFullScreen={true}
                            allow="autoplay; fullscreen; xr-spatial-tracking; web-share"
                            className="w-full border-none"
                            style={{
                              aspectRatio: '1 / 1',
                            }}
                            src={d}
                          />
                          <div className="w-[8%] absolute bottom-2 right-3 z-[19] flex items-center select-none ">
                            <Image src="/images/viewIcon.svg" alt="360-view" preview={false} className="!w-[100%] select-none" />
                          </div>
                        </div>
                      ) : isVideo && index == 1 ? (
                        <>
                          {/* <video autoPlay muted loop className="w-full !h-auto">
                          <source src={index == 1 ? videoOne : videoTwo} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video> */}
                          <ProtectedVideo
                            src={index == 1 ? videoOne : videoTwo}
                            autoPlay={true}
                            muted={true}
                            loop={true}
                            className="w-full h-full object-cover"
                          />
                        </>
                      ) : isVideo2 && index == lastIndex ? (
                        <>
                          {/* <video autoPlay muted loop className="w-full !h-auto">
                          <source src={index == 1 ? videoOne : videoTwo} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video> */}
                          <ProtectedVideo
                            src={index == 1 ? videoOne : videoTwo}
                            autoPlay={true}
                            muted={true}
                            loop={true}
                            className="w-full h-full object-cover"
                          />
                        </>
                      ) : (
                        <button
                          type="button"
                          aria-label={inlineZoomed ? 'Reset zoom' : 'Zoom product image'}
                          onClick={() => {
                            // Pinched in, a tap zooms back out — otherwise touch has no way
                            // back to 1x without swiping to another slide.
                            if (inlineZoomed) {
                              mobileSwiperRef.current?.zoom?.out();
                              return;
                            }
                            openMobileZoom(d);
                          }}
                          className="block w-full p-0 border-0 bg-transparent cursor-zoom-in"
                        >
                          {/* Swiper Zoom scales the first img inside this container. */}
                          <div className="swiper-zoom-container">
                            <Image
                              src={d}
                              preview={false}
                              alt="Mask Group"
                              fallback={'/images/ashclair_pdp_logo_image.svg'}
                              decoding="async"
                              style={{
                                mixBlendMode: 'multiply',
                              }}
                              className="h-[500px] 2xl:h-auto w-full mx-auto object-contain xl:h-auto lg:h-auto bg-[#f8f8f8] aspect-square"
                            />
                          </div>
                        </button>
                      )}
                    </SwiperSlide>
                  );
                })}
              </Swiper>
              {mobileZoomImages.length > 0 && (
                <Image.PreviewGroup
                  items={mobileZoomImages}
                  preview={{
                    visible: mobileZoom.open,
                    current: mobileZoom.current,
                    rootClassName: 'pdp-mobile-zoom',
                    maxScale: 5,
                    onChange: (current) => setMobileZoom((prev) => ({ ...prev, current })),
                    onVisibleChange: (visible) => {
                      if (!visible) {
                        closeMobileZoom();
                      }
                    },
                  }}
                />
              )}
              <Swiper
                onSwiper={(value) => setThumbsSwiper(value)}
                loop={false}
                spaceBetween={2}
                // Smaller thumbs so more of the gallery is visible at once; the fractional value
                // leaves a partial slide peeking, which signals the strip scrolls.
                slidesPerView={5.5}
                freeMode={true}
                navigation={{
                  prevEl: null,
                  nextEl: null,
                }}
                watchSlidesProgress={true}
                modules={[FreeMode, Navigation, Thumbs]}
                className="mySwiper min-h-[20%] px-2"
              >
                {// [
                //   9,
                //   jewelryMetadata?.carat_video?.length > 0 && jewelryMetadata?.carat_video?.[0],
                //   ...(jewelryMetadata?.carat_images?.length > 0 ? jewelryMetadata?.carat_images : Array(5)),
                //   jewelryMetadata?.carat_video?.length > 0 && jewelryMetadata?.carat_video?.[1],
                // ]
                swiperData?.map((d: any, index: number) => {
                  const lastIndex = swiperData?.length - 1;
                  return (
                    <SwiperSlide
                      key={'group3179' + index}
                      onClick={() => {
                        // Drive the main slider manually instead of linking the thumbs
                        // Swiper, so tapping a thumbnail changes the image WITHOUT the
                        // strip auto-scrolling the tapped thumb to the far-left edge.
                        const sw = mobileSwiperRef.current;
                        if (!sw || sw.destroyed) {
                          return;
                        }
                        if (sw.params?.loop) {
                          sw.slideToLoop(index);
                        } else {
                          sw.slideTo(index);
                        }
                      }}
                      className={`cursor-pointer transition-all duration-300 border-2 !aspect-square p-0.5 ${activeIndex === index ? 'border-primary' : 'border-transparent'}`}
                    >
                      {index == 0 && is360 ? (
                        <div className={`w-full bottom-2 left-2 z-[19] flex items-center select-none ${thumbsSwiper}`}>
                          <Image
                            src="/images/viewIcon.svg"
                            alt="360-view"
                            preview={false}
                            className="!w-[100%] px-2 !aspect-square bg-[#f8f8f8] select-none"
                          />
                        </div>
                      ) : isVideo && index == 1 ? (
                        <>
                          {/* <video muted className="w-full !h-auto">
                          <source src={index == 1 ? videoOne : videoTwo} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video> */}
                          <ProtectedVideo
                            src={index == 1 ? videoOne : videoTwo}
                            autoPlay={false}
                            muted={true}
                            loop={true}
                            showPlayIcon={true}
                            className="w-full h-full object-cover"
                          />
                        </>
                      ) : isVideo2 && index == lastIndex ? (
                        <>
                          {/* <video muted className="w-full !h-auto">
                          <source src={index == 1 ? videoOne : videoTwo} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video> */}
                          <ProtectedVideo
                            src={index == 1 ? videoOne : videoTwo}
                            autoPlay={false}
                            muted={true}
                            loop={true}
                            showPlayIcon={true}
                            className="w-full h-full object-cover"
                          />
                        </>
                      ) : (
                        <div className="w-full h-full bg-[#f8f8f8]">
                          <Image
                            src={d}
                            preview={false}
                            alt="Mask Group"
                            fallback={'/images/ashclair_pdp_logo_image.svg'}
                            loading="lazy"
                            decoding="async"
                            className="h-[500px] 2xl:h-auto w-full object-contain xl:h-auto lg:h-auto bg-[#f8f8f8] mix-blend-multiply !aspect-square"
                          />
                        </div>
                      )}
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            </div>
          ) : (
            <div className="col-span-2 hidden sm:block sm:pt-2 w-full">
              <Skeleton.Node
                active={true}
                className="hidden sm:!block"
                style={{
                  borderRadius: '0px',
                  width: '100%',
                  height: '100%',
                  aspectRatio: '1 / 1',
                }}
              />
              <div className="grid grid-cols-4 gap-3 mt-3">
                <Skeleton.Node
                  active={true}
                  className="hidden sm:!block"
                  style={{
                    borderRadius: '0px',
                    width: '100%',
                    height: '100%',
                    aspectRatio: '1 / 1',
                  }}
                />
                <Skeleton.Node
                  active={true}
                  className="hidden sm:!block"
                  style={{
                    borderRadius: '0px',
                    width: '100%',
                    height: '100%',
                    aspectRatio: '1 / 1',
                  }}
                />
                <Skeleton.Node
                  active={true}
                  className="hidden sm:!block"
                  style={{
                    borderRadius: '0px',
                    width: '100%',
                    height: '100%',
                    aspectRatio: '1 / 1',
                  }}
                />
                <Skeleton.Node
                  active={true}
                  className="hidden sm:!block"
                  style={{
                    borderRadius: '0px',
                    width: '100%',
                    height: '100%',
                    aspectRatio: '1 / 1',
                  }}
                />
              </div>
            </div>
          )}
        </div>
        <div
          ref={cRef}
          className={`flex w-[32%] sticky pb-0 ${
            searchParams?.get('id') ? `top-[${topOffset}] md:top-20 sm:top-0 lg:pt-0` : `top-[${topOffset}]`
          } 2xl:w-1/3 lg:w-1/3 sm:w-full flex-col gap-[24px] md:w-[40%] 2xl:gap-[24px] lg:gap-[20px] md:gap-[10px] sm:gap-[18px]`}
          style={{ top: `${topOffset}` }}
        >
          <div className="flex flex-col gap-2 2xl:gap-2 xl:gap-2 lg:gap-2 md:gap-2 sm:gap-2">
            <div className="flex flex-col items-start gap-1">
              <div className="flex flex-col items-start gap-1 self-stretch">
                {product?.fullTitle ? (
                  <Text size="text5xl" className="md:!text-[20px] sm:!text-[18px]">
                    {product?.fullTitle}
                  </Text>
                ) : (
                  <>
                    <Skeleton.Input active={true} block={true} />
                    <Skeleton.Input active={true} block={true} />
                  </>
                )}

                {product?.jewelry_id && jewelryMetadata && (
                  <div className="flex items-center gap-2">
                    <Text size="textmd" className="!text-[12px]">
                      {/* Parts are joined explicitly so every comma reads "a, b" with no space before it. */}
                      <span className="!font-semibold">
                        {isGoldMetal
                          ? // Solid gold reads "10K Solid Rose Gold (not plated)".
                            `${titleMetal} (not plated)`
                          : isSilverMetal
                            ? // Silver reads "925 Sterling Silver, Rhodium Plated".
                              ['925 Sterling Silver', silverPlating].filter(Boolean).join(', ')
                            : titleMetal}
                      </span>
                      {[
                        '',
                        searchParams?.get('id')
                          ? productFilter?.find((el: any) => el.id === jewelryMetadata?.shape_id)?.name?.trim()
                          : jewelryMetadata?.center_diamond_id &&
                            productFilter?.find((el: any) => el.id === jewelryMetadata?.center_diamond_id)?.name &&
                            `Center Stone ${productFilter?.find((el: any) => el.id === jewelryMetadata?.center_diamond_id)?.name?.trim()}`,
                        ...materialHighlights,
                      ]
                        // The leading '' keeps the ", " between the bold metal and the rest of the line.
                        .filter((value, index) => index === 0 || Boolean(value))
                        .join(', ')}
                      {product?.diamond_certificate === 1
                        ? ' | GIA'
                        : product?.diamond_certificate === 2
                          ? ' | IGI'
                          : product?.diamond_certificate === 3
                            ? ' | DGLA'
                            : ''}
                    </Text>
                  </div>
                )}

                <div className="flex flex-col items-start gap-0 self-stretch">
                  {product?.code ? (
                    <div className="flex items-center justify-between w-full sm:pr-3">
                      <Text size="textmd" className="!text-[12px]">
                        ITEM CODE: {selectedProductObject?.sku_code}{' '}
                      </Text>
                      {user ? (
                        wId ? (
                          <FaHeart
                            className="w-5 h-5 md:w-[24px] md:h-[24px] active:scale-150 active:transition-all active:delay-0 cursor-pointer text-secondary"
                            onClick={() => {
                              handleAddToWishlist();
                            }}
                          />
                        ) : (
                          <FaRegHeart
                            className="w-5 h-5 md:w-[24px] md:h-[24px] active:scale-50 active:transition-all active:delay-0 cursor-pointer text-secondary"
                            onClick={() => {
                              handleAddToWishlist();
                            }}
                          />
                        )
                      ) : wishlist ? (
                        <FaHeart
                          className="w-5 h-5 md:w-[24px] md:h-[24px] active:scale-150 active:transition-all active:delay-0 cursor-pointer select-none text-secondary"
                          onClick={() => {
                            setWishlist(!wishlist);
                            handleAddToWishlist();
                          }}
                        />
                      ) : (
                        <FaRegHeart
                          className="w-5 h-5 md:w-[24px] md:h-[24px] active:scale-50 active:transition-all active:delay-0 cursor-pointer select-none text-secondary"
                          onClick={() => {
                            setWishlist(!wishlist);
                            handleAddToWishlist();
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    <>
                      <Skeleton.Input active={true} size="small" className="h-[12px]" />
                    </>
                  )}
                  {/* <div className="yotpo bottomLine" data-product-id={product?.code}></div> */}
                  {/* <div className=" min-h-5 min-w-full"> */}
                  {process.env.NEXT_PUBLIC_YOTPO_APP_INSTANCE_STAR_ID && <YotpoStarReview selectedProduct={selectedProduct} />}
                  {/* </div> */}
                </div>
              </div>
              {jewelryMetadata?.selling_price ? (
                <div className="flex h-fit flex-col gap-0.5 md:gap-0.5 sm:gap-0.5">
                  {jewelryMetadata?.discounted_price && (
                    <Text size="text2xl" className="!font-medium !text-[12px] sale-coupon-text ">
                      {jewelryMetadata?.discount_type && jewelryMetadata?.discount_type == (2 as any)
                        ? `${jewelryMetadata?.discount_value}% OFF`
                        : `${jewelryMetadata?.currency_symbol}${jewelryMetadata?.discount_value} OFF`}
                    </Text>
                  )}
                  <div className="flex h-fit items-baseline gap-2 md:gap-2 sm:gap-2">
                    {jewelryMetadata?.discounted_price && (
                      <Text size="text5xl" className="!font-medium !font-castoro !text-[26px]">
                        {formatCurrency(
                          Math.ceil(
                            jewelryMetadata?.discounted_price +
                              (productPrice ? productPrice : 0) +
                              (is_appraisal ? appraisalData?.price : 0) +
                              (selectedYear !== null ? selectedYearValue?.price : 0) +
                              (engravingText.Text != '' && engravingText.Text ? engraving?.data?.engraving_price : 0),
                          ),
                        )}
                      </Text>
                    )}
                    <Text
                      size="text5xl"
                      className={`!font-castoro ${jewelryMetadata?.discounted_price ? 'line-through text-gray-400 !text-[20px] lg:!text-[16px] md:!text-[18px] sm:!text-[16px]' : '!font-medium '}`}
                    >
                      {formatCurrency(
                        Math.ceil(
                          jewelryMetadata?.selling_price +
                            (productPrice ? productPrice : 0) +
                            (is_appraisal ? appraisalData?.price : 0) +
                            (selectedYear !== null ? selectedYearValue?.price : 0) +
                            (engravingText.Text != '' && engravingText.Text ? engraving?.data?.engraving_price : 0),
                        ),
                      )}
                    </Text>
                    {isSilverMetal && (
                      <span className="!font-sans self-center ml-1 rounded-full border border-[#c9ccd1] bg-[#eef0f2] px-3 py-[3px] text-[11px] font-semibold uppercase tracking-[0.14em] text-[#3d4148] whitespace-nowrap">
                        Sterling Silver
                      </span>
                    )}
                    {isGoldMetal && (
                      <span className="!font-sans self-center ml-1 rounded-full border border-[#d9c389] bg-[#f3ead2] px-3 py-[3px] text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5a4514] whitespace-nowrap">
                        Solid Gold
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <Skeleton.Input active={true} size="small" />
                </>
              )}
              {affirmPriceInCents >= 5000 &&
                (!searchParams?.get('id') || dId) &&
                (typeof window === 'undefined' || (localStorage.getItem('currency') || 'USD') === 'USD') && (
                  <p
                    ref={affirmMessageRef}
                    className="affirm-as-low-as affirm-promo-message"
                    data-page-type="product"
                    data-amount={affirmPriceInCents}
                  />
                )}
            </div>
            {/* Separates the price / Affirm block from the variation selectors below. */}
            <div className="mt-0 mb-2 h-px w-full bg-[#e5e5e5]" />
            <div className="flex flex-col items-start mt-0 gap-[16px] 2xl:gap-[16px] lg:gap-[16px]">
              <div className="flex flex-col w-full items-start gap-4 md:gap-[16px] sm:gap-[16px] lg:gap-[16px]">
                {/* Premade products may offer several center shapes. Rendered only when there is
                    more than one, so a single-shape product is visually unchanged. Shown first, above the
                    carat, metal and stone selectors, because those options depend on the shape. */}
                {!dId && !customVariant?.length && centerShapeVariant?.length > 1 && (
                  <div className="flex flex-col items-start gap-[8px] md:gap-[8px] self-stretch relative">
                    <div className="flex items-center justify-between gap-5 self-stretch">
                      <Text size="textxl" className="!font-light !font-sans uppercase !text-[16px]">
                        CENTER STONE SHAPE
                      </Text>
                    </div>
                    <div className="flex gap-[8px] flex-wrap">
                      {centerShapeVariant?.map((item: any, i: number) => (
                        <div
                          key={i}
                          className={`!font-sans flex justify-center items-center ${
                            jewelryMetadata?.center_shape_id === item?.shape ? ' border-[#17381d]' : 'opacity-70 border-transparent'
                          } !font-medium w-[35px] !aspect-square tracking-[1px] cursor-pointer border-b pb-2`}
                          onClick={async () => {
                            const new_slug = await getSkuSlug(
                              selectedProductVariation,
                              selectedProductObject?.metal_type_id,
                              selectedProductObject?.metal_color_id,
                              selectedProductObject?.shape_id,
                              selectedProductObject?.carat_id,
                              selectedProductObject?.custom_stone_id,
                              selectedProductObject?.center_diamond_id,
                              selectedProductObject?.accent_diamond_id,
                              selectedProductObject?.second_accent_diamond_id,
                              String(selectedProductObject?.premade_carat_weight),
                              selectedProductObject?.bracelet_length_ids ?? null,
                              selectedProductObject?.band_width_ids ?? null,
                              item?.shape,
                            );
                            changeRouter(`${selectedJewelryType}/premade?slug=${new_slug ?? item?.sku_slug}`);
                          }}
                        >
                          <Tooltip title={productFilter?.find((el: any) => el.id === item?.shape)?.name}>
                            <Image
                              height={30}
                              className="object-contain"
                              src={`${productFilter?.find((el: any) => el.id === item?.shape)?.image?.[0]}`}
                              fallback="/images/no_images.svg"
                              alt={`${productFilter?.find((el: any) => el.id === item?.shape)?.name}`}
                              preview={false}
                            />
                          </Tooltip>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {!dId && customVariant?.length > 0 ? (
                  <>
                    {customVariant?.length > 0 ? (
                      <div className="flex flex-col items-start gap-[8px] md:gap-[8px] self-stretch relative">
                        <div className="flex items-center justify-between gap-5 self-stretch">
                          <Text size="textxl" className="!font-light !font-sans uppercase">
                            Shapes -
                            <span className="text-[16px] capitalize pl-1">
                              {`${productFilter?.find((el: any) => el.id === jewelryMetadata?.shape_id)?.name}`}
                            </span>
                          </Text>
                        </div>
                        <div>
                          <div className="flex gap-[8px]">
                            {customVariant?.map((item: any, i: number) => {
                              return (
                                <div
                                  key={i}
                                  className={`!font-sans flex justify-center items-center ${
                                    (isSilverMetal ? jewelryMetadata?.shape_id === item?.shape_id : jewelryMetadata?.shape_id === item?.shape_id)
                                      ? ' border-[#17381d]'
                                      : 'opacity-70 border-transparent'
                                  } !font-medium w-[35px] !aspect-square tracking-[1px] cursor-pointer border-b pb-2`}
                                  onClick={async () => {
                                    const new_slug = await getSkuSlug(
                                      selectedProductVariation,
                                      selectedProductObject?.metal_type_id,
                                      selectedProductObject?.metal_color_id,
                                      item?.shape_id,
                                      selectedProductObject?.carat_id,
                                      selectedProductObject?.custom_stone_id,
                                    );
                                    dispatch(setSelectedShapesData(item?.shape_id));
                                    changeRouter(
                                      searchParams?.get('id')
                                        ? `custom-jewelry?type=2&state=s&id=${new_slug}${dId ? `&did=${dId}` : ''}`
                                        : // : `${selectedJewelryType}/${new_slug}`,
                                          `${selectedJewelryType}/premade?slug=${new_slug}`,
                                    );
                                  }}
                                >
                                  <Image
                                    height={30}
                                    className="object-contain"
                                    src={`${productFilter?.find((el: any) => el.id === item?.shape_id)?.image?.[0]}`}
                                    fallback="/images/no_images.svg"
                                    alt={`${productFilter?.find((el: any) => el.id === item?.shape_id)?.name}`}
                                    preview={false}
                                  />
                                  {/* {`${productFilter?.find(
                              (el: any) => el.id === item?.shape_id
                            )?.name
                              }`} */}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Skeleton.Input active={true} size="small" />
                        <div className="flex gap-3">
                          <Skeleton.Button active={true} className="!rounded-none" />
                          <Skeleton.Button active={true} className="!rounded-none" />
                          <Skeleton.Button active={true} className="!rounded-none" />
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  customVariant?.length > 0 && (
                    <>
                      <div className="flex flex-col items-start gap-[8px] md:gap-[8px] self-stretch relative">
                        <div className="flex items-center justify-between gap-5 self-stretch">
                          <Text size="textxl" className="!font-light !font-sans uppercase">
                            Shape
                            {/* -<span className="text-[16px] capitalize pl-1">{selectedDiamondStore?.shape_name}</span> */}
                          </Text>
                        </div>
                        <div className={`!font-sans flex justify-center items-center !font-medium w-[35px] !aspect-square tracking-[1px]`}>
                          <Tooltip title={selectedDiamondStore?.shape_name}>
                            <Image
                              height={30}
                              className="object-contain"
                              src={`${productFilter?.find((el: any) => el.name === selectedDiamondStore?.shape_name)?.image?.[0]}`}
                              alt={`${productFilter?.find((el: any) => el.name === selectedDiamondStore?.shape_name)?.name}`}
                              preview={false}
                            />
                          </Tooltip>
                        </div>
                      </div>
                    </>
                  )
                )}
                {!dId && customVariant?.length > 0
                  ? caratsData?.length > 0 && (
                      <div className="hidden mt-2 flex-col items-start gap-[8px] md:gap-[8px] self-stretch relative">
                        <div className="flex items-center">
                          <Text size="textxl" className="!font-light !font-sans uppercase ">
                            Carats
                          </Text>
                          <span className="text-[16px] flex justify-center items-center ml-2 border border-gray-400 px-2 py-0.5 !min-w-[45px]">
                            {`${parseFloat(productFilter?.find((el: any) => el.id === selectedProductObject?.carat_id)?.name)}`}
                          </span>
                        </div>
                        <div className="w-full px-2">
                          {caratsData.length < 4 ? (
                            <div className="flex gap-[10px] -mx-2">
                              {caratsData?.map((item: any, i: number) => {
                                return (
                                  <Button
                                    key={i}
                                    className={` !font-sans !px-1.5 flex justify-center items-center ${
                                      jewelryMetadata?.carat_id === item?.carat_id
                                        ? '!bg-[#818d64] border-none !text-white'
                                        : 'border !border-[#818d64]'
                                    } !font-medium !aspect-square tracking-[1px] cursor-pointer`}
                                    onClick={async () => {
                                      const new_slug = await getSkuSlug(
                                        selectedProductVariation,
                                        selectedProductObject?.metal_type_id,
                                        selectedProductObject?.metal_color_id,
                                        selectedProductObject?.shape_id,
                                        item?.carat_id,
                                        selectedProductObject?.custom_stone_id,
                                      );
                                      setSelectedCarat(i);
                                      dispatch(setSelectedCaratsData([caratsData?.[i]?.carat_id, caratsData?.[i]?.carat_id]));
                                      changeRouter(
                                        searchParams?.get('id')
                                          ? `custom-jewelry?type=2&state=s&id=${new_slug}${dId ? `&did=${dId}` : ''}`
                                          : // : `${selectedJewelryType}/${new_slug}`,
                                            `${selectedJewelryType}/premade?slug=${new_slug}`,
                                      );
                                    }}
                                  >
                                    <span>{`${productFilter?.find((el: any) => el.id === item?.carat_id)?.name}`}</span>
                                  </Button>
                                );
                              })}
                            </div>
                          ) : (
                            <Slider
                              aria-label="Carat Slider"
                              min={0}
                              className="diamond-slider"
                              value={caratsData?.findIndex((el: any) => el.carat_id == selectedProductObject?.carat_id) ?? selectedCarat}
                              max={caratsData?.length - 1}
                              onChange={(_: any, value: any) => {
                                const selectCarat = customVariant?.find((el: any) => el.shape_id == jewelryMetadata?.shape_id)?.carats?.[value];
                                const caratSlug = selectCarat?.colors?.find((el: any) => el.id == jewelryMetadata?.custom_stone_id)?.sku_slug;
                                setSelectedCarat(value);
                                dispatch(setSelectedCaratsData([caratsData?.[value]?.carat_id, caratsData?.[value]?.carat_id]));
                                changeRouter(
                                  searchParams?.get('id')
                                    ? `custom-jewelry?type=2&state=s&id=${caratSlug ?? selectCarat?.sku_slug}${dId ? `&did=${dId}` : ''}`
                                    : // : `${selectedJewelryType}/${caratSlug ?? selectCarat?.sku_slug}`,
                                      // : `${selectedJewelryType}/${new_slug}`,
                                      `${selectedJewelryType}/premade?slug=${caratSlug ?? selectCarat?.sku_slug}`,
                                );
                              }}
                              marks={productFilter
                                ?.filter((mark: any) => caratsData?.map((el: any) => el.carat_id)?.includes(mark.id))
                                ?.sort((a, b) => parseFloat(a.name) - parseFloat(b.name))
                                ?.map((mark: any, i: number) => ({ value: Number(i), label: parseFloat(mark?.name).toString() }))}
                            />
                          )}
                        </div>
                      </div>
                    )
                  : customVariant?.length > 0 && (
                      <>
                        <div className="flex mt-2 flex-col items-start gap-4 md:gap-[10px] self-stretch relative">
                          <div className="flex items-center justify-between gap-5 self-stretch">
                            <Text size="textxl" className="!font-light !font-sans uppercase">
                              Carat
                            </Text>
                          </div>
                          <div>
                            <span className={`!font-sans !px-1.5 border !border-[#cacaca] !font-medium !aspect-square tracking-[1px] `}>
                              {selectedDiamondStore?.carats}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                {preMadeCarats?.length > 0 && (
                  <>
                    <div className="flex mt-0 flex-col items-start gap-[8px] md:gap-[8px] self-stretch relative">
                      <div className="flex items-center justify-between gap-5 self-stretch">
                        <Text size="textxl" className="!font-light !font-sans uppercase">
                          Carats
                        </Text>
                      </div>

                      <div className="flex gap-[6px] flex-wrap">
                        {preMadeCarats
                          ?.sort((a: any, b: any) => a - b)
                          ?.map((item: any, i: number) => {
                            return (
                              <Button
                                key={i}
                                className={` !font-sans !px-1.5 flex justify-center items-center ${
                                  jewelryMetadata?.premade_carat_weight == item
                                    ? '!bg-secondary !border-none !text-white'
                                    : 'border !border-secondary'
                                } !font-medium !aspect-square sm:!aspect-auto  sm:!h-[30px] tracking-[1px] cursor-pointer`}
                                onClick={async () => {
                                  const new_slug = await getSkuSlug(
                                    selectedProductVariation,
                                    selectedProductObject?.metal_type_id,
                                    selectedProductObject?.metal_color_id,
                                    selectedProductObject?.shape_id,
                                    selectedProductObject?.carat_id,
                                    selectedProductObject?.custom_stone_id,
                                    selectedProductObject?.center_diamond_id,
                                    selectedProductObject?.accent_diamond_id,
                                    selectedProductObject?.second_accent_diamond_id,
                                    String(item),
                                    selectedProductObject?.bracelet_length_ids ?? null,
                                    selectedProductObject?.band_width_ids ?? null,
                                    selectedProductObject?.center_shape_id,
                                  );

                                  changeRouter(
                                    searchParams?.get('id')
                                      ? `custom-jewelry?type=2&state=s&id=${new_slug}${dId ? `&did=${dId}` : ''}`
                                      : // : `${selectedJewelryType}/${new_slug}`,
                                        `${selectedJewelryType}/premade?slug=${new_slug}`,
                                  );
                                }}
                              >
                                <span className="sm:min-w-[28px]">{item}</span>
                              </Button>
                            );
                          })}
                      </div>
                    </div>
                  </>
                )}
                {preMadeBraceletLength?.length > 0 && (
                  <>
                    <div className="flex flex-col items-start gap-[8px] md:gap-[8px] self-stretch relative">
                      <div className="flex items-center justify-between gap-5 self-stretch">
                        <Text size="textxl" className="!font-light !font-sans">
                          LENGTH - INCH
                        </Text>
                      </div>

                      <div className="flex gap-[10px] flex-wrap">
                        {preMadeBraceletLength
                          // ?.sort((a: any, b: any) => a - b)
                          ?.map((item: any, i: number) => {
                            return (
                              <Button
                                key={i}
                                className={` !font-sans !px-1.5 flex justify-center items-center ${
                                  jewelryMetadata?.bracelet_length_ids == item?.id
                                    ? '!bg-secondary !border-none !text-white'
                                    : 'border !border-secondary'
                                } !font-medium !aspect-square sm:!aspect-auto  sm:!h-[30px] tracking-[1px] cursor-pointer`}
                                onClick={async () => {
                                  const new_slug = await getSkuSlug(
                                    selectedProductVariation,
                                    selectedProductObject?.metal_type_id,
                                    selectedProductObject?.metal_color_id,
                                    selectedProductObject?.shape_id,
                                    selectedProductObject?.carat_id,
                                    selectedProductObject?.custom_stone_id,
                                    selectedProductObject?.center_diamond_id,
                                    selectedProductObject?.accent_diamond_id,
                                    selectedProductObject?.second_accent_diamond_id,
                                    selectedProductObject?.premade_carat_weight ?? null,
                                    String(item.id),
                                    null,
                                    selectedProductObject?.center_shape_id,
                                  );

                                  changeRouter(
                                    searchParams?.get('id')
                                      ? `custom-jewelry?type=2&state=s&id=${new_slug}${dId ? `&did=${dId}` : ''}`
                                      : `${selectedJewelryType}/premade?slug=${new_slug}`,
                                  );
                                }}
                              >
                                <span className="sm:min-w-[28px]">{`${productFilter?.find((el: any) => el.id === item?.id)?.name}`}</span>
                              </Button>
                            );
                          })}
                      </div>
                    </div>
                  </>
                )}

                {/* band width */}
                {preMadeBandWidth?.length > 0 && (
                  <>
                    <div className="flex flex-col items-start gap-[8px] md:gap-[8px] self-stretch relative">
                      <div className="flex items-center justify-between gap-5 self-stretch">
                        <Text size="textxl" className="!font-light !font-sans">
                          BAND WIDTH - mm
                        </Text>
                      </div>

                      <div className="flex gap-[10px] flex-wrap">
                        {preMadeBandWidth
                          // ?.sort((a: any, b: any) => a - b)
                          ?.map((item: any, i: number) => {
                            return (
                              <Button
                                key={i}
                                className={` !font-sans !px-1.5 flex justify-center items-center ${
                                  jewelryMetadata?.band_width_ids == item?.id ? '!bg-secondary !border-none !text-white' : 'border !border-secondary'
                                } !font-medium !aspect-square sm:!aspect-auto  sm:!h-[30px] tracking-[1px] cursor-pointer`}
                                onClick={async () => {
                                  const new_slug = await getSkuSlug(
                                    selectedProductVariation,
                                    selectedProductObject?.metal_type_id,
                                    selectedProductObject?.metal_color_id,
                                    selectedProductObject?.shape_id,
                                    selectedProductObject?.carat_id,
                                    selectedProductObject?.custom_stone_id,
                                    selectedProductObject?.center_diamond_id,
                                    selectedProductObject?.accent_diamond_id,
                                    selectedProductObject?.second_accent_diamond_id,
                                    selectedProductObject?.premade_carat_weight ?? null,
                                    selectedProductObject?.premade_bracelet_length ?? null,
                                    String(item.id),
                                    selectedProductObject?.center_shape_id,
                                  );

                                  changeRouter(
                                    searchParams?.get('id')
                                      ? `custom-jewelry?type=2&state=s&id=${new_slug}${dId ? `&did=${dId}` : ''}`
                                      : `${selectedJewelryType}/premade?slug=${new_slug}`,
                                  );
                                }}
                              >
                                <span className="sm:min-w-[28px]">{`${productFilter?.find((el: any) => el.id === item?.id)?.name}`}</span>
                              </Button>
                            );
                          })}
                      </div>
                    </div>
                  </>
                )}
                {!dId && customVariant?.length > 0
                  ? diamondColorData?.length > 0 && (
                      <div className="flex mt-2 flex-col items-start gap-5 md:gap-[10px] self-stretch relative">
                        <div className="flex items-center justify-between gap-5 self-stretch">
                          <Text size="textxl" className="!font-light !font-sans uppercase">
                            Diamond Color -
                            <span className="text-[18px] capitalize pl-1">
                              {`${productFilter?.find((el: any) => el.id === jewelryMetadata?.custom_stone_id)?.name}`}
                            </span>
                          </Text>
                        </div>
                        <div className="flex gap-[8px]">
                          {diamondColorData?.map((item: any, i: number) => {
                            return (
                              <div
                                key={i}
                                className={`!font-sans flex justify-center items-center ${
                                  (isSilverMetal ? jewelryMetadata?.custom_stone_id === item?.id : jewelryMetadata?.custom_stone_id === item?.id)
                                    ? 'opacity-100 border-[#17381d]'
                                    : 'opacity-70 border-transparent'
                                } !font-medium w-[40px] !aspect-square tracking-[1px] cursor-pointer border-b pb-1`}
                                onClick={async () => {
                                  const new_slug = await getSkuSlug(
                                    selectedProductVariation,
                                    selectedProductObject?.metal_type_id,
                                    selectedProductObject?.metal_color_id,
                                    selectedProductObject?.shape_id,
                                    selectedProductObject?.carat_id,
                                    item?.id,
                                  );
                                  changeRouter(
                                    searchParams?.get('id')
                                      ? `custom-jewelry?type=2&state=s&id=${new_slug}${dId ? `&did=${dId}` : ''}`
                                      : // : `${selectedJewelryType}/${new_slug}`,
                                        `${selectedJewelryType}/premade?slug=${new_slug}`,
                                  );
                                }}
                              >
                                <Image
                                  height={30}
                                  src={item?.image}
                                  fallback="/images/no_images.svg"
                                  alt={`${productFilter?.find((el: any) => el.id === item?.custom_stone_id)?.name}`}
                                  preview={false}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )
                  : customVariant?.length > 0 && (
                      <>
                        {/* <div className="flex mt-2 flex-col items-start gap-4 md:gap-[10px] self-stretch relative">
                        <div className="flex items-center justify-between gap-5 self-stretch">
                          <Text size="textxl" className="!font-light !font-sans uppercase">
                            Diamond Color
                            -<span className="text-[16px] capitalize pl-1">{selectedDiamondStore?.carats}</span>
                          </Text>
                        </div>
                        <div>
                          <span className={`!font-sans !px-1.5 border !border-[#cacaca] !font-medium !aspect-square tracking-[1px] `}>
                            {selectedDiamondStore?.carats}
                          </span>
                        </div>
                      </div> */}
                      </>
                    )}
                {product?.jewelry_id ? (
                  <div className="flex flex-col items-start gap-[8px] md:gap-[8px] self-stretch relative">
                    <div className="flex items-center justify-between gap-5 self-stretch">
                      <Text size="textxl" className="!font-light !font-sans !text-[16px]">
                        METAL
                      </Text>
                      <button
                        type="button"
                        onClick={() => setIsCompareMetalsOpen(true)}
                        className="!font-sans text-[15px] text-secondary underline underline-offset-4 hover:opacity-80 cursor-pointer whitespace-nowrap"
                      >
                        Compare metals
                      </button>
                      <CompareMetalsModal open={isCompareMetalsOpen} onClose={() => setIsCompareMetalsOpen(false)} />
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-2 w-full">
                      {metalGroups.map((group, groupIndex) => (
                        <div
                          key={group.label || 'other'}
                          className={`flex flex-col gap-[6px] ${groupIndex > 0 ? 'border-l border-[#d9d9d9] pl-3' : ''}`}
                        >
                          {group.label && (
                            <span className="!font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-[#555]">{group.label}</span>
                          )}
                          <div className="flex flex-nowrap gap-[6px]">
                            {group.items.map((item: any, i: number) => {
                              return (
                                <Button
                                  key={i}
                                  // Sized to the master name, with a common minimum so short karat names line up.
                                  // Hover keeps the same colors, and no transition, so a button never fades while the metal changes.
                                  className={`!font-sans !px-4 min-w-[64px] !transition-none ${
                                    (isSilverMetal ? jewelryMetadata?.metal_type_id === item?.id : jewelryMetadata?.metal_type_id === item?.id)
                                      ? '!bg-secondary !border-none !text-white hover:!bg-secondary hover:!text-white'
                                      : 'border !border-secondary !bg-white !text-black hover:!bg-white hover:!text-black hover:!border-secondary'
                                  } !font-normal !h-[40px] sm:!h-auto sm:!min-h-[36px] !py-1 !whitespace-nowrap sm:!whitespace-normal !leading-tight !text-[13px] sm:!text-[12px] tracking-normal cursor-pointer`}
                                  onClick={async () => {
                                    const new_slug = await getSkuSlug(
                                      productVariant,
                                      item?.id,
                                      selectedProductObject?.metal_color_id,
                                      selectedProductObject?.shape_id,
                                      selectedProductObject?.carat_id,
                                      selectedProductObject?.custom_stone_id,
                                      selectedProductObject?.center_diamond_id,
                                      selectedProductObject?.accent_diamond_id,
                                      selectedProductObject?.second_accent_diamond_id,
                                      String(selectedProductObject?.premade_carat_weight),
                                      selectedProductObject?.bracelet_length_ids ?? null,
                                      selectedProductObject?.band_width_ids ?? null,
                                      selectedProductObject?.center_shape_id,
                                    );
                                    changeRouter(
                                      searchParams?.get('id')
                                        ? `custom-jewelry?type=2&state=s&id=${new_slug}${dId ? `&did=${dId}` : ''}`
                                        : // : `${selectedJewelryType}/${new_slug}`,
                                          `${selectedJewelryType}/premade?slug=${new_slug}`,
                                    );
                                  }}
                                >
                                  {item?.name}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Helper box that explains the selected metal. */}
                    {isGoldMetal && (
                      <div className="!font-sans w-full rounded-md border border-[#d9dccf] bg-[#f1f2ec] px-4 py-3 text-[14px] sm:text-[13px] leading-relaxed text-[#2b2b2b]">
                        <span className="font-semibold">Solid {selectedMetalTypeName?.toUpperCase()} gold all the way through, not plated.</span>{' '}
                        Stamped {selectedMetalTypeName?.toUpperCase()}
                        {showRingSizeSelector ? ' inside the band' : ''}. The color will never wear off.
                      </div>
                    )}
                    {isSilverMetal &&
                      (() => {
                        const plating = silverPlating.replace(/plated$/i, 'plating').toLowerCase();
                        const karats: string[] = (metalGroups.find((group) => group.label === 'SOLID GOLD')?.items ?? []).map((item: any) =>
                          String(item?.name).split(' ')[0].toUpperCase(),
                        );
                        return (
                          <div className="!font-sans w-full rounded-md border border-[#d9dccf] bg-[#f1f2ec] px-4 py-3 text-[14px] sm:text-[13px] leading-relaxed text-[#2b2b2b]">
                            <span className="font-semibold">925 sterling silver{plating ? ` with ${plating}` : ''}</span>
                            {/^rhodium/.test(plating) ? ' for a bright white finish' : ''}. Plating can wear over time and can be re-plated.
                            {karats.length > 0 &&
                              ` Want solid gold? Choose ${karats.length > 1 ? `${karats.slice(0, -1).join(', ')} or ${karats[karats.length - 1]}` : karats[0]}.`}
                          </div>
                        );
                      })()}
                  </div>
                ) : (
                  <>
                    <Skeleton.Input active={true} size="small" />
                    <div className="flex gap-3">
                      <Skeleton.Button active={true} className="!rounded-none" />
                      <Skeleton.Button active={true} className="!rounded-none" />
                      <Skeleton.Button active={true} className="!rounded-none" />
                    </div>
                  </>
                )}
                {product?.jewelry_id ? (
                  <div className="flex flex-col items-start gap-[8px] md:gap-[8px] self-stretch relative">
                    <div className="flex items-center justify-between gap-[10px] self-stretch">
                      <Text size="textxl" className="!font-light !font-sans !text-[16px]">
                        METAL COLOR <span className="!font-light !font-sans">- {selectedMetalColor?.replace('-', ' ')}</span>
                      </Text>
                    </div>

                    <MetalColorOptions
                      productFilter={productFilter}
                      productVariant={productVariant}
                      selectedMetalType={selectedMetalType}
                      selectedJewelryType={selectedJewelryType}
                      slug={slug}
                      selectedProductObject={selectedProductObject}
                      sId={searchParams?.get('id')}
                      dId={dId}
                      selectedMetalColor={selectedMetalColor}
                      productSKU={productSKU}
                      selectedProduct={selectedProduct}
                      changeRouter={changeRouter}
                    />
                  </div>
                ) : (
                  <>
                    <Skeleton.Input active={true} size="small" />
                    <div className="flex gap-3">
                      <Skeleton.Button active={true} className="!rounded-none" />
                      <Skeleton.Button active={true} className="!rounded-none" />
                      <Skeleton.Button active={true} className="!rounded-none" />
                    </div>
                  </>
                )}
                {selectedProductObject?.center_diamond_id ? (
                  product?.jewelry_id ? (
                    <div className="flex flex-col items-start gap-[8px] md:gap-[8px] self-stretch relative">
                      <div className="flex items-center justify-between gap-5 self-stretch">
                        {jewelryMetadata?.center_diamond_id && (
                          <Text size="textxl" className="!font-light !font-sans uppercase !text-[16px]">
                            STONE COLOR
                          </Text>
                        )}
                      </div>
                      <div className="flex flex-wrap w-full gap-[5px]">
                        {centerStoneVariant &&
                          // _.uniqBy(centerStoneVariant, (el: any) => el.color?.name)
                          centerStoneVariant?.map((item: any, i: number) => {
                            return (
                              <div
                                key={i}
                                className={`!font-sans flex gap-1 flex-col justify-center items-center !px-1 border-[1.5px] rounded-full ${
                                  item?.color?.id === jewelryMetadata?.center_diamond_id ? 'border-[#17381d]' : 'border-transparent'
                                } !font-medium !aspect-square tracking-[1px] cursor-pointer`}
                                onClick={async () => {
                                  const new_slug = await getSkuSlug(
                                    productVariant,
                                    selectedProductObject?.metal_type_id,
                                    selectedProductObject?.metal_color_id,
                                    selectedProductObject?.shape_id,
                                    selectedProductObject?.carat_id,
                                    selectedProductObject?.custom_stone_id,
                                    item?.color?.id,
                                    selectedProductObject?.accent_diamond_id,
                                    selectedProductObject?.second_accent_diamond_id,
                                    String(selectedProductObject?.premade_carat_weight),
                                    selectedProductObject?.bracelet_length_ids ?? null,
                                    selectedProductObject?.band_width_ids ?? null,
                                    selectedProductObject?.center_shape_id,
                                  );
                                  changeRouter(
                                    searchParams?.get('id')
                                      ? `custom-jewelry?type=2&state=s&id=${new_slug}${dId ? `&did=${dId}` : ''}`
                                      : `${selectedJewelryType}/premade?slug=${new_slug}`,
                                  );
                                }}
                              >
                                <Tooltip title={productFilter?.find((el: any) => el.id === item?.color?.id)?.name}>
                                  <Image
                                    src={`${productFilter?.find((el: any) => el.id == item?.color?.id)?.image?.[0]}`}
                                    fallback={'/images/no_images.svg'}
                                    alt={`${item?.name}-img`}
                                    width={30}
                                    height={30}
                                    preview={false}
                                    className="h-[70px] w-[70px] object-cover"
                                  />
                                </Tooltip>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  ) : (
                    <>
                      <Skeleton.Input active={true} size="small" />
                      <div className="flex gap-3">
                        <Skeleton.Node active={true} className="max-w-[70px] max-h-[70px] !rounded-none" />
                      </div>
                    </>
                  )
                ) : null}

                {selectedProductObject?.accent_diamond_id ? (
                  product?.jewelry_id ? (
                    <div className="flex flex-col items-start gap-[8px] md:gap-[8px] self-stretch relative">
                      <div className="flex items-center justify-between gap-5 self-stretch">
                        {jewelryMetadata?.accent_diamond_id && (
                          <Text size="textxl" className="!font-light !font-sans uppercase">
                            Accent Stone
                          </Text>
                        )}
                      </div>
                      <div>
                        <div className="grid lg:grid-cols-3 grid-cols-6 sm:grid-cols-4 gap-[5px]">
                          {accentOneStoneVariant &&
                            // _.uniqBy(accentOneStoneVariant, (el: any) => el.color?.name)
                            accentOneStoneVariant?.map((item: any, i: number) => {
                              return (
                                <div
                                  key={i}
                                  className={`!font-sans flex gap-1 flex-col justify-center items-center !px-1 border-[1.5px] rounded-full ${
                                    (isSilverMetal
                                      ? jewelryMetadata?.accent_diamond_id === item?.color?.id
                                      : jewelryMetadata?.accent_diamond_id === item?.color?.id) ||
                                    productFilter?.find((el: any) => el.id == jewelryMetadata.accent_diamond_id)?.name ==
                                      productFilter?.find((el: any) => el.id == item?.color?.id)?.name
                                      ? 'border-[#17381d]'
                                      : 'border-transparent'
                                  } !font-medium !aspect-square tracking-[1px] cursor-pointer`}
                                  onClick={async () => {
                                    const new_slug = await getSkuSlug(
                                      productVariant,
                                      selectedProductObject?.metal_type_id,
                                      selectedProductObject?.metal_color_id,
                                      selectedProductObject?.shape_id,
                                      selectedProductObject?.carat_id,
                                      selectedProductObject?.custom_stone_id,
                                      selectedProductObject?.center_diamond_id,
                                      item?.color?.id,
                                      selectedProductObject?.second_accent_diamond_id,
                                      String(selectedProductObject?.premade_carat_weight),
                                      selectedProductObject?.bracelet_length_ids ?? null,
                                      selectedProductObject?.band_width_ids ?? null,
                                      selectedProductObject?.center_shape_id,
                                    );
                                    changeRouter(
                                      searchParams?.get('id')
                                        ? `custom-jewelry?type=2&state=s&id=${new_slug}${dId ? `&did=${dId}` : ''}`
                                        : `${selectedJewelryType}/premade?slug=${new_slug}`,
                                    );
                                  }}
                                >
                                  <Tooltip title={productFilter?.find((el: any) => el.id === item?.color?.id)?.name}>
                                    <Image
                                      src={`${productFilter?.find((el: any) => el.id == item?.color?.id)?.image?.[0]}`}
                                      alt={`${i}-img`}
                                      width={30}
                                      height={30}
                                      preview={false}
                                      className="h-[70px] w-[70px] object-cover"
                                    />
                                  </Tooltip>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Skeleton.Input active={true} size="small" />
                      <div className="flex gap-3">
                        <Skeleton.Node active={true} className="max-w-[70px] max-h-[70px] !rounded-none" />
                      </div>
                    </>
                  )
                ) : null}
                {selectedProductObject?.second_accent_diamond_id ? (
                  product?.jewelry_id ? (
                    <div className="flex flex-col items-start gap-[8px] md:gap-[8px] self-stretch relative">
                      <div className="flex items-center justify-between gap-5 self-stretch">
                        {jewelryMetadata?.second_accent_diamond_id && (
                          <Text size="textxl" className="!font-light !font-sans uppercase">
                            Accent Stone 2
                          </Text>
                        )}
                      </div>
                      <div>
                        <div className="grid lg:grid-cols-3 grid-cols-6 sm:grid-cols-4 gap-[5px]">
                          {accentTwoStoneVariant &&
                            // _.uniqBy(accentTwoStoneVariant, (el: any) => el.color?.name)
                            accentTwoStoneVariant?.map((item: any, i: number) => {
                              return (
                                <div
                                  key={i}
                                  className={`!font-sans gap-1 flex flex-col justify-center items-center !px-1 border-[1.5px] rounded-full ${
                                    (isSilverMetal
                                      ? jewelryMetadata?.second_accent_diamond_id === item?.color?.id
                                      : jewelryMetadata?.second_accent_diamond_id === item?.color?.id) ||
                                    productFilter?.find((el: any) => el.id == jewelryMetadata.second_accent_diamond_id)?.name ==
                                      productFilter?.find((el: any) => el.id == item?.color?.id)?.name
                                      ? 'border-[#17381d]'
                                      : 'border-transparent'
                                  } !font-medium !aspect-square tracking-[1px] cursor-pointer`}
                                  onClick={async () => {
                                    const new_slug = await getSkuSlug(
                                      productVariant,
                                      selectedProductObject?.metal_type_id,
                                      selectedProductObject?.metal_color_id,
                                      selectedProductObject?.shape_id,
                                      selectedProductObject?.carat_id,
                                      selectedProductObject?.custom_stone_id,
                                      selectedProductObject?.center_diamond_id,
                                      selectedProductObject?.accent_diamond_id,
                                      item?.color?.id,
                                      String(selectedProductObject?.premade_carat_weight),
                                      selectedProductObject?.bracelet_length_ids ?? null,
                                      selectedProductObject?.band_width_ids ?? null,
                                      selectedProductObject?.center_shape_id,
                                    );
                                    changeRouter(
                                      searchParams?.get('id')
                                        ? `custom-jewelry?type=2&state=s&id=${new_slug}${dId ? `&did=${dId}` : ''}`
                                        : // : `${selectedJewelryType}/${new_slug}`,
                                          `${selectedJewelryType}/premade?slug=${new_slug}`,
                                    );
                                  }}
                                >
                                  <Tooltip title={productFilter?.find((el: any) => el.id === item?.color?.id)?.name}>
                                    <Image
                                      src={`${productFilter?.find((el: any) => el.id == item?.color?.id)?.image?.[0]}`}
                                      alt={`${i}-img`}
                                      width={30}
                                      height={30}
                                      preview={false}
                                      className="h-[70px] w-[70px] object-cover"
                                    />
                                  </Tooltip>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Skeleton.Input active={true} size="small" />
                      <div className="flex gap-3">
                        <Skeleton.Node active={true} className="max-w-[70px] max-h-[70px]" />
                      </div>
                    </>
                  )
                ) : null}

                {product?.jewelry_id ? (
                  <div className="hidden flex-col items-start gap-[8px] md:gap-[8px] self-stretch relative">
                    <div className="flex items-center justify-between gap-5 self-stretch">
                      <Text size="textxl" className="!font-light !font-sans">
                        CARAT WEIGHT
                      </Text>
                    </div>
                    <div className="w-full">
                      <div className="flex flex-col gap-1.5 self-stretch">
                        <div className="flex flex-wrap gap-[10px]">
                          {productFilter
                            ?.filter((obj) => productVariant?.carat_id?.includes(obj.id))
                            ?.map((item: any, i: number) => {
                              return (
                                <div
                                  key={i}
                                  className={`!font-sans flex items-center justify-center p-2 w-10 ${
                                    productSKU?.diamondCarat == item?.code ? 'bg-[#818d64] border-none text-white' : 'border border-[#cacaca]'
                                  } !font-medium !aspect-square cursor-pointer`}
                                >
                                  {`${item?.name}`}
                                </div>
                              );
                            })}
                          {[1, 1.5, 2, 2.5, 3]?.map((item: any, i: number) => {
                            return (
                              <div
                                key={i}
                                className={`!font-sans flex items-center justify-center p-2 w-10 ${
                                  productSKU?.diamondCarat == item?.code ? 'bg-[#818d64] border-none text-white' : 'border border-[#cacaca]'
                                } !font-medium !aspect-square cursor-pointer`}
                              >
                                {`${item}`}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <Skeleton.Input active={true} size="small" />
                    <Skeleton.Input active={true} size="small" block />
                  </>
                )}
                {product?.jewelry_id ? (
                  showRingSizeSelector ? (
                    <div className="flex flex-col items-start gap-[8px] md:gap-[8px] self-stretch relative">
                      <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 self-stretch">
                        <div className="flex items-center gap-3">
                          <Text size="textxl" className="!font-light !font-sans whitespace-nowrap !text-[16px]">
                            RING SIZE
                          </Text>
                          <div className="flex gap-[10px]">
                            <Select
                              // showSearch
                              className={`!w-[120px] ${errorMessage ? '!outline !outline-red-500' : ''}`}
                              placeholder="Select a Ring Size"
                              defaultValue={ringSizeMaster?.[0]?.value}
                              value={
                                searchParams?.get('id')
                                  ? selectedRingSize
                                    ? selectedRingSize
                                    : null
                                  : !selectedRingSizeRedux
                                    ? null
                                    : selectedRingSizeRedux
                              }
                              onChange={(value: number | string) => {
                                setSelectedSize(value);
                                if (searchParams?.get('id')) {
                                  dispatch(setSelectedRingSize(value));
                                } else {
                                  dispatch(setSelectedRingSizeRedux(value));
                                }
                                dispatch(setSelectedRingSizeId(ringSizeMasterData?.find((el: any) => el?.name == value)?.id));
                                if (value !== 0) {
                                  setCustomRingSize(''); // Clear custom size if not "Other Size"
                                  setErrorMessage('');
                                }
                              }}
                              // filterOption={(input, option) => ((option?.label) ?? '').toLowerCase().includes(input.toLowerCase())}
                              // filterOption={(input, option) => {
                              //   // Extract both name and rate from the label
                              //   const labelText = option?.label ? option.label.props.children.join(' ') : ''; // Combining both name and rate
                              //   console.log(labelText.toString().toLowerCase().includes(input.toLowerCase()));

                              //   return labelText.toString().toLowerCase().includes(input.toLowerCase());
                              // }}
                              options={ringSizeMaster}
                            />
                            {selectedSize === 0 && (
                              <div className="relative">
                                <Input
                                  maxLength={5}
                                  value={customRingSize}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    if (searchParams?.get('id')) {
                                      dispatch(setSelectedRingSize(e.target.value));
                                    }
                                    setCustomRingSize(e.target.value);
                                    setErrorMessage('');
                                  }}
                                  placeholder="Size Eg. 4.25"
                                  className={`!w-[150px] ${errorMessage ? '!border !border-red-500' : ''}`}
                                />
                                {/* Show error message if validation fails */}
                                {errorMessage && (
                                  <Text className="!text-[10px] text-nowrap absolute" style={{ color: 'red', marginTop: '8px' }}>
                                    {errorMessage}
                                  </Text>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsRingSizeChartOpen(true)}
                          className="flex items-center gap-2 !font-sans text-[15px] text-secondary underline underline-offset-4 hover:opacity-80 cursor-pointer whitespace-nowrap"
                        >
                          <PiRuler className="h-5 w-5" />
                          Ring Size Chart
                        </button>
                      </div>
                      {errorMessage && (
                        <div className="relative">
                          <Text className="!text-[10px] text-nowrap absolute" style={{ color: 'red', marginTop: '8px' }}>
                            {errorMessage}
                          </Text>
                        </div>
                      )}
                      <RingSizeChartModal open={isRingSizeChartOpen} onClose={() => setIsRingSizeChartOpen(false)} />
                    </div>
                  ) : (
                    ''
                  )
                ) : (
                  <>
                    <Skeleton.Input active={true} size="small" />
                    <Skeleton.Button active={true} block />
                  </>
                )}
              </div>
            </div>
          </div>
          {!searchParams?.get('id') && (
            <>
              <div className="flex flex-col gap-1 md:gap-[1px]">
                {product?.estimated_delivery_days || jewelryMetadata?.handling_dates?.length >= 0 ? (
                  isRingSizeType ? (
                    <>
                      {jewelryMetadata?.handling_dates && jewelryMetadata?.handling_dates?.length !== 0 && (
                        <Text size="textmd" className="!text-[#707070] flex gap-1.5 items-center">
                          <span className="flex items-center gap-1.5">
                            <span>
                              {' '}
                              <BsBoxSeam className="h-4 w-4" />{' '}
                            </span>{' '}
                            Usually ships within{' '}
                            {jewelryMetadata?.handling_dates?.find((el: any) => el.ring_size_id == selectedRingSizeId)?.shipping_date ??
                              jewelryMetadata?.handling_dates?.[0]?.shipping_date}{' '}
                            to{' '}
                            {(jewelryMetadata?.handling_dates?.find((el: any) => el.ring_size_id == selectedRingSizeId)?.shipping_date ??
                              jewelryMetadata?.handling_dates?.[0]?.shipping_date) + 1}{' '}
                            days
                          </span>
                        </Text>
                      )}
                      <Text size="textmd" className="!text-[#707070] flex gap-1.5 items-center">
                        <span>
                          {' '}
                          <PiTruck className="h-4 w-4" />
                        </span>{' '}
                        Estimated Delivery Date:{' '}
                        {jewelryMetadata?.handling_dates?.findIndex((el: any) => el.ring_size_id == selectedRingSizeId) >= 0
                          ? jewelryMetadata?.handling_dates?.find((el: any) => el.ring_size_id == selectedRingSizeId)?.estimation_date
                          : (jewelryMetadata?.handling_dates?.[0]?.estimation_date ??
                            dayjs().add(product?.estimated_delivery_days, 'day').format('MMMM DD, YYYY'))}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text size="textmd" className="!text-[#707070] flex gap-1.5 items-center">
                        {jewelryMetadata?.handling_dates && jewelryMetadata?.handling_dates?.length !== 0 && (
                          <span className="flex items-center gap-1.5">
                            <span>
                              {' '}
                              <BsBoxSeam className="h-4 w-4" />{' '}
                            </span>{' '}
                            Usually ships within {jewelryMetadata?.handling_dates?.[0]?.shipping_date} to{' '}
                            {jewelryMetadata?.handling_dates?.[0]?.shipping_date + 1} days
                          </span>
                        )}
                      </Text>
                      <Text size="textmd" className="!text-[#707070] flex gap-1.5 items-center">
                        <span>
                          {' '}
                          <PiTruck className="h-4 w-4" />
                        </span>{' '}
                        Estimated Delivery Date:{' '}
                        {jewelryMetadata?.handling_dates?.length > 0
                          ? jewelryMetadata?.handling_dates?.[0]?.estimation_date
                          : dayjs().add(product?.estimated_delivery_days, 'day').format('MMMM DD, YYYY')}
                      </Text>
                    </>
                  )
                ) : (
                  <>
                    <Skeleton.Input active={true} block={true} size="small" />
                  </>
                )}
              </div>
              <div className="flex flex-col gap-3">
                {selectedProduct?.is_engraving ? <Engraving setEngravingText={setEngravingText} engravingText={engravingText} /> : null}
                {/* Expandable Box */}
                {product?.jewelry_id ? (
                  <>
                    <div className=" border p-4">
                      <div
                        className="!cursor-pointer font-medium !text-[#707070] flex items-center justify-between"
                        onClick={() => setIsExpanded(!isExpanded)}
                      >
                        <Text size="textxl" className="!font-light  !cursor-pointer !font-sans !text-[16px]">
                          APPRAISAL & WARRANTY
                        </Text>
                        {isExpanded ? (
                          <FiMinus className="h-[18px] w-[18px] cursor-pointer" />
                        ) : (
                          <FiPlus className="h-[18px] w-[18px] cursor-pointer" />
                        )}
                      </div>
                      <div
                        className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
                      >
                        <div className="mt-4 flex flex-col gap-2 !text-[#707070]">
                          <Checkbox checked={isChecked} onChange={handleCheckboxChange} className="mb-2">
                            <Text className="!font-light !font-sans !text-[16px]">{warrantyData?.warrantyName}</Text>
                          </Checkbox>

                          {isChecked && (
                            <Radio.Group onChange={handleRadioChange} value={selectedYear}>
                              <div className="grid grid-cols-2 gap-2 ml-1">
                                {warrantyData?.yearPriceList?.map((item: any) => (
                                  <Radio key={item?.year} value={item?.year} className="col-span-1" checked={item?.year === selectedYear}>
                                    {item?.year} Year (+ ${item?.price})
                                  </Radio>
                                ))}
                              </div>
                            </Radio.Group>
                          )}
                          <Checkbox onChange={handleAppraisalChange} checked={is_appraisal}>
                            <Text className="!font-light !font-sans !text-[16px]">{`${appraisalData?.appraisalName} (+ $${appraisalData?.price})`}</Text>
                          </Checkbox>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <Skeleton.Input active={true} size="small" />
                  </>
                )}
              </div>
            </>
          )}

          <div className={`flex flex-col gap-2 md:gap-[1px] ${!searchParams?.get('id') ? '-mt-4 md:mt-0' : ''}`}>
            {product?.jewelry_id ? (
              <>
                {!searchParams?.get('id') ? (
                  <>
                    {/* Tablet: "Custom Request" needs ~171px and never shrinks, so in the narrow details
                        column (551-900px) it ran past the column edge. In this band each button sizes to its
                        label and they wrap onto two full-width rows only when they cannot sit side by side. */}
                    <div className="flex items-center justify-between gap-2 [@media(min-width:551px)_and_(max-width:1024px)]:flex-wrap">
                      <Button
                        type="default"
                        className="w-full !text-text_w !bg-secondary lg:text-[18px] sm:px-4 uppercase tracking-[1px] mt-1 border-2 [@media(min-width:551px)_and_(max-width:1024px)]:!w-auto [@media(min-width:551px)_and_(max-width:1024px)]:grow [@media(min-width:551px)_and_(max-width:1024px)]:basis-auto"
                        loading={loading}
                        onClick={handleAddtocart}
                        disabled={count < 1}
                      >
                        Buy Now
                      </Button>
                      <Button
                        type="default"
                        className="w-full !bg-text_w !text-secondary lg:text-[18px] sm:px-4 uppercase tracking-[1px] mt-1 border-2 [@media(min-width:551px)_and_(max-width:1024px)]:!w-auto [@media(min-width:551px)_and_(max-width:1024px)]:grow [@media(min-width:551px)_and_(max-width:1024px)]:basis-auto"
                        // onClick={handleAddtocart}
                        onClick={() => setOpenCustomRequest(true)}
                        disabled={count < 1}
                      >
                        Custom Request
                      </Button>
                      <CustomRequestForm
                        open={openCustomRequest}
                        onClose={() => setOpenCustomRequest(false)}
                        data={{
                          sku_id: jewelryMetadata?.id,
                          title: product?.fullTitle,
                          image: jewelryMetadata?.carat_images?.[0],
                          sku_code: selectedProductObject?.sku_code,
                        }}
                      />
                    </div>
                    {/* Express checkout for this product alone — the cart is left as it is. */}
                    {shopPayLine.items.length > 0 && (
                      <ShopPayExpressButton
                        cartProducts={shopPayLine.items}
                        canStart={canStartShopPay}
                        includeFreeGift={false}
                        clearCartOnSuccess={false}
                      />
                    )}
                  </>
                ) : (
                  <div className="flex flex-col gap-5 md:pt-3">
                    <Button
                      onClick={() => {
                        if (!selectedRingSize && (selectedJewelryType == 'engagement-rings' || selectedJewelryType == 'wedding-bands')) {
                          setErrorMessage('Please enter a valid ring size!');
                          return;
                        }
                        if (selectionRoute === 1) {
                          if (selectedSettingStore === null) {
                            router.push(carryForwardFilterCrumb(`custom-jewelry?type=1&state=s&id=${slug}`, searchParams));
                          } else {
                            router.push(carryForwardFilterCrumb(`custom-jewelry?type=1&state=c&id=${slug}&did=${dId}`, searchParams));
                          }
                        } else if (selectionRoute === 2) {
                          if (selectedDiamondStore === null) {
                            router.push(carryForwardFilterCrumb(`custom-jewelry?type=2&state=d&id=${slug}`, searchParams));
                          } else {
                            router.push(carryForwardFilterCrumb(`custom-jewelry?type=2&state=c&id=${slug}&did=${dId}`, searchParams));
                          }
                        }
                      }}
                      className=" self-stretch !text-text_w !bg-secondary w-full !h-[45px] tracking-[1.50px] 2xl:text-[16px] xl:w-full xl:text-[16px] lg:w-full lg:text-[14px] lg:!h-[37px]"
                    >
                      {selectionRoute === 1
                        ? selectedSettingStore === null
                          ? 'SELECT THIS DIAMOND '
                          : 'COMPLETE SELECTION'
                        : selectionRoute == 2
                          ? selectedDiamondStore === null
                            ? 'SELECT THIS SETTING'
                            : 'COMPLETE SELECTION'
                          : null}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <>
                <Skeleton.Button active={true} block={true} size="large" />
              </>
            )}
          </div>
          {product?.jewelry_id ? (
            <WhyAllorya compact />
          ) : (
            <div className="-mt-4 md:-mt-2 -mb-4 md:-mb-2 w-full rounded-xl bg-gray-100 px-4 py-6 sm:px-3">
              <div className="mb-5 flex justify-center">
                <Skeleton.Input active={true} size="small" className="!min-w-[120px] !w-[120px] !h-[14px]" />
              </div>
              <div className="grid grid-cols-5 gap-x-2 gap-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 text-center">
                    <Skeleton.Node active={true} className="!h-7 !w-7 !min-h-0 !min-w-0 sm:!h-5 sm:!w-5" />
                    <Skeleton.Input active={true} size="small" className="!min-w-[48px] !w-[48px] !h-[10px]" />
                  </div>
                ))}
              </div>
            </div>
          )}
          {productDetailsSection}
          <div className="flex flex-col gap-[14px] 2xl:gap-4 lg:gap-4 md:gap-[10px]">
            {product?.jewelry_id ? (
              <Text size="textxl" className="!font-thin !font-sans hidden">
                <Link href="/shipping-returns">SHIPPING & RETURNS</Link>
              </Text>
            ) : (
              <>
                <Skeleton.Input active={true} block={false} size="large" />
              </>
            )}
            {product?.jewelry_id ? (
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
            ) : (
              <>
                <Skeleton.Input active={true} block={true} size="large" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDPPage;

function MetalColorOptions({
  productFilter,
  productVariant,
  selectedJewelryType,
  slug,
  sId,
  dId,
  selectedProductObject,
  productSKU,
  selectedProduct,
  changeRouter,
}: any) {
  const selectedMetal = productVariant?.find(
    (item: any) => item?.id === selectedProduct?.jewelry_sku?.find((el: any) => el.sku_slug == slug)?.metal_type_id,
  );
  const selectedJewelryMetalType: any = productFilter?.filter((color: any) =>
    selectedMetal?.metal_color_id?.map((el: any) => el?.id).includes(color?.id),
  );
  const metalColor: any = selectedMetal?.metal_color_id?.map((el: any) => ({
    id: el.id,
    sku_slug: el.sku_slug,
  }));
  return (
    <div className="flex gap-[10px]">
      {selectedProduct?.jewelry_id ? (
        metalColor?.map((color: any, index: number) => {
          const newObj = selectedJewelryMetalType?.find((el: any) => el?.id === color?.id);
          // Short swatch label: "Rose Gold" -> "Rose", "925 Sterling Silver - White Gold Plated" -> "White".
          const colorLabel = String(newObj?.name ?? '')
            .replace(/^\s*925\s*sterling\s*silver\s*-?\s*/i, '')
            .replace(/\s*(gold|rhodium)?\s*plated\s*$/i, '')
            .replace(/\s*gold\s*$/i, '')
            .trim();

          return (
            <div
              key={index}
              className={`flex flex-col items-center gap-1 pb-0.5 ${productSKU?.metalColor === newObj?.code ? ' border-b border-[#18381d] ' : ''}`}
            >
              <Image
                src={newObj?.image?.[0]}
                height={40}
                preview={false}
                width={40}
                fallback="/images/no_images.svg"
                onClick={async () => {
                  const new_slug = await getSkuSlug(
                    productVariant,
                    selectedProductObject?.metal_type_id,
                    color?.id,
                    selectedProductObject?.shape_id,
                    selectedProductObject?.carat_id,
                    selectedProductObject?.custom_stone_id,
                    selectedProductObject?.center_diamond_id,
                    selectedProductObject?.accent_diamond_id,
                    selectedProductObject?.second_accent_diamond_id,
                    String(selectedProductObject?.premade_carat_weight),
                    selectedProductObject?.bracelet_length_ids ?? null,
                    selectedProductObject?.band_width_ids ?? null,
                    selectedProductObject?.center_shape_id,
                  );
                  changeRouter(
                    sId
                      ? `custom-jewelry?type=2&state=s&id=${new_slug}${dId ? `&did=${dId}` : ''}`
                      : `${selectedJewelryType}/premade?slug=${new_slug}`,
                  );
                }}
                alt="image"
                className={`${productSKU?.metalColor === newObj?.code ? '' : 'opacity-70'} cursor-pointer aspect-square`}
              />
              {colorLabel && <span className="!font-sans text-[12px] leading-tight text-[#1a1a1a]">{colorLabel}</span>}
            </div>
          );
        })
      ) : (
        <div className="flex gap-3">
          <Skeleton.Button active={true} size="small" />
          <Skeleton.Button active={true} size="small" />
          <Skeleton.Button active={true} size="small" />
        </div>
      )}
    </div>
  );
}
