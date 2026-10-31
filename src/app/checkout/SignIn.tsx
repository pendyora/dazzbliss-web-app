'use client';
/* eslint-disable react-hooks/exhaustive-deps */
import React, { forwardRef, useEffect, useRef, useState } from 'react';

import { Button, Form, Input, Modal } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LuEye, LuEyeOff, LuPencil } from 'react-icons/lu';

import { CheckBox, Text } from '@/components';
import CloudflareTurnstile, { CloudflareTurnstileHandle } from '@/components/common/CloudflareTurnstile';
import { BRAND } from '@/config/brand';
import * as klaviyo from '@/lib/klaviyo';
import { varifyEmailApi, apiMergeExistingCart } from '@/services/cartService';
import { useAppDispatch, useAppSelector } from '@/store';
import { setBillingAddress, setDeliveryAddress } from '@/store/slices/Address/addressSlice';
import { loginUser } from '@/store/slices/auth/authSlice';
import { AddWishListProducts, fetchCartProducts, fetchLocalCartProductsList, setGuestDetails } from '@/store/slices/Cart/cartSlice';
import { isDisposableDomain, isValidEmailFormat } from '@/utils/emailValidation';

import { PRIMARY_BTN } from './checkoutTheme';
import SectionTitle from './SectionTitle';

const VERIFY_USER_EXISTING_ACCOUNT_MESSAGE =
  'An account already exists with this email. You can login to the account or can place an order as guest user.';

type EmailInputControlProps = Omit<React.ComponentProps<typeof Input>, 'suffix' | 'prefix'> & {
  isConfirmed: boolean;
  loading: boolean;
  highlighted: boolean;
  onClickOverlay: () => void;
  onEditClick: () => void;
};

// Wrapper that keeps Ant Design's Form.Item field binding intact (injected value/onChange
// are forwarded to the Input via spread) while positioning a click-capture overlay + pen
// edit icon on top of the disabled email field. We can't simply wrap <Input> in a <div>
// because disabled HTML inputs suppress click events entirely — the overlay is what lets
// us detect "user clicked the disabled input" and highlight the edit icon as a hint.
const EmailInputControl = forwardRef<any, EmailInputControlProps>(function EmailInputControl(
  { isConfirmed, loading, highlighted, onClickOverlay, onEditClick, className, ...inputProps },
  ref,
) {
  return (
    <div className="relative w-full">
      <Input ref={ref as any} {...inputProps} disabled={isConfirmed} className={`${className ?? ''}${isConfirmed ? ' !pr-11' : ''}`} />
      {isConfirmed && (
        <>
          <div aria-hidden="true" className="absolute inset-0 z-[1] cursor-pointer" onClick={onClickOverlay} />
          <button
            type="button"
            aria-label="Edit email"
            disabled={loading}
            onClick={(e) => {
              e.stopPropagation();
              onEditClick();
            }}
            className={`absolute right-2 top-1/2 z-[2] flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-paper transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
              highlighted ? 'scale-110 animate-pulse text-gilt shadow-[0_0_0_2px_theme(colors.gilt.soft)]' : 'text-gilt hover:text-ink'
            }`}
          >
            <LuPencil className="h-[14px] w-[14px]" />
          </button>
        </>
      )}
    </div>
  );
});

function isVerifyUserExistingAccount(body: any): boolean {
  if (!body || typeof body !== 'object') {
    return false;
  }
  const flags = [body.is_exists, body.use_exist, body.data?.is_exists, body.data?.use_exist, body.data?.data?.is_exists, body.data?.data?.use_exist];
  return flags.some((v) => v === true);
}

type Props = {
  isDeliveryAddress: boolean;
  setIsDeliveryAddress: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  onContactContinue?: () => void;
};

function SmsConsentField({ checked, onChange, disabled }: { checked?: boolean; onChange?: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex items-start gap-3 text-left text-[12px] leading-[1.5] text-ink-soft">
      <CheckBox id="contact-sms-consent" label="" size="xs" checked={checked} onChange={onChange} disabled={disabled} className="!flex-shrink-0" />
      <label htmlFor="contact-sms-consent" className="cursor-pointer pl-0">
        Text me order and delivery updates from {BRAND.name}. Optional. Message rates may apply; reply HELP for help and STOP to cancel.{' '}
        <Link href="/terms-and-conditions" className="underline !cursor-pointer">
          Terms &amp; Privacy
        </Link>
        .
      </label>
    </div>
  );
}

