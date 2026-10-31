/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import React, { useEffect, useRef, useState } from 'react';

import { Image } from 'antd';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FaHeart, FaRegHeart } from 'react-icons/fa6';
import { Virtual, Navigation, Pagination } from 'swiper/modules';
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
import { setSelectedDiamondStore, setSelectedSettingSkuData, setSelectedSettingStore } from '@/store/slices/customProducts/customProductSlice';
import { formatCurrency } from '@/utils/common';
import { trackAddToWishlist } from '@/utils/metaPixel';

import { Text } from './..';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import ProductName from '../ProductProfile/ProductName';

interface SpecialProductTitle {
  id: string;
  title: string;
}
interface Props {
  className?: string;
  productImage?: string;
  stackable_image?: string;
  productHoverImage?: string;
  productName?: React.ReactNode;
  productDescription?: React.ReactNode;
  productPrice?: React.ReactNode;
  isStatic?: boolean;
  isWishlist?: string | null;
  slug?: string;
  variation_to_show?: any;
  variation_details?: any;
  jewelryDetails?: any;
  jewelryTypeData?: string;
  discount_type?: string | null;
  discount_value?: number | string | null;
  discounted_price?: string | null;
  specialProductTitles?: SpecialProductTitle[] | null;
  jewelry_type?: string;
  sku_master_id?: string;
  jewelry_id?: string;
  handling_days?: null | number;
  ring_size_id?: null | string;
  metal_type_id?: null | string;
  estimated_delivery_days?: number | string | null;
  productVariation?: number | string | null;
  is_customizable?: boolean;
  is_stackable?: boolean;
  selectionRoute: any;
}

