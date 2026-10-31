'use client';
import React, { Suspense, useEffect, useState } from 'react';

import Link from 'next/link';

import ProductProfile from '@/components/ProductProfile';
import { YotpoInitWidgetsOnce } from '@/hook/useYotpo';
import { getBestSellers } from '@/services/productService';

import { Button, Text } from '../../components';
import UserProfile1 from '../../components/UserProfile1';

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

const data = [
  {
    userImage: 'img_ashclair_diam_450x384.png',
    userHeadline: (
      <>
        NAME OF THE PRODUCT
        <br />
        $50
      </>
    ),
  },
  {
    userImage: 'img_ashclair_diam_2.png',
    userHeadline: (
      <>
        NAME OF THE PRODUCT
        <br />
        $50
      </>
    ),
  },
  {
    userImage: 'img_ashclair_diam_3.png',
    userHeadline: (
      <>
        NAME OF THE PRODUCT
        <br />
        $50
      </>
    ),
  },
  {
    userImage: 'img_ashclair_diam_4.png',
    userHeadline: (
      <>
        NAME OF THE PRODUCT
        <br />
        $50
      </>
    ),
  },
];

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
  return (
    productList?.length > 0 && (
      <div className="mt-[74px] flex flex-col items-center lg:mt-10 2xl:mt-14 xl:mt-14 sm:mt-[20px]">
        <div className="container-xs flex flex-col items-center gap-[54px] 2xl:gap-9 xl:gap-9 lg:gap-7 sm:gap-3 2xl:px-[100px] xl:px-24 lg:px-20 md:px-5 sm:px-3 sm:py-3">
          <div className="flex flex-wrap items-center justify-between gap-5 self-stretch px-[0px] md:px-5 sm:px-0">
            <Text
              size="text5xl"
              as="p"
              className="uppercase tracking-[2.20px] md:text-[26px] sm:w-full sm:text-center sm:!text-[20px] lg:text-[22px]"
            >
              Our bestsellers selection
            </Text>
          </div>
          {/* Portrait tablets take the mobile 2-up grid. At 4 columns a card is only
            113-201px wide, and the "Metal Type" row inside it needs 178px even with
            every mobile size applied (54px label + 2 arrows + 3x28px chips), so the
            swatches are clipped at every portrait width. Landscape keeps 4 columns —
            there a card is wide enough once the row itself goes compact. */}
          <div className="grid grid-cols-4 gap-5 sm:gap-2 md:grid-cols-4 sm:grid-cols-2 sm:gap-y-2 w-full [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:grid-cols-2 [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:gap-y-2">
            {/* {loading && <Spin fullscreen></Spin>} */}
            {productList?.map((product, index) => {
              if (index < 4) {
                return <ProductProfile {...product} isStatic={true} key={'group2652' + index} className={`w-full`} />;
              }
            })}
          </div>
          <Link href="/all">
            <Button
              color="gray_800"
              shape="square"
              className="w-[348px] !h-[45px] tracking-[1.50px] 2xl:text-[16px]  md:w-[280px] xl:text-[16px] lg:text-[14px] lg:!h-[37px]"
            >
              DISCOVER ALL
            </Button>
          </Link>
        </div>
        {/* mobile device */}
        <div className="container-xs flex-col items-center gap-3 px-2 pb-5 hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 self-stretch px-2 sm:px-3">
            <Text size="text5xl" as="p" className="uppercase tracking-[2px]">
              Our bestsellers selection
            </Text>
            <Text size="textlg" as="p" className="!font-light">
              Discover our most sought-after products that customers love.
            </Text>
          </div>
          <div className="flex gap-2 w-full overflow-x-auto">
            <Suspense fallback={<div>Loading feed...</div>}>
              {data.map((d, index) => (
                <UserProfile1 {...d} key={'frame60' + index} />
              ))}
            </Suspense>
          </div>
          <Link href="/all">
            <Button color="gray_800" shape="square" className="w-full !h-[45px] tracking-[1.50px]">
              DISCOVER ALL
            </Button>
          </Link>
        </div>
      </div>
    )
  );
}
