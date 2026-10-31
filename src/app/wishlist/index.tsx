'use client';

import React, { useEffect, useState } from 'react';

import Link from 'next/link';
import { LuHeart } from 'react-icons/lu';

import AccountShell, { PanelHead, SHELL, wishlistCountOf } from '@/components/Account/AccountShell';
import ProductProfile from '@/components/ProductProfile';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchWishListProducts, setWishlistProducts } from '@/store/slices/Cart/cartSlice';

const label = (s: string) =>
  (s ?? '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());

/** Saved pieces grouped by type (as the API returns them), with a filter row and the PLP product card. */
function WishlistGrid({ columns }: { columns: 3 | 4 }) {
  const { wishlistProducts } = useAppSelector((state) => state.cart);
  const groups: any[] = wishlistProducts ?? [];
  const [filter, setFilter] = useState('');
  const total = wishlistCountOf(groups);

  if (total === 0) {
    return (
      <div className="grid justify-items-start gap-3 border border-line p-7">
        <LuHeart className="h-7 w-7 text-teal" strokeWidth={1.3} />
        <b className="font-cormorant text-[26px] font-medium">Your wishlist is empty</b>
        <p className="m-0 max-w-[48ch] text-ink-soft">Tap the heart on any piece to save it here, then come back to compare or share.</p>
        <Link
          href="/all"
          className="mt-1 inline-flex h-12 items-center bg-ink px-7 text-[12px] font-semibold uppercase tracking-[0.14em] text-paper hover:text-paper"
        >
          Browse jewelry
        </Link>
      </div>
    );
  }

  const shown = filter ? groups.filter((g) => g?.name === filter) : groups;
  const items = shown.flatMap((g) => g?.jewelry ?? []);

  return (
    <>
      {groups.length > 1 && (
        <div role="toolbar" aria-label="Filter saved pieces" className="mb-6 flex flex-wrap gap-2">
          {[{ name: '', count: total }, ...groups.map((g) => ({ name: g?.name, count: g?.jewelry?.length ?? 0 }))].map((g) => (
            <button
              key={g.name || 'all'}
              type="button"
              aria-pressed={filter === g.name}
              onClick={() => setFilter(g.name)}
              className={`h-9 border px-3.5 text-[13px] ${filter === g.name ? 'border-ink bg-ink text-paper' : 'border-line-strong text-ink hover:border-ink'}`}
            >
              {g.name ? label(g.name) : 'All'} <span className={filter === g.name ? 'text-paper/70' : 'text-ink-faint'}>{g.count}</span>
            </button>
          ))}
        </div>
      )}
      <div className={`grid gap-x-4 gap-y-10 md:grid-cols-2 md:gap-x-2.5 md:gap-y-7 ${columns === 4 ? 'grid-cols-4 lg:grid-cols-3' : 'grid-cols-3'}`}>
        {items.map((p: any) => {
          // One card per saved variation: the same piece can be wishlisted in several variations.
          const variationKey = `${p?.jewelry_id}-${p?.sku_master_id ?? p?.slug}`;
          return <ProductProfile key={variationKey} {...p} isStatic={false} layout="plp" />;
        })}
      </div>
    </>
  );
}

export default function WishlistPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth.auth);
  const { wishlistProducts } = useAppSelector((state) => state.cart);
  const signedIn = !!user && !user?.is_guest;

  useEffect(() => {
    if (signedIn) {
      dispatch(fetchWishListProducts('all'));
    } else {
      const stored = localStorage.getItem('wishListItems');
      const list = stored ? JSON.parse(stored) : [];
      if (list.length > 0) {
        dispatch(setWishlistProducts(list));
      }
    }
  }, [signedIn, dispatch]);

  const count = wishlistCountOf(wishlistProducts);

  if (signedIn) {
    return (
      <AccountShell active="wishlist">
        <PanelHead title="Wishlist" sub={`${count} saved ${count === 1 ? 'piece' : 'pieces'}`} />
        <WishlistGrid columns={3} />
      </AccountShell>
    );
  }

  return (
    <div className="bg-paper font-libre text-[14px] leading-[1.55] text-ink antialiased">
      <section className="border-b border-line bg-haze">
        <div className={`${SHELL} py-[clamp(28px,3.5vw,44px)]`}>
          <nav aria-label="Breadcrumb" className="mb-2.5 flex gap-2 text-[12px] text-ink-soft">
            <Link href="/" className="text-ink-soft hover:text-ink">
              Home
            </Link>
            <span aria-hidden className="text-line-strong">
              /
            </span>
            <span aria-current="page">Wishlist</span>
          </nav>
          <h1 className="m-0 font-cormorant text-[clamp(36px,3.8vw,52px)] font-normal leading-none">
            Your <em className="italic">wishlist</em>
          </h1>
          <p className="m-0 mt-2 text-ink-soft">
            {count} saved {count === 1 ? 'piece' : 'pieces'}
          </p>
        </div>
      </section>
      <div className={`${SHELL} pb-20 pt-7`}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-mist px-5 py-4 text-[14px]">
          <span className="flex items-center gap-3">
            <LuHeart className="h-5 w-5 text-navy" strokeWidth={1.3} />
            Your wishlist is saved on this device only. Sign in to keep it everywhere.
          </span>
          <Link
            href="/login?callbackUrl=/wishlist"
            className="inline-flex h-[42px] items-center bg-ink px-[18px] text-[12px] font-semibold uppercase tracking-[0.12em] text-paper hover:text-paper"
          >
            Sign in
          </Link>
        </div>
        <WishlistGrid columns={4} />
      </div>
    </div>
  );
}
