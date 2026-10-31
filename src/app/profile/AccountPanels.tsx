'use client';
import React, { useState } from 'react';

import Link from 'next/link';
import { LuPlus } from 'react-icons/lu';

import { Box, PanelHead, boxLink, wishlistCountOf } from '@/components/Account/AccountShell';
import { OrderTracker, StatusPill, orderDate } from '@/components/Account/orderBits';
import { useAppSelector } from '@/store';

import ChangePasswordForm from './ChangePasswordForm';
import ProfileForm from './ProfileForm';
import BillingAddress from '../checkout/BillingAddress';
import DeliveryAddress from '../checkout/DeliveryAddress';

const FALLBACK = '/images/no_images.svg';

function AddressText({ a }: { a: any }) {
  return (
    <p className="m-0 text-[14px] leading-[1.7] text-ink-soft">
      <b className="font-medium text-ink">
        {a?.first_name} {a?.last_name}
      </b>
      <br />
      {a?.address1}
      {a?.address2 ? `, ${a.address2}` : ''}
      <br />
      {/* Free-text city (city_text) is used when the city is not in the master list. */}
      {[a?.cityDetails?.name ?? a?.city_text, a?.postal_code].filter(Boolean).join(' - ')}
      {a?.mobile && (
        <>
          <br />
          {a.mobile}
        </>
      )}
    </p>
  );
}

export function Overview() {
  const { user } = useAppSelector((state) => state.auth.auth);
  const { orderList } = useAppSelector((state) => state.order);
  const { wishlistProducts } = useAppSelector((state) => state.cart);
  const latest: any = orderList?.[0];
  const saved: any[] = (wishlistProducts ?? []).flatMap((g: any) => g?.jewelry ?? []);
  const address = user?.delivery_address?.id ? user.delivery_address : user?.billing_address?.id ? user.billing_address : null;

  return (
    <>
      <PanelHead title="Overview" sub="Your orders, saved pieces and details in one place." />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-1">
        <Box
          title="Latest order"
          className="col-span-2 md:col-span-1"
          action={
            latest ? (
              <Link href={`/profile/purchases?order=${latest.order_id}`} className={boxLink}>
                View order
              </Link>
            ) : undefined
          }
        >
          {latest ? (
            <>
              <div className="flex flex-wrap items-center gap-4">
                <img
                  src={latest?.orderDetails?.[0]?.skuOrderItems?.carat_images?.[0] || FALLBACK}
                  alt=""
                  className="h-20 w-16 bg-stone object-contain mix-blend-multiply"
                />
                <div>
                  <b className="font-medium">{latest?.orderDetails?.[0]?.jewelryOrderItems?.fullTitle}</b>
                  <br />
                  <span className="text-[13px] text-ink-soft">
                    Order {latest.order_id} · placed {orderDate(latest)}
                  </span>
                </div>
                <span className="ml-auto">
                  <StatusPill status={Number(latest.order_status ?? 0)} />
                </span>
              </div>
              <OrderTracker status={Number(latest.order_status ?? 0)} placedAt={latest.created_at} />
            </>
          ) : (
            <p className="m-0 text-ink-soft">
              No orders yet.{' '}
              <Link href="/all" className={boxLink}>
                Start shopping
              </Link>
            </p>
          )}
        </Box>

        <Box
          title="Saved pieces"
          action={
            <Link href="/wishlist" className={boxLink}>
              {saved.length ? `See all ${wishlistCountOf(wishlistProducts)}` : 'Browse'}
            </Link>
          }
        >
          {saved.length ? (
            <div className="grid grid-cols-4 gap-2">
              {saved.slice(0, 4).map((p: any, i: number) => (
                <img
                  key={i}
                  src={p?.productImage || FALLBACK}
                  alt={p?.productName ?? ''}
                  className="aspect-square w-full bg-stone object-contain mix-blend-multiply"
                />
              ))}
            </div>
          ) : (
            <p className="m-0 text-[14px] text-ink-soft">Tap the heart on any piece to save it here.</p>
          )}
        </Box>

        <Box
          title="Default address"
          action={
            <Link href="/profile?section=addresses" className={boxLink}>
              Manage
            </Link>
          }
        >
          {address ? <AddressText a={address} /> : <p className="m-0 text-[14px] text-ink-soft">Add an address to check out faster.</p>}
        </Box>

        <Box title="Need a hand?" dark>
          <b className="font-cormorant text-[24px] font-medium leading-[1.15] text-paper">Talk to a jeweler about sizing, stones or your order.</b>
          <Link
            href="/virtual-appointment"
            className="inline-flex h-11 items-center justify-self-start bg-noir-on px-[18px] text-[12px] font-semibold uppercase tracking-[0.12em] text-navy hover:text-navy"
          >
            Book a video call
          </Link>
        </Box>

        <Box
          title="Your details"
          action={
            <Link href="/profile?section=details" className={boxLink}>
              Edit
            </Link>
          }
        >
          <p className="m-0 text-[14px] leading-[1.7] text-ink-soft">
            <b className="font-medium text-ink">
              {user?.first_name} {user?.last_name}
            </b>
            <br />
            {user?.email}
            {user?.phone && (
              <>
                <br />
                {user.phone}
              </>
            )}
          </p>
          {!user?.dob && !user?.doa && (
            <p className="m-0 text-[13px] text-ink-soft">
              Add your birthday and anniversary so we can remind you before the date.{' '}
              <Link href="/profile?section=details" className={boxLink}>
                Add dates
              </Link>
            </p>
          )}
        </Box>
      </div>
    </>
  );
}

