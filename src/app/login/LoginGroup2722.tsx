'use client';

import React, { useEffect, useRef, useState } from 'react';

import { Form, Input, Button } from 'antd';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LuEye, LuEyeOff } from 'react-icons/lu';

import CloudflareTurnstile, { CloudflareTurnstileHandle } from '@/components/common/CloudflareTurnstile';
import { useAppDispatch, useAppSelector } from '@/store';
import { setBillingAddress, setDeliveryAddress } from '@/store/slices/Address/addressSlice';
import { loginUser } from '@/store/slices/auth/authSlice';
import { AddWishListProducts, fetchCartProducts } from '@/store/slices/Cart/cartSlice';
import { isValidEmailFormat } from '@/utils/emailValidation';

import { Text } from '../../components';

export default function LoginGroup2722() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, loading } = useAppSelector((state) => state.auth.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<CloudflareTurnstileHandle>(null);
  const searchParams = useSearchParams();
  const requestedCallbackUrl = searchParams?.get('callbackUrl');
  // Only ever return to a path on this site - never to an absolute or protocol-relative URL.
  const callbackUrl = requestedCallbackUrl?.startsWith('/') && !requestedCallbackUrl.startsWith('//') ? requestedCallbackUrl : null;
  const handleLogin = async (values: { email: string; password: string }) => {
    const result: any = await dispatch(loginUser({ ...values, cloudflareTurnstileToken: turnstileToken }));
    if (result.meta.requestStatus === 'fulfilled') {
      const cartData = localStorage.getItem('cartItems');
      if (result?.payload?.data?.is_subscribed == true) {
        localStorage.setItem('OfferModelSubscribe', 'true');
      }
      const cartList = cartData ? JSON.parse(cartData) : [];
      dispatch(setBillingAddress(result?.payload?.data?.billing_address));
      dispatch(setDeliveryAddress(result?.payload?.data?.delivery_address));
      //  console.log("cartList--->", cartList);
      if (cartList?.length > 0) {
        await dispatch(fetchCartProducts({ data: cartList }));
        localStorage.removeItem('cartItems');
      }
      const wishlistData = localStorage.getItem('wishListItems');
      const wishList = wishlistData ? JSON.parse(wishlistData) : [];
      // console.log("wishList---->", wishList);
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
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      setErrorMessage(result?.payload?.message);
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  // Already signed in (e.g. the order email opened in a browser with a live session): go straight
  // to the page that sent them here, falling back to the home page.
  useEffect(() => {
    if (user && !user?.is_guest) {
      router.replace(callbackUrl || '/');
    }
  }, [user, callbackUrl, router]);

  return (
    <div>
      <div className="flex flex-col items-center justify-center border-b border-solid border-[#3b3b3b] py-[76px] 2xl:py-16 lg:py-8 md:py-8 sm:py-5">
        <div className="container-xs flex flex-col items-center gap-9 sm:gap-3 2xl:px-[160px] xl:px-28 lg:px-20 md:px-5 sm:px-3">
          <div className="flex flex-col items-center self-stretch px-14 md:px-5 sm:px-4 mb-8 lg:mb-0 sm:mb-3">
            <Text size="text5xl" as="p" className="uppercase text-center sm:!text-[18px]">
              Sign in to your account
            </Text>
          </div>
          <div className="flex w-[550px] sm:w-full sm:gap-3 flex-col gap-9">
            <Form name="login" onFinish={handleLogin} layout="vertical" initialValues={{ email: '', password: '' }}>
              <Form.Item
                name="email"
                label="Email"
                validateTrigger="onChange"
                rules={[
                  { required: true, message: 'Please enter your email!' },
                  {
                    validator: (_, value) => {
                      if (!value) {
                        return Promise.resolve();
                      }
                      if (!isValidEmailFormat(value)) {
                        return Promise.reject(new Error('Invalid email address'));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input placeholder="Enter Email" />
              </Form.Item>
              <Form.Item
                name="password"
                label="Password"
                rules={[
                  { required: true, message: 'Please enter your password!' },
                  { min: 8, message: 'Password must be at least 8 characters' },
                ]}
              >
                <Input.Password
                  placeholder="Enter Password"
                  iconRender={(visible) => (visible ? <LuEye /> : <LuEyeOff />)}
                  visibilityToggle={{
                    visible: showPassword,
                    onVisibleChange: setShowPassword,
                  }}
                />
              </Form.Item>
              {errorMessage && (
                <Text as="p" size="textlg" className="text-red-500 font-sans pl-2 -my-4">
                  {errorMessage}
                </Text>
              )}
              <CloudflareTurnstile
                ref={turnstileRef}
                onVerify={setTurnstileToken}
                onExpire={() => setTurnstileToken(null)}
                onError={() => setTurnstileToken(null)}
                className="my-3"
              />
              <Form.Item>
                <Button
                  type="default"
                  htmlType="submit"
                  loading={loading}
                  className="!text-text_w !bg-secondary self-stretch w-full tracking-[2.00px] mt-4 sm:mt-0 sm:!text-[12px]"
                >
                  {loading ? 'Processing...' : 'LOG IN'}
                </Button>
              </Form.Item>
            </Form>
            <Link href="/forgot-password" className="self-end">
              <Text size="textlg" as="p" className="tracking-[2.00px] !text-[#757575] -mt-8 !font-sans !font-extralight underline sm:!text-[12px]">
                FORGOT PASSWORD?
              </Text>
            </Link>
            <Link href={callbackUrl ? `/createanaccount?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/createanaccount'} className="w-full">
              <Button type="default" className="self-stretch tracking-[2.00px] w-full sm:!text-[12px]">
                CREATE AN ACCOUNT
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
