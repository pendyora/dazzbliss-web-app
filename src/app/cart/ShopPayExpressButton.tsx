'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { LuLoader } from 'react-icons/lu';

import { varifyEmailApi } from '@/services/cartService';
import { useAppDispatch, useAppSelector } from '@/store';
import { clearAuthState } from '@/store/slices/auth/authSlice';
import { clearCartProducts, setGuestDetails } from '@/store/slices/Cart/cartSlice';
import { setGuestUserOrderDetails } from '@/store/slices/Order/orderSlice';
import { norm } from '@/utils/walletAddress';

import ShopPayButton from './ShopPayButton';

type Props = {
  /** Live cart line items to price (same shape PayPal Express sends). */
  cartProducts: any[];
  /** Applied coupon code, if any. */
  couponCode?: string;
  /** Synchronous gate (consent, gift ring size) — surfaces its own error when it returns false. */
  canStart: () => boolean;
  /** Awaited before the session is created (e.g. sync a logged-in cart to the DB). */
  onBeforeCreate?: () => Promise<void> | void;
  /** Send the cart's unlocked free gift with the order. Off for a single-product Buy Now. */
  includeFreeGift?: boolean;
  /** Empty the cart once paid. Off for a single-product Buy Now — the cart was not what they bought. */
  clearCartOnSuccess?: boolean;
};

/**
 * Shop Pay as an express checkout on the Cart page. Shop Pay collects the buyer's address and card
 * in its own window; the order is priced server-side from the cart, the buyer (guest or signed-in)
 * and the Shop Pay addresses are attached at payment confirmation, then the buyer lands on the
 * thank-you page — the checkout page is skipped entirely, like PayPal Express.
 */
