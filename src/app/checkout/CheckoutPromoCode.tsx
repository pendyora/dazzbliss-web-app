'use client';

import React, { useEffect, useRef, useState } from 'react';

import { Button, Input } from 'antd';
import { LuTag } from 'react-icons/lu';

import { useAppDispatch, useAppSelector } from '@/store';
import { clearCouponData, verifyCoupon } from '@/store/slices/Cart/cartSlice';

import { PRIMARY_BTN } from './checkoutTheme';

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
      setErrorMessage('Enter a code to apply it.');
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

  const applied = Boolean(promoCode && promoCode === couponData?.coupon_code);
  return (
    <div className="grid w-full gap-2">
      <label htmlFor="checkout-promo-code" className="text-[10.5px] uppercase tracking-[0.16em] text-ink-soft">
        Promo code
      </label>
      <div className="flex">
        <Input
          id="checkout-promo-code"
          name="checkout-promo-code"
          placeholder="Enter a promo code"
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value)}
          type="text"
          status={errorMessage ? 'error' : undefined}
          className="min-w-0 flex-1 !border-r-0 uppercase tracking-[0.12em] placeholder:normal-case placeholder:tracking-normal"
        />
        <Button type="default" onClick={handleApplyCoupon} className={`${PRIMARY_BTN} !px-6`}>
          Apply
        </Button>
      </div>
      {applied && (
        <p className="m-0 flex items-center gap-2 text-[12.5px] text-gilt">
          <LuTag className="h-3.5 w-3.5" aria-hidden />
          {couponData?.coupon_description
            ? couponData?.coupon_description
            : `${couponData?.coupon_code} applied. You save ${couponData?.discount_type == 2 ? `${couponData?.discount_value}%` : `$${couponData?.discount_value}`}.`}
        </p>
      )}
      {errorMessage ? (
        <p role="alert" className="m-0 text-[12.5px] text-danger">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
