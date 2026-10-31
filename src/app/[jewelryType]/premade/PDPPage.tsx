/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable import/no-unresolved */
/* eslint-disable no-unsafe-optional-chaining */
'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState, startTransition } from 'react';

import { Button, Checkbox, ConfigProvider, Input, Radio, Select, Skeleton } from 'antd';
import dayjs from 'dayjs';
import _ from 'lodash';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { LuLoader } from 'react-icons/lu';
import { PiRuler } from 'react-icons/pi';

import ShopPayExpressButton from '@/app/cart/ShopPayExpressButton';
import ShareButton from '@/components/ShareButton';
import { BRAND } from '@/config/brand';
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
import { metalToneFor } from '@/utils/metalTone';
import { trackAddToCart, trackAddToWishlist, trackViewContent } from '@/utils/metaPixel';

import CompareMetalsModal from './CompareMetalsModal';
import CustomRequestForm from './CustomRequestForm';
import PdpAssurance from './pdp/PdpAssurance';
import PdpAtelier from './pdp/PdpAtelier';
import PdpBuyBar from './pdp/PdpBuyBar';
import PdpDetails from './pdp/PdpDetails';
import PdpEngraving from './pdp/PdpEngraving';
import PdpGallery, { buildGalleryMedia, Viewport } from './pdp/PdpGallery';
import { ChoiceChip, ImageSwatch, MetalSwatch, OptionGroup } from './pdp/PdpOptions';
import PdpReviews from './pdp/PdpReviews';
import PdpSuggestions from './pdp/PdpSuggestions';
import { pdpTheme } from './pdp/pdpTheme';
import useRecentlyViewed, { RecentlyViewedCard } from './pdp/useRecentlyViewed';
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
  const [swiperData, setSwiperData] = useState<any>(null);
  const [isVideo, setIsVideo] = useState<any>(false);
  const [isVideo2, setIsVideo2] = useState<any>(false);
  const [productPrice, setProductPrice] = useState<number>(0);
  const [preMadeCarats, setPreMadeCarats] = useState<any>();
  const [videoOne, setVideoOne] = useState<any>(null);
  const [videoTwo, setVideoTwo] = useState<any>(null);
  const [is360, setIs360] = useState<any>(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageComponent, setImageComponent] = useState<any>();
  const [isExpanded, setIsExpanded] = useState(false);
  const [is_appraisal, setIsAppraisalSelected] = useState(appraisal); // State to track checkbox selection
  const [isChecked, setIsChecked] = useState<any>(warranty);
  const [selectedYear, setSelectedYear] = useState<number | null>(year);
  const [selectedYearValue, setSelectedYearValue] = useState<any>(null);
  const [openCustomRequest, setOpenCustomRequest] = useState(false);
  const [preMadeBraceletLength, setPreMadeBraceletLength] = useState<any>();
  // BRACELET_LENGTH
  const [preMadeBandWidth, setPreMadeBandWidth] = useState<any>();
  const [topOffset, setTopOffset] = useState<any>(0);
  // Gate the 360 iframes on viewport. Hiding with CSS is not enough — iOS Safari still
  // boots a hidden iframe's WebGL context, and two live 360 views cause an OOM kill.
  // 'unknown' until measured, so neither layout mounts an iframe it would then discard.
  const [viewport, setViewport] = useState<Viewport>('unknown');
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }
    const mq = window.matchMedia('(min-width: 770px)');
    const update = () => setViewport(mq.matches ? 'desktop' : 'mobile');
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  const isCustomFlow = Boolean(searchParams?.get('id'));
  const cRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const [ctaOutOfView, setCtaOutOfView] = useState(false);
  const [footerInView, setFooterInView] = useState(false);

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

      // A panel taller than the viewport gets a negative top, so it scrolls through and then sticks by its bottom edge.
      let topValue = '';
      if (vw >= 1024) {
        topValue = searchParams?.get('id') ? (offset - 80 > 0 ? `5rem` : `${offset}px`) : offset > 0 ? `0px` : `${offset}px`;
      } else if (vw >= 770) {
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
              brand: BRAND.name,
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
            brand: BRAND.name,
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
  // Material highlights appended to the metal line under the title. Metal, center stone (or shape in the
  // custom flow) and certificate are already on that line, so only the remaining details of the selected
  // SKU and the chosen ring size are listed here; each follows the variant switch and empty ones are dropped.
  const materialHighlights = useMemo(() => {
    const masterName = (id?: string | null): string | undefined => (id ? productFilter?.find((el: any) => el.id === id)?.name?.trim() : undefined);
    const withUnit = (name: string | undefined, unit: string) => (name && /^[\d.]+$/.test(name) ? `${name} ${unit}` : name);
    const prefixed = (prefix: string, value: string | undefined) => (value ? `${prefix} ${value}` : undefined);

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
      brand: BRAND.name,
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

  // ─── Presentation helpers ────────────────────────────────────────
  const findName = (id?: string | null) => productFilter?.find((el: any) => el.id === id)?.name;
  const goToSku = (newSlug?: string) =>
    changeRouter(
      isCustomFlow ? `custom-jewelry?type=2&state=s&id=${newSlug}${dId ? `&did=${dId}` : ''}` : `${selectedJewelryType}/premade?slug=${newSlug}`,
    );
  const isSizedRing = selectedJewelryType == 'engagement-rings' || selectedJewelryType == 'wedding-bands';

  const extrasPrice =
    (productPrice ? productPrice : 0) +
    (is_appraisal ? appraisalData?.price || 0 : 0) +
    (selectedYear !== null ? selectedYearValue?.price || 0 : 0) +
    (engravingText?.Text ? engraving?.data?.engraving_price || 0 : 0);
  const hasPrice = Boolean(jewelryMetadata?.selling_price);
  const isDiscounted = Boolean(jewelryMetadata?.discounted_price);
  const finalPrice = hasPrice ? Math.ceil((isDiscounted ? jewelryMetadata?.discounted_price : jewelryMetadata?.selling_price) + extrasPrice) : 0;
  const comparePrice = isDiscounted ? Math.ceil(jewelryMetadata?.selling_price + extrasPrice) : null;
  const offLabel = isDiscounted
    ? jewelryMetadata?.discount_type == (2 as any)
      ? `${jewelryMetadata?.discount_value}% off`
      : `${jewelryMetadata?.currency_symbol ?? ''}${jewelryMetadata?.discount_value} off`
    : null;

  // Solid gold reads "10K Solid Rose Gold (not plated)", silver "925 Sterling Silver, Rhodium Plated".
  const metalLine = isGoldMetal
    ? `${titleMetal} (not plated)`
    : isSilverMetal
      ? ['925 Sterling Silver', silverPlating].filter(Boolean).join(', ')
      : titleMetal;
  const centerStoneLine = isCustomFlow
    ? findName(jewelryMetadata?.shape_id)?.trim()
    : jewelryMetadata?.center_diamond_id && findName(jewelryMetadata?.center_diamond_id)
      ? `Center Stone ${findName(jewelryMetadata?.center_diamond_id)?.trim()}`
      : undefined;
  const certificateLine =
    product?.diamond_certificate === 1 ? 'GIA' : product?.diamond_certificate === 2 ? 'IGI' : product?.diamond_certificate === 3 ? 'DGLA' : undefined;
  const specLine =
    product?.jewelry_id && jewelryMetadata
      ? [metalLine, centerStoneLine, ...materialHighlights, certificateLine].filter((value) => Boolean(value && String(value).trim())).join(' · ')
      : '';

  const handling =
    (isRingSizeType && jewelryMetadata?.handling_dates?.find((el: any) => el.ring_size_id == selectedRingSizeId)) ||
    jewelryMetadata?.handling_dates?.[0];
  const shipsWithin = handling?.shipping_date;
  const estimatedDelivery = handling?.estimation_date ?? dayjs().add(product?.estimated_delivery_days, 'day').format('MMMM DD, YYYY');
  const deliveryNote = product?.jewelry_id ? (
    <p className="m-0">
      {shipsWithin != null && (
        <>
          Usually ships within {shipsWithin} to {shipsWithin + 1} days.{' '}
        </>
      )}
      Estimated delivery: <span className="text-ink">{estimatedDelivery}</span>.
    </p>
  ) : null;

  const isWishlisted = user ? Boolean(wId) : wishlist;
  const toggleWishlist = () => {
    if (!user) {
      setWishlist(!wishlist);
    }
    handleAddToWishlist();
  };

  const media = useMemo(() => buildGalleryMedia(jewelryMetadata), [jewelryMetadata]);

  useEffect(() => {
    const cta = ctaRef.current;
    if (!cta) {
      return;
    }
    const io = new IntersectionObserver(([entry]) => setCtaOutOfView(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    io.observe(cta);
    const footer = document.querySelector('footer');
    const fo = footer ? new IntersectionObserver(([entry]) => setFooterInView(entry.isIntersecting)) : null;
    if (footer && fo) {
      fo.observe(footer);
    }
    return () => {
      io.disconnect();
      fo?.disconnect();
    };
  }, [product?.jewelry_id]);

  const recentCard: RecentlyViewedCard | null = useMemo(() => {
    if (isCustomFlow || !product?.jewelry_id || !jewelryMetadata?.sku_slug || !selectedJewelryType) {
      return null;
    }
    return {
      jewelry_id: product.jewelry_id,
      sku_master_id: jewelryMetadata.id,
      slug: `${selectedJewelryType}/premade?slug=${jewelryMetadata.sku_slug}`,
      productName: product.title ?? product.fullTitle,
      productImage: jewelryMetadata.carat_images?.[0] ?? '/images/no_images.svg',
      productHoverImage: jewelryMetadata.carat_images?.[1] ?? '/images/no_images.svg',
      productPrice: jewelryMetadata.selling_price,
      jewelryTypeData: selectedJewelryType,
      jewelry_type: product?.subType?.jewelry_type?.name,
      is_customizable: false,
      discount_type: jewelryMetadata.discount_type,
      discount_value: jewelryMetadata.discount_value,
      discounted_price: jewelryMetadata.discounted_price,
      // Only what the PLP card reads, to keep localStorage small.
      jewelryDetails: {
        id: jewelryMetadata.id,
        sku_slug: jewelryMetadata.sku_slug,
        carat_images: jewelryMetadata.carat_images?.slice(0, 2),
        selling_price: jewelryMetadata.selling_price,
        discounted_price: jewelryMetadata.discounted_price,
        discount_type: jewelryMetadata.discount_type,
        discount_value: jewelryMetadata.discount_value,
        metal_type_id: jewelryMetadata.metal_type_id,
        metal_color_id: jewelryMetadata.metal_color_id,
      },
    };
  }, [isCustomFlow, product?.jewelry_id, jewelryMetadata?.id, selectedJewelryType]);
  const recentlyViewed = useRecentlyViewed(recentCard);

  const buyLabel = 'Add to bag';
  const loadingOptions = !product?.jewelry_id;
  const optionSkeleton = (
    <div className="grid gap-3">
      <Skeleton.Input active size="small" />
      <div className="flex gap-2">
        <Skeleton.Button active className="!rounded-none" />
        <Skeleton.Button active className="!rounded-none" />
        <Skeleton.Button active className="!rounded-none" />
      </div>
    </div>
  );

  if (isRetiredSlug || isInitialProductLoad || productGoneTarget) {
    return (
      // Full-screen so the layout's header and footer do not frame the loader.
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-paper">
        <LuLoader className="h-10 w-10 animate-spin text-ink" />
      </div>
    );
  }

  return (
    <ConfigProvider theme={pdpTheme}>
      {/* Keeps "Add to bag" in reach once the main button scrolls away. The custom-jewelry flow has its own stepper. */}
      {!isCustomFlow && (
        <PdpBuyBar
          title={product?.fullTitle ?? ''}
          summary={specLine}
          image={jewelryMetadata?.carat_images?.[0]}
          price={hasPrice ? formatCurrency(finalPrice) : ''}
          visible={ctaOutOfView && !footerInView}
          onBuy={handleAddtocart}
          buyLabel={buyLabel}
          loading={loading}
        />
      )}

      <section id="pdp-overview" className="mx-auto w-full max-w-[1440px] px-[clamp(16px,3.2vw,56px)] pb-[clamp(48px,6vw,80px)]">
        {!isCustomFlow && (
          <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 py-5 text-[12px] text-ink-soft md:py-3.5">
            <Link href="/" className="text-ink-soft hover:text-ink">
              Home
            </Link>
            <span aria-hidden>/</span>
            {selectedProduct?.subType?.jewelry_type?.name && (
              <>
                <Link href={`/${selectedJewelryType}`} className="text-ink-soft hover:text-ink">
                  {selectedProduct.subType.jewelry_type.name}
                </Link>
                <span aria-hidden>/</span>
              </>
            )}
            {searchParams?.get('filterLabel') && searchParams?.get('filterHref') && (
              <>
                <Link href={searchParams.get('filterHref') as string} className="text-ink-soft hover:text-ink">
                  {searchParams.get('filterLabel')}
                </Link>
                <span aria-hidden>/</span>
              </>
            )}
            <span aria-current="page" className="text-ink">
              {product?.title ?? ''}
            </span>
          </nav>
        )}

        <div
          className={`grid grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] items-start gap-[clamp(28px,4.5vw,80px)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:grid-cols-1 md:gap-7 ${
            isCustomFlow ? 'pt-5' : ''
          }`}
        >
          {/* Gallery */}
          <div className="min-w-0">
            <PdpGallery media={media} loading={!jewelryMetadata} title={product?.fullTitle ?? 'Product image'} viewport={viewport} />
          </div>

          {/* Buying column */}
          <div ref={cRef} className="sticky grid min-w-0 gap-[22px] pb-6 md:static" style={{ top: topOffset || 0 }}>
            <div className="grid gap-2">
              {selectedProduct?.subType?.jewelry_type?.name && (
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-teal">{selectedProduct.subType.jewelry_type.name}</span>
              )}
              {product?.fullTitle ? (
                <h1 className="m-0 text-balance font-cormorant text-[clamp(32px,3vw,42px)] font-medium leading-[1.05] tracking-[-0.005em] text-ink">
                  {product.fullTitle}
                </h1>
              ) : (
                <Skeleton active paragraph={{ rows: 1 }} title />
              )}
              {specLine && <p className="m-0 text-[14px] leading-snug text-ink-soft">{specLine}</p>}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-h-5 items-center gap-3">
                  {process.env.NEXT_PUBLIC_YOTPO_APP_INSTANCE_STAR_ID && <YotpoStarReview selectedProduct={selectedProduct} />}
                  {!isCustomFlow && (
                    <a href="#pdp-reviews" className="text-[13px] text-ink-soft underline underline-offset-[3px] hover:text-ink">
                      Read reviews
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {selectedProductObject?.sku_code && (
                    <span className="text-[11px] tabular-nums tracking-[0.12em] text-ink-soft">{selectedProductObject.sku_code}</span>
                  )}
                  {jewelryMetadata ? <ShareButton /> : <Skeleton.Input active size="small" style={{ width: 90, minWidth: 90, height: 20 }} />}
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              {hasPrice ? (
                <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
                  <span className="text-[22px] leading-none tabular-nums text-ink">{formatCurrency(finalPrice)}</span>
                  {comparePrice && <s className="text-[16px] tabular-nums text-ink-faint">{formatCurrency(comparePrice)}</s>}
                  {offLabel && <span className="text-[12px] font-semibold text-teal">{offLabel}</span>}
                  {(isSilverMetal || isGoldMetal) && (
                    <span className="self-center whitespace-nowrap border border-line px-2.5 py-[3px] text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                      {isSilverMetal ? 'Sterling Silver' : 'Solid Gold'}
                    </span>
                  )}
                </div>
              ) : (
                <Skeleton.Input active size="small" />
              )}
              {affirmPriceInCents >= 5000 &&
                (!isCustomFlow || dId) &&
                (typeof window === 'undefined' || (localStorage.getItem('currency') || 'USD') === 'USD') && (
                  <p
                    ref={affirmMessageRef}
                    className="affirm-as-low-as affirm-promo-message m-0 text-[13px] text-ink-soft"
                    data-page-type="product"
                    data-amount={affirmPriceInCents}
                  />
                )}
            </div>

            <hr className="m-0 h-px border-0 bg-line" />

            {/* Options */}
            {loadingOptions ? (
              <>
                {optionSkeleton}
                {optionSkeleton}
              </>
            ) : (
              <>
                {/* Premade products may offer several center shapes; shown first because the other options depend on it. */}
                {!dId && !customVariant?.length && centerShapeVariant?.length > 1 && (
                  <OptionGroup label="Center stone shape" value={findName(jewelryMetadata?.center_shape_id)}>
                    <div className="flex flex-wrap gap-2">
                      {centerShapeVariant.map((item: any) => (
                        <ImageSwatch
                          key={item?.shape}
                          active={jewelryMetadata?.center_shape_id === item?.shape}
                          src={productFilter?.find((el: any) => el.id === item?.shape)?.image?.[0]}
                          label={findName(item?.shape) ?? 'Shape'}
                          onClick={() => {
                            const newSlug = getSkuSlug(
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
                            changeRouter(`${selectedJewelryType}/premade?slug=${newSlug ?? item?.sku_slug}`);
                          }}
                        />
                      ))}
                    </div>
                  </OptionGroup>
                )}

                {metalGroups.length > 0 && (
                  <OptionGroup
                    label="Metal"
                    value={findName(jewelryMetadata?.metal_type_id)}
                    aside={
                      <button
                        type="button"
                        onClick={() => setIsCompareMetalsOpen(true)}
                        className="text-[13px] text-ink-soft underline underline-offset-[3px] transition-colors hover:text-ink"
                      >
                        Compare metals
                      </button>
                    }
                  >
                    {/* Plated silver and solid gold are grouped the way the metal line above names them. */}
                    <div className="flex flex-wrap gap-x-4 gap-y-3">
                      {metalGroups.map((group, groupIndex) => (
                        <div key={group.label || 'other'} className={`grid gap-1.5 ${groupIndex > 0 ? 'border-l border-line pl-4' : ''}`}>
                          {group.label && (
                            <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-soft">{group.label}</span>
                          )}
                          <div className="flex flex-wrap gap-2">
                            {group.items.map((item: any) => (
                              <ChoiceChip
                                key={item?.id}
                                active={jewelryMetadata?.metal_type_id === item?.id}
                                onClick={() =>
                                  goToSku(
                                    getSkuSlug(
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
                                    ),
                                  )
                                }
                              >
                                {item?.name}
                              </ChoiceChip>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    {isGoldMetal && (
                      <p className="m-0 bg-mist px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
                        <span className="font-medium text-ink">
                          Solid {selectedMetalTypeName?.toUpperCase()} gold all the way through, not plated.
                        </span>{' '}
                        Stamped {selectedMetalTypeName?.toUpperCase()}
                        {showRingSizeSelector ? ' inside the band' : ''}. The color will never wear off.
                      </p>
                    )}
                    {isSilverMetal &&
                      (() => {
                        const plating = silverPlating.replace(/plated$/i, 'plating').toLowerCase();
                        const karats: string[] = (metalGroups.find((group) => group.label === 'SOLID GOLD')?.items ?? []).map((item: any) =>
                          String(item?.name).split(' ')[0].toUpperCase(),
                        );
                        return (
                          <p className="m-0 bg-mist px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
                            <span className="font-medium text-ink">925 sterling silver{plating ? ` with ${plating}` : ''}</span>
                            {/^rhodium/.test(plating) ? ' for a bright white finish' : ''}. Plating can wear over time and can be re-plated.
                            {karats.length > 0 &&
                              ` Want solid gold? Choose ${karats.length > 1 ? `${karats.slice(0, -1).join(', ')} or ${karats[karats.length - 1]}` : karats[0]}.`}
                          </p>
                        );
                      })()}
                    <CompareMetalsModal open={isCompareMetalsOpen} onClose={() => setIsCompareMetalsOpen(false)} />
                  </OptionGroup>
                )}

                <OptionGroup label="Colour" value={selectedMetalColor?.replace('-', ' ')}>
                  <MetalColorOptions
                    productFilter={productFilter}
                    productVariant={productVariant}
                    selectedJewelryType={selectedJewelryType}
                    slug={slug}
                    selectedProductObject={selectedProductObject}
                    productSKU={productSKU}
                    selectedProduct={selectedProduct}
                    goToSku={goToSku}
                  />
                </OptionGroup>

                {customVariant?.length > 0 &&
                  (!dId ? (
                    <OptionGroup label="Shape" value={findName(jewelryMetadata?.shape_id)}>
                      <div className="flex flex-wrap gap-2">
                        {customVariant.map((item: any) => (
                          <ImageSwatch
                            key={item?.shape_id}
                            active={jewelryMetadata?.shape_id === item?.shape_id}
                            src={productFilter?.find((el: any) => el.id === item?.shape_id)?.image?.[0]}
                            label={findName(item?.shape_id) ?? 'Shape'}
                            onClick={() => {
                              dispatch(setSelectedShapesData(item?.shape_id));
                              goToSku(
                                getSkuSlug(
                                  selectedProductVariation,
                                  selectedProductObject?.metal_type_id,
                                  selectedProductObject?.metal_color_id,
                                  item?.shape_id,
                                  selectedProductObject?.carat_id,
                                  selectedProductObject?.custom_stone_id,
                                ),
                              );
                            }}
                          />
                        ))}
                      </div>
                    </OptionGroup>
                  ) : (
                    <OptionGroup label="Shape" value={selectedDiamondStore?.shape_name}>
                      <div className="flex flex-wrap items-center gap-2">
                        <ImageSwatch
                          active
                          src={productFilter?.find((el: any) => el.name === selectedDiamondStore?.shape_name)?.image?.[0]}
                          label={selectedDiamondStore?.shape_name ?? 'Shape'}
                        />
                        {selectedDiamondStore?.carats && (
                          <span className="border border-line px-3.5 py-2.5 text-[13px] tabular-nums text-ink">{selectedDiamondStore.carats} ct</span>
                        )}
                      </div>
                    </OptionGroup>
                  ))}

                {!dId && customVariant?.length > 0 && diamondColorData?.length > 0 && (
                  <OptionGroup label="Diamond colour" value={findName(jewelryMetadata?.custom_stone_id)}>
                    <div className="flex flex-wrap gap-2">
                      {diamondColorData.map((item: any) => (
                        <ImageSwatch
                          key={item?.id}
                          active={jewelryMetadata?.custom_stone_id === item?.id}
                          src={item?.image}
                          label={findName(item?.id) ?? 'Diamond colour'}
                          onClick={() =>
                            goToSku(
                              getSkuSlug(
                                selectedProductVariation,
                                selectedProductObject?.metal_type_id,
                                selectedProductObject?.metal_color_id,
                                selectedProductObject?.shape_id,
                                selectedProductObject?.carat_id,
                                item?.id,
                              ),
                            )
                          }
                        />
                      ))}
                    </div>
                  </OptionGroup>
                )}

                {selectedProductObject?.center_diamond_id && centerStoneVariant?.length > 0 && (
                  <OptionGroup label="Stone" value={findName(jewelryMetadata?.center_diamond_id)}>
                    <div className="flex flex-wrap gap-2">
                      {centerStoneVariant.map((item: any, i: number) => (
                        <ImageSwatch
                          key={`${item?.color?.id}-${i}`}
                          round
                          active={item?.color?.id === jewelryMetadata?.center_diamond_id}
                          src={productFilter?.find((el: any) => el.id == item?.color?.id)?.image?.[0]}
                          label={findName(item?.color?.id) ?? 'Stone'}
                          onClick={() =>
                            goToSku(
                              getSkuSlug(
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
                              ),
                            )
                          }
                        />
                      ))}
                    </div>
                  </OptionGroup>
                )}

                {selectedProductObject?.accent_diamond_id && accentOneStoneVariant?.length > 0 && (
                  <OptionGroup label="Accent stone" value={findName(jewelryMetadata?.accent_diamond_id)}>
                    <div className="flex flex-wrap gap-2">
                      {accentOneStoneVariant.map((item: any, i: number) => (
                        <ImageSwatch
                          key={`${item?.color?.id}-${i}`}
                          round
                          active={
                            jewelryMetadata?.accent_diamond_id === item?.color?.id ||
                            findName(jewelryMetadata?.accent_diamond_id) == findName(item?.color?.id)
                          }
                          src={productFilter?.find((el: any) => el.id == item?.color?.id)?.image?.[0]}
                          label={findName(item?.color?.id) ?? 'Accent stone'}
                          onClick={() =>
                            goToSku(
                              getSkuSlug(
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
                              ),
                            )
                          }
                        />
                      ))}
                    </div>
                  </OptionGroup>
                )}

                {selectedProductObject?.second_accent_diamond_id && accentTwoStoneVariant?.length > 0 && (
                  <OptionGroup label="Second accent stone" value={findName(jewelryMetadata?.second_accent_diamond_id)}>
                    <div className="flex flex-wrap gap-2">
                      {accentTwoStoneVariant.map((item: any, i: number) => (
                        <ImageSwatch
                          key={`${item?.color?.id}-${i}`}
                          round
                          active={
                            jewelryMetadata?.second_accent_diamond_id === item?.color?.id ||
                            findName(jewelryMetadata?.second_accent_diamond_id) == findName(item?.color?.id)
                          }
                          src={productFilter?.find((el: any) => el.id == item?.color?.id)?.image?.[0]}
                          label={findName(item?.color?.id) ?? 'Accent stone'}
                          onClick={() =>
                            goToSku(
                              getSkuSlug(
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
                              ),
                            )
                          }
                        />
                      ))}
                    </div>
                  </OptionGroup>
                )}

                {preMadeCarats?.length > 0 && (
                  <OptionGroup
                    label="Carat weight"
                    value={jewelryMetadata?.premade_carat_weight ? `${jewelryMetadata.premade_carat_weight} ct` : undefined}
                  >
                    <div className="flex flex-wrap gap-2">
                      {[...preMadeCarats]
                        .sort((a: any, b: any) => a - b)
                        .map((item: any) => (
                          <ChoiceChip
                            key={item}
                            active={jewelryMetadata?.premade_carat_weight == item}
                            onClick={() =>
                              goToSku(
                                getSkuSlug(
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
                                ),
                              )
                            }
                          >
                            {item}
                          </ChoiceChip>
                        ))}
                    </div>
                  </OptionGroup>
                )}

                {preMadeBraceletLength?.length > 0 && (
                  <OptionGroup label="Length" value="inches">
                    <div className="flex flex-wrap gap-2">
                      {preMadeBraceletLength.map((item: any) => (
                        <ChoiceChip
                          key={item?.id}
                          active={jewelryMetadata?.bracelet_length_ids == item?.id}
                          onClick={() =>
                            goToSku(
                              getSkuSlug(
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
                              ),
                            )
                          }
                        >
                          {findName(item?.id)}
                        </ChoiceChip>
                      ))}
                    </div>
                  </OptionGroup>
                )}

                {preMadeBandWidth?.length > 0 && (
                  <OptionGroup label="Band width" value="mm">
                    <div className="flex flex-wrap gap-2">
                      {preMadeBandWidth.map((item: any) => (
                        <ChoiceChip
                          key={item?.id}
                          active={jewelryMetadata?.band_width_ids == item?.id}
                          onClick={() =>
                            goToSku(
                              getSkuSlug(
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
                              ),
                            )
                          }
                        >
                          {findName(item?.id)}
                        </ChoiceChip>
                      ))}
                    </div>
                  </OptionGroup>
                )}

                {showRingSizeSelector && (
                  <OptionGroup
                    label="Ring size"
                    aside={
                      <button
                        type="button"
                        onClick={() => setIsRingSizeChartOpen(true)}
                        className="inline-flex items-center gap-1.5 text-[13px] text-ink-soft underline underline-offset-[3px] transition-colors hover:text-ink"
                      >
                        <PiRuler className="h-4 w-4" aria-hidden />
                        Ring size chart
                      </button>
                    }
                  >
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:grid-cols-1">
                      <Select
                        id="pdp-ring-size"
                        status={errorMessage ? 'error' : undefined}
                        placeholder="Select a ring size"
                        value={isCustomFlow ? (selectedRingSize ? selectedRingSize : null) : !selectedRingSizeRedux ? null : selectedRingSizeRedux}
                        onChange={(value: number | string) => {
                          setSelectedSize(value);
                          if (isCustomFlow) {
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
                        options={ringSizeMaster}
                        className="w-full"
                      />
                      {selectedSize === 0 && (
                        <Input
                          id="pdp-custom-ring-size"
                          maxLength={5}
                          value={customRingSize}
                          status={errorMessage ? 'error' : undefined}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            if (isCustomFlow) {
                              dispatch(setSelectedRingSize(e.target.value));
                            }
                            setCustomRingSize(e.target.value);
                            setErrorMessage('');
                          }}
                          placeholder="Your size, e.g. 4.25"
                          className="!w-[160px] sm:!w-full"
                        />
                      )}
                    </div>
                    {errorMessage && (
                      <p role="alert" className="m-0 text-[12px] text-danger">
                        {errorMessage}
                      </p>
                    )}
                    <RingSizeChartModal open={isRingSizeChartOpen} onClose={() => setIsRingSizeChartOpen(false)} />
                  </OptionGroup>
                )}
              </>
            )}

            {!isCustomFlow && selectedProduct?.is_engraving ? (
              <PdpEngraving setEngravingText={setEngravingText} engravingText={engravingText} />
            ) : null}

            {!isCustomFlow && product?.jewelry_id && (warrantyData?.warrantyName || appraisalData?.appraisalName) && (
              <OptionGroup label="Protect your piece">
                <div className="grid gap-3 border border-line p-4">
                  {warrantyData?.warrantyName && (
                    <Checkbox checked={isChecked} onChange={handleCheckboxChange}>
                      <span className="text-[13px] text-ink-soft">{warrantyData.warrantyName}</span>
                    </Checkbox>
                  )}
                  {isChecked && (
                    <Radio.Group onChange={handleRadioChange} value={selectedYear} className="!ml-6 grid grid-cols-2 gap-2 sm:grid-cols-1">
                      {warrantyData?.yearPriceList?.map((item: any) => (
                        <Radio key={item?.year} value={item?.year}>
                          <span className="text-[13px] tabular-nums text-ink-soft">
                            {item?.year} year{item?.year > 1 ? 's' : ''} (+{formatCurrency(item?.price)})
                          </span>
                        </Radio>
                      ))}
                    </Radio.Group>
                  )}
                  {appraisalData?.appraisalName && (
                    <Checkbox onChange={handleAppraisalChange} checked={is_appraisal}>
                      <span className="text-[13px] text-ink-soft">
                        {appraisalData.appraisalName} (+{formatCurrency(appraisalData?.price)})
                      </span>
                    </Checkbox>
                  )}
                </div>
              </OptionGroup>
            )}

            {/* Actions */}
            <div ref={ctaRef} className="grid gap-2.5">
              {product?.jewelry_id ? (
                !isCustomFlow ? (
                  <>
                    <div className="grid grid-cols-[minmax(0,1fr)_56px] gap-2">
                      <Button
                        type="primary"
                        block
                        loading={loading}
                        onClick={handleAddtocart}
                        disabled={count < 1}
                        className="!h-14 !border-ink !bg-ink !text-[12px] !font-semibold !uppercase !tracking-[0.18em] !text-paper hover:!border-ink-hover hover:!bg-ink-hover"
                      >
                        {buyLabel}
                      </Button>
                      <button
                        type="button"
                        aria-pressed={isWishlisted}
                        aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                        onClick={toggleWishlist}
                        className="grid h-14 w-14 place-items-center border border-line-strong text-ink transition-colors hover:border-ink"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          aria-hidden
                          className={`h-5 w-5 stroke-[1.3] ${isWishlisted ? 'fill-teal stroke-teal' : 'fill-none stroke-current'}`}
                        >
                          <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" />
                        </svg>
                      </button>
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
                    {/* Shop Pay's own validation message (e.g. a missing ring size) when the selector is out of view. */}
                    {errorMessage && !showRingSizeSelector && (
                      <p role="alert" className="m-0 text-[12px] text-danger">
                        {errorMessage}
                      </p>
                    )}
                    <Link
                      href="/virtual-appointment"
                      className="inline-flex h-12 items-center justify-center gap-2.5 border border-line-strong text-[13px] text-ink transition-colors hover:border-ink hover:text-ink"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden className="h-[17px] w-[17px] fill-none stroke-current stroke-[1.3]">
                        <path d="M3 6.5h13v11H3zM16 10.5l5-3v9l-5-3z" />
                      </svg>
                      See it live with a jeweler · Book a video call
                    </Link>
                    <button
                      type="button"
                      onClick={() => setOpenCustomRequest(true)}
                      className="justify-self-start pt-1 text-[13px] text-ink-soft underline underline-offset-[3px] transition-colors hover:text-ink"
                    >
                      Want something different? Request a custom version
                    </button>
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
                  </>
                ) : (
                  <Button
                    type="primary"
                    block
                    onClick={() => {
                      if (!selectedRingSize && isSizedRing) {
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
                    className="!h-14 !border-ink !bg-ink !text-[12px] !font-semibold !uppercase !tracking-[0.18em] !text-paper hover:!border-ink-hover hover:!bg-ink-hover"
                  >
                    {selectionRoute === 1
                      ? selectedSettingStore === null
                        ? 'Select this diamond'
                        : 'Complete selection'
                      : selectionRoute == 2
                        ? selectedDiamondStore === null
                          ? 'Select this setting'
                          : 'Complete selection'
                        : null}
                  </Button>
                )
              ) : (
                <Skeleton.Button active block size="large" className="!h-14" />
              )}
            </div>

            {!isCustomFlow && product?.jewelry_id && (
              <div className="grid gap-3 bg-mist px-[18px] py-4 text-[13px] text-ink-soft">
                <div className="flex items-start gap-3.5">
                  <svg viewBox="0 0 24 24" aria-hidden className="mt-0.5 h-[18px] w-[18px] flex-none fill-none stroke-navy stroke-[1.3]">
                    <path d="M2.5 6.5h11v10h-11zM13.5 10h4l3 3.2v3.3h-7" />
                    <circle cx="7" cy="17.5" r="1.8" />
                    <circle cx="17" cy="17.5" r="1.8" />
                  </svg>
                  <div className="grid gap-0.5">
                    <strong className="font-medium text-ink">Estimated delivery: {estimatedDelivery}</strong>
                    {shipsWithin != null && (
                      <span>
                        Usually ships within {shipsWithin} to {shipsWithin + 1} days.
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3.5">
                  <svg viewBox="0 0 24 24" aria-hidden className="mt-0.5 h-[18px] w-[18px] flex-none fill-none stroke-navy stroke-[1.3]">
                    <path d="M8 7L4 11l4 4M4 11h11a5 5 0 010 10h-3" />
                  </svg>
                  <span>
                    Insured shipping and easy returns.{' '}
                    <Link href="/returns-shipping" className="text-ink underline underline-offset-4 hover:text-ink">
                      See the policy
                    </Link>
                  </span>
                </div>
              </div>
            )}

            {!isCustomFlow && <PdpDetails deliveryNote={deliveryNote} />}
          </div>
        </div>
      </section>

      {/* Order (design-mockups/product-page-v4): reviews, pairings, atelier, promise band. */}
      <PdpReviews />
      <PdpSuggestions recentlyViewed={recentlyViewed} />
      <PdpAtelier />
      {!isCustomFlow && <PdpAssurance />}
    </ConfigProvider>
  );
};

export default PDPPage;

function MetalColorOptions({ productFilter, productVariant, slug, selectedProductObject, productSKU, selectedProduct, goToSku }: any) {
  const selectedMetal = productVariant?.find(
    (item: any) => item?.id === selectedProduct?.jewelry_sku?.find((el: any) => el.sku_slug == slug)?.metal_type_id,
  );
  const metalColors: any[] = selectedMetal?.metal_color_id ?? [];

  if (!selectedProduct?.jewelry_id) {
    return (
      <div className="flex gap-3">
        <Skeleton.Avatar active />
        <Skeleton.Avatar active />
        <Skeleton.Avatar active />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2.5">
      {metalColors.map((color: any) => {
        const master = productFilter?.find((el: any) => el?.id === color?.id);
        return (
          <MetalSwatch
            key={color?.id}
            active={productSKU?.metalColor === master?.code}
            tone={metalToneFor(productFilter, color?.id)}
            label={master?.name ?? 'Metal colour'}
            onClick={() =>
              goToSku(
                getSkuSlug(
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
                ),
              )
            }
          />
        );
      })}
    </div>
  );
}
