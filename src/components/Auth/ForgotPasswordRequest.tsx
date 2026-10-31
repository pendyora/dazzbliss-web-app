'use client';

import React, { useEffect, useRef, useState } from 'react';

import { Form, Button } from 'antd';
import Link from 'next/link';
import { LuArrowLeft } from 'react-icons/lu';

import CloudflareTurnstile, { CloudflareTurnstileHandle } from '@/components/common/CloudflareTurnstile';
import { useAppDispatch, useAppSelector } from '@/store';
import { forgotPassword } from '@/store/slices/auth/authSlice';
import { isValidEmailFormat } from '@/utils/emailValidation';

import { FloatInput } from './AuthFields';
import { AUTH_POSTERS } from './authPosters';
import AuthShell, { StatusIcon } from './AuthShell';
import { AUTH, maskEmail } from './authUi';

const RESEND_AFTER = 45;

interface Props {
  /** `expired` is shown when a reset link was rejected: same request form, different heading. */
  variant?: 'forgot' | 'expired';
}

/** Step one of password help: ask for the email, then confirm the link was sent (with a resend timer). */
export default function ForgotPasswordRequest({ variant = 'forgot' }: Props) {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.auth.auth);
  const [errorMessage, setErrorMessage] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [resent, setResent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<CloudflareTurnstileHandle>(null);

  useEffect(() => {
    if (countdown <= 0) {
      return undefined;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Turnstile tokens are single-use: the form's visible widget supplies one; the resend button passes
  // none, so the service layer falls back to its invisible widget.
  const sendLink = async (email: string, cloudflareTurnstileToken: string | null = null) => {
    const resetTurnstile = () => {
      turnstileRef.current?.reset();
      setTurnstileToken(null);
    };
    try {
      const result: any = await dispatch(forgotPassword({ email, cloudflareTurnstileToken }));
      resetTurnstile();
      if (result.meta.requestStatus === 'fulfilled') {
        return true;
      }
      setErrorMessage(result?.payload?.message || 'We couldn’t send the email. Please try again.');
    } catch (error: any) {
      resetTurnstile();
      setErrorMessage(error.message);
    }
    setTimeout(() => setErrorMessage(''), 5000);
    return false;
  };

  const handleSubmit = async ({ email }: { email: string }) => {
    if (await sendLink(email, turnstileToken)) {
      setSentTo(email);
      setCountdown(RESEND_AFTER);
      window.scrollTo(0, 0);
    }
  };

  const handleResend = async () => {
    if (await sendLink(sentTo)) {
      setResent(true);
      setCountdown(RESEND_AFTER);
    }
  };

  if (sentTo) {
    return (
      <AuthShell poster={AUTH_POSTERS.sent} flip>
        <div className={AUTH.form}>
          <StatusIcon type="mail" />
          <p className={AUTH.kicker}>Link sent</p>
          <h1 className={AUTH.title}>
            Check your <em>inbox</em>
          </h1>
          <p className={AUTH.lede}>
            We&apos;ve sent a link to <strong>{maskEmail(sentTo)}</strong> so you can set a new password. Open it on any device to continue.
          </p>
          {errorMessage && (
            <p role="alert" className={AUTH.error}>
              {errorMessage}
            </p>
          )}
          <Link href="/login" className={`${AUTH.secondaryBtn} !border-0 !bg-ink !text-paper hover:!bg-ink-hover`}>
            Back to sign in
          </Link>
          <div className="mt-[22px] flex justify-center gap-1.5 text-[13px] text-ink-soft" aria-live="polite">
            {resent && countdown > RESEND_AFTER - 3 ? (
              'Sent again.'
            ) : (
              <>
                Didn&apos;t get it?
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={countdown > 0 || loading}
                  className="text-ink underline underline-offset-[3px] disabled:cursor-default disabled:text-ink-soft disabled:no-underline"
                >
                  {countdown > 0 ? `Resend in 0:${String(countdown).padStart(2, '0')}` : 'Resend email'}
                </button>
              </>
            )}
          </div>
          <div className={AUTH.tips}>
            <h2 className={AUTH.tipsTitle}>Not in your inbox?</h2>
            <ul className="m-0 grid gap-1.5 pl-4">
              <li>Check your spam or promotions folder.</li>
              <li>
                Make sure{' '}
                <button type="button" onClick={() => setSentTo('')} className={AUTH.link}>
                  this is the right email
                </button>
                .
              </li>
              <li>
                Still stuck? Our{' '}
                <Link href="/contactpage" className={AUTH.link}>
                  client care team
                </Link>{' '}
                can help.
              </li>
            </ul>
          </div>
        </div>
      </AuthShell>
    );
  }

  const expired = variant === 'expired';
  return (
    <AuthShell poster={expired ? AUTH_POSTERS.expired : AUTH_POSTERS.forgot} flip>
      <div className={AUTH.form}>
        {expired ? (
          <StatusIcon type="expired" />
        ) : (
          <Link href="/login" className="mb-9 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-ink-soft hover:text-ink">
            <LuArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        )}
        <p className={AUTH.kicker}>{expired ? 'Link expired' : 'Password help'}</p>
        <h1 className={AUTH.title}>
          {expired ? (
            <>
              This link has <em>expired</em>
            </>
          ) : (
            <>
              Forgot your <em>password?</em>
            </>
          )}
        </h1>
        <p className={AUTH.lede}>
          {expired
            ? 'Reset links only work once and for a limited time, to keep your account safe. Send yourself a new one below.'
            : 'Enter the email you use for Pendyora and we’ll send you a secure link to set a new password.'}
        </p>

        <Form name="forgotPassword" onFinish={handleSubmit} requiredMark={false} initialValues={{ email: '' }} className={AUTH.formFix}>
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
          <Button htmlType="submit" loading={loading} disabled={loading} className={AUTH.primaryBtn}>
            {expired ? 'Send a new link' : 'Send reset link'}
          </Button>
        </Form>
        <p className="m-0 mt-7 text-[13px] text-ink-soft">
          Remembered it?{' '}
          <Link href="/login" className={AUTH.link}>
            Sign in
          </Link>
        </p>
        {!expired && (
          <div className={AUTH.tips}>
            <h2 className={AUTH.tipsTitle}>Can&apos;t get in?</h2>
            <p className="m-0">
              Our{' '}
              <Link href="/contactpage" className={AUTH.link}>
                client care team
              </Link>{' '}
              is happy to help.
            </p>
          </div>
        )}
      </div>
    </AuthShell>
  );
}
