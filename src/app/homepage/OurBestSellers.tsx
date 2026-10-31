'use client';
import React, { useEffect, useState } from 'react';

import { YotpoInitWidgetsOnce } from '@/hook/useYotpo';
import { getBestSellers } from '@/services/productService';

import BestSellersCarousel from './BestSellersCarousel';

type SpecialProductTitle = {
  id: string;
  title: string;
};

type Product = {
  productImage?: string;
  productHoverImage?: string;
  productName?: React.ReactNode;
  productFullTitle?: string;
  productDescription?: React.ReactNode;
  productPrice?: React.ReactNode;
  code?: string;
  isStatic?: boolean;
  isWishlist?: string | null;
  slug?: string;
  discount_type?: string | null;
  discount_value?: string | null;
  discounted_price?: string | null;
  jewelry_type?: string;
  sku_master_id?: string;
  jewelry_id?: string;
  estimated_delivery_days?: number | string | null;
  productVariation?: number | string | null;
  is_customizable?: boolean;
  variation_to_show?: any;
  variation_details?: any;
  jewelryDetails?: any;
  jewelryTypeData?: any;
  specialProductTitles?: SpecialProductTitle[] | null;
};

export default function OurBestSellers() {
  const [productList, setProductList] = useState<Product[]>([]);

  const fetchData = async () => {
    const res: any = await getBestSellers();

    const newData = await res.data?.data?.map((item: any): Product => {
      const carat_image = item.jewelryDetails[0]?.carat_images || [];
      const jewelryCode = item?.jewelrySubType?.parent_code;
      const jewelryType = jewelryCode?.toLowerCase().replace('_', '-');
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
        jewelryTypeData: jewelryType,
        productName: item?.title,
        productFullTitle: item?.fullTitle,
        // Yotpo keys reviews by this product-level code — the card's star rating needs it.
        code: item?.code,
        productPrice: `${Math.ceil(item?.jewelryDetails[0]?.selling_price)}`,
        // slug: `${jewelryType}/${item?.slug}`,
        // slug: item.jewelryDetails[0]?.sku_slug,
        // slug: `${jewelryType}/${item.jewelryDetails[0]?.sku_slug}`,
        slug: item?.is_customizable ? item.jewelryDetails[0]?.sku_slug : `${jewelryType}/premade?slug=${item.jewelryDetails[0]?.sku_slug}`,
        sku_master_id: item?.jewelryDetails[0]?.id,
        jewelry_id: item?.id,
        jewelry_type: item?.jewelrySubType?.parent_code,
        // isWishlist: item?.jewelryDetails[0]?.wishlist_id,
        isWishlist: item?.jewelryDetails[0]?.wishlist_id ? String(item.jewelryDetails[0]?.wishlist_id) : null,
        discount_type: item?.jewelryDetails[0]?.discount_type,
        discount_value: item?.jewelryDetails[0]?.discount_value,
        discounted_price: `${item?.jewelryDetails[0]?.discounted_price}`,
        specialProductTitles: item?.specialProductTitles || [],
      };
    });
    setProductList(newData);
    // setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (productList.length > 0) {
      YotpoInitWidgetsOnce();
    }
  }, [productList]);

  if (!productList?.length) {
    return null;
  }

  return <BestSellersCarousel products={productList} />;
}
