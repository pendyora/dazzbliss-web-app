'use client';
import React, { useState } from 'react';

import { Button, Image, Popconfirm, Steps, notification } from 'antd';
import dayjs from 'dayjs';
import { LuCopy, LuPackage, LuRotateCcw, LuCircleX } from 'react-icons/lu';

import { apiWithdrawOrderRequest } from '@/services/orderService';

import {
  ORDER_REQUEST_STATUS,
  ORDER_REQUEST_TYPE,
  REQUEST_STATUS_META,
  REQUEST_TYPE_LABEL,
  RETURN_ADDRESS,
  SUPPORT,
  formatUsd,
  timelineIndex,
  timelineSteps,
} from './constants';

interface RequestCardProps {
  request: any;
  onChanged: () => void;
}

const formatDate = (value: any) => (value ? dayjs(value).format('MMM D, YYYY') : '');

// Status dot colour, in the account pages' StatusPill style (the label still comes from REQUEST_STATUS_META).
const STATUS_DOT: Record<number, string> = {
  [ORDER_REQUEST_STATUS.PENDING]: 'bg-gilt',
  [ORDER_REQUEST_STATUS.APPROVED]: 'bg-navy',
  [ORDER_REQUEST_STATUS.RECEIVED]: 'bg-teal',
  [ORDER_REQUEST_STATUS.COMPLETED]: 'bg-ok',
  [ORDER_REQUEST_STATUS.REJECTED]: 'bg-danger',
  [ORDER_REQUEST_STATUS.WITHDRAWN]: 'bg-ink-faint',
};

