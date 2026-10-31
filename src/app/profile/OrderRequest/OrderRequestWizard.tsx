'use client';
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useMemo, useState } from 'react';

import { Button, Checkbox, Image, Input, Steps, notification } from 'antd';
import dayjs from 'dayjs';
import Link from 'next/link';
import { LuArrowLeft, LuCircleCheck, LuClock, LuGift, LuLoader, LuMail, LuMinus, LuPhone, LuPlus, LuShieldCheck } from 'react-icons/lu';

import { PRIMARY_BTN } from '@/app/checkout/checkoutTheme';
import { apiCreateOrderRequest } from '@/services/orderService';

import { CANCEL_REASONS, ORDER_REQUEST_TYPE, RETURN_REASONS, SUPPORT, formatUsd } from './constants';
import useOrderRequests from './useOrderRequests';

interface OrderRequestWizardProps {
  orderNumber: string;
  type: number;
}

const STEP_TITLES = ['Select items', 'Tell us why', 'Review & submit'];

// Link-styled buttons matching the account pages (design-mockups/account).
const BTN_DARK =
  'inline-flex h-12 items-center justify-center bg-ink px-7 text-[11.5px] font-medium uppercase tracking-[0.2em] text-paper hover:bg-ink-hover hover:text-paper';
const BTN_OUTLINE =
  'inline-flex h-12 items-center justify-center border border-ink bg-transparent px-7 text-[11.5px] uppercase tracking-[0.2em] text-ink transition-colors hover:bg-ink hover:text-paper';
