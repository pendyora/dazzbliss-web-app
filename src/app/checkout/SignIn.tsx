'use client';
/* eslint-disable react-hooks/exhaustive-deps */
import React, { forwardRef, useEffect, useRef, useState } from 'react';

import { Button, Form, Input, Modal } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LuCheck, LuEye, LuEyeOff, LuPencil } from 'react-icons/lu';

import { CheckBox, Text } from '@/components';
import CloudflareTurnstile, { CloudflareTurnstileHandle } from '@/components/common/CloudflareTurnstile';
import * as klaviyo from '@/lib/klaviyo';
import { varifyEmailApi, apiMergeExistingCart } from '@/services/cartService';
import { useAppDispatch, useAppSelector } from '@/store';
import { setBillingAddress, setDeliveryAddress } from '@/store/slices/Address/addressSlice';
import { loginUser } from '@/store/slices/auth/authSlice';
import { AddWishListProducts, fetchCartProducts, fetchLocalCartProductsList, setGuestDetails } from '@/store/slices/Cart/cartSlice';
import { isDisposableDomain, isValidEmailFormat } from '@/utils/emailValidation';

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
            className={`absolute right-2 top-1/2 z-[2] flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
              highlighted ? 'scale-110 animate-pulse text-[#6f7a56] shadow-[0_0_0_2px_rgba(111,122,86,0.55)]' : 'text-[#6f7a56] hover:text-[#4e5840]'
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
    <div className="flex items-start gap-[14px] text-left 2xl:text-[13px] text-[14px] !font-sans font-extralight leading-[22px] tracking-[0.16px] text-[#757575] sm:!text-[11px]">
      <CheckBox
        id="contact-sms-consent"
        label=""
        size="xs"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="!flex-shrink-0 gap-[14px] text-left 2xl:text-[13px] text-[14px] !font-sans font-extralight leading-[22px] tracking-[0.16px] text-[#757575] sm:!text-[11px]"
      />
      <label htmlFor="contact-sms-consent" className="cursor-pointer pl-0">
        By checking this box, you agree to receive automated personalized text messages (e.g. cart reminders, shipping updates, and tracking info)
        from ASHCLAIR. Reply HELP for help and STOP to cancel.{' '}
        <Link href="/terms-and-conditions" className="underline !cursor-pointer">
          Terms & Privacy
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
    <div className="flex flex-col items-end gap-5 self-stretch sm:gap-4">
      <div className="mb-2 flex flex-row flex-wrap justify-between items-start gap-x-6 gap-y-3 self-stretch sm:mb-1 sm:flex-col sm:items-start sm:gap-y-2">
        <div className="flex flex-row items-center gap-2 sm:gap-1">
          <Text as="p" size="text5xl" className="text-black font-normal uppercase lg:text-[22px] sm:text-[20px] md:!text-[20px]">
            contact information
          </Text>
          {(isContactConfirmed || isExistingUser) && (
            <span
              aria-label="Completed"
              className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#6f7a56] text-white md:h-[18px] md:w-[18px]"
            >
              <LuCheck className="h-[13px] w-[13px]" strokeWidth={3} />
            </span>
          )}
        </div>
        {!isExistingUser && !isContactConfirmed ? (
          <div className="flex flex-wrap items-baseline justify-end gap-x-1.5 gap-y-1 text-right md:mt-1 sm:justify-start sm:text-left">
            <span className="font-sans text-[15px] font-extralight leading-snug tracking-[0.02em] text-[#757575] sm:text-[14px] md:text-[16px]">
              Already have an account?
            </span>
            <button
              type="button"
              onClick={() => setLoginModalOpen(true)}
              className="inline border-0 bg-transparent p-0 font-sans text-[15px] font-normal leading-snug tracking-[0.02em] text-[#757575] underline underline-offset-[3px] decoration-[#757575] decoration-1 transition-opacity hover:opacity-80 sm:text-[14px] md:text-[16px]"
            >
              Log In
            </button>
          </div>
        ) : null}
      </div>

      {isExistingUser ? (
        <div className="flex w-full flex-col self-stretch">
          {/* Matches the `Email` label antd renders on the editable branch below — without it a
              signed-in shopper sees an unlabelled grey box. */}
          <label htmlFor="checkout-contact-email" className="mb-1 font-sans text-[14px] font-normal leading-[22px] text-black">
            Email <span className="text-red-500">*</span>
          </label>
          <div
            id="checkout-contact-email"
            role="status"
            className="flex min-h-[40px] w-full items-center border border-gray-200 bg-gray-100 px-3 py-2.5 font-sans text-[15px] font-normal leading-normal text-[#a3a3a3] antialiased sm:min-h-[39px] sm:text-[14px]"
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
            label={
              <span className="font-sans font-normal text-black">
                Email <span className="text-red-500">*</span>
              </span>
            }
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
              className="!h-11 !rounded-none !border-[#3b3b3b] !shadow-none disabled:!bg-[#f3f4f6] disabled:!text-[#4b5563] disabled:!opacity-100 [&.ant-input-disabled]:!bg-[#f3f4f6] [&.ant-input-disabled]:!text-[#4b5563] [&.ant-input-disabled]:!cursor-not-allowed"
            />
          </Form.Item>

          {existingAccountNotice && normalizeEmail(form.getFieldValue('email')) === normalizeEmail(existingAccountEmail) ? (
            <div className="w-full flex flex-col gap-2 rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 mb-2">
              <div className="flex items-start gap-3">
                <div className="mt-[2px] flex h-[18px] min-w-[18px] w-[18px] items-center justify-center rounded-full bg-amber-200 text-[12px] font-sans text-amber-700 shrink-0">
                  i
                </div>
                <div className="flex flex-col gap-1">
                  <p className="font-sans text-[13px] leading-[18px] text-[#5b5b5b] break-words">{existingAccountNotice}</p>
                </div>
              </div>
            </div>
          ) : null}

          {emailApiError ? (
            <div className="w-full flex flex-col gap-2 rounded-sm border border-red-300 bg-red-50 px-4 py-3 mb-2">
              <div className="flex items-start gap-3">
                <div className="mt-[2px] flex h-[18px] min-w-[18px] w-[18px] items-center justify-center rounded-full bg-red-500 text-[12px] font-sans text-white shrink-0">
                  !
                </div>
                <div className="flex flex-col gap-1">
                  <p className="font-sans text-[13px] leading-[18px] text-red-600 break-words">{emailApiError}</p>
                </div>
              </div>
            </div>
          ) : null}

          {savedCartCount > 0 && normalizeEmail(form.getFieldValue('email')) === normalizeEmail(existingAccountEmail) ? (
            <div className="w-full flex flex-col gap-2 rounded-sm border border-blue-200 bg-blue-50 px-4 py-3 mb-2">
              <div className="flex items-start gap-2">
                <div className="mt-[2px] flex h-[18px] min-w-[18px] w-[18px] items-center justify-center rounded-full bg-blue-200 text-[12px] font-sans text-blue-700 shrink-0">
                  i
                </div>
                <div className="flex-1">
                  <p className="font-sans text-[13px] leading-[18px] text-[#5b5b5b]">
                    You have {savedCartCount} item(s) saved in your cart from a previous visit.
                  </p>
                  <div className="flex gap-3 mt-3">
                    <button
                      type="button"
                      onClick={handleAddSavedCartItems}
                      disabled={isMergingCart}
                      className="bg-secondary text-white border-0 h-[34px] px-4 text-[12px] uppercase tracking-[1.5px] font-sans disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isMergingCart ? 'Adding...' : 'Add to order'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSavedCartCount(0)}
                      className="bg-transparent text-[#5b5b5b] border border-[#ccc] h-[34px] px-4 text-[12px] uppercase tracking-[1.5px] font-sans"
                    >
                      No thanks
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {cartMergeSuccess ? (
            <div className="w-full rounded-sm border border-green-200 bg-green-50 px-4 py-2 mb-2">
              <p className="font-sans text-[13px] leading-[18px] text-green-700">{cartMergeSuccess}</p>
            </div>
          ) : null}

          {!isContactConfirmed ? (
            <>
              <Form.Item
                name="smsConsent"
                valuePropName="checked"
                getValueFromEvent={(v) => v}
                validateTrigger={['onSubmit', 'onChange']}
                rules={[
                  {
                    validator: (_, v) =>
                      v === true ? Promise.resolve() : Promise.reject(new Error('Please confirm the messaging terms to continue.')),
                  },
                ]}
                className="!mt-2"
              >
                <SmsConsentField />
              </Form.Item>

              <Form.Item className="!mb-0">
                <div className="w-full flex justify-end">
                  <Button
                    type="default"
                    htmlType="submit"
                    loading={loading}
                    disabled={Boolean(emailApiError) || loading}
                    className="!text-text_w !bg-secondary w-full md:!h-[35px] !h-[39px] flex flex-row items-center justify-center text-center uppercase tracking-[2.00px] sm:px-4 disabled:!cursor-not-allowed disabled:!bg-[#bcc2b0] disabled:!text-white"
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
            <p className="!font-castoro text-primary text-[28px] font-normal leading-tight sm:text-[24px]">Login</p>
            <p className="max-w-[420px] text-[13px] font-sans font-extralight leading-[1.5] text-[#757575] sm:text-[12px]">
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
            className="[&_.ant-form-item-label>label]:!h-auto [&_.ant-form-item-label>label]:!w-full"
          >
            <Form.Item
              name="email"
              validateTrigger="onChange"
              label={
                <span className="font-sans font-normal text-black">
                  Email <span className="text-red-500">*</span>
                </span>
              }
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
              <Input placeholder="Email" className="!h-11 !rounded-none !border-[#3b3b3b] !shadow-none" />
            </Form.Item>

            <Form.Item
              name="password"
              label={
                <div className="flex w-full flex-row flex-wrap items-center justify-between gap-x-2 gap-y-1 pr-0">
                  <span className="font-sans font-normal text-black">
                    Password <span className="text-red-500">*</span>
                  </span>
                  <Link
                    href="/forgot-password"
                    className="shrink-0 font-sans text-[13px] font-normal text-black underline underline-offset-2 sm:text-[12px]"
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
                className="!h-11 !rounded-none !border-[#3b3b3b] !shadow-none"
                iconRender={(visible) => (visible ? <LuEye /> : <LuEyeOff />)}
                visibilityToggle={{
                  visible: showPassword,
                  onVisibleChange: setShowPassword,
                }}
              />
            </Form.Item>

            {loginErrorMessage && (
              <Text as="p" size="textlg" className="-mt-1 mb-1 text-red-500 font-sans">
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
              <Button
                type="default"
                htmlType="submit"
                loading={authLoading}
                className="!h-12 !w-full !border-0 !bg-[#6f7a56] !text-text_w !font-sans uppercase tracking-[2px] hover:!bg-[#818D64] sm:!text-[12px]"
              >
                {authLoading ? 'Processing...' : 'Login & Continue'}
              </Button>
            </Form.Item>
          </Form>

          <button type="button" onClick={openGuestFromLogin} className="w-full border-0 bg-transparent p-0 text-center underline underline-offset-2">
            <span className="font-sans text-[15px] font-extralight text-[#757575] sm:text-[14px] md:text-[16px]">Continue as Guest</span>
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default SignIn;
