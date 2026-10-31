'use client';

import React, { useEffect, useRef, useState } from 'react';

import { Form, Button } from 'antd';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LuHeart, LuReceipt, LuShoppingBag, LuStar } from 'react-icons/lu';

import { FloatInput, FloatPassword } from '@/components/Auth/AuthFields';
import { AUTH_POSTERS } from '@/components/Auth/authPosters';
import AuthShell, { AuthTabs } from '@/components/Auth/AuthShell';
import { AUTH } from '@/components/Auth/authUi';
import CloudflareTurnstile, { CloudflareTurnstileHandle } from '@/components/common/CloudflareTurnstile';
import { BRAND } from '@/config/brand';
import { useAppDispatch, useAppSelector } from '@/store';
import { setBillingAddress, setDeliveryAddress } from '@/store/slices/Address/addressSlice';
import { loginUser } from '@/store/slices/auth/authSlice';
import { AddWishListProducts, fetchCartProducts } from '@/store/slices/Cart/cartSlice';
import { isValidEmailFormat } from '@/utils/emailValidation';

const { offer } = AUTH_POSTERS.register;
const BENEFITS = [
  { Icon: LuShoppingBag, label: 'Faster checkout' },
  { Icon: LuReceipt, label: 'Order history & tracking' },
  { Icon: LuHeart, label: 'Wishlist on every device' },
  { Icon: LuStar, label: 'Early access to launches' },
];

export default function LoginGroup2722() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, loading } = useAppSelector((state) => state.auth.auth);
  const [errorMessage, setErrorMessage] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<CloudflareTurnstileHandle>(null);
  const searchParams = useSearchParams();
  const requestedCallbackUrl = searchParams?.get('callbackUrl');
  // Only ever return to a path on this site - never to an absolute or protocol-relative URL.
  const callbackUrl = requestedCallbackUrl?.startsWith('/') && !requestedCallbackUrl.startsWith('//') ? requestedCallbackUrl : null;
  // Set while handleLogin runs, so the "already signed in" redirect doesn't race the cart/wishlist sync below.
  const signingIn = useRef(false);

  const handleLogin = async (values: { email: string; password: string }) => {
    signingIn.current = true;
    const result: any = await dispatch(loginUser({ ...values, cloudflareTurnstileToken: turnstileToken }));
    if (result.meta.requestStatus === 'fulfilled') {
      const cartData = localStorage.getItem('cartItems');
      if (result?.payload?.data?.is_subscribed == true) {
        localStorage.setItem('OfferModelSubscribe', 'true');
      }
      const cartList = cartData ? JSON.parse(cartData) : [];
      dispatch(setBillingAddress(result?.payload?.data?.billing_address));
      dispatch(setDeliveryAddress(result?.payload?.data?.delivery_address));
      if (cartList?.length > 0) {
        await dispatch(fetchCartProducts({ data: cartList }));
        localStorage.removeItem('cartItems');
      }
      const wishlistData = localStorage.getItem('wishListItems');
      const wishList = wishlistData ? JSON.parse(wishlistData) : [];
      const wishListData = wishList.flatMap((category: any) =>
        category?.jewelry?.map((item: any) => ({
          jewelry_id: item.jewelry_id,
          sku_master_id: item.sku_master_id,
        })),
      );
      if (wishList?.length > 0) {
        await dispatch(AddWishListProducts({ data: wishListData }));
        localStorage.removeItem('wishListItems');
      }
      router.push(callbackUrl || '/');
    } else {
      signingIn.current = false;
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      setErrorMessage(result?.payload?.message || 'We couldn’t sign you in. Please check your details.');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  // Already signed in (e.g. the order email opened in a browser with a live session): go straight
  // to the page that sent them here, falling back to the home page.
  useEffect(() => {
    if (user && !user?.is_guest && !signingIn.current) {
      router.replace(callbackUrl || '/');
    }
  }, [user, callbackUrl, router]);

  return (
    <AuthShell poster={AUTH_POSTERS.signIn}>
      <div className={AUTH.form}>
        <AuthTabs active="signin" callbackUrl={callbackUrl} />
        <p className={AUTH.kicker}>Members&apos; salon</p>
        <h1 className={AUTH.title}>
          Welcome <em>back</em>
        </h1>
        <p className={AUTH.lede}>Sign in to see your orders, saved pieces and member previews.</p>

        <Form name="login" onFinish={handleLogin} requiredMark={false} initialValues={{ email: '', password: '' }} className={AUTH.formFix}>
          <Form.Item
            name="email"
            validateTrigger="onBlur"
            rules={[
              { required: true, message: 'Enter your email address' },
              {
                validator: (_, value) => {
                  if (!value || isValidEmailFormat(value)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Enter a valid email address'));
                },
              },
            ]}
          >
            <FloatInput label="Email address*" type="email" autoComplete="email" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Enter your password' },
              { min: 8, message: 'Password must be at least 8 characters' },
            ]}
          >
            <FloatPassword label="Password*" autoComplete="current-password" />
          </Form.Item>

          <div className="-mt-1 mb-7 flex justify-end">
            <Link href="/forgotpassword" className={AUTH.quietLink}>
              Forgot password?
            </Link>
          </div>

          {errorMessage && (
            <p role="alert" className={AUTH.error}>
              {errorMessage}
            </p>
          )}
          <CloudflareTurnstile
            ref={turnstileRef}
            onVerify={setTurnstileToken}
            onExpire={() => setTurnstileToken(null)}
            onError={() => setTurnstileToken(null)}
            className="mb-4"
          />
          <Button htmlType="submit" loading={loading} className={AUTH.primaryBtn}>
            Sign in
          </Button>
          <p className="m-0 mt-3.5 text-[11.5px] text-ink-soft">*Required fields</p>
        </Form>

        <div className="my-9 mb-7 flex items-center gap-4 text-[10.5px] uppercase tracking-[0.22em] text-ink-soft before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">
          New to {BRAND.name}?
        </div>
        <h2 className="m-0 mb-1.5 font-cormorant text-[28px] font-normal">
          Join the <em className="italic text-gilt">house</em>
        </h2>
        <p className="m-0 mb-[18px] text-[13px] text-ink-soft">
          Create an account and get {offer.value}
          {offer.unit} {offer.caption}.
        </p>
        <ul className="m-0 mb-6 grid list-none grid-cols-2 gap-x-5 gap-y-3.5 p-0 text-[13px] sm:grid-cols-1">
          {BENEFITS.map(({ Icon, label }) => (
            <li key={label} className="flex items-center gap-2.5">
              <Icon className="h-[18px] w-[18px] flex-none text-gilt" strokeWidth={1.3} />
              {label}
            </li>
          ))}
        </ul>
        <Link
          href={callbackUrl ? `/createanaccount?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/createanaccount'}
          className={AUTH.secondaryBtn}
        >
          Create an account
        </Link>
      </div>
    </AuthShell>
  );
}
