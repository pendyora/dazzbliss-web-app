'use client';
import React from 'react';

import Link from 'next/link';

import FreeGiftItem from '@/components/FreeGiftItem';
import OrderSummary, { useOrderTotals } from '@/components/OrderSummary';
import { useAppSelector } from '@/store';
import { formatCurrency } from '@/utils/common';

interface Props {
  products: any[];
  promoCode?: string;
}

function SummaryBody({ products, promoCode }: Props) {
  const master = useAppSelector((state) => state.master.data);
  const name = (id?: string) => (id ? master?.find((m: any) => m.id === id)?.name : undefined);
  return (
    <div className="grid gap-[18px]">
      <ul className="m-0 grid list-none gap-3.5 p-0">
        {products?.map((p: any, i: number) => {
          const sku = p?.jewelry_sku;
          const unit = (sku?.discounted_price || sku?.selling_price || 0) + (p?.ringSizePricingDetails?.rate ?? 0);
          const line = unit * (Number(p?.count) || 1) + (Number(p?.diamondDetails?.price) || 0);
          const ring = p?.ringSizePricingDetails ? `Size ${name(p?.ringSizePricingDetails?.ring_size_id) ?? ''}` : null;
          return (
            <li key={`${p?.id ?? p?.sku_master_id}-${i}`} className="grid grid-cols-[60px_minmax(0,1fr)_auto] items-center gap-3.5 text-[12.5px]">
              <span className="relative block aspect-[4/5] bg-stone">
                <img src={sku?.carat_images?.[0] || '/images/no_images.svg'} alt="" className="h-full w-full object-contain mix-blend-multiply" />
                <b className="absolute -right-[7px] -top-[7px] grid h-5 w-5 place-items-center rounded-full bg-ink text-[10.5px] font-medium tabular-nums text-paper">
                  {p?.count ?? 1}
                </b>
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-ink">{p?.fullTitle}</span>
                <small className="text-[12px] text-ink-soft">
                  {[name(sku?.metal_type_id), name(sku?.metal_color_id), ring].filter(Boolean).join(' · ')}
                </small>
              </span>
              <span className="tabular-nums">{formatCurrency(Math.ceil(line))}</span>
            </li>
          );
        })}
      </ul>
      {/* The free gift is read-only here — colour and ring size are settled in the bag,
          so checkout only confirms what is being shipped. Renders nothing when no gift is unlocked. */}
      <FreeGiftItem readOnly />
      <Link
        href="/cart"
        className="justify-self-start text-[11px] uppercase tracking-[0.12em] text-ink-soft underline underline-offset-4 hover:text-ink"
      >
        Edit bag
      </Link>
      <OrderSummary cartProducts={products} promoCode={promoCode} />
    </div>
  );
}

/** Right-hand order summary on checkout. On phones it collapses into a tap-to-open bar above the form. */
export default function CheckoutSummary(props: Props) {
  const t = useOrderTotals(props.products, props.promoCode);
  return (
    <>
      <aside aria-label="Order summary" className="sticky top-6 border border-line px-[26px] pb-6 pt-[22px] md:hidden">
        <h2 className="m-0 mb-[18px] font-cormorant text-[28px] font-normal leading-none">Order summary</h2>
        <SummaryBody {...props} />
      </aside>
      <details className="group hidden border border-line md:block">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-3 font-cormorant text-[22px]">
            Order summary
            <i
              aria-hidden
              className="h-[7px] w-[7px] -translate-y-0.5 rotate-45 border-b border-r border-ink transition-transform group-open:translate-y-0.5 group-open:-rotate-[135deg]"
            />
          </span>
          <span className="font-cormorant text-[24px] tabular-nums">{formatCurrency(t.total)}</span>
        </summary>
        <div className="px-5 pb-5">
          <SummaryBody {...props} />
        </div>
      </details>
    </>
  );
}