const SignIn = ({ isDeliveryAddress, setIsDeliveryAddress, setCurrentStep, onContactContinue }: Props) => {
  const { user, loading: authLoading } = useAppSelector((state) => state.auth.auth);
  const { guestDetails } = useAppSelector((state) => state.cart);
  const [form] = Form.useForm();
  const [loginForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginErrorMessage, setLoginErrorMessage] = useState('');
  const [existingAccountNotice, setExistingAccountNotice] = useState<string | null>(null);
  const [existingAccountEmail, setExistingAccountEmail] = useState<string | null>(null);
  const [emailApiError, setEmailApiError] = useState<string | null>(null);
  const [isContactConfirmed, setIsContactConfirmed] = useState(false);
  const [editIconHighlight, setEditIconHighlight] = useState(false);
  const [savedCartCount, setSavedCartCount] = useState(0);
  const [isMergingCart, setIsMergingCart] = useState(false);
  const [cartMergeSuccess, setCartMergeSuccess] = useState<string | null>(null);
  const [loginTurnstileToken, setLoginTurnstileToken] = useState<string | null>(null);
  const loginTurnstileRef = useRef<CloudflareTurnstileHandle>(null);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isExistingUser = Boolean(user && !user?.is_guest && !guestDetails?.token);
  const [typingTimeout, setTypingTimeout] = useState<any>(null);
  const normalizeEmail = (email?: string | null) =>
    String(email ?? '')
      .trim()
      .toLowerCase();
  const watchedEmail = Form.useWatch('email', form);
  const resolveGuestStep = (details: any) => {
    const hasBilling = Boolean(details?.billingAddress?.id || details?.billingAddress?.address1);
    const hasDelivery = Boolean(details?.deliveryAddress?.id || details?.deliveryAddress?.address1);
    // Match logged-in flow: both addresses => open promo (step 3), not only delivery (step 2).
    if (hasBilling && hasDelivery) {
      return 3;
    }
    if (hasDelivery) {
      return 2;
    }
    if (hasBilling) {
      return 1;
    }
    return 1;
  };

  const handleCheckoutLogin = async (values: { email: string; password: string }) => {
    setLoginErrorMessage('');
    const result: any = await dispatch(loginUser({ ...values, cloudflareTurnstileToken: loginTurnstileToken }));
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
      loginForm.resetFields();
      setLoginModalOpen(false);
      router.push('/checkout');
    } else {
      loginTurnstileRef.current?.reset();
      setLoginTurnstileToken(null);
      setLoginErrorMessage(result?.payload?.message || 'Login failed. Please try again.');
      setTimeout(() => setLoginErrorMessage(''), 5000);
    }
  };

  const openGuestFromLogin = () => {
    setLoginModalOpen(false);
  };

  const handleFinish = async (values: { email: string }) => {
    const normalizedEmail = normalizeEmail(values.email);
    if (emailApiError) {
      return;
    }
    if (existingAccountNotice && normalizeEmail(existingAccountEmail) === normalizedEmail) {
      const nextGuestDetails = { ...(guestDetails || {}), email: normalizedEmail };
      dispatch(setGuestDetails(nextGuestDetails));
      // Attach this browser's already-tracked anonymous Started Checkout event to a known
      // profile — without this, a guest who abandons here is invisible to Klaviyo.
      klaviyo.identify({ email: normalizedEmail });
      setExistingAccountNotice(null);
      setExistingAccountEmail(null);
      setIsDeliveryAddress(true);
      setCurrentStep(resolveGuestStep(nextGuestDetails));
      onContactContinue?.();
      setIsContactConfirmed(true);
      return;
    }
    const isSuccess = await handleEmailSubmit(normalizedEmail);
    if (isSuccess) {
      setIsContactConfirmed(true);
    }
  };

  const handleEmailTyping = (email: string) => {
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    const timeout = setTimeout(() => {
      if (!email) {
        return;
      }

      // ✅ only call API if email is valid
      form
        .validateFields(['email'])
        .then(() => {
          handleEmailSubmit(normalizeEmail(email), true);
        })
        .catch(() => {});
    }, 500); // wait 500ms after typing stops

    setTypingTimeout(timeout);
  };

  const handleEmailChange = () => {
    // Clear the notice whenever the user edits the email field
    if (existingAccountNotice) {
      setExistingAccountNotice(null);
      setExistingAccountEmail(null);
    }
    if (emailApiError) {
      setEmailApiError(null);
    }
  };

  useEffect(() => {
    if (isContactConfirmed) {
      return;
    }
    if (!form.isFieldTouched('email')) {
      return;
    }
    // Re-validate email after user interaction so errors don't show on initial load.
    form.validateFields(['email']).catch(() => {});
  }, [watchedEmail, isContactConfirmed, form]);

  const handleEditContact = async () => {
    try {
      await form.validateFields(['email']);
    } catch {
      return;
    }
    const raw = form.getFieldValue('email') || guestDetails?.email;
    const email = normalizeEmail(raw);
    if (!email) {
      setIsContactConfirmed(false);
      setIsDeliveryAddress(false);
      setCurrentStep(0);
      return;
    }
    await handleEmailSubmit(email, true, { skipLoginRedirect: true });
    setIsContactConfirmed(false);
    setIsDeliveryAddress(false);
    setCurrentStep(0);
  };

  const handleAddSavedCartItems = async () => {
    if (!existingAccountEmail) {
      return;
    }
    setIsMergingCart(true);
    try {
      const res: any = await apiMergeExistingCart({ email: existingAccountEmail });
      const items = res?.data?.data?.items || [];
      if (items.length > 0) {
        // Merge into localStorage cart
        const existingCart = localStorage.getItem('cartItems');
        const currentCart = existingCart ? JSON.parse(existingCart) : [];
        const mergedCart = [...currentCart];
        items.forEach((item: any) => {
          const exists = mergedCart.find(
            (c: any) => c.jewelry_id === item.jewelry_id && c.sku_master === item.sku_master_id && c.diamond_id === item.diamond_id,
          );
          if (!exists) {
            mergedCart.push({
              jewelry_id: item.jewelry_id,
              sku_master: item.sku_master_id,
              count: item.count,
              diamond_id: item.diamond_id,
              ring_size: item.ring_size,
              ring_size_id: item.ring_size_id,
              is_appraisal: item.is_appraisal,
              selectedYearValue: item.selectedYearValue,
              engravingText: item.engravingText,
            });
          }
        });
        localStorage.setItem('cartItems', JSON.stringify(mergedCart));
        // Refresh the cart products in Redux
        await dispatch(fetchLocalCartProductsList({ data: mergedCart }));
        setCartMergeSuccess(`${items.length} item(s) added to your cart`);
        setTimeout(() => setCartMergeSuccess(null), 4000);
      }
      setSavedCartCount(0);
    } catch (error) {
      console.error('Failed to merge cart:', error);
    } finally {
      setIsMergingCart(false);
    }
  };

  const handleEmailSubmit = async (email: string, isTyping = false, options?: { skipLoginRedirect?: boolean }): Promise<boolean> => {
    setLoading(true);
    try {
      const normalizedEmail = normalizeEmail(email);
      // Invisible/auto Turnstile: the service mints a FRESH single-use token per call
      // (this check runs repeatedly while the user types, so a reused token would be
      // rejected by Cloudflare as a duplicate).
      const res: any = await varifyEmailApi({ email: normalizedEmail });
      const accountAlreadyExists = isVerifyUserExistingAccount(res) || isVerifyUserExistingAccount(res?.data);

      if (accountAlreadyExists) {
        const verifiedData = res?.data?.data;
        if (verifiedData && typeof verifiedData === 'object' && !Array.isArray(verifiedData)) {
          dispatch(setGuestDetails({ ...(guestDetails || {}), ...verifiedData, email: normalizedEmail }));
          // Capture saved cart count for smart cart detection
          const cartCount = verifiedData?.saved_cart_count ?? 0;
          setSavedCartCount(cartCount);
        }
        // Show the info notice — stay on step 0. Next Continue click will proceed as guest.
        setExistingAccountEmail(normalizedEmail);
        setExistingAccountNotice(VERIFY_USER_EXISTING_ACCOUNT_MESSAGE);
        setEmailApiError(null);
        return false;
      }

      // New guest email — proceed directly to billing
      const verifyStatus = res?.data?.status ?? res?.status;
      const isVerifySuccess = verifyStatus === 200 || verifyStatus === 201 || typeof res?.data?.data !== 'undefined';
      if (isVerifySuccess) {
        setExistingAccountNotice(null);
        setExistingAccountEmail(null);
        setEmailApiError(null);
        const verifiedData = res?.data?.data;
        let nextGuestDetails: any = verifiedData;
        if (verifiedData && typeof verifiedData === 'object' && !Array.isArray(verifiedData)) {
          nextGuestDetails = { ...verifiedData, email: normalizedEmail };
          if (nextGuestDetails?.deliveryAddress && typeof nextGuestDetails.deliveryAddress === 'object') {
            nextGuestDetails.deliveryAddress = { ...nextGuestDetails.deliveryAddress, email: normalizedEmail };
          }
        } else {
          nextGuestDetails = { email: normalizedEmail, deliveryAddress: verifiedData };
        }
        dispatch(setGuestDetails(nextGuestDetails));

        if (!isTyping) {
          // Attach this browser's already-tracked anonymous Started Checkout event to a
          // known profile — without this, a guest who abandons here is invisible to Klaviyo.
          klaviyo.identify({ email: normalizedEmail });
          setIsDeliveryAddress(true);
          setCurrentStep(resolveGuestStep(nextGuestDetails));
          onContactContinue?.();
          return true;
        }

        return false;
      }

      // Any other non-200 — treat as a backend rejection (e.g. invalid/disposable email).
      setExistingAccountNotice(null);
      setExistingAccountEmail(null);
      setEmailApiError(res?.data?.message || res?.message || 'Please provide a valid email address.');
      return false;
    } catch (error: any) {
      const payload = error?.response?.data ?? error;
      if (isVerifyUserExistingAccount(payload)) {
        setExistingAccountEmail(normalizeEmail(email));
        setExistingAccountNotice(VERIFY_USER_EXISTING_ACCOUNT_MESSAGE);
        setEmailApiError(null);
        return false;
      }
      setExistingAccountNotice(null);
      setExistingAccountEmail(null);
      setEmailApiError(payload?.message || error?.message || 'Please provide a valid email address.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const initialValues = {
    email: user?.email || '',
    smsConsent: false,
  };

  useEffect(() => {
    if (user) {
      setIsDeliveryAddress(true);
      if (!user?.is_guest) {
        setCurrentStep((prev) => Math.max(prev, 1));
        dispatch(setGuestDetails([]));
      }
    }
  }, [user]);

  return (
    <div className="flex flex-col items-stretch gap-6 self-stretch">
      <SectionTitle
        done={isContactConfirmed || isExistingUser}
        action={
          !isExistingUser && !isContactConfirmed ? (
            <p className="m-0 text-[12.5px] text-ink-soft">
              Already have an account?{' '}
              <button type="button" onClick={() => setLoginModalOpen(true)} className="text-ink underline underline-offset-[3px]">
                Sign in
              </button>
            </p>
          ) : null
        }
      >
        Contact
      </SectionTitle>

      {isExistingUser ? (
        <div className="flex w-full flex-col self-stretch">
          {/* Matches the `Email` label antd renders on the editable branch below — without it a
              signed-in shopper sees an unlabelled grey box. */}
          <label htmlFor="checkout-contact-email" className="mb-1.5 text-[10.5px] uppercase tracking-[0.16em] text-ink-soft">
            Email
          </label>
          <div
            id="checkout-contact-email"
            role="status"
            className="flex min-h-12 w-full items-center border border-line bg-stone px-3.5 text-[14px] text-ink-soft"
          >
            {user?.email || ''}
          </div>
        </div>
      ) : (
        <Form
          form={form}
          layout="vertical"
          colon={false}
          requiredMark={false}
          onFinish={handleFinish}
          initialValues={initialValues}
          className="flex flex-col self-stretch"
        >
          <Form.Item
            name="email"
            validateTrigger="onChange"
            label={<span>Email</span>}
            rules={[
              { required: true, message: 'Please enter your email!' },
              {
                validator: (_, value) => {
                  if (!value) {
                    return Promise.resolve();
                  }
                  if (!isValidEmailFormat(value)) {
                    return Promise.reject(new Error('Please enter a valid email!'));
                  }
                  if (isDisposableDomain(value)) {
                    return Promise.reject(new Error('Please enter a valid permanent email address'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
            className="[&_.ant-form-item-label>label]:!w-full [&_.ant-form-item-label>label]:!font-normal [&_.ant-form-item-label>label]:font-sans"
          >
            <EmailInputControl
              name="email"
              placeholder="Email"
              isConfirmed={isContactConfirmed}
              loading={loading}
              highlighted={editIconHighlight}
              onClickOverlay={() => {
                setEditIconHighlight(true);
                window.setTimeout(() => setEditIconHighlight(false), 1600);
              }}
              onEditClick={() => void handleEditContact()}
              onChange={(e) => {
                const value = e.target.value;

                handleEmailChange();

                // ✅ API call (debounced)
                handleEmailTyping(value);
              }}
              className="disabled:!opacity-100 [&.ant-input-disabled]:!cursor-not-allowed [&.ant-input-disabled]:!bg-stone [&.ant-input-disabled]:!text-ink-soft"
            />
          </Form.Item>

          {existingAccountNotice && normalizeEmail(form.getFieldValue('email')) === normalizeEmail(existingAccountEmail) ? (
            <div className="w-full flex flex-col gap-2 border border-gilt-soft bg-stone/60 px-4 py-3 mb-2">
              <div className="flex items-start gap-3">
                <div className="mt-[2px] flex h-[18px] min-w-[18px] w-[18px] items-center justify-center rounded-full bg-gilt-soft text-[12px] font-sans text-ink shrink-0">
                  i
                </div>
                <div className="flex flex-col gap-1">
                  <p className="font-sans text-[13px] leading-[18px] text-ink break-words">{existingAccountNotice}</p>
                </div>
              </div>
            </div>
          ) : null}

          {emailApiError ? (
            <div className="w-full flex flex-col gap-2 border border-danger bg-paper px-4 py-3 mb-2">
              <div className="flex items-start gap-3">
                <div className="mt-[2px] flex h-[18px] min-w-[18px] w-[18px] items-center justify-center rounded-full bg-danger text-[12px] font-sans text-paper shrink-0">
                  !
                </div>
                <div className="flex flex-col gap-1">
                  <p className="font-sans text-[13px] leading-[18px] text-danger break-words">{emailApiError}</p>
                </div>
              </div>
            </div>
          ) : null}

          {savedCartCount > 0 && normalizeEmail(form.getFieldValue('email')) === normalizeEmail(existingAccountEmail) ? (
            <div className="w-full flex flex-col gap-2 border border-line bg-stone/60 px-4 py-3 mb-2">
              <div className="flex items-start gap-2">
                <div className="mt-[2px] flex h-[18px] min-w-[18px] w-[18px] items-center justify-center rounded-full bg-gilt-soft text-[12px] font-sans text-ink shrink-0">
                  i
                </div>
                <div className="flex-1">
                  <p className="font-sans text-[13px] leading-[18px] text-ink">
                    You have {savedCartCount} item(s) saved in your cart from a previous visit.
                  </p>
                  <div className="flex gap-3 mt-3">
                    <button
                      type="button"
                      onClick={handleAddSavedCartItems}
                      disabled={isMergingCart}
                      className="bg-ink text-paper border-0 h-[34px] px-4 text-[11px] uppercase tracking-[0.16em] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isMergingCart ? 'Adding...' : 'Add to order'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSavedCartCount(0)}
                      className="bg-transparent text-ink border border-line h-[34px] px-4 text-[11px] uppercase tracking-[0.16em]"
                    >
                      No thanks
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {cartMergeSuccess ? (
            <div className="w-full border border-gilt-soft bg-stone/60 px-4 py-2 mb-2">
              <p className="font-sans text-[13px] leading-[18px] text-gilt">{cartMergeSuccess}</p>
            </div>
          ) : null}

          {!isContactConfirmed ? (
            <>
              <Form.Item name="smsConsent" valuePropName="checked" getValueFromEvent={(v) => v} className="!mt-2">
                <SmsConsentField />
              </Form.Item>

              <Form.Item className="!mb-0">
                <div className="w-full flex justify-end">
                  <Button
                    type="default"
                    htmlType="submit"
                    loading={loading}
                    disabled={Boolean(emailApiError) || loading}
                    className={`${PRIMARY_BTN} w-full`}
                  >
                    Continue
                  </Button>
                </div>
              </Form.Item>
            </>
          ) : null}
        </Form>
      )}

      <Modal
        open={loginModalOpen}
        onCancel={() => {
          setLoginModalOpen(false);
          setShowPassword(false);
          setLoginErrorMessage('');
        }}
        footer={null}
        destroyOnClose
        centered
        title={null}
        width={480}
        classNames={{ body: 'pt-1 pb-6' }}
      >
        <div className="flex w-full flex-col gap-6">
          <div className="flex flex-col items-center gap-3 px-1 text-center">
            <p className="m-0 font-cormorant text-[30px] font-normal leading-tight text-ink">Sign in</p>
            <p className="max-w-[420px] text-[13px] font-sans font-extralight leading-[1.5] text-ink-soft sm:text-[12px]">
              Log in below to track this order in your account. We do not save any payment information.
            </p>
          </div>

          <Form
            name="checkout-login"
            form={loginForm}
            onFinish={handleCheckoutLogin}
            layout="vertical"
            colon={false}
            requiredMark={false}
            initialValues={{ email: '', password: '' }}
            className="[&_.ant-form-item-label>label]:!h-auto [&_.ant-form-item-label>label]:!w-full [&_.ant-form-item-label>label]:!text-[10.5px] [&_.ant-form-item-label>label]:uppercase [&_.ant-form-item-label>label]:tracking-[0.16em] [&_.ant-form-item-label>label]:text-ink-soft"
          >
            <Form.Item
              name="email"
              validateTrigger="onChange"
              label={<span>Email</span>}
              rules={[
                {
                  validator: async (_, value) => {
                    const v = value ? String(value).trim() : '';
                    if (!v) {
                      return Promise.reject(new Error('Please enter your email!'));
                    }
                    if (!isValidEmailFormat(v)) {
                      return Promise.reject(new Error('Invalid email address'));
                    }
                    if (isDisposableDomain(v)) {
                      return Promise.reject(new Error('Please enter a valid permanent email address'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
              className="[&_.ant-form-item-label>label]:!font-normal [&_.ant-form-item-label>label]:font-sans"
            >
              <Input placeholder="Email" />
            </Form.Item>

            <Form.Item
              name="password"
              label={
                <div className="flex w-full flex-row flex-wrap items-center justify-between gap-x-2 gap-y-1 pr-0">
                  <span>Password</span>
                  <Link
                    href="/forgot-password"
                    className="shrink-0 text-[12px] normal-case tracking-normal text-ink underline underline-offset-2"
                    onClick={() => setLoginModalOpen(false)}
                  >
                    Forgot Password?
                  </Link>
                </div>
              }
              rules={[
                {
                  validator: async (_, value) => {
                    if (!value || String(value).trim() === '') {
                      return Promise.reject(new Error('Please enter your password!'));
                    }
                    if (String(value).length < 8) {
                      return Promise.reject(new Error('Password must be at least 8 characters'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
              className="checkout-login-password [&_.ant-form-item-explain]:!mt-1 [&_.ant-form-item-label>label]:!font-normal"
            >
              <Input.Password
                placeholder="Password"
                iconRender={(visible) => (visible ? <LuEye /> : <LuEyeOff />)}
                visibilityToggle={{
                  visible: showPassword,
                  onVisibleChange: setShowPassword,
                }}
              />
            </Form.Item>

            {loginErrorMessage && (
              <Text as="p" size="textlg" className="-mt-1 mb-1 text-danger font-sans">
                {loginErrorMessage}
              </Text>
            )}

            <CloudflareTurnstile
              ref={loginTurnstileRef}
              onVerify={setLoginTurnstileToken}
              onExpire={() => setLoginTurnstileToken(null)}
              onError={() => setLoginTurnstileToken(null)}
              className="my-3"
            />

            <Form.Item className="!mb-0 !mt-2">
              <Button type="default" htmlType="submit" loading={authLoading} className={`${PRIMARY_BTN} !w-full`}>
                {authLoading ? 'Signing in…' : 'Sign in & continue'}
              </Button>
            </Form.Item>
          </Form>

          <button type="button" onClick={openGuestFromLogin} className="w-full border-0 bg-transparent p-0 text-center underline underline-offset-2">
            <span className="font-sans text-[15px] font-extralight text-ink-soft sm:text-[14px] md:text-[16px]">Continue as Guest</span>
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default SignIn;
