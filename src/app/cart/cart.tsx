/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Button, ConfigProvider, Drawer, Input } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LuGem, LuLoader, LuLock, LuMessageSquare, LuMonitor, LuRotateCcw, LuShieldCheck, LuTag, LuTruck } from 'react-icons/lu';

import FreeGiftItem from '@/components/FreeGiftItem';
import FreeGiftProgress from '@/components/FreeGiftProgress';
import OrderSummary, { useCurrencyCode, useOrderTotals } from '@/components/OrderSummary';
import ReviewRatingStrip from '@/components/ReviewRatingStrip';
import * as ga4 from '@/lib/analytics';
import { apiUpdateCartItem, apiUpdateCountCartProduct } from '@/services/cartService';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  clearCouponData,
  fetchCartProductsList,
  fetchLocalCartProductsList,
  fetchRemoveProduct,
  restoreAppliedCoupon,
  setCartProducts,
  verifyCoupon,
} from '@/store/slices/Cart/cartSlice';
import { clearFreeGift, evaluateFreeGift, forgetGiftDecline } from '@/store/slices/Cart/freeGiftSlice';
import { formatCurrency } from '@/utils/common';

import CartItem from './CartItem';
import PayPalExpressButton from './PayPalExpressButton';
import ShopPayExpressButton from './ShopPayExpressButton';
import CheckoutSteps from '../checkout/CheckoutSteps';
import { checkoutTheme, GUTTER, PRIMARY_BTN } from '../checkout/checkoutTheme';
import OurBestSellers from '../homepage/OurBestSellers';

const ASSURANCES = [
  { icon: LuGem, title: 'Certified diamonds', text: 'Lab-grown and ethically mined, certified at origin.' },
  { icon: LuShieldCheck, title: 'Secure payment', text: 'Card details are encrypted and never stored.' },
  { icon: LuTruck, title: 'Insured shipping', text: 'Every order ships fully insured. Shipping is added at checkout.' },
  { icon: LuRotateCcw, title: '30-day returns', text: 'Refund or exchange within 30 days of shipment.' },
];
const PAYMENT_MARKS = ['VISA', 'MASTERCARD', 'AMEX', 'DISCOVER', 'PAYPAL', 'AFFIRM · US'];

