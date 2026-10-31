'use client';

import React, { useEffect, useRef, useState } from 'react';

import { Button, Input } from 'antd';

import { Text } from '@/components';
import { useAppDispatch, useAppSelector } from '@/store';
import { clearCouponData, verifyCoupon } from '@/store/slices/Cart/cartSlice';

type Props = {
  guestCartProducts: any[];
};

export default function CheckoutPromoCode({ guestCartProducts }: Props) {
  const dispatch = useAppDispatch();
  const { couponData } = useAppSelector((state: any) => state?.cart);
  const [promoCode, setPromoCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const prevPromoRef = useRef<string | null>(null);

  useEffect(() => {
    if (couponData?.coupon_code) {
      setPromoCode((p) => p || couponData.coupon_code);
    }
  }, [couponData?.coupon_code]);

  useEffect(() => {
    if (prevPromoRef.current === null) {
      prevPromoRef.current = promoCode;
      return;
    }
    if (prevPromoRef.current.trim() !== '' && promoCode.trim() === '') {
      setErrorMessage('');
      dispatch(clearCouponData());
    }
    prevPromoRef.current = promoCode;
  }, [promoCode, dispatch]);

  const getCouponErrorMessage = (payload: any): string => {
    if (!payload || payload?.status === 200) {
      return '';
    }
    const fromAxios = payload.response?.data;
    const body = typeof fromAxios === 'object' && fromAxios !== null ? fromAxios : payload;
    const msg =
      body?.message ||
      body?.error ||
      (Array.isArray(body?.errors) ? body.errors.filter(Boolean).join(' ') : '') ||
      payload?.message ||
      (typeof body === 'string' ? body : '');
    return (msg || '').trim() || 'Invalid promo code';
  };

  const handleApplyCoupon = async () => {
    if (!promoCode.trim()) {
      setErrorMessage('Promo code cannot be empty.');
      return;
    }

    setErrorMessage('');

    try {
      const payload = {
        coupon_code: promoCode.trim(),
        updatedCartProducts: guestCartProducts,
      };
      const res: any = await dispatch(verifyCoupon(payload));
      const p = res.payload;

      if (p?.status === 200 && p?.data !== undefined) {
        setErrorMessage('');
        return;
      }

      setErrorMessage(getCouponErrorMessage(p));

      if (p?.status !== 200) {
        dispatch(clearCouponData());
      }
    } catch {
      setErrorMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="flex w-full flex-col gap-3 self-stretch">
      <Text as="p" size="textxl" className="text-black font-normal uppercase md:!text-[16px] lg:text-[18px] sm:text-[16px]">
        Have a promocode?
      </Text>

      <div className="flex flex-row flex-nowrap items-stretch gap-[18px] sm:gap-3">
        <Input
          name="checkout-promo-code"
          placeholder="Enter Promo Code"
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value)}
          type="text"
          className="!min-h-[40px] min-w-0 flex-1 !rounded-none border border-gray-300 bg-white !font-sans !shadow-none sm:!min-h-[39px]"
        />
        <Button
          type="default"
          onClick={handleApplyCoupon}
          className="!h-[40px] !w-[140px] shrink-0 !border-0 !bg-secondary !text-text_w uppercase tracking-[1.5px] sm:!h-[39px] sm:!w-[110px]"
        >
          Apply
        </Button>
      </div>

      {promoCode && promoCode === couponData?.coupon_code && (
        <div className="font-sans text-sm text-green-600">
          {couponData?.coupon_description
            ? couponData?.coupon_description
            : `You Saved ${couponData?.discount_type == 2 ? `${couponData?.discount_value}%` : `$${couponData?.discount_value} `}!`}
        </div>
      )}
      {errorMessage ? <div className="font-sans text-sm text-red-600">{errorMessage}</div> : null}
    </div>
  );
}
