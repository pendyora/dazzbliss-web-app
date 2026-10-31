/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { Image } from 'antd';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LuLoader } from 'react-icons/lu';

import ProductName from '@/components/CartProductDetails/ProductName';
import { AssurancePanel } from '@/components/CheckoutAssurance';
import FreeGiftItem from '@/components/FreeGiftItem';
import FreeGiftProgress from '@/components/FreeGiftProgress';
import OrderSummary from '@/components/OrderSummary';
import ReviewRatingStrip from '@/components/ReviewRatingStrip';
import * as ga4 from '@/lib/analytics';
import * as klaviyo from '@/lib/klaviyo';
import { apiCancelAffirmOrder } from '@/services/affirmService';
import store, { setSelectedAppraisal, setSelectedEngraving, setSelectedWarranty, useAppDispatch, useAppSelector } from '@/store';
import { fetchCountries, setBillingAddress, setDeliveryAddress } from '@/store/slices/Address/addressSlice';
import { clearAuthState, getUpdateUser } from '@/store/slices/auth/authSlice';
import {
  clearCartProducts,
  fetchCartProducts,
  fetchCartProductsList,
  fetchLocalCartProductsList,
  restoreAppliedCoupon,
  setGuestDetails,
} from '@/store/slices/Cart/cartSlice';
import { evaluateFreeGift } from '@/store/slices/Cart/freeGiftSlice';
import { fetchPlaceOrder, setGuestUserOrderDetails } from '@/store/slices/Order/orderSlice';
import { formatCurrency } from '@/utils/common';
import { trackAddPaymentInfo, trackInitiateCheckout } from '@/utils/metaPixel';

import BillingAddress from './BillingAddress';
import CheckoutPromoCode from './CheckoutPromoCode';
import DeliveryAddress from './DeliveryAddress';
import Payment from './Payment';
import SignIn from './SignIn';
import Stepper from './Stepper';
import { Text } from '../../components/Text';

