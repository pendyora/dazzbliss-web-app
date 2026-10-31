'use client';

import React from 'react';

import { ConfigProvider } from 'antd';
import Link from 'next/link';
import { LuCheck, LuChevronLeft, LuCircleHelp, LuClock3, LuLock, LuMail } from 'react-icons/lu';

import { BRAND } from '@/config/brand';

import AuthPoster, { AuthBanner } from './AuthPoster';
import { authTheme } from './authUi';

import type { Poster } from './authPosters';

interface Props {
  poster: Poster;
  /** Put the poster on the right (used by the password-help screens). */
  flip?: boolean;
  children: React.ReactNode;
}

/**
 * Layout for sign-in, sign-up and password screens: reduced header, a campaign poster on one half and the form on the
 * other, and a slim footer. The site header and footer are hidden on these routes (see AppProvider AUTH_ROUTES).
 */
export default function AuthShell({ poster, flip, children }: Props) {
  return (
    <ConfigProvider theme={authTheme}>
      <div className="flex min-h-screen flex-col bg-paper font-libre text-ink">
        <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-line px-[clamp(16px,3.2vw,56px)] py-5 sm:grid-cols-[auto_1fr_auto]">
          <Link href="/" className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-ink-soft hover:text-ink">
            <LuChevronLeft className="h-4 w-4" />
            <span className="sm:hidden">Continue shopping</span>
          </Link>
          <Link href="/" aria-label={`${BRAND.name} home`} className="justify-self-center">
            <img src={BRAND.logo.wordmark} alt={BRAND.name} className="h-[30px] w-auto object-contain mix-blend-multiply sm:h-[22px]" />
          </Link>
          <Link
            href="/contactpage"
            className="flex items-center gap-2 justify-self-end text-[11px] uppercase tracking-[0.14em] text-ink-soft hover:text-ink"
          >
            <span className="sm:hidden">Need help?</span>
            <LuCircleHelp className="h-4 w-4" />
          </Link>
        </header>

        <main className="flex-1">
          <AuthBanner banner={poster.banner} />
          <div
            className={`grid min-h-[calc(100vh-71px-49px)] lg:min-h-0 lg:grid-cols-1 ${flip ? 'grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]' : 'grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]'}`}
          >
            <div className={flip ? 'order-2' : ''}>
              <div className="sticky top-0 h-full max-h-screen min-h-[620px] lg:hidden [&>aside]:h-full">
                <AuthPoster poster={poster} />
              </div>
            </div>
            <div className="flex flex-col justify-center px-[clamp(16px,3.2vw,56px)] py-[clamp(40px,6vh,80px)] lg:pb-14 lg:pt-10">{children}</div>
          </div>
        </main>

        <footer className="flex flex-wrap justify-between gap-x-6 gap-y-3 border-t border-line px-[clamp(16px,3.2vw,56px)] py-4 text-[11px] tracking-[0.06em] text-ink-soft">
          <span className="flex items-center gap-2">
            <LuLock className="h-3.5 w-3.5" />
            Secure, encrypted connection
          </span>
          <nav className="flex gap-5">
            <Link href="/privacy-policy" className="hover:text-ink">
              Privacy
            </Link>
            <Link href="/terms-and-conditions" className="hover:text-ink">
              Terms
            </Link>
            <Link href="/contactpage" className="hover:text-ink">
              Client care
            </Link>
          </nav>
          <span>
            © {new Date().getFullYear()} {BRAND.name}
          </span>
        </footer>
      </div>
    </ConfigProvider>
  );
}

/** Sign in / Create account switch at the top of both forms. */
/** `callbackUrl` (a same-site path) is carried across both tabs so signing in or registering returns there. */
export function AuthTabs({ active, callbackUrl }: { active: 'signin' | 'register'; callbackUrl?: string | null }) {
  const withCallback = (path: string) => (callbackUrl ? `${path}?callbackUrl=${encodeURIComponent(callbackUrl)}` : path);
  const tab = (key: typeof active, href: string, label: string) => (
    <Link
      href={href}
      aria-current={active === key ? 'page' : undefined}
      className={`relative pb-3.5 text-[11.5px] uppercase tracking-[0.18em] ${
        active === key
          ? 'font-semibold text-ink after:absolute after:inset-x-0 after:-bottom-px after:h-[1.5px] after:bg-ink'
          : 'text-ink-soft hover:text-ink'
      }`}
    >
      {label}
    </Link>
  );
  return (
    <nav aria-label="Account" className="mb-10 flex gap-8 border-b border-line sm:gap-6">
      {tab('signin', withCallback('/login'), 'Sign in')}
      {tab('register', withCallback('/createanaccount'), 'Create account')}
    </nav>
  );
}

const STATUS_ICONS = {
  ok: { Icon: LuCheck, ring: 'border-ok text-ok' },
  mail: { Icon: LuMail, ring: 'border-line-strong text-gilt' },
  expired: { Icon: LuClock3, ring: 'border-danger text-danger' },
};

/** Round outlined icon that opens the confirmation / error screens. */
export function StatusIcon({ type }: { type: keyof typeof STATUS_ICONS }) {
  const { Icon, ring } = STATUS_ICONS[type];
  return (
    <div className={`mb-7 grid h-16 w-16 place-items-center rounded-full border ${ring}`}>
      <Icon className="h-[26px] w-[26px]" strokeWidth={1.3} />
    </div>
  );
}
