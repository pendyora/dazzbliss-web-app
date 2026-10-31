'use client';
/* eslint-disable @typescript-eslint/no-unused-expressions */

import React from 'react';

import { Image } from 'antd';
import Link from 'next/link';

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
  const SPEC = 'm-0 text-[12.5px] leading-[1.6] text-ink-soft';
  const NAME = '!m-0 !font-cormorant !text-[22px] !font-medium !leading-[1.15] !tracking-normal !text-ink sm:!text-[19px]';
  return (
    <div {...props} className={`${props.className} flex flex-1 flex-col font-libre text-ink`}>
      <div className="grid grid-cols-[clamp(88px,10vw,120px)_minmax(0,1fr)] gap-[clamp(14px,2vw,24px)] self-stretch border-b border-line pb-6 sm:grid-cols-[80px_minmax(0,1fr)]">
        <Image
          src={productDetails?.skuOrderItems?.carat_images?.[0] ? `${productDetails?.skuOrderItems?.carat_images?.[0]}` : '/images/no_images.svg'}
          alt="Ring Image"
          preview={false}
          wrapperClassName="!block aspect-[4/5] w-full overflow-hidden bg-stone"
          className="!h-full !w-full object-contain mix-blend-multiply"
        />
        <div className="grid min-w-0 content-start gap-3">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
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
                  fontFamily: productDetails?.engraving_text?.fontFamily,
                  text: productDetails?.engraving_text?.Text,
                };
                dispatch(setSelectedAppraisal(appraisalDetail));
                dispatch(setSelectedWarranty(warrantyDetail));
                dispatch(setSelectedEngraving(engravingDetail));
              }}
              className="min-w-0 text-ink hover:text-gilt"
            >
              <div className="grid gap-1.5">
                {productDetails?.is_free_gift && (
                  <span className="justify-self-start text-[10.5px] font-semibold uppercase tracking-[0.16em] text-gilt">Free Gift</span>
                )}
                <ProductName productName={productDetails?.jewelryOrderItems?.fullTitle} className={NAME} />
              </div>
            </Link>
            <div className="grid content-start gap-0.5 text-right tabular-nums">
              {productDetails?.jewelry_discount_price && (
                <strong className="text-[15px] font-medium text-ink">
                  {formatCurrency(
                    `${Math.ceil(
                      productDetails?.jewelry_discount_price +
                        (productDetails?.ring_size_rate ?? 0) +
                        (productDetails?.engraving_text?.Text ? (productDetails?.engraving_price ?? 0) : 0) +
                        (productDetails?.is_appraisal ? (productDetails?.appraisal_amount ?? 0) : 0) +
                        (productDetails?.selectedYearValue
                          ? (productDetails?.selectedYearValue?.price ?? 0)
                          : (productDetails?.warranty_amount ?? 0)),
                    )}`,
                  )}
                </strong>
              )}
              {productDetails?.jewelry_discount_price ? (
                <s className="whitespace-nowrap text-[12.5px] text-ink-faint">
                  {formatCurrency(
                    `${Math.ceil(
                      productDetails?.jewelry_price +
                        (productDetails?.ring_size_rate ?? 0) +
                        (productDetails?.engraving_text?.Text ? (productDetails?.engraving_price ?? 0) : 0) +
                        (productDetails?.is_appraisal ? (productDetails?.appraisal_amount ?? 0) : 0) +
                        (productDetails?.selectedYearValue
                          ? (productDetails?.selectedYearValue?.price ?? 0)
                          : (productDetails?.warranty_amount ?? 0)),
                    )}`,
                  )}
                </s>
              ) : (
                <strong className="whitespace-nowrap text-[15px] font-medium text-ink">
                  {formatCurrency(
                    `${Math.ceil(
                      productDetails?.jewelry_price +
                        (productDetails?.ring_size_rate ?? 0) +
                        (productDetails?.engraving_text?.Text ? (productDetails?.engraving_price ?? 0) : 0) +
                        (productDetails?.is_appraisal ? (productDetails?.appraisal_amount ?? 0) : 0) +
                        (productDetails?.selectedYearValue
                          ? (productDetails?.selectedYearValue?.price ?? 0)
                          : (productDetails?.warranty_amount ?? 0)),
                    )}`,
                  )}
                </strong>
              )}
            </div>
          </div>
          <div className="grid gap-0.5">
            <p className={SPEC}>{productDetails?.jewelryOrderItems?.jewelrySubType?.group}</p>
            <p className={SPEC}>{master.find((el: any) => el.id === productDetails?.skuOrderItems?.metal_color_id)?.name}</p>
            <p className={SPEC}>
              {master &&
                master?.find((el: any) => {
                  const diamondId =
                    productDetails?.skuOrderItems?.center_diamond_id ??
                    productDetails?.skuOrderItems?.accent_diamond_id ??
                    productDetails?.skuOrderItems?.second_accent_diamond_id ??
                    productDetails?.skuOrderItems?.metal_id;

                  el.id === productDetails?.skuOrderItems?.center_diamond_id;
                  return el?.id === diamondId;
                })?.group}
              {' · '}
              {master.find((el: any) => el.id === productDetails?.skuOrderItems?.metal_type_id)?.name}
            </p>
            {productDetails?.ring_size ? <p className={SPEC}>Ring Size: {productDetails?.ring_size}</p> : null}
            {productDetails?.skuOrderItems?.bracelet_length_ids ? (
              <p className={SPEC}>
                Bracelet Length - Inch: {master.find((item: any) => item.id === productDetails?.skuOrderItems?.bracelet_length_ids)?.name}
              </p>
            ) : null}
            {productDetails?.skuOrderItems?.band_width_ids ? (
              <p className={SPEC}>Band Width - mm: {master.find((item: any) => item.id === productDetails?.skuOrderItems?.band_width_ids)?.name}</p>
            ) : null}
          </div>

          {(productDetails?.engraving_text?.Text ||
            productDetails?.is_appraisal ||
            productDetails?.selectedYearValue ||
            productDetails?.is_warranty) && (
            <div className="grid border-t border-line">
              {productDetails?.engraving_text?.Text ? (
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3.5 border-b border-dashed border-line py-2.5 text-[13px] last:border-b-0">
                  <span>
                    Engraving{' '}
                    <q className="font-cormorant text-[16px] italic text-ink" style={{ fontFamily: productDetails?.engraving_text?.fontFamily }}>
                      {productDetails?.engraving_text?.Text}
                    </q>
                    <span className="block text-[12px] text-ink-soft">Font: {productDetails?.engraving_text?.fontFamily}</span>
                  </span>
                  <span className="text-[12.5px] tabular-nums text-ink-soft">+{formatCurrency(productDetails?.engraving_price ?? 0)}</span>
                </div>
              ) : null}
              {productDetails?.is_appraisal && (
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3.5 border-b border-dashed border-line py-2.5 text-[13px] last:border-b-0">
                  <span>Appraisal</span>
                  <span className="text-[12.5px] tabular-nums text-ink-soft">+{formatCurrency(productDetails?.appraisal_amount)}</span>
                </div>
              )}
              {(productDetails?.selectedYearValue || productDetails?.is_warranty) && (
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3.5 border-b border-dashed border-line py-2.5 text-[13px] last:border-b-0">
                  <span>
                    Warranty{' '}
                    <span className="text-ink-soft">
                      · {productDetails?.selectedYearValue?.year ? productDetails?.selectedYearValue?.year : productDetails?.warranty_year} Year
                    </span>
                  </span>
                  <span className="text-[12.5px] tabular-nums text-ink-soft">
                    +
                    {formatCurrency(
                      productDetails?.selectedYearValue?.price
                        ? productDetails?.selectedYearValue?.price
                        : productDetails?.warranty_amount
                          ? productDetails?.warranty_amount
                          : 0,
                    )}
                  </span>
                </div>
              )}
            </div>
          )}

          {productDetails?.diamondDetails && (
            <div className="flex items-center gap-3 border-y border-dashed border-line py-3 text-[12.5px]">
              <Image
                src={
                  master.find((item: any) => item?.name === productDetails?.diamondDetails?.shape_name && item?.parent_code == 'SHAPE')?.image?.[0]
                }
                preview={false}
                wrapperClassName="!block h-8 w-8 flex-none"
                className="aspect-square !h-8 !w-8 object-contain"
                fallback="/images/no_images.svg"
                alt={productDetails?.diamondDetails?.shape_name}
              />
              <div className="min-w-0 flex-1">
                <span className="block text-ink">{productDetails?.diamondDetails?.fullTitle}</span>
                <span className="text-ink-soft">
                  Clarity {productDetails?.diamondDetails?.clr} · Color {productDetails?.diamondDetails?.col} · Shape{' '}
                  {productDetails?.diamondDetails?.shape_name} ·{' '}
                  {productDetails?.diamondDetails?.diamond_type == 2 ? 'Lab Grown Diamond' : 'Natural Diamond'}
                </span>
              </div>
              <span className="tabular-nums text-ink">{formatCurrency(productDetails?.diamondDetails?.price)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
