/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';

import { Button, Checkbox, Image, Input, Radio, Select, Skeleton } from 'antd';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { BsBoxSeam } from 'react-icons/bs';
import { FiMinus, FiPlus } from 'react-icons/fi';
import { PiTruck } from 'react-icons/pi';
import { TbTruckDelivery } from 'react-icons/tb';
import { FreeMode, Navigation, Thumbs } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import ImageZoom from '@/components/CustomImageZoom';
import ProtectedVideo from '@/components/ProtectedVideo';
import { IsRingSizeType } from '@/constants/Header';
import { RING_SIZE } from '@/constants/master.constant';
import {
  clearSelectedProduct,
  fetchProductsDetails,
  setSelectedAppraisal,
  setSelectedRingSizeId,
  setSelectedRingSizeRedux,
  setSelectedWarranty,
  useAppDispatch,
  useAppSelector,
} from '@/store';
import { fetchCartProducts } from '@/store/slices/Cart/cartSlice';
import {
  setCustomCarats,
  setCustomShapes,
  setSelectedCaratsData,
  setSelectedDiamondStore,
  setSelectedRingSize,
  setSelectedSettingRingPrice,
  setSelectedSettingSkuData,
  setSelectedSettingStore,
  setSelectedShapesData,
} from '@/store/slices/customProducts/customProductSlice';
import { formatCurrency } from '@/utils/common';
import { trackAddToCart } from '@/utils/metaPixel';

import { Text } from '../../components';
import { Engraving } from '../[jewelryType]/premade/Components/Engraving';

