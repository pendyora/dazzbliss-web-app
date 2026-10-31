'use client';

import React, { useEffect } from 'react';

import { ConfigProvider } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LuHeart, LuHouse, LuLoader, LuLogOut, LuMapPin, LuShoppingBag, LuUser, LuVideo } from 'react-icons/lu';

import { checkoutTheme } from '@/app/checkout/checkoutTheme';
import useRequireAuth from '@/hook/useRequireAuth';
import { useAppDispatch, useAppSelector } from '@/store';
import { logoutUser } from '@/store/slices/auth/authSlice';
import { clearCartProducts, clearWishlistProducts } from '@/store/slices/Cart/cartSlice';
import { fetchOrderList } from '@/store/slices/Order/orderSlice';

// Account frame (design-mockups/account): greeting band, left menu (tabs below 1024px) and one panel at a time.

export type AccountSection = 'overview' | 'orders' | 'wishlist' | 'addresses' | 'details';

export const SHELL = 'mx-auto w-full max-w-[1440px] px-[clamp(16px,3.2vw,48px)]';

export const wishlistCountOf = (groups: any[] = []) => groups.reduce((n: number, g: any) => n + (g?.jewelry?.length ?? 0), 0);

export function PanelHead({ title, sub, action }: { title: string; sub?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-baseline justify-between gap-4">
      <div>
        <h2 className="m-0 font-cormorant text-[32px] font-medium leading-[1.05]">{title}</h2>
        {sub && <p className="m-0 mt-1 text-[14px] text-ink-soft">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Box({
  title,
  action,
  dark,
  className = '',
  children,
}: {
  title: string;
  action?: React.ReactNode;
  dark?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`grid content-start gap-3 border p-[22px] ${dark ? 'border-navy bg-navy text-noir-on' : 'border-line'} ${className}`}>
      <h3
        className={`m-0 flex justify-between text-[10.5px] font-semibold uppercase tracking-[0.16em] ${dark ? 'text-teal-soft' : 'text-ink-faint'}`}
      >
        {title}
        {action}
      </h3>
      {children}
    </section>
  );
}

export const boxLink = 'text-[13px] font-medium normal-case tracking-normal text-teal underline underline-offset-[3px] hover:text-navy';

export default function AccountShell({ active, children }: { active: AccountSection; children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth.auth);
  const { orderList } = useAppSelector((state) => state.order);
  const { wishlistProducts } = useAppSelector((state) => state.cart);

  // Signed out (or guest) visitors are sent to sign in with the requested page as callbackUrl, so the
  // "Track your order" email link lands back on My Purchases. Waits for redux-persist rehydration first.
  const { isAuthResolved, isAuthenticated } = useRequireAuth();

  useEffect(() => {
    if (user && (!orderList || orderList.length === 0)) {
      dispatch(fetchOrderList());
    }
    // Load once per visit; the slice keeps the list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const signOut = () => {
    router.push('/');
    dispatch(clearCartProducts());
    dispatch(clearWishlistProducts());
    dispatch(logoutUser());
  };

  if (!isAuthResolved || !isAuthenticated || !user) {
    return (
      <div className="grid min-h-[60vh] place-items-center bg-paper">
        <LuLoader className="h-8 w-8 animate-spin text-ink-soft" />
      </div>
    );
  }

  const MENU: { key: AccountSection; href: string; label: string; Icon: typeof LuHouse; count?: number }[] = [
    { key: 'overview', href: '/profile', label: 'Overview', Icon: LuHouse },
    { key: 'orders', href: '/profile/purchases', label: 'Orders', Icon: LuShoppingBag, count: orderList?.length || undefined },
    { key: 'wishlist', href: '/wishlist', label: 'Wishlist', Icon: LuHeart, count: wishlistCountOf(wishlistProducts) || undefined },
    { key: 'addresses', href: '/profile?section=addresses', label: 'Addresses', Icon: LuMapPin },
    { key: 'details', href: '/profile?section=details', label: 'Details & password', Icon: LuUser },
  ];

  return (
    <ConfigProvider theme={checkoutTheme}>
      <div className="bg-paper font-libre text-[14px] leading-[1.55] text-ink antialiased">
        <section className="border-b border-line bg-haze">
          <div className={`${SHELL} flex flex-wrap items-end justify-between gap-5 py-[clamp(28px,3.5vw,44px)]`}>
            <div>
              <nav aria-label="Breadcrumb" className="mb-2.5 flex gap-2 text-[12px] text-ink-soft">
                <Link href="/" className="text-ink-soft hover:text-ink">
                  Home
                </Link>
                <span aria-hidden className="text-line-strong">
                  /
                </span>
                <span aria-current="page">Your account</span>
              </nav>
              <h1 className="m-0 font-cormorant text-[clamp(36px,3.8vw,52px)] font-normal leading-none">
                Hello, <em className="italic">{user?.first_name || 'there'}</em>
              </h1>
              <p className="m-0 mt-2 text-ink-soft">{user?.email}</p>
            </div>
            <Link
              href="/virtual-appointment"
              className="inline-flex h-[46px] items-center gap-2.5 border border-ink px-5 text-[12px] font-semibold uppercase tracking-[0.12em] text-ink hover:bg-ink hover:text-paper"
            >
              <LuVideo className="h-4 w-4" strokeWidth={1.3} />
              Book a jeweler
            </Link>
          </div>
        </section>

        <div
          className={`${SHELL} grid grid-cols-[240px_minmax(0,1fr)] items-start gap-[clamp(32px,5vw,72px)] pb-20 pt-[clamp(28px,3.5vw,44px)] lg:grid-cols-1 lg:gap-6 lg:pt-0`}
        >
          <nav
            aria-label="Account"
            className="sticky top-[calc(var(--header-height,108px)+24px)] grid gap-0.5 lg:top-[var(--header-height,108px)] lg:z-10 lg:-mx-[clamp(16px,3.2vw,48px)] lg:flex lg:overflow-x-auto lg:border-b lg:border-line lg:bg-paper lg:px-[clamp(16px,3.2vw,48px)] lg:[scrollbar-width:none]"
          >
            {MENU.map(({ key, href, label, Icon, count }) => {
              const on = key === active;
              return (
                <Link
                  key={key}
                  href={href}
                  aria-current={on ? 'page' : undefined}
                  className={`flex items-center gap-3 border-l-2 px-3.5 py-3 text-[14px] lg:flex-none lg:border-b-2 lg:border-l-0 lg:px-3 lg:py-3.5 ${
                    on
                      ? 'border-ink bg-haze font-semibold text-ink lg:bg-transparent'
                      : 'border-transparent text-ink-soft hover:bg-haze hover:text-ink lg:hover:bg-transparent'
                  }`}
                >
                  <Icon className="h-[18px] w-[18px] lg:hidden" strokeWidth={1.3} />
                  {label}
                  {count ? <span className="ml-auto text-[12px] font-normal text-ink-faint lg:ml-1">{count}</span> : null}
                </Link>
              );
            })}
            <hr className="my-2.5 border-0 border-t border-line lg:hidden" />
            <button
              type="button"
              onClick={signOut}
              className="flex items-center gap-3 border-l-2 border-transparent px-3.5 py-3 text-left text-[14px] text-ink-soft hover:bg-haze hover:text-ink lg:flex-none lg:border-b-2 lg:border-l-0 lg:px-3 lg:py-3.5 lg:hover:bg-transparent"
            >
              <LuLogOut className="h-[18px] w-[18px] lg:hidden" strokeWidth={1.3} />
              Sign out
            </button>
          </nav>

          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </ConfigProvider>
  );
}
