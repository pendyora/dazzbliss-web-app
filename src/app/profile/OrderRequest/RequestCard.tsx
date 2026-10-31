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
    <div className="overflow-hidden rounded-lg border border-[#e5e5e5] bg-white">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eeeeee] bg-[#fafaf8] px-5 py-3 sm:px-3">
        <div className="flex items-center gap-2">
          {isReturn ? <LuRotateCcw className="text-primary" /> : <LuCircleX className="text-primary" />}
          <p className="mb-0 font-semibold">{REQUEST_TYPE_LABEL[type]} Request</p>
          <span className="text-[13px] text-[#777]">#{request.request_number}</span>
        </div>
        {meta && <span className={`rounded-full border px-3 py-0.5 text-[12px] font-medium ${meta.className}`}>{meta.label}</span>}
      </div>

      <div className="flex flex-col gap-4 p-5 sm:p-3">
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
          className={`rounded-md px-4 py-3 text-[14px] ${
            status === ORDER_REQUEST_STATUS.REJECTED
              ? 'bg-red-50 text-red-800'
              : status === ORDER_REQUEST_STATUS.COMPLETED
                ? 'bg-green-50 text-green-800'
                : 'bg-[#f4f6f1] text-[#2f3a2a]'
          }`}
        >
          <p className="mb-0">{statusMessage}</p>
          {request.admin_note && <p className="mb-0 mt-1">Note from our team: {request.admin_note}</p>}
          {status === ORDER_REQUEST_STATUS.REJECTED && (
            <p className="mb-0 mt-1 text-[13px]">
              Questions? Call {SUPPORT.phone} or email{' '}
              <a href={`mailto:${SUPPORT.email}`} className="underline">
                {SUPPORT.email}
              </a>
              .
            </p>
          )}
        </div>

        {/* Return shipping instructions */}
        {isReturn && status === ORDER_REQUEST_STATUS.APPROVED && (
          <div className="rounded-md border border-dashed border-[#c9d1bd] p-4 text-[14px]">
            <p className="mb-2 flex items-center gap-2 font-semibold">
              <LuPackage /> How to send it back
            </p>
            <ol className="mb-3 list-decimal pl-5 text-[#444]">
              <li>Pack the item securely with its original tags and a copy of your invoice.</li>
              <li>
                Write your return number <b>{request.request_number}</b> on a note inside the package.
              </li>
              {hasGift && (
                <li>
                  <b>Include your free gift</b> — it is part of this return.
                </li>
              )}
              <li>Ship with insurance and signature confirmation to the address below.</li>
            </ol>
            <div className="flex items-start justify-between gap-3 rounded bg-[#fafaf8] p-3">
              <p className="mb-0">{RETURN_ADDRESS}</p>
              <button type="button" className="shrink-0 text-primary" onClick={() => copy(RETURN_ADDRESS)} aria-label="Copy address">
                <LuCopy />
              </button>
            </div>
          </div>
        )}

        {/* Tracking */}
        {isReturn && request.return_tracking_number && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-[14px]">
            <p className="mb-0">
              Tracking: <b>{request.return_carrier}</b> · {request.return_tracking_number}
              {request.return_shipped_at && <span className="text-[#777]"> · shipped {formatDate(request.return_shipped_at)}</span>}
            </p>
          </div>
        )}

        {/* Items */}
        <div className="flex flex-col divide-y divide-[#f0f0f0]">
          {request.requestItems?.map((item: any) => {
            const approved = item.approved_quantity;
            const qty = approved !== null && approved !== undefined ? approved : item.quantity;
            return (
              <div key={item.id} className="flex items-center gap-3 py-2">
                <div className="h-[56px] w-[56px] shrink-0 bg-[#f0f0f0]">
                  <Image
                    src={item.image || '/images/no_images.svg'}
                    fallback="/images/no_images.svg"
                    preview={false}
                    alt={item.title}
                    className="mix-blend-multiply"
                  />
                </div>
                <div className="min-w-0 flex-1 text-[14px]">
                  <p className="mb-0 flex items-center gap-2 font-medium">
                    <span className="truncate">{item.title}</span>
                    {item.is_free_gift && (
                      <span className="shrink-0 bg-secondary px-2 py-[1px] text-[9px] uppercase tracking-[1.2px] text-text_w">Free Gift</span>
                    )}
                  </p>
                  {item.variant && <p className="mb-0 truncate text-[12px] text-[#777]">{item.variant}</p>}
                  <p className="mb-0 text-[12px] text-[#777]">
                    {item.is_free_gift && Number(qty) === 0 ? 'You keep this gift' : `Qty ${qty}`}
                    {!item.is_free_gift && approved !== null && approved !== undefined && approved !== item.quantity
                      ? ` of ${item.quantity} requested`
                      : ''}
                    {item.reason ? ` · ${item.reason}` : ''}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f0f0f0] pt-3">
          <div className="text-[14px]">
            {!isClosedEarly && (
              <p className="mb-0">
                {refundLabel}: <b>{formatUsd(refundValue)}</b>
                {Number(request.deduction_amount) > 0 && (
                  <span className="text-[12px] text-[#777]">
                    {' '}
                    (after {formatUsd(request.deduction_amount)} deduction{request.deduction_reason ? `: ${request.deduction_reason}` : ''})
                  </span>
                )}
              </p>
            )}
            <p className="mb-0 text-[12px] text-[#777]">Submitted {formatDate(request.createdAt)}</p>
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
                <Button loading={busy === 'withdraw'} className="uppercase">
                  Withdraw
                </Button>
              </Popconfirm>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestCard;