const Cart = () => {
  const route = useRouter();
  const dispatch = useAppDispatch();
  const { user, token } = useAppSelector((state) => state.auth.auth);
  const { cartProducts, loading, couponData } = useAppSelector((state) => state?.cart);
  const giftJustRemoved = useAppSelector((state: any) => state?.freeGift?.giftJustRemoved);
  // A ring gift cannot be made without a size, so checkout is blocked until one is chosen —
  // unless the gift was turned down, in which case there is nothing to size and the block
  // would be a dead end (the picker it points at is no longer on screen).
  const giftNeedsRingSize = useAppSelector((state: any) => Boolean(state?.freeGift?.gift?.needs_ring_size) && !state?.freeGift?.declined);
  const [showGiftRingSizeError, setShowGiftRingSizeError] = useState(false);
  const [reload, setReload] = useState(false);
  const [loader, setLoader] = useState(true);
  // The applied promo code. Starts from any code already verified this session.
  const [promoCode, setPromoCode] = useState<string>(couponData?.coupon_code ?? '');
  const [codeInput, setCodeInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [applying, setApplying] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [showMessagingTermsError, setShowMessagingTermsError] = useState(false);
  const messagingTermsSectionRef = useRef<HTMLDivElement>(null);
  const giftSectionRef = useRef<HTMLDivElement>(null);
  const [cartListFromLocalStorage, setCartListFromLocalStorage] = useState([]);
  const getSkuId = (item: any) => item?.sku_master_id ?? item?.sku_master;
  const getRingSizeKey = (item: any) => item?.ring_size_id ?? item?.ringSizePricingDetails?.id ?? null;
  const currency = useCurrencyCode();

  useEffect(() => {
    const cartData = localStorage.getItem('cartItems');
    if (cartData) {
      setCartListFromLocalStorage(JSON.parse(cartData));
    }
  }, []);
  const updatedCartProducts = cartProducts?.map((product: any) => {
    const match: any = cartListFromLocalStorage?.find((item: any) => {
      const productSku = getSkuId(product);
      const localSku = getSkuId(item);
      const productRing = getRingSizeKey(product);
      const localRing = getRingSizeKey(item);
      if (productRing) {
        // For rings, match both sku and ring-size key
        return localSku === productSku && localRing === productRing;
      }
      // For other jewelry, match only sku key
      return localSku === productSku;
    });
    if (match) {
      return {
        ...product,
        is_appraisal: match?.is_appraisal ?? product?.is_appraisal,
        engravingText: match?.engravingText ?? product?.engravingText,
        is_warranty: product?.is_warranty,
        selectedYearValue: product?.is_warranty ? { year: product?.warranty_year, price: product?.warranty_amount } : null,
      };
    }
    return product;
  });
  const totals = useOrderTotals(updatedCartProducts ?? [], promoCode);

  const addToCartTracked = useRef(false);
  useEffect(() => {
    if (!addToCartTracked.current && cartProducts?.length > 0) {
      addToCartTracked.current = true;
      const value = cartProducts.reduce((sum: number, item: any) => {
        const price = item?.jewelry_sku?.discounted_price || item?.jewelry_sku?.selling_price || 0;
        const ringPrice = item?.ringSizePricingDetails?.rate ?? 0;
        const count = item?.count ?? 1;
        return sum + (Number(price) + Number(ringPrice)) * count;
      }, 0);
      // DAZZBLISS TODO: conversion label below is the old client's; replace with Dazzbliss's. Off until NEXT_PUBLIC_GOOGLE_ADS_ID is set.
      if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_NODE_ENV === 'production' && process.env.NEXT_PUBLIC_GOOGLE_ADS_ID) {
        (window as any).gtag?.('event', 'conversion', {
          send_to: 'AW-17230998076/188qCKWFqYAcELzUsJhA',
          value: value,
          currency: 'USD',
        });
      }
      // GA4 view_cart
      const ga4Cart = ga4.mapCartItemsToGA4(cartProducts);
      ga4.viewCart(ga4Cart);
    }
  }, [cartProducts]);

  const UpdateCartAPI = async () => {
    if (user) {
      await apiUpdateCountCartProduct(updatedCartProducts);
    }
  };

  // The gift's size picker is far up the page from the checkout button, so the message beside
  // the button is easy to miss — and it points at a control the shopper cannot see. Surfacing
  // the error also takes them to the card that carries it, where the same message repeats
  // under the picker itself.
  const flagGiftRingSize = () => {
    setShowGiftRingSizeError(true);
    setTimeout(() => {
      giftSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }, 0);
  };

  const handleCheckout = async () => {
    if (giftNeedsRingSize) {
      flagGiftRingSize();
      return;
    }
    setShowGiftRingSizeError(false);
    if (!isChecked) {
      setShowMessagingTermsError(true);
      setTimeout(() => {
        messagingTermsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      }, 0);
      return;
    }
    setShowMessagingTermsError(false);
    if (token) {
      await UpdateCartAPI();
    }
    route.push('/checkout');
  };
  // Gate used by the PayPal Express button: require the messaging-terms checkbox just like
  // the standard checkout button. Returns false (and surfaces the error + scroll) when not met.
  const canStartExpressCheckout = () => {
    if (giftNeedsRingSize) {
      flagGiftRingSize();
      return false;
    }
    setShowGiftRingSizeError(false);
    if (!isChecked) {
      setShowMessagingTermsError(true);
      setTimeout(() => {
        messagingTermsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      }, 0);
      return false;
    }
    setShowMessagingTermsError(false);
    return true;
  };

  // For logged-in users, sync cart quantities to the DB before starting PayPal Express so the
  // amount PayPal authorizes matches what the backend re-prices from the DB cart at capture.
  const syncCartBeforeExpress = async () => {
    if (token) {
      await UpdateCartAPI();
    }
  };

  const handleApplyCoupon = async () => {
    const code = codeInput.trim();
    if (!code) {
      setErrorMessage('Enter a code to apply it.');
      return;
    }
    setApplying(true);
    try {
      const res = await dispatch(verifyCoupon({ coupon_code: code, ...(!user ? { updatedCartProducts } : {}) }));
      if (res.payload?.status === 200) {
        setErrorMessage('');
        setPromoCode(code);
        setCodeInput('');
        setDrawerOpen(false);
      } else {
        setErrorMessage(res.payload?.response?.data?.message || `We couldn't find “${code}”. Check the spelling and try again.`);
      }
    } catch (error) {
      console.error('Error verifying coupon:', error);
      setErrorMessage('Something went wrong. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  const removeCoupon = () => {
    setPromoCode('');
    setErrorMessage('');
    dispatch(clearCouponData());
  };

  const handleLocalCartProducts = () => {
    const cartData = localStorage.getItem('cartItems');
    const cartList = cartData ? JSON.parse(cartData) : [];
    if (cartList?.length > 0) {
      dispatch(fetchLocalCartProductsList({ data: cartList }));
    }
  };
  useEffect(() => {
    if (user) {
      dispatch(fetchCartProductsList());
    } else {
      handleLocalCartProducts();
    }
    setLoader(false);
  }, [user, reload]);

  // Same restore as checkout: a reload of the cart page emptied `couponData` too, so the code
  // came back off in the summary and the gift bar jumped. Re-verified, never trusted.
  //
  // Keyed on the cart rather than run once per mount: the first attempt can land before the
  // lines are loaded, and a one-shot flag would leave the shopper couponless until they
  // reloaded again.
  const couponRestoreKey = useRef('');
  useEffect(() => {
    const key = `${user?.id ?? 'guest'}:${cartProducts?.length ?? 0}`;
    if (loader || couponData?.coupon_code || !cartProducts?.length || couponRestoreKey.current === key) {
      return;
    }
    couponRestoreKey.current = key;
    dispatch(restoreAppliedCoupon({ updatedCartProducts }));
  }, [loader, cartProducts?.length, couponData?.coupon_code, user?.id]);

  // Free Gift Above X Amount. Re-evaluated when the cart contents change *or* the promo code
  // does — the threshold is judged on what the shopper pays, so a code can move it and the
  // strip must not be left claiming a gift the order flow would refuse to write. Eligibility is
  // computed server-side from the referenced SKUs; the lines are sent for their identifiers only.
  useEffect(() => {
    if (loader) {
      return;
    }
    if (!cartProducts?.length) {
      // An empty cart is never evaluated, so this is the one path where a stored refusal cannot
      // expire on its own. Dropping it here keeps a "no thanks" from following the shopper into
      // their next order — and the same goes for the remembered promo code, which would
      // otherwise re-apply itself to whatever they buy next.
      forgetGiftDecline();
      dispatch(clearCouponData());
      dispatch(clearFreeGift());
      return;
    }
    dispatch(evaluateFreeGift({ cartProducts: updatedCartProducts, couponCode: couponData?.coupon_code ?? null }));
  }, [cartProducts, loader, couponData?.coupon_code]);

  const handleRemoveProducts = async (productDetails: any, index: number) => {
    const cartData = localStorage.getItem('cartItems');
    const cartList = cartData ? JSON.parse(cartData) : [];
    if (cartList.length > 0) {
      cartList.splice(index, 1);
      localStorage.setItem('cartItems', JSON.stringify(cartList));
      dispatch(fetchLocalCartProductsList({ data: cartList }));
      setReload(!reload);
    } else {
      const response = await dispatch(fetchRemoveProduct(productDetails.id));
      if (response?.payload?.status === 200) {
        dispatch(fetchCartProductsList());
      }
    }
  };

  const handleCount = useCallback(
    async (values: any) => {
      if (cartProducts && cartProducts.length > 0) {
        const nextProducts = cartProducts.map((item: any) => {
          if (item?.ringSizePricingDetails?.id) {
            // For rings, match both sku_master_id and ring_size_id
            return item.sku_master_id === values.sku_master_id && item.ringSizePricingDetails?.id === values.ring_size_id
              ? { ...item, count: values.count }
              : item;
          }
          return item.sku_master_id === values.sku_master_id ? { ...item, count: values.count } : item;
        });
        dispatch(setCartProducts(nextProducts));
        if (!user) {
          const cartData = localStorage.getItem('cartItems');
          const cartList = cartData ? JSON.parse(cartData) : [];
          const updatedCartList = cartList.map((item: any) => {
            const localSku = getSkuId(item);
            const localRing = getRingSizeKey(item);
            if (localRing) {
              return localSku === values.sku_master_id && localRing === values.ring_size_id ? { ...item, count: values.count } : item;
            }
            return localSku === values.sku_master_id ? { ...item, count: values.count } : item;
          });
          localStorage.setItem('cartItems', JSON.stringify(updatedCartList));
        }
      } else if (!token) {
        localStorage.setItem('cartItems', JSON.stringify([]));
      }
    },
    [user, cartProducts, dispatch],
  );

  // Edit the ring size of an already-added cart line.
  // `ringSizeId` is the RingSizePricing row id (what the backend/localStorage stores),
  // `ringSizeLabel` is the human-readable size (e.g. "7").
  const handleUpdateRingSize = useCallback(
    async (item: any, ringSizeId: string | number | null, ringSizeLabel?: string) => {
      const currentRingKey = getRingSizeKey(item);
      if (currentRingKey && String(currentRingKey) === String(ringSizeId)) {
        return; // no change
      }
      if (user) {
        const response: any = await apiUpdateCartItem({ id: item?.id, ring_size_id: ringSizeId, ring_size: ringSizeLabel ?? null });
        if (response?.data?.status === 200 || response?.status === 200) {
          dispatch(fetchCartProductsList());
        }
      } else {
        const cartData = localStorage.getItem('cartItems');
        const cartList = cartData ? JSON.parse(cartData) : [];
        const idx = cartList.findIndex((el: any) => getSkuId(el) === getSkuId(item) && String(getRingSizeKey(el)) === String(currentRingKey));
        if (idx > -1) {
          cartList[idx] = { ...cartList[idx], ring_size_id: ringSizeId };
          localStorage.setItem('cartItems', JSON.stringify(cartList));
          setCartListFromLocalStorage(cartList);
          // Re-hydrate so the server recomputes ringSizePricingDetails (rate) for the new size.
          dispatch(fetchLocalCartProductsList({ data: cartList }));
        }
      }
    },
    [user, dispatch],
  );

  // Add / edit / clear the custom engraving of an already-added cart line.
  // Pass `{ Text: '', ... }` (empty text) to remove the engraving.
  const handleUpdateEngraving = useCallback(
    async (item: any, engravingText: { Text: string; fontFamily: string }) => {
      const cleaned = {
        Text: (engravingText?.Text ?? '').trim().slice(0, 20),
        fontFamily: engravingText?.fontFamily || 'Arial',
      };
      if (user) {
        const response: any = await apiUpdateCartItem({ id: item?.id, engravingText: cleaned });
        if (response?.data?.status === 200 || response?.status === 200) {
          dispatch(fetchCartProductsList());
        }
      } else {
        const cartData = localStorage.getItem('cartItems');
        const cartList = cartData ? JSON.parse(cartData) : [];
        const currentRingKey = getRingSizeKey(item);
        const idx = cartList.findIndex((el: any) => {
          const skuMatch = getSkuId(el) === getSkuId(item);
          return currentRingKey ? skuMatch && String(getRingSizeKey(el)) === String(currentRingKey) : skuMatch;
        });
        if (idx > -1) {
          cartList[idx] = { ...cartList[idx], engravingText: cleaned };
          localStorage.setItem('cartItems', JSON.stringify(cartList));
          setCartListFromLocalStorage(cartList);
          dispatch(fetchLocalCartProductsList({ data: cartList }));
        }
      }
    },
    [user, dispatch],
  );

  // The summary applies a coupon only when `promoCode` matches the verified code in redux. Keep the
  // two in step so a code restored by `restoreAppliedCoupon` (or cleared by an emptied cart)
  // is reflected in the totals and the promo row.
  useEffect(() => {
    setPromoCode(couponData?.coupon_code ?? '');
  }, [couponData?.coupon_code]);

  const pieceCount = updatedCartProducts?.reduce((s: number, p: any) => s + (Number(p?.count) || 1), 0) ?? 0;
  const hasItems = !loader && !loading && cartProducts?.length > 0;
  const isEmpty = !loader && !loading && cartProducts?.length == 0;

  return (
    <ConfigProvider theme={checkoutTheme}>
      <div className={`bg-paper font-libre text-[14px] leading-[1.55] text-ink antialiased ${GUTTER} ${hasItems ? 'sm:pb-24' : ''}`}>
        {/* Title row */}
        <div className="flex flex-wrap items-end justify-between gap-6 pb-[30px] pt-10 sm:pb-5 sm:pt-6">
          <div>
            <nav aria-label="Breadcrumb" className="mb-4 flex gap-2.5 text-[11px] uppercase tracking-[0.14em] text-ink-soft">
              <Link href="/" className="text-ink-soft hover:text-ink">
                Home
              </Link>
              <span aria-hidden className="text-line">
                /
              </span>
              <span aria-current="page">Bag</span>
            </nav>
            <h1 className="m-0 font-cormorant text-[clamp(44px,5.6vw,80px)] font-normal leading-[0.92] tracking-[-0.01em]">
              Your <em className="italic text-gilt">Bag</em>
              {hasItems && (
                <small className="ml-2.5 align-super font-libre text-[12px] uppercase not-italic tracking-[0.14em] text-ink-soft">
                  {pieceCount} {pieceCount === 1 ? 'piece' : 'pieces'}
                </small>
              )}
            </h1>
          </div>
          {hasItems && <CheckoutSteps current="bag" />}
        </div>

        {(loading || loader) && (
          <div className="flex min-h-[50vh] items-center justify-center">
            <LuLoader className="h-10 w-10 animate-spin text-ink" />
          </div>
        )}

        {hasItems && (
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(320px,410px)] items-start gap-[clamp(28px,4vw,64px)] pb-20 lg:grid-cols-1">
            <section aria-label="Pieces in your bag">
              {!user && (
                <div className="flex flex-wrap items-center justify-between gap-4 border-y border-line py-3.5 text-[13px] text-ink-soft">
                  <span>
                    <Link href="/login?callbackUrl=cart" className="text-ink underline underline-offset-[3px]">
                      Sign in
                    </Link>{' '}
                    to save your bag across devices.
                  </span>
                  <span className="tabular-nums">Prices in {currency}</span>
                </div>
              )}
              <FreeGiftProgress className="mt-4" />

              {/* Stays until the next evaluation clears it — i.e. until the shopper changes the
                  cart again. Losing a gift silently is the confusing case, not seeing it twice. */}
              {giftJustRemoved && (
                <p role="status" className="m-0 mt-4 bg-stone px-4 py-3 text-[12.5px] text-danger">
                  Your bag no longer qualifies for the free gift, so it has been removed.
                </p>
              )}

              <ul className="m-0 list-none p-0">
                {updatedCartProducts?.map((d: any, index: number) => (
                  <CartItem
                    key={`${d?.id ?? d?.sku_master_id}-${index}`}
                    index={index}
                    productDetails={d}
                    handleCount={handleCount}
                    handleRemoveProducts={handleRemoveProducts}
                    handleUpdateRingSize={handleUpdateRingSize}
                    handleUpdateEngraving={handleUpdateEngraving}
                  />
                ))}
              </ul>

              {/* The gift is derived state, so it renders after the real cart lines and is
                  not part of the mapped list. */}
              <div ref={giftSectionRef} className="scroll-mt-24">
                <FreeGiftItem cartProducts={updatedCartProducts} />
              </div>

              <div className="mt-7 grid gap-3 border border-line px-6 py-[22px]">
                <h3 className="m-0 flex items-center gap-2.5 font-cormorant text-[22px] font-medium">
                  <LuMessageSquare className="h-5 w-5" aria-hidden />
                  Need advice?
                </h3>
                <p className="m-0 text-[13px] text-ink-soft">Our jewelry specialists can help with sizing, stones and delivery to your country.</p>
                <div className="flex flex-wrap gap-x-6 gap-y-2.5 text-[13px]">
                  <Link href="/virtual-appointment" className="flex items-center gap-2.5 text-ink hover:text-gilt">
                    <LuMonitor className="h-[18px] w-[18px]" aria-hidden />
                    Book a virtual appointment
                  </Link>
                  <Link href="/contactpage" className="flex items-center gap-2.5 text-ink hover:text-gilt">
                    <LuMessageSquare className="h-[18px] w-[18px]" aria-hidden />
                    Contact a specialist
                  </Link>
                </div>
              </div>
              <p className="mb-0 mt-[22px]">
                <Link href="/all" className="text-[11px] uppercase tracking-[0.12em] text-ink-soft underline underline-offset-4 hover:text-ink">
                  ← Continue shopping
                </Link>
              </p>
            </section>

            <aside aria-label="Order summary" className="sticky top-6 grid border border-line bg-paper lg:static">
              <div className="grid gap-[18px] px-7 py-[26px] sm:px-5">
                <h2 className="m-0 font-cormorant text-[30px] font-normal leading-none">Order summary</h2>
                {totals.couponCode ? (
                  <div className="flex items-center justify-between gap-3 bg-stone px-3.5 py-3">
                    <div className="flex items-center gap-2.5 text-[12px] font-semibold tracking-[0.14em]">
                      <LuTag className="h-[15px] w-[15px] text-gilt" aria-hidden />
                      <div>
                        {totals.couponCode}
                        {couponData?.coupon_description && (
                          <small className="mt-0.5 block text-[12px] font-normal tracking-normal text-ink-soft">
                            {couponData.coupon_description}
                          </small>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-[11px] uppercase tracking-[0.12em] text-ink-soft underline underline-offset-4 hover:text-ink"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(true)}
                    className="flex w-full items-center gap-2.5 border border-dashed border-line-strong px-4 py-3.5 text-left text-[12px] uppercase tracking-[0.12em] transition-colors hover:border-ink"
                  >
                    <LuTag className="h-4 w-4" aria-hidden />
                    Add a promo code
                  </button>
                )}
                <OrderSummary cartProducts={updatedCartProducts} promoCode={promoCode} showAffirm />
                {/* Messaging-terms consent gates both the checkout button and the express buttons. */}
                <div ref={messagingTermsSectionRef} id="cart-messaging-terms-section" className="scroll-mt-24 sm:scroll-mt-20">
                  <label htmlFor="checkoutCondition" className="flex cursor-pointer items-start gap-2.5 text-[11.5px] leading-[1.5] text-ink-soft">
                    <input
                      id="checkoutCondition"
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        if (checked) {
                          setShowMessagingTermsError(false);
                        }
                        setIsChecked(checked);
                      }}
                      className="mt-0.5 h-4 w-4 flex-none rounded-none border-line-strong text-ink focus:ring-ink"
                    />
                    <span>
                      By checking this box, you agree to receive automated personalized text messages (e.g. cart reminders, shipping updates, and
                      tracking info) from Pendyora. Reply HELP for help and STOP to cancel.{' '}
                      <Link href="/terms-and-conditions" className="underline">
                        View Terms &amp; Privacy
                      </Link>
                      .
                    </span>
                  </label>
                  {showMessagingTermsError && !isChecked && (
                    <p role="alert" className="m-0 mt-1.5 text-[12px] text-danger">
                      Please confirm the messaging terms to continue.
                    </p>
                  )}
                </div>
                <Button type="default" loading={loading} disabled={loading} onClick={handleCheckout} className={`${PRIMARY_BTN} !h-[52px] w-full`}>
                  <LuLock className="h-[15px] w-[15px]" aria-hidden /> Secure checkout
                </Button>
                {showGiftRingSizeError && giftNeedsRingSize && (
                  <p role="alert" className="m-0 -mt-2 text-[12px] text-danger">
                    Please choose a ring size for your free gift to continue.
                  </p>
                )}

                {/* Express checkout — Shop Pay and PayPal share one row under a single "or" divider.
                    Both collect address and payment in their own window and skip the checkout page,
                    behind the same consent/ring-size gate as the button above. Shop Pay hides itself
                    when it is not configured, and `empty:hidden` then gives PayPal the full row. */}
                {process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-line" />
                      <span className="text-[10.5px] uppercase tracking-[0.16em] text-ink-soft">or</span>
                      <div className="h-px flex-1 bg-line" />
                    </div>
                    <div className="flex items-start gap-3">
                      {/* `[&>div>.my-3]:hidden` hides Shop Pay's own built-in "or" divider — the row
                          already has one above it. */}
                      <div className="flex-1 min-w-0 empty:hidden [&>div>.my-3]:hidden">
                        <ShopPayExpressButton
                          cartProducts={updatedCartProducts}
                          couponCode={couponData?.coupon_code}
                          canStart={canStartExpressCheckout}
                          onBeforeCreate={syncCartBeforeExpress}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <PayPalExpressButton
                          cartProducts={updatedCartProducts}
                          couponCode={couponData?.coupon_code}
                          isConsented={isChecked && !giftNeedsRingSize}
                          onConsentMissing={canStartExpressCheckout}
                          onBeforeCreate={syncCartBeforeExpress}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <ShopPayExpressButton
                    cartProducts={updatedCartProducts}
                    couponCode={couponData?.coupon_code}
                    canStart={canStartExpressCheckout}
                    onBeforeCreate={syncCartBeforeExpress}
                  />
                )}

                {/* Trust strip — live Yotpo rating/review count; renders nothing if Yotpo is unavailable. */}
                <ReviewRatingStrip />
              </div>
              <div className="grid gap-3 border-t border-line bg-stone/45 px-7 py-5 sm:px-5">
                {ASSURANCES.map(({ icon: Icon, title, text }) => (
                  <div key={title} className="grid grid-cols-[20px_1fr] items-start gap-3 text-[12.5px]">
                    <Icon className="h-[18px] w-[18px] text-gilt" aria-hidden />
                    <p className="m-0">
                      <b className="block font-medium text-ink">{title}</b>
                      <span className="text-ink-soft">{text}</span>
                    </p>
                  </div>
                ))}
                <div className="flex flex-wrap gap-1.5 pt-1" aria-label="Accepted payment methods">
                  {PAYMENT_MARKS.map((m) => (
                    <span key={m} className="border border-line bg-paper px-[7px] py-1 text-[9.5px] font-semibold tracking-[0.08em] text-ink-soft">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        )}

        {isEmpty && (
          <>
            <div className="grid justify-items-center gap-3.5 pb-16 pt-6 text-center">
              <h2 className="m-0 font-cormorant text-[clamp(40px,5vw,64px)] font-normal leading-none">
                Your bag is <em className="italic text-gilt">empty</em>
              </h2>
              <p className="m-0 max-w-[46ch] text-ink-soft">
                Nothing here yet. Start with our newest pieces, or ask a specialist to help you choose.
              </p>
              <div className="mt-2.5 flex flex-wrap justify-center gap-2.5">
                <Link
                  href="/new-arrivals"
                  className="inline-flex h-12 items-center bg-ink px-8 text-[11px] uppercase tracking-[0.18em] text-paper hover:bg-ink-hover hover:text-paper"
                >
                  Shop new arrivals
                </Link>
                <Link
                  href="/virtual-appointment"
                  className="inline-flex h-12 items-center border border-ink px-7 text-[11px] uppercase tracking-[0.18em] text-ink hover:bg-ink hover:text-paper"
                >
                  Book a virtual appointment
                </Link>
              </div>
            </div>
            <OurBestSellers />
          </>
        )}

        {/* Mobile total + checkout */}
        {hasItems && (
          <div className="fixed inset-x-0 bottom-0 z-30 hidden items-center justify-between gap-3.5 border-t border-line bg-paper px-4 pb-[calc(12px+env(safe-area-inset-bottom,0px))] pt-3 sm:flex">
            <div className="grid leading-tight">
              <small className="text-[10.5px] uppercase tracking-[0.14em] text-ink-soft">Total</small>
              <strong className="font-cormorant text-[24px] font-medium tabular-nums">{formatCurrency(totals.total)}</strong>
            </div>
            <Button type="default" onClick={handleCheckout} disabled={loading} className={PRIMARY_BTN}>
              Checkout
            </Button>
          </div>
        )}

        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          placement="right"
          width="min(460px, 100vw)"
          closeIcon={null}
          title={<span className="font-cormorant text-[26px] font-medium text-ink">Promo codes</span>}
          extra={
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="bg-ink px-3.5 py-2 text-[10.5px] uppercase tracking-[0.18em] text-paper"
            >
              Close
            </button>
          }
          classNames={{ header: '!border-line !px-7 !py-[22px] sm:!px-[18px]', body: '!px-7 !py-6 sm:!px-[18px]' }}
        >
          <form
            noValidate
            className="grid gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void handleApplyCoupon();
            }}
          >
            <label htmlFor="promo-code" className="sr-only">
              Promo code
            </label>
            <div className="flex">
              <Input
                id="promo-code"
                autoComplete="off"
                value={codeInput}
                onChange={(e) => {
                  setCodeInput(e.target.value);
                  if (errorMessage) {
                    setErrorMessage('');
                  }
                }}
                placeholder="Enter a promo code"
                status={errorMessage ? 'error' : undefined}
                className="!border-r-0 uppercase tracking-[0.12em] placeholder:normal-case placeholder:tracking-normal"
              />
              <Button htmlType="submit" loading={applying} className={`${PRIMARY_BTN} !px-6`}>
                Apply
              </Button>
            </div>
            {errorMessage && (
              <p role="alert" className="m-0 text-[12.5px] text-danger">
                {errorMessage}
              </p>
            )}
            <p className="m-0 text-[12px] text-ink-soft">One promo code per order.</p>
          </form>
        </Drawer>
      </div>
    </ConfigProvider>
  );
};

export default Cart;
