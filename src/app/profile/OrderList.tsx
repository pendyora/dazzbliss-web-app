'use client';
import React, { useEffect } from 'react';

import dayjs from 'dayjs';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { LuArrowLeft, LuDownload, LuLoader } from 'react-icons/lu';

import { Box, PanelHead, boxLink } from '@/components/Account/AccountShell';
import { Money, OrderTracker, StatusPill, isCancelledStatus, orderDate } from '@/components/Account/orderBits';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchGetOrdeDetails, fetchOrderList } from '@/store/slices/Order/orderSlice';
import { formatCurrency } from '@/utils/common';

import { OPEN_REQUEST_STATUSES, REQUEST_TYPE_LABEL } from './OrderRequest/constants';
import OrderRequestPanel, { itemRequestLabels } from './OrderRequest/OrderRequestPanel';

const FALLBACK = '/images/no_images.svg';
const imgOf = (item: any) => item?.skuOrderItems?.carat_images?.[0] || FALLBACK;

/** "Return requested" etc. under the status while a customer request is still open. */
const openRequestLabel = (order: any) => {
  const open = order?.orderRequests?.find((r: any) => OPEN_REQUEST_STATUSES.includes(Number(r.status)));
  return open ? `${REQUEST_TYPE_LABEL[open.request_type]} in progress` : null;
};

/**
 * Delivery window worded exactly like the order invoice's "Expected Delivery": each item stores the
 * PDP's estimation_date, and the window runs from the earliest item's date to the slowest item's plus
 * the PDP's 2-day range, e.g. "October 12 - 14, 2026". Free gifts are left out, as on the invoice.
 */
const deliveryWindow = (items: any[]) => {
  const dates = items
    .filter((item: any) => !item?.is_free_gift)
    .map((item: any) => item?.estimation_date && dayjs(item.estimation_date))
    .filter((d: any) => d?.isValid())
    .sort((a: dayjs.Dayjs, b: dayjs.Dayjs) => a.valueOf() - b.valueOf());
  const from = dates[0];
  const to = dates[dates.length - 1]?.add(2, 'day');
  if (!from) {
    return null;
  }
  if (!from.isSame(to, 'year')) {
    return `${from.format('MMMM DD, YYYY')} - ${to.format('MMMM DD, YYYY')}`;
  }
  return from.isSame(to, 'month')
    ? `${from.format('MMMM DD')} - ${to.format('DD, YYYY')}`
    : `${from.format('MMMM DD')} - ${to.format('MMMM DD, YYYY')}`;
};

const STONE_TYPE: Record<string, string> = { N: 'Natural', L: 'Lab-grown', NG: 'Natural gemstone', LG: 'Lab-grown gemstone' };

/** Orders (design-mockups/account#orders): cards for every order; ?order=ID opens the detail view. */
export default function OrderList() {
  const searchParams = useSearchParams();
  const id = searchParams?.get('order');
  return id ? <OrderDetail id={id} /> : <Orders />;
}

