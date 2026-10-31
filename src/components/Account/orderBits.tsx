import React from 'react';

import dayjs from 'dayjs';

import { formatCurrency } from '@/utils/common';

// Order status codes from the API: 0 processing, 1 confirmed, 2 manufacturing, 3 out for delivery, 4 delivered, 5 cancelled.
// 6 = Rejected and 7 = Payment Cancelled internally; the customer only ever sees "Cancelled".
export const STATUS_LABEL = ['Processing', 'Confirmed', 'Being made', 'Out for delivery', 'Delivered', 'Cancelled'];
export const isCancelledStatus = (status: number) => Number(status) >= 5;
export const statusLabel = (status: number) => (isCancelledStatus(status) ? 'Cancelled' : (STATUS_LABEL[status] ?? 'Processing'));
const STEPS = ['Confirmed', 'Manufacturing', 'Out for delivery', 'Delivered'];

export const orderDate = (o: any, fmt = 'D MMM YYYY') => (o?.created_at ? dayjs(o.created_at).format(fmt) : '');

export function StatusPill({ status }: { status: number }) {
  const done = status === 4;
  const cancelled = isCancelledStatus(status);
  return (
    <span className="inline-flex items-center gap-2 text-[13px] font-medium text-ink">
      <i className={`h-2 w-2 rounded-full ${cancelled ? 'bg-danger' : done ? 'bg-ok' : 'bg-teal'}`} />
      {statusLabel(status)}
    </span>
  );
}

/**
 * Four-step tracker; a step is done once the order status has reached it. Status 1 sits ON "Confirmed",
 * status 0 (payment pending) highlights nothing, a delivered order (4) is finished rather than "now".
 * Hidden for cancelled / rejected orders (5+).
 */
export function OrderTracker({ status, placedAt }: { status: number; placedAt?: string }) {
  if (isCancelledStatus(status)) {
    return null;
  }
  return (
    <ol className="m-0 grid list-none grid-cols-4 p-0 md:grid-cols-1 md:gap-3">
      {STEPS.map((label, i) => {
        const reached = status >= i + 1;
        const now = status === i + 1 && status !== 4;
        return (
          <li
            key={label}
            className={`relative pt-[22px] text-[13px] md:pl-6 md:pt-0 ${reached ? 'text-ink' : 'text-ink-faint'} before:absolute before:inset-x-0 before:top-[7px] before:h-0.5 before:content-[''] md:before:bottom-[-14px] md:before:left-[5px] md:before:right-auto md:before:top-3.5 md:before:h-auto md:before:w-0.5 md:last:before:hidden ${
              reached ? 'before:bg-teal' : 'before:bg-line'
            } after:absolute after:left-0 after:top-0.5 after:h-3 after:w-3 after:rounded-full after:border-2 after:content-[''] ${
              reached ? 'after:border-teal after:bg-teal' : 'after:border-line-strong after:bg-paper'
            } ${now ? 'after:shadow-[0_0_0_5px] after:shadow-teal/20' : ''}`}
          >
            <b className="block font-medium">{label}</b>
            <small className="text-[12px] text-ink-faint">
              {i === 0 && placedAt ? dayjs(placedAt).format('D MMM') : now ? 'Now' : reached ? 'Done' : ''}
            </small>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Price of one order line. Only a product-level flat/percentage discount strikes the line price;
 * coupon savings are reflected in the paid amount (and the "Discount applied" row), not on the item.
 */
export function linePrice(item: any) {
  const appraisal = item?.appraisal_amount ?? 0;
  const base = (item?.jewelry_price ?? 0) + appraisal;
  const final = item?.jewelry_discount_price ? item.jewelry_discount_price + appraisal : base;
  return { base, final, reduced: final !== base };
}

export function Money({ item }: { item: any }) {
  if (item?.is_free_gift) {
    const was = Math.ceil(Number(item?.skuOrderItems?.selling_price ?? 0));
    return (
      <span className="whitespace-nowrap tabular-nums">
        {was > 0 && <s className="mr-2 text-[12.5px] text-ink-faint">{formatCurrency(was)}</s>}
        <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-teal">Free</span>
      </span>
    );
  }
  const { base, final, reduced } = linePrice(item);
  return (
    <span className="whitespace-nowrap tabular-nums">
      {reduced && <s className="mr-2 text-[12.5px] text-ink-faint">{formatCurrency(base)}</s>}
      {formatCurrency(final)}
    </span>
  );
}