/** One cancel / return request: where it is, what happens next, and what the customer can do. */
const RequestCard: React.FC<RequestCardProps> = ({ request, onChanged }) => {
  const [busy, setBusy] = useState<'withdraw' | null>(null);

  const type = Number(request.request_type);
  const status = Number(request.status);
  const isReturn = type === ORDER_REQUEST_TYPE.RETURN;
  // An unsettled card charge is voided rather than refunded: the pending amount is released.
  const isVoid = request.refund_operation === 'VOID';
  const hasGift = (request.requestItems ?? []).some((item: any) => item.is_free_gift && Number(item.approved_quantity ?? item.quantity) > 0);
  // Tracking is extra information on an approved return, not a separate step.
  const awaitingReturn = isReturn && status === ORDER_REQUEST_STATUS.APPROVED;
  const hasTracking = !!request.return_tracking_number;
  const canWithdraw = status === ORDER_REQUEST_STATUS.PENDING || (awaitingReturn && !hasTracking);
  const meta =
    awaitingReturn && hasTracking
      ? { ...REQUEST_STATUS_META[ORDER_REQUEST_STATUS.APPROVED], label: 'Return On Its Way' }
      : status === ORDER_REQUEST_STATUS.COMPLETED && !isReturn && (isVoid || !(Number(request.refunded_amount) > 0))
        ? { ...REQUEST_STATUS_META[status], label: 'Cancelled' }
        : REQUEST_STATUS_META[status];
  const stepDate = (field: string) => formatDate(request[field]);
  const isClosedEarly = status === ORDER_REQUEST_STATUS.REJECTED || status === ORDER_REQUEST_STATUS.WITHDRAWN;

  const withdraw = async () => {
    setBusy('withdraw');
    try {
      await apiWithdrawOrderRequest(request.id);
      notification.success({ message: 'Your request has been withdrawn.', placement: 'top' });
      onChanged();
    } catch (error: any) {
      notification.error({ message: error?.response?.data?.message ?? 'Something went wrong. Please try again.', placement: 'top' });
    } finally {
      setBusy(null);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text);
    notification.success({ message: 'Copied', placement: 'top', duration: 1.5 });
  };

  // The one line that tells the customer where things stand and what, if anything, they need to do.
  const statusMessage = (() => {
    switch (status) {
      case ORDER_REQUEST_STATUS.PENDING:
        return 'We’re reviewing your request and will get back to you within 1–2 business days.';
      case ORDER_REQUEST_STATUS.APPROVED:
        return hasTracking
          ? 'Thanks for sending your return. We’ll email you as soon as it arrives.'
          : 'Your return is approved. Please ship the item back within 14 days.';
      case ORDER_REQUEST_STATUS.RECEIVED:
        return 'We’ve received your return. Our jeweler is inspecting it, and your refund follows within 1–3 business days.';
      case ORDER_REQUEST_STATUS.COMPLETED:
        if (isVoid) {
          return `The pending ${formatUsd(request.refunded_amount)} on your card has been released and will drop off within a few business days.`;
        }
        return Number(request.refunded_amount) > 0
          ? `${formatUsd(request.refunded_amount)} has been refunded to your original payment method. It can take 5–10 business days to appear on your statement.`
          : isReturn
            ? 'Your return is complete.'
            : 'Your cancellation is complete.';
      case ORDER_REQUEST_STATUS.REJECTED:
        return 'We weren’t able to accept this request.';
      case ORDER_REQUEST_STATUS.WITHDRAWN:
        return 'You withdrew this request.';
      default:
        return '';
    }
  })();

  const refundLabel =
    status === ORDER_REQUEST_STATUS.COMPLETED
      ? isVoid
        ? 'Charge released'
        : 'Refunded'
      : [ORDER_REQUEST_STATUS.APPROVED, ORDER_REQUEST_STATUS.RECEIVED].includes(status as any)
        ? 'Refund after inspection'
        : 'Estimated refund';
  const refundValue = status === ORDER_REQUEST_STATUS.COMPLETED ? request.refunded_amount : (request.approved_amount ?? request.estimated_amount);

  return (
    <article className="border border-line bg-paper">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-haze px-5 py-3.5 sm:px-4">
        <div className="flex items-center gap-2.5">
          {isReturn ? (
            <LuRotateCcw className="h-4 w-4 text-ink-soft" strokeWidth={1.4} />
          ) : (
            <LuCircleX className="h-4 w-4 text-ink-soft" strokeWidth={1.4} />
          )}
          <p className="m-0 text-[14px] font-medium text-ink">{REQUEST_TYPE_LABEL[type]} request</p>
          <span className="text-[12.5px] text-ink-faint">#{request.request_number}</span>
        </div>
        {meta && (
          <span className="inline-flex items-center gap-2 text-[13px] font-medium text-ink">
            <i className={`h-2 w-2 rounded-full ${STATUS_DOT[status] ?? 'bg-ink-faint'}`} />
            {meta.label}
          </span>
        )}
      </div>

      <div className="grid gap-4 p-5 sm:p-4">
        {/* Progress */}
        {!isClosedEarly && (
          <Steps
            size="small"
            responsive
            current={timelineIndex(type, status)}
            status={status === ORDER_REQUEST_STATUS.COMPLETED ? 'finish' : 'process'}
            items={timelineSteps(type).map((step) => ({ title: step.title, description: stepDate(step.field) }))}
            className="order-request-steps"
          />
        )}

        <div
          className={`border-l-2 bg-haze px-4 py-3 text-[13.5px] leading-[1.6] text-ink ${
            status === ORDER_REQUEST_STATUS.REJECTED ? 'border-danger' : status === ORDER_REQUEST_STATUS.COMPLETED ? 'border-ok' : 'border-gilt'
          }`}
        >
          <p className="m-0">{statusMessage}</p>
          {request.admin_note && <p className="m-0 mt-1 text-ink-soft">Note from our team: {request.admin_note}</p>}
          {status === ORDER_REQUEST_STATUS.REJECTED && (
            <p className="m-0 mt-1 text-[13px] text-ink-soft">
              Questions? Call {SUPPORT.phone} or email{' '}
              <a href={`mailto:${SUPPORT.email}`} className="text-ink underline underline-offset-[3px] hover:text-ink">
                {SUPPORT.email}
              </a>
              .
            </p>
          )}
        </div>

        {/* Return shipping instructions */}
        {isReturn && status === ORDER_REQUEST_STATUS.APPROVED && (
          <div className="border border-line p-[18px] text-[13.5px] sm:p-4">
            <p className="m-0 mb-2.5 flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
              <LuPackage className="h-4 w-4" strokeWidth={1.4} /> How to send it back
            </p>
            <ol className="m-0 mb-3.5 grid list-decimal gap-1 pl-5 leading-[1.6] text-ink-soft">
              <li>Pack the item securely with its original tags and a copy of your invoice.</li>
              <li>
                Write your return number <b className="font-medium text-ink">{request.request_number}</b> on a note inside the package.
              </li>
              {hasGift && (
                <li>
                  <b className="font-medium text-ink">Include your free gift</b> — it is part of this return.
                </li>
              )}
              <li>Ship with insurance and signature confirmation to the address below.</li>
            </ol>
            <div className="flex items-start justify-between gap-3 bg-haze p-3.5">
              <p className="m-0 text-ink">{RETURN_ADDRESS}</p>
              <button type="button" className="shrink-0 text-ink-soft hover:text-ink" onClick={() => copy(RETURN_ADDRESS)} aria-label="Copy address">
                <LuCopy className="h-4 w-4" strokeWidth={1.4} />
              </button>
            </div>
          </div>
        )}

        {/* Tracking */}
        {isReturn && request.return_tracking_number && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-[13.5px]">
            <p className="m-0">
              <span className="text-ink-faint">Tracking:</span> <b className="font-medium">{request.return_carrier}</b> ·{' '}
              {request.return_tracking_number}
              {request.return_shipped_at && <span className="text-ink-soft"> · shipped {formatDate(request.return_shipped_at)}</span>}
            </p>
          </div>
        )}

        {/* Items */}
        <ul className="m-0 list-none border-t border-line p-0">
          {request.requestItems?.map((item: any) => {
            const approved = item.approved_quantity;
            const qty = approved !== null && approved !== undefined ? approved : item.quantity;
            return (
              <li key={item.id} className="flex items-center gap-4 border-b border-line py-3">
                <div className="h-[70px] w-[56px] shrink-0 bg-stone">
                  <Image
                    src={item.image || '/images/no_images.svg'}
                    fallback="/images/no_images.svg"
                    preview={false}
                    alt={item.title}
                    className="mix-blend-multiply"
                  />
                </div>
                <div className="min-w-0 flex-1 text-[14px]">
                  <p className="m-0 flex items-center gap-2 font-medium text-ink">
                    <span className="truncate">{item.title}</span>
                    {item.is_free_gift && (
                      <span className="shrink-0 bg-navy px-2 py-[2px] text-[9.5px] font-semibold uppercase tracking-[0.14em] text-noir-on">
                        Free gift
                      </span>
                    )}
                  </p>
                  {item.variant && <p className="m-0 truncate text-[12.5px] text-ink-soft">{item.variant}</p>}
                  <p className="m-0 text-[12.5px] text-ink-faint">
                    {item.is_free_gift && Number(qty) === 0 ? 'You keep this gift' : `Qty ${qty}`}
                    {!item.is_free_gift && approved !== null && approved !== undefined && approved !== item.quantity
                      ? ` of ${item.quantity} requested`
                      : ''}
                    {item.reason ? ` · ${item.reason}` : ''}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-[14px]">
            {!isClosedEarly && (
              <p className="m-0">
                <span className="text-ink-soft">{refundLabel}:</span> <b className="font-semibold tabular-nums">{formatUsd(refundValue)}</b>
                {Number(request.deduction_amount) > 0 && (
                  <span className="text-[12px] text-ink-faint">
                    {' '}
                    (after {formatUsd(request.deduction_amount)} deduction{request.deduction_reason ? `: ${request.deduction_reason}` : ''})
                  </span>
                )}
              </p>
            )}
            <p className="m-0 mt-0.5 text-[12px] text-ink-faint">Submitted {formatDate(request.created_at)}</p>
          </div>
          <div className="flex gap-2">
            {canWithdraw && (
              <Popconfirm
                title="Withdraw this request?"
                description="You can raise a new request later if you change your mind."
                okText="Withdraw"
                cancelText="Keep"
                onConfirm={withdraw}
                zIndex={10060}
              >
                <Button
                  loading={busy === 'withdraw'}
                  className="!h-10 !rounded-none !border !border-ink !bg-transparent !px-6 !text-[11px] uppercase !tracking-[0.2em] !text-ink hover:!bg-ink hover:!text-paper"
                >
                  Withdraw
                </Button>
              </Popconfirm>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default RequestCard;