const LINK = 'text-[13px] font-medium text-teal underline underline-offset-[3px] hover:text-navy';
const KICKER = 'm-0 text-[10.5px] font-medium uppercase tracking-[0.22em] text-gilt';

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
      <div className="grid min-h-[40vh] place-items-center">
        <LuLoader className="h-7 w-7 animate-spin text-ink-soft" />
      </div>
    );
  }

  const allowed = eligibility.supported && (isCancel ? eligibility.can_cancel : eligibility.can_return);
  if (!allowed && !result) {
    return (
      <div className="grid max-w-[620px] justify-items-start gap-3 border border-line p-7 sm:p-5">
        <b className="font-cormorant text-[26px] font-medium leading-[1.1]">This order can’t be {isCancel ? 'cancelled' : 'returned'} online</b>
        <p className="m-0 text-[14px] leading-[1.65] text-ink-soft">
          {eligibility.blocked_reason ??
            (eligibility.return_window_expired
              ? 'The return window for this order has closed.'
              : isCancel
                ? 'It has already shipped. Once it arrives you can request a return.'
                : 'Returns open once your order has been delivered.')}{' '}
          Call {SUPPORT.phone} or email {SUPPORT.email} and we’ll help.
        </p>
        <Link href={backToOrder} className={`mt-1 ${BTN_DARK}`}>
          Back to order
        </Link>
      </div>
    );
  }

  if (result) {
    return (
      <div className="grid max-w-[620px] justify-items-start gap-3 border border-line p-7 sm:p-5">
        <LuCircleCheck className="h-9 w-9 text-ok" strokeWidth={1.3} />
        <p className={KICKER}>Request received</p>
        <b className="font-cormorant text-[30px] font-medium leading-[1.1]">Your {noun} request is submitted</b>
        <p className="m-0 text-[14px] text-ink-soft">
          Request number <b className="font-medium text-ink">{result.request_number}</b>
        </p>
        <p className="m-0 text-[13.5px] leading-[1.65] text-ink-soft">
          We’ve emailed you a confirmation. You can follow the status anytime from your order.
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <Link href={backToOrder} className={BTN_DARK}>
            View request
          </Link>
          <Link href="/" className={BTN_OUTLINE}>
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------ flow

  const thumb = (item: any, size: string) => (
    <div className={`${size} shrink-0 bg-stone`}>
      <Image
        src={item.image || '/images/no_images.svg'}
        fallback="/images/no_images.svg"
        preview={false}
        alt={item.title}
        className="mix-blend-multiply"
      />
    </div>
  );

  const itemHeader = (item: any, qty?: number) => (
    <div className="flex items-center gap-4 sm:gap-3">
      {thumb(item, 'h-[80px] w-[64px] sm:h-[70px] sm:w-[56px]')}
      <div className="min-w-0 flex-1">
        <p className="m-0 text-[14.5px] font-medium leading-snug text-ink">{item.title}</p>
        {item.variant && <p className="m-0 mt-0.5 text-[13px] text-ink-soft">{item.variant}</p>}
        {qty !== undefined && <p className="m-0 mt-0.5 text-[13px] text-ink-soft">Qty {qty}</p>}
      </div>
    </div>
  );

  return (
    <div className="grid gap-6">
      <div>
        <Link href={backToOrder} className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-ink-soft hover:text-ink">
          <LuArrowLeft className="h-4 w-4" strokeWidth={1.3} /> Back to order {orderNumber}
        </Link>
        <h2 className="m-0 font-cormorant text-[32px] font-medium leading-[1.05] text-ink">{isCancel ? 'Cancel items' : 'Return items'}</h2>
        <p className="m-0 mt-1 text-[14px] text-ink-soft">
          Order {orderNumber} · placed {dayjs(eligibility.order_date).format('MMMM D, YYYY')}
          {!isCancel && eligibility.return_deadline && ` · returnable until ${dayjs(eligibility.return_deadline).format('MMMM D, YYYY')}`}
        </p>
      </div>

      <Steps current={step} size="small" responsive={false} items={STEP_TITLES.map((title) => ({ title }))} className="max-w-[640px]" />

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(260px,320px)] items-start gap-[clamp(24px,3vw,40px)] md:grid-cols-1">
        {/* Main column */}
        <div className="grid min-w-0 content-start gap-3.5">
          {step === 0 && (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p className="m-0 text-[15px] font-medium text-ink">Which items would you like to {isCancel ? 'cancel' : 'return'}?</p>
                {selectable.length > 1 && (
                  <button
                    type="button"
                    className={LINK}
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
                    className={`flex items-center gap-4 border p-4 transition-colors sm:gap-3 sm:p-3 ${
                      giftIncluded
                        ? 'cursor-not-allowed border-ink bg-haze'
                        : disabled
                          ? 'cursor-not-allowed border-line opacity-55'
                          : checked
                            ? 'cursor-pointer border-ink bg-haze'
                            : 'cursor-pointer border-line hover:border-line-strong'
                    }`}
                  >
                    <Checkbox checked={checked} disabled={disabled} className="pointer-events-none" />
                    <div className="min-w-0 flex-1">{itemHeader(item)}</div>
                    <div className="flex shrink-0 flex-col items-end gap-2 text-right" onClick={(e) => e.stopPropagation()}>
                      {disabled ? (
                        <span className={`text-[10.5px] uppercase tracking-[0.14em] ${giftIncluded ? 'font-semibold text-gilt' : 'text-ink-faint'}`}>
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
                          <span className="text-[14px] tabular-nums text-ink">{formatUsd(item[unitKey])}</span>
                          {item.available_qty > 1 && checked && (
                            <div className="flex h-9 items-center border border-line-strong bg-paper">
                              <button
                                type="button"
                                className="grid h-full w-8 place-items-center text-ink hover:bg-haze disabled:opacity-35"
                                disabled={selected[item.order_item_id] <= 1}
                                onClick={() => setQty(item, selected[item.order_item_id] - 1)}
                                aria-label="Decrease"
                              >
                                <LuMinus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-7 text-center text-[13.5px] tabular-nums">{selected[item.order_item_id]}</span>
                              <button
                                type="button"
                                className="grid h-full w-8 place-items-center text-ink hover:bg-haze disabled:opacity-35"
                                disabled={selected[item.order_item_id] >= item.available_qty}
                                onClick={() => setQty(item, selected[item.order_item_id] + 1)}
                                aria-label="Increase"
                              >
                                <LuPlus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                          {item.available_qty > 1 && !checked && <span className="text-[12px] text-ink-faint">{item.available_qty} available</span>}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              {giftsIncluded.map((gift) => (
                <div key={gift.order_item_id} className="flex items-start gap-3 border border-line bg-mist p-4 text-[13.5px] sm:p-3">
                  <LuGift className="mt-[2px] h-[18px] w-[18px] shrink-0 text-gilt" strokeWidth={1.4} />
                  <p className="m-0 leading-[1.6] text-ink">
                    <b className="font-medium">{gift.title}</b> (free gift) will be included. {giftNotice(gift)}
                  </p>
                </div>
              ))}
              {hasGift && chosen.length > 0 && !giftsIncluded.length && (
                <p className="m-0 flex items-center gap-2 text-[13px] text-ink-soft">
                  <LuGift className="shrink-0 text-gilt" strokeWidth={1.4} /> You keep your free gift — the rest of your order still qualifies for it.
                </p>
              )}
            </>
          )}

          {step === 1 && (
            <>
              <section className="border border-line p-[22px] sm:p-4">
                <p className="m-0 text-[15px] font-medium text-ink">
                  Why are you {isCancel ? 'cancelling' : 'returning'}? <span className="text-danger">*</span>
                </p>
                <p className="m-0 mb-4 mt-1 text-[13.5px] text-ink-soft">Choose the reason that fits best.</p>
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
                        className={`flex items-center gap-3 border px-4 py-3 text-left text-[14px] transition-colors ${
                          active ? 'border-ink bg-haze text-ink' : 'border-line bg-paper text-ink-soft hover:border-line-strong hover:text-ink'
                        }`}
                      >
                        <span
                          className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border ${
                            active ? 'border-ink' : 'border-line-strong'
                          }`}
                        >
                          {active && <span className="h-2 w-2 rounded-full bg-ink" />}
                        </span>
                        {value}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="border border-line p-[22px] sm:p-4">
                <label htmlFor="request-comment" className="mb-2 block text-[10.5px] uppercase tracking-[0.16em] text-ink-soft">
                  Additional details{' '}
                  {needsComment ? (
                    <span className="text-danger">*</span>
                  ) : (
                    <span className="normal-case tracking-normal text-ink-faint">(optional)</span>
                  )}
                </label>
                <Input.TextArea
                  id="request-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, 1000))}
                  autoSize={{ minRows: 3, maxRows: 8 }}
                  placeholder={needsComment ? 'Please tell us a little more about the reason' : 'Anything that helps us understand your request'}
                  className="!text-[14px]"
                />
                <div className="mt-2 flex justify-between gap-3 text-[12px] text-ink-faint">
                  <span>{needsComment ? 'Required when “Other” is selected.' : 'Our team reads every note.'}</span>
                  <span className="tabular-nums">{comment.length} / 1000</span>
                </div>
              </section>
            </>
          )}

          {step === 2 && (
            <>
              <p className="m-0 text-[15px] font-medium text-ink">Review your {noun}</p>
              <ul className="m-0 list-none border-t border-line p-0">
                {chosen.map((item) => (
                  <li key={item.order_item_id} className="flex items-center gap-4 border-b border-line py-4">
                    <div className="min-w-0 flex-1">{itemHeader(item, selected[item.order_item_id])}</div>
                    <span className="shrink-0 text-[14px] tabular-nums">{formatUsd(Number(item[unitKey]) * selected[item.order_item_id])}</span>
                  </li>
                ))}
                {giftsIncluded.map((gift) => (
                  <li key={gift.order_item_id} className="flex items-center gap-4 border-b border-line py-4">
                    <div className="min-w-0 flex-1">
                      {itemHeader(gift, gift.quantity)}
                      <p className="m-0 mt-1.5 pl-[80px] text-[12.5px] text-gilt sm:pl-[68px]">Free gift · {giftNotice(gift)}</p>
                    </div>
                    <span className="shrink-0 text-[14px] tabular-nums text-ink-faint">{formatUsd(0)}</span>
                  </li>
                ))}
              </ul>
              <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-5 gap-y-1.5 text-[13.5px]">
                <dt className="text-ink-faint">Reason</dt>
                <dd className="m-0 text-ink">{reason}</dd>
                {comment.trim() && (
                  <>
                    <dt className="text-ink-faint">Details</dt>
                    <dd className="m-0 text-ink-soft">“{comment.trim()}”</dd>
                  </>
                )}
              </dl>
              <button type="button" className={`justify-self-start ${LINK}`} onClick={() => setStep(0)}>
                Edit items
              </button>

              <label className="mt-1 flex cursor-pointer items-start gap-3 border border-line bg-haze p-4 text-[13.5px] leading-[1.6] text-ink sm:p-3">
                <Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-[2px]" />
                <span>
                  I understand the{' '}
                  <Link href="/returns-shipping" target="_blank" className={LINK}>
                    Returns &amp; Shipping policy
                  </Link>
                  {isCancel
                    ? ', and that the final refund is confirmed once our team approves the cancellation.'
                    : ': items must be in original condition, and the final refund is confirmed after inspection.'}
                </span>
              </label>
            </>
          )}

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-5 sm:flex-col-reverse sm:items-stretch">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                disabled={submitting}
                className={`${BTN_OUTLINE} min-w-[140px] gap-2 disabled:opacity-50`}
              >
                <LuArrowLeft className="h-4 w-4" strokeWidth={1.3} /> Back
              </button>
            ) : (
              <span className="sm:hidden" />
            )}
            <Button onClick={next} loading={submitting} className={`${PRIMARY_BTN} !min-w-[180px] ${stepError ? '!opacity-60' : ''}`}>
              {step === 2 ? `Submit ${noun} request` : 'Continue'}
            </Button>
          </div>
        </div>

        {/* Summary */}
        <aside className="sticky top-[calc(var(--header-height,108px)+24px)] grid gap-3.5 md:static">
          <section className="grid content-start gap-3 border border-line p-[22px]">
            <h3 className="m-0 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-faint">Your {noun}</h3>
            {totals.units === 0 ? (
              <p className="m-0 text-[13.5px] leading-[1.6] text-ink-soft">
                Select the items you want to {isCancel ? 'cancel' : 'return'} to see your refund.
              </p>
            ) : (
              <>
                <div className="grid gap-3">
                  {chosen.map((item) => (
                    <div key={item.order_item_id} className="flex items-center gap-3">
                      {thumb(item, 'h-[56px] w-[45px]')}
                      <div className="min-w-0 flex-1">
                        <p className="m-0 line-clamp-2 text-[13px] leading-snug text-ink">{item.title}</p>
                        <p className="m-0 text-[12px] text-ink-faint">Qty {selected[item.order_item_id]}</p>
                      </div>
                      <span className="shrink-0 text-[13px] tabular-nums">{formatUsd(Number(item[unitKey]) * selected[item.order_item_id])}</span>
                    </div>
                  ))}
                  {giftsIncluded.map((gift) => (
                    <div key={gift.order_item_id} className="flex items-center gap-3">
                      {thumb(gift, 'h-[56px] w-[45px]')}
                      <div className="min-w-0 flex-1">
                        <p className="m-0 line-clamp-2 text-[13px] leading-snug text-ink">{gift.title}</p>
                        <p className="m-0 text-[12px] text-gilt">Free gift · Qty {gift.quantity}</p>
                      </div>
                      <span className="shrink-0 text-[13px] tabular-nums text-ink-faint">{formatUsd(0)}</span>
                    </div>
                  ))}
                </div>
                {!isCancel && Number(eligibility.shipping_amount) > 0 && (
                  <div className="flex justify-between gap-3 text-[13px] text-ink-soft">
                    <span>Original shipping</span>
                    <span>Not refunded</span>
                  </div>
                )}
                <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-line pt-3.5">
                  <span className="text-[14px] font-semibold">Estimated refund</span>
                  <span className="font-cormorant text-[28px] font-medium leading-none tabular-nums text-ink">{formatUsd(totals.estimate)}</span>
                </div>
              </>
            )}
          </section>

          <section className="grid gap-2.5 bg-haze p-[22px] text-[13px] leading-[1.55] text-ink-soft">
            <p className="m-0 flex gap-2.5">
              <LuClock className="mt-[2px] h-4 w-4 shrink-0 text-gilt" strokeWidth={1.4} />
              {isCancel ? 'Reviewed within 1–2 business days.' : `Returns accepted within ${eligibility.return_window_days} days of delivery.`}
            </p>
            {!isCancel && (
              <p className="m-0 flex gap-2.5">
                <LuShieldCheck className="mt-[2px] h-4 w-4 shrink-0 text-gilt" strokeWidth={1.4} />
                Every return is inspected by a certified jeweler.
              </p>
            )}
          </section>

          {/* Support contacts, each on its own tappable row. */}
          <section className="grid content-start gap-2 border border-line p-[22px]">
            <h3 className="m-0 mb-1 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-faint">Need help?</h3>
            <a
              href={`tel:${SUPPORT.phone.replace(/[^0-9+]/g, '')}`}
              className="flex items-center gap-3 border border-line px-3 py-2.5 text-[14px] text-ink transition-colors hover:border-ink hover:text-ink"
            >
              <LuPhone className="h-4 w-4 shrink-0 text-ink-soft" strokeWidth={1.4} />
              <span className="flex flex-col">
                <span className="text-[10.5px] uppercase tracking-[0.16em] text-ink-faint">Call us</span>
                {SUPPORT.phone}
              </span>
            </a>
            <a
              href={`mailto:${SUPPORT.email}`}
              className="flex items-center gap-3 border border-line px-3 py-2.5 text-[14px] text-ink transition-colors hover:border-ink hover:text-ink"
            >
              <LuMail className="h-4 w-4 shrink-0 text-ink-soft" strokeWidth={1.4} />
              <span className="flex min-w-0 flex-col">
                <span className="text-[10.5px] uppercase tracking-[0.16em] text-ink-faint">Email us</span>
                <span className="truncate">{SUPPORT.email}</span>
              </span>
            </a>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default OrderRequestWizard;
