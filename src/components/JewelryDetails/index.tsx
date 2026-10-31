'use client';
/* eslint-disable @typescript-eslint/no-unused-expressions */

import React from 'react';

import { Image } from 'antd';
import Link from 'next/link';

import { Text } from '@/components/Text';
import { setSelectedAppraisal, setSelectedEngraving, setSelectedRingSizeId, setSelectedWarranty, useAppDispatch, useAppSelector } from '@/store';
import { formatCurrency } from '@/utils/common';

import ProductName from '../CartProductDetails/ProductName';

interface Props {
  className?: string;
  diamondRingName?: React.ReactNode;
  diamondRingPrice?: React.ReactNode;
  ringName?: React.ReactNode;
  ringMaterial?: React.ReactNode;
  ringDescription?: React.ReactNode;
  ringSize?: React.ReactNode;
  stoneName?: React.ReactNode;
  stonePrice?: React.ReactNode;
  stoneClarity?: React.ReactNode;
  stoneColor?: React.ReactNode;
  stoneDescription?: React.ReactNode;
  productDetails?: any;
}

export default function JewelryDetails({
  // diamondRingName = 'Diamond Ring',
  // diamondRingPrice = '$50',
  // ringName = 'Ring',
  // ringMaterial = 'Yellow Gold',
  // ringDescription = 'lab grown diamond  |  14k',
  // ringSize = 'Ring Size : 6',
  // stoneName = 'The Stone',
  // stonePrice = '$2880',
  // stoneClarity = 'Clarity : VVSI',
  // stoneColor = 'Color : G',
  // stoneDescription = 'lab grown diamond  |  14k',
  productDetails,
  ...props
}: Props) {
  const dispatch = useAppDispatch();
  const master = useAppSelector((s) => s.master.data);
  const is_customizable = productDetails?.jewelryOrderItems?.is_customizable;
  const jewelryTypeName = productDetails?.jewelryOrderItems?.jewelrySubType?.parent_code;
  const jewelryTypeData = jewelryTypeName?.toLowerCase()?.replace('_', '-');
  return (
    <div {...props} className={`${props.className} flex flex-col items-center gap-6 flex-1`}>
      <div className="flex flex-col items-end gap-2 self-stretch border-b border-gray-400 pb-6">
        <div className="flex items-start justify-end gap-3.5 md:gap-[10px] self-stretch ">
          <Image
            src={productDetails?.skuOrderItems?.carat_images?.[0] ? `${productDetails?.skuOrderItems?.carat_images?.[0]}` : '/images/no_images.svg'}
            alt="Ring Image"
            width={100}
            preview={false}
            // `width={100}` is an inline style on antd's `.ant-image` wrapper, so a width class on
            // the <img> can only ever be a fraction of 100px — which is why the old `md:!w-[280px]`
            // overflowed and a percentage collapsed to a few pixels. Below 769px the wrapper is
            // sized instead and the image simply fills it.
            wrapperClassName="shrink-0 md:!h-[110px] md:!w-[110px] sm:!h-[92px] sm:!w-[92px]"
            className="h-[126px] w-[12%] md:!h-full md:!w-full !aspect-square 2xl:h-auto object-contain bg-[#f8f8f8]"
          />
          <div className="flex flex-1 flex-col gap-2.5 self-center">
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-3 gap-5 md:gap-[10px]">
                <Link
                  href={
                    is_customizable
                      ? `/custom-jewelry?type=2&state=c&id=${productDetails?.skuOrderItems?.sku_slug}&did=${productDetails?.diamondDetails?.id}`
                      : `/${jewelryTypeData}/premade?slug=${productDetails?.skuOrderItems?.sku_slug}`
                  }
                  onClick={() => {
                    const warrantyDetail = {
                      warrantyName: `${productDetails?.warranty_year} ${productDetails?.warranty_amount}`,
                      yearPrice: {
                        year: productDetails?.warranty_year,
                        price: productDetails?.warranty_amount,
                      },
                    };

                    const appraisalDetail = {
                      appraisalName: productDetails?.appraisalDetails?.id,
                      multipler: '',
                      polish: '',
                      price: productDetails?.appraisal_amount,
                      symmetry: '',
                    };
                    const engravingDetail = {
                      fontFamily: productDetails?.engravingText?.fontFamily,
                      text: productDetails?.engravingText?.Text,
                    };
                    dispatch(setSelectedAppraisal(appraisalDetail));
                    dispatch(setSelectedWarranty(warrantyDetail));
                    dispatch(setSelectedEngraving(engravingDetail));
                  }}
                  className="col-span-2"
                >
                  <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
                    {productDetails?.is_free_gift && (
                      <span className="mt-[3px] shrink-0 bg-secondary px-2 py-[2px] font-sans text-[9px] uppercase leading-[14px] tracking-[1.2px] text-text_w">
                        Free Gift
                      </span>
                    )}
                    <ProductName productName={productDetails?.jewelryOrderItems?.fullTitle} />
                  </div>
                </Link>
                <div className="flex h-fit col-span-1 gap-2 items-center lg:flex-wrap lg:justify-end lg:gap-0 justify-self-end">
                  <Text
                    as="p"
                    size="textlg"
                    className={`!font-castoro text-[20px] text-right font-medium tracking-[0.40px] !text-black text-nowrap lg:text-[20px] md:!text-[16px] ${
                      productDetails?.jewelry_discount_price
                        ? 'line-through !text-gray-400 !text-[16px] md:!text-[12px] lg:!text-[16px] sm:!text-[12px]'
                        : 'sm:!text-[14px]'
                    }`}
                  >
                    {formatCurrency(
                      `${Math.ceil(
                        productDetails?.jewelry_price +
                          (productDetails?.ring_size_rate ?? 0) +
                          (productDetails?.engravingText?.Text ? (productDetails?.engraving_price ?? 0) : 0) +
                          (productDetails?.is_appraisal ? (productDetails?.appraisal_amount ?? 0) : 0) +
                          (productDetails?.selectedYearValue
                            ? (productDetails?.selectedYearValue?.price ?? 0)
                            : (productDetails?.warranty_amount ?? 0)),
                      )}`,
                    )}
                  </Text>
                  {productDetails?.jewelry_discount_price && (
                    <Text
                      as="p"
                      size="textlg"
                      className={`!font-castoro sm:pl-1 text-[20px] text-right font-medium tracking-[0.40px] text-nowrap lg:text-[20px] !text-black md:!text-[16px] sm:!text-[14px]`}
                    >
                      {formatCurrency(
                        `${Math.ceil(
                          productDetails?.jewelry_discount_price +
                            (productDetails?.ring_size_rate ?? 0) +
                            (productDetails?.engravingText?.Text ? (productDetails?.engraving_price ?? 0) : 0) +
                            (productDetails?.is_appraisal ? (productDetails?.appraisal_amount ?? 0) : 0) +
                            (productDetails?.selectedYearValue
                              ? (productDetails?.selectedYearValue?.price ?? 0)
                              : (productDetails?.warranty_amount ?? 0)),
                        )}`,
                      )}
                    </Text>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-start">
                <Text as="p" size="textlg" className="text-[12px] tracking-[0.20px] text-slate-400">
                  {productDetails?.jewelryOrderItems?.jewelrySubType?.group}
                </Text>
                <Text as="p" size="textlg" className="text-[12px] tracking-[0.20px] text-slate-400">
                  {master.find((el: any) => el.id === productDetails?.skuOrderItems?.metal_color_id)?.name}
                </Text>
                <Text as="p" size="textlg" className="text-[12px] tracking-[0.20px] text-slate-400">
                  {master &&
                    master?.find((el: any) => {
                      const diamondId =
                        productDetails?.skuOrderItems?.center_diamond_id ??
                        productDetails?.skuOrderItems?.accent_diamond_id ??
                        productDetails?.skuOrderItems?.second_accent_diamond_id ??
                        productDetails?.skuOrderItems?.metal_id;

                      el.id === productDetails?.skuOrderItems?.center_diamond_id;
                      // ??
                      // productDetails?.skuOrderItems?.accent_diamond_id ??
                      // productDetails?.skuOrderItems
                      //   ?.second_accent_diamond_id ??
                      // productDetails?.skuOrderItems?.metal_id
                      return el?.id === diamondId;
                    })?.group}
                  {' | '}
                  {master.find((el: any) => el.id === productDetails?.skuOrderItems?.metal_type_id)?.name}
                </Text>
                {productDetails?.ring_size ? (
                  <Text as="p" size="textlg" className="text-[12px] tracking-[0.20px] text-slate-400">
                    Ring Size : {productDetails?.ring_size}
                  </Text>
                ) : null}
                {productDetails?.skuOrderItems?.bracelet_length_ids ? (
                  <Text as="p" size="textlg" className="text-[12px] tracking-[0.20px] text-slate-400">
                    Bracelet Length - Inch : {master.find((item: any) => item.id === productDetails?.skuOrderItems?.bracelet_length_ids)?.name}
                  </Text>
                ) : null}
                {productDetails?.skuOrderItems?.band_width_ids ? (
                  <Text as="p" size="textlg" className="text-[12px] tracking-[0.20px] text-slate-400">
                    Band Width - mm : {master.find((item: any) => item.id === productDetails?.skuOrderItems?.band_width_ids)?.name}
                  </Text>
                ) : null}

                {productDetails?.engravingText?.Text ? (
                  <>
                    <Text as="p" size="textlg" className="text-[12px] tracking-[0.20px] text-slate-400">
                      Engraving Text:{' '}
                      <span style={{ fontFamily: productDetails?.engravingText?.fontFamily }}>{productDetails?.engravingText?.Text}</span>
                    </Text>
                    <Text as="p" size="textlg" className="text-[12px] tracking-[0.20px] text-slate-400">
                      Engraving Font Family : {productDetails?.engravingText?.fontFamily}
                    </Text>
                    <Text as="p" size="textlg" className="text-[12px] tracking-[0.20px] text-slate-400">
                      Engraving Price:<span className="!font-bold">{formatCurrency(productDetails?.engraving_price ?? 0)}</span>
                    </Text>
                  </>
                ) : null}
                {productDetails?.is_appraisal && (
                  <Text as="p" size="textlg" className="text-[12px] tracking-[0.20px] text-slate-400">
                    Appraisal Price: <span className="!font-bold">{formatCurrency(productDetails?.appraisal_amount)}</span>
                  </Text>
                )}
                {(productDetails?.selectedYearValue || productDetails?.is_warranty) && (
                  <Text as="p" size="textlg" className="text-[12px] tracking-[0.20px] text-slate-400">
                    Warranty: {productDetails?.selectedYearValue?.year ? productDetails?.selectedYearValue?.year : productDetails?.warranty_year} Year
                    (+
                    <span className="!font-bold">
                      {formatCurrency(
                        productDetails?.selectedYearValue?.price
                          ? productDetails?.selectedYearValue?.price
                          : productDetails?.warranty_amount
                            ? productDetails?.warranty_amount
                            : 0,
                      )}
                    </span>
                    )
                  </Text>
                )}
              </div>
            </div>
            {productDetails?.diamondDetails && (
              <div className="flex flex-col gap-5 sm:gap-2">
                <div className="h-px bg-gray-400" />
                <div className="flex flex-col gap-1 items-start justify-center">
                  <div className="grid grid-cols-3 w-full">
                    <div className="col-span-2">
                      <ProductName productName={productDetails?.diamondDetails?.fullTitle} />
                    </div>
                    <Text
                      as="p"
                      size="textlg"
                      className={`!font-castoro sm:pl-1 text-[20px] text-right font-medium tracking-[0.40px] text-nowrap lg:text-[20px] !text-black md:!text-[16px] sm:!text-[14px]`}
                    >
                      {formatCurrency(productDetails?.diamondDetails?.price)}
                    </Text>
                  </div>

                  <div className="w-[30px] aspect-square">
                    <Image
                      src={
                        master.find((item: any) => item?.name === productDetails?.diamondDetails?.shape_name && item?.parent_code == 'SHAPE')
                          ?.image?.[0]
                      }
                      preview={false}
                      className="w-full aspect-square object-contain"
                      fallback="/images/no_images.svg"
                      alt={productDetails?.diamondDetails?.shape_name}
                    />
                  </div>
                  <div>
                    <p className="text-[16px] tracking-[0.20px] text-slate-400 sm:!text-[12px]">Clarity: {productDetails?.diamondDetails?.clr}</p>
                    <p className="text-[16px] tracking-[0.20px] text-slate-400 sm:!text-[12px]">Color: {productDetails?.diamondDetails?.col}</p>
                    <p className="text-[16px] tracking-[0.20px] text-slate-400 sm:!text-[12px]">
                      Shape: {productDetails?.diamondDetails?.shape_name}
                    </p>
                    <p className="text-[16px] tracking-[0.20px] text-slate-400 sm:!text-[12px]">
                      {productDetails?.diamondDetails?.diamond_type == 2 ? 'Lab Grown Diamond' : 'Natural Diamond'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
