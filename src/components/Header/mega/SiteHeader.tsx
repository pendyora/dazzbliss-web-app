'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useLenis } from 'lenis/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LuMenu } from 'react-icons/lu';

import { BRAND } from '@/config/brand';
import { useAppSelector } from '@/store';

import CurrencySelect from './CurrencySelect';
import MegaPanel from './MegaPanel';
import { buildMenu } from './menuModel';
import MobileDrawer from './MobileDrawer';
import SearchPanel from './SearchPanel';
import { BagIcon, HeartIcon, SearchIcon, UserIcon } from '../components/HeaderIcons';

const OPEN_DELAY = 140;
const CLOSE_DELAY = 220;
const SEARCH = 'search';

interface Props {
  headerMetaData: any;
  currencyProps: React.ComponentProps<typeof CurrencySelect>;
  search: {
    value: string;
    results: any[];
    loading: boolean;
    onSearch: (value: string) => void;
    onPick: (href: string) => void;
    onReset: () => void;
  };
}

const Count = ({ n }: { n: number }) =>
  n > 0 ? (
    <span className="absolute right-[3px] top-1 grid h-4 min-w-4 place-items-center rounded-full bg-teal px-1 text-[9.5px] font-semibold tabular-nums text-paper">
      {n}
    </span>
  ) : null;

/**
 * Main bar (logo · centred menu · tools) that opens into a full-width mega panel, plus the search panel and the
 * mobile drawer. Design reference: design-mockups/header/index.html.
 */
