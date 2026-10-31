'use client';

import React, { useEffect, useState } from 'react';

import { Button, Image } from 'antd';
import Link from 'next/link';
import { FaMinus, FaPlus } from 'react-icons/fa6';

import { setSelectedAppraisal, setSelectedEngraving, setSelectedWarranty, useAppDispatch, useAppSelector } from '@/store';
import { formatCurrency } from '@/utils/common';

import EditEngraving from './EditEngraving';
import EditRingSize from './EditRingSize';
import ProductName from './ProductName';
import { Heading } from '../../components/Heading';
import { Text } from '../../components/Text';

interface Props {
  index: number;
  className?: string;
  removeText?: React.ReactNode;
  productName?: React.ReactNode;
  productPrice?: React.ReactNode;
  productType?: React.ReactNode;
  productMaterial?: React.ReactNode;
  productDescription?: React.ReactNode;
  sizeLabel?: React.ReactNode;
  wishlistButton?: string;
  stoneName?: React.ReactNode;
  stonePrice?: React.ReactNode;
  clarityText?: React.ReactNode;
  colorText?: React.ReactNode;
  stoneDescription?: React.ReactNode;
  productDetails?: any;
  handleRemoveProducts?: any;
  handleCount?: any;
  handleUpdateRingSize?: any;
  handleUpdateEngraving?: any;
  diamondDetails: any;
}