export default function CustomJewelryCompletePage({
  selectedSetting,
  selectedDiamond,
  dId,
  sId,
}: {
  dId: string | null;
  sId: string | null;
  selectedDiamond: any;
  selectedSetting: any;
}) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const productFilter = useAppSelector((state) => state?.master?.data);
  const masterRingSizePrice = useAppSelector((state) => state?.master?.ringSizePriceList);
  const [productSKU, setProductSKU] = useState<any>({});
  const { selectedDiamondStore, selectedSettingStore, selectedRingSize, selectedSettingRingPrice, selectedSettingSkuData } = useAppSelector(
    (s) => s.customProduct,
  );
  // eslint-disable-next-line prefer-const
  let year: number | null = null;
  // eslint-disable-next-line prefer-const
  let appraisal = false;
  // eslint-disable-next-line prefer-const
  let warranty = false;

  const master = useAppSelector((state) => state.master.data);
  const { appraisalData, warrantyData, engraving } = useAppSelector((state) => state.master);
  const selectedProductVariation = useAppSelector((state) => state.products?.selectedProduct?.product_variation);
  const { selectedRingSizeId, selectedProduct, selectedAppraisal, selectedWarranty, selectedEngraving } = useAppSelector((state) => state?.products);
  const { cartProducts, loading } = useAppSelector((state) => state?.cart);
  const { user } = useAppSelector((state) => state.auth.auth);

  const [selectedSettingType, setSelectedSettingType] = useState<any>();
  const [selectedSize, setSelectedSize] = useState<any>(3);
  const [customRingSize, setCustomRingSize] = useState<any>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [count] = useState(1);
  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);
  const [swiperData, setSwiperData] = useState<any>([]);
  const [isVideo, setIsVideo] = useState<any>(false);
  const [isVideo2, setIsVideo2] = useState<any>(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [videoOne, setVideoOne] = useState<any>(null);
  const [videoTwo, setVideoTwo] = useState<any>(null);
  const [isV360, setIsV360] = useState<any>(false);
  const [selectedJewelryType, setSelectedJewelryType] = useState<any>('');
  const [customVariant, setCustomVariants] = useState<any>();
  const [engravingText, setEngravingText] = useState<any>({
    Text: '',
    fontFamily: 'Arial',
  });
  const [selectedYear, setSelectedYear] = useState<number | null>(year);
  const [selectedYearValue, setSelectedYearValue] = useState<any>(null);
  const [is_appraisal, setIsAppraisalSelected] = useState(appraisal);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isChecked, setIsChecked] = useState<any>(false);
  const [topOffset, setTopOffset] = useState<any>(0);
  const cRef = useRef<HTMLDivElement>(null);
  const [jewelryMetadata, setJewelryMetadata] = useState<any>(
    selectedProduct?.product_details?.jewelry_sku?.find((item: any) => (item.sku_slug as string) == sId) || {},
  );

  // ─── Affirm Promo Messaging ──────────────────────────────────────
  const affirmPriceInCents = useMemo(() => {
    const base = selectedSettingType?.discounted_price ?? selectedSettingType?.selling_price ?? 0;
    const ring = selectedSettingRingPrice || 0;
    const diamond = selectedDiamondStore?.price ?? 0;
    const warrantyPrice = selectedWarranty?.yearPrice?.price ?? 0;
    const appraisalPrice = selectedAppraisal?.price ?? 0;
    const engrave = selectedEngraving ? engraving?.data?.engraving_price || 0 : 0;
    return Math.round((Number(base) + Number(ring) + Number(diamond) + Number(warrantyPrice) + Number(appraisalPrice) + Number(engrave)) * 100);
  }, [selectedSettingType, selectedSettingRingPrice, selectedDiamondStore, selectedWarranty, selectedAppraisal, selectedEngraving, engraving]);

  useEffect(() => {
    const tryRefresh = (attempt = 0) => {
      if (typeof (window as any).affirm?.ui?.refresh === 'function') {
        (window as any).affirm.ui.refresh();
        return;
      }
      if (attempt < 5) {
        setTimeout(() => tryRefresh(attempt + 1), 500);
      }
    };
    tryRefresh();
  }, [affirmPriceInCents]);

  useEffect(() => {
    if ((window as any).affirm?.checkout) {
      return;
    }

    const affirmPublicKey = process.env.NEXT_PUBLIC_AFFIRM_PUBLIC_KEY;
    const affirmJsUrl = process.env.NEXT_PUBLIC_AFFIRM_JS_URL;
    if (!affirmPublicKey || !affirmJsUrl) {
      return;
    }

    if (document.querySelector<HTMLScriptElement>('script[data-affirm-sdk="true"]')) {
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
    if (selectedWarranty != null) {
      const year = selectedWarranty?.yearPrice?.year;
      setSelectedYear(+year);
      setIsChecked(true);
      setIsExpanded(true);
    } else {
      if (selectedAppraisal != null) {
        setIsAppraisalSelected(true);
      }
    }
    if (selectedEngraving !== null) {
      setEngravingText({
        Text: selectedEngraving?.text || '',
        fontFamily: selectedEngraving?.fontFamily || 'Arial',
      });
    }
  }, [selectedWarranty, selectedAppraisal, selectedEngraving]);

  useEffect(() => {
    const updateOffset = () => {
      if (typeof window === 'undefined' || !cRef.current) {
        return;
      }

      const height = cRef.current.offsetHeight;
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const offset = vh - height;
      // const setTop = offset > 0 ? `10%` : `${offset - 20}px`;
      let topValue = '';
      if (vw >= 1024) {
        // lg screens
        topValue = offset - 80 > 0 ? `6rem` : `${offset - 20}px`;
      } else if (vw >= 768) {
        // md screens
        // topValue = 'top-20';
        topValue = offset - 130 > 0 ? `5rem` : `${offset - 20}px`;
      } else if (vw >= 640) {
        // sm screens
        topValue = '0px';
      } else {
        // xs screens
        topValue = '0px';
      }
      setTopOffset(topValue);
    };

    // Run after mount
    updateOffset();
    window.addEventListener('resize', updateOffset);
    return () => window.removeEventListener('resize', updateOffset);
  }, [selectedSettingStore?.product_details?.fullTitle]);

  function getPriceViaRingAndMetal(ringSize: null | string, metal: string) {
    const ProductPrice = masterRingSizePrice?.find((item: any) => item.ring_size_id == (ringSize ?? '0') && item.metal_type_id == metal);
    return ringSize ? ProductPrice?.rate : 0;
  }
  const genderWiseRing = masterRingSizePrice?.filter((el: any) => {
    if (selectedSettingSkuData?.gender_category == 2) {
      // return el.is_men == true && el.is_women == false;
      return el.is_men == true;
    } else {
      // return (el.is_men == false && el.is_women == true) || (el.is_men == true && el.is_women == true);
      return el.is_women == true;
    }
  });

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

  // `selectedJewelryType` is declared in this file but never assigned, so every comparison
  // against it is permanently false. Drive the ring-size behaviour off the setting's actual
  // jewelry type instead — the same value the selector below is gated on.
  const isRingSizeType = IsRingSizeType?.includes(selectedSettingStore?.product_details?.subType?.jewelry_type?.name);

  const ringSizeMasterData = productFilter
    .filter((ring) => ring.parent_code == 'RING_SIZE' && genderWiseRing.some((el) => el.ring_size_id == ring.id))
    .map((ring) => ({
      ...ring,
      rate: genderWiseRing.find((el) => el.ring_size_id == ring.id)?.rate || 0,
    }));

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
    }));
  const handleAddtocart = async () => {
    if (!selectedRingSize && isRingSizeType) {
      setErrorMessage('Please enter a valid ring size!');
      return;
    }
    // Clear the carried-over size only for products that take no size at all. This used to run
    // unconditionally (the comparison could never be true), wiping the selection on every add.
    if (!isRingSizeType) {
      dispatch(setSelectedRingSize(null));
      dispatch(setSelectedRingSizeRedux(null));
    }
    if (selectedSize === 0) {
      const customSizeRegex = /^[0-9]{1,2}(\.[0-9]{1,2})?$/;

      if (
        !customRingSize ||
        !customSizeRegex.test(customRingSize) ||
        parseFloat(customRingSize) > 20 ||
        parseFloat(customRingSize) < 3 ||
        customRingSize.length > 5
      ) {
        setErrorMessage('Please enter a valid ring size!');
        return;
      }
    }
    if (count > 0) {
      const payload = {
        jewelry_id: selectedSettingStore?.product_details?.jewelry_id,
        diamond_id: dId,
        count: count,
        sku_master: selectedSettingType?.id,
        is_appraisal: selectedAppraisal !== null,
        engravingText: { Text: selectedEngraving?.text ?? '', fontFamily: selectedEngraving?.fontFamily ?? '' },
        selectedYearValue: selectedWarranty?.yearPrice?.year,
        ring_size_id: masterRingSizePrice?.find(
          (item: any) => item.ring_size_id == selectedRingSizeId && item.metal_type_id == selectedSettingSkuData?.metal_type_id,
        )?.id,
      };

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

      const price =
        (Number(selectedSettingType?.discounted_price ?? selectedSettingType?.selling_price ?? 0) + Number(selectedDiamondStore?.price ?? 0)) * count;

      if (user) {
        const cartItems = cartProducts.some((p: any) => p.jewellry_id === payload.jewelry_id);
        if (!cartItems) {
          const response = await dispatch(fetchCartProducts({ data: [payload] }));
          if (response?.payload?.status === 200 || response?.payload?.status === 201) {
            trackAddToCart({
              content_ids: [String(payload.sku_master ?? selectedSettingType?.id)],
              value: price,
              currency: 'USD',
              num_items: count,
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
        } else {
          existingCart.push(payload);
          trackAddToCart({
            content_ids: [String(payload.sku_master ?? selectedSettingType?.id)],
            value: price,
            currency: 'USD',
            num_items: count,
          });
          router.push('/cart');
        }

        localStorage.setItem('cartItems', JSON.stringify(existingCart));
        router.push('/cart');
      }
      dispatch(clearSelectedProduct());
      dispatch(setSelectedSettingSkuData(null));
      dispatch(setSelectedSettingStore(null));
      dispatch(setSelectedDiamondStore(null));
    }
  };
  useEffect(() => {
    if ((selectedSettingStore && Object.keys(selectedSettingStore).length == 0) || !selectedSettingStore) {
      dispatch(fetchProductsDetails(sId as string));
    }
  }, [sId]);
  useEffect(() => {
    // This will run only on the client side
    setWindowWidth(window.innerWidth);

    // Optional: Update the window width on resize
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  useEffect(() => {
    if (selectedSettingStore && sId) {
      setSelectedSettingType(selectedSettingStore?.product_details?.jewelry_sku?.find((el: any) => el.sku_slug == sId));
    }
  }, [sId, selectedSettingStore]);
  useEffect(() => {
    const jewelryMetadata = selectedProduct?.product_details?.jewelry_sku?.find((item: any) => (item.sku_slug as string) == sId);
    const updatedJewelryMetadata = {
      ...jewelryMetadata,
      // diamond_certificate: jewelryMetadata?.diamond_certificate || 0,
      diamond_certificate: selectedProduct?.product_details?.diamond_certificate || 0, // Updated line
    };
    setJewelryMetadata(updatedJewelryMetadata);
    dispatch(setSelectedSettingSkuData(jewelryMetadata));
    dispatch(setSelectedSettingStore(selectedProduct));
    setSelectedJewelryType(selectedProduct?.product_details?.subType?.jewelry_type?.name?.toLowerCase().replace(/\s+/g, '-'));
    dispatch(setSelectedSettingRingPrice(getPriceViaRingAndMetal(selectedRingSizeId, selectedSettingSkuData?.metal_type_id)));
  }, [selectedRingSizeId, selectedProduct, selectedSettingStore]);

  useEffect(() => {
    if (!selectedDiamondStore?.videoFile && !selectedDiamondStore?.imageFile) {
      return;
    }

    const settingImageFiles = selectedSettingType?.carat_images;
    const settingVideoFiles = selectedSettingType?.carat_video;

    const sliderArray = settingImageFiles ? [...settingImageFiles] : [];

    if (settingVideoFiles?.[0]) {
      sliderArray.unshift(settingVideoFiles?.[0]);
    }
    // 360 image is on index 0
    if (selectedSettingType?.model_view && 'https://' == selectedSettingType.model_view.slice(0, 8)) {
      sliderArray.unshift(selectedSettingType?.model_view);
      setIsV360(true);
    }

    // if (jewelryMetadata?.carat_video?.length > 0) {
    //   const update = [sliderArray?.[0], jewelryMetadata?.carat_video?.[0], ...jewelryMetadata?.carat_images];
    //   setVideoOne(jewelryMetadata?.carat_video?.[0]);
    //   if (jewelryMetadata?.carat_video?.[1]) {
    //     setIsVideo2(true);
    //     update.push(jewelryMetadata?.carat_video?.[1]);
    //     setVideoTwo(jewelryMetadata?.carat_video?.[1]);
    //   }
    //   setIsVideo(true);
    //   setSwiperData(update);
    // } else {
    //   setSwiperData(sliderArray);
    // }
    // if (sliderArray.length == 0) {
    //   sliderArray.push('/images/no_images.svg');
    // }

    // first video on index 1
    if (settingVideoFiles?.length > 0) {
      const update = [...sliderArray];
      setVideoOne(settingVideoFiles?.[0]);
      // if (selectedDiamondStore?.imageFile) {
      //   update.push(selectedDiamondStore?.imageFile);
      // }
      if (settingVideoFiles?.[1]) {
        setIsVideo2(true);
        sliderArray.unshift(settingVideoFiles?.[1]);
        setVideoTwo(settingVideoFiles?.[1]);
      }
      // 360 Diamond iframe
      // if (selectedDiamondStore?.videoFile) {
      //   update.push(selectedDiamondStore?.videoFile);
      // }
      setIsVideo(true);
      setSwiperData(update);
    } else {
      // sliderArray.push(selectedDiamondStore?.imageFile);
      if (settingVideoFiles?.[1]) {
        sliderArray.unshift(settingVideoFiles?.[1]);
      }
      // 360 Diamond iframe
      // if (selectedDiamondStore?.videoFile) {
      //   sliderArray.push(selectedDiamondStore?.videoFile);
      // }
      setSwiperData(sliderArray);
    }
    // dispatch(setSelectedShapesData(selectedSettingType?.shape_id));
  }, [selectedDiamondStore, selectedSettingType]);
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

  useEffect(() => {
    const disableInspect = (event: any) => {
      if (
        (event.ctrlKey && event.shiftKey && event.keyCode === 73) || // Ctrl+Shift+I (Windows/Linux)
        (event.metaKey && event.altKey && event.keyCode === 73) || // ⌘+Option+I (macOS)
        (event.ctrlKey && event.shiftKey && event.keyCode === 74) || // Ctrl+Shift+J (Windows/Linux)
        (event.metaKey && event.altKey && event.keyCode === 74) || // ⌘+Option+J (macOS)
        (event.ctrlKey && event.keyCode === 85) || // Ctrl+U (Windows/Linux)
        (event.metaKey && event.keyCode === 85) || // ⌘+U (macOS)
        (event.ctrlKey && event.shiftKey && event.keyCode === 67) || // Ctrl+Shift+C (Windows/Linux)
        (event.metaKey && event.altKey && event.keyCode === 67) || // ⌘+Option+C (macOS)
        (event.metaKey && event.ctrlKey && event.shiftKey && event.keyCode === 67) || // ⌘+Ctrl+Shift+C (macOS)
        event.keyCode === 123 // F12 (Windows/Linux)
      ) {
        event.preventDefault();
        return false;
      }
    };
    const detectDevTools = () => {
      const before = new Date().getTime();
      // eslint-disable-next-line no-debugger
      debugger; // This forces DevTools to slow down
      const after = new Date().getTime();

      if (after - before > 100) {
        // If DevTools slows execution
        alert('DevTools is disabled on this site!');
        window.location.href = '/'; // Redirect to blank page
      }
    };
    // // Auto-check DevTools every 500ms
    // setInterval(() => {
    //   detectDevTools();
    // }, 500);

    // // Disable Right-Click
    // document.addEventListener('contextmenu', (e) => e.preventDefault());
    // document.addEventListener('keydown', disableInspect);

    // // Transparent Overlay (Stops Element Inspection)
    // const overlay = document.createElement('div');
    // overlay.style.position = 'fixed';
    // overlay.style.top = '0';
    // overlay.style.left = '0';
    // overlay.style.width = '100vw';
    // overlay.style.height = '100vh';
    // overlay.style.zIndex = '999999';
    // overlay.style.background = '#fff';
    // overlay.style.pointerEvents = 'none'; // Blocks mouse events
    // // document.body.appendChild(overlay);
    // return () => {
    //   document.removeEventListener('contextmenu', (e) => e.preventDefault());
    //   document.removeEventListener('keydown', disableInspect);
    // };
  }, []);

  return (
    <div className="w-full bg-[#ffffff]">
      <div className="flex w-full justify-center border-b border-solid border-[#3b3b3b] pb-[76px] lg:pb-8 md:pb-5 sm:pb-0">
        <div className="container-xs relative flex items-start justify-center gap-8 py-5 sm:py-2 lg:gap-5 2xl:px-[50px] xl:px-[50px] lg:px-[30px]  md:px-5 sm:px-3 sm:flex-col">
          <div className="sm:hidden grid h-full 2xl:w-2/3 lg:w-2/3 sm:w-full flex-1 grid-cols-2 gap-[5px] 2xl:gap-[5px] lg:gap-[5px] 2xl:h-fit xl:h-auto lg:grid-cols-2 md:grid-cols-1 sm:grid-cols-2 xl:grid-cols-2">
            <Suspense fallback={<div>Loading feed...</div>}>
              {selectedSettingType ? (
                selectedSettingType.model_view && (
                  <div className="relative h-[512px] 2xl:h-auto w-full xl:h-auto lg:h-auto">
                    {/* <iframe
                    src={'https://aws.kavyajewel.com/Majesca/Majesca%20360/OCT%202024/14-10-2024%2002/14-10-2024%2002.html'}
                    width="512" // Adjust width as needed
                    height="512" // Adjust height as needed
                    title={`Model View`}
                    className="h-[512px] 2xl:h-auto w-full object-cover xl:h-auto lg:h-auto cursor-move"
                    style={{
                      aspectRatio: '1/1',
                    }}
                  /> */}
                    <iframe
                      title="scene"
                      frameBorder="0"
                      allowFullScreen={true}
                      allow="autoplay; fullscreen; xr-spatial-tracking; web-share"
                      className="w-full border-none"
                      style={{
                        aspectRatio: '1 / 1',
                      }}
                      src={selectedSettingType?.model_view}
                    />
                    <div className="w-[8%] absolute bottom-2 right-3 z-[19] flex items-center select-none">
                      <Image src="/images/viewIcon.svg" alt="360-view" preview={false} className="!w-[100%] select-none" />
                    </div>
                  </div>
                )
              ) : (
                <>
                  {/* <Skeleton.Node
                  active={true}
                  style={{
                    borderRadius: '0px',
                    width: '100%',
                    height: '100%',
                    aspectRatio: '1 / 1',
                  }}
                /> */}
                </>
              )}
              {selectedSettingType && selectedSettingType?.carat_video?.length > 0 && (
                <ProtectedVideo
                  src={selectedSettingType?.carat_video?.[0]}
                  autoPlay={true}
                  muted={true}
                  loop={true}
                  className="w-full h-full object-cover"
                />
              )}
              {selectedSettingType ? (
                selectedSettingType?.carat_images?.length > 0 ? (
                  selectedSettingType?.carat_images?.map((d: any, index: number) => {
                    // jewelryMetadata?.carat_images?.map((d: any, index: number) => {
                    //   return <ImageZoom key={index} src={d} alt="Product image" zoom="200" className="!aspect-square sm:hidden" />;
                    // })
                    return (
                      // <Image
                      //   key={'group3179' + index}
                      //   src={d}
                      //   preview={false}
                      //   alt="Mask Group"
                      //   fallback={'/images/ashclair_pdp_logo_image.svg'}
                      //   className="h-[500px] 2xl:h-auto w-full object-contain xl:h-auto lg:h-auto bg-[#f8f8f8] aspect-square"
                      // />
                      <ImageZoom key={index} src={d} alt="Product image" zoom="200" className="!aspect-square sm:hidden" />
                    );
                  })
                ) : (
                  <>
                    <Image
                      src="/images/ashclair_pdp_logo_image.svg"
                      alt="PDP1"
                      preview={false}
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
                    style={{
                      borderRadius: '0px',
                      width: '100%',
                      height: '100%',
                      aspectRatio: '1 / 1',
                    }}
                  />
                  <Skeleton.Node
                    active={true}
                    style={{
                      borderRadius: '0px',
                      width: '100%',
                      height: '100%',
                      aspectRatio: '1 / 1',
                    }}
                  />
                  <Skeleton.Node
                    active={true}
                    style={{
                      borderRadius: '0px',
                      width: '100%',
                      height: '100%',
                      aspectRatio: '1 / 1',
                    }}
                  />
                  <Skeleton.Node
                    active={true}
                    style={{
                      borderRadius: '0px',
                      width: '100%',
                      height: '100%',
                      aspectRatio: '1 / 1',
                    }}
                  />
                </>
              )}
              {/* {selectedDiamondStore?.imageFile && (
                <div className="h-[512px] flex justify-center items-center bg-[#f8f8f8] 2xl:h-auto w-full aspect-square xl:h-auto lg:h-auto md:h-auto">
                  <ImageZoom src={selectedDiamondStore?.imageFile} alt="Product image" zoom="200" className="!aspect-square sm:hidden" />
                </div>
              )} */}
              {selectedSettingType && selectedSettingType?.carat_video?.length > 0 && selectedSettingType?.carat_video?.[1] && (
                <ProtectedVideo
                  src={selectedSettingType?.carat_video?.[1]}
                  autoPlay={true}
                  muted={true}
                  loop={true}
                  className="w-full h-full object-cover"
                />
              )}
              {/* {selectedDiamondStore?.videoFile ? (
                <div className="relative aspect-square">
                  <iframe
                    src={`${selectedDiamondStore?.videoFile?.split('/500/500')[0]}`}
                    title={`Model View`}
                    className="h-full w-full lg:hidden bg-[#f8f8f8]"
                  />
                  <iframe
                    src={`${selectedDiamondStore?.videoFile?.split('/500/500')[0]}`}
                    title={`Model View`}
                    className="h-full w-full hidden lg:block md:hidden"
                  />
                  <iframe
                    src={`${selectedDiamondStore?.videoFile?.split('/500/500')[0]}`}
                    title={`Model View`}
                    className="h-full w-full hidden md:block sm:hidden"
                  />
                  <iframe
                    src={`${selectedDiamondStore?.videoFile?.split('/500/500')[0]}`}
                    title={`Model View`}
                    className="h-full w-full hidden sm:block"
                  />
                  <div className="w-[8%] absolute bottom-2 right-3 z-[19] flex items-center select-none">
                    <Image src="/images/viewIcon.svg" alt="360-view" preview={false} className="!w-[100%] select-none" />
                  </div>
                </div>
              ) : (
                <Skeleton.Node
                  active={true}
                  style={{
                    borderRadius: '0px',
                    width: '100%',
                    height: '100%',
                    aspectRatio: '1 / 1',
                  }}
                />
              )} */}
              {swiperData && swiperData?.length > 1 && swiperData?.length % 2 > 0 && (
                <Image
                  src="/images/ashclair_pdp_logo_image.svg"
                  alt="PDP1"
                  preview={false}
                  style={{
                    borderRadius: '0px',
                    width: '100%',
                    height: '100%',
                    aspectRatio: '1 / 1',
                    backgroundColor: '#F8F8F8',
                  }}
                />
              )}
            </Suspense>
          </div>
          <div className="hidden sm:block sm:w-full">
            {swiperData && swiperData?.length > 0 ? (
              <div className="col-span-2 min-h-fit hidden sm:block">
                <Swiper
                  loop={true}
                  spaceBetween={10}
                  slidesPerView={1}
                  navigation={true}
                  // navigation={{
                  //   prevEl: null,
                  //   nextEl: null,
                  // }}
                  thumbs={{ swiper: thumbsSwiper }}
                  onSlideChange={(swiper) => {
                    setActiveIndex(swiper.realIndex);
                  }}
                  modules={[FreeMode, Navigation, Thumbs]}
                  className="mySwiper2 min-h-fit mb-3"
                >
                  {swiperData?.map((d: any, index: number) => {
                    const lastIndex = swiperData?.length - 1;
                    return (
                      <SwiperSlide key={'group3179' + index} className="!flex !justify-center !items-center !w-full">
                        {(index == 0 && isV360) || index == lastIndex ? (
                          <div className="aspect-square relative w-full xl:h-auto lg:h-auto sm:!h-full">
                            {index == 0 ? (
                              <iframe
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
                            ) : (
                              <iframe
                                src={` ${selectedDiamondStore?.videoFile?.split('/500/500')[0]}${`/${windowWidth - 24}/${windowWidth - 24}`}`}
                                title={`Model View`}
                                className="h-full w-full hidden sm:block aspect-square"
                                style={{
                                  aspectRatio: '1 / 1',
                                }}
                                allow="autoplay; fullscreen;"
                                frameBorder="0"
                              />
                            )}

                            <div className="w-[8%] absolute bottom-2 right-3 z-[19] flex items-center select-none">
                              <Image src="/images/viewIcon.svg" alt="360-view" preview={false} className="!w-[100%] select-none" />
                            </div>
                          </div>
                        ) : isVideo && index == 1 ? (
                          <ProtectedVideo src={videoOne} autoPlay={true} muted={true} loop={true} className="w-full !h-auto" />
                        ) : isVideo2 && index == lastIndex ? (
                          <ProtectedVideo src={videoTwo} autoPlay={true} muted={true} loop={true} className="w-full !h-auto" />
                        ) : (
                          <Image
                            src={d}
                            preview={false}
                            alt="Mask Group"
                            fallback={'/images/ashclair_pdp_logo_image.svg'}
                            className="h-[500px] 2xl:h-auto w-full mx-auto object-contain xl:h-auto lg:h-auto bg-[#f8f8f8] aspect-square"
                          />
                        )}
                      </SwiperSlide>
                    );
                  })}
                </Swiper>
                <Swiper
                  onSwiper={(value) => setThumbsSwiper(value)}
                  loop={false}
                  spaceBetween={10}
                  slidesPerView={4}
                  freeMode={true}
                  navigation={{
                    prevEl: null,
                    nextEl: null,
                  }}
                  watchSlidesProgress={true}
                  modules={[FreeMode, Navigation, Thumbs]}
                  className="mySwiper min-h-[20%] px-2 "
                >
                  {swiperData?.map((d: any, index: number) => {
                    const lastIndex = swiperData?.length - 1;
                    return (
                      <SwiperSlide
                        key={'group3179' + index}
                        className={`cursor-pointer transition-all duration-300 border-2  !aspect-square ${activeIndex === index ? ' border-primary p-1' : 'border-transparent p-1.5'}`}
                      >
                        {(index == 0 && isV360) || index == lastIndex ? (
                          <div className={`w-full bottom-2 left-2 z-[19] flex items-center select-none ${thumbsSwiper}`}>
                            <Image
                              src="/images/viewIcon.svg"
                              alt="360-view"
                              preview={false}
                              className="!w-[100%] px-5 !aspect-square bg-[#f8f8f8] select-none"
                            />
                          </div>
                        ) : isVideo && index == 1 ? (
                          <>
                            <video muted className="w-full !h-auto">
                              <source src={index == 1 ? videoOne : videoTwo} type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                          </>
                        ) : isVideo2 && index == lastIndex ? (
                          <>
                            <video muted className="w-full !h-auto">
                              <source src={index == 1 ? videoOne : videoTwo} type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                          </>
                        ) : (
                          <Image
                            src={d}
                            preview={false}
                            alt="Mask Group"
                            fallback={'/images/ashclair_pdp_logo_image.svg'}
                            className="h-[500px] 2xl:h-auto w-full object-contain xl:h-auto lg:h-auto bg-[#f8f8f8] aspect-square"
                          />
                        )}
                      </SwiperSlide>
                    );
                  })}
                </Swiper>
              </div>
            ) : (
              <Image
                src="/images/ashclair_pdp_logo_image.svg"
                alt="PDP1"
                preview={false}
                style={{
                  borderRadius: '0px',
                  width: '100%',
                  height: '100%',
                  aspectRatio: '1 / 1',
                  backgroundColor: '#F8F8F8',
                }}
              />
            )}
          </div>

          <div
            ref={cRef}
            className={`flex w-[33%] lg:w-1/3 md:w-[40%] sticky top-[${topOffset}px] sm:top-0 flex-col gap-[30px] 2xl:gap-[20px] sm:gap-2 sm:w-full`}
            style={{ top: `${topOffset}` }}
          >
            <div className="flex flex-col gap-5 sm:gap-2">
              <div className="flex flex-col items-start gap-4 sm:gap-2">
                <div className="flex self-stretch">
                  {selectedSettingStore ? (
                    <Text size="text5xl" as="p" className="md:!text-[20px] sm:!text-[18px]">
                      {selectedSettingStore?.product_details?.fullTitle}
                    </Text>
                  ) : (
                    <div className="flex flex-col gap-5 w-full">
                      <Skeleton.Input active={true} size="small" block className="w-full" />
                      <Skeleton.Input active={true} size="small" />
                      {/* <Skeleton.Button active={true} block /> */}
                    </div>
                  )}
                </div>

                {selectedProduct?.product_details?.jewelry_id && jewelryMetadata ? (
                  <>
                    {jewelryMetadata?.diamond_certificate &&
                    jewelryMetadata?.diamond_certificate !== 0 &&
                    jewelryMetadata?.diamond_certificate !== undefined ? (
                      <div className="flex items-center gap-2">
                        <Text size="textmd" className="!font-medium text-gray-500">
                          {`${
                            productSKU?.metalType !== 'SILVER_925'
                              ? (productFilter?.find((el: any) => el.id === jewelryMetadata?.metal_type_id)?.name || 'N/A') + ' '
                              : ''
                          }${productFilter?.find((el: any) => el.id === jewelryMetadata?.metal_color_id)?.name?.replace(' ', ' ') || 'N/A'}, ${
                            productFilter?.find((el: any) => el.id === jewelryMetadata?.shape_id)?.name || 'N/A'
                          } | ${
                            jewelryMetadata?.diamond_certificate === 1
                              ? 'GIA'
                              : jewelryMetadata?.diamond_certificate === 2
                                ? 'IGI'
                                : jewelryMetadata?.diamond_certificate === 3
                                  ? 'DGLA'
                                  : 'N/A'
                          }`}
                        </Text>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <Skeleton.Input active={true} size="small" block={true} />
                )}

                {selectedSettingType?.selling_price + selectedDiamondStore?.price > 0 && (
                  <p className="text-[22px] font-semibold md:text-[20px] sm:!text-[14px] !font-castoro">
                    {formatCurrency(
                      (selectedSettingType?.discounted_price
                        ? selectedSettingType?.discounted_price + selectedSettingRingPrice
                        : selectedSettingType?.selling_price + selectedSettingRingPrice) +
                        selectedDiamondStore?.price +
                        (selectedWarranty?.yearPrice?.price ?? 0) +
                        (selectedAppraisal?.price ?? 0) +
                        (selectedEngraving ? engraving?.data?.engraving_price : 0),
                    )}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-5 sm:gap-2 sm:mt-3">
                <div className="border-b border-gray-200 pb-5 sm:pb-2 ">
                  {selectedSettingStore && selectedSettingStore?.product_details?.title ? (
                    <Text size="textlg" as="p" className="uppercase">
                      SETTING Details:
                    </Text>
                  ) : (
                    <Skeleton.Input active={true} size="small" />
                  )}
                  <div className="flex gap-4 mt-2 sm:grid sm:grid-cols-3 sm:gap-3">
                    <div className="max-w-[100px] w-[100px] h-[100px] sm:w-auto sm:col-span-1  bg-[#f8f8f8] aspect-square  ">
                      {selectedSettingStore && selectedSettingStore?.product_details?.title ? (
                        <Image
                          src={
                            selectedSettingType?.carat_images?.[1] ? selectedSettingType?.carat_images?.[1] : '/images/ashclair_pdp_logo_image.svg'
                          }
                          preview={false}
                          fallback="/images/ashclair_pdp_logo_image.svg"
                          className="object-cover !h-full !mix-blend-multiply"
                          alt="Mask Group"
                        />
                      ) : (
                        <>
                          <Skeleton.Node
                            active
                            style={{
                              borderRadius: '0px',
                              width: '100%',
                              height: '100%',
                              aspectRatio: '1 / 1',
                            }}
                          />
                        </>
                      )}
                    </div>
                    <div className="flex-col sm:col-span-2 gap-2 flex">
                      <p className="text-[18px] capitalize sm:!text-[13px]"> {selectedSettingStore?.product_details?.title}</p>
                      {selectedSettingType?.selling_price && (
                        <div className="flex gap-2 flex-col items-start">
                          <p
                            className={`text-[16px] capitalize !font-castoro ${selectedSettingType?.discounted_price ? 'line-through text-gray-400 !text-[14px] sm:!text-[12px]' : 'sm:!text-[13px]'}`}
                          >
                            {' '}
                            {formatCurrency(
                              selectedSettingType?.selling_price +
                                selectedSettingRingPrice +
                                (selectedWarranty?.yearPrice?.price ?? 0) +
                                (selectedAppraisal?.price ?? 0) +
                                (selectedEngraving ? engraving?.data?.engraving_price : 0),
                            )}
                          </p>
                          {selectedSettingType?.discounted_price && (
                            <p className="text-[16px] capitalize sm:!text-[13px] !font-castoro">
                              {' '}
                              {formatCurrency(
                                (selectedSettingType?.discounted_price ? selectedSettingType?.discounted_price : selectedSettingType?.selling_price) +
                                  selectedSettingRingPrice +
                                  (selectedWarranty?.yearPrice?.price ?? 0) +
                                  (selectedAppraisal?.price ?? 0) +
                                  (selectedEngraving ? engraving?.data?.engraving_price : 0),
                              )}
                            </p>
                          )}
                          <div className="flex flex-col items-start justify-center">
                            <Text as="p" size="textlg" className="text-[12px] tracking-[0.20px] text-slate-400">
                              {selectedProduct?.product_details?.subType?.jewelry_type?.name}
                            </Text>
                            <Text as="p" size="textlg" className="text-[12px] tracking-[0.20px] text-slate-400">
                              {master.find((item: any) => item.id === selectedSettingType?.metal_color_id)?.name}
                            </Text>

                            <Text as="p" size="textlg" className="text-[12px] capitalize tracking-[0.20px] text-slate-400">
                              {/* {selectedSettingType?.diamondGroup?.group} */}

                              {'Metal | '}
                              {master.find((item: any) => item.id === selectedSettingType?.metal_type_id)?.name}
                            </Text>
                            {selectedEngraving && selectedEngraving.text != '' && (
                              <>
                                {/* <Text as="p" size="textlg" className="text-[12px] tracking-[0.20px] text-slate-400">
                                  Engraving Text: <span style={{ fontFamily: selectedEngraving.fontFamily }}>{selectedEngraving.text}</span>
                                </Text>
                                <Text as="p" size="textlg" className="text-[12px] tracking-[0.20px] text-slate-400">
                                  Engraving Font Family: {selectedEngraving.fontFamily}
                                </Text> */}
                                <Text as="p" size="textlg" className="text-[12px] tracking-[0.20px] text-slate-400">
                                  Engraving Price:
                                  <span className="!font-bold">{formatCurrency(selectedEngraving ? engraving?.data?.engraving_price : 0)}</span>
                                </Text>
                              </>
                            )}
                            {selectedWarranty && (
                              <Text as="p" size="textlg" className="text-[12px] tracking-[0.20px] text-slate-400">
                                Warranty: {selectedWarranty?.yearPrice?.year} Year (+
                                <span className="!font-bold">{formatCurrency(selectedWarranty?.yearPrice?.price)}</span>)
                              </Text>
                            )}
                            {selectedAppraisal && (
                              <Text as="p" size="textlg" className="text-[12px] tracking-[0.20px] text-slate-400">
                                Appraisal Price: <span className="!font-bold">{formatCurrency(selectedAppraisal?.price)}</span>
                              </Text>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {selectedSettingStore && selectedSettingStore?.product_details?.title && (
                  <div>
                    {selectedDiamondStore ? (
                      <Text size="textlg" as="p" className="uppercase">
                        DIAMOND Details:
                      </Text>
                    ) : (
                      <Skeleton.Input active={true} size="small" />
                    )}
                    <div className="flex gap-4 mt-2 sm:grid sm:grid-cols-3 sm:gap-3">
                      <div className="max-w-[100px] w-[100px] h-[100px] sm:w-auto sm:col-span-1 bg-[#f8f8f8]  !aspect-square    sm:border">
                        {selectedDiamondStore?.imageFile || selectedDiamondStore?.fullTitle ? (
                          <Image
                            src={selectedDiamondStore?.imageFile ? selectedDiamondStore?.imageFile : '/images/ashclair_pdp_logo_image.svg'}
                            preview={false}
                            fallback="/images/ashclair_pdp_logo_image.svg"
                            className="object-cover  aspect-square"
                            alt="Mask Group"
                          />
                        ) : (
                          <>
                            <Skeleton.Node
                              active={true}
                              className="aspect-square object-contain"
                              // style={{
                              //   borderRadius: '0px',
                              //   width: '100%',
                              //   // height: '100%',
                              //   aspectRatio: '1 / 1',
                              // }}
                            />
                          </>
                        )}
                      </div>
                      <div className="flex-col gap-2 flex sm:col-span-2">
                        <p className="text-[18px] capitalize sm:!text-[13px]"> {selectedDiamondStore?.fullTitle}</p>
                        {selectedSettingType?.selling_price && (
                          <p className="text-[16px] capitalize sm:!text-[13px] !font-castoro"> {formatCurrency(selectedDiamondStore?.price)}</p>
                        )}
                        {selectedDiamondStore && (
                          <div>
                            <p className="text-[16px] tracking-[0.20px] text-slate-400 sm:!text-[12px]">Clarity: {selectedDiamondStore?.clr}</p>
                            <p className="text-[16px] tracking-[0.20px] text-slate-400 sm:!text-[12px]">Color: {selectedDiamondStore?.col}</p>
                            <p className="text-[16px] tracking-[0.20px] text-slate-400 sm:!text-[12px]">Shape: {selectedDiamondStore?.shape_name}</p>
                            <p className="text-[16px] tracking-[0.20px] text-slate-400 sm:!text-[12px]">
                              {selectedDiamondStore?.diamond_type == 2 ? 'Lab Grown Diamond' : 'Natural Diamond'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {(() => {
                  // Side diamonds grouped by shape (one row per shape) with each shape's
                  // combined Total Carat Weight, computed and sent by the backend.
                  const sideDiamondDetails = selectedSettingStore?.product_details?.sideDiamondDetails ?? selectedSettingType?.sideDiamondDetails;
                  const shapeGroups = Array.isArray(sideDiamondDetails) ? sideDiamondDetails : [];
                  return (
                    selectedSettingStore &&
                    selectedSettingStore?.product_details?.title &&
                    shapeGroups.length > 0 && (
                      <div>
                        <Text size="textlg" as="p" className="uppercase">
                          SIDE DIAMOND Details:
                        </Text>
                        <div className="mt-2 overflow-x-auto sm:mb-4">
                          <table className="w-full border-collapse border border-gray-200 text-left">
                            <thead>
                              <tr className="bg-[#f8f8f8] text-slate-500">
                                <th className="border border-gray-200 px-3 py-2 text-[14px] font-medium sm:px-2 sm:py-1 sm:text-[12px]">Shape</th>
                                <th className="border border-gray-200 px-3 py-2 text-[14px] font-medium sm:px-2 sm:py-1 sm:text-[12px]">Color</th>
                                <th className="border border-gray-200 px-3 py-2 text-[14px] font-medium sm:px-2 sm:py-1 sm:text-[12px]">
                                  Total Carat Weight
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {shapeGroups.map((group: any, index: number) => (
                                <tr key={index} className="text-slate-400">
                                  <td className="border border-gray-200 px-3 py-2 text-[14px] sm:px-2 sm:py-1 sm:text-[12px]">{group.shapeName}</td>
                                  <td className="border border-gray-200 px-3 py-2 text-[14px] sm:px-2 sm:py-1 sm:text-[12px]">{group.colorName}</td>
                                  <td className="border border-gray-200 px-3 py-2 text-[14px] sm:px-2 sm:py-1 sm:text-[12px]">{group.caratWeight}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )
                  );
                })()}
              </div>
            </div>
            <div className="flex flex-col gap-[20px] sm:gap-3">
              {selectedSettingStore?.product_details?.jewelry_id ? (
                isRingSizeType ? (
                  <div className="flex flex-col items-start gap-[14px] md:gap-[10px] self-stretch relative">
                    <div className="flex items-center justify-between gap-5 self-stretch">
                      <Text size="textxl" className="!font-light !font-sans">
                        RING SIZE
                      </Text>
                    </div>

                    <div className="w-full">
                      <div className="flex gap-[10px] self-stretch">
                        <Select
                          className={`!w-[150px] ${errorMessage ? '!outline !outline-red-500' : ''}`}
                          placeholder="Select a Ring Size"
                          defaultValue={ringSizeMaster?.[0]?.value}
                          value={selectedRingSize ? selectedRingSize : null}
                          onChange={(value: number | string) => {
                            setSelectedSize(value);
                            // setSelectedRingSizeId(value);
                            dispatch(setSelectedRingSize(value));
                            dispatch(setSelectedRingSizeId(ringSizeMasterData?.find((el: any) => el?.name == value)?.id));
                            if (value !== 0) {
                              setCustomRingSize(''); // Clear custom size if not "Other Size"
                              setErrorMessage('');
                            }
                          }}
                          // filterOption={(input, option) => ((option?.label as string) ?? '').toLowerCase().includes(input.toLowerCase())}
                          options={ringSizeMaster}
                        />
                        {selectedSize === 0 && (
                          <div className="relative">
                            <Input
                              maxLength={5}
                              value={customRingSize}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                dispatch(setSelectedRingSize(e.target.value));
                                // setCustomRingSize(e.target.value);
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
                      {errorMessage && (
                        <div className="relative">
                          <Text className="!text-[10px] text-nowrap absolute" style={{ color: 'red', marginTop: '8px' }}>
                            {errorMessage}
                          </Text>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <></>
                )
              ) : (
                <>
                  <Skeleton.Input active={true} size="small" />
                  <Skeleton.Button active={true} block />
                </>
              )}
              {selectedSettingStore?.product_details?.is_engraving ? (
                <Engraving setEngravingText={setEngravingText} engravingText={engravingText} />
              ) : null}
              {/* Expandable Box */}
              {selectedSettingStore?.product_details?.jewelry_id ? (
                <>
                  <div className="border p-4">
                    <div
                      className="cursor-pointers font-medium !text-[#707070] flex items-center justify-between"
                      onClick={() => setIsExpanded(!isExpanded)}
                    >
                      <Text size="textxl" className="!font-light !font-sans">
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
                      <div className="mt-4 flex flex-col gap-2 !text-[#707070] w-full">
                        <Checkbox checked={isChecked} onChange={handleCheckboxChange} className="mb-2">
                          <Text className="!font-light !font-sans text-lg">{warrantyData?.warrantyName}</Text>
                        </Checkbox>

                        {isChecked && (
                          <Radio.Group onChange={handleRadioChange} value={selectedWarranty?.yearPrice?.year ?? selectedYear}>
                            <div className="grid grid-cols-2 gap-2 ml-1">
                              {warrantyData?.yearPriceList?.map((item: any) => (
                                <Radio
                                  key={item?.year}
                                  value={item?.year}
                                  className="col-span-1"
                                  checked={item?.year === (selectedWarranty?.yearPrice?.year ?? selectedYear)}
                                >
                                  {item?.year} Year (+ ${item?.price})
                                </Radio>
                              ))}
                            </div>
                          </Radio.Group>
                        )}

                        <Checkbox onChange={handleAppraisalChange} checked={selectedAppraisal ? true : false}>
                          <Text className="!font-light !font-sans text-lg">{`${appraisalData?.appraisalName} (+ $${appraisalData?.price})`}</Text>
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

              {selectedSettingStore?.product_details?.estimated_delivery_days || selectedSettingSkuData?.handling_dates.length >= 0 ? (
                isRingSizeType ? (
                  <>
                    <Text size="textmd" className="!text-[#707070] flex gap-2 items-center">
                      {selectedSettingSkuData?.handling_dates && selectedSettingSkuData?.handling_dates?.length !== 0 && (
                        <span className="flex items-center gap-2">
                          <span>
                            {' '}
                            <BsBoxSeam className="h-5 w-5" />{' '}
                          </span>{' '}
                          Usually ships within{' '}
                          {selectedSettingSkuData?.handling_dates?.find((el: any) => el.ring_size_id == selectedRingSizeId)?.shipping_date ??
                            selectedSettingSkuData?.handling_dates?.[0]?.shipping_date}{' '}
                          to{' '}
                          {(selectedSettingSkuData?.handling_dates?.find((el: any) => el.ring_size_id == selectedRingSizeId)?.shipping_date ??
                            selectedSettingSkuData?.handling_dates?.[0]?.shipping_date) + 1}{' '}
                          days
                        </span>
                      )}
                    </Text>
                    <Text size="textmd" className="!text-[#707070] flex gap-2 items-center">
                      <span>
                        {' '}
                        <PiTruck className="h-5 w-5" />
                      </span>{' '}
                      Estimated Delivery Date:{' '}
                      {selectedSettingSkuData?.handling_dates?.findIndex((el: any) => el.ring_size_id == selectedRingSizeId) >= 0
                        ? selectedSettingSkuData?.handling_dates?.find((el: any) => el.ring_size_id == selectedRingSizeId)?.estimation_date
                        : (selectedSettingSkuData?.handling_dates?.[0]?.estimation_date ??
                          dayjs().add(selectedSettingStore?.product_details?.estimated_delivery_days, 'day').format('MMMM DD, YYYY'))}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text size="textmd" className="!text-[#707070] flex gap-2 items-center">
                      {selectedSettingSkuData?.handling_dates && selectedSettingSkuData?.handling_dates?.length !== 0 && (
                        <span className="flex items-center gap-2">
                          <span>
                            {' '}
                            <BsBoxSeam className="h-5 w-5" />{' '}
                          </span>{' '}
                          Usually ships within {selectedSettingSkuData?.handling_dates?.[0]?.shipping_date} to{' '}
                          {selectedSettingSkuData?.handling_dates?.[0]?.shipping_date + 1} days
                        </span>
                      )}
                    </Text>
                    <Text size="textmd" className="!text-[#707070] flex gap-2 items-center">
                      <span>
                        {' '}
                        <PiTruck className="h-5 w-5" />
                      </span>{' '}
                      Estimated Delivery Date:{' '}
                      {selectedSettingSkuData?.handling_dates?.length > 0
                        ? selectedSettingSkuData?.handling_dates?.[0]?.estimation_date
                        : dayjs().add(selectedSettingStore?.product_details?.estimated_delivery_days, 'day').format('MMMM DD, YYYY')}
                    </Text>
                  </>
                )
              ) : (
                <>
                  <Skeleton.Input active={true} block={true} size="small" />
                </>
              )}
              {affirmPriceInCents >= 5000 && (typeof window === 'undefined' || (localStorage.getItem('currency') || 'USD') === 'USD') && (
                <p key={affirmPriceInCents} className="affirm-as-low-as mt-2" data-page-type="product" data-amount={affirmPriceInCents} />
              )}
              {selectedSettingStore && selectedSettingStore?.product_details?.title ? (
                <>
                  <div>
                    <Button
                      name="Checkout Button"
                      className=" w-full !text-text_w !bg-secondary lg:text-[18px] sm:px-4 uppercase tracking-[1px] mt-1 border-2 sm:mb-4"
                      loading={loading}
                      onClick={handleAddtocart}
                    >
                      Continue
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Skeleton.Input active={true} size="small" block />
                  <Skeleton.Button active={true} block />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