export default function SiteHeader({ headerMetaData, currencyProps, search }: Props) {
  const pathname = usePathname();
  const lenis = useLenis();
  const { user } = useAppSelector((state) => state.auth.auth);
  const { cartProducts, wishlistProducts } = useAppSelector((state) => state?.cart);
  const { data: masterData } = useAppSelector((state) => state.master);

  const menu = useMemo(() => buildMenu(headerMetaData, masterData), [headerMetaData, masterData]);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [shownKey, setShownKey] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const openTimer = useRef<ReturnType<typeof setTimeout>>();
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();
  const panelRef = useRef<HTMLDivElement>(null);

  const isSignedIn = user !== null && !user?.is_guest;
  const wishlistCount = wishlistProducts?.reduce((total: number, category: any) => total + (category?.jewelry?.length ?? 0), 0) ?? 0;
  const bagCount = cartProducts?.length ?? 0;

  const open = useCallback((key: string) => {
    clearTimeout(closeTimer.current);
    setOpenKey(key);
    setShownKey(key);
  }, []);

  const openKeyRef = useRef(openKey);
  openKeyRef.current = openKey;

  const close = useCallback(
    (returnFocus = false) => {
      clearTimeout(openTimer.current);
      const current = openKeyRef.current;
      if (!current) {
        return;
      }
      setOpenKey(null);
      if (current === SEARCH) {
        search.onReset();
      }
      if (returnFocus) {
        document.querySelector<HTMLElement>(`[data-menu-key="${current}"]`)?.focus();
      }
    },
    [search],
  );

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  // Close everything on navigation.
  useEffect(() => {
    setOpenKey(null);
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close(true);
        setDrawerOpen(false);
      }
    };
    const onResize = () => {
      if (window.innerWidth > 1024) {
        setDrawerOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [close]);

  // Freeze the page (Lenis smooth scroll included) while the drawer is open.
  useEffect(() => {
    if (drawerOpen) {
      lenis?.stop();
      document.body.style.overflow = 'hidden';
    } else {
      lenis?.start();
      document.body.style.overflow = '';
    }
  }, [drawerOpen, lenis]);

  const panelOpen = openKey !== null;
  const activeEntry = menu.find((m) => m.id === shownKey);
  // On the homepage the bar floats over the hero until the page scrolls or a panel opens.
  const solid = pathname !== '/' || scrolled || panelOpen;

  return (
    <div
      className="relative"
      onMouseLeave={() => {
        clearTimeout(openTimer.current);
        if (openKey && openKey !== SEARCH) {
          closeTimer.current = setTimeout(() => close(), CLOSE_DELAY);
        }
      }}
      onMouseEnter={() => clearTimeout(closeTimer.current)}
    >
      {/* Scrim under the header, over the page. */}
      <div
        aria-hidden
        onClick={() => {
          close();
          closeDrawer();
        }}
        className={`fixed inset-0 -z-10 bg-noir/30 transition-opacity duration-300 ease-luxe ${panelOpen || drawerOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}
      />

      <div
        className={`border-b transition-[background-color,border-color,box-shadow] duration-300 ${
          solid ? 'border-line bg-paper' : 'border-transparent bg-transparent'
        } ${scrolled && !panelOpen ? 'shadow-[0_8px_30px_rgba(23,20,15,0.05)]' : ''}`}
      >
        <div
          className={`mx-auto grid max-w-[1440px] grid-cols-[auto_1fr_auto] items-center gap-8 px-[clamp(16px,3.2vw,56px)] transition-[height] duration-[350ms] ease-luxe lg:h-[62px] lg:grid-cols-[1fr_auto_1fr] lg:gap-3 ${
            scrolled ? 'h-16' : 'h-[72px]'
          }`}
        >
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              aria-controls="site-drawer"
              aria-expanded={drawerOpen}
              className="-ml-2.5 hidden h-10 w-10 place-items-center lg:grid"
            >
              <LuMenu className="h-5 w-5" strokeWidth={1.2} />
            </button>
            <Link href="/" aria-label={`${BRAND.name} home`} className="lg:hidden">
              <img src={BRAND.logo.wordmark} alt={BRAND.name} className="h-[34px] w-auto object-contain mix-blend-multiply" />
            </Link>
          </div>

          <nav aria-label="Main" className="flex h-full justify-center gap-[clamp(14px,2.2vw,36px)] lg:hidden">
            {menu.map((entry) => {
              const expanded = openKey === entry.id;
              const current = !!entry.href && entry.href !== '/' && pathname?.startsWith(entry.href.split('?')[0]);
              const className = `relative flex h-full items-center whitespace-nowrap text-[12px] font-medium uppercase tracking-[0.14em] transition-colors after:absolute after:inset-x-0 after:-bottom-px after:h-[1.5px] after:origin-left after:bg-ink after:transition-transform after:duration-[350ms] after:ease-luxe ${
                expanded || current ? 'text-ink after:scale-x-100' : 'text-ink after:scale-x-0 hover:after:scale-x-100'
              }`;
              const handlers = {
                'data-menu-key': entry.id,
                'aria-expanded': expanded,
                'aria-controls': 'mega-panel',
                onMouseEnter: () => {
                  clearTimeout(openTimer.current);
                  openTimer.current = setTimeout(() => open(entry.id), openKey ? 0 : OPEN_DELAY);
                },
                onMouseLeave: () => clearTimeout(openTimer.current),
                onKeyDown: (e: React.KeyboardEvent) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    open(entry.id);
                    setTimeout(() => panelRef.current?.querySelector<HTMLElement>('a, button')?.focus(), 30);
                  }
                },
              };
              // Touch screens have no hover, and a top-level label with a link would navigate straight away so its
              // panel could never be seen. On hover-less devices the first tap opens the panel and a second tap on
              // the same label follows the link. Mouse users are unaffected.
              const onTopLinkClick = (e: React.MouseEvent) => {
                const hasPanel = entry.columns.length > 0 || entry.tiles.length > 0;
                if (hasPanel && window.matchMedia('(hover: none)').matches && openKey !== entry.id) {
                  e.preventDefault();
                  clearTimeout(openTimer.current);
                  open(entry.id);
                }
              };
              return entry.href ? (
                <Link
                  key={entry.id}
                  href={entry.href}
                  className={className}
                  aria-current={current ? 'page' : undefined}
                  onClick={onTopLinkClick}
                  {...handlers}
                >
                  {entry.label}
                </Link>
              ) : (
                <button key={entry.id} type="button" className={className} onClick={() => (expanded ? close() : open(entry.id))} {...handlers}>
                  {entry.label}
                </button>
              );
            })}
          </nav>

          <Link href="/" aria-label={`${BRAND.name} home`} className="hidden justify-self-center lg:block">
            <img src={BRAND.logo.wordmark} alt={BRAND.name} className="h-[26px] w-auto object-contain mix-blend-multiply sm:h-[22px]" />
          </Link>

          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              data-menu-key={SEARCH}
              aria-expanded={openKey === SEARCH}
              aria-controls="mega-panel"
              aria-label="Search"
              onClick={() => (openKey === SEARCH ? close() : open(SEARCH))}
              className={`mr-2 inline-flex h-10 min-w-[200px] items-center gap-2.5 border px-3.5 text-[13px] transition-colors xls:min-w-0 lg:mr-0 lg:w-10 lg:justify-center lg:border-0 lg:px-0 ${
                openKey === SEARCH ? 'border-ink text-ink' : 'border-line-strong text-ink-soft hover:border-ink hover:text-ink'
              }`}
            >
              <SearchIcon className="h-4 w-4 lg:h-5 lg:w-5" />
              <span className="xls:hidden">Search</span>
            </button>
            <Link
              href={isSignedIn ? '/profile' : '/login'}
              aria-label={isSignedIn ? 'Your account' : 'Sign in'}
              className="relative grid h-10 w-10 place-items-center lg:hidden"
            >
              <UserIcon className="h-5 w-5" />
            </Link>
            <Link href="/wishlist" aria-label={`Wishlist, ${wishlistCount} pieces`} className="relative grid h-10 w-10 place-items-center lg:hidden">
              <HeartIcon className="h-5 w-5" />
              <Count n={wishlistCount} />
            </Link>
            <Link href="/cart" aria-label={`Bag, ${bagCount} pieces`} className="relative grid h-10 w-10 place-items-center">
              <BagIcon className="h-5 w-5" />
              <Count n={bagCount} />
            </Link>
          </div>
        </div>
      </div>

      <div
        id="mega-panel"
        ref={panelRef}
        role="region"
        aria-label={shownKey === SEARCH ? 'Search' : 'Menu'}
        data-lenis-prevent
        onTransitionEnd={(e) => e.target === e.currentTarget && !panelOpen && setShownKey(null)}
        className={`absolute inset-x-0 top-full max-h-[calc(100vh-var(--header-height,120px))] overflow-y-auto border-b border-line bg-paper text-ink shadow-[0_30px_60px_-30px_rgba(23,20,15,0.18)] transition-[opacity,transform,visibility] duration-300 ease-luxe ${
          panelOpen ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1.5 opacity-0'
        } ${shownKey !== SEARCH ? 'lg:hidden' : ''}`}
      >
        {shownKey === SEARCH && (
          <SearchPanel
            value={search.value}
            results={search.results}
            loading={search.loading}
            onSearch={search.onSearch}
            onPick={(href) => {
              close();
              search.onPick(href);
            }}
            onClose={() => close(true)}
          />
        )}
        {activeEntry && <MegaPanel key={activeEntry.id} entry={activeEntry} onNavigate={() => close()} />}
      </div>

      <MobileDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        menu={menu}
        isSignedIn={isSignedIn}
        firstName={user?.first_name}
        wishlistCount={wishlistCount}
        currencyProps={currencyProps}
      />
    </div>
  );
}
