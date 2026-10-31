'use client';

import React, { useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LuChevronDown, LuX } from 'react-icons/lu';

import CurrencySelect from './CurrencySelect';
import { MenuGroupBlock, ServiceIcon } from './MegaPanel';
import { HeartIcon, SearchIcon, UserIcon } from '../components/HeaderIcons';

import type { MenuEntry } from './menuModel';

interface Props {
  open: boolean;
  onClose: () => void;
  menu: MenuEntry[];
  isSignedIn: boolean;
  firstName?: string;
  wishlistCount: number;
  currencyProps: React.ComponentProps<typeof CurrencySelect>;
}

/** Left drawer for ≤1024px: search, the same menu as the desktop panels as an accordion, and account links. */
export default function MobileDrawer({ open, onClose, menu, isSignedIn, firstName, wishlistCount, currencyProps }: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  // Menus the visitor has opened at least once. Their links/icons/tiles only mount from then on — the
  // drawer is hidden with CSS, not unmounted, so rendering every icon up front made the browser
  // download all of them on every page load, desktop included.
  const [openedMenus, setOpenedMenus] = useState<string[]>([]);
  const [query, setQuery] = useState('');

  return (
    <aside
      id="site-drawer"
      aria-label="Menu"
      aria-hidden={!open}
      {...((open ? {} : { inert: '' }) as Record<string, string>)}
      className={`fixed inset-y-0 left-0 z-[70] hidden w-[min(420px,92vw)] flex-col bg-paper pt-[env(safe-area-inset-top)] text-ink transition-transform duration-500 ease-luxe lg:flex ${
        open ? 'translate-x-0 shadow-2xl shadow-ink/20' : '-translate-x-full'
      }`}
    >
      <div className="flex h-[62px] flex-none items-center justify-between border-b border-line px-5">
        <Link href="/" onClick={onClose} aria-label="Pendyora home">
          <img src="/images/logo.png" alt="Dazzbliss" className="h-[22px] w-auto object-contain mix-blend-multiply" />
        </Link>
        <button type="button" onClick={onClose} aria-label="Close menu" className="grid h-10 w-10 place-items-center">
          <LuX className="h-5 w-5" strokeWidth={1.2} />
        </button>
      </div>

      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) {
            onClose();
            router.push(`/search?q=${encodeURIComponent(query.trim())}`);
          }
        }}
        className="mx-5 mb-1.5 mt-4 flex h-11 flex-none items-center gap-2.5 border border-line px-3.5"
      >
        <SearchIcon className="h-4 w-4 flex-none" />
        <label htmlFor="drawer-search" className="sr-only">
          Search
        </label>
        <input
          id="drawer-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search rings, diamonds, gifts"
          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[14px] outline-none focus:ring-0"
        />
      </form>

      <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-6 pt-1" data-lenis-prevent>
        {menu.map((entry) => {
          const isOpen = expanded === entry.id;
          return (
            <div key={entry.id} className="border-b border-line">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => {
                  setExpanded(isOpen ? null : entry.id);
                  setOpenedMenus((prev) => (prev.includes(entry.id) ? prev : [...prev, entry.id]));
                }}
                className="flex h-14 w-full items-center justify-between text-[12px] font-medium uppercase tracking-[0.16em]"
              >
                {entry.label}
                <LuChevronDown className={`h-4 w-4 transition-transform duration-300 ease-luxe ${isOpen ? 'rotate-180' : ''}`} strokeWidth={1.2} />
              </button>
              <div className={`grid transition-[grid-template-rows] duration-[400ms] ease-luxe ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                  {openedMenus.includes(entry.id) && (
                    <>
                      {entry.href && (
                        <Link
                          href={entry.href}
                          onClick={onClose}
                          className="mb-5 inline-block border-b border-ink pb-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-ink"
                        >
                          Shop all {entry.label}
                        </Link>
                      )}
                      {entry.columns.flat().map((group, i) => (
                        <div key={`${group.title}-${i}`} className="pb-[18px]">
                          <MenuGroupBlock group={group} onNavigate={onClose} />
                        </div>
                      ))}
                      {entry.tiles.length > 0 && (
                        <div className="grid auto-cols-[62%] grid-flow-col gap-2.5 overflow-x-auto pb-[18px] [scrollbar-width:none]">
                          {entry.tiles.map((tile, i) => (
                            <Link key={tile.href + i} href={tile.href} onClick={onClose}>
                              <img src={tile.image} alt="" loading="lazy" className="aspect-[4/5] w-full bg-stone object-cover" />
                              <b className="block pt-2 font-cormorant text-[17px] font-medium">{tile.title || entry.label}</b>
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid flex-none gap-3 border-t border-line px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-4 text-[13px] text-ink-soft">
        <Link href={isSignedIn ? '/profile' : '/login'} onClick={onClose} className="flex items-center gap-2.5 hover:text-ink">
          <UserIcon className="h-4 w-4 text-gilt" />
          {isSignedIn ? `Your account${firstName ? ` · ${firstName}` : ''}` : 'Sign in or create an account'}
        </Link>
        <Link href="/wishlist" onClick={onClose} className="flex items-center gap-2.5 hover:text-ink">
          <HeartIcon className="h-4 w-4 text-gilt" />
          Wishlist{wishlistCount > 0 ? ` (${wishlistCount})` : ''}
        </Link>
        <Link href="/virtual-appointment" onClick={onClose} className="flex items-center gap-2.5 hover:text-ink">
          <ServiceIcon icon="video" className="h-4 w-4 text-gilt" />
          Book a virtual appointment
        </Link>
        <div className="flex items-center justify-between gap-3">
          <span>Currency</span>
          <CurrencySelect {...currencyProps} tone="light" />
        </div>
      </div>
    </aside>
  );
}
