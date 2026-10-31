'use client';
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useMemo, useState } from 'react';

import { Button, Checkbox, Image, Input, Steps, notification } from 'antd';
import dayjs from 'dayjs';
import Link from 'next/link';
import { LuArrowLeft, LuCircleCheck, LuClock, LuGift, LuLoader, LuMail, LuMinus, LuPhone, LuPlus, LuShieldCheck } from 'react-icons/lu';

import { apiCreateOrderRequest } from '@/services/orderService';

import { CANCEL_REASONS, ORDER_REQUEST_TYPE, RETURN_REASONS, SUPPORT, formatUsd } from './constants';
import useOrderRequests from './useOrderRequests';

interface OrderRequestWizardProps {
  orderNumber: string;
  type: number;
}

const STEP_TITLES = ['Select items', 'Tell us why', 'Review & submit'];

/**
 * Full-page cancel / return flow: pick the items, give a reason for each, review the refund and
 * submit — the same three steps most return portals use, so nothing is crammed into a dialog.
 */
const OrderRequestWizard: React.FC<OrderRequestWizardProps> = ({ orderNumber, type }) => {
  const { eligibility, loading } = useOrderRequests(orderNumber);
  const isCancel = type === ORDER_REQUEST_TYPE.CANCEL;
  const noun = isCancel ? 'cancellation' : 'return';

  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<Record<string, number>>({});
  // One reason for the whole request; it is sent with every selected item.
  const [reason, setReason] = useState<string>('');
  const [comment, setComment] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const items: any[] = eligibility?.items ?? [];
  const selectable = items.filter((item) => item.available_qty > 0);
  const chosen = items.filter((item) => selected[item.order_item_id]);
  const reasonList = isCancel ? CANCEL_REASONS : RETURN_REASONS;
  const needsComment = reason === 'Other';
  const unitKey = isCancel ? 'unit_cancel_refund' : 'unit_return_refund';

  // Mirrors OrderRequestService.giftsToInclude: a free gift is earned by the whole order, so it
  // comes back when nothing paid is left, or when what is kept drops below the offer minimum.
  const giftsIncluded = useMemo(() => {
    if (!chosen.length) {
      return [];
    }
    const gifts = items.filter((item) => item.is_free_gift && item.count - item.cancelled_qty - item.returned_qty > 0);
    const everything = selectable.every((item) => selected[item.order_item_id] === item.available_qty);
    const kept = selectable.reduce(
      (sum, item) => sum + Number(item.unit_offer_base || 0) * (item.available_qty - (selected[item.order_item_id] ?? 0)),
      0,
    );
    return gifts
      .filter((gift) => everything || (gift.gift_minimum !== null && gift.gift_minimum !== undefined && kept < Number(gift.gift_minimum)))
      .map((gift) => ({ ...gift, quantity: gift.count - gift.cancelled_qty - gift.returned_qty, wholeOrder: everything }));
  }, [selected, eligibility]);
  const hasGift = items.some((item) => item.is_free_gift);

  const giftNotice = (gift: any) =>
    isCancel
      ? gift.wholeOrder
        ? `Your free gift will be cancelled together with the order.`
        : `The rest of your order will be below the ${formatUsd(gift.gift_minimum)} needed for the free gift, so it will be cancelled too.`
      : gift.wholeOrder
        ? `Please send your free gift back together with the items.`
        : `The items you keep will be below the ${formatUsd(gift.gift_minimum)} needed for the free gift, so please send it back too.`;

  const totals = useMemo(() => {
    const remaining = Number(eligibility?.remaining_refundable ?? 0);
    let itemsTotal = chosen.reduce((sum, item) => sum + Number(item[unitKey]) * selected[item.order_item_id], 0);
    const everything = selectable.length > 0 && selectable.every((item) => selected[item.order_item_id] === item.available_qty);
    // Cancelling everything that is left refunds exactly what is left, like the server does.
    if (isCancel && everything) {
      itemsTotal = remaining;
    }
    return { estimate: Math.min(itemsTotal, remaining), units: chosen.reduce((sum, item) => sum + selected[item.order_item_id], 0) };
  }, [selected, eligibility]);

  const stepError = (() => {
    if (step === 0 && !chosen.length) {
      return 'Select at least one item to continue.';
    }
    if (step === 1) {
      if (!reason) {
        return 'Please choose a reason.';
      }
      if (needsComment && !comment.trim()) {
        return 'Please tell us a little more in the details box.';
      }
    }
    if (step === 2 && !agreed) {
      return 'Please confirm you have read the policy.';
    }
    return null;
  })();

  const toggle = (item: any) =>
    setSelected((prev) => {
      const next = { ...prev };
      if (next[item.order_item_id]) {
        delete next[item.order_item_id];
      } else {
        next[item.order_item_id] = item.available_qty;
      }
      return next;
    });

  const setQty = (item: any, qty: number) =>
    setSelected((prev) => ({ ...prev, [item.order_item_id]: Math.max(1, Math.min(item.available_qty, qty)) }));

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await apiCreateOrderRequest(orderNumber, {
        request_type: type,
        items: chosen.map((item) => ({
          order_item_id: item.order_item_id,
          quantity: selected[item.order_item_id],
          reason,
        })),
        comment: comment.trim() || undefined,
        policy_accepted: true,
      });
      setResult(res?.data?.data ?? {});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      notification.error({ message: error?.response?.data?.message ?? 'Something went wrong. Please try again.', placement: 'top' });
    } finally {
      setSubmitting(false);
    }
  };

  const next = () => {
    if (stepError) {
      notification.warning({ message: stepError, placement: 'top' });
      return;
    }
    if (step === 2) {
      submit();
      return;
    }
    setStep(step + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const backToOrder = `/profile/purchases?order=${orderNumber}`;

  // ------------------------------------------------------------------ states

  if (loading || !eligibility) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LuLoader className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  const allowed = eligibility.supported && (isCancel ? eligibility.can_cancel : eligibility.can_return);
  if (!allowed && !result) {
    return (
      <div className="mx-auto max-w-[560px] rounded-lg border border-[#e5e5e5] p-8 text-center sm:p-5">
        <p className="mb-2 text-[18px] font-semibold">This order can’t be {isCancel ? 'cancelled' : 'returned'} online</p>
        <p className="mb-5 text-[#666]">
          {eligibility.blocked_reason ??
            (eligibility.return_window_expired
              ? 'The return window for this order has closed.'
              : isCancel
                ? 'It has already shipped. Once it arrives you can request a return.'
                : 'Returns open once your order has been delivered.')}{' '}
          Call {SUPPORT.phone} or email {SUPPORT.email} and we’ll help.
        </p>
        <Link href={backToOrder} className="inline-flex h-[42px] items-center bg-primary px-6 text-[13px] uppercase tracking-[1.5px] !text-text_w">
          Back to order
        </Link>
      </div>
    );
  }

  if (result) {
    return (
      <div className="mx-auto max-w-[620px] rounded-lg border border-[#e5e5e5] p-8 sm:p-5">
        <div className="mb-5 flex flex-col items-center text-center">
          <LuCircleCheck className="mb-3 h-12 w-12 text-primary" />
          <p className="mb-1 text-[22px] font-semibold">Your {noun} request is submitted</p>
          <p className="mb-0 text-[#666]">
            Request number <b>{result.request_number}</b>
          </p>
        </div>
        <p className="mb-6 text-center text-[13px] text-[#777]">
          We’ve emailed you a confirmation. You can follow the status anytime from your order.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href={backToOrder} className="inline-flex h-[42px] items-center bg-primary px-6 text-[13px] uppercase tracking-[1.5px] !text-text_w">
            View request
          </Link>
          <Link href="/" className="inline-flex h-[42px] items-center border border-primary px-6 text-[13px] uppercase tracking-[1.5px] text-primary">
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------ flow

  const itemHeader = (item: any, qty?: number) => (
    <div className="flex items-center gap-3">
      <div className="h-[72px] w-[72px] shrink-0 bg-[#f3f3f1] sm:h-[60px] sm:w-[60px]">
        <Image
          src={item.image || '/images/no_images.svg'}
          fallback="/images/no_images.svg"
          preview={false}
          alt={item.title}
          className="mix-blend-multiply"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-0 font-medium leading-snug">{item.title}</p>
        {item.variant && <p className="mb-0 text-[13px] text-[#777]">{item.variant}</p>}
        {qty !== undefined && <p className="mb-0 text-[13px] text-[#777]">Qty {qty}</p>}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={backToOrder} className="mb-3 inline-flex items-center gap-1 text-[14px] text-[#555] hover:text-primary">
          <LuArrowLeft /> Back to order {orderNumber}
        </Link>
        <h1 className="mb-1 text-[28px] font-normal uppercase tracking-[2px] sm:text-[22px]">{isCancel ? 'Cancel items' : 'Return items'}</h1>
        <p className="mb-0 text-[14px] text-[#666]">
          Order {orderNumber} · placed {dayjs(eligibility.order_date).format('MMMM D, YYYY')}
          {!isCancel && eligibility.return_deadline && ` · returnable until ${dayjs(eligibility.return_deadline).format('MMMM D, YYYY')}`}
        </p>
      </div>

      <Steps current={step} size="small" responsive={false} items={STEP_TITLES.map((title) => ({ title }))} className="max-w-[640px]" />

      <div className="flex items-start gap-6 md:flex-col">
        {/* Main column */}
        <div className="flex w-[65%] flex-col gap-4 md:w-full">
          {step === 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="mb-0 text-[16px] font-semibold">Which items would you like to {isCancel ? 'cancel' : 'return'}?</p>
                {selectable.length > 1 && (
                  <button
                    type="button"
                    className="text-[13px] text-primary underline"
                    onClick={() =>
                      setSelected(
                        chosen.length === selectable.length
                          ? {}
                          : Object.fromEntries(selectable.map((item) => [item.order_item_id, item.available_qty])),
                      )
                    }
                  >
                    {chosen.length === selectable.length ? 'Clear all' : 'Select all'}
                  </button>
                )}
              </div>
              {items.map((item) => {
                const disabled = item.available_qty <= 0;
                // A free gift that has to go with the request shows as selected, but the customer cannot change it.
                const giftIncluded = item.is_free_gift && giftsIncluded.some((gift) => gift.order_item_id === item.order_item_id);
                const checked = giftIncluded || !!selected[item.order_item_id];
                return (
                  <div
                    key={item.order_item_id}
                    role="button"
                    tabIndex={disabled ? -1 : 0}
                    onClick={() => !disabled && toggle(item)}
                    onKeyDown={(e) => e.key === 'Enter' && !disabled && toggle(item)}
                    className={`flex items-center gap-4 rounded-lg border p-4 transition sm:gap-3 sm:p-3 ${
                      giftIncluded
                        ? 'cursor-not-allowed border-primary bg-[#f6f8f3] shadow-[0_0_0_1px_#18381d]'
                        : disabled
                          ? 'cursor-not-allowed border-[#eeeeee] bg-[#fafafa] opacity-60'
                          : checked
                            ? 'cursor-pointer border-primary bg-[#f6f8f3] shadow-[0_0_0_1px_#18381d]'
                            : 'cursor-pointer border-[#e5e5e5] hover:border-[#b9c2ad]'
                    }`}
                  >
                    <Checkbox checked={checked} disabled={disabled} className="pointer-events-none" />
                    <div className="min-w-0 flex-1">{itemHeader(item)}</div>
                    <div className="flex shrink-0 flex-col items-end gap-2 text-right" onClick={(e) => e.stopPropagation()}>
                      {disabled ? (
                        <span className={`text-[12px] ${giftIncluded ? 'font-medium text-[#8a6d1f]' : 'text-[#777]'}`}>
                          {giftIncluded
                            ? 'Free gift · included'
                            : item.is_free_gift
                              ? 'Free gift'
                              : item.cancelled_qty > 0
                                ? 'Already cancelled'
                                : 'Already returned'}
                        </span>
                      ) : (
                        <>
                          <span className="text-[14px] font-medium">{formatUsd(item[unitKey])}</span>
                          {item.available_qty > 1 && checked && (
                            <div className="flex items-center rounded border border-[#dcdcdc]">
                              <button
                                type="button"
                                className="px-2 py-1 disabled:opacity-40"
                                disabled={selected[item.order_item_id] <= 1}
                                onClick={() => setQty(item, selected[item.order_item_id] - 1)}
                                aria-label="Decrease"
                              >
                                <LuMinus />
                              </button>
                              <span className="w-7 text-center text-[14px]">{selected[item.order_item_id]}</span>
                              <button
                                type="button"
                                className="px-2 py-1 disabled:opacity-40"
                                disabled={selected[item.order_item_id] >= item.available_qty}
                                onClick={() => setQty(item, selected[item.order_item_id] + 1)}
                                aria-label="Increase"
                              >
                                <LuPlus />
                              </button>
                            </div>
                          )}
                          {item.available_qty > 1 && !checked && <span className="text-[12px] text-[#777]">{item.available_qty} available</span>}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              {giftsIncluded.map((gift) => (
                <div
                  key={gift.order_item_id}
                  className="flex items-start gap-3 rounded-lg border border-[#ecd9a6] bg-[#fdf8ea] p-4 text-[14px] sm:p-3"
                >
                  <LuGift className="mt-[2px] h-5 w-5 shrink-0 text-[#a07a1c]" />
                  <p className="mb-0 text-[#5c4a14]">
                    <b>{gift.title}</b> (free gift) will be included. {giftNotice(gift)}
                  </p>
                </div>
              ))}
              {hasGift && chosen.length > 0 && !giftsIncluded.length && (
                <p className="mb-0 flex items-center gap-2 text-[13px] text-[#5b6b52]">
                  <LuGift className="shrink-0" /> You keep your free gift — the rest of your order still qualifies for it.
                </p>
              )}
            </>
          )}

          {step === 1 && (
            <>
              <div className="rounded-lg border border-[#e5e5e5] bg-white p-4 sm:p-3">
                <p className="mb-1 text-[16px] font-semibold">
                  Why are you {isCancel ? 'cancelling' : 'returning'}? <span className="text-red-500">*</span>
                </p>
                <p className="mb-4 text-[14px] text-[#777]">Choose the reason that fits best.</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-1" role="radiogroup" aria-label="Reason">
                  {reasonList.map((value) => {
                    const active = reason === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setReason(value)}
                        className={`flex items-center gap-3 rounded-md border px-4 py-3 text-left text-[14px] transition ${
                          active ? 'border-primary bg-[#f6f8f3] text-primary' : 'border-[#e5e5e5] bg-white text-[#333] hover:border-[#b9c2ad]'
                        }`}
                      >
                        <span
                          className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border ${
                            active ? 'border-primary' : 'border-[#bdbdbd]'
                          }`}
                        >
                          {active && <span className="h-[10px] w-[10px] rounded-full bg-primary" />}
                        </span>
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-lg border border-[#e5e5e5] bg-white p-4 sm:p-3">
                <label htmlFor="request-comment" className="mb-2 block text-[15px] font-medium">
                  Additional details{' '}
                  {needsComment ? <span className="text-red-500">*</span> : <span className="text-[13px] font-normal text-[#777]">(optional)</span>}
                </label>
                <Input.TextArea
                  id="request-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, 1000))}
                  autoSize={{ minRows: 3, maxRows: 8 }}
                  placeholder={needsComment ? 'Please tell us a little more about the reason' : 'Anything that helps us understand your request'}
                  className="!rounded-md !bg-white !text-[14px]"
                />
                <div className="mt-2 flex justify-between gap-3 text-[12px] text-[#999]">
                  <span>{needsComment ? 'Required when “Other” is selected.' : 'Our team reads every note.'}</span>
                  <span>{comment.length} / 1000</span>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="mb-0 text-[16px] font-semibold">Review your {noun}</p>
              <div className="flex flex-col divide-y divide-[#f0f0f0] rounded-lg border border-[#e5e5e5] px-4 sm:px-3">
                {chosen.map((item) => (
                  <div key={item.order_item_id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">{itemHeader(item, selected[item.order_item_id])}</div>
                    <span className="shrink-0 text-[14px]">{formatUsd(Number(item[unitKey]) * selected[item.order_item_id])}</span>
                  </div>
                ))}
                {giftsIncluded.map((gift) => (
                  <div key={gift.order_item_id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      {itemHeader(gift, gift.quantity)}
                      <p className="mb-0 mt-1 pl-[84px] text-[13px] text-[#8a6d1f] sm:pl-[72px]">Free gift · {giftNotice(gift)}</p>
                    </div>
                    <span className="shrink-0 text-[14px] text-[#777]">{formatUsd(0)}</span>
                  </div>
                ))}
                <p className="mb-0 py-3 text-[14px] text-[#333]">
                  <span className="text-[#777]">Reason:</span> {reason}
                </p>
                {comment.trim() && <p className="mb-0 py-3 text-[13px] text-[#555]">“{comment.trim()}”</p>}
                <button type="button" className="py-3 text-left text-[13px] text-primary underline" onClick={() => setStep(0)}>
                  Edit items
                </button>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-[#f6f8f3] p-4 text-[14px] sm:p-3">
                <Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-[2px]" />
                <span>
                  I understand the{' '}
                  <Link href="/returns-shipping" target="_blank" className="text-primary underline">
                    Returns &amp; Shipping policy
                  </Link>
                  {isCancel
                    ? ', and that the final refund is confirmed once our team approves the cancellation.'
                    : ': items must be in original condition, and the final refund is confirmed after inspection.'}
                </span>
              </label>
            </>
          )}

          <div className="mt-2 flex items-center justify-between gap-3 pt-2 sm:flex-col-reverse sm:items-stretch">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                disabled={submitting}
                className="inline-flex h-[48px] min-w-[140px] items-center justify-center gap-2 border border-primary bg-white px-6 text-[13px] uppercase tracking-[1.5px] text-primary transition hover:bg-[#f6f8f3] disabled:opacity-50"
              >
                <LuArrowLeft /> Back
              </button>
            ) : (
              <span className="sm:hidden" />
            )}
            <Button
              onClick={next}
              loading={submitting}
              className={`!h-[48px] !min-w-[180px] !rounded-none !border-primary !bg-primary !px-8 !text-[13px] uppercase !tracking-[1.5px] !text-text_w hover:!opacity-90 ${
                stepError ? '!opacity-60' : ''
              }`}
            >
              {step === 2 ? `Submit ${noun} request` : 'Continue'}
            </Button>
          </div>
        </div>

        {/* Summary */}
        <aside className="sticky top-[120px] w-[35%] overflow-hidden rounded-lg border border-[#e5e5e5] bg-white md:static md:w-full">
          <div className="p-5 sm:p-4">
            <p className="mb-4 text-[12px] font-medium uppercase tracking-[1.5px] text-[#777]">Your {noun}</p>
            {totals.units === 0 ? (
              <p className="mb-0 text-[14px] text-[#777]">Select the items you want to {isCancel ? 'cancel' : 'return'} to see your refund.</p>
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  {chosen.map((item) => (
                    <div key={item.order_item_id} className="flex items-center gap-3">
                      <div className="h-[44px] w-[44px] shrink-0 bg-[#f3f3f1]">
                        <Image
                          src={item.image || '/images/no_images.svg'}
                          fallback="/images/no_images.svg"
                          preview={false}
                          alt={item.title}
                          className="mix-blend-multiply"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="mb-0 line-clamp-2 text-[13px] leading-snug text-[#333]">{item.title}</p>
                        <p className="mb-0 text-[12px] text-[#777]">Qty {selected[item.order_item_id]}</p>
                      </div>
                      <span className="shrink-0 text-[13px]">{formatUsd(Number(item[unitKey]) * selected[item.order_item_id])}</span>
                    </div>
                  ))}
                  {giftsIncluded.map((gift) => (
                    <div key={gift.order_item_id} className="flex items-center gap-3">
                      <div className="h-[44px] w-[44px] shrink-0 bg-[#f3f3f1]">
                        <Image
                          src={gift.image || '/images/no_images.svg'}
                          fallback="/images/no_images.svg"
                          preview={false}
                          alt={gift.title}
                          className="mix-blend-multiply"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="mb-0 line-clamp-2 text-[13px] leading-snug text-[#333]">{gift.title}</p>
                        <p className="mb-0 text-[12px] text-[#8a6d1f]">Free gift · Qty {gift.quantity}</p>
                      </div>
                      <span className="shrink-0 text-[13px] text-[#777]">{formatUsd(0)}</span>
                    </div>
                  ))}
                </div>
                {!isCancel && Number(eligibility.shipping_amount) > 0 && (
                  <div className="mt-2 flex justify-between gap-3 text-[13px] text-[#777]">
                    <span>Original shipping</span>
                    <span>Not refunded</span>
                  </div>
                )}
                <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-[#eeeeee] pt-4">
                  <span className="text-[15px] font-semibold">Estimated refund</span>
                  <span className="text-[24px] font-semibold text-primary">{formatUsd(totals.estimate)}</span>
                </div>
              </>
            )}
          </div>
          <div className="flex flex-col gap-2.5 border-t border-[#eeeeee] bg-[#fafaf8] px-5 py-4 text-[13px] text-[#555] sm:px-4">
            <p className="mb-0 flex gap-2">
              <LuClock className="mt-[2px] shrink-0 text-primary" />
              {isCancel ? 'Reviewed within 1–2 business days.' : `Returns accepted within ${eligibility.return_window_days} days of delivery.`}
            </p>
            {!isCancel && (
              <p className="mb-0 flex gap-2">
                <LuShieldCheck className="mt-[2px] shrink-0 text-primary" />
                Every return is inspected by a certified jeweler.
              </p>
            )}
          </div>
          {/* Support contacts, each on its own tappable row. */}
          <div className="border-t border-[#eeeeee] px-5 py-4 sm:px-4">
            <p className="mb-2 text-[12px] font-medium uppercase tracking-[1.5px] text-[#777]">Need help?</p>
            <div className="flex flex-col gap-2">
              <a
                href={`tel:${SUPPORT.phone.replace(/[^0-9+]/g, '')}`}
                className="flex items-center gap-3 rounded-md border border-[#eeeeee] px-3 py-2.5 text-[14px] text-[#333] transition hover:border-primary hover:text-primary"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eef1e8] text-primary">
                  <LuPhone />
                </span>
                <span className="flex flex-col">
                  <span className="text-[11px] uppercase tracking-[1px] text-[#999]">Call us</span>
                  {SUPPORT.phone}
                </span>
              </a>
              <a
                href={`mailto:${SUPPORT.email}`}
                className="flex items-center gap-3 rounded-md border border-[#eeeeee] px-3 py-2.5 text-[14px] text-[#333] transition hover:border-primary hover:text-primary"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eef1e8] text-primary">
                  <LuMail />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-[11px] uppercase tracking-[1px] text-[#999]">Email us</span>
                  <span className="truncate">{SUPPORT.email}</span>
                </span>
              </a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default OrderRequestWizard;
