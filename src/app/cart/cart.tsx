/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';

import { Button, Input } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LuLoader, LuShoppingBag, LuTruck, LuRotateCcw } from 'react-icons/lu';

import { Text } from '@/components';
import CartProductDetails from '@/components/CartProductDetails';
import { AssurancePanel } from '@/components/CheckoutAssurance';
import FreeGiftItem from '@/components/FreeGiftItem';
import FreeGiftProgress from '@/components/FreeGiftProgress';
import OrderSummary from '@/components/OrderSummary';
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

import PayPalExpressButton from './PayPalExpressButton';
import ShopPayExpressButton from './ShopPayExpressButton';
import OurBestSellers from '../homepage/OurBestSellers';

const Cart = () => {
  const route = useRouter();
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
  const [promoCode, setPromoCode] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isChecked, setIsChecked] = useState(false);
  const [showMessagingTermsError, setShowMessagingTermsError] = useState(false);
  const messagingTermsSectionRef = useRef<HTMLDivElement>(null);
  const giftSectionRef = useRef<HTMLDivElement>(null);
  const [cartListFromLocalStorage, setCartListFromLocalStorage] = useState([]);
  const getSkuId = (item: any) => item?.sku_master_id ?? item?.sku_master;
  const getRingSizeKey = (item: any) => item?.ring_size_id ?? item?.ringSizePricingDetails?.id ?? null;

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

  const dispatch = useAppDispatch();
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
      if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_NODE_ENV === 'production') {
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

  const handleUser = () => {
    // return !token ? `/login?callbackUrl=${'checkout'}` : '/checkout';
    return '/checkout';
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
    route.push(handleUser());
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
    if (!promoCode.trim()) {
      setErrorMessage('Promo code cannot be empty.');
      return;
    }

    try {
      const couponData = {
        coupon_code: promoCode,
        ...(!user ? { updatedCartProducts } : {}),
      };
      const res = await dispatch(verifyCoupon(couponData));

      if (res.payload?.status === 200) {
        setErrorMessage('');
      } else {
        setErrorMessage(res.payload?.response?.data?.message || 'Invalid promo code');
      }
    } catch (error) {
      console.error('Error verifying coupon:', error);
      setErrorMessage('Something went wrong. Please try again.');
    }
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
        // Update the count for the product in Redux
        const updatedCartProducts = cartProducts.map((item: any) => {
          if (item?.ringSizePricingDetails?.id) {
            // For rings, match both sku_master_id and ring_size_id
            return item.sku_master_id === values.sku_master_id && item.ringSizePricingDetails?.id === values.ring_size_id
              ? { ...item, count: values.count }
              : item;
          }
          // For other jewelry, match only sku_master_id
          return item.sku_master_id === values.sku_master_id ? { ...item, count: values.count } : item;
        });
        dispatch(setCartProducts(updatedCartProducts));
        if (!user) {
          const cartData = localStorage.getItem('cartItems');
          const cartList = cartData ? JSON.parse(cartData) : [];
          const updatedCartList = cartList.map((item: any) => {
            const localSku = getSkuId(item);
            const localRing = getRingSizeKey(item);
            if (localRing) {
              // For rings, match both sku and ring-size key
              return localSku === values.sku_master_id && localRing === values.ring_size_id ? { ...item, count: values.count } : item;
            }
            // For other jewelry, match only sku key
            return localSku === values.sku_master_id ? { ...item, count: values.count } : item;
          });
          localStorage.setItem('cartItems', JSON.stringify(updatedCartList));
        }
      } else {
        // Handle empty cart scenario
        if (token) {
          // If user is logged in, you might want to fetch the cart again
        } else {
          // If user is not logged in, ensure local storage is empty
          localStorage.setItem('cartItems', JSON.stringify([]));
        }
      }
    },
    [user, cartProducts, dispatch],
  );
  const UpdateCartAPI = async () => {
    if (user) {
      await apiUpdateCountCartProduct(updatedCartProducts);
    }
  };

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

  useEffect(() => {
    if (!promoCode.trim()) {
      setErrorMessage('');
      dispatch(clearCouponData()); // Reset coupon data if input is cleared
    }
  }, [promoCode]);
  return (
    <div className="container-xs flex flex-col justify-center border-b border-solid border-gray-800_01 pt-4 pb-4 md:pt-2 md:pb-2 sm:pt-2 sm:pb-2">
      <div className="mx-auto relative mb-[18px] sm:flex-col [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:flex-col flex w-full items-start justify-center gap-8 md:gap-[10px] 2xl:px-[160px] xl:px-28 lg:px-20 md:px-5 sm:px-4">
        {/* On mobile this column is flattened (`sm:contents`) so its children become direct flex
            items of the parent, letting the Order Summary be ordered between the cart items and
            the Shipping/Returns info. Portrait tablets (551-1024px, portrait) take the same stacked
            layout: side by side, the summary column is only ~340px wide at 768px and its review
            line spills past the panel edge. */}
        {!loader && (
          <div className="flex flex-1 sm:w-full flex-col items-start gap-8 sm:gap-4 sm:contents [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:contents">
            {cartProducts?.length > 0 && (
              <Text
                as="p"
                size="text5xl"
                className="font-normal uppercase text-black-900 sm:order-1 [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:order-1"
              >
                Shopping cart
              </Text>
            )}

            {cartProducts?.length > 0 && (
              <FreeGiftProgress className="self-stretch sm:order-1 sm:mb-2 [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:order-1" />
            )}

            {/* Stays until the next evaluation clears it — i.e. until the shopper changes the
                cart again. Losing a gift silently is the confusing case, not seeing it twice. */}
            {giftJustRemoved && (
              <div
                className="self-stretch bg-gray-50 px-[30px] py-3 md:px-[20px] sm:px-3 sm:order-1 [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:order-1"
                role="status"
              >
                <p className="font-notosans text-[13px] text-red-a700">Your cart no longer qualifies for the free gift, so it has been removed.</p>
              </div>
            )}

            <div className="flex flex-col gap-[32px] self-stretch sm:gap-3 sm:order-2 [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:order-2">
              <Suspense fallback={<div>Loading feed...</div>}>
                {updatedCartProducts &&
                  updatedCartProducts?.map((d: any, index: number) => (
                    <CartProductDetails
                      productDetails={d}
                      {...d}
                      index={index}
                      key={'cartList' + index}
                      handleCount={handleCount}
                      handleRemoveProducts={handleRemoveProducts}
                      handleUpdateRingSize={handleUpdateRingSize}
                      handleUpdateEngraving={handleUpdateEngraving}
                    />
                  ))}
              </Suspense>

              {/* The gift is derived state, so it renders after the real cart lines and is
                  not part of the mapped list. */}
              <div ref={giftSectionRef}>
                <FreeGiftItem cartProducts={updatedCartProducts} />
              </div>
            </div>

            {cartProducts?.length > 0 && (
              <div className="grid grid-cols-2 gap-x-16 gap-y-10 self-stretch sm:grid-cols-1 sm:gap-y-8 sm:order-4 sm:mt-2 [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:order-4">
                <div className="flex items-start gap-5 sm:flex-col sm:items-center sm:gap-3 sm:text-center">
                  <LuTruck className="mt-0.5 h-8 w-8 shrink-0 text-gray-400 sm:mt-0" strokeWidth={1} />
                  <div className="flex flex-col gap-3 sm:items-center sm:gap-2">
                    <Text as="p" size="textxl" className="text-[15px] font-medium uppercase tracking-[1.2px] text-black-900 md:text-[14px]">
                      Shipping
                    </Text>
                    <ul className="cart-info-list flex flex-col gap-2.5 text-[13.5px] font-notosans leading-none text-gray-600 md:text-[13px] sm:items-center">
                      <li>Free Shipping Worldwide</li>
                      <li>Overnight Shipping</li>
                      <li>Order Tracking Every step of the way</li>
                    </ul>
                    <Link
                      href="/returns-shipping"
                      className="mt-2 text-[13px] font-notosans italic text-gray-400 underline-offset-2 hover:text-gray-500 hover:underline sm:mt-0"
                    >
                      More Info...
                    </Link>
                  </div>
                </div>

                <div className="flex items-start gap-5 sm:flex-col sm:items-center sm:gap-3 sm:text-center">
                  <LuRotateCcw className="mt-0.5 h-8 w-8 shrink-0 text-gray-400 sm:mt-0" strokeWidth={1} />
                  <div className="flex flex-col gap-3 sm:items-center sm:gap-2">
                    <Text as="p" size="textxl" className="text-[15px] font-medium uppercase tracking-[1.2px] text-black-900 md:text-[14px]">
                      Returns
                    </Text>
                    <ul className="cart-info-list flex flex-col gap-2.5 text-[13.5px] font-notosans leading-none text-gray-600 md:text-[13px] sm:items-center">
                      <li>Free returns from the US &amp; Canada</li>
                      <li>Fully Insured Returns</li>
                      <li>100% Money Back Guarantee*</li>
                    </ul>
                    <Link
                      href="/returns-shipping"
                      className="mt-2 text-[13px] font-notosans italic text-gray-400 underline-offset-2 hover:text-gray-500 hover:underline sm:mt-0"
                    >
                      More Info... (*Exclusions Apply)
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {!loader && (
          <div className="flex w-[38%] sticky top-5 sm:w-full flex-col gap-[30px] md:gap-[10px] md:w-[50%] lg:w-[45%] sm:order-3 sm:static [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:w-full [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:order-3 [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:static">
            <div>
              {updatedCartProducts?.length > 0 ? <OrderSummary cartProducts={updatedCartProducts} promoCode={promoCode} showAffirm /> : null}
              {cartProducts?.length > 0 && (
                <div className="flex-col bg-gray-50 px-[30px] md:px-[20px] pt-3 pb-6 md:pt-2 md:pb-4 sm:p-4 sm:pt-2 sm:px-3">
                  <div className="flex flex-1 flex-col gap-3">
                    <div className="flex items-center justify-between gap-5 py-1 md:py-0">
                      <Text
                        as="p"
                        size="textxl"
                        className="text-[16px] font-normal uppercase tracking-[0px] text-black-900 lg:text-[15px] md:text-[14px]"
                      >
                        have a Promocode?
                      </Text>
                    </div>

                    <div className="flex justify-center items-center gap-3 lg:flex-col">
                      <Input
                        name="Promo Input"
                        placeholder={`Enter promo code`}
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        type="text"
                        className="flex flex-grow items-center justify-center bg-white-a700 lg:w-full"
                      />
                      <Button
                        type="default"
                        name="Apply Button"
                        onClick={handleApplyCoupon}
                        className="!bg-secondary !text-text_w w-fit sm:w-full md:w-full lg:w-full !h-[37px] tracking-[1.50px] 2xl:text-[16px] xl:text-[16px] lg:text-[14px] lg:!h-[37px] uppercase"
                      >
                        Apply
                      </Button>
                    </div>
                    {promoCode && promoCode == couponData?.coupon_code && (
                      <div className="text-green-600">
                        <p>
                          {couponData?.coupon_description
                            ? couponData?.coupon_description
                            : `You Saved ${couponData?.discount_type == 2 ? `${couponData?.discount_value}%` : `$${couponData?.discount_value} `}!`}
                        </p>
                      </div>
                    )}
                    {errorMessage && (
                      <div className="text-red-600">
                        <p>{errorMessage ? errorMessage : ``}</p>{' '}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {cartProducts?.length > 0 && (
                <div ref={messagingTermsSectionRef} className="scroll-mt-24 sm:scroll-mt-20 bg-gray-50" id="cart-messaging-terms-section">
                  <div className={'px-5 sm:px-3 pb-4 flex items-start gap-[10px] !cursor-pointer'}>
                    <input
                      className={`!text-secondary`}
                      type="checkbox"
                      id="checkoutCondition"
                      checked={isChecked}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        if (checked) {
                          setShowMessagingTermsError(false);
                        }
                        setIsChecked(checked);
                      }}
                    />
                    <label htmlFor="checkoutCondition" className="!text-[12px] !font-sans font-extralight tracking-[1.80px] sm:!text-[12px]">
                      By checking this box, you agree to receive automated personalized text messages (e.g. cart reminders, shipping updates, and
                      tracking info) from ASHCLAIR. Reply HELP for help and STOP to cancel.{' '}
                      <Link className="underline !cursor-pointer" href="/terms-and-conditions">
                        View Terms & Privacy
                      </Link>
                      .
                    </label>
                  </div>
                  {showMessagingTermsError && !isChecked && (
                    <p className="px-5 sm:px-3 pb-4 -mt-2 text-red-600 text-[12px]" role="alert">
                      Please confirm the messaging terms to continue.
                    </p>
                  )}
                </div>
              )}

              {cartProducts?.length > 0 ? (
                <div className="px-5 sm:px-3 pb-5 bg-gray-50">
                  {/* <Link href={handleUser()} className="w-full"> */}
                  <Button
                    disabled={loading}
                    type="default"
                    loading={loading}
                    name="Checkout Button"
                    className="w-full !text-text_w !bg-secondary disabled:!bg-primary/50 !h-[45px] tracking-[1.50px] 2xl:text-[16px] xl:text-[16px] lg:text-[14px] lg:!h-[37px] uppercase"
                    onClick={handleCheckout}
                  >
                    checkout
                  </Button>
                  {showGiftRingSizeError && giftNeedsRingSize && (
                    <p className="pt-2 text-red-600 text-[12px]" role="alert">
                      Please choose a ring size for your free gift to continue.
                    </p>
                  )}

                  {/* Express checkout — Shop Pay and PayPal share one row under a single "or" divider.
                      Both collect address and payment in their own window and skip the checkout page,
                      behind the same consent/ring-size gate as the button above. Shop Pay hides itself
                      when it is not configured, and `empty:hidden` then gives PayPal the full row. */}
                  {process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ? (
                    <>
                      <div className="flex items-center gap-3 my-3">
                        <div className="h-px flex-1 bg-gray-300" />
                        <span className="text-[12px] uppercase tracking-[1.5px] text-gray-500 font-sans">or</span>
                        <div className="h-px flex-1 bg-gray-300" />
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

                  {/* Trust strip under the checkout button — same live Yotpo
                      rating/review count the checkout page shows, and it renders
                      nothing at all if Yotpo is unavailable. */}
                  <ReviewRatingStrip className="mt-6 sm:mt-5" />
                  {/* </Link> */}
                </div>
              ) : null}

              {/* Same reassurance rail the checkout page shows — delivery window, Why Ashclair,
                  help and returns — with the cart column's own side padding. */}
              {cartProducts?.length > 0 ? <AssurancePanel cartProducts={updatedCartProducts} className="!px-5 sm:!px-3" /> : null}
            </div>
          </div>
        )}
      </div>
      {(loading || loader) && (
        <div className="flex flex-col items-center gap-[60px] min-h-[50vh] justify-center">
          <div className="w-full flex justify-center items-center">
            <LuLoader className="h-10 w-10 animate-spin text-primary" />
          </div>
        </div>
      )}
      {!loader && !loading && cartProducts?.length == 0 && (
        // <div className="flex flex-col items-center gap-[60px] min-h-[50vh] justify-center">Cart is Empty !!</div>
        <>
          <div className="w-full mx-auto text-center mb-16">
            {/* <div className="relative h-48 w-48 mx-auto mb-5">
              <div className="absolute inset-0 flex items-center justify-center">
                <div>
                  <LuShoppingBag
                    className="h-24 w-24 text-gray-500/50"
                    strokeWidth={1.5}
                    // onMouseEnter={() => setIsHovering(true)}
                    // onMouseLeave={() => setIsHovering(false)}
                  />
                </div>
              </div>
            </div> */}

            <div className="mb-8 ">
              <h1 className="text-3xl font-serif font-medium mb-3 text-gray-800">Your Cart is Empty</h1>
              <p className="text-[14px] font-notosans mb-8 max-w-sm mx-auto text-gray-500">
                It seems you haven't added any precious jewelry to your collection yet. Discover our exquisite pieces and find something that speaks
                to you.
              </p>
            </div>
            {/* Product Suggestions Section */}
            <div>
              <OurBestSellers />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
