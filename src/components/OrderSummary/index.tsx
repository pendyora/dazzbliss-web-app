import { useEffect, useMemo, useState } from 'react';

import { useAppSelector } from '@/store';
import { formatCurrency } from '@/utils/common';

import AffirmPromoMessage from '../AffirmPromoMessage';

interface summaryProps {
  cartProducts: any;
  promoCode?: string;
  showAffirm?: boolean;
}

const getItemCount = (item: any) => {
  const rawCount = item?.count ?? item?.quantity ?? item?.qty ?? 1;
  const parsedCount = Number(rawCount);
  return Number.isFinite(parsedCount) && parsedCount > 0 ? parsedCount : 1;
};

/** Order totals for the bag and checkout. Pricing rules are unchanged from the previous summary. */
export function useOrderTotals(cartProducts: any[], promoCode?: string) {
  const couponData = useAppSelector((state: any) => state.cart.couponData);
  const { appraisalData, engraving }: any = useAppSelector((state) => state?.master);

  return useMemo(() => {
    let overall = 0;
    let discounted = 0;
    let pieces = 0;
    let appraisal = 0;
    let warranty = 0;
    let engravingTotal = 0;
    let count = 0;
    const couponActive = Boolean(promoCode && promoCode == couponData?.coupon_code);

    (cartProducts ?? []).forEach((item: any) => {
      const apprisalPrice = item?.is_appraisal ? appraisalData?.price || 0 : 0;
      const warrantyPrice =
        item?.selectedYearValue !== undefined && item?.selectedYearValue?.price
          ? item?.selectedYearValue?.price
          : item?.warranty_amount
            ? item?.warranty_amount
            : 0;
      const ringPrice = item?.ringSizePricingDetails?.rate ?? 0;
      const couponItem = couponData?.items?.find((el: any) => el?.sku_details?.id === item?.sku_master_id);
      const diamondPrice = item?.diamondDetails ? Number(item?.diamondDetails?.price) || 0 : 0;
      const engravingPrice = item?.engravingText && item?.engravingText.Text != '' ? engraving?.data?.engraving_price || 0 : 0;
      const itemCount = getItemCount(item);

      const basePrice = couponActive
        ? couponItem?.sku_details?.discounted_price && couponItem?.sku_details?.discounted_price != 0
          ? couponItem?.sku_details?.discounted_price
          : couponItem?.sku_details?.selling_price
        : item?.jewelry_sku?.selling_price;
      const baseDiscounted = couponActive
        ? couponItem?.sku_details?.coupon_discounted_price
        : item?.jewelry_sku?.discounted_price && item?.jewelry_sku?.discounted_price != 0
          ? item?.jewelry_sku?.discounted_price
          : item?.jewelry_sku?.selling_price;
      const extras = ringPrice + apprisalPrice + warrantyPrice + engravingPrice;

      overall += (basePrice + extras) * itemCount + diamondPrice;
      discounted += (baseDiscounted + extras) * itemCount + diamondPrice;
      pieces += (basePrice + ringPrice) * itemCount + diamondPrice;
      appraisal += apprisalPrice * itemCount;
      warranty += warrantyPrice * itemCount;
      engravingTotal += engravingPrice * itemCount;
      count += itemCount;
    });

    const gst = Number(cartProducts?.[0]?.gst) || 0;
    const savings = Math.max(0, Math.ceil(overall) - Math.ceil(discounted));
    const tax = discounted * (gst / 100);
    return {
      count,
      pieces,
      appraisal,
      warranty,
      engraving: engravingTotal,
      savings,
      couponCode: couponActive ? couponData?.coupon_code : null,
      gst,
      tax,
      total: Math.ceil(discounted + tax),
    };
  }, [cartProducts, couponData, promoCode, appraisalData, engraving]);
}

/** Currency code shown beside totals; read on the client to match formatCurrency. */
export function useCurrencyCode() {
  const [code, setCode] = useState('USD');
  useEffect(() => {
    const stored = (localStorage.getItem('currency') || 'USD').trim();
    setCode(/^[A-Z]{3}$/.test(stored) ? stored : 'USD');
  }, []);
  return code;
}

