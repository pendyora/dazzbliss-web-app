'use client';

import React, { useEffect, useRef, useState } from 'react';

import { Form, Button, Checkbox } from 'antd';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LuArrowRight } from 'react-icons/lu';

import { FloatInput, FloatPassword, PasswordStrength } from '@/components/Auth/AuthFields';
import { AUTH_POSTERS } from '@/components/Auth/authPosters';
import AuthShell, { AuthTabs, StatusIcon } from '@/components/Auth/AuthShell';
import { AUTH } from '@/components/Auth/authUi';
import CloudflareTurnstile, { CloudflareTurnstileHandle } from '@/components/common/CloudflareTurnstile';
import { BRAND } from '@/config/brand';
import { useHoneypot } from '@/hook/useHoneypot';
import { apiSignUp } from '@/services/authService';
import { useAppDispatch, useAppSelector } from '@/store';
import { forgotPassword, signUpUser } from '@/store/slices/auth/authSlice';
import { isDisposableDomain, isValidEmailFormat } from '@/utils/emailValidation';
import { trackCompleteRegistration } from '@/utils/metaPixel';

const NEXT_STEPS = [
  { href: '/profile', title: 'Your account', text: 'Orders, addresses and details' },
  { href: '/wishlist', title: 'Your wishlist', text: 'Pieces you’ve saved, on every device' },
  { href: '/virtual-appointment', title: 'Book an appointment', text: 'Get sized or try pieces with a specialist' },
];

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
  const [form] = Form.useForm();
  const password = Form.useWatch('password', form);
  const [errorMessage, setErrorMessage] = useState('');
  const [isGuest, setIsGuest] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [isForgotSent, setIsForgotSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingGuestLink, setIsSendingGuestLink] = useState(false);
  const [joinedName, setJoinedName] = useState<string | null>(null);
  // Set once sign-up starts so the "already signed in" redirect doesn't skip the welcome screen.
  const joining = useRef(false);
  const { HoneypotField, isHoneypotClean } = useHoneypot();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<CloudflareTurnstileHandle>(null);

  const handleSignUp = async (values: { email: string; password: string; first_name: string; last_name: string }) => {
    if (!isHoneypotClean()) {
      return;
    }
    setIsSubmitting(true);
    joining.current = true;
    try {
      const { email, password: pass, first_name, last_name } = values;
      const res: any = await apiSignUp({ email, password: pass, first_name, last_name, cloudflareTurnstileToken: turnstileToken });
      const userData = res?.data?.data;

      if (userData?.is_guest) {
        joining.current = false;
        // The sign-up consumed the single-use Turnstile token; get a fresh one for the password-link request.
        turnstileRef.current?.reset();
        setTurnstileToken(null);
        setIsGuest(true);
        setGuestEmail(values.email);
      } else {
        const result: any = await dispatch(signUpUser(userData));
        if (result.meta.requestStatus === 'fulfilled') {
          trackCompleteRegistration({ status: 'complete' });
          setJoinedName(values.first_name);
          window.scrollTo(0, 0);
        } else {
          joining.current = false;
          turnstileRef.current?.reset();
          setTurnstileToken(null);
          setErrorMessage(result?.payload?.message || 'Sign-up failed');
          setTimeout(() => setErrorMessage(''), 5000);
          return;
        }
      }
    } catch (error: any) {
      joining.current = false;
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

  useEffect(() => {
    if (user !== null && !joining.current) {
      router.replace(callbackUrl || '/');
    }
  }, [user, callbackUrl, router]);

  if (joinedName !== null) {
    return (
      <AuthShell poster={AUTH_POSTERS.welcome}>
        <div className={AUTH.form}>
          <StatusIcon type="ok" />
          <p className={AUTH.kicker}>Account created</p>
          <h1 className={AUTH.title}>
            Welcome to the <em>house</em>
          </h1>
          <p className={AUTH.lede}>
            You&apos;re signed in{joinedName ? `, ${joinedName}` : ''}. Your details are saved, so checkout is quicker next time.
          </p>
          <Link href={callbackUrl || '/'} className={`${AUTH.secondaryBtn} !border-0 !bg-ink !text-paper hover:!bg-ink-hover`}>
            {callbackUrl ? 'Continue' : 'Start shopping'}
          </Link>
          <ul className="m-0 mt-8 list-none border-t border-line p-0">
            {NEXT_STEPS.map((step) => (
              <li key={step.href}>
                <Link
                  href={step.href}
                  className="flex items-center justify-between border-b border-line py-4 text-[13px] transition-[padding] duration-300 ease-luxe hover:pl-1.5"
                >
                  <div>
                    {step.title}
                    <span className="block text-[12px] text-ink-soft">{step.text}</span>
                  </div>
                  <LuArrowRight className="h-3.5 w-3.5 flex-none" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell poster={AUTH_POSTERS.register}>
      <div className={AUTH.form}>
        <AuthTabs active="register" callbackUrl={callbackUrl} />
        <p className={AUTH.kicker}>Join {BRAND.name}</p>
        <h1 className={AUTH.title}>
          Create your <em>account</em>
        </h1>
        <p className={AUTH.lede}>It takes less than a minute. Your welcome code arrives by email.</p>

        <Form
          form={form}
          name="createAccount"
          onFinish={handleSignUp}
          requiredMark={false}
          className={AUTH.formFix}
          initialValues={{
            email: sign_up_mail ? decodeURIComponent(sign_up_mail) : '',
            password: '',
            first_name: '',
            last_name: '',
          }}
        >
          <div className="grid grid-cols-2 gap-x-3.5 sm:grid-cols-1">
            <Form.Item name="first_name" rules={[{ required: true, message: 'Enter your first name' }]}>
              <FloatInput label="First name*" autoComplete="given-name" />
            </Form.Item>
            <Form.Item name="last_name" rules={[{ required: true, message: 'Enter your last name' }]}>
              <FloatInput label="Last name*" autoComplete="family-name" />
            </Form.Item>
          </div>
          <Form.Item
            name="email"
            validateTrigger="onBlur"
            rules={[
              { required: true, message: 'Enter your email address' },
              {
                validator: (_, value) => {
                  if (!value) {
                    return Promise.resolve();
                  }
                  if (!isValidEmailFormat(value)) {
                    return Promise.reject(new Error('Enter a valid email address'));
                  }
                  if (isDisposableDomain(value)) {
                    return Promise.reject(new Error('Please enter a valid permanent email address'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <FloatInput label="Email address*" type="email" autoComplete="email" />
          </Form.Item>
          <HoneypotField />
          <Form.Item
            name="password"
            className="!mb-3"
            rules={[
              { required: true, message: 'Enter a password' },
              { min: 8, message: 'Use at least 8 characters' },
            ]}
          >
            <FloatPassword label="Password*" autoComplete="new-password" />
          </Form.Item>
          <PasswordStrength value={password} />
          <Form.Item
            name="confirm_password"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Confirm your password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords don’t match'));
                },
              }),
            ]}
          >
            <FloatPassword label="Confirm password*" autoComplete="new-password" />
          </Form.Item>

          <Form.Item
            name="privacy"
            valuePropName="checked"
            className="!mb-7"
            rules={[{ validator: (_, checked) => (checked ? Promise.resolve() : Promise.reject(new Error('Please accept to continue'))) }]}
          >
            <Checkbox className="items-start text-[13px] leading-[1.5] [&>span:last-child]:text-ink-soft [&_.ant-checkbox]:mt-0.5 [&_.ant-checkbox]:self-start">
              I agree to receive automated personalised text messages (e.g. cart reminders, shipping updates and tracking info) from {BRAND.name}.
              Consent is not a condition of any purchase. Reply HELP for help and STOP to cancel. See our{' '}
              <Link href="/terms-and-conditions" className={AUTH.link}>
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy-policy" className={AUTH.link}>
                Privacy Policy
              </Link>
              .*
            </Checkbox>
          </Form.Item>

          {errorMessage && (
            <p role="alert" className={AUTH.error}>
              {errorMessage}
            </p>
          )}
          {isGuest && !successMessage && (
            <p role="alert" className={AUTH.error}>
              An account with this email already exists as a guest. Set a password to turn it into a full account.
            </p>
          )}
          {successMessage && <p className="m-0 mb-5 border-l-2 border-ok bg-ok/5 px-4 py-3 text-[13px] text-ok">{successMessage}</p>}

          <CloudflareTurnstile
            ref={turnstileRef}
            onVerify={setTurnstileToken}
            onExpire={() => setTurnstileToken(null)}
            onError={() => setTurnstileToken(null)}
            className="mb-4"
          />
          {!isGuest ? (
            <Button htmlType="submit" loading={isSubmitting || loading} disabled={isSubmitting || loading} className={AUTH.primaryBtn}>
              Create account
            </Button>
          ) : (
            <Button
              onClick={handleSendGuestPasswordLink}
              loading={isSendingGuestLink}
              disabled={isForgotSent || isSendingGuestLink}
              className={AUTH.primaryBtn}
            >
              {isForgotSent ? 'Link sent' : 'Email me a password link'}
            </Button>
          )}
          <p className="m-0 mt-3.5 text-[11.5px] text-ink-soft">*Required fields</p>
          <p className="m-0 mt-7 text-[13px] text-ink-soft">
            Already a member?{' '}
            <Link href={callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/login'} className={AUTH.link}>
              Sign in
            </Link>
          </p>
        </Form>
      </div>
    </AuthShell>
  );
}
