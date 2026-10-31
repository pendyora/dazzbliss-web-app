'use client';

import React, { useState, useRef } from 'react';

import { Form, Input, Button } from 'antd';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LuEye, LuEyeOff } from 'react-icons/lu';

import CloudflareTurnstile, { CloudflareTurnstileHandle } from '@/components/common/CloudflareTurnstile';
import { useHoneypot } from '@/hook/useHoneypot';
import { apiSignUp } from '@/services/authService';
import { useAppDispatch, useAppSelector } from '@/store';
import { forgotPassword, signUpUser } from '@/store/slices/auth/authSlice';
import { isDisposableDomain, isValidEmailFormat } from '@/utils/emailValidation';
import { trackCompleteRegistration } from '@/utils/metaPixel';

import { Text, CheckBox } from '../../components';

export default function CreateanaccountGroup2691() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchQuery = useSearchParams();
  const sign_up_mail = searchQuery?.get('email');
  // Set when the visitor was sent to sign in from a protected page (e.g. My Purchases opened from
  // an order email) and chose to create an account instead - take them there once signed up.
  const requestedCallbackUrl = searchQuery?.get('callbackUrl');
  const callbackUrl = requestedCallbackUrl?.startsWith('/') && !requestedCallbackUrl.startsWith('//') ? requestedCallbackUrl : null;
  const { user, loading } = useAppSelector((state) => state.auth.auth);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [isForgotSent, setIsForgotSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingGuestLink, setIsSendingGuestLink] = useState(false);
  const { HoneypotField, isHoneypotClean } = useHoneypot();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<CloudflareTurnstileHandle>(null);

  const handleSignUp = async (values: { email: string; password: string; first_name: string; last_name: string }) => {
    if (!isHoneypotClean()) {
      return;
    }
    setIsSubmitting(true);
    try {
      const res: any = await apiSignUp({ ...values, cloudflareTurnstileToken: turnstileToken });
      const userData = res?.data?.data;

      if (userData?.is_guest) {
        setIsGuest(true);
        setGuestEmail(values.email);
      } else {
        const result: any = await dispatch(signUpUser(userData));
        if (result.meta.requestStatus === 'fulfilled') {
          trackCompleteRegistration({ status: 'complete' });
          router.push(callbackUrl || '/');
        } else {
          turnstileRef.current?.reset();
          setTurnstileToken(null);
          setErrorMessage(result?.payload?.message || 'Sign-up failed');
          setTimeout(() => setErrorMessage(''), 5000);
          return;
        }
      }
    } catch (error: any) {
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      setErrorMessage(error?.response?.data?.message || 'Something went wrong');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendGuestPasswordLink = async () => {
    setIsSendingGuestLink(true);
    try {
      const result: any = await dispatch(forgotPassword({ email: guestEmail, cloudflareTurnstileToken: turnstileToken }));
      if (result?.meta.requestStatus === 'fulfilled') {
        setSuccessMessage(result?.payload?.message || 'We have sent you an email!');
        setIsForgotSent(true); // Disable button
      } else {
        turnstileRef.current?.reset();
        setTurnstileToken(null);
        setErrorMessage(result?.payload?.message || 'failed to send email');
        setTimeout(() => setErrorMessage(''), 5000);
        return;
      }
    } catch (error: any) {
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      setErrorMessage(error?.response?.data?.message || 'Something went wrong');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setIsSendingGuestLink(false);
    }
  };

  if (user !== null) {
    router?.push('/');
  }

  return (
    <div>
      <div className="flex flex-col items-center justify-center border-b border-solid border-[#3b3b3b] py-[76px] 2xl:py-16 xl:py-10 lg:py-8 md:py-5 sm:py-4">
        <div className="container-xs flex flex-col items-center gap-9 sm:gap-3 2xl:px-[160px] xl:px-28 lg:px-20 md:px-5 sm:px-3">
          <div className="flex flex-col items-center self-stretch px-14 md:px-5 sm:px-5 mb-8 lg:mb-0 sm:mb-3">
            <Text size="text5xl" as="p" className="uppercase text-center sm:!text-[18px]">
              Create an account
            </Text>
          </div>
          <div className="flex w-[550px] sm:w-full flex-col gap-10 sm:gap-3">
            <Form
              name="createAccount"
              onFinish={handleSignUp}
              layout="vertical"
              initialValues={{
                email: sign_up_mail ? decodeURIComponent(sign_up_mail) : '',
                password: '',
                first_name: '',
                last_name: '',
              }}
            >
              <Form.Item name="first_name" label="First Name" rules={[{ required: true, message: 'Please enter your first name!' }]}>
                <Input placeholder="Enter First Name" />
              </Form.Item>
              <Form.Item name="last_name" label="Last Name" rules={[{ required: true, message: 'Please enter your last name!' }]}>
                <Input placeholder="Enter Last Name" />
              </Form.Item>
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
                      if (isDisposableDomain(value)) {
                        return Promise.reject(new Error('Please enter a valid permanent email address'));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input placeholder="Enter Email" />
              </Form.Item>
              <HoneypotField />
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
              <div className="flex flex-col items-start gap-5 sm:gap-3 sm:mt-3">
                {/* <CheckBox
                  required
                  name="terms"
                  size="xs"
                  label="I ACCEPT THE TERMS & CONDITIONS"
                  id="terms"
                  className="gap-[22px] text-[18px] 2xl:text-[14px] !font-sans font-extralight tracking-[1.80px] text-[#757575] sm:!text-[12px]"
                /> */}
                <CheckBox
                  required
                  name="privacy"
                  size="xs"
                  label="By checking this box, you agree to receive automated personalized text messages (e.g. cart reminders, shipping updates, and tracking info) from ASHCLAIR. Consent is not a condition of any purchase. Reply HELP for help and STOP to cancel. View Terms & Privacy."
                  id="privacy"
                  className="gap-[22px] text-left 2xl:text-[14px] text-[18px] !font-sans font-extralight leading-[26px] tracking-[1.80px] text-[#757575] sm:!text-[12px]"
                />
              </div>
              {errorMessage && (
                <Text as="p" size="textlg" className="text-red-500 font-sans pl-2 my-2">
                  {errorMessage}
                </Text>
              )}
              {isGuest && !successMessage && (
                <Text as="p" size="textlg" className="text-red-500 font-sans pl-2 my-2">
                  *An account with this email already exists as a guest. Please set a password to convert it to a full account.
                </Text>
              )}
              {successMessage && (
                <Text as="p" size="textlg" className="text-green-500 font-sans pl-2 my-8 text-center">
                  {successMessage}
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
                {!isGuest ? (
                  <Button
                    type="default"
                    htmlType="submit"
                    loading={isSubmitting || loading}
                    disabled={isSubmitting || loading}
                    className={`${errorMessage ? 'mt-2' : 'mt-6'} w-full errorMessage self-stretch tracking-[2.00px] !text-text_w !bg-secondary sm:!text-[12px]`}
                  >
                    {isSubmitting || loading ? 'Processing...' : 'REGISTER NOW'}
                  </Button>
                ) : (
                  <Button
                    type="default"
                    onClick={handleSendGuestPasswordLink}
                    loading={isSendingGuestLink}
                    disabled={isForgotSent || isSendingGuestLink}
                    className={`mt-6 w-full self-stretch tracking-[2.00px] !text-text_w !bg-secondary sm:!text-[12px]`}
                  >
                    {isForgotSent ? 'Link Sent' : isSendingGuestLink ? 'Sending...' : 'Email Password Link'}
                  </Button>
                )}
              </Form.Item>

              <div className="flex justify-center items-center gap-2">
                <Text size="textlg" as="p" className="tracking-[2.00px] !text-[#757575] !font-sans !font-extralight text-center sm:!text-[12px]">
                  Already have an account?
                </Text>
                <Link href="/login">
                  <Text
                    size="textlg"
                    as="p"
                    className="tracking-[2.00px] !text-[#757575] !font-sans !font-extralight hover:underline text-center sm:!text-[12px]"
                  >
                    Login
                  </Text>
                </Link>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
