'use client';

import React, { useRef, useState } from 'react';

import { Form, Button } from 'antd';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { FloatPassword, PasswordStrength } from '@/components/Auth/AuthFields';
import { AUTH_POSTERS } from '@/components/Auth/authPosters';
import AuthShell, { StatusIcon } from '@/components/Auth/AuthShell';
import { AUTH } from '@/components/Auth/authUi';
import ForgotPasswordRequest from '@/components/Auth/ForgotPasswordRequest';
import CloudflareTurnstile, { CloudflareTurnstileHandle } from '@/components/common/CloudflareTurnstile';
import { useAppDispatch, useAppSelector } from '@/store';
import { resetPassword } from '@/store/slices/auth/authSlice';
import { encrypt } from '@/utils/enc-decy';

// A rejected reset is treated as an expired/used link when the API says so; anything else is shown inline.
const isExpiredLinkError = (payload: any) => [401, 403, 410].includes(payload?.status) || /expire|invalid|token/i.test(payload?.message ?? '');

/** Step two of password help, opened from the emailed link (/forgot-password?token=…). Without a token it asks for the email. */
export default function NewPassword() {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const { loading } = useAppSelector((state) => state.auth.auth);
  const [form] = Form.useForm();
  const password = Form.useWatch('password', form);
  const [status, setStatus] = useState<'form' | 'updated' | 'expired'>('form');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<CloudflareTurnstileHandle>(null);

  const token = searchParams?.get('token');

  const handleReset = async ({ password: newPassword }: { password: string }) => {
    if (!token || submitting) {
      return;
    }
    setSubmitting(true);
    try {
      const result: any = await dispatch(
        resetPassword({ password: newPassword, authHeader: encrypt({ token }, true), cloudflareTurnstileToken: turnstileToken }),
      );
      if (result?.payload?.status !== 200) {
        // Turnstile tokens are single-use: get a fresh one for the retry.
        turnstileRef.current?.reset();
        setTurnstileToken(null);
      }
      if (result?.payload?.status === 200) {
        setStatus('updated');
        window.scrollTo(0, 0);
      } else if (isExpiredLinkError(result?.payload)) {
        setStatus('expired');
      } else {
        setErrorMessage(result?.payload?.message || 'We couldn’t update your password. Please try again.');
        setTimeout(() => setErrorMessage(''), 5000);
      }
    } catch (error: any) {
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      setErrorMessage(error.message);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return <ForgotPasswordRequest />;
  }

  if (status === 'expired') {
    return <ForgotPasswordRequest variant="expired" />;
  }

  if (status === 'updated') {
    return (
      <AuthShell poster={AUTH_POSTERS.updated} flip>
        <div className={AUTH.form}>
          <StatusIcon type="ok" />
          <p className={AUTH.kicker}>All set</p>
          <h1 className={AUTH.title}>
            Password <em>updated</em>
          </h1>
          <p className={AUTH.lede}>Your new password is saved. Sign in with it to see your orders, wishlist and member previews.</p>
          <Link href="/login" className={`${AUTH.secondaryBtn} !border-0 !bg-ink !text-paper hover:!bg-ink-hover`}>
            Sign in
          </Link>
          <Link href="/" className={`${AUTH.secondaryBtn} mt-3`}>
            Continue shopping
          </Link>
          <div className={AUTH.tips}>
            <h2 className={AUTH.tipsTitle}>Didn&apos;t make this change?</h2>
            <p className="m-0">
              Contact{' '}
              <Link href="/contactpage" className={AUTH.link}>
                client care
              </Link>{' '}
              straight away and we&apos;ll help secure your account.
            </p>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell poster={AUTH_POSTERS.reset} flip>
      <div className={AUTH.form}>
        <p className={AUTH.kicker}>Password help</p>
        <h1 className={AUTH.title}>
          Set a new <em>password</em>
        </h1>
        <p className={AUTH.lede}>Choose a password you haven&apos;t used here before.</p>

        <Form
          form={form}
          name="resetPassword"
          onFinish={handleReset}
          requiredMark={false}
          initialValues={{ password: '', confirm_password: '' }}
          className={AUTH.formFix}
        >
          <Form.Item
            name="password"
            className="!mb-3"
            rules={[
              { required: true, message: 'Enter a new password' },
              { min: 8, message: 'Use at least 8 characters' },
            ]}
          >
            <FloatPassword label="New password*" autoComplete="new-password" />
          </Form.Item>
          <PasswordStrength value={password} />
          <Form.Item
            name="confirm_password"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Confirm your new password' },
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
            <FloatPassword label="Confirm new password*" autoComplete="new-password" />
          </Form.Item>
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
          <Button htmlType="submit" loading={loading || submitting} className={`${AUTH.primaryBtn} mt-2`}>
            Update password
          </Button>
        </Form>
        <p className="m-0 mt-7 text-[13px] text-ink-soft">
          Link not working?{' '}
          <Link href="/forgotpassword" className={AUTH.link}>
            Request a new one
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