export default function CartProductDetails({
  index,
  removeText = 'remove',
  productName = '14K White Gold Petite Elodie 1.5mm Ring',
  productPrice = '$50',
  productType = 'Ring',
  productMaterial = 'Yellow Gold',
  productDescription = 'lab grown diamond  |  14k',
  sizeLabel = 'choose size',
  wishlistButton = 'ADD TO WISHLIST',
  stoneName = 'The Stone',
  stonePrice = '$2880',
  clarityText = 'Clarity : VVSI',
  colorText = 'Color : G',
  stoneDescription = 'lab grown diamond  |  14k',
  productDetails,
  handleRemoveProducts,
  handleCount,
  handleUpdateRingSize,
  handleUpdateEngraving,
  diamondDetails = null,
  ...props
}: Props) {
  const dispatch = useAppDispatch();
  const master = useAppSelector((state) => state.master.data);
  const { appraisalData, engraving }: any = useAppSelector((state) => state?.master);

  const [count, setCount] = useState(1);
  const jewelry_type =
    productDetails?.jewelry_sku?.center_diamond_id ??
    productDetails?.jewelry_sku?.accent_diamond_id ??
    productDetails?.jewelry_sku?.second_accent_diamond_id ??
    productDetails?.jewelry_sku?.metal_id;
  const diamondGroup = master && master?.find((el: any) => el?.id === jewelry_type);

  useEffect(() => {
    setCount(productDetails?.count);
  }, [productDetails]);

  const jewelryTypeName = productDetails?.cartJewelryDetails?.jewelrySubType?.parent_code;
  const jewelryTypeData = jewelryTypeName?.toLowerCase()?.replace('_', '-');

  const yearValue = productDetails?.selectedYearValue?.year ?? productDetails?.warranty_year;

  const isCustom = productDetails?.cartJewelryDetails?.is_customizable;

  // Ring size / engraving are editable in the cart for any sized ring / engraving-enabled
  // product, including custom jewelry. Availability is driven by whether the line actually
  // carries a ring-size pricing row / has engraving enabled. These controls are grouped at
  // the bottom of the card (reference layout).
  const canEditRingSize = Boolean(productDetails?.ringSizePricingDetails) && Boolean(handleUpdateRingSize);
  const canEditEngraving = Boolean(productDetails?.cartJewelryDetails?.is_engraving) && Boolean(handleUpdateEngraving);

  const baseHref = isCustom
    ? `/custom-jewelry?type=2&did=${productDetails?.diamondDetails?.id}&state=c&id=${productDetails?.jewelry_sku?.sku_slug}`
    : `/${jewelryTypeData}/premade?slug=${productDetails?.jewelry_sku?.sku_slug}&appraisal=${productDetails?.is_appraisal}&warranty=${productDetails?.is_warranty}`;

  const finalHref = !isCustom && yearValue ? `${baseHref}&year=${yearValue}` : baseHref;

  return (
    <div {...props} className={`${props.className} flex flex-col items-center gap-[30px] sm:gap-2 flex-1`}>
      <div className="flex items-start gap-5 self-stretch sm:gap-2">
        <div className="flex w-[26%] flex-col items-center gap-2 ">
          <div className="!aspect-square w-full flex justify-center items-center bg-[#f8f8f8]">
            <Image
              src={productDetails?.jewelry_sku?.carat_images?.[0] ? `${productDetails?.jewelry_sku?.carat_images?.[0]}` : `/images/no_images.svg`}
              alt="Product Image"
              loading="lazy"
              preview={false}
              className="object-contain mix-blend-multiply"
            />
          </div>

          <div
            className="flex items-center gap-2.5 sm:justify-center cursor-pointer"
            onClick={handleRemoveProducts ? () => handleRemoveProducts(productDetails, index) : undefined}
          >
            <Image src="/images/img_fi_2961937.svg" preview={false} alt="Remove Icon" width={16} height={16} className="h-[16px] w-[16px]" />
            <Text as="p" size="textlg" className="self-center !font-light !font-sans capitalize tracking-[0.5px] mb-[2px] text-red-a700 underline">
              remove
            </Text>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-3 self-stretch md:self-stretch">
          <div className="flex flex-col gap-3.5 sm:gap-2">
            <div className="flex flex-col gap-3.5 sm:gap-2">
              <div className="flex flex-col gap-3 sm:gap-2">
                <div className="grid grid-cols-4 gap-5">
                  <Link
                    href={finalHref}
                    className="group col-span-3 cursor-pointer"
                    onClick={() => {
                      const warrantyDetail = {
                        warrantyName: `${productDetails?.warranty_year} ${productDetails?.warranty_amount}`,
                        yearPrice: {
                          year: productDetails?.warranty_year,
                          price: productDetails?.warranty_amount,
                        },
                      };

                      const appraisalDetail = productDetails?.is_appraisal ? { ...appraisalData } : null;
                      const engravingDetail = {
                        fontFamily: productDetails?.engraving_text?.fontFamily,
                        text: productDetails?.engraving_text?.Text,
                      };
                      dispatch(setSelectedAppraisal(appraisalDetail));
                      dispatch(setSelectedWarranty(warrantyDetail));
                      dispatch(setSelectedEngraving(engravingDetail));
                    }}
                  >
                    <ProductName productName={productDetails?.fullTitle} className="group-hover:underline" />
                  </Link>
                  <div className="flex h-fit gap-2 items-center justify-self-end 2xl:flex-wrap 2xl:justify-end 2xl:gap-0">
                    <Heading
                      as="h6"
                      size="headingxs"
                      className={`!font-castoro text-[20px] col-span-1 !font-light tracking-[0.48px] !text-black lg:!text-[18px] md:text-[16px] sm:!text-[12px] ${
                        productDetails?.jewelry_sku?.discounted_price
                          ? 'line-through !text-gray-400 !text-[18px] md:!text-[14px] lg:!text-[14px]'
                          : ''
                      }`}
                    >
                      {formatCurrency(
                        Math.ceil(
                          productDetails?.jewelry_sku?.selling_price +
                            (productDetails?.ringSizePricingDetails ? productDetails?.ringSizePricingDetails?.rate : 0) +
                            (productDetails?.is_appraisal ? appraisalData?.price : 0) +
                            (productDetails?.selectedYearValue
                              ? productDetails?.selectedYearValue?.price
                              : productDetails?.warranty_amount
                                ? productDetails?.warranty_amount
                                : 0) +
                            (productDetails?.engraving_text && productDetails?.engraving_text.Text != '' ? engraving?.data?.engraving_price : 0),
                        ),
                      )}
                    </Heading>
                    {productDetails?.jewelry_sku?.discounted_price && (
                      <Heading
                        as="h6"
                        size="headingxs"
                        className={`text-[20px] pl-2 col-span-1 !font-light !font-castoro tracking-[0.48px] !text-black md:text-[16px] lg:!text-[18px] sm:!text-[14px]`}
                      >
                        {formatCurrency(
                          Math.ceil(
                            productDetails?.jewelry_sku?.discounted_price +
                              (productDetails?.ringSizePricingDetails ? productDetails?.ringSizePricingDetails?.rate : 0) +
                              (productDetails?.is_appraisal ? appraisalData?.price : 0) +
                              (productDetails?.selectedYearValue
                                ? productDetails?.selectedYearValue?.price
                                : productDetails?.warranty_amount
                                  ? productDetails?.warranty_amount
                                  : 0) +
                              (productDetails?.engraving_text && productDetails?.engraving_text.Text != '' ? engraving?.data?.engraving_price : 0),
                          ),
                        )}
                      </Heading>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-start justify-center">
                  <Text as="p" size="textlg" className="text-[12px] tracking-[0.20px] text-slate-400">
                    {productDetails?.cartJewelryDetails?.jewelrySubType?.group}
                  </Text>
                  <Text as="p" size="textlg" className="text-[12px] tracking-[0.20px] text-slate-400">
                    {master.find((item: any) => item.id === productDetails?.jewelry_sku?.metal_color_id)?.name}
                  </Text>
                  <Text as="p" size="textlg" className="text-[12px] capitalize tracking-[0.20px] text-slate-400">
                    {diamondGroup?.group}
                    {' | '}
                    {master.find((item: any) => item.id === productDetails?.jewelry_sku?.metal_type_id)?.name}
                  </Text>
                  {productDetails?.ringSizePricingDetails && !canEditRingSize && (
                    <Text as="p" size="textlg" className="text-[12px] tracking-[0.20px] text-slate-400">
                      {/* Ring Size: {productDetails?.ring_size} */}
                      Ring Size: {master.find((item: any) => item.id === productDetails?.ringSizePricingDetails?.ring_size_id)?.name}
                    </Text>
                  )}
                  {productDetails?.is_appraisal && (
                    <Text as="p" size="textlg" className="text-[12px]  tracking-[0.20px] text-slate-400">
                      Appraisal Price: <span className="!font-bold">{formatCurrency(appraisalData?.price)}</span>
                    </Text>
                  )}
                  {productDetails?.jewelry_sku?.bracelet_length_ids && (
                    <Text as="p" size="textlg" className="text-[12px] tracking-[0.20px] text-slate-400">
                      Bracelet Length - Inch : {master.find((item: any) => item.id === productDetails?.jewelry_sku?.bracelet_length_ids)?.name}
                    </Text>
                  )}
                  {productDetails?.jewelry_sku?.band_width_ids && (
                    <Text as="p" size="textlg" className="text-[12px] tracking-[0.20px] text-slate-400">
                      Band Width - mm : {master.find((item: any) => item.id === productDetails?.jewelry_sku?.band_width_ids)?.name}
                    </Text>
                  )}
                  {!canEditEngraving && productDetails?.engraving_text && productDetails?.engraving_text.Text != '' && (
                    <>
                      <Text as="p" size="textlg" className="text-[12px] tracking-[0.20px] text-slate-400">
                        Engraving Text:{' '}
                        <span style={{ fontFamily: productDetails?.engraving_text.fontFamily }}>{productDetails?.engraving_text.Text}</span>
                      </Text>
                      <Text as="p" size="textlg" className="text-[12px] tracking-[0.20px] text-slate-400">
                        Engraving Font Family: {productDetails?.engraving_text.fontFamily}
                      </Text>
                      <Text as="p" size="textlg" className="text-[12px] tracking-[0.20px] text-slate-400">
                        Engraving Price:<span className="!font-bold">{formatCurrency(engraving?.data?.engraving_price ?? 0)}</span>
                      </Text>
                    </>
                  )}
                  {(productDetails?.selectedYearValue || productDetails?.is_warranty) && (
                    <Text as="p" size="textlg" className="text-[12px] tracking-[0.20px] text-slate-400">
                      Warranty: {productDetails?.selectedYearValue?.year ?? productDetails?.warranty_year} Year (+
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
              {/* Editable options grouped above quantity (ref layout) */}
              {(canEditRingSize || canEditEngraving) && (
                <div className="mt-1 flex flex-col gap-1 border-t border-gray-100 pt-3">
                  {canEditRingSize && (
                    <EditRingSize
                      productDetails={productDetails}
                      onChange={(ringSizeId, ringSizeLabel) => handleUpdateRingSize(productDetails, ringSizeId, ringSizeLabel)}
                    />
                  )}
                  {canEditEngraving && (
                    <EditEngraving productDetails={productDetails} onSave={(engravingText) => handleUpdateEngraving(productDetails, engravingText)} />
                  )}
                </div>
              )}
              {/* Quantity kept last inside the cart product card */}
              {!diamondDetails && (
                <div className="flex items-center sm:text-[14px]">
                  Qty:
                  <div className="flex items-center gap-4 p-1 rounded-lg w-full justify-start">
                    <Button
                      size="small"
                      variant="text"
                      color="default"
                      onClick={() => {
                        setCount(count - 1);
                        handleCount({
                          sku_master_id: productDetails?.sku_master_id,
                          count: count - 1,
                          id: productDetails?.id,
                          ring_size_id: productDetails?.ringSizePricingDetails?.id ?? null,
                        });
                      }}
                      className="text-black text-2xl font-bold !px-2 !aspect-square"
                      disabled={count === 1}
                    >
                      <FaMinus className="h-4 w-4" />
                    </Button>
                    <span className="text-lg text-black">{count}</span>
                    <Button
                      size="small"
                      variant="text"
                      color="default"
                      onClick={() => {
                        setCount(count + 1);
                        handleCount({
                          sku_master_id: productDetails?.sku_master_id,
                          count: count + 1,
                          id: productDetails?.id,
                          ring_size_id: productDetails?.ringSizePricingDetails?.id ?? null,
                        });
                      }}
                      className="text-black text-2xl font-bold !px-2 !aspect-square"
                    >
                      <FaPlus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
            {diamondDetails && (
              <div className="flex flex-col gap-5 sm:gap-2">
                <div className="h-px bg-gray-200" />
                <div className="flex flex-col gap-1 items-start justify-center">
                  <div className="grid grid-cols-3 w-full">
                    <div className="col-span-2">
                      <ProductName productName={diamondDetails?.fullTitle} />
                    </div>
                    <p className="text-[20px] col-span-1 text-right !font-light !font-castoro tracking-[0.2px] !text-black lg:!text-[18px] md:!text-[16px] sm:!text-[14px]">
                      {formatCurrency(diamondDetails?.price)}
                    </p>
                  </div>

                  <div className="w-[30px] aspect-square">
                    <Image
                      src={master.find((item: any) => item?.name === diamondDetails?.shape_name && item?.parent_code == 'SHAPE')?.image?.[0]}
                      preview={false}
                      className="object-contain aspect-square"
                      fallback="/images/no_images.svg"
                      alt={diamondDetails?.shape_name}
                    />
                  </div>
                  <div>
                    <p className="text-[16px] tracking-[0.20px] text-slate-400 sm:!text-[12px]">Clarity: {diamondDetails?.clr}</p>
                    <p className="text-[16px] tracking-[0.20px] text-slate-400 sm:!text-[12px]">Color: {diamondDetails?.col}</p>
                    <p className="text-[16px] tracking-[0.20px] text-slate-400 sm:!text-[12px]">Shape: {diamondDetails?.shape_name}</p>
                    <p className="text-[16px] tracking-[0.20px] text-slate-400 sm:!text-[12px]">
                      {diamondDetails?.diamond_type == 2 ? 'Lab Grown Diamond' : 'Natural Diamond'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="!h-px sm:!h-[0.7px] w-full bg-primary" />
    </div>
  );
}
