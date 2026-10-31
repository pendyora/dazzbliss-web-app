/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { Suspense, useEffect, useMemo, useRef } from 'react';

import dayjs from 'dayjs';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LuCheck, LuLoader } from 'react-icons/lu';

import ProductName from '@/components/CartProductDetails/ProductName';
import useCookieConsent from '@/hook/useCookieConsent';
import * as ga4 from '@/lib/analytics';
import * as klaviyo from '@/lib/klaviyo';
import { hasConsent } from '@/services/cookieConsent';
import { apiMetaOrderAttribution } from '@/services/orderService';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchCities, fetchCountries, fetchStates } from '@/store/slices/Address/addressSlice';
import { fetchGetOrdeDetails, setGuestUserOrderDetails } from '@/store/slices/Order/orderSlice';
import { formatCurrency } from '@/utils/common';
import { trackPurchase } from '@/utils/metaPixel';

import { Heading } from '../../components/Heading';
import { Img } from '../../components/Img';
import JewelryDetails from '../../components/JewelryDetails';
import { Text } from '../../components/Text';

// Google Pay returns the card network uppercase (e.g. "VISA"); show it the way buyers know the brand.
const CARD_NETWORK_NAMES: Record<string, string> = {
  AMEX: 'American Express',
  DISCOVER: 'Discover',
  JCB: 'JCB',
  MASTERCARD: 'Mastercard',
  VISA: 'Visa',
};

// "Google Pay (Visa •••• 1234)", or "Google Pay" when the card details were not recorded.
const googlePayLabel = (network?: string | null, last4?: string | null) => {
  const card = [network ? CARD_NETWORK_NAMES[network.toUpperCase()] || network : '', last4 ? `•••• ${last4}` : ''].filter(Boolean).join(' ');
  return card ? `Google Pay (${card})` : 'Google Pay';
};