export default function CustomProduct({
  productImage = 'img_group_1259_1.png',
  stackable_image = '/images/no_images.svg',
  productHoverImage = 'img_group_1259_1.png',
  productName = 'NAME OF THE PRODUCT',
  productPrice = '$50',
  productDescription,
  slug = '/',
  sku_master_id,
  jewelry_type,
  jewelry_id,
  variation_to_show = null,
  variation_details = null,
  jewelryDetails = null,
  jewelryTypeData = 'all',
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
  is_stackable = false,
  selectionRoute,
  ...props
}: Props) {
  const dispatch = useAppDispatch();
  const path = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const state = searchParams.get('state');
  const dId = searchParams.get('did') ?? null;
  const { user } = useAppSelector((state) => state.auth.auth);
  const { projectSetting } = useAppSelector((state) => state.master);
  const master = useAppSelector((state) => state.master.data);
  const { productStack } = useAppSelector((state) => state.products);
  const { wishlistProducts } = useAppSelector((state) => state?.cart);
  const products = useAppSelector((state) => state?.products.products.rows);

  const [swiperRef, setSwiperRef] = useState<any>(null);

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
  const isStackedProduct = productStack?.some((el: any) => el.slug == slug && el.sku_master_id == sku_master_id);

  const handleAddtoWishlist = async () => {
    const payload = {
      jewelry_id: jewelry_id as string,
      sku_master_id: sku_master_id as string,
      slug: slug as string,
      productDescription,
      productPrice,
      productName,
      productHoverImage,
      productImage,
      discount_type,
      discount_value,
      discounted_price,
      variation_to_show,
      variation_details,
      jewelryDetails,
      jewelryTypeData,
      specialProductTitles,
      handling_days,
      ring_size_id,
      isWishlist: isWishlist ?? 'true',
      jewelry_type: jewelry_type as string,
      is_customizable,
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
          const price = Number(discounted_price ?? productPrice ?? 0);
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
          const price = Number(discounted_price ?? productPrice ?? 0);
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
        const price = Number(discounted_price ?? productPrice ?? 0);
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
  const EXCLUDED_KEYS = ['selling_price', 'carat_images', 'sku_slug', 'discount_type', 'discount_value', 'discounted_price', 'center_diamond_id'];
  const findKeyFromValue = (valueToFind: string): string | undefined => {
    for (const obj of variation_details) {
      const foundKey = Object.keys(obj).find((key) => obj[key] === valueToFind);
      if (foundKey) {
        return foundKey;
      }
    }
    return undefined;
  };
  const handleHowerVatiation = (id: string, id2 = '', name: string) => {
    // Step 1: Replace/add the selected value
    let newVariant = { ...selectedVariant };

    if (name === 'metal_type') {
      // Case: two keys to update
      newVariant = {
        ...newVariant,
        metal_color_id: id,
        metal_type_id: id2,
      };
    } else {
      // Case: find the key from selectedVariant by value

      // const foundKey = Object.keys(selectedVariant).find((key) => selectedVariant[key] === id);
      const foundKey = findKeyFromValue(id);

      if (foundKey) {
        newVariant = {
          ...newVariant,
          [foundKey]: id,
        };
      }
    }

    // Step 2: Remove excluded keys from the comparison
    const filteredKeys = Object.keys(newVariant).filter((key) => !EXCLUDED_KEYS.includes(key));

    // Step 3: Find matching variation
    const matched = variation_details?.find((variation: any) => filteredKeys.every((key) => variation[key] === newVariant[key]));

    // Step 4: Update state
    if (matched) {
      setHoverVariant(matched);
    }
  };
  const handleSelectedVatiation = (id: string, id2 = '', name: string) => {
    // Step 1: Replace/add the selected value
    let newVariant = { ...selectedVariant };

    if (name === 'metal_type') {
      // Case: two keys to update
      newVariant = {
        ...newVariant,
        metal_color_id: id,
        metal_type_id: id2,
      };
    } else {
      // Case: find the key from selectedVariant by value

      // const foundKey = Object.keys(selectedVariant).find((key) => selectedVariant[key] === id);
      const foundKey = findKeyFromValue(id);

      if (foundKey) {
        newVariant = {
          ...newVariant,
          [foundKey]: id,
        };
      }
    }

    // Step 2: Remove excluded keys from the comparison
    const filteredKeys = Object.keys(newVariant).filter((key) => !EXCLUDED_KEYS.includes(key));

    // Step 3: Find matching variation
    const matched = variation_details?.find((variation: any) => filteredKeys.every((key) => variation[key] === newVariant[key]));

    // Step 4: Update state
    if (matched) {
      setSelectedVariant(matched);
    }
  };

  useEffect(() => {}, [wishlistProducts?.length]);
  useEffect(() => {
    if (!variation_to_show || variation_to_show?.length === 0 || !variation_details || variation_details?.length === 0) {
      setSelectedVariant(jewelryDetails);
      return;
    }

    // Get all keys from the first variation object
    const keysToCheck = Object.keys(variation_details?.[0] || {});

    // Build criteria from jewelryDetails for keys that exist in variation object
    const criteria: any = {};
    keysToCheck.forEach((key) => {
      if (jewelryDetails[key]) {
        criteria[key] = jewelryDetails[key];
      }
    });
    setSelectedVariant(criteria);
    // console.log('criteria', criteria);
  }, []);

  useEffect(() => {
    const allWishlistItems = wishlistProducts.flatMap((group: any) => group.jewelry);

    if (allWishlistItems.length === 0) {
      setIsInWishlist(false);
      return;
    }

    const exist = allWishlistItems.some((w: any) => w.jewelry_id === jewelry_id && w.sku_master_id === sku_master_id);

    setIsInWishlist(exist);
  }, [wishlistProducts, isInWishlist]);

  return (
    <div {...props} className={`${props.className} flex flex-col items-start gap-3 pb-5 sm:pb-1 lg:gap-3 sm:gap-2 overflow-hidden relative`}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => {
          router.push(`/custom-jewelry?type=${selectionRoute}&state=${state}&id=${selectedVariant?.sku_slug}${dId ? `&did=${dId}` : ''}`);
          // dispatch(fetchSettingByIdThunk(slug));
        }}
        className={`relative h-auto w-full ${isStackedProduct ? 'border-2 border-black' : ''} !aspect-square bg-[#f8f8f8] cursor-pointer`}
      >
        <div className="relative h-auto w-full aspect-square select-none bg-[#f8f8f8]">
          <div
            className={`absolute flex aspect-square top-0 left-0 h-full w-full justify-center transition-opacity duration-500 ease-in-out ${
              productImage !== '/images/no_images.svg' && hovered ? 'opacity-0 md:opacity-100' : 'opacity-100'
            }`}
            style={{
              backgroundColor: '#f8f8f8',
            }}
          >
            <Image
              src={hoveredOption ? hoverVarient?.carat_images?.[0] : selectedVariant?.carat_images?.[0]}
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
              productHoverImage !== '/images/no_images.svg' && hovered
                ? 'opacity-100 transform translate-y-0 md:hidden'
                : 'opacity-0 transform -translate-y-3 md:hidden'
            }`}
            style={{
              backgroundColor: '#f8f8f8',
            }}
          >
            <Image
              src={hoveredOption ? hoverVarient?.carat_images?.[1] : selectedVariant?.carat_images?.[1]}
              alt="Hovered Image"
              preview={false}
              className="object-contain !h-full"
              fallback={'/images/no_images.svg'}
              style={{
                mixBlendMode: 'multiply',
              }}
            />
          </div>
          {(estimated_delivery_days &&
            projectSetting?.fastDeliveryDay &&
            projectSetting?.fastDeliveryDay?.data &&
            projectSetting?.fastDeliveryDay?.data?.delivery_day &&
            estimated_delivery_days <= projectSetting?.fastDeliveryDay?.data?.delivery_day) ||
          (handling_days && handling_days <= 2) ? (
            <div
              className={`absolute bottom-[0rem] md:w-[42px] sm:w-[38px] px-2 ${
                estimated_delivery_days &&
                projectSetting?.fastDeliveryDay &&
                projectSetting?.fastDeliveryDay?.data &&
                projectSetting?.fastDeliveryDay?.data?.delivery_day &&
                productVariation &&
                productVariation > '1' &&
                estimated_delivery_days <= projectSetting?.fastDeliveryDay?.data?.delivery_day
                  ? 'left-10'
                  : 'left-0'
              } sm:text-[12px]`}
            >
              <Image src={'/images/delivery.svg'} preview={false} alt="Delivery" />
            </div>
          ) : null}
          {(hoveredOption ? hoverVarient?.discount_value : selectedVariant?.discount_value) && (
            <div className="absolute bottom-5 sm:bottom-2 left-0 p-1 bg-primary text-text_w sm:text-[10px]">
              {(hoveredOption ? hoverVarient?.discount_value : selectedVariant?.discount_type) &&
              (hoveredOption ? hoverVarient?.discount_type : selectedVariant?.discount_type) == (2 as any)
                ? `${hoveredOption ? hoverVarient?.discount_value : selectedVariant?.discount_value}% off`
                : `$${hoveredOption ? hoverVarient?.discount_value : selectedVariant?.discount_value} off`}
            </div>
          )}
        </div>
        {is_stackable && isStackedProduct && (
          <div className="w-full h-full absolute top-0 left-0 bg-transparent flex items-center justify-center">
            <div className="bg-primary text-white px-2 py-1 w-fit ">Selected</div>
          </div>
        )}
      </div>

      <div className=" flex flex-col items-start">
        <ProductName productName={String(productName)} />

        {productDescription && (
          <Text size="textlg" as="p" className="tracking-[0.44px]">
            {productDescription}
          </Text>
        )}
        <div className="flex h-fit mt-2 items-center gap-2 sm:gap-1">
          <Text
            size="textlg"
            as="p"
            className={`!font-castoro ${hoveredOption ? (hoverVarient?.discount_value ? 'line-through text-gray-400 !text-[13px] sm:!text-[11px]' : '') : selectedVariant?.discount_value ? 'line-through text-gray-400 !text-[13px] sm:!text-[11px]' : ''}`}
          >
            {formatCurrency(hoveredOption ? hoverVarient?.selling_price : selectedVariant?.selling_price)}
          </Text>
          {hoveredOption
            ? hoverVarient?.discount_value && (
                <Text size="textlg" as="p" className="!font-castoro tracking-[0.44px] sm:text-[13px]">
                  {formatCurrency(hoveredOption ? hoverVarient?.discounted_price : selectedVariant?.discounted_price)}
                </Text>
              )
            : selectedVariant?.discount_value && (
                <Text size="textlg" as="p" className="!font-castoro tracking-[0.44px] sm:text-[13px]">
                  {formatCurrency(hoveredOption ? hoverVarient?.discounted_price : selectedVariant?.discounted_price)}
                </Text>
              )}
        </div>
      </div>

      {variation_to_show?.length !== 0 && (
        <div className="flex flex-col gap-2">
          {variation_to_show?.map((el: any, variantion_index: number) => {
            return (
              Object.keys(el).length !== 0 && (
                <div className="w-full">
                  <div className="grid grid-cols-5 sm:grid-cols-4 capitalize font-light w-[100%]">
                    <div className="col-span-1 text-[13px] sm:text-[10px] flex items-center">{el?.name?.replaceAll('_', ' ')}</div>
                    <div className="flex gap-1 col-span-4 sm:col-span-3 justify-center relative w-full">
                      <div className={`w-[${windowWidth < 640 ? '70%' : windowWidth <= 1024 ? '80%' : windowWidth <= 1536 ? '85%' : '90%'}]`}>
                        <Swiper
                          modules={[Virtual, Navigation, Pagination]}
                          onSwiper={(swiper) => {
                            setSwiperRef(swiper);
                          }}
                          onSlideChange={(swiper) => {
                            // Update states on slide change
                            setIsBeginnings[variantion_index](swiper.isBeginning);
                            setIsEnds[variantion_index](swiper.isEnd);
                          }}
                          loop={false}
                          slidesPerView={
                            ['/wishlist', 'premade', '/search'].includes(path)
                              ? windowWidth <= 768
                                ? 3 // md
                                : windowWidth <= 1024
                                  ? 3 // lg
                                  : windowWidth <= 1536
                                    ? 4 // xl
                                    : 5 // 2xl
                              : windowWidth < 640
                                ? 3 // sm
                                : windowWidth <= 768
                                  ? 3 // md
                                  : windowWidth <= 1024
                                    ? 3 // lg
                                    : windowWidth <= 1536
                                      ? 4 // xl
                                      : 5 // 2xl
                          }
                          spaceBetween={0}
                          // pagination={{
                          //   type: 'fraction',
                          // }}
                          navigation={{
                            prevEl: prevRefs[variantion_index].current,
                            nextEl: nextRefs[variantion_index].current,
                          }}
                          virtual
                          className="subtype-swiper"
                          // className=" border border-red-700"
                        >
                          <div className="absolute top-0 left-0  h-full w-[6px] sm:w-[6px] z-10 bg-gradient-to-r from-white"></div>
                          {el?.details?.map((detailsId: any, index: number) => {
                            const mdata = master?.find((item: any) =>
                              el?.name == 'metal_type' ? item.id === detailsId?.metal_color_id : item.id === detailsId,
                            );
                            const isMatch =
                              el?.name === 'metal_type'
                                ? Object.values(selectedVariant || {}).includes(detailsId?.metal_color_id) &&
                                  Object.values(selectedVariant || {}).includes(detailsId?.metal_type_id)
                                : Object.values(selectedVariant || {}).includes(detailsId);
                            // console.log(mdata, 'mdata');
                            return (
                              <SwiperSlide key={`${index}`} virtualIndex={index} className="!flex !justify-center items-center">
                                <div
                                  className={`flex w-fit justify-center p-1 sm:p-[2px] items-center cursor-pointer border-[0.8px] !aspect-square min-w-[40px] sm:min-w-[30px] ${isMatch ? 'border-primary' : 'border-transparent'} hover:border-primary relative`}
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
                                  onClick={() =>
                                    handleSelectedVatiation(
                                      el?.name === 'metal_type' ? detailsId?.metal_color_id : detailsId,
                                      el?.name === 'metal_type' ? detailsId?.metal_type_id : '',
                                      el?.name, // pass the name so the function knows what kind of field this is
                                    )
                                  }
                                >
                                  {el?.name == 'carat' ? (
                                    <div className="text-[13px] sm:text-[10px] aspect-square flex items-center justify-center">{mdata?.name}</div>
                                  ) : (
                                    <Image
                                      src={mdata?.image?.[0]}
                                      // height={30}
                                      preview={false}
                                      // width={30}
                                      fallback="/images/no_images.svg"
                                      alt="image"
                                      className="!w-[30px] !h-[30px] sm:!w-[24px] sm:aspect-square object-contain"
                                      // className={`${productSKU?.metalColor === newObj?.code ? '' : 'opacity-70'} cursor-pointer aspect-square`}
                                    />
                                  )}
                                </div>
                              </SwiperSlide>
                            );
                          })}
                          <div className="absolute top-0 right-0  h-full w-[6px] sm:w-[6px] z-10 bg-gradient-to-l from-white"></div>
                        </Swiper>
                      </div>
                      <div className="absolute top-[49%] w-full flex justify-between items-center">
                        <button
                          ref={prevRefs[variantion_index]}
                          className={`absolute -left-[5px] xl:left-0 sm:left-0 top-1/2 -translate-y-1/2 z-10 py-1.5 px-0 ${isBeginnings[variantion_index] ? 'opacity-30' : ''}`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1}
                            stroke="currentColor"
                            className="w-5 h-5"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                          </svg>
                        </button>
                        <button
                          ref={nextRefs[variantion_index]}
                          className={`absolute -right-[5px] xl:right-0 sm:right-0 top-1/2 -translate-y-1/2 z-10 py-1.5 px-0 ${isEnds[variantion_index] ? 'opacity-30' : ''}`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1}
                            stroke="currentColor"
                            className="w-5 h-5"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            );
          })}
        </div>
      )}

      {Array.isArray(specialProductTitles) && specialProductTitles.length > 0 && (
        <div className="absolute top-4 left-4 flex justify-center items-center gap-1">
          <span key={specialProductTitles[0].id} className="px-1.5 py-1 bg-white/50 text-primary sm:text-[10px] rounded-[0.45rem]">
            {specialProductTitles[0].title ?? ''}
          </span>
        </div>
      )}

      <div className="absolute top-0 right-0 sm:top-1 sm:right-1 p-1 pointer-events-auto">
        <button
          type="button"
          aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          className="flex min-h-[44px] min-w-[44px] cursor-pointer touch-manipulation items-center justify-center rounded-sm border-0 bg-transparent p-0 text-primary [-webkit-tap-highlight-color:transparent]"
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
  );
}