const ShopPayExpressButton = ({ cartProducts, couponCode, canStart, onBeforeCreate, includeFreeGift = true, clearCartOnSuccess = true }: Props) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth.auth);
  // Express checkout skips the checkout page, so the gift the cart is showing travels with the
  // order. Identifiers only — re-resolved and priced at $0 server-side.
  const giftOfferId = useAppSelector((state: any) => (state?.freeGift?.unlocked ? (state?.freeGift?.gift?.offer_id ?? null) : null));
  const giftVariantId = useAppSelector((state: any) => (state?.freeGift?.unlocked ? (state?.freeGift?.gift?.offer_variant_id ?? null) : null));
  const giftRingSizeId = useAppSelector((state: any) => (state?.freeGift?.unlocked ? (state?.freeGift?.gift?.ring_size_id ?? null) : null));
  const giftDeclined = useAppSelector((state: any) => Boolean(state?.freeGift?.declined));

  // null until Shop Pay reports whether it is usable here, so the "or" divider does not flash.
  const [available, setAvailable] = useState<boolean | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const isLoggedIn = Boolean(user && !user?.is_guest);

  // The cart page rebuilds its product array on every render; key it by content so the quote is
  // refreshed only when the cart actually changes.
  const cartKey = JSON.stringify(cartProducts || []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cart = useMemo(() => cartProducts || [], [cartKey]);

  useEffect(() => {
    if (!error) {
      return;
    }
    const timer = window.setTimeout(() => setError(''), 5000);
    return () => window.clearTimeout(timer);
  }, [error]);

  // Changes identity whenever the total can move (cart, coupon, gift), which re-quotes.
  const buildOrderData = useCallback(() => {
    // Shipping window from the cart (max estimated_delivery_days), same as the checkout page.
    const days: number[] = cart.map((item: any) => Number(item?.cartJewelryDetails?.estimated_delivery_days) || 0);
    const maxDays = days.length > 0 ? Math.max(...days) : 0;
    return {
      coupon_code: couponCode || undefined,
      updatedCartProducts: cart,
      start_shipping_date: dayjs().add(maxDays, 'days').toISOString(),
      end_shipping_date: dayjs()
        .add(15 + maxDays, 'days')
        .toISOString(),
      ...(includeFreeGift && giftVariantId
        ? { free_gift: { offer_id: giftOfferId, offer_variant_id: giftVariantId, ring_size_id: giftRingSizeId, declined: giftDeclined } }
        : {}),
    };
  }, [cart, couponCode, includeFreeGift, giftOfferId, giftVariantId, giftRingSizeId, giftDeclined]);

  // Guests: create (or attach to) a user from the Shop Pay email, as PayPal Express does, so the
  // address and submit-payment calls carry a guest token. Signed-in buyers already have one.
  const ensureBuyer = useCallback(
    async (email?: string) => {
      if (isLoggedIn) {
        return;
      }
      if (!email) {
        throw new Error('Shop Pay did not share an email address. Please use the regular checkout.');
      }
      const res: any = await varifyEmailApi({ email: norm(email) });
      const verified = res?.data?.data;
      if (!verified?.token) {
        throw new Error('We could not start your order. Please try again.');
      }
      dispatch(setGuestDetails({ ...verified, email: norm(email) }));
    },
    [isLoggedIn, dispatch],
  );

  const savedAddresses = useMemo(() => (isLoggedIn ? [user?.delivery_address, user?.billing_address].filter(Boolean) : []), [isLoggedIn, user]);
  const fallbackContact = useMemo(
    () => ({
      email: isLoggedIn ? user?.email || '' : '',
      phone: isLoggedIn ? user?.billing_address?.mobile || user?.delivery_address?.mobile || '' : '',
    }),
    [isLoggedIn, user],
  );

  // Same clean-up as PayPal Express: clear the cart, keep guest order details for the thank-you
  // page, drop the throwaway guest session, then follow the backend's `redirectUrl`.
  const handleSuccess = useCallback(
    (responseData: any, pendingOrderId: string) => {
      const orderId = responseData?.order?.order_id || pendingOrderId;
      if (clearCartOnSuccess) {
        dispatch(clearCartProducts());
        try {
          localStorage.removeItem('cartItems');
        } catch {
          /* ignore */
        }
      }

      if (responseData?.is_guest && responseData?.guestUserOrderDetails) {
        dispatch(setGuestUserOrderDetails(responseData.guestUserOrderDetails));
        try {
          sessionStorage.setItem(`majesca_guest_order_${orderId}`, JSON.stringify(responseData.guestUserOrderDetails));
          localStorage.removeItem('admin');
        } catch {
          /* ignore */
        }
        dispatch(clearAuthState());
      }

      const redirectUrl: string | undefined = responseData?.redirectUrl;
      if (redirectUrl && /^https?:\/\//i.test(redirectUrl)) {
        window.location.href = redirectUrl;
      } else {
        router.push(redirectUrl || `/ordersuccesfull?order_id=${orderId}`);
      }
    },
    [dispatch, router, clearCartOnSuccess],
  );

  if (available === false) {
    return null;
  }

  return (
    <div className="w-full flex flex-col">
      {processing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4" role="status" aria-live="polite">
          <div className="grid w-full max-w-[360px] justify-items-center gap-2 bg-paper px-8 py-8 text-center font-libre">
            <LuLoader className="mb-2 h-8 w-8 animate-spin text-ink" aria-hidden />
            <p className="m-0 text-[11px] font-medium uppercase tracking-[0.18em] text-ink">Confirming your payment...</p>
            <p className="m-0 text-[12.5px] text-ink-soft">Please don&apos;t close this page</p>
          </div>
        </div>
      )}

      {/* Keep `my-3`: the bag hides this divider with `[&>div>.my-3]:hidden` because it draws its own. */}
      <div className="my-3 flex items-center gap-3">
        <div className="h-px flex-1 bg-line" />
        <span className="font-libre text-[10.5px] uppercase tracking-[0.16em] text-ink-soft">or</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <ShopPayButton
        buildOrderData={buildOrderData}
        enabled={cartProducts?.length > 0 && !processing}
        onBeforeClick={canStart}
        onBeforeCreateSession={onBeforeCreate}
        ensureBuyer={ensureBuyer}
        onProcessingChange={setProcessing}
        onSuccess={handleSuccess}
        onError={setError}
        onAvailabilityChange={setAvailable}
        savedAddresses={savedAddresses}
        fallbackContact={fallbackContact}
      />
      {error && (
        <p role="alert" className="m-0 pt-2 font-libre text-[12px] leading-[1.5] text-danger">
          {'*' + error}
        </p>
      )}
    </div>
  );
};

export default ShopPayExpressButton;
