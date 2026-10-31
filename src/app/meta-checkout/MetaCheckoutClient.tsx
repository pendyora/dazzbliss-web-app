/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useEffect, useRef, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';
import { LuLoader } from 'react-icons/lu';

import { apiMetaResolveCart } from '@/services/cartService';
import store, { useAppDispatch } from '@/store';
import { clearCartProducts, clearCouponData, fetchLocalCartProductsList, verifyCoupon } from '@/store/slices/Cart/cartSlice';
import { trackInitiateCheckout } from '@/utils/metaPixel';

/**
 * Meta (Facebook / Instagram) Shops checkout landing.
 *
 * This is the URL registered in Meta Commerce Manager: `${WEBSITE_URL}/meta-checkout`.
 * When a shopper taps "Buy" in a Meta Shop, Meta redirects here and appends:
 *   ?products=<contentId>:<qty>,<contentId>:<qty>   (URL-encoded, required)
 *   &coupon=<code>                                   (optional)
 *   &fbclid=... &cart_origin=... &utm_*=...          (tracking, optional)
 *
 * `contentId` == our catalog content id == SkuMasters.id. Meta sends no ring size, no custom
 * diamond, and no customer PII — so we resolve the ids to purchasable lines on the backend,
 * replace the local (guest) cart with exactly what Meta sent, then forward into the normal
 * guest checkout (no forced login, per Meta's requirements).
 */

// Parse Meta's `products` value: "id1:2,id2:1" -> [{ content_id, count }]
// `content_id` is the id Meta sends (our catalog content id = StockManage.id).
function parseProducts(raw: string | null): { content_id: string; count: number }[] {
  if (!raw) {
    return [];
  }
  return raw
    .split(',')
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const idx = pair.lastIndexOf(':');
      const content_id = idx === -1 ? pair : pair.slice(0, idx);
      const qty = idx === -1 ? 1 : parseInt(pair.slice(idx + 1), 10);
      return { content_id: decodeURIComponent(content_id).trim(), count: Number.isFinite(qty) && qty > 0 ? qty : 1 };
    })
    .filter((item) => item.content_id);
}

export default function MetaCheckoutClient() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const startedRef = useRef(false);
  const [status, setStatus] = useState<'loading' | 'empty' | 'error'>('loading');

  useEffect(() => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;

    (async () => {
      try {
        const requested = parseProducts(searchParams.get('products'));
        const coupon = searchParams.get('coupon')?.trim() || '';
        const fbclid = searchParams.get('fbclid') || '';
        const cartOrigin = searchParams.get('cart_origin') || '';

        // Persist Meta attribution for the session so the Purchase pixel / order can reference it.
        try {
          if (fbclid) {
            sessionStorage.setItem('majesca_meta_fbclid', fbclid);
          }
          if (cartOrigin) {
            sessionStorage.setItem('majesca_meta_cart_origin', cartOrigin);
          }
        } catch {
          /* ignore storage errors */
        }

        if (requested.length === 0) {
          setStatus('empty');
          return;
        }

        // Meta's catalog is priced in USD — align the storefront currency so displayed prices match.
        try {
          localStorage.setItem('currency', 'USD');
        } catch {
          /* ignore */
        }

        // Resolve catalog ids -> validated { jewelry_id, sku_master, count } lines.
        const res: any = await apiMetaResolveCart({ items: requested });
        const resolved: { jewelry_id: string | number; sku_master: string; count: number }[] = res?.data?.data?.items ?? res?.data?.items ?? [];

        if (!Array.isArray(resolved) || resolved.length === 0) {
          setStatus('empty');
          return;
        }

        // Replace the guest cart with exactly what Meta sent (Meta requires the cart to reflect
        // the shopper's Shop selection). Shape matches the localStorage cart written elsewhere.
        const cartItems = resolved.map((item) => ({
          jewelry_id: item.jewelry_id,
          sku_master: item.sku_master,
          count: item.count,
          is_appraisal: false,
          engravingText: null,
          selectedYearValue: null,
        }));

        try {
          localStorage.setItem('cartItems', JSON.stringify(cartItems));
          // Remembered so the Thank-You page can tell the backend which lines came from Meta.
          // Whatever the shopper adds on our own site after this is deliberately not recorded,
          // which is how admin can show a per-line source on a mixed order.
          sessionStorage.setItem('majesca_meta_line_skus', JSON.stringify(cartItems.map((item) => String(item.sku_master))));
        } catch {
          /* ignore */
        }
        dispatch(clearCartProducts());
        dispatch(clearCouponData());

        // Hydrate the guest cart so the coupon can be validated against real line items,
        // and so /checkout shows the cart immediately.
        await dispatch(fetchLocalCartProductsList({ data: cartItems }));

        // Best-effort auto-apply of a Meta-supplied coupon (optional; needs cart context).
        if (coupon) {
          try {
            const guestCartProducts = store.getState()?.cart?.cartProducts ?? [];
            await dispatch(verifyCoupon({ coupon_code: coupon, updatedCartProducts: guestCartProducts }));
          } catch {
            /* non-fatal: shopper can still enter the code on the checkout promo field */
          }
        }

        // Fire Meta Pixel InitiateCheckout. Carry the catalog content ids (= SkuMasters.id) so this
        // event matches the ViewContent / AddToCart / Purchase funnel and the Meta catalog.
        try {
          trackInitiateCheckout({
            content_ids: cartItems.map((i) => String(i.sku_master)),
            content_type: 'product',
            currency: 'USD',
            num_items: cartItems.reduce((sum, i) => sum + (i.count || 0), 0),
          });
        } catch {
          /* ignore */
        }

        router.replace('/checkout');
      } catch {
        setStatus('error');
      }
    })();
  }, [dispatch, router, searchParams]);

  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4 px-4 text-center">
      {status === 'loading' && (
        <>
          <LuLoader className="h-8 w-8 animate-spin" />
          <p className="text-base">Preparing your cart&hellip;</p>
        </>
      )}
      {status === 'empty' && (
        <>
          <p className="text-lg font-medium">We couldn&apos;t find those items</p>
          <p className="text-sm text-gray-500">The products from this link are no longer available.</p>
          <button className="mt-2 rounded bg-black px-6 py-2 text-white" onClick={() => router.replace('/')}>
            Continue shopping
          </button>
        </>
      )}
      {status === 'error' && (
        <>
          <p className="text-lg font-medium">Something went wrong</p>
          <p className="text-sm text-gray-500">Please try again in a moment.</p>
          <button className="mt-2 rounded bg-black px-6 py-2 text-white" onClick={() => router.replace('/cart')}>
            Go to cart
          </button>
        </>
      )}
    </div>
  );
}
