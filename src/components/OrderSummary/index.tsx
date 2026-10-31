import { useMemo } from 'react';

import { Text } from '@/components';
import { useAppSelector } from '@/store';
import { formatCurrency } from '@/utils/common';

import AffirmPromoMessage from '../AffirmPromoMessage';
import ProductName from '../CartProductDetails/ProductName';

interface summaryProps {
  cartProducts: any;
  promoCode?: string;
  showAffirm?: boolean;
}

export default function OrderSummary({ cartProducts, promoCode, showAffirm }: summaryProps) {
  const couponData = useAppSelector((state: any) => state.cart.couponData);
  // Free Gift Above X Amount. Rendered as its own $0 row rather than being pushed into
  // `cartProducts`, so it cannot touch any of the totals computed below.
  const { unlocked: giftUnlocked, gift, declined: giftDeclined } = useAppSelector((state: any) => state.freeGift);
  const { appraisalData, engraving }: any = useAppSelector((state) => state?.master);
  const getItemCount = (item: any) => {
    const rawCount = item?.count ?? item?.quantity ?? item?.qty ?? 1;
    const parsedCount = Number(rawCount);
    return Number.isFinite(parsedCount) && parsedCount > 0 ? parsedCount : 1;
  };
  const appraisalCount = cartProducts?.filter((item: any) => item?.is_appraisal)?.length || 0;
  const appraisalTotal = (appraisalData?.price || 0) * appraisalCount;
  const { pricesByCategories, discountedTotalPrice, groupPriceNew, overallCategoriesPrice } = useMemo(() => {
    let overallCategoriesPrice = 0;
    let discountedTotalPrice = 0;

    // Group and calculate total prices by categories considering the quantity
    const groupedPrices = cartProducts?.reduce((acc: any, item: any) => {
      const apprisalPrice = item?.is_appraisal ? appraisalData?.price || 0 : 0;
      const warrantyPrice =
        item?.selectedYearValue !== undefined && item?.selectedYearValue?.price
          ? item?.selectedYearValue?.price
          : item?.warranty_amount
            ? item?.warranty_amount
            : 0;

      const ringPrice = item?.ringSizePricingDetails?.rate ?? null;
      const couponItem = couponData?.items?.find((el: any) => el?.sku_details?.id === item?.sku_master_id);
      const diamondData = item?.diamondDetails
        ? {
            name: item?.diamondDetails?.fullTitle,
            price: item?.diamondDetails?.price,
          }
        : null;
      const type = item?.cartJewelryDetails?.jewelrySubType?.group;
      const engraving_price = item?.engravingText && item?.engravingText.Text != '' ? engraving?.data?.engraving_price : 0;

      // const price = item?.jewelry_sku?.selling_price;
      const temp_price =
        promoCode && promoCode == couponData?.coupon_code
          ? couponItem?.sku_details?.discounted_price && couponItem?.sku_details?.discounted_price != 0
            ? couponItem?.sku_details?.discounted_price
            : couponItem?.sku_details?.selling_price
          : item?.jewelry_sku?.selling_price;
      const price = ringPrice
        ? temp_price + ringPrice + apprisalPrice + warrantyPrice + engraving_price
        : temp_price + apprisalPrice + warrantyPrice + engraving_price;
      const temp_discounted_price =
        promoCode && promoCode == couponData?.coupon_code
          ? couponItem?.sku_details?.coupon_discounted_price
          : item?.jewelry_sku?.discounted_price && item?.jewelry_sku?.discounted_price != 0
            ? item?.jewelry_sku?.discounted_price
            : item?.jewelry_sku?.selling_price;
      const discounted_price = ringPrice
        ? temp_discounted_price + ringPrice + apprisalPrice + warrantyPrice + engraving_price
        : temp_discounted_price + apprisalPrice + warrantyPrice + engraving_price;
      const count = getItemCount(item);

      if (!acc[type]) {
        acc[type] = 0;
      }

      // Multiply price by the count of the item
      const totalItemPrice = diamondData ? price * count + diamondData?.price : price * count;
      const totalItemDiscountedPrice = diamondData ? discounted_price * count + diamondData?.price : discounted_price * count;
      acc[type] += totalItemPrice;
      overallCategoriesPrice += totalItemPrice;
      discountedTotalPrice += totalItemDiscountedPrice;

      return acc;
    }, {});
    const groupPriceNew = cartProducts.map((item: any) => {
      const ringPrice = item?.ringSizePricingDetails?.rate ?? null;
      const couponItem = couponData?.items?.find((el: any) => el?.sku_details?.id === item?.sku_master_id);

      const diamondData = item?.diamondDetails
        ? {
            name: item?.diamondDetails?.fullTitle,
            price: item?.diamondDetails?.price,
          }
        : null;

      // For the per-line display, always show the original selling price. When a coupon is
      // applied, the coupon savings are surfaced separately in the "Applied Promocode" and
      // "Total Price" rows, so we deliberately do NOT strike the product price with the
      // coupon-discounted amount here (it was confusing to shoppers).
      const new_price = promoCode && promoCode == couponData?.coupon_code ? couponItem?.sku_details?.selling_price : item?.jewelry_sku?.selling_price;
      // Only surface a product-level flat/percentage discount (jewelry_sku.discounted_price)
      // in the strikethrough style — never the coupon discount.
      const new_discounted_price =
        promoCode && promoCode == couponData?.coupon_code
          ? couponItem?.sku_details?.discounted_price && couponItem?.sku_details?.discounted_price != 0
            ? couponItem?.sku_details?.discounted_price
            : null
          : item?.jewelry_sku?.discounted_price;
      // const discountedPrice = item?.jewelry_sku?.discounted_price - couponDiscount;

      return {
        // name: item?.cartJewelryDetails?.jewelrySubType?.group,
        name: item?.cartJewelryDetails?.title,
        price: ringPrice ? new_price + ringPrice : new_price,
        discounted_price: new_discounted_price ? (ringPrice ? new_discounted_price + ringPrice : new_discounted_price) : null,
        count: getItemCount(item),
        diamondData: diamondData,
        is_appraisal: item?.is_appraisal,
        engraving_price: item?.engravingText && item?.engravingText.Text != '' ? engraving?.data?.engraving_price : 0,
        selectedYearValue: item?.warranty_amount ? item?.warranty_amount : 0,
      };
    });

    // Convert the object to an array format directly within the memoized calculation
    const pricesByCategories = Object.entries(groupedPrices).map(([name, price]) => ({ name, price }));

    // const pricesByCategories = groupedPrices

    return {
      pricesByCategories,
      overallCategoriesPrice,
      groupPriceNew,
      discountedTotalPrice,
    };
  }, [cartProducts, couponData, promoCode]);
  // Affirm quotes the amount the shopper actually pays — the same figure as "Total Price" below.
  const payableTotal = discountedTotalPrice && overallCategoriesPrice !== discountedTotalPrice ? discountedTotalPrice : overallCategoriesPrice;
  const affirmPriceInCents = Math.ceil(payableTotal + payableTotal * ((cartProducts?.[0]?.gst || 0) / 100)) * 100 || 0;

  return (
    <div className="flex flex-col gap-[18px] md:gap-[10px] bg-gray-50 px-[30px] py-[20px] sm:gap-4 sm:p-4 sm:px-3 sm:mt-5 [container-type:inline-size]">
      <div className="flex flex-col items-center gap-[22px] md:gap-[12px]">
        <Text as="p" size="textxl" className="text-[24px] font-normal uppercase tracking-[0.44px] text-black-900 lg:text-[18px] md:text-[16px]">
          order summary
        </Text>
        <div className="flex flex-col self-stretch">
          <div className="flex flex-col gap-3 sm:gap-3">
            {/* <div className="h-px bg-gray-400" /> */}
            {groupPriceNew?.map((category: any, index: number) => {
              return (
                <div
                  key={`price_${index}`}
                  className={`flex flex-col gap-3 border-b border-gray-400 last:border-0 pb-3 sm:pb-3 ${category?.diamondData ? '' : ''}`}
                >
                  <div className="grid grid-cols-3 gap-5">
                    <div className="col-span-2 flex items-center">
                      {/* <Text
                      as="p"
                      size="textlg"
                      className="text-[18px] col-span-2 font-normal tracking-[0.20px] text-gray-800 lg:text-[17px] md:text-[16px] sm:text-[14px]"
                    >
                      {category?.name} {`(x${category?.count})`}
                    </Text> */}
                      <ProductName productName={category?.name} count={category?.count} />
                    </div>
                    <div className="flex flex-row col-span-1 flex-wrap justify-end items-center gap-0">
                      <Text
                        as="p"
                        size="textlg"
                        className={`!font-castoro text-[18px] text-right font-normal tracking-[0.20px] text-gray-800 lg:text-[17px] md:text-[16px] ${
                          category?.discounted_price && category?.discounted_price != 0
                            ? 'line-through !text-gray-400 !text-[14px] sm:!text-[12px]'
                            : 'sm:!text-[14px]'
                        }`}
                      >
                        {formatCurrency(Math.ceil((category?.price ?? 0) * (category?.count ?? 1)))}
                      </Text>
                      {category?.discounted_price && (
                        <Text
                          as="p"
                          size="textlg"
                          className="!font-castoro text-[18px] pl-2 text-right font-normal tracking-[0.20px] text-gray-800 lg:text-[17px] sm:text-[14px]"
                        >
                          {formatCurrency(Math.ceil((category?.discounted_price ?? 0) * (category?.count ?? 1)))}
                        </Text>
                      )}
                    </div>
                  </div>

                  {category?.is_appraisal && (
                    <div className="grid grid-cols-3 gap-5">
                      <div className="col-span-2 flex items-center">
                        {/* <Text
                          as="p"
                          size="textlg"
                          className="text-[14px] col-span-2 font-normal tracking-[0.20px] text-gray-800 lg:text-[17px] md:text-[16px] sm:text-[14px]"
                        >
                          Appraisal
                        </Text> */}
                        <ProductName productName={'Appraisal'} count={category?.count} />
                      </div>
                      <div className="flex flex-row col-span-1 flex-wrap justify-end items-center gap-0">
                        <Text
                          as="p"
                          size="textlg"
                          className={`!font-castoro text-[18px] text-right font-normal tracking-[0.20px] text-gray-800 lg:text-[17px] md:text-[16px]  'sm:!text-[14px]'
                            }`}
                        >
                          {formatCurrency(Math.ceil(appraisalData?.price * (category?.count ?? 1)))}
                        </Text>
                      </div>
                    </div>
                  )}
                  {category?.selectedYearValue > 0 && (
                    <div className="grid grid-cols-3 gap-5">
                      <div className="col-span-2 flex items-center">
                        {/* <Text
                          as="p"
                          size="textlg"
                          className="text-[14px] col-span-2 font-normal tracking-[0.20px] text-gray-800 lg:text-[17px] md:text-[16px] sm:text-[14px]"
                        >
                          Warranty
                        </Text> */}
                        <ProductName productName={'Warranty'} count={category?.count} />
                      </div>
                      <div className="flex flex-row col-span-1 flex-wrap justify-end items-center gap-0">
                        <Text
                          as="p"
                          size="textlg"
                          className={`!font-castoro text-[18px] text-right font-normal tracking-[0.20px] text-gray-800 lg:text-[17px] md:text-[16px]  'sm:!text-[14px]'
                            }`}
                        >
                          {formatCurrency(Math.ceil((category?.selectedYearValue ?? 0) * (category?.count ?? 1)))}
                        </Text>
                      </div>
                    </div>
                  )}
                  {category?.engraving_price > 0 && (
                    <div className="grid grid-cols-3 gap-5">
                      <div className="col-span-2 flex items-center">
                        {/* <Text
                          as="p"
                          size="textlg"
                          className="text-[14px] col-span-2 font-normal tracking-[0.20px] text-gray-800 lg:text-[17px] md:text-[16px] sm:text-[14px]"
                        >
                          Engraving
                        </Text> */}
                        <ProductName productName={'Engraving'} count={category?.count} />
                      </div>
                      <div className="flex flex-row col-span-1 flex-wrap justify-end items-center gap-0">
                        <Text
                          as="p"
                          size="textlg"
                          className={`!font-castoro text-[18px] text-right font-normal tracking-[0.20px] text-gray-800 lg:text-[17px] md:text-[16px]  'sm:!text-[14px]'
                            }`}
                        >
                          {formatCurrency(Math.ceil((category?.engraving_price ?? 0) * (category?.count ?? 1)))}
                        </Text>
                      </div>
                    </div>
                  )}
                  {category?.diamondData && (
                    <div className="grid grid-cols-3 gap-5">
                      <div className="col-span-2 flex items-center">
                        {/* <Text
                        as="p"
                        size="textlg"
                        className="text-[18px] col-span-2 font-normal tracking-[0.20px] text-gray-800 lg:text-[17px] md:text-[16px]"
                      >
                        {category?.diamondData?.name}{' '}
                      </Text> */}
                        <ProductName productName={category?.diamondData?.name} />
                      </div>
                      <div className="flex flex-row col-span-1 justify-end items-center gap-2">
                        {/* <Text
                        as="p"
                        size="textlg"
                        className={`text-[18px] text-right font-normal tracking-[0.20px] text-gray-800 lg:text-[17px] md:text-[16px] ${
                          category?.discounted_price &&
                          category?.discounted_price != 0
                            ? "line-through !text-gray-400 !text-[14px] "
                            : ""
                        }`}
                      >
                        ${Math.round(category?.price * category?.count)}
                      </Text> */}
                        {category?.diamondData?.price && (
                          <Text
                            as="p"
                            size="textlg"
                            className="!font-castoro text-[18px] text-right font-normal tracking-[0.20px] text-gray-800 lg:text-[17px] sm:text-[14px]"
                          >
                            {formatCurrency(category?.diamondData?.price)}
                          </Text>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Free gift — always $0, and deliberately outside the reduce above so it adds
                nothing to the subtotal, the discount total or the tax base.

                Hidden once the shopper declines it: this summary is a statement of what the
                order contains, and a refused gift is not written onto the order. */}
            {giftUnlocked && gift && !giftDeclined && (
              <div className="flex flex-col gap-3 border-b border-gray-400 last:border-0 pb-3 sm:pb-3">
                <div className="grid grid-cols-3 gap-5 sm:gap-3">
                  <div className="col-span-2 flex min-w-0 flex-wrap items-start gap-x-2 gap-y-1">
                    <ProductName productName={gift?.title} count={gift?.count} />
                    <span className="mt-[2px] shrink-0 bg-secondary px-1.5 py-[1px] font-sans text-[9px] uppercase leading-[14px] tracking-[1px] text-text_w">
                      Free
                    </span>
                  </div>
                  <div className="flex flex-row col-span-1 flex-wrap justify-end items-start gap-x-2 gap-y-0.5">
                    {/* Struck retail value, then FREE — same treatment as the cart card, so
                        the shopper sees the reward's worth rather than a bare $0. Neither
                        figure touches any total. */}
                    {Number(gift?.retail_price) > 0 && (
                      <Text
                        as="p"
                        size="textlg"
                        className="!font-castoro text-[14px] text-right font-normal tracking-[0.20px] !text-gray-400 line-through sm:!text-[12px]"
                      >
                        {formatCurrency(Math.ceil(Number(gift.retail_price)))}
                      </Text>
                    )}
                    <Text
                      as="p"
                      size="textlg"
                      className="!font-sans text-[13px] text-right font-semibold uppercase tracking-[1px] !text-secondary sm:!text-[12px]"
                    >
                      Free
                    </Text>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-5">
            {/* <div className="h-px bg-gray-400" /> */}
            {cartProducts?.[0]?.gst > 0 ? (
              <div className="flex flex-wrap border-t border-gray-400  pt-5 justify-between gap-5">
                <Text
                  as="p"
                  size="textlg"
                  className="text-[18px] font-normal tracking-[0.20px] text-gray-800 lg:text-[17px] md:text-[16px] sm:!text-[13px]"
                >
                  Tax
                </Text>
                <Text
                  as="p"
                  size="textlg"
                  className="text-[18px] font-normal tracking-[0.20px] text-gray-800 lg:text-[17px] md:text-[16px] sm:!text-[14px]"
                >
                  {`${cartProducts?.[0]?.gst}%`}
                </Text>
              </div>
            ) : (
              <div className="h-px bg-gray-400" />
            )}
            <div className="flex flex-wrap border-gray-400  justify-between gap-5">
              <Text
                as="p"
                size="textlg"
                className="text-[18px] font-normal tracking-[0.20px] text-gray-800 lg:text-[17px] md:text-[16px] sm:!text-[13px]"
              >
                Shipping Charge
              </Text>
              <Text
                as="p"
                size="textlg"
                className="text-[18px] font-normal tracking-[0.20px] text-gray-800 lg:text-[17px] md:text-[16px] sm:!text-[14px]"
              >
                Free
              </Text>
            </div>
            {couponData && (
              <div className="flex flex-wrap border-t border-gray-400  pt-5 justify-between gap-5">
                <Text as="p" size="textlg" className="text-[18px] font-normal tracking-[0.20px] text-gray-800 lg:text-[17px] sm:!text-[14px]">
                  Applied Promocode
                </Text>
                <Text as="p" size="textlg" className="text-[18px] font-normal tracking-[0.20px] text-gray-800 lg:text-[17px] sm:!text-[14px]">
                  - ${Math.ceil(overallCategoriesPrice) - Math.ceil(discountedTotalPrice)}
                </Text>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-[30px] sm:gap-[30px]">
        <div className="flex flex-wrap justify-between gap-5">
          <Text as="p" size="textlg" className="text-[20px] !font-medium tracking-[0.20px] text-gray-800 lg:text-[17px] md:text-[16px]">
            Total Price
          </Text>
          <div className="flex h-fit justify-end items-center gap-2">
            <Text
              as="p"
              size="textlg"
              className={`!font-castoro text-[20px] !font-bold tracking-[0.20px] text-gray-800 lg:text-[17px] md:text-[16px] ${
                discountedTotalPrice && overallCategoriesPrice !== discountedTotalPrice
                  ? 'line-through !text-gray-400 !text-[16px] md:!text-[14px] lg:!text-[16px]'
                  : ''
              }`}
            >
              {formatCurrency(Math.ceil(overallCategoriesPrice + overallCategoriesPrice * (cartProducts?.[0]?.gst / 100)))}
            </Text>
            {discountedTotalPrice && overallCategoriesPrice !== discountedTotalPrice && (
              <Text
                as="p"
                size="textlg"
                className="!font-castoro text-[20px] !font-bold tracking-[0.20px] text-gray-800 lg:text-[17px] md:text-[16px]"
              >
                {formatCurrency(Math.ceil(discountedTotalPrice + discountedTotalPrice * (cartProducts?.[0]?.gst / 100)))}
              </Text>
            )}
          </div>
        </div>
        {showAffirm && (
          <AffirmPromoMessage
            amountInCents={affirmPriceInCents}
            className="!m-0 border-t border-gray-400 pt-3 text-center whitespace-nowrap !text-[clamp(10px,3.3cqw,16px)] !text-gray-800"
          />
        )}
      </div>
    </div>
  );
}
