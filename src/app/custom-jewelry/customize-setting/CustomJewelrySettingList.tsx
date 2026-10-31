'use client';
import React, { useEffect, useState, useCallback } from 'react';

import { LuLoader } from 'react-icons/lu';

import { gridClassName, PlpGridSkeleton } from '@/app/[jewelryType]/PlpGrid';
import ProductProfile from '@/components/ProductProfile';
import {
  setSelectedAppraisal,
  setSelectedEngraving,
  setSelectedProductsDetails,
  setSelectedRingSizeId,
  setSelectedRingSizeRedux,
  setSelectedWarranty,
  useAppDispatch,
  useAppSelector,
} from '@/store';
import { fetchSettings, setSelectedSettingStore, setSettingPageNumber } from '@/store/slices/customProducts/customProductSlice';

export interface CustomSettingType {
  image: string;
  name: string;
  description: string;
  price: string;
}

export default function CustomJewelrySettingList({
  selectionRoute,
  setActiveStep,
  setSelectedSetting,
  isLoading,
}: {
  selectionRoute: number;
  isLoading: boolean;
  setActiveStep: React.Dispatch<React.SetStateAction<'diamond' | 'setting' | 'complete'>>;
  setSelectedSetting: React.Dispatch<React.SetStateAction<any>>;
}) {
  const dispatch = useAppDispatch();
  const settingListData = useAppSelector((s) => s.customProduct.settingList.rows);
  const { settingFilters, settingPageNumber, settingPageSize, selectedSettingFilters } = useAppSelector((state) => state.customProduct);
  const masterRingSizePrice = useAppSelector((state) => state?.master?.ringSizePriceList);
  const productsLoading = useAppSelector((state) => state.customProduct?.loading);
  const counts = useAppSelector((state) => state.customProduct?.settingList?.count);
  const [products, setProducts] = useState<any>();
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  function getPriceViaRingAndMetal(ringSize: null | string = '0', metal: string) {
    const ProductPrice = masterRingSizePrice?.find((item: any) => item.ring_size_id == ringSize && item.metal_type_id == metal);
    return ringSize && ringSize !== '0' ? ProductPrice?.rate : 0;
  }
  useEffect(() => {
    if (settingListData && settingListData?.length >= 0) {
      setProducts(
        settingListData?.map((item) => {
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
        }),
      );
    }
  }, [settingListData]);

  const handleScroll = useCallback(() => {
    if (productsLoading || isLoadingMore || !counts || products?.length >= counts) {
      return;
    }

    const scrollPosition = window.scrollY + window.innerHeight;
    const totalHeight = document.documentElement.scrollHeight;
    const scrollPercentage = (scrollPosition / totalHeight) * 100;

    if (scrollPercentage > 70) {
      setIsLoadingMore(true);
      const nextPage = settingPageNumber + 1;
      dispatch(setSettingPageNumber(nextPage));
      dispatch(
        fetchSettings({
          data: {
            ...selectedSettingFilters,
          },
          page: nextPage,
          size: settingPageSize,
        }),
      ).then(() => setIsLoadingMore(false));
    }
  }, [settingPageNumber, counts, products?.length, productsLoading, isLoadingMore, dispatch, selectedSettingFilters, settingPageSize]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <section className="w-full bg-paper">
      <div className="mx-auto w-full max-w-[1440px] px-[clamp(16px,3.2vw,56px)] pb-20 md:pb-14">
        {products?.length > 0 ? (
          <div className={gridClassName(4)}>
            {products?.map((product: any, index: number) => (
              <div
                key={index}
                className="min-w-0 cursor-pointer"
                onClick={() => {
                  dispatch(setSelectedSettingStore(null));
                  dispatch(setSelectedProductsDetails(null));

                  dispatch(setSelectedRingSizeRedux(null));
                  dispatch(setSelectedRingSizeId(null));

                  dispatch(setSelectedAppraisal(null));
                  dispatch(setSelectedWarranty(null));
                  dispatch(setSelectedEngraving(null));
                }}
              >
                <ProductProfile
                  {...product}
                  isStatic={true}
                  layout="plp"
                  selectionRoute={selectionRoute}
                  key={'group2652' + index}
                  className={`w-full`}
                  specialProductTitles={product.specialProductTitles || []}
                />
              </div>
            ))}
          </div>
        ) : !isLoading && products?.length == 0 ? (
          <div className="grid min-h-[30vh] place-items-center content-center gap-3 border-y border-line py-16 text-center">
            <span className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-gilt">No matches</span>
            <p className="m-0 font-cormorant text-[clamp(26px,2.6vw,36px)] leading-none text-ink">
              No <em className="italic text-gilt">settings</em> available
            </p>
            <p className="m-0 text-[14px] leading-[1.65] text-ink-soft">Try removing a filter to see more designs.</p>
          </div>
        ) : isLoading && !(products?.length > 0) ? (
          <PlpGridSkeleton columns={4} count={8} />
        ) : (
          <></>
        )}

        {isLoadingMore && (
          <div className="flex w-full items-center justify-center gap-3 py-6 text-[10.5px] uppercase tracking-[0.16em] text-ink-soft">
            <LuLoader className="h-5 w-5 animate-spin text-ink" />
            Loading more
          </div>
        )}
      </div>
    </section>
  );
}
