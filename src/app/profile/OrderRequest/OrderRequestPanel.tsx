'use client';
import React from 'react';

import dayjs from 'dayjs';
import Link from 'next/link';
import { LuCircleX, LuRotateCcw } from 'react-icons/lu';

import { OPEN_REQUEST_STATUSES, ORDER_REQUEST_TYPE, SUPPORT } from './constants';
import RequestCard from './RequestCard';

interface OrderRequestPanelProps {
  orderNumber: string;
  eligibility: any;
  requests: any[];
  onChanged: () => void;
}

/**
 * Cancel / return entry point on the order detail page, followed by every request raised on the
 * order. Renders nothing for orders placed outside the website.
 */
const OrderRequestPanel: React.FC<OrderRequestPanelProps> = ({ orderNumber, eligibility, requests, onChanged }) => {
  if (!eligibility?.supported) {
    return null;
  }

  const hasOpenRequest = requests.some((r) => OPEN_REQUEST_STATUSES.includes(Number(r.status)));
  const status = Number(eligibility.order_status);
  const startLink = (type: number) =>
    `/profile/purchases/request?order=${orderNumber}&type=${type === ORDER_REQUEST_TYPE.CANCEL ? 'cancel' : 'return'}`;
  // Only worth explaining on orders a customer would expect to be able to change.
  const showHelp = !hasOpenRequest && !eligibility.can_cancel && !eligibility.can_return && [1, 2, 4].includes(status);

  return (
    <div className="mb-4 flex flex-col gap-4">
      {(eligibility.can_cancel || eligibility.can_return) && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[#e5e5e5] bg-white p-5 sm:p-4">
          <div className="min-w-[220px] flex-1">
            <p className="mb-1 text-[16px] font-semibold">{eligibility.can_cancel ? 'Need to change your order?' : 'Not quite right?'}</p>
            <p className="mb-0 text-[14px] text-[#666]">
              {eligibility.can_cancel
                ? 'You can ask to cancel the whole order or just some items before it ships.'
                : eligibility.return_deadline
                  ? `You can return items until ${dayjs(eligibility.return_deadline).format('MMMM D, YYYY')}.`
                  : `You can return items within ${eligibility.return_window_days} days of delivery.`}{' '}
              <Link href="/returns-shipping" className="text-primary underline">
                Returns policy
              </Link>
            </p>
          </div>
          <Link
            href={startLink(eligibility.can_cancel ? ORDER_REQUEST_TYPE.CANCEL : ORDER_REQUEST_TYPE.RETURN)}
            className="inline-flex h-[42px] items-center gap-2 bg-primary px-5 text-[13px] uppercase tracking-[1.5px] !text-text_w hover:opacity-90"
          >
            {eligibility.can_cancel ? <LuCircleX /> : <LuRotateCcw />}
            {eligibility.can_cancel ? 'Cancel Items' : 'Return Items'}
          </Link>
        </div>
      )}

      {showHelp && !eligibility.return_window_expired && eligibility.blocked_reason && (
        <p className="mb-0 text-[13px] text-[#777]">
          {eligibility.blocked_reason} Call {SUPPORT.phone} or email{' '}
          <a href={`mailto:${SUPPORT.email}`} className="underline">
            {SUPPORT.email}
          </a>
          .
        </p>
      )}

      {requests.map((request) => (
        <RequestCard key={request.id} request={request} onChanged={onChanged} />
      ))}
    </div>
  );
};

export default OrderRequestPanel;

/**
 * Short per-item status for the order's item cards, e.g. "Return in progress" or "1 returned".
 * Built from the line counters plus any open request that includes the line.
 */
export const itemRequestLabels = (item: any, requests: any[]) => {
  const labels: string[] = [];
  const open = requests.find(
    (r) => OPEN_REQUEST_STATUSES.includes(Number(r.status)) && r.requestItems?.some((i: any) => i.order_item_id === item?.id),
  );
  if (open) {
    labels.push(Number(open.request_type) === ORDER_REQUEST_TYPE.CANCEL ? 'Cancellation requested' : 'Return in progress');
  }
  if (Number(item?.cancelled_qty) > 0) {
    labels.push(Number(item.cancelled_qty) >= Number(item.count) ? 'Cancelled' : `${item.cancelled_qty} cancelled`);
  }
  if (Number(item?.returned_qty) > 0) {
    labels.push(Number(item.returned_qty) >= Number(item.count) ? 'Returned' : `${item.returned_qty} returned`);
  }
  return labels;
};