export default function OrderSummary({ cartProducts, promoCode, showAffirm }: summaryProps) {
  const t = useOrderTotals(cartProducts, promoCode);
  const currency = useCurrencyCode();
  // Free Gift Above X Amount. Rendered as its own $0 row and deliberately kept out of
  // useOrderTotals, so it adds nothing to the subtotal, the discount total or the tax base.
  // Hidden once the shopper declines it: a refused gift is not written onto the order.
  const { unlocked: giftUnlocked, gift, declined: giftDeclined } = useAppSelector((state: any) => state.freeGift);
  const showGift = Boolean(giftUnlocked && gift && !giftDeclined);
  // Affirm quotes the amount the shopper actually pays — the same figure as "Total" below.
  const affirmPriceInCents = t.total * 100 || 0;

  const rows: [string, string, boolean?][] = [[`Pieces (${t.count})`, formatCurrency(Math.ceil(t.pieces))]];
  if (t.engraving > 0) {
    rows.push(['Engraving', formatCurrency(Math.ceil(t.engraving))]);
  }
  if (t.appraisal > 0) {
    rows.push(['Appraisal', formatCurrency(Math.ceil(t.appraisal))]);
  }
  if (t.warranty > 0) {
    rows.push(['Extended warranty', formatCurrency(Math.ceil(t.warranty))]);
  }
  if (t.savings > 0) {
    rows.push([t.couponCode ? `Promo · ${t.couponCode}` : 'Savings', `−${formatCurrency(t.savings)}`, true]);
  }
  // DAZZBLISS: shipping is not free. Show the real amount once the backend charges it (backend docs/DAZZBLISS_BEHAVIOUR_CHANGES.md #4).
  rows.push(['Shipping', 'Calculated at checkout']);
  if (t.gst > 0) {
    rows.push([`Tax (${t.gst}%)`, formatCurrency(Math.ceil(t.tax))]);
  }

  return (
    <div className="grid gap-[18px]">
      <dl className="m-0 grid gap-[9px] tabular-nums">
        {rows.map(([label, value, save]) => (
          <div key={label} className={`flex justify-between gap-4 text-[13px] ${save ? 'text-gilt' : ''}`}>
            <dt className={save ? '' : 'text-ink-soft'}>{label}</dt>
            <dd className="m-0 text-right">{value}</dd>
          </div>
        ))}
        {showGift && (
          <div className="flex justify-between gap-4 text-[13px]">
            <dt className="text-ink-soft">
              {gift?.title}
              {gift?.count > 1 ? ` × ${gift.count}` : ''}
              <span className="ml-2 align-middle text-[9.5px] uppercase tracking-[0.16em] text-gilt">Gift</span>
            </dt>
            <dd className="m-0 flex items-baseline gap-2 text-right">
              {/* Struck retail value, then Free — neither figure touches any total. */}
              {Number(gift?.retail_price) > 0 && (
                <span className="text-ink-soft line-through">{formatCurrency(Math.ceil(Number(gift.retail_price)))}</span>
              )}
              <span className="text-gilt">Free</span>
            </dd>
          </div>
        )}
      </dl>
      <div className="flex items-baseline justify-between gap-3 border-t border-line pt-4 tabular-nums">
        <span className="text-[12px] font-semibold uppercase tracking-[0.16em]">Total</span>
        <strong className="font-cormorant text-[34px] font-medium leading-none">
          <small className="mr-1.5 font-libre text-[11px] font-medium tracking-[0.12em] text-ink-soft">{currency}</small>
          {formatCurrency(t.total)}
        </strong>
      </div>
      {t.savings > 0 && <p className="m-0 -mt-2.5 text-right text-[12px] text-gilt">You save {formatCurrency(t.savings)}</p>}
      {showAffirm && (
        <AffirmPromoMessage amountInCents={affirmPriceInCents} className="!m-0 border-t border-line pt-3 text-center !text-[12px] !text-ink-soft" />
      )}
    </div>
  );
}