function Orders() {
  const dispatch = useAppDispatch();
  const { orderList, loading } = useAppSelector((state) => state.order);
  const orders: any[] = orderList ?? [];

  // Refresh on every visit so status changes and cancel / return requests show up.
  useEffect(() => {
    dispatch(fetchOrderList());
  }, [dispatch]);

  return (
    <>
      <PanelHead title="Orders" sub="Track, view and get help with your orders." />
      {loading && orders.length === 0 ? (
        <div className="grid min-h-[30vh] place-items-center">
          <LuLoader className="h-7 w-7 animate-spin text-ink-soft" />
        </div>
      ) : orders.length === 0 ? (
        <div className="grid justify-items-start gap-3 border border-line p-7">
          <b className="font-cormorant text-[24px] font-medium">No orders yet</b>
          <p className="m-0 text-ink-soft">When you place an order, you&apos;ll be able to track it here.</p>
          <Link
            href="/all"
            className="mt-1 inline-flex h-12 items-center bg-ink px-7 text-[12px] font-semibold uppercase tracking-[0.14em] text-paper hover:text-paper"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="grid gap-3.5">
          {orders.map((o) => {
            const items: any[] = o?.orderDetails ?? [];
            const first = items[0];
            return (
              <article key={o.order_id} className="border border-line">
                <div className="grid grid-cols-[repeat(3,auto)_1fr] items-center gap-7 border-b border-line bg-haze px-5 py-3.5 text-[12.5px] text-ink-soft md:grid-cols-2 md:gap-x-4 md:gap-y-2.5">
                  <span>
                    Order<b className="block text-[14px] font-medium text-ink">{o.order_id}</b>
                  </span>
                  <span>
                    Placed<b className="block text-[14px] font-medium text-ink">{orderDate(o)}</b>
                  </span>
                  {o?.after_gst_amount != null && (
                    <span>
                      Total<b className="block text-[14px] font-medium tabular-nums text-ink">{formatCurrency(o.after_gst_amount)}</b>
                    </span>
                  )}
                  <Link
                    href={`/profile/purchases?order=${o.order_id}`}
                    className="justify-self-end border-b border-current text-[12px] font-semibold uppercase tracking-[0.12em] text-ink hover:text-ink md:col-span-2 md:justify-self-start"
                  >
                    View order
                  </Link>
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-5 px-5 py-[18px] md:grid-cols-1">
                  <div className="flex items-center gap-2.5">
                    {items.slice(0, 3).map((it, i) => (
                      <img key={i} src={imgOf(it)} alt="" loading="lazy" className="h-20 w-16 flex-none bg-stone object-contain mix-blend-multiply" />
                    ))}
                    <span className="ml-1.5 text-[13.5px] text-ink-soft">
                      {first?.jewelryOrderItems?.fullTitle}
                      {items.length > 1 ? ` + ${items.length - 1} more` : ''}
                    </span>
                  </div>
                  <div className="grid justify-items-end gap-1 md:justify-items-start">
                    <StatusPill status={Number(o.order_status ?? 0)} />
                    {openRequestLabel(o) && <span className="text-[12px] text-ink-soft">{openRequestLabel(o)}</span>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

function Spec({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-ink-faint">{label}</dt>
      <dd className="m-0 text-ink">{children}</dd>
    </>
  );
}

function OrderDetail({ id }: { id: string }) {
  const dispatch = useAppDispatch();
  const { orderDetails, loading } = useAppSelector((state) => state.order);
  const { data: master } = useAppSelector((state) => state.master);
  const nameOf = (mid: any) => master?.find((m: any) => m.id == mid)?.name;

  useEffect(() => {
    dispatch(fetchGetOrdeDetails(id));
  }, [dispatch, id]);

  const o: any = orderDetails?.order_id == id ? orderDetails : null;

  if (!o) {
    return (
      <div className="grid min-h-[30vh] place-items-center">
        {loading ? <LuLoader className="h-7 w-7 animate-spin text-ink-soft" /> : <p className="text-ink-soft">We couldn&apos;t find this order.</p>}
      </div>
    );
  }

  const items: any[] = o.orderDetails ?? [];
  const status = Number(o.order_status ?? 0);
  const cancelled = isCancelledStatus(status);

  // Cancel / return info comes with the order detail; empty for non-website orders.
  const eligibility = o?.request_eligibility ?? null;
  const requests: any[] = o?.order_requests ?? [];
  const refreshOrder = () => {
    dispatch(fetchGetOrdeDetails(o.order_id));
    dispatch(fetchOrderList());
  };

  // `total_coupon_price` / `total_discount_price` hold the order total *after* the discount, not the
  // discount itself, so the coupon saving is the difference from the total before the code was applied.
  const coupon = o?.couponDetails;
  const preCouponTotal = Number(o?.total_discount_price ?? o?.total_price ?? 0);
  const couponSaving = o?.total_coupon_price ? Math.max(0, preCouponTotal - Number(o.total_coupon_price)) : 0;
  // discount_type: 1 = fixed amount, 2 = percentage. A fixed `discount_value` is stored in USD and not
  // converted on read, so only a percentage rule is shown - the saving row is already converted.
  const couponRule = coupon && Number(coupon?.discount_type) === 2 ? `${coupon?.discount_value}% off` : null;
  const refunded = Number(o?.total_refunded_amount ?? 0);
  const deliveryDate = deliveryWindow(items);

  return (
    <>
      <Link href="/profile/purchases" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-ink-soft hover:text-ink">
        <LuArrowLeft className="h-4 w-4" strokeWidth={1.3} />
        All orders
      </Link>
      <PanelHead
        title={`Order ${o.order_id}`}
        sub={`Placed ${orderDate(o, 'D MMMM YYYY')} · ${items.length} ${items.length === 1 ? 'piece' : 'pieces'}`}
        action={<StatusPill status={status} />}
      />
      {openRequestLabel(o) && <p className="m-0 -mt-3 mb-4 text-[13px] text-ink-soft">{openRequestLabel(o)}</p>}
      <OrderTracker status={status} placedAt={o.createdAt} />

      {/* Status 5 (cancelled) and 6 (rejected) both read as "Cancelled" to the buyer. The reason is shown
          only for a real cancellation: a rejection reason is for the operations team and is not sent here. */}
      {cancelled && (
        <div className="grid gap-1 border border-line bg-haze p-[18px] text-[14px]">
          <b className="font-semibold text-danger">This order was cancelled</b>
          {(o?.cancelled_at || o?.rejected_at) && (
            <span className="text-ink-soft">Cancelled on {dayjs(o.cancelled_at || o.rejected_at).format('D MMM YYYY')}</span>
          )}
          {o?.cancellation_reason_text && <span className="text-ink-soft">Reason: {o.cancellation_reason_text}</span>}
          <span className="text-ink-soft">
            {refunded > 0
              ? `We have refunded ${formatCurrency(refunded)} to your original payment method. It can take 5–10 business days to appear on your statement.`
              : 'You have not been charged for this order.'}
          </span>
        </div>
      )}

      {/* Customer cancel / return: entry point and request tracking. */}
      <div className="mt-6">
        <OrderRequestPanel orderNumber={o.order_id} eligibility={eligibility} requests={requests} onChanged={refreshOrder} />
      </div>

      <div className="mt-6 grid grid-cols-[minmax(0,1.3fr)_minmax(260px,0.7fr)] gap-6 lg:grid-cols-1">
        <ul className="m-0 list-none border-t border-line p-0">
          {items.map((item, i) => {
            const sku = item?.skuOrderItems ?? {};
            const isRing = ['WEDDING_BANDS', 'ENGAGEMENT_RINGS'].includes(item?.jewelryOrderItems?.jewelrySubType?.parent_code);
            const engraving = item?.engravingText?.Text?.trim();
            const stones = [
              ['Centre stone', sku.centerDiamondDetails, null],
              ['Accent stones', sku.accentDiamondDetails, sku.accent_diamond_count],
              ['Second accent', sku.secondAccentDiamondId, sku.second_accent_diamond_count],
            ].filter(([, d]) => d) as [string, any, any][];
            return (
              <li key={i} className="grid grid-cols-[88px_minmax(0,1fr)_auto] gap-4 border-b border-line py-5 md:grid-cols-[72px_minmax(0,1fr)]">
                <img src={imgOf(item)} alt="" className="h-[110px] w-[88px] bg-stone object-contain mix-blend-multiply md:h-[90px] md:w-[72px]" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    {item?.is_free_gift && (
                      <span className="bg-navy px-2 py-[2px] text-[9.5px] font-semibold uppercase tracking-[0.14em] text-noir-on">Free gift</span>
                    )}
                    <b className="block text-[15px] font-medium">{item?.jewelryOrderItems?.fullTitle}</b>
                    {itemRequestLabels(item, requests).map((label) => (
                      <span key={label} className="border border-line-strong px-2 py-[1px] text-[10.5px] uppercase tracking-[0.12em] text-ink-soft">
                        {label}
                      </span>
                    ))}
                  </div>
                  <dl className="m-0 mt-2 grid grid-cols-[auto_1fr] gap-x-5 gap-y-1 text-[13px]">
                    <Spec label="Metal">{[nameOf(sku.metal_type_id), nameOf(sku.metal_color_id)].filter(Boolean).join(' ') || '—'}</Spec>
                    {nameOf(sku.carat_id) && <Spec label="Carat weight">{nameOf(sku.carat_id)} ct</Spec>}
                    {isRing && <Spec label="Ring size">{item?.ring_size || '—'}</Spec>}
                    {sku.bracelet_length_ids && <Spec label="Length">{nameOf(sku.bracelet_length_ids)} in</Spec>}
                    {sku.band_width_ids && <Spec label="Band width">{nameOf(sku.band_width_ids)} mm</Spec>}
                    <Spec label="Quantity">{item?.count ?? 1}</Spec>
                    {(item?.ashclair_sku || sku.sku_code) && (
                      <Spec label="SKU">
                        <span className="break-all">{item?.ashclair_sku || sku.sku_code}</span>
                      </Spec>
                    )}
                    {engraving && (
                      <Spec label="Engraving">
                        <span style={{ fontFamily: item?.engravingText?.fontFamily }}>“{engraving}”</span>
                        {item?.engraving_price ? <span className="text-ink-faint"> · {formatCurrency(item.engraving_price)}</span> : null}
                      </Spec>
                    )}
                    {item?.is_warranty && (
                      <Spec label="Warranty">
                        {item?.warranty_year} year{item?.warranty_year > 1 ? 's' : ''} · {formatCurrency(item?.warranty_amount)}
                      </Spec>
                    )}
                    {item?.is_appraisal && (
                      <Spec label="Appraisal">
                        {formatCurrency(item?.appraisal_amount)}
                        {item?.appraisalDetails?.appraisal_link && (
                          <>
                            {' · '}
                            <a href={item.appraisalDetails.appraisal_link} target="_blank" rel="noreferrer" className={boxLink}>
                              Download
                            </a>
                          </>
                        )}
                      </Spec>
                    )}
                  </dl>

                  {item?.diamondDetails && (
                    <div className="mt-3.5 grid grid-cols-[56px_1fr] gap-3 bg-haze p-3">
                      <img src={item.diamondDetails.imageFile || FALLBACK} alt="" className="h-14 w-14 bg-paper object-contain" />
                      <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-[12.5px]">
                        <Spec label="Diamond">
                          {[
                            item.diamondDetails.carats && `${item.diamondDetails.carats} ct`,
                            item.diamondDetails.shape_name,
                            item.diamondDetails.diamond_type == 2 ? 'Lab-grown' : 'Natural',
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </Spec>
                        <Spec label="Colour · Lab">{[item.diamondDetails.col, item.diamondDetails.lab].filter(Boolean).join(' · ') || '—'}</Spec>
                        <Spec label="Stone no.">{item.diamondDetails.stock_no || '—'}</Spec>
                        {item.diamondDetails.report_no && (
                          <Spec label="Certificate">
                            {item.diamondDetails.certificateFile ? (
                              <a href={item.diamondDetails.certificateFile} target="_blank" rel="noreferrer" className={boxLink}>
                                {item.diamondDetails.report_no}
                              </a>
                            ) : (
                              item.diamondDetails.report_no
                            )}
                          </Spec>
                        )}
                        {item?.diamond_amount ? <Spec label="Diamond price">{formatCurrency(item.diamond_amount)}</Spec> : null}
                      </dl>
                    </div>
                  )}

                  {stones.length > 0 && (
                    <div className="mt-3.5 grid grid-cols-3 gap-2 md:grid-cols-1">
                      {stones.map(([label, d, count]) => (
                        <dl key={label} className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 bg-haze p-3 text-[12.5px]">
                          <dt className="col-span-2 mb-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">{label}</dt>
                          <Spec label="Shape">{nameOf(d?.name) || '—'}</Spec>
                          <Spec label="Type">{STONE_TYPE[d?.diamond_type] ?? 'Lab-grown gemstone'}</Spec>
                          <Spec label="Size">{d?.size || '—'}</Spec>
                          <Spec label="Colour">{nameOf(d?.color) || '—'}</Spec>
                          {count ? <Spec label="Count">{count}</Spec> : null}
                        </dl>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-right text-[14px] md:col-start-2 md:text-left">
                  <Money item={item} />
                </span>
              </li>
            );
          })}
        </ul>

        <div className="grid content-start gap-3.5">
          <Box title="Payment">
            <dl className="m-0 grid gap-2 text-[14px]">
              {/* Which code the buyer used, shown whenever a coupon is attached, even if the saving is nothing. */}
              {coupon?.coupon_code && (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-soft">Discount code</dt>
                  <dd className="m-0 text-right">
                    <span className="bg-haze px-2 py-0.5 text-[12.5px] font-semibold uppercase tracking-[0.08em]">{coupon.coupon_code}</span>
                    {couponRule && <span className="ml-2 text-[12.5px] text-ink-soft">({couponRule})</span>}
                  </dd>
                </div>
              )}
              {couponSaving > 0 && (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-soft">Discount applied</dt>
                  <dd className="m-0 tabular-nums text-ok">− {formatCurrency(couponSaving)}</dd>
                </div>
              )}
              {o?.after_gst_amount != null && (
                <div className="flex justify-between border-t border-line pt-2.5 font-semibold">
                  <dt>Paid</dt>
                  <dd className="m-0 tabular-nums">{formatCurrency(o.after_gst_amount)}</dd>
                </div>
              )}
              {/* A refund can also be issued against an order that is still open. */}
              {refunded > 0 && (
                <>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-soft">Refunded</dt>
                    <dd className="m-0 tabular-nums">{formatCurrency(refunded)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-soft">Refunded to</dt>
                    <dd className="m-0">Original payment method</dd>
                  </div>
                </>
              )}
            </dl>
          </Box>
          {((!cancelled && deliveryDate) || o?.shipped_date || o?.delivered_date || o?.courier_name?.trim() || o?.track_id) && (
            <Box title="Delivery">
              <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-5 gap-y-1.5 text-[13.5px]">
                {/* The delivery window is hidden only for cancelled orders, which will not be delivered. */}
                {!cancelled && deliveryDate && <Spec label="Expected">{deliveryDate}</Spec>}
                {o?.shipped_date && <Spec label="Shipped on">{dayjs(o.shipped_date).format('D MMM YYYY')}</Spec>}
                {o?.delivered_date && <Spec label="Delivered on">{dayjs(o.delivered_date).format('D MMM YYYY')}</Spec>}
                {o?.courier_name?.trim() && <Spec label="Courier">{o.courier_name}</Spec>}
                {o?.track_id && (
                  <Spec label="Tracking ID">
                    {o?.tracking_url ? (
                      <a href={o.tracking_url} target="_blank" rel="noreferrer" className={`${boxLink} break-all`}>
                        {o.track_id}
                      </a>
                    ) : (
                      <span className="break-all">{o.track_id}</span>
                    )}
                  </Spec>
                )}
              </dl>
            </Box>
          )}
          <Box title="Need help?">
            <p className="m-0 text-[13.5px] text-ink-soft">Questions about delivery, sizing or a return? Mention order {o.order_id}.</p>
            <Link
              href="/contactpage"
              className="inline-flex h-12 items-center justify-center bg-ink text-[12px] font-semibold uppercase tracking-[0.14em] text-paper hover:text-paper"
            >
              Contact client care
            </Link>
            {items.some((it) => it?.appraisalDetails?.appraisal_link) && (
              <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-faint">
                <LuDownload className="h-3.5 w-3.5" /> Appraisal documents are linked on each piece.
              </span>
            )}
          </Box>
        </div>
      </div>
    </>
  );
}