export function Addresses() {
  const { user } = useAppSelector((state) => state.auth.auth);
  const [editing, setEditing] = useState<'delivery' | 'billing' | null>(null);
  const delivery = user?.delivery_address?.id ? user.delivery_address : null;
  const billing = user?.billing_address?.id ? user.billing_address : null;

  if (editing === 'delivery') {
    return (
      <>
        <PanelHead title={delivery ? 'Edit delivery address' : 'Add a delivery address'} sub="Used to fill in checkout for you." />
        <div className="max-w-[720px]">
          <DeliveryAddress formState setIsEditDeliveryAddress={(v: any) => setEditing(v ? 'delivery' : null)} />
        </div>
      </>
    );
  }
  if (editing === 'billing') {
    return (
      <>
        <PanelHead title={billing ? 'Edit billing address' : 'Add a billing address'} sub="Used to fill in checkout for you." />
        <div className="max-w-[720px]">
          <BillingAddress formState setBillingAddress={(v: any) => setEditing(v ? 'billing' : null)} />
        </div>
      </>
    );
  }

  const card = (kind: 'delivery' | 'billing', a: any) =>
    a ? (
      <Box
        key={kind}
        title={kind === 'delivery' ? 'Delivery' : 'Billing'}
        action={
          <button type="button" onClick={() => setEditing(kind)} className={boxLink}>
            Edit
          </button>
        }
      >
        <AddressText a={a} />
        {a?.email && <span className="text-[13px] text-ink-faint">{a.email}</span>}
      </Box>
    ) : (
      <button
        key={kind}
        type="button"
        onClick={() => setEditing(kind)}
        className="grid min-h-[180px] place-items-center content-center gap-2 border-[1.5px] border-dashed border-line-strong text-[14px] text-ink-soft hover:border-ink hover:text-ink"
      >
        <LuPlus className="h-6 w-6" strokeWidth={1.3} />
        Add a {kind} address
      </button>
    );

  return (
    <>
      <PanelHead title="Addresses" sub="Used to fill in checkout for you." />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-1">
        {card('delivery', delivery)}
        {card('billing', billing)}
      </div>
    </>
  );
}

export function Details() {
  return (
    <>
      <PanelHead title="Details & password" sub="Keep your details up to date for orders and appointments." />
      <section className="mb-9 border-b border-line pb-9">
        <h3 className="m-0 mb-1.5 font-cormorant text-[24px] font-medium">Personal details</h3>
        <p className="m-0 mb-[18px] text-[13.5px] text-ink-soft">Your email is also your sign-in, so it can&apos;t be changed here.</p>
        <div className="max-w-[720px]">
          <ProfileForm />
        </div>
      </section>
      <section>
        <h3 className="m-0 mb-1.5 font-cormorant text-[24px] font-medium">Change password</h3>
        <p className="m-0 mb-[18px] text-[13.5px] text-ink-soft">Use at least 8 characters.</p>
        <div className="max-w-[720px]">
          <ChangePasswordForm />
        </div>
      </section>
    </>
  );
}