export default function ThankYouSection() {
  const { orderDetails, loading, status, guestUserOrderDetails } = useAppSelector((state) => state.order);
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth.auth);
  const { countries, states, cities } = useAppSelector((state) => state.address);
  const searchParams = useSearchParams();
  const id = searchParams.get('order_id');
  const router = useRouter();
  // The AMP purchase tag below is a Google Ads conversion — a marketing tag, so it
  // follows the effective marketing tracking switch (always on while consent is not enforced).
  const { trackingPreferences } = useCookieConsent();

  const orderIdMatches = Boolean(
    id &&
    orderDetails &&
    (orderDetails.order_id === id ||
      orderDetails.orderId === id ||
      String(orderDetails.order_id) === String(id) ||
      String(orderDetails.orderId) === String(id)),
  );
  const verifiedUser =
    Boolean(guestUserOrderDetails) ||
    (Boolean(user) && orderIdMatches && orderDetails?.user_id == user?.id) ||
    (Boolean(!user) && orderIdMatches && status === 'fulfilled');

  useEffect(() => {
    if (!id) {
      return router.push(`/`);
    }
  }, [id]);

  useEffect(() => {
    if (!id) {
      return;
    }

    if (user) {
      dispatch(fetchGetOrdeDetails(id));
      return;
    }
    try {
      const raw = sessionStorage.getItem(`majesca_guest_order_${id}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        dispatch(setGuestUserOrderDetails(parsed));
        return;
      }
    } catch {
      /* ignore */
    }
    dispatch(fetchGetOrdeDetails(id));
  }, [id, user, dispatch]);

  useEffect(() => {
    if (orderDetails?.billingAddressDetails?.country_id) {
      dispatch(fetchCountries()).then(() => dispatch(fetchStates(orderDetails?.billingAddressDetails?.country_id)));
    }
    if (orderDetails?.billingAddressDetails?.state_id) {
      dispatch(fetchCities(orderDetails?.billingAddressDetails?.state_id));
    }
  }, [orderDetails]);
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_NODE_ENV === 'production' && orderDetails?.order_id) {
      // DAZZBLISS TODO: Google Ads conversion label is the old client's; off until NEXT_PUBLIC_GOOGLE_ADS_ID is set.
      if (process.env.NEXT_PUBLIC_GOOGLE_ADS_ID) {
        (window as any).gtag?.('event', 'conversion', {
          send_to: 'AW-17230998076/MKZ6CIbEuoAcELzUsJhA',
          value: orderDetails?.after_gst_amount ?? 0,
          currency: orderDetails?.currency_code ?? 'USD',
          transaction_id: orderDetails?.order_id ?? '',
        });
      }
      const contentIds =
        orderDetails?.orderDetails
          ?.map((item: any) => String(item?.skuOrderItems?.id ?? item?.jewelryOrderItems?.id ?? item?.jewelry_id))
          .filter(Boolean) ?? [];
      const numItems = orderDetails?.orderDetails?.reduce((s: number, item: any) => s + (item?.count ?? 1), 0) ?? 0;
      trackPurchase({
        value: orderDetails?.after_gst_amount ?? 0,
        currency: orderDetails?.currency_code ?? 'USD',
        order_id: orderDetails?.order_id ?? '',
        content_ids: contentIds.length ? contentIds : undefined,
        num_items: numItems,
      });
    }
  }, [orderDetails]);

  // Meta Shops attribution: if this order originated from a Meta Shops checkout link, the
  // fbclid / cart_origin were stashed on /meta-checkout. Tell the backend to tag the order
  // (order_source = META) and — only with marketing consent — fire the server-side Conversions
  // API Purchase (deduped with the browser Pixel above via event_id = order_id).
  //
  // Tagging always runs for a Meta order: it just labels our own order row (first-party) and
  // sends nothing to Meta. Only the Conversions API is a marketing signal, so `capi_consent`
  // tells the backend whether it may fire it. Runs once, then clears the stashed values so a
  // later non-Meta order in the same session is never mis-attributed.
  const metaAttributedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!id || metaAttributedRef.current === id) {
      return;
    }
    let fbclid = '';
    let cartOrigin = '';
    let lineSkus: string[] = [];
    try {
      fbclid = sessionStorage.getItem('majesca_meta_fbclid') || '';
      cartOrigin = sessionStorage.getItem('majesca_meta_cart_origin') || '';
      // The lines the Meta link itself put in the cart — anything added on our own site
      // afterwards is absent, so admin can label each line by where it actually came from.
      const storedSkus = JSON.parse(sessionStorage.getItem('majesca_meta_line_skus') || '[]');
      lineSkus = Array.isArray(storedSkus) ? storedSkus.filter((sku: unknown) => typeof sku === 'string') : [];
    } catch {
      /* ignore */
    }
    // Not a Meta-originated order → nothing to attribute.
    if (!fbclid && !cartOrigin) {
      return;
    }
    metaAttributedRef.current = id;
    apiMetaOrderAttribution({
      order_id: String(id),
      fbclid: fbclid || undefined,
      cart_origin: cartOrigin || undefined,
      capi_consent: hasConsent('marketing'),
      line_skus: lineSkus.length > 0 ? lineSkus : undefined,
    })
      .catch(() => {
        /* non-fatal: attribution is best-effort */
      })
      .finally(() => {
        try {
          sessionStorage.removeItem('majesca_meta_fbclid');
          sessionStorage.removeItem('majesca_meta_cart_origin');
          sessionStorage.removeItem('majesca_meta_line_skus');
        } catch {
          /* ignore */
        }
      });
  }, [id]);

  // GA4 purchase — controlled by the GA Measurement ID; deduped per transaction.
  const ga4PurchaseTracked = useRef<string | null>(null);
  useEffect(() => {
    const transactionId = orderDetails?.order_id ?? orderDetails?.orderId;
    if (!transactionId || ga4PurchaseTracked.current === String(transactionId)) {
      return;
    }
    ga4PurchaseTracked.current = String(transactionId);
    const { items, itemsValue } = ga4.mapOrderItemsToGA4(orderDetails);
    ga4.purchase({
      transaction_id: String(transactionId),
      value: Number(orderDetails?.after_gst_amount ?? itemsValue ?? 0),
      currency: orderDetails?.currency_code ?? ga4.DEFAULT_CURRENCY,
      items,
      ...(orderDetails?.total_coupon_price ? { coupon: orderDetails?.coupon_code } : {}),
    });
  }, [orderDetails]);

  // Klaviyo Placed Order — triggers the Thank You flow, and is what stops an Abandoned Cart or
  // Browse Abandonment email once the shopper has actually bought. Deduped on the order id by
  // Klaviyo itself ($event_id), with a local ref so a re-render never re-pushes.
  const klaviyoOrderTracked = useRef<string | null>(null);
  useEffect(() => {
    const orderId = orderDetails?.order_id ?? orderDetails?.orderId;
    const lines = Array.isArray(orderDetails?.orderDetails) ? orderDetails.orderDetails : [];
    if (!orderId || lines.length === 0 || klaviyoOrderTracked.current === String(orderId)) {
      return;
    }
    klaviyoOrderTracked.current = String(orderId);

    // The buyer's email is the whole point here — a guest checkout has it on the order even
    // when there is no logged-in user, so fall back to that rather than skipping identify.
    const email = user?.email ?? orderDetails?.userDetails?.email ?? orderDetails?.billingAddressDetails?.email;
    if (email) {
      klaviyo.identify({
        email,
        firstName: user?.first_name ?? orderDetails?.billingAddressDetails?.first_name,
        lastName: user?.last_name ?? orderDetails?.billingAddressDetails?.last_name,
      });
    }

    klaviyo.trackPlacedOrder({
      orderId: String(orderId),
      value: Number(orderDetails?.after_gst_amount ?? 0),
      couponCode: orderDetails?.total_coupon_price ? orderDetails?.coupon_code : undefined,
      discountValue: Number(orderDetails?.total_coupon_price ?? orderDetails?.total_discount_price ?? 0) || undefined,
      items: lines.map((item: any) => {
        const unit = Number(
          item?.jewelry_discount_price ?? item?.jewelry_coupon_price ?? item?.jewelry_price ?? item?.skuOrderItems?.selling_price ?? 0,
        );
        const jewelryTypeName = item?.jewelryOrderItems?.jewelrySubType?.group;
        return {
          productId: String(item?.skuOrderItems?.id ?? item?.jewelryOrderItems?.id ?? item?.jewelry_id ?? ''),
          productName: item?.jewelryOrderItems?.title ?? '',
          sku: item?.skuOrderItems?.sku_code,
          quantity: Number(item?.count ?? 1) || 1,
          price: unit,
          categories: jewelryTypeName ? [jewelryTypeName] : [],
          imageUrl: item?.skuOrderItems?.carat_images?.[0],
          brand: 'Ashclair',
        };
      }),
    });
  }, [orderDetails, user]);
  const { pricesByCategories, overallCategoriesPrice, groupPriceNew, discountedTotalPrice } = useMemo(() => {
    let overallCategoriesPrice = 0;
    let discountedTotalPrice = 0;

    // Group and calculate total prices by categories considering the quantity
    const groupedPrices = orderDetails?.orderDetails?.reduce((acc: any, item: any) => {
      // A free gift contributes nothing to any total. Skipping it here matters: the price
      // fallback below reads `skuOrderItems.selling_price`, which is the gift's real catalogue
      // price, and would otherwise charge the shopper for it on the confirmation page.
      if (item?.is_free_gift) {
        return acc;
      }
      const type = item?.jewelryOrderItems?.jewelrySubType?.group;
      const diamondData = item?.diamondDetails
        ? {
            name: item?.diamondDetails?.fullTitle,
            price: item?.diamondDetails?.price,
          }
        : null;
      const price = item?.jewelry_coupon_price
        ? item?.jewelry_discount_price
          ? item?.jewelry_discount_price
          : item?.jewelry_price
        : item?.skuOrderItems?.selling_price;
      const discounted_price = item?.jewelry_coupon_price
        ? item?.jewelry_coupon_price
        : item?.jewelry_discount_price
          ? item?.jewelry_discount_price
          : item?.jewelry_price;
      const count = item?.count || 1; // Default to 1 if count is not specified

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
    const groupPriceNew = orderDetails?.orderDetails?.map((item: any) => {
      // const appraisalPrice = item?.is_appraisal ? item?.appraisal_amount : 0;
      // const warrantyPrice = item?.selectedYearValue?.price ? item?.selectedYearValue?.price : item?.warranty_amount;
      const ringPrice = item?.ring_size_rate ?? null;
      const diamondData = item?.ordered_diamond_details
        ? {
            name: item?.ordered_diamond_details?.fullTitle,
            price: ringPrice ? item?.ordered_diamond_details?.price + ringPrice : item?.ordered_diamond_details?.price,
          }
        : null;
      // Always show the original jewelry price on the product line. Coupon savings are surfaced
      // separately in the "Applied Promocode" and "Total Price" rows, so we deliberately do NOT
      // strike the product price with the coupon price here. Only a product-level flat/percentage
      // discount (jewelry_discount_price) is shown in the strikethrough style.
      const new_price = item?.is_free_gift ? 0 : item?.jewelry_price;
      const new_discounted_price =
        !item?.is_free_gift && item?.jewelry_discount_price && item?.jewelry_discount_price != 0 ? item?.jewelry_discount_price : null;
      // + appraisalPrice + warrantyPrice + (item.engravingText != '' ? item?.engraving_price : 0)
      // + appraisalPrice + warrantyPrice
      // + appraisalPrice + warrantyPrice + (item.engravingText != '' ? item?.engraving_price : 0)
      // + appraisalPrice + warrantyPrice + (item.engravingText != '' ? item?.engraving_price : 0)
      return {
        ...item,
        name: item?.jewelryOrderItems?.title ?? item?.title,
        // A gift never carries the ring-size upcharge either.
        price: ringPrice && !item?.is_free_gift ? new_price + ringPrice : new_price,
        // What the gift would have cost, for the struck-through "was" value. The order row
        // itself is $0 — this is read from the SKU purely so the confirmation shows the
        // reward's worth, matching the cart and checkout.
        gift_retail_price: item?.is_free_gift ? (item?.skuOrderItems?.selling_price ?? null) : null,
        discounted_price: new_discounted_price ? (ringPrice ? new_discounted_price + ringPrice : new_discounted_price) : null,
        count: item?.count || 1,
        diamondData: diamondData,
      };
    });

    const pricesByCategories = Object?.entries(groupedPrices ? groupedPrices : []).map(([name, price]) => ({ name, price }));

    return {
      pricesByCategories,
      overallCategoriesPrice,
      groupPriceNew,
      discountedTotalPrice,
    };
  }, [orderDetails]);

  // "Arrives" window. Each order item stores estimation_date — the same PDP delivery-start date the
  // customer saw on the product page (ship date + 4 business days). Show that same window here so the
  // Thank You page matches the PDP instead of the old wide [today+days, today+15+days] heuristic that
  // was baked into start/end_shipping_date. Span the slowest item and mirror the PDP's +2 day range.
  const arrivesWindow = useMemo(() => {
    const estimationDates = (orderDetails?.orderDetails ?? [])
      .map((item: any) => item?.estimation_date)
      .filter(Boolean)
      .map((d: string) => dayjs(d))
      .filter((d: dayjs.Dayjs) => d.isValid());

    if (estimationDates.length === 0) {
      // Legacy orders created before per-item estimation_date existed — fall back to stored dates.
      const start = orderDetails?.start_shipping_date ? dayjs(orderDetails.start_shipping_date) : null;
      const end = orderDetails?.end_shipping_date ? dayjs(orderDetails.end_shipping_date) : null;
      return start?.isValid() && end?.isValid() ? { start, end } : null;
    }

    const earliest = estimationDates.reduce((a: dayjs.Dayjs, b: dayjs.Dayjs) => (b.isBefore(a) ? b : a));
    const latest = estimationDates.reduce((a: dayjs.Dayjs, b: dayjs.Dayjs) => (b.isAfter(a) ? b : a));
    return { start: earliest, end: latest.add(2, 'day') };
  }, [orderDetails]);
  useEffect(() => {
    const handleBackNavigation = () => {
      router.push('/all');
    };

    window.addEventListener('popstate', handleBackNavigation);

    return () => {
      window.removeEventListener('popstate', handleBackNavigation);
    };
  }, [router]);

  return (
    <>
      {/* thank you section */}

      {verifiedUser && status == 'fulfilled' ? (
        <div className="mb-5 flex flex-col items-center bg-paper font-libre text-ink">
          {/* DAZZBLISS TODO: AMP Google Ads tag uses the old client's IDs; off until NEXT_PUBLIC_GOOGLE_ADS_ID is set. */}
          {orderDetails?.order_id &&
            process.env.NEXT_PUBLIC_NODE_ENV === 'production' &&
            process.env.NEXT_PUBLIC_GOOGLE_ADS_ID &&
            trackingPreferences.marketing && (
              <div
                dangerouslySetInnerHTML={{
                  __html: `
              <amp-analytics type="gtag" data-credentials="include">
                <script type="application/json">
                  {
                    "vars": {
                      "gtag_id": "AW-172306",
                      "config": {
                        "AW-17230998076": {
                          "groups": "default"
                        }
                      }
                    },

                    { "on": "visible", "vars": { "event_name": "conversion", "value": 1.0, "currency": "USD", "transaction_id": "", "send_to": ["AW-17230998076/8ggHCNmxs-IaELzUsJhA"] }
                    "triggers": {
                      "trackPageview":{
                        "on":"visible",
                        "request":"pageview"
                        "vars":{
                          "event_name":"conversion",
                          "value":"${orderDetails?.after_gst_amount}",
                          "currency":"${orderDetails?.currency_code} USD",
                          "transaction_id":"${orderDetails?.order_id}",
                          "send_to":["AW-17230998076/8ggHCNmxs-IaELzUsJhA"]
                        }
                      }
                    }
                  }
                </script>
              </amp-analytics>`,
                }}
              />
            )}

          <div className="mx-auto flex w-full max-w-[1600px] 2xl:px-[160px] xl:px-28 lg:px-20 flex-col gap-10 sm:gap-4 sm:px-3 md:px-5">
            <div className="mx-auto grid w-full max-w-[760px] gap-7 pt-6">
              <div className="grid justify-items-center gap-3 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-full border border-gilt text-gilt">
                  <LuCheck className="h-6 w-6" aria-hidden />
                </span>
                {orderDetails?.order_id && (
                  <span className="text-[11px] uppercase tracking-[0.18em] text-ink-soft tabular-nums">Order {orderDetails.order_id}</span>
                )}
                <h1 className="m-0 font-cormorant text-[clamp(44px,5.6vw,80px)] font-normal leading-[0.92] text-ink">
                  Thank you
                  {orderDetails?.billingAddressDetails?.first_name ? (
                    <>
                      , <em className="italic capitalize text-gilt">{orderDetails.billingAddressDetails.first_name}</em>
                    </>
                  ) : null}
                </h1>
                <p className="m-0 max-w-[52ch] text-ink-soft">
                  {orderDetails?.orderUserDetails?.email
                    ? `A confirmation is on its way to ${orderDetails.orderUserDetails.email}. We will email tracking details as soon as your order ships.`
                    : 'Your order has been received. We will email tracking details as soon as your order ships.'}
                </p>
                {/* Post-purchase confirmation for Google Pay, in the layout Google's brand guidelines show.
                    "Google Pay" stays in the site's own font and case, with no ™, as the guidelines require. */}
                {orderDetails?.payment_method === 5 && (
                  <div className="grid justify-items-center gap-1 text-center text-[14px] text-ink">
                    <p className="m-0">
                      Your order was successfully processed using{' '}
                      <span className="font-medium">
                        {googlePayLabel(orderDetails?.google_pay_card_network, orderDetails?.google_pay_card_last4)}
                      </span>
                      .
                    </p>
                    <p className="m-0 text-ink-soft">Check your email for your receipt.</p>
                  </div>
                )}
              </div>
              <ol className="m-0 grid list-none grid-cols-3 border border-line p-0 sm:grid-cols-1">
                {[
                  {
                    label: 'Order placed',
                    text:
                      orderDetails?.created_at || orderDetails?.createdAt
                        ? dayjs(orderDetails?.created_at || orderDetails?.createdAt).format('ddd D MMM')
                        : 'Today',
                    state: 'done',
                  },
                  { label: 'Being prepared', text: 'Checked, cleaned and packed by our atelier.', state: 'now' },
                  {
                    label: 'Arrives',
                    text: arrivesWindow ? `${arrivesWindow.start.format('ddd D MMM')} – ${arrivesWindow.end.format('ddd D MMM')}` : '—',
                    state: '',
                  },
                ].map((step) => (
                  <li
                    key={step.label}
                    className={`relative grid content-start gap-1.5 border-r border-line px-4 py-[18px] text-[12.5px] text-ink-soft last:border-r-0 sm:border-b sm:border-r-0 sm:last:border-b-0 ${
                      step.state === 'now' ? 'bg-stone/45' : ''
                    } before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:content-[''] ${
                      step.state === 'done'
                        ? 'before:bg-gilt'
                        : step.state === 'now'
                          ? 'before:bg-gradient-to-r before:from-gilt before:from-50% before:to-line before:to-50%'
                          : ''
                    }`}
                  >
                    <b
                      className={`text-[10.5px] font-semibold uppercase tracking-[0.16em] ${step.state === 'done' ? 'text-gilt' : step.state === 'now' ? 'text-ink' : ''}`}
                    >
                      {step.label}
                    </b>
                    <span>{step.text}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="flex items-start gap-8 sm:flex-col ">
              <div className="flex flex-1 sm:flex-none flex-col items-start gap-10 md:gap-[10px] sm:w-full">
                <h2 className="m-0 font-cormorant text-[28px] font-normal leading-none text-ink">Your pieces</h2>

                <div className="flex flex-col gap-[22px] self-stretch">
                  <Suspense fallback={<div>Loading feed...</div>}>
                    {orderDetails?.orderDetails?.length > 0
                      ? orderDetails?.orderDetails?.map((d: any, index: number) => (
                          <JewelryDetails productDetails={d} {...d} key={'cartList' + index} />
                        ))
                      : null}
                  </Suspense>
                </div>
              </div>
              <div className="flex w-[38%] lg:w-[47%] md:w-[50%] flex-col gap-6 self-center sm:w-full">
                <div className="flex flex-col items-center gap-[38px] md:gap-[10px] border border-line bg-paper p-[30px] lg:p-5 md:p-4 sm:p-4 sm:px-3">
                  <h2 className="m-0 self-start font-cormorant text-[28px] font-normal leading-none text-ink">Order summary</h2>
                  <div className="flex flex-col gap-[34px] self-stretch sm:gap-4">
                    <div className="flex flex-col md:gap-[16px] gap-5 sm:gap-3">
                      {groupPriceNew?.map((category: any, index: number) => (
                        <div
                          key={`price_${index}`}
                          className={`flex flex-col gap-1 border-b border-line last:border-0 pb-2 sm:pb-2 ${category?.diamondData ? '' : ''}`}
                        >
                          <div className="grid grid-cols-3 md:grid md:grid-cols-3 justify-between gap-5 md:gap-2 sm:gap-3">
                            <div className="col-span-2 flex items-center gap-2">
                              <ProductName productName={category?.name} count={category?.count} />
                              {category?.is_free_gift && (
                                <span className="shrink-0 border border-gilt px-1.5 py-[1px] text-[9.5px] uppercase tracking-[0.16em] text-gilt">
                                  Free Gift
                                </span>
                              )}
                            </div>
                            <div className="flex h-fit md:gap-1 col-span-1 items-baseline gap-2 justify-end">
                              {category?.is_free_gift ? (
                                <>
                                  {Number(category?.gift_retail_price) > 0 && (
                                    <Text
                                      as="p"
                                      size="textlg"
                                      className="!font-cormorant font-normal tracking-[0.20px] !text-gray-400 line-through !text-[12px] text-nowrap"
                                    >
                                      {formatCurrency(Math.ceil(Number(category.gift_retail_price)))}
                                    </Text>
                                  )}
                                  <Text
                                    as="p"
                                    size="textlg"
                                    className="!text-[11px] font-semibold uppercase tracking-[0.16em] !text-gilt text-nowrap"
                                  >
                                    Free
                                  </Text>
                                </>
                              ) : (
                                <Text
                                  as="p"
                                  size="textlg"
                                  className={`!font-cormorant font-normal tracking-[0.20px] text-ink lg:text-[17px] text-nowrap ${
                                    category?.discounted_price && category?.discounted_price !== category?.price
                                      ? 'line-through !text-gray-400 !text-[12px] sm:!text-[12px]'
                                      : 'sm:!text-[14px]'
                                  }`}
                                >
                                  {formatCurrency(Math.ceil(category?.price * category?.count))}
                                </Text>
                              )}
                              {category?.discounted_price && category?.discounted_price !== category?.price && (
                                <Text
                                  as="p"
                                  size="textlg"
                                  className="!font-cormorant font-normal tracking-[0.20px] text-ink lg:text-[17px] md:text-[16px] text-nowrap sm:!text-[14px]"
                                >
                                  {formatCurrency(Math.ceil(category?.discounted_price * category?.count))}
                                </Text>
                              )}
                            </div>
                          </div>
                          {category?.is_appraisal && (
                            <div className="grid grid-cols-3 gap-5">
                              <div className="col-span-2 flex items-center">
                                <ProductName productName={'Appraisal'} count={category?.count} />
                              </div>
                              <div className="flex flex-row col-span-1 flex-wrap justify-end items-center gap-0">
                                <Text
                                  as="p"
                                  size="textlg"
                                  className={`!font-cormorant text-[18px] text-right font-normal tracking-[0.20px] text-ink lg:text-[17px] md:text-[16px]  'sm:!text-[14px]'
                            }`}
                                >
                                  {formatCurrency(Math.ceil(category?.appraisal_amount * (category?.count ?? 1)))}
                                </Text>
                              </div>
                            </div>
                          )}
                          {category?.is_warranty > 0 && (
                            <div className="grid grid-cols-3 gap-5">
                              <div className="col-span-2 flex items-center">
                                <ProductName productName={'Warranty'} count={category?.count} />
                              </div>
                              <div className="flex flex-row col-span-1 flex-wrap justify-end items-center gap-0">
                                <Text
                                  as="p"
                                  size="textlg"
                                  className={`!font-cormorant text-[18px] text-right font-normal tracking-[0.20px] text-ink lg:text-[17px] md:text-[16px]  'sm:!text-[14px]'
                            }`}
                                >
                                  {formatCurrency(Math.ceil((category?.warranty_amount ?? 0) * (category?.count ?? 1)))}
                                </Text>
                              </div>
                            </div>
                          )}
                          {category?.engravingText?.Text && (
                            <div className="grid grid-cols-3 gap-5">
                              <div className="col-span-2 flex items-center">
                                <ProductName productName={'Engraving'} count={category?.count} />
                              </div>
                              <div className="flex flex-row col-span-1 flex-wrap justify-end items-center gap-0">
                                <Text
                                  as="p"
                                  size="textlg"
                                  className={`!font-cormorant text-[18px] text-right font-normal tracking-[0.20px] text-ink lg:text-[17px] md:text-[16px]  'sm:!text-[14px]'
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
                                <ProductName productName={category?.diamondData?.name} />
                              </div>
                              <div className="flex flex-row col-span-1 justify-end items-center gap-2">
                                {category?.diamondData?.price && (
                                  <Text
                                    as="p"
                                    size="textlg"
                                    className="!font-cormorant font-normal tracking-[0.20px] text-ink lg:text-[17px] md:text-[16px] text-nowrap sm:!text-[14px]"
                                  >
                                    {formatCurrency(category?.diamondData?.price)}
                                  </Text>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {orderDetails?.gst_percentage > 0 && (
                        <div className="flex flex-wrap  border-line  justify-between gap-5">
                          <Text as="p" size="textlg" className="font-normal tracking-[0.40px] text-ink lg:text-[17px] md:text-[16px] sm:!text-[13px]">
                            Tax
                          </Text>
                          <Text as="p" size="textlg" className="font-normal tracking-[0.40px] text-ink lg:text-[17px] md:text-[16px] sm:!text-[14px]">
                            {`${orderDetails?.gst_percentage}%`}
                          </Text>
                        </div>
                      )}
                      <div className="flex flex-wrap  border-line  justify-between gap-5">
                        <Text as="p" size="textlg" className="font-normal tracking-[0.40px] text-ink lg:text-[17px] md:text-[16px] sm:!text-[13px]">
                          Shipping Charge
                        </Text>
                        <Text as="p" size="textlg" className="font-normal tracking-[0.40px] text-ink lg:text-[17px] md:text-[16px] sm:!text-[14px]">
                          Free
                        </Text>
                      </div>
                      {orderDetails?.total_coupon_price && (
                        <div className="flex flex-wrap border-t border-line  pt-5 justify-between gap-5">
                          <Text as="p" size="textlg" className="font-normal tracking-[0.20px] text-ink lg:text-[17px] md:text-[16px] sm:!text-[13px]">
                            Applied Promocode
                          </Text>
                          <Text
                            as="p"
                            size="textlg"
                            className="!font-cormorant font-normal tracking-[0.20px] text-ink lg:text-[17px] md:text-[16px] sm:!text-[13px]"
                          >
                            {'- '}
                            {formatCurrency(
                              (orderDetails?.total_discount_price ? orderDetails?.total_discount_price : orderDetails?.total_price) -
                                orderDetails?.total_coupon_price,
                            )}
                          </Text>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap justify-between gap-5">
                      <Heading as="h6" size="headingxs" className="text-[20px] font-medium uppercase tracking-[0.48px] !text-ink lg:text-[16px]">
                        Total Price
                      </Heading>
                      <div className="flex h-fit items-center gap-2">
                        <Heading
                          as="h6"
                          size="headingxs"
                          className={`!font-cormorant text-[20px] font-medium tracking-[0.48px] !text-ink lg:text-[16px] ${
                            orderDetails?.total_coupon_price || orderDetails?.total_discount_price
                              ? 'line-through !text-gray-400 !text-[16px] md:!text-[14px]'
                              : ''
                          }`}
                        >
                          {/* Struck-through value is always the original total (pre-discount / pre-coupon).
                              Using total_discount_price here rendered $0 for coupon-only orders.
                              With no discount at all there is no second Heading below, so this row is the
                              payable total and must be `after_gst_amount` — `total_price` is the jewelry
                              sub-total only and leaves out appraisal / warranty / engraving. */}
                          {orderDetails?.total_coupon_price || orderDetails?.total_discount_price
                            ? formatCurrency(orderDetails?.total_price)
                            : formatCurrency(orderDetails?.after_gst_amount ? orderDetails?.after_gst_amount : orderDetails?.total_price)}
                        </Heading>
                        {(orderDetails?.total_coupon_price || orderDetails?.total_discount_price) && (
                          <Heading
                            as="h6"
                            size="headingxs"
                            className="!font-cormorant text-[20px] font-medium tracking-[0.48px] !text-ink md:text-[16px] lg:text-[16px]"
                          >
                            {orderDetails?.total_coupon_price
                              ? formatCurrency(orderDetails?.after_gst_amount ? orderDetails?.after_gst_amount : orderDetails?.total_coupon_price)
                              : orderDetails?.total_discount_price
                                ? formatCurrency(orderDetails?.after_gst_amount ? orderDetails?.after_gst_amount : orderDetails?.total_discount_price)
                                : formatCurrency(orderDetails?.after_gst_amount ? orderDetails?.after_gst_amount : orderDetails?.total_price)}
                          </Heading>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-start gap-3 border border-line bg-paper md:px-4 px-[30px] py-3.5 sm:px-4">
                  <Text as="p" size="textmd" className="!text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
                    Arrives
                  </Text>
                  <Text as="p" size="textlg" className="font-normal tracking-[0.40px] text-ink lg:text-[17px] md:text-[16px]">
                    {arrivesWindow ? `${arrivesWindow.start.format('MMMM DD, YYYY')}  -  ${arrivesWindow.end.format('MMMM DD, YYYY')}` : ''}
                  </Text>
                </div>
                <div className="flex flex-col gap-[22px] md:gap-[14px] border border-line bg-paper p-[30px] md:p-4 sm:p-4">
                  <div className="flex flex-col items-start gap-6 md:gap-[14px]">
                    <Text as="p" size="textmd" className="!text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
                      contact details
                    </Text>
                    <div className="flex flex-col items-start gap-2 self-stretch">
                      <Text as="p" size="textlg" className="font-normal tracking-[0.40px] text-ink lg:text-[17px]  md:!text-[14px]">
                        Email : {orderDetails?.orderUserDetails?.email}
                      </Text>
                      <Text as="p" size="textlg" className="font-normal tracking-[0.40px] text-ink lg:text-[17px]  md:!text-[14px]">
                        Phone : {orderDetails?.billingAddressDetails?.mobile ?? '---'}
                      </Text>
                    </div>
                  </div>
                  <div className="h-[1px] bg-line" />

                  <div className="flex flex-col items-start gap-[22px] md:gap-[14px]">
                    <Text as="p" size="textmd" className="!text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
                      Delivery address
                    </Text>
                    <div className="mr-[22px] flex flex-col items-start gap-1.5 self-stretch md:mr-0">
                      <Text as="p" size="textlg" className="font-medium tracking-[0.40px] text-ink-soft lg:text-[17px] capitalize md:!text-[14px]">
                        {orderDetails?.deliveryAddressDetails?.first_name} {orderDetails?.deliveryAddressDetails?.last_name}
                      </Text>
                      <div className="flex flex-col items-start justify-center gap-0.5 self-stretch">
                        <Text as="p" size="textlg" className="font-normal tracking-[0.40px] text-ink-soft lg:text-[17px] md:!text-[14px]">
                          {orderDetails?.deliveryAddressDetails?.email}
                        </Text>
                        <Text as="p" size="textlg" className="font-normal tracking-[0.40px] text-ink-soft lg:text-[17px] capitalize md:!text-[14px]">
                          {orderDetails?.deliveryAddressDetails?.address1}
                          <br />
                          {(() => {
                            const cityName =
                              cities.find((el: any) => el.id === orderDetails?.deliveryAddressDetails?.city_id)?.name ||
                              orderDetails?.deliveryAddressDetails?.city_text;
                            const stateName = states.find((el: any) => el.id === orderDetails?.deliveryAddressDetails?.state_id)?.name;
                            const countryName = countries.find((el: any) => el.id === orderDetails?.deliveryAddressDetails?.country_id)?.name;
                            return (
                              <>
                                {cityName ? `${cityName}, ` : ''}
                                {stateName},
                                <br />
                                {countryName} - {orderDetails?.deliveryAddressDetails?.postal_code}
                              </>
                            );
                          })()}
                        </Text>
                        <Text as="p" size="textlg" className="font-normal tracking-[0.40px] text-ink-soft lg:text-[17px] md:!text-[14px]">
                          {orderDetails?.deliveryAddressDetails?.mobile}
                        </Text>
                      </div>
                    </div>
                  </div>
                  <div className="h-[1px] bg-line" />
                  <div className="flex flex-col items-start gap-[22px] md:gap-[14px]">
                    <Text as="p" size="textmd" className="!text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
                      billing address
                    </Text>
                    <div className="mr-[22px] flex flex-col items-start gap-1.5 self-stretch md:mr-0">
                      <Text as="p" size="textlg" className="font-medium tracking-[0.40px] text-ink-soft lg:text-[17px] capitalize md:!text-[14px]">
                        {orderDetails?.billingAddressDetails?.first_name} {orderDetails?.billingAddressDetails?.last_name}
                      </Text>
                      <div className="flex flex-col items-start justify-center gap-0.5 self-stretch">
                        <Text as="p" size="textlg" className="font-normal tracking-[0.40px] text-ink-soft lg:text-[17px] md:!text-[14px]">
                          {orderDetails?.billingAddressDetails?.email}
                        </Text>
                        <Text as="p" size="textlg" className="font-normal tracking-[0.40px] text-ink-soft lg:text-[17px] capitalize md:!text-[14px]">
                          {orderDetails?.billingAddressDetails?.address1}
                          <br />
                          {(() => {
                            const cityName =
                              cities.find((el: any) => el.id === orderDetails?.billingAddressDetails?.city_id)?.name ||
                              orderDetails?.billingAddressDetails?.city_text;
                            const stateName = states.find((el: any) => el.id === orderDetails?.billingAddressDetails?.state_id)?.name;
                            const countryName = countries.find((el: any) => el.id === orderDetails?.billingAddressDetails?.country_id)?.name;
                            return (
                              <>
                                {cityName ? `${cityName}, ` : ''}
                                {stateName},
                                <br />
                                {countryName} - {orderDetails?.billingAddressDetails?.postal_code}
                              </>
                            );
                          })()}
                        </Text>
                        <Text as="p" size="textlg" className="font-normal tracking-[0.40px] text-ink-soft lg:text-[17px] md:!text-[14px]">
                          {orderDetails?.billingAddressDetails?.mobile}
                        </Text>
                      </div>
                    </div>
                  </div>
                  <div className="h-[1px] bg-line" />
                  <div className="flex flex-col items-start gap-6 md:gap-[10px]">
                    <Text as="p" size="textlg" className="!text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
                      payment details
                    </Text>
                    <div className="flex items-center gap-6 md:gap-[10px] self-stretch">
                      <Text as="p" size="textlg" className="font-normal tracking-[0.40px] text-ink lg:text-[17px] md:!text-[16px]">
                        Payment Method:{' '}
                      </Text>
                      {orderDetails?.payment_method === 2 ? (
                        <Img src="img_group_1287.svg" alt="Credit Card Image" width={34} height={20} className="h-[20px]" />
                      ) : orderDetails?.payment_method === 3 ? (
                        <span>
                          PayPal
                          {orderDetails?.paypal_payer_email && (
                            <span className="text-[13px] text-ink-soft ml-2">({orderDetails.paypal_payer_email})</span>
                          )}
                        </span>
                      ) : orderDetails?.payment_method === 4 ? (
                        <span className="font-medium">Affirm</span>
                      ) : orderDetails?.payment_method === 5 ? (
                        <span className="font-medium">
                          Google Pay
                          {orderDetails?.google_pay_card_network && (
                            <span className="text-[13px] text-ink-soft ml-2">
                              ({CARD_NETWORK_NAMES[`${orderDetails.google_pay_card_network}`.toUpperCase()] || orderDetails.google_pay_card_network}
                              {orderDetails?.google_pay_card_last4 ? ` •••• ${orderDetails.google_pay_card_last4}` : ''})
                            </span>
                          )}
                        </span>
                      ) : orderDetails?.payment_method === 6 ? (
                        <span className="font-medium">Shop Pay</span>
                      ) : (
                        'Cash'
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : !loading && status == 'fulfilled' ? (
        <div className="w-full flex justify-center items-center min-h-[80vh] bg-paper px-4 text-center text-ink">
          This order belongs to a different account. Sign in with the email used to place it.
        </div>
      ) : !loading && status == '' ? (
        <div className="w-full flex justify-center items-center min-h-[80vh] bg-paper px-4 text-center text-ink">
          Order details are available after logging in. Please&nbsp;
          <Link href="/login">
            <span className="cursor-pointer underline underline-offset-[3px]">sign in</span>
          </Link>
          &nbsp; to continue.
        </div>
      ) : (
        <div className="w-full flex justify-center items-center min-h-[80vh] bg-paper px-4 text-center text-ink">
          <div className="w-full flex justify-center items-center">
            <LuLoader className="h-10 w-10 animate-spin text-ink" />
          </div>
        </div>
      )}
    </>
  );
}