// Layout effects warn during SSR; this page is still server-rendered once despite 'use client'.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function CheckOutPage() {
  const [currentStep, setCurrentStep] = useState<number>(0); // 0 SignIn, 1 Billing, 2 Delivery, 3 Payment (includes promo)
  const [cartReady, setCartReady] = useState(false);
  const skipPersistStepRef = useRef(true);
  const checkoutStepScopeRef = useRef<string>('');
  const deliveryRefreshAttemptedForUserRef = useRef<string>('');
  const [isDeliveryAddress, setIsDeliveryAddress] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [, setShipping] = useState(false);
  const [, setBillingAddressData] = useState(false);
  const [, setPayment] = useState(false);
  const { cartProducts, checkoutDetails, guestDetails } = useAppSelector((state) => state?.cart);
  const { user } = useAppSelector((state) => state.auth.auth);
  const master = useAppSelector((state) => state.master.data);
  const [shippingDates, setShippingDates] = useState<any>([]);
  const [paymentError, setPaymentError] = useState<any>(null);
  const [cartListFromLocalStorage, setCartListFromLocalStorage] = useState([]);
  const [accountPassword, setAccountPassword] = useState<string | null>(null);
  const { appraisalData, engraving }: any = useAppSelector((state) => state?.master);

  const billingStepBeforeEditRef = useRef<number | null>(null);

  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const affirmCancelAttempted = useRef(false);

  const updatedbillingAddress = guestDetails?.billingAddress ? guestDetails?.billingAddress : user?.billing_address;
  const updatedDeliveryAddress = guestDetails?.deliveryAddress ? guestDetails?.deliveryAddress : user?.delivery_address;
  const couponData = useAppSelector((state: any) => state.cart.couponData);
  const freeGiftState = useAppSelector((state: any) => state.freeGift);

  // Handle Affirm cancel redirect: when user cancels Affirm modal, Affirm redirects here
  // with payment_type=affirm&order_id=ORD... — cancel the pending order
  useEffect(() => {
    const paymentType = searchParams.get('payment_type');
    const affirmOrderId = searchParams.get('order_id');
    if (paymentType !== 'affirm' || !affirmOrderId || affirmCancelAttempted.current) {
      return;
    }
    affirmCancelAttempted.current = true;
    apiCancelAffirmOrder(affirmOrderId)
      .catch(() => {})
      .finally(() => {
        // Clean up query params from URL
        router.replace('/checkout', { scroll: false });
      });
  }, [searchParams, router]);

  useEffect(() => {
    // Always start checkout with a clean guest state to avoid stale email/address data.
    dispatch(setGuestDetails([]));
    try {
      sessionStorage.removeItem('majesca_checkout_step');
    } catch {
      /* ignore */
    }
    setCurrentStep(0);
    setIsDeliveryAddress(false);
    skipPersistStepRef.current = true;
  }, []);

  useEffect(() => {
    const cartData = localStorage.getItem('cartItems');
    if (cartData) {
      setCartListFromLocalStorage(JSON.parse(cartData));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (user && !user?.is_guest) {
          // After guest steps (e.g. billing), getUpdateUser() sets user — server cart can be empty while
          // items still live in localStorage + were loaded via fetchLocalCartProductsList. Merge first
          // (same as post-login in SignIn) so cartProducts is not cleared to [].
          const cartData = localStorage.getItem('cartItems');
          const cartList = cartData ? JSON.parse(cartData) : [];
          if (cartList?.length > 0) {
            const serializedCart = JSON.stringify(cartList);
            let shouldSyncGuestCart = true;
            try {
              const lastSyncedGuestCart = sessionStorage.getItem('majesca_checkout_synced_guest_cart');
              shouldSyncGuestCart = lastSyncedGuestCart !== serializedCart;
              if (shouldSyncGuestCart) {
                sessionStorage.setItem('majesca_checkout_synced_guest_cart', serializedCart);
              }
            } catch {
              // If sessionStorage is unavailable, continue with sync.
              shouldSyncGuestCart = true;
            }

            if (shouldSyncGuestCart) {
              // Merge first, then clear local cart only on successful sync.
              const syncRes: any = await dispatch(fetchCartProducts({ data: cartList }));
              if (syncRes?.meta?.requestStatus === 'fulfilled') {
                localStorage.removeItem('cartItems');
              } else {
                try {
                  sessionStorage.removeItem('majesca_checkout_synced_guest_cart');
                } catch {
                  /* ignore */
                }
              }
            }
          }
          await dispatch(fetchCartProductsList());
        } else {
          const cartData = localStorage.getItem('cartItems');
          const cartList = cartData ? JSON.parse(cartData) : [];
          if (cartList?.length > 0) {
            await dispatch(fetchLocalCartProductsList({ data: cartList }));
          }
        }
      } finally {
        if (!cancelled) {
          setCartReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.is_guest, dispatch]);

  // Ensure we have the latest user addresses for logged-in checkout.
  // (Billing may exist while delivery can still be missing until we refresh user.)
  useEffect(() => {
    if (!user || user?.is_guest) {
      return;
    }
    const userKey = String(user?.id ?? user?.email ?? 'auth');
    const hasDelivery = Boolean(user?.delivery_address && (user?.delivery_address?.id || user?.delivery_address?.address1));
    if (hasDelivery) {
      if (deliveryRefreshAttemptedForUserRef.current === userKey) {
        deliveryRefreshAttemptedForUserRef.current = '';
      }
      return;
    }
    if (deliveryRefreshAttemptedForUserRef.current === userKey) {
      return;
    }
    deliveryRefreshAttemptedForUserRef.current = userKey;
    if (!hasDelivery) {
      dispatch(getUpdateUser());
    }
  }, [user?.id, user?.email, user?.is_guest, user?.delivery_address?.id, user?.delivery_address?.address1, dispatch]);

  useEffect(() => {
    if (!cartReady || cartProducts.length === 0) {
      return;
    }
    const scope = !user || user?.is_guest ? 'guest' : `user:${user?.id ?? 'auth'}`;
    const scopeChanged = checkoutStepScopeRef.current !== scope;
    if (!scopeChanged && !skipPersistStepRef.current) {
      return;
    }
    checkoutStepScopeRef.current = scope;
    try {
      // Guest flow should always start from contact and should never restore stale saved step.
      if (scope === 'guest') {
        setCurrentStep(0);
        sessionStorage.removeItem('majesca_checkout_step');
        return;
      }
      const raw = sessionStorage.getItem('majesca_checkout_step');
      if (raw !== null) {
        const n = parseInt(raw, 10);
        if (!Number.isNaN(n) && n >= 0 && n <= 3) {
          setCurrentStep(n);
        }
      }
    } catch {
      /* ignore */
    } finally {
      skipPersistStepRef.current = false;
    }
  }, [cartReady, cartProducts.length, user]);

  useEffect(() => {
    if (!cartReady || skipPersistStepRef.current) {
      return;
    }
    // Only persist steps for logged-in non-guest users.
    if (!user || user?.is_guest) {
      return;
    }
    try {
      sessionStorage.setItem('majesca_checkout_step', String(currentStep));
    } catch {
      /* ignore */
    }
  }, [currentStep, cartReady, user]);

  // Step sync for logged-in users:
  // If billing/delivery already exist, don't allow the UI to remain stuck on earlier steps.
  useEffect(() => {
    if (!cartReady) {
      return;
    }
    if (!user || user?.is_guest) {
      return;
    }

    const hasBilling = Boolean(
      user?.billing_address && (user?.billing_address?.id || user?.billing_address?.address1 || user?.billing_address?.first_name),
    );
    const hasDelivery = Boolean(
      user?.delivery_address && (user?.delivery_address?.id || user?.delivery_address?.address1 || user?.delivery_address?.first_name),
    );

    // 0 Sign in, 1 Billing, 2 Delivery, 3 Promo, 4 Payment
    let minStep = 0;
    if (hasBilling) {
      minStep = 1;
    }
    if (hasDelivery) {
      minStep = 2;
    }

    if (minStep > currentStep) {
      setCurrentStep(minStep);
    }
  }, [cartReady, user, currentStep]);

  useEffect(() => {
    const maxDeliveryDays: number[] = cartProducts.map((item: any) => item.cartJewelryDetails.estimated_delivery_days);
    const max = maxDeliveryDays.length > 0 ? Math.max(...maxDeliveryDays) : 0;
    setShippingDates([dayjs().add(max, 'days'), dayjs().add(15 + max, 'days')]);
    // dispatch(fetchCartProductsList());
    dispatch(fetchCountries());
    if (user?.delivery_address) {
      dispatch(setDeliveryAddress(user?.delivery_address));
    }
    if (user?.billing_address) {
      dispatch(setBillingAddress(user?.billing_address));
    }
  }, []);

  const updatedCartProducts = cartProducts?.map((product: any) => {
    const match: any = cartListFromLocalStorage?.find((item: any) => item?.jewelry_id === product?.jewelry_id);
    if (match) {
      return {
        ...product,
        is_appraisal: match?.is_appraisal ?? product?.is_appraisal,
        engravingText: match?.engravingText ?? product?.engravingText,
        is_warranty: match?.selectedYearValue ? true : false,
        selectedYearValue: match?.selectedYearValue ? match?.selectedYearValue : null,
      };
    }
    return product;
  });

  const isDirectCheckOut: any = false;

  const productsToDisplay = isDirectCheckOut ? checkoutDetails : updatedCartProducts;

  // The coupon lives in redux, which is not persisted — so a shopper who reloads checkout, or
  // lands on it directly, arrived with their discount silently gone from both the summary and
  // the gift threshold. The code is re-verified against the live cart rather than trusted from
  // storage, so it can only re-apply if the server still honours it.
  // Keyed on the cart and the shopper rather than run once per mount: checkout loads the cart,
  // may sync a guest cart into the DB, and can turn an anonymous visitor into a guest user —
  // an attempt that lands before any of that finishes has to be allowed to run again.
  const couponRestoreKey = useRef('');
  useEffect(() => {
    const key = `${user?.id ?? 'guest'}:${productsToDisplay?.length ?? 0}`;
    if (!cartReady || couponData?.coupon_code || !productsToDisplay?.length || couponRestoreKey.current === key) {
      return;
    }
    couponRestoreKey.current = key;
    dispatch(restoreAppliedCoupon({ updatedCartProducts: productsToDisplay }));
  }, [cartReady, couponData?.coupon_code, productsToDisplay?.length, user?.id]);

  // Free Gift Above X Amount. Re-evaluated on entry, in case the cart changed in another tab,
  // and whenever the promo code changes — the threshold is judged after the coupon, so a code
  // applied here can take the gift back. The backend recomputes it again at order creation;
  // this is only what the shopper is shown.
  useEffect(() => {
    if (!cartReady || !productsToDisplay?.length) {
      return;
    }
    dispatch(evaluateFreeGift({ cartProducts: productsToDisplay, couponCode: couponData?.coupon_code ?? null }));
  }, [cartReady, productsToDisplay?.length, couponData?.coupon_code]);

  const checkoutTracked = useRef(false);
  const paymentInfoTracked = useRef(false);

  const openBillingSection = () => {
    setCurrentStep((prev) => Math.max(prev, 1));
  };

  useEffect(() => {
    if (!productsToDisplay?.length) {
      return;
    }
    const numItems = productsToDisplay.reduce((s: number, p: any) => s + (p?.count ?? 1), 0);
    const value = productsToDisplay.reduce((sum: number, item: any) => {
      const p = item?.jewelry_sku?.discounted_price ?? item?.jewelry_sku?.selling_price ?? 0;
      const ring = item?.ringSizePricingDetails?.rate ?? 0;
      const diamond = item?.diamondDetails?.price ?? 0;
      const count = item?.count ?? 1;
      return sum + (Number(p) + Number(ring)) * count + Number(diamond);
    }, 0);
    if (!checkoutTracked.current) {
      checkoutTracked.current = true;
      trackInitiateCheckout({ value, currency: 'USD', num_items: numItems });
      // Google Ads Begin Checkout conversion event
      if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_NODE_ENV === 'production') {
        (window as any).gtag?.('event', 'conversion', {
          send_to: 'AW-17230998076/243LCOmSu4AcELzUsJhA',
          value: value,
          currency: 'USD',
        });
      }
      // GA4 begin_checkout
      ga4.beginCheckout(ga4.mapCartItemsToGA4(productsToDisplay));

      // Klaviyo Started Checkout — the Abandoned Cart flow trigger. Identify first so the
      // event lands on a known profile; without an email Klaviyo has nobody to send to.
      if (user?.email) {
        klaviyo.identify({ email: user.email, firstName: user?.first_name, lastName: user?.last_name });
      }
      klaviyo.trackStartedCheckout({
        value,
        checkoutUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        items: productsToDisplay.map((item: any) => {
          const base = Number(item?.jewelry_sku?.discounted_price ?? item?.jewelry_sku?.selling_price ?? 0);
          const ring = Number(item?.ringSizePricingDetails?.rate ?? 0);
          const diamond = Number(item?.diamondDetails?.price ?? 0);
          const jewelryTypeName = item?.cartJewelryDetails?.jewelrySubType?.group;
          const skuSlug = item?.jewelry_sku?.sku_slug;
          return {
            productId: String(item?.sku_master_id ?? item?.sku_master ?? item?.jewelry_id ?? ''),
            productName: item?.fullTitle ?? item?.cartJewelryDetails?.title ?? '',
            sku: item?.jewelry_sku?.sku_code,
            quantity: Number(item?.count ?? 1) || 1,
            price: base + ring + diamond,
            categories: jewelryTypeName ? [jewelryTypeName] : [],
            imageUrl: item?.jewelry_sku?.carat_images?.[0],
            productUrl:
              typeof window !== 'undefined' && skuSlug && jewelryTypeName
                ? `${window.location.origin}/${String(jewelryTypeName).toLowerCase().replace(/\s+/g, '-')}/premade?slug=${skuSlug}`
                : undefined,
            brand: 'Ashclair',
          };
        }),
      });
    }
  }, [productsToDisplay?.length, user]);

  useEffect(() => {
    if (currentStep === 3 && productsToDisplay?.length && !paymentInfoTracked.current) {
      paymentInfoTracked.current = true;
      const value = productsToDisplay.reduce((sum: number, item: any) => {
        const p = item?.jewelry_sku?.discounted_price ?? item?.jewelry_sku?.selling_price ?? 0;
        const ring = item?.ringSizePricingDetails?.rate ?? 0;
        const diamond = item?.diamondDetails?.price ?? 0;
        const count = item?.count ?? 1;
        return sum + (Number(p) + Number(ring)) * count + Number(diamond);
      }, 0);
      trackAddPaymentInfo({ value, currency: 'USD' });
      // GA4 add_payment_info
      ga4.addPaymentInfo({ ...ga4.mapCartItemsToGA4(productsToDisplay), payment_type: 'Credit Card' });
    }
  }, [currentStep, productsToDisplay]);

  const handlePlaceOrder = async (values: any) => {
    // A ring gift cannot be manufactured without a size. The cart is where the size is
    // chosen, so send them back rather than silently dropping the gift. A gift the shopper
    // turned down is not on the order, so it cannot hold the order up.
    if (freeGiftState?.gift?.needs_ring_size && !freeGiftState?.declined) {
      setPaymentError('Please choose a ring size for your free gift in the cart before placing your order.');
      return;
    }
    setIsPlacingOrder(true);
    if (user && !user?.is_guest) {
      dispatch(getUpdateUser());
    }
    // Always send the same lines shown in checkout (guest *and* logged-in). Server cart can be empty
    // while Redux still has items from local cart / verify flow — backend otherwise returns "cart is empty".
    // Read live cart from the store at submit time and fall back to hydrating from localStorage if needed.
    let localExtras: any[] = [];
    try {
      const raw = localStorage.getItem('cartItems');
      localExtras = raw ? JSON.parse(raw) : [];
    } catch {
      localExtras = [];
    }
    const mergeLocalCartExtras = (products: any[] | undefined | null) =>
      (products ?? []).map((product: any) => {
        const match: any = localExtras.find((item: any) => item?.jewelry_id === product?.jewelry_id);
        if (match) {
          return {
            ...product,
            is_appraisal: match?.is_appraisal ?? product?.is_appraisal,
            engravingText: match?.engravingText ?? product?.engravingText,
            is_warranty: match?.selectedYearValue ? true : false,
            selectedYearValue: match?.selectedYearValue ? match?.selectedYearValue : null,
          };
        }
        return product;
      });

    const liveCart = store.getState().cart.cartProducts;
    // Prefer the same line items as Order Summary first; then Redux; avoids rare cases where
    // server cart snapshot and UI diverge and the request would omit updatedCartProducts.
    const snapshotBase =
      productsToDisplay?.length > 0
        ? productsToDisplay
        : liveCart?.length > 0
          ? liveCart
          : updatedCartProducts?.length > 0
            ? updatedCartProducts
            : [];
    let clientCartSnapshot = mergeLocalCartExtras(snapshotBase);

    if (!clientCartSnapshot?.length && Array.isArray(localExtras) && localExtras.length > 0) {
      const r: any = await dispatch(fetchLocalCartProductsList({ data: localExtras }));
      if (r.meta.requestStatus === 'fulfilled' && Array.isArray(r.payload?.data) && r.payload.data.length > 0) {
        clientCartSnapshot = mergeLocalCartExtras(r.payload.data);
      }
    }

    const data = {
      delivery_address: updatedDeliveryAddress?.id,
      billing_address: updatedbillingAddress?.id,
      start_shipping_date: shippingDates?.[0],
      end_shipping_date: shippingDates?.[1],
      payment_method: 2,
      coupon_code: couponData?.coupon_code,
      // Free gift: identifiers only. Price, quantity, SKU and offer are all re-derived
      // server-side, so nothing here can change what is charged or what is granted.
      ...(freeGiftState?.unlocked && freeGiftState?.gift
        ? {
            free_gift: {
              offer_id: freeGiftState.gift.offer_id,
              offer_variant_id: freeGiftState.gift.offer_variant_id,
              ring_size_id: freeGiftState.gift.ring_size_id ?? null,
              // Carried explicitly: the server re-derives the gift from the cart, so omitting
              // the payload for a refused gift would simply grant the offer's default instead
              // of granting nothing.
              declined: Boolean(freeGiftState.declined),
            },
          }
        : {}),
      ...values,
      ...(clientCartSnapshot?.length ? { updatedCartProducts: clientCartSnapshot } : {}),
      ...(accountPassword ? { password: accountPassword, confirmPassword: accountPassword } : {}),
    };

    const res = await dispatch(fetchPlaceOrder({ data: data }));
    if (res?.payload?.status === 200) {
      // Clear header/cart badge state immediately after successful order.
      dispatch(clearCartProducts());
      try {
        sessionStorage.removeItem('majesca_checkout_step');
      } catch {
        /* ignore */
      }
      const orderIdFromResponse =
        res?.payload?.data?.order_id ??
        res?.payload?.data?.orderId ??
        res?.payload?.data?.guestUserOrderDetails?.order_id ??
        res?.payload?.data?.guestUserOrderDetails?.orderId ??
        res?.payload?.data?.guestUserOrderDetails?.orderDetails?.order_id ??
        res?.payload?.data?.guestUserOrderDetails?.orderDetails?.orderId;
      if (res?.payload?.data?.is_guest) {
        const d = res?.payload?.data;
        const guestOrderPayload =
          d?.guestUserOrderDetails ?? d?.guest_user_order_details ?? d?.orderDetails ?? (d?.order_id || d?.orderId ? d : null);
        if (guestOrderPayload) {
          dispatch(setGuestUserOrderDetails(guestOrderPayload));
          try {
            if (orderIdFromResponse) {
              sessionStorage.setItem(`majesca_guest_order_${orderIdFromResponse}`, JSON.stringify(guestOrderPayload));
            }
          } catch {
            /* ignore */
          }
        }
        localStorage.removeItem('admin');
        dispatch(clearAuthState());
      }
      localStorage.removeItem('cartItems');
      const redirectUrl: string = res?.payload?.data?.redirectUrl ?? '/';

      // `ThankYouSection` expects `?order_id=`; without it it redirects to `/` (cart empty).
      if (redirectUrl.includes('/ordersuccesfull') && !redirectUrl.includes('order_id=') && orderIdFromResponse) {
        router.push(`${redirectUrl}?order_id=${orderIdFromResponse}`);
      } else {
        router.push(redirectUrl);
      }
    } else {
      const p = res?.payload as any;
      const msg =
        typeof p === 'string'
          ? p
          : p?.message ||
            p?.error ||
            (Array.isArray(p?.errors) ? p.errors.filter(Boolean).join(' ') : '') ||
            'Unable to complete order. Please try again.';
      setPaymentError(msg);
      setTimeout(() => {
        setPaymentError(null);
      }, 10000);
      setIsPlacingOrder(false);
    }
  };
  useEffect(() => {
    if (!cartReady) {
      return;
    }
    if (!isPlacingOrder && (!cartProducts || cartProducts.length === 0)) {
      try {
        const rawLocalCart = localStorage.getItem('cartItems');
        const parsedLocalCart = rawLocalCart ? JSON.parse(rawLocalCart) : [];
        if (Array.isArray(parsedLocalCart) && parsedLocalCart.length > 0) {
          return;
        }
      } catch {
        // ignore parse/storage errors and continue with fallback redirect
      }
      router.replace('/cart');
    }
  }, [cartReady, cartProducts?.length, isPlacingOrder, router]);

  const showLoader = !cartReady || (!isPlacingOrder && (!cartProducts || cartProducts.length === 0));

  // Checkout always opens at the top — the contact step, guest details and the step are reset on
  // every entry anyway. Until the cart loads, the page is only the spinner and the footer, and it
  // inherits a stale scroll position: the one the browser restores on Back (e.g. from the 30-Day
  // Returns link) or the cart's. That leaves the footer on screen, and when the form renders in
  // above it the browser's scroll anchoring keeps the footer pinned — so the shopper lands at the
  // bottom while Free Gifts and Payment appear off-screen. Scrolling before paint, both on entry
  // and when the content first replaces the spinner, avoids that; at scrollTop 0 anchoring is off.
  // The Back restore lands after mount, so it is switched off for this history entry only — the
  // setting belongs to the entry that is current when it is set, so other pages keep theirs.
  const hasShownContentRef = useRef(false);
  useIsomorphicLayoutEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    return () => {
      window.history.scrollRestoration = previousRestoration;
    };
  }, []);
  useIsomorphicLayoutEffect(() => {
    if (showLoader || hasShownContentRef.current) {
      return;
    }
    hasShownContentRef.current = true;
    window.scrollTo(0, 0);
  }, [showLoader]);

  return showLoader ? (
    <div className="w-full flex justify-center items-center min-h-[80vh] bg-white-a700">
      <LuLoader className="h-10 w-10 animate-spin" />
    </div>
  ) : cartProducts?.length !== 0 || isPlacingOrder ? (
    <div className="bg-white-a700 w-full overflow-x-hidden">
      <div className="container-xs border-gray-800_01 flex justify-center border-b border-solid py-[60px] md:py-5 sm:py-4 overflow-x-hidden">
        <div className="mx-auto mb-5 flex w-full sm:flex-col [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:flex-col max-w-[1440px] items-start justify-center gap-8 md:gap-[20px] sm:gap-0 xl:px-28 lg:px-20 md:px-5 sm:px-3 overflow-x-hidden">
          <div className="flex w-[51%] sm:!w-full lg:w-[65%] flex-col md:!w-[50%] gap-5  sm:gap-3 [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:!w-full">
            <div className="container-xs flex justify-start ">
              <Stepper currentStep={currentStep} />
            </div>
            {/* Trust strip between the steps and the contact form — live Yotpo
                rating/review count, renders nothing if Yotpo is unavailable. */}
            <ReviewRatingStrip className="mt-1 sm:mt-0" />

            {/* The same strip the cart shows, in the same place — the main column, above the form.
                One instance at every width; the sidebar no longer carries a second, slimmer copy. */}
            {productsToDisplay?.length > 0 ? <FreeGiftProgress className="self-stretch" /> : null}
            <div className="flex flex-col py-5 sm:pb-0 gap-6 sm:gap-[10px] md:gap-[20px]">
              <SignIn
                isDeliveryAddress={isDeliveryAddress}
                setIsDeliveryAddress={setIsDeliveryAddress}
                setCurrentStep={setCurrentStep}
                onContactContinue={openBillingSection}
              />
              <div className="bg-gray-400 h-px" />

              <div id="checkout-billing-section">
                {currentStep >= 1 ? (
                  <BillingAddress
                    setPayment={setPayment}
                    setBillingAddress={setBillingAddressData}
                    setCurrentStep={setCurrentStep}
                    onAccountPasswordChange={setAccountPassword}
                    isActive={currentStep === 1}
                    onBillingEditStart={() => {
                      billingStepBeforeEditRef.current = currentStep;
                    }}
                    onBillingEditCancel={() => {
                      if (billingStepBeforeEditRef.current != null) {
                        setCurrentStep(billingStepBeforeEditRef.current);
                        billingStepBeforeEditRef.current = null;
                      }
                    }}
                    onBillingSaveSuccess={() => {
                      billingStepBeforeEditRef.current = null;
                    }}
                  />
                ) : (
                  <Text as="p" size="text5xl" className="text-black-900_7f font-normal uppercase opacity-30 lg:text-[34px] md:!text-[20px]">
                    billing address
                  </Text>
                )}
              </div>

              <div className="bg-gray-400 h-px " />
              <div id="checkout-delivery-section">
                {currentStep >= 2 ? (
                  <DeliveryAddress setShipping={setShipping} setCurrentStep={setCurrentStep} isActive={currentStep === 2} />
                ) : (
                  <Text as="p" size="text5xl" className="text-black font-normal uppercase opacity-30 lg:text-[34px]  md:!text-[20px]">
                    delivery address
                  </Text>
                )}
              </div>

              <div className="bg-gray-400 h-px " />

              <div id="checkout-payment-section">
                {currentStep >= 3 ? (
                  <div className="flex flex-col gap-6 sm:gap-4">
                    <Text as="p" size="text5xl" className="text-black font-normal uppercase lg:text-[22px] md:!text-[20px]">
                      payment
                    </Text>

                    <CheckoutPromoCode guestCartProducts={updatedCartProducts} />

                    <div className="bg-gray-400 h-px" />

                    <Payment
                      handlePlaceOrder={handlePlaceOrder}
                      error={paymentError}
                      cartProducts={productsToDisplay}
                      deliveryAddressId={updatedDeliveryAddress?.id}
                      billingAddressId={updatedbillingAddress?.id}
                      couponCode={couponData?.coupon_code}
                      isGuest={Boolean(user?.is_guest || guestDetails?.token)}
                      shippingDates={{ start: shippingDates?.[0], end: shippingDates?.[1] }}
                      guestCartData={productsToDisplay}
                      setIsPlacingOrder={setIsPlacingOrder}
                    />
                  </div>
                ) : (
                  <Text as="p" size="text5xl" className="text-black-900_7f font-normal uppercase opacity-30 lg:text-[34px] ">
                    payment
                  </Text>
                )}
              </div>
            </div>
          </div>

          {/* Portrait tablets stack the summary under the form, as on mobile — side by side each
              column is only ~350px at 768px, too narrow for the address and payment forms. */}
          <div className="w-[38%] lg:w-[47%] sm:mt-8 sm:w-full md:w-[50%] [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:mt-8 [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:w-full">
            {productsToDisplay?.length > 0 ? <OrderSummary cartProducts={productsToDisplay} promoCode={couponData?.coupon_code} /> : null}

            {/* What is being bought, straight under the total it produced. */}
            <div className="mt-2 mb-2 flex flex-col items-center gap-5 lg:gap-[20px] p-[30px] lg:p-5 sm:p-4 sm:px-3 bg-gray-50">
              <Text as="p" size="textxl" className="text-black-900 text-[22px] font-normal !font-sans uppercase tracking-[0.44px] lg:text-[18px]">
                Products
              </Text>
              {productsToDisplay?.map((product: any, index: number) => {
                const ringPrice = product?.ringSizePricingDetails?.rate ?? null;
                const couponItem = couponData?.items?.find((el: any) => el?.sku_details?.id === product?.sku_master_id);
                const is_customizable = product?.cartJewelryDetails?.is_customizable;
                const jewelryTypeName = product?.cartJewelryDetails?.jewelrySubType?.group;
                const jewelryTypeData = jewelryTypeName?.toLowerCase()?.replace(' ', '-');
                return (
                  <div className="flex flex-col self-stretch border-b border-gray-400 last:border-0" key={index}>
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <Image
                        src={product?.jewelry_sku?.carat_images?.[0] ? `${product?.jewelry_sku?.carat_images?.[0]}` : '/images/no_images.svg'}
                        alt="Product Image"
                        fallback="/images/no_images.svg"
                        width={120}
                        height={126}
                        preview={false}
                        className="!h-auto !w-[130px] border 2xl:w-1/3 2xl:h-auto md:h-auto !aspect-square md:object-contain !object-contain bg-white"
                      />
                      <div className=" flex flex-col gap-2  w-2/3">
                        <div className="flex flex-col gap-2">
                          <div className="grid grid-cols-3 justify-between gap-5">
                            <Link
                              href={
                                is_customizable
                                  ? `/custom-jewelry?type=2&state=c&id=${product?.jewelry_sku?.sku_slug}&did=${product?.diamondDetails?.id}`
                                  : `/${jewelryTypeData}/premade?slug=${product?.jewelry_sku?.sku_slug}&appraisal=${product?.is_appraisal}&warranty=${product?.is_warranty}${
                                      product?.selectedYearValue?.year || product?.warranty_year
                                        ? `&year=${product?.selectedYearValue?.year ?? product?.warranty_year}`
                                        : ''
                                    }`
                              }
                              onClick={() => {
                                const warrantyDetail = {
                                  warrantyName: `${product?.warranty_year} ${product?.warranty_amount}`,
                                  yearPrice: {
                                    year: product?.warranty_year,
                                    price: product?.warranty_amount,
                                  },
                                };

                                const appraisalDetail = {
                                  appraisalName: product?.appraisalDetails?.id ?? `product?.is_appraisal`,
                                  multipler: '',
                                  polish: '',
                                  price: product?.appraisal_amount,
                                  symmetry: '',
                                };
                                const engravingDetail = {
                                  fontFamily: product?.engravingText?.fontFamily,
                                  text: product?.engravingText?.Text,
                                };
                                dispatch(setSelectedAppraisal(appraisalDetail));
                                dispatch(setSelectedWarranty(warrantyDetail));
                                dispatch(setSelectedEngraving(engravingDetail));
                              }}
                              className="col-span-2"
                            >
                              <ProductName productName={product?.fullTitle} />
                            </Link>
                            <div className="flex flex-col col-span-1 items-end justify-start">
                              <Text
                                as="p"
                                size="textlg"
                                className={`!font-castoro text-right text-[18px] font-medium tracking-[0.40px] lg:text-[15px] ${
                                  product?.jewelry_sku?.discounted_price && product?.jewelry_sku?.discounted_price != 0
                                    ? 'line-through !text-gray-400 !text-[15px]'
                                    : ''
                                }`}
                              >
                                {/* Always the original selling price. A coupon does NOT strike this line —
                                    coupon savings are shown in the Applied Promocode / Total Price rows. */}
                                {formatCurrency(
                                  (couponData?.coupon_code
                                    ? couponItem?.sku_details?.selling_price + ringPrice
                                    : Math.ceil(product?.jewelry_sku?.selling_price + ringPrice)) +
                                    (product?.is_appraisal ? appraisalData?.price || 0 : 0) +
                                    (product?.selectedYearValue?.price
                                      ? product?.selectedYearValue?.price
                                      : product?.warranty_amount
                                        ? product?.warranty_amount
                                        : 0) +
                                    (product?.engravingText && product?.engravingText.Text != '' ? engraving?.data?.engraving_price : 0),
                                )}
                              </Text>
                              {/* Only a product-level flat/percentage discount is surfaced here as the
                                  struck-alternative price — never the coupon-discounted amount. */}
                              {product?.jewelry_sku?.discounted_price && product?.jewelry_sku?.discounted_price != 0 ? (
                                <Text
                                  as="p"
                                  size="textlg"
                                  className="!font-castoro text-right text-[18px] font-medium tracking-[0.40px] lg:text-[15px] sm:!text-[14px]"
                                >
                                  {formatCurrency(
                                    (couponData?.coupon_code
                                      ? couponItem?.sku_details?.discounted_price + ringPrice
                                      : Math.ceil(product?.jewelry_sku?.discounted_price + ringPrice)) +
                                      (product?.is_appraisal ? appraisalData?.price || 0 : 0) +
                                      (product?.selectedYearValue?.price
                                        ? product?.selectedYearValue?.price
                                        : product?.warranty_amount
                                          ? product?.warranty_amount
                                          : 0) +
                                      (product?.engravingText && product?.engravingText.Text != '' ? engraving?.data?.engraving_price : 0),
                                  )}
                                </Text>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex flex-col items-start">
                            <Text as="p" size="textmd" className="text-stone-400 text-[16px] !font-sans font-light tracking-[0.36px] lg:text-[12px]">
                              {product?.cartJewelryDetails?.jewelrySubType?.group}
                            </Text>
                            <Text as="p" size="textmd" className="text-stone-400 text-[16px] !font-sans font-light tracking-[0.36px]">
                              {master.find((item: any) => item.id === product?.jewelry_sku?.metal_color_id)?.name}
                            </Text>
                            <Text as="p" size="textmd" className="text-stone-400 text-[16px] !font-sans font-light capitalize tracking-[0.36px]">
                              {master &&
                                master?.find((el: any) => {
                                  const diamondId =
                                    product?.jewelry_sku?.center_diamond_id ??
                                    product?.jewelry_sku?.accent_diamond_id ??
                                    product?.jewelry_sku?.second_accent_diamond_id ??
                                    product?.jewelry_sku?.metal_id;

                                  return el?.id === diamondId;
                                })?.group}
                              {' | '}
                              {master && master.find((item: any) => item.id === product?.jewelry_sku?.metal_type_id)?.name}
                            </Text>
                            {product?.ringSizePricingDetails && (
                              <Text as="p" size="textmd" className="text-stone-400 text-[16px] !font-sans font-light capitalize tracking-[0.36px]">
                                Ring Size : {master.find((item: any) => item.id === product?.ringSizePricingDetails?.ring_size_id)?.name}
                              </Text>
                            )}
                            {product?.jewelry_sku?.bracelet_length_ids && (
                              <Text as="p" size="textmd" className="text-stone-400 text-[16px] !font-sans font-light capitalize tracking-[0.36px]">
                                Bracelet Length: {master.find((item: any) => item.id === product?.jewelry_sku?.bracelet_length_ids)?.name}
                              </Text>
                            )}
                            {product?.jewelry_sku?.band_width_ids && (
                              <Text as="p" size="textmd" className="text-stone-400 text-[16px] !font-sans font-light tracking-[0.36px]">
                                Band Width - mm: {master.find((item: any) => item.id === product?.jewelry_sku?.band_width_ids)?.name}
                              </Text>
                            )}
                            {product?.is_appraisal && (
                              <Text as="p" size="textmd" className="text-stone-400 text-[16px] !font-sans font-light capitalize tracking-[0.36px]">
                                Appraisal Price: <span className="font-bold">{formatCurrency(appraisalData?.price)}</span>
                              </Text>
                            )}
                            {(product?.selectedYearValue || product?.is_warranty) && (
                              <Text as="p" size="textmd" className="text-stone-400 text-[16px] !font-sans font-light capitalize tracking-[0.36px]">
                                Warranty: {product?.selectedYearValue?.year ? product?.selectedYearValue?.year : product?.warranty_year} Year (+
                                <span className="font-bold">
                                  {product?.selectedYearValue?.price
                                    ? formatCurrency(product?.selectedYearValue?.price)
                                    : formatCurrency(product?.warranty_amount)}
                                </span>
                                )
                              </Text>
                            )}
                            {product?.engravingText && product?.engravingText.Text != '' && (
                              <>
                                <Text as="p" size="textmd" className="text-stone-400 text-[16px] !font-sans font-light capitalize tracking-[0.36px]">
                                  Engraving Text:{' '}
                                  <span style={{ fontFamily: product?.engravingText?.fontFamily }}>{product?.engravingText.Text}</span>
                                </Text>
                                <Text as="p" size="textmd" className="text-stone-400 text-[16px] !font-sans font-light capitalize tracking-[0.36px]">
                                  Engraving Font Family: {product?.engravingText.fontFamily}
                                </Text>
                                <Text as="p" size="textmd" className="text-stone-400 text-[16px] !font-sans font-light capitalize tracking-[0.36px]">
                                  Engraving Price: <span className="font-bold"> {formatCurrency(engraving?.data?.engraving_price ?? 0)}</span>
                                </Text>
                              </>
                            )}
                          </div>
                        </div>
                        {product?.diamondDetails && (
                          <div className="flex flex-col gap-3 mt-2">
                            <div className="bg-gray-400 h-px" />
                            <div className="flex flex-col gap-1 items-start justify-center">
                              <div className="grid grid-cols-3 w-full">
                                <div className="col-span-2">
                                  <ProductName productName={product?.diamondDetails?.fullTitle} />
                                </div>
                                <p className="!font-castoro text-[18px] col-span-1 text-right tracking-[0.2px] !text-black lg:!text-[15px] md:!text-[15px] sm:!text-[14px]">
                                  {formatCurrency(product?.diamondDetails?.price)}
                                </p>
                              </div>
                              <div className="w-[30px] aspect-square">
                                <Image
                                  src={
                                    master.find((item: any) => item?.name === product?.diamondDetails?.shape_name && item?.parent_code == 'SHAPE')
                                      ?.image?.[0]
                                  }
                                  preview={false}
                                  className="aspect-square object-contain"
                                  fallback="/images/no_images.svg"
                                  alt={product?.diamondDetails?.shape_name}
                                />
                              </div>
                              <div>
                                <p className="text-[16px] tracking-[0.20px] text-stone-400 sm:!text-[12px]">
                                  Clarity: {product?.diamondDetails?.clr}
                                </p>
                                <p className="text-[16px] tracking-[0.20px] text-stone-400 sm:!text-[12px]">Color: {product?.diamondDetails?.col}</p>
                                <p className="text-[16px] tracking-[0.20px] text-stone-400 sm:!text-[12px]">
                                  Shape: {product?.diamondDetails?.shape_name}
                                </p>
                                <p className="text-[16px] tracking-[0.20px] text-stone-400 sm:!text-[12px]">
                                  {product?.diamondDetails?.diamond_type == 2 ? 'Lab Grown Diamond' : 'Natural Diamond'}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* The gift is read-only here — colour and ring size are settled in the cart,
                  so checkout only confirms what is being shipped. */}
              <FreeGiftItem readOnly />
            </div>

            {/* The rail follows the order itself: once the shopper has read what they are buying
                and what it costs, these answer when it lands and what backs it. */}
            {productsToDisplay?.length > 0 ? <AssurancePanel cartProducts={productsToDisplay} className="!pt-5 mb-5" /> : null}
          </div>
        </div>
      </div>
    </div>
  ) : null;
}
